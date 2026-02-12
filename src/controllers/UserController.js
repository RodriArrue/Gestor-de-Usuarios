const UserService = require('../services/UserService');

class UserController {
    /**
     * Crear un nuevo usuario
     * POST /api/users
     */
    async create(req, res) {
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
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Obtener todos los usuarios
     * GET /api/users
     */
    async getAll(req, res) {
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
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Obtener usuario por ID
     * GET /api/users/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;

            const user = await UserService.getUserById(id);

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            const statusCode = error.message === 'Usuario no encontrado' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Desactivar usuario (soft delete)
     * PATCH /api/users/:id/deactivate
     */
    async deactivate(req, res) {
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
            const statusCode = error.message === 'Usuario no encontrado' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Reactivar usuario
     * PATCH /api/users/:id/reactivate
     */
    async reactivate(req, res) {
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
            const statusCode = error.message === 'Usuario no encontrado' ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new UserController();
