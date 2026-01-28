const { AuditLog } = require('../models');

/**
 * Lista de rutas a excluir del logging
 */
const EXCLUDED_ROUTES = [
    '/health',
    '/favicon.ico',
];

/**
 * Campos sensibles a sanitizar del body
 */
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'api_key'];

/**
 * Mapea métodos HTTP a acciones de auditoría
 */
const methodToAction = (method) => {
    const mapping = {
        GET: 'READ',
        POST: 'CREATE',
        PUT: 'UPDATE',
        PATCH: 'UPDATE',
        DELETE: 'DELETE',
    };
    return mapping[method.toUpperCase()] || method.toUpperCase();
};

/**
 * Sanitiza el body removiendo campos sensibles
 */
const sanitizeBody = (body) => {
    if (!body || typeof body !== 'object') return null;

    const sanitized = { ...body };
    SENSITIVE_FIELDS.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    return sanitized;
};

/**
 * Extrae el ID del recurso de la URL
 * Ej: /api/users/123 -> '123'
 */
const extractResourceId = (url) => {
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = url.match(uuidPattern);
    return match ? match[0] : null;
};

/**
 * Obtiene la IP del cliente
 */
const getClientIp = (req) => {
    return req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection?.remoteAddress ||
        null;
};

/**
 * Middleware de auditoría automática
 * Registra todas las requests HTTP en la tabla audit_logs
 */
const auditMiddleware = async (req, res, next) => {
    // Excluir rutas específicas
    if (EXCLUDED_ROUTES.some(route => req.path.startsWith(route))) {
        return next();
    }

    // Excluir la ruta raíz
    if (req.path === '/') {
        return next();
    }

    const startTime = Date.now();

    // Capturar datos antes de la request
    const logData = {
        userId: null, // Se actualizará después del middleware de auth
        action: methodToAction(req.method),
        resource: req.path,
        resourceId: extractResourceId(req.originalUrl),
        method: req.method,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent']?.substring(0, 500) || null,
        requestBody: sanitizeBody(req.body),
    };

    // Interceptar la respuesta para capturar el statusCode
    const originalJson = res.json.bind(res);
    res.json = function (data) {
        // Calcular tiempo de respuesta
        logData.responseTime = Date.now() - startTime;
        logData.statusCode = res.statusCode;

        // Actualizar userId si está disponible (después del middleware de auth)
        if (req.user && req.user.id) {
            logData.userId = req.user.id;
        }

        // Guardar log de forma asíncrona (no bloquear la respuesta)
        AuditLog.create(logData).catch(err => {
            console.error('Error al crear log de auditoría:', err.message);
        });

        return originalJson(data);
    };

    next();
};

module.exports = {
    auditMiddleware,
};
