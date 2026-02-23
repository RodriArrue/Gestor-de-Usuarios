const { z } = require('zod');

const uuidSchema = z.string().uuid('ID inválido, debe ser un UUID válido');

const uuidParamSchema = z.object({
    id: uuidSchema,
});

const createUserSchema = z.object({
    username: z
        .string({ required_error: 'El username es requerido' })
        .min(3, 'El username debe tener al menos 3 caracteres')
        .max(50, 'El username no puede exceder 50 caracteres')
        .trim(),
    email: z
        .string({ required_error: 'El email es requerido' })
        .email('El email no es válido')
        .max(100, 'El email no puede exceder 100 caracteres')
        .trim()
        .toLowerCase(),
    password: z
        .string({ required_error: 'La contraseña es requerida' })
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .max(128, 'La contraseña no puede exceder 128 caracteres'),
    firstName: z
        .string()
        .max(50, 'El nombre no puede exceder 50 caracteres')
        .trim()
        .optional()
        .nullable(),
    lastName: z
        .string()
        .max(50, 'El apellido no puede exceder 50 caracteres')
        .trim()
        .optional()
        .nullable(),
    roleIds: z
        .array(uuidSchema, { invalid_type_error: 'roleIds debe ser un array de UUIDs' })
        .optional(),
});

const getUsersQuerySchema = z.object({
    page: z
        .string()
        .regex(/^\d+$/, 'page debe ser un número')
        .optional()
        .default('1'),
    limit: z
        .string()
        .regex(/^\d+$/, 'limit debe ser un número')
        .optional()
        .default('10'),
    includeInactive: z
        .enum(['true', 'false'], { invalid_type_error: 'includeInactive debe ser true o false' })
        .optional(),
    search: z
        .string()
        .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
        .optional(),
});

const updateUserSchema = z.object({
    username: z
        .string()
        .min(3, 'El username debe tener al menos 3 caracteres')
        .max(50, 'El username no puede exceder 50 caracteres')
        .trim()
        .optional(),
    email: z
        .string()
        .email('El email no es válido')
        .max(100, 'El email no puede exceder 100 caracteres')
        .trim()
        .toLowerCase()
        .optional(),
    firstName: z
        .string()
        .max(50, 'El nombre no puede exceder 50 caracteres')
        .trim()
        .optional()
        .nullable(),
    lastName: z
        .string()
        .max(50, 'El apellido no puede exceder 50 caracteres')
        .trim()
        .optional()
        .nullable(),
});

module.exports = {
    uuidParamSchema,
    createUserSchema,
    getUsersQuerySchema,
    updateUserSchema,
};
