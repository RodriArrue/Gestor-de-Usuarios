/**
 * Clase base de errores de la aplicación.
 * Extiende Error nativo con statusCode y estado operacional.
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error 400 — Petición inválida o datos incorrectos.
 */
class BadRequestError extends AppError {
    constructor(message = 'Petición inválida') {
        super(message, 400);
    }
}

/**
 * Error 401 — Credenciales inválidas o ausentes.
 */
class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado') {
        super(message, 401);
    }
}

/**
 * Error 403 — Sin permisos suficientes para la acción.
 */
class ForbiddenError extends AppError {
    constructor(message = 'Acceso denegado') {
        super(message, 403);
    }
}

/**
 * Error 404 — Recurso no encontrado.
 */
class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
    }
}

/**
 * Error 409 — Conflicto (recurso duplicado).
 */
class ConflictError extends AppError {
    constructor(message = 'Recurso ya existe') {
        super(message, 409);
    }
}

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
};
