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

/**
 * Middleware para verificar permisos específicos
 * @param {string} resource - Recurso a verificar (ej: 'users', 'roles')
 * @param {string} action - Acción requerida (ej: 'create', 'read', 'update', 'delete', 'manage')
 */
const requirePermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const { User, Role, Permission } = require('../models');

            // Obtener usuario con roles y permisos
            const user = await User.findByPk(req.user.id, {
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
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }

            if (!user.roles || user.roles.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado: sin roles asignados',
                });
            }

            // Recopilar todos los permisos del usuario
            const userPermissions = [];
            for (const role of user.roles) {
                if (role.permissions) {
                    for (const permission of role.permissions) {
                        userPermissions.push({
                            resource: permission.resource,
                            action: permission.action,
                        });
                    }
                }
            }

            // Verificar si tiene el permiso requerido
            // 'manage' es un permiso especial que incluye todas las acciones
            const hasPermission = userPermissions.some(
                (p) =>
                    (p.resource === resource && (p.action === action || p.action === 'manage')) ||
                    (p.resource === '*' && p.action === 'manage') // Super admin
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado: permiso '${action}' sobre '${resource}' requerido`,
                });
            }

            // Agregar permisos al request para uso posterior
            req.userPermissions = userPermissions;

            next();
        } catch (error) {
            console.error('Error al verificar permisos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
            });
        }
    };
};

module.exports = {
    authMiddleware,
    requireRoles,
    requirePermission,
};
