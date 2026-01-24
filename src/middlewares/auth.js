const AuthService = require('../services/AuthService');

/**
 * Middleware para verificar JWT y proteger rutas
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso no proporcionado',
            });
        }

        const token = authHeader.split(' ')[1];

        // Verificar token
        const decoded = AuthService.verifyToken(token);

        // Agregar usuario al request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
        });
    }
};

/**
 * Middleware para verificar roles
 * @param  {...string} allowedRoles - Roles permitidos para acceder a la ruta
 */
const requireRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const user = await AuthService.getUserById(req.user.id);

            if (!user.roles || user.roles.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado: sin roles asignados',
                });
            }

            const userRoles = user.roles.map(role => role.name);
            const hasPermission = allowedRoles.some(role => userRoles.includes(role));

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado: rol insuficiente',
                });
            }

            // Agregar roles al request para uso posterior
            req.userRoles = userRoles;

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al verificar roles',
            });
        }
    };
};

module.exports = {
    authMiddleware,
    requireRoles,
};
