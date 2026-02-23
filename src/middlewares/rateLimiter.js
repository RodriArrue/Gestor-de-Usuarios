const rateLimit = require('express-rate-limit');

/**
 * Rate limiter global — aplica a todas las rutas de la API.
 * 100 requests por IP cada 15 minutos.
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true, // Envía headers RateLimit-*
    legacyHeaders: false, // Desactiva X-RateLimit-*
    message: {
        success: false,
        message: 'Demasiadas solicitudes, intenta de nuevo más tarde.',
    },
});

/**
 * Rate limiter estricto para autenticación (login/register).
 * 10 requests por IP cada 15 minutos.
 * Previene ataques de fuerza bruta.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos.',
    },
});

module.exports = {
    globalLimiter,
    authLimiter,
};
