const { Permission, Role } = require('../models');

class PermissionService {
    /**
     * Obtener todos los permisos
     */
    async getAllPermissions() {
        return await Permission.findAll({
            order: [['resource', 'ASC'], ['action', 'ASC']],
        });
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
            throw new Error('Permiso no encontrado');
        }

        return permission;
    }

    /**
     * Crear un nuevo permiso
     */
    async createPermission({ name, description, resource, action }) {
        // Verificar que no exista un permiso con el mismo nombre
        const existingByName = await Permission.findOne({ where: { name } });
        if (existingByName) {
            throw new Error('Ya existe un permiso con ese nombre');
        }

        // Verificar que no exista un permiso con la misma combinación resource/action
        const existingByResourceAction = await Permission.findOne({
            where: { resource, action },
        });
        if (existingByResourceAction) {
            throw new Error(`Ya existe un permiso para ${action} sobre ${resource}`);
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

        // Verificar nombre único si se está cambiando
        if (name && name !== permission.name) {
            const existingByName = await Permission.findOne({ where: { name } });
            if (existingByName) {
                throw new Error('Ya existe un permiso con ese nombre');
            }
        }

        // Verificar combinación resource/action si se está cambiando
        const newResource = resource ?? permission.resource;
        const newAction = action ?? permission.action;

        if (newResource !== permission.resource || newAction !== permission.action) {
            const existingByResourceAction = await Permission.findOne({
                where: { resource: newResource, action: newAction },
            });
            if (existingByResourceAction && existingByResourceAction.id !== id) {
                throw new Error(`Ya existe un permiso para ${newAction} sobre ${newResource}`);
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
            throw new Error('Rol no encontrado');
        }

        const permission = await Permission.findByPk(permissionId);
        if (!permission) {
            throw new Error('Permiso no encontrado');
        }

        // Verificar si ya tiene el permiso asignado
        const hasPermission = await role.hasPermission(permission);
        if (hasPermission) {
            throw new Error('El rol ya tiene este permiso asignado');
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
            throw new Error('Rol no encontrado');
        }

        const permission = await Permission.findByPk(permissionId);
        if (!permission) {
            throw new Error('Permiso no encontrado');
        }

        // Verificar si tiene el permiso asignado
        const hasPermission = await role.hasPermission(permission);
        if (!hasPermission) {
            throw new Error('El rol no tiene este permiso asignado');
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
            throw new Error('Rol no encontrado');
        }

        return role.permissions;
    }

    /**
     * Asignar múltiples permisos a un rol
     */
    async assignMultiplePermissionsToRole(roleId, permissionIds) {
        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new Error('Rol no encontrado');
        }

        const permissions = await Permission.findAll({
            where: { id: permissionIds },
        });

        if (permissions.length !== permissionIds.length) {
            throw new Error('Algunos permisos no fueron encontrados');
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
