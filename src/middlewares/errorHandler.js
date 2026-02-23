const { AppError } = require('../errors/AppError');
const { env } = require('../config/env');

/**
 * Middleware global de manejo de errores.
 * Debe registrarse DESPUÉS de todas las rutas en app.js.
 *
 * - Errores operacionales (AppError): retorna el statusCode y mensaje del error.
 * - Errores inesperados: retorna 500 y oculta detalles internos en producción.
 */
const errorHandler = (err, req, res, _next) => {
    // Log del error (solo stack completo en desarrollo)
    if (env.NODE_ENV !== 'test') {
        console.error(`[ERROR] ${err.name}: ${err.message}`);
        if (env.NODE_ENV !== 'production') {
            console.error(err.stack);
        }
    }

    // Error operacional conocido (AppError y subclases)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // Error inesperado (bug, DB down, etc.)
    const statusCode = 500;
    const message =
        env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : err.message || 'Error interno del servidor';

    return res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = { errorHandler };
