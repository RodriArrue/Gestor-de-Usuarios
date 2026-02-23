const AuthService = require('../services/AuthService');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

/**
 * Middleware para verificar JWT y proteger rutas
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Token de acceso no proporcionado');
        }

        const token = authHeader.split(' ')[1];

        const decoded = AuthService.verifyToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        // Si ya es un AppError (ej: UnauthorizedError de verifyToken), pasarlo
        // Si es otro error (JWT malformed, etc.), convertirlo
        if (error.isOperational) {
            return next(error);
        }
        return next(new UnauthorizedError('Token inválido o expirado'));
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
                throw new ForbiddenError('Acceso denegado: sin roles asignados');
            }

            const userRoles = user.roles.map(role => role.name);
            const hasPermission = allowedRoles.some(role => userRoles.includes(role));

            if (!hasPermission) {
                throw new ForbiddenError('Acceso denegado: rol insuficiente');
            }

            req.userRoles = userRoles;

            next();
        } catch (error) {
            next(error);
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
                throw new UnauthorizedError('Usuario no encontrado');
            }

            if (!user.roles || user.roles.length === 0) {
                throw new ForbiddenError('Acceso denegado: sin roles asignados');
            }

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

            const hasPermission = userPermissions.some(
                (p) =>
                    (p.resource === resource && (p.action === action || p.action === 'manage')) ||
                    (p.resource === '*' && p.action === 'manage')
            );

            if (!hasPermission) {
                throw new ForbiddenError(`Acceso denegado: permiso '${action}' sobre '${resource}' requerido`);
            }

            req.userPermissions = userPermissions;

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    authMiddleware,
    requireRoles,
    requirePermission,
};
