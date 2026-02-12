const { Role, User, Permission } = require('../models');
const { NotFoundError, ConflictError } = require('../errors/AppError');

class RoleService {
    /**
     * Obtener todos los roles
     */
    async getAllRoles() {
        return await Role.findAll({
            include: [{
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
            order: [['name', 'ASC']],
        });
    }

    /**
     * Obtener rol por ID
     */
    async getRoleById(id) {
        const role = await Role.findByPk(id, {
            include: [{
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
        });

        if (!role) {
            throw new NotFoundError('Rol no encontrado');
        }

        return role;
    }

    /**
     * Crear un nuevo rol
     */
    async createRole({ name, description, isActive = true }) {
        const existingRole = await Role.findOne({ where: { name } });

        if (existingRole) {
            throw new ConflictError('Ya existe un rol con ese nombre');
        }

        return await Role.create({
            name,
            description,
            isActive,
        });
    }

    /**
     * Actualizar un rol
     */
    async updateRole(id, { name, description, isActive }) {
        const role = await this.getRoleById(id);

        if (name && name !== role.name) {
            const existingRole = await Role.findOne({ where: { name } });
            if (existingRole) {
                throw new ConflictError('Ya existe un rol con ese nombre');
            }
        }

        await role.update({
            name: name ?? role.name,
            description: description ?? role.description,
            isActive: isActive ?? role.isActive,
        });

        return role;
    }

    /**
     * Eliminar un rol
     */
    async deleteRole(id) {
        const role = await this.getRoleById(id);
        await role.destroy();
        return { message: 'Rol eliminado exitosamente' };
    }

    /**
     * Asignar rol a un usuario
     */
    async assignRoleToUser(userId, roleId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new NotFoundError('Rol no encontrado');
        }

        const hasRole = await user.hasRole(role);
        if (hasRole) {
            throw new ConflictError('El usuario ya tiene este rol asignado');
        }

        await user.addRole(role);

        return {
            message: 'Rol asignado exitosamente',
            user: {
                id: user.id,
                username: user.username,
            },
            role: {
                id: role.id,
                name: role.name,
            },
        };
    }

    /**
     * Remover rol de un usuario
     */
    async removeRoleFromUser(userId, roleId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new NotFoundError('Rol no encontrado');
        }

        const hasRole = await user.hasRole(role);
        if (!hasRole) {
            throw new ConflictError('El usuario no tiene este rol asignado');
        }

        await user.removeRole(role);

        return {
            message: 'Rol removido exitosamente',
            user: {
                id: user.id,
                username: user.username,
            },
            role: {
                id: role.id,
                name: role.name,
            },
        };
    }

    /**
     * Obtener roles de un usuario
     */
    async getUserRoles(userId) {
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] },
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                }],
            }],
        });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        return user.roles;
    }

    /**
     * Obtener usuarios con un rol específico
     */
    async getRoleUsers(roleId) {
        const role = await Role.findByPk(roleId, {
            include: [{
                model: User,
                as: 'users',
                through: { attributes: [] },
                attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive'],
            }],
        });

        if (!role) {
            throw new NotFoundError('Rol no encontrado');
        }

        return role.users;
    }
}

module.exports = new RoleService();
