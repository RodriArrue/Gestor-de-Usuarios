const UserService = require('../services/UserService');

class UserController {
    /**
     * Crear un nuevo usuario
     * POST /api/users
     */
    async create(req, res, next) {
        try {
            const { username, email, password, firstName, lastName, roleIds } = req.body;

            const user = await UserService.createUser({
                username,
                email,
                password,
                firstName,
                lastName,
                roleIds,
            });

            res.status(201).json({
                success: true,
                message: 'Usuario creado correctamente',
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener todos los usuarios
     * GET /api/users
     */
    async getAll(req, res, next) {
        try {
            const { page, limit, includeInactive, search } = req.query;

            const result = await UserService.getAllUsers({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                includeInactive: includeInactive === 'true',
                search,
            });

            res.json({
                success: true,
                data: result.users,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener usuario por ID
     * GET /api/users/:id
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await UserService.getUserById(id);

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar usuario
     * PUT /api/users/:id
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { username, email, firstName, lastName } = req.body;

            const user = await UserService.updateUser(id, {
                username,
                email,
                firstName,
                lastName,
            });

            res.json({
                success: true,
                message: 'Usuario actualizado correctamente',
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Desactivar usuario (soft delete)
     * PATCH /api/users/:id/deactivate
     */
    async deactivate(req, res, next) {
        try {
            const { id } = req.params;
            const currentUserId = req.user.id;

            const result = await UserService.deactivateUser(id, currentUserId);

            res.json({
                success: true,
                message: result.message,
                data: {
                    id: result.id,
                    username: result.username,
                    email: result.email,
                    isActive: result.isActive,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reactivar usuario
     * PATCH /api/users/:id/reactivate
     */
    async reactivate(req, res, next) {
        try {
            const { id } = req.params;

            const result = await UserService.reactivateUser(id);

            res.json({
                success: true,
                message: result.message,
                data: {
                    id: result.id,
                    username: result.username,
                    email: result.email,
                    isActive: result.isActive,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
