const AuthService = require('../services/AuthService');

class AuthController {
    /**
     * POST /api/auth/register
     * Registrar un nuevo usuario
     */
    async register(req, res) {
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
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * POST /api/auth/login
     * Iniciar sesión
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const result = await AuthService.login({ email, password });

            res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: result,
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * GET /api/auth/me
     * Obtener perfil del usuario autenticado
     */
    async getProfile(req, res) {
        try {
            const user = await AuthService.getUserById(req.user.id);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new AuthController();
