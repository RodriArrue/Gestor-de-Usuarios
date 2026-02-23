const AuthService = require('../services/AuthService');

class AuthController {
    /**
     * POST /api/auth/register
     * Registrar un nuevo usuario
     */
    async register(req, res, next) {
        try {
            const { username, email, password, firstName, lastName } = req.body;

            const result = await AuthService.register({
                username,
                email,
                password,
                firstName,
                lastName,
            });

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/login
     * Iniciar sesión
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await AuthService.login({ email, password });

            res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/me
     * Obtener perfil del usuario autenticado
     */
    async getProfile(req, res, next) {
        try {
            const user = await AuthService.getUserById(req.user.id);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/auth/change-password
     * Cambiar contraseña del usuario autenticado
     */
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            const result = await AuthService.changePassword(req.user.id, {
                currentPassword,
                newPassword,
            });

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
