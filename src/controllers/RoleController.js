const RoleService = require('../services/RoleService');

class RoleController {
    /**
     * GET /api/roles
     * Obtener todos los roles
     */
    async getAll(req, res, next) {
        try {
            const roles = await RoleService.getAllRoles();

            res.status(200).json({
                success: true,
                data: roles,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/roles/:id
     * Obtener rol por ID
     */
    async getById(req, res, next) {
        try {
            const role = await RoleService.getRoleById(req.params.id);

            res.status(200).json({
                success: true,
                data: role,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/roles
     * Crear un nuevo rol
     */
    async create(req, res, next) {
        try {
            const { name, description, isActive } = req.body;

            const role = await RoleService.createRole({
                name,
                description,
                isActive,
            });

            res.status(201).json({
                success: true,
                message: 'Rol creado exitosamente',
                data: role,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/roles/:id
     * Actualizar un rol
     */
    async update(req, res, next) {
        try {
            const { name, description, isActive } = req.body;

            const role = await RoleService.updateRole(req.params.id, {
                name,
                description,
                isActive,
            });

            res.status(200).json({
                success: true,
                message: 'Rol actualizado exitosamente',
                data: role,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/roles/:id
     * Eliminar un rol
     */
    async delete(req, res, next) {
        try {
            const result = await RoleService.deleteRole(req.params.id);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/roles/assign
     * Asignar rol a un usuario
     */
    async assignToUser(req, res, next) {
        try {
            const { userId, roleId } = req.body;

            const result = await RoleService.assignRoleToUser(userId, roleId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/roles/remove
     * Remover rol de un usuario
     */
    async removeFromUser(req, res, next) {
        try {
            const { userId, roleId } = req.body;

            const result = await RoleService.removeRoleFromUser(userId, roleId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/roles/user/:userId
     * Obtener roles de un usuario
     */
    async getUserRoles(req, res, next) {
        try {
            const roles = await RoleService.getUserRoles(req.params.userId);

            res.status(200).json({
                success: true,
                data: roles,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/roles/:roleId/users
     * Obtener usuarios con un rol específico
     */
    async getRoleUsers(req, res, next) {
        try {
            const users = await RoleService.getRoleUsers(req.params.roleId);

            res.status(200).json({
                success: true,
                data: users,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoleController();
