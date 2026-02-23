const { ZodError } = require('zod');

/**
 * Middleware de validación genérico con Zod.
 * Valida body, params y/o query según los schemas proporcionados.
 *
 * @param {Object} schemas - Objeto con schemas opcionales: { body, params, query }
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/', validate({ body: createUserSchema }), controller.create);
 * router.get('/:id', validate({ params: uuidParamSchema }), controller.getById);
 */
const validate = (schemas) => {
    return (req, res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Error de validación',
                    errors,
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error interno de validación',
            });
        }
    };
};

module.exports = { validate };
