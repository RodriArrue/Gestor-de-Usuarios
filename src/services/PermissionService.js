const { Permission, Role } = require('../models');
const { NotFoundError, ConflictError, BadRequestError } = require('../errors/AppError');

class PermissionService {
    /**
     * Obtener todos los permisos con paginación
     */
    async getAllPermissions({ page = 1, limit = 10, search } = {}) {
        const offset = (page - 1) * limit;

        const whereClause = {};

        if (search) {
            const { Op } = require('sequelize');
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { resource: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows } = await Permission.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['resource', 'ASC'], ['action', 'ASC']],
        });

        return {
            permissions: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * Obtener permiso por ID
     */
    async getPermissionById(id) {
        const permission = await Permission.findByPk(id, {
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] },
            }],
        });

        if (!permission) {
            throw new NotFoundError('Permiso no encontrado');
        }

        return permission;
    }

    /**
     * Crear un nuevo permiso
     */
    async createPermission({ name, description, resource, action }) {
        const existingByName = await Permission.findOne({ where: { name } });
        if (existingByName) {
            throw new ConflictError('Ya existe un permiso con ese nombre');
        }

        const existingByResourceAction = await Permission.findOne({
            where: { resource, action },
        });
        if (existingByResourceAction) {
            throw new ConflictError(`Ya existe un permiso para ${action} sobre ${resource}`);
        }

        return await Permission.create({
            name,
            description,
            resource,
            action,
        });
    }

    /**
     * Actualizar un permiso
     */
    async updatePermission(id, { name, description, resource, action }) {
        const permission = await this.getPermissionById(id);

        if (name && name !== permission.name) {
            const existingByName = await Permission.findOne({ where: { name } });
            if (existingByName) {
                throw new ConflictError('Ya existe un permiso con ese nombre');
            }
        }

        const newResource = resource ?? permission.resource;
        const newAction = action ?? permission.action;

        if (newResource !== permission.resource || newAction !== permission.action) {
            const existingByResourceAction = await Permission.findOne({
                where: { resource: newResource, action: newAction },
            });
            if (existingByResourceAction && existingByResourceAction.id !== id) {
                throw new ConflictError(`Ya existe un permiso para ${newAction} sobre ${newResource}`);
            }
        }

        await permission.update({
            name: name ?? permission.name,
            description: description ?? permission.description,
            resource: newResource,
            action: newAction,
        });

        return permission;
    }

    /**
     * Eliminar un permiso
     */
    async deletePermission(id) {
        const permission = await this.getPermissionById(id);
        await permission.destroy();
        return { message: 'Permiso eliminado exitosamente' };
    }

    /**
     * Asignar permiso a un rol
     */
    async assignPermissionToRole(roleId, permissionId) {
        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new NotFoundError('Rol no encontrado');
        }

        const permission = await Permission.findByPk(permissionId);
        if (!permission) {
            throw new NotFoundError('Permiso no encontrado');
        }

        const hasPermission = await role.hasPermission(permission);
        if (hasPermission) {
            throw new ConflictError('El rol ya tiene este permiso asignado');
        }

        await role.addPermission(permission);

        return {
            message: 'Permiso asignado exitosamente',
            role: {
                id: role.id,
                name: role.name,
            },
            permission: {
                id: permission.id,
                name: permission.name,
                resource: permission.resource,
                action: permission.action,
            },
        };
    }

    /**
     * Remover permiso de un rol
     */
    async removePermissionFromRole(roleId, permissionId) {
        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new NotFoundError('Rol no encontrado');
        }

        const permission = await Permission.findByPk(permissionId);
        if (!permission) {
            throw new NotFoundError('Permiso no encontrado');
        }

        const hasPermission = await role.hasPermission(permission);
        if (!hasPermission) {
            throw new ConflictError('El rol no tiene este permiso asignado');
        }

        await role.removePermission(permission);

        return {
            message: 'Permiso removido exitosamente',
            role: {
                id: role.id,
                name: role.name,
            },
            permission: {
                id: permission.id,
                name: permission.name,
            },
        };
    }

    /**
     * Obtener permisos de un rol
     */
    async getRolePermissions(roleId) {
        const role = await Role.findByPk(roleId, {
            include: [{
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
        });

        if (!role) {
            throw new NotFoundError('Rol no encontrado');
        }

        return role.permissions;
    }

    /**
     * Asignar múltiples permisos a un rol
     */
    async assignMultiplePermissionsToRole(roleId, permissionIds) {
        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new NotFoundError('Rol no encontrado');
        }

        const permissions = await Permission.findAll({
            where: { id: permissionIds },
        });

        if (permissions.length !== permissionIds.length) {
            throw new BadRequestError('Algunos permisos no fueron encontrados');
        }

        await role.setPermissions(permissions);

        return {
            message: 'Permisos asignados exitosamente',
            role: {
                id: role.id,
                name: role.name,
            },
            permissions: permissions.map((p) => ({
                id: p.id,
                name: p.name,
                resource: p.resource,
                action: p.action,
            })),
        };
    }
}

module.exports = new PermissionService();
