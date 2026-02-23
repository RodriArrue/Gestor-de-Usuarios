const { z } = require('zod');

const uuidSchema = z.string().uuid('ID inválido, debe ser un UUID válido');

const uuidParamSchema = z.object({
    id: uuidSchema,
});

const roleIdParamSchema = z.object({
    roleId: uuidSchema,
});

const userIdParamSchema = z.object({
    userId: uuidSchema,
});

const createRoleSchema = z.object({
    name: z
        .string({ required_error: 'El nombre del rol es requerido' })
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(50, 'El nombre no puede exceder 50 caracteres')
        .trim(),
    description: z
        .string()
        .max(255, 'La descripción no puede exceder 255 caracteres')
        .trim()
        .optional()
        .nullable(),
    isActive: z
        .boolean({ invalid_type_error: 'isActive debe ser un booleano' })
        .optional()
        .default(true),
});

const updateRoleSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(50, 'El nombre no puede exceder 50 caracteres')
        .trim()
        .optional(),
    description: z
        .string()
        .max(255, 'La descripción no puede exceder 255 caracteres')
        .trim()
        .optional()
        .nullable(),
    isActive: z
        .boolean({ invalid_type_error: 'isActive debe ser un booleano' })
        .optional(),
});

const assignRoleSchema = z.object({
    userId: z
        .string({ required_error: 'userId es requerido' })
        .uuid('userId debe ser un UUID válido'),
    roleId: z
        .string({ required_error: 'roleId es requerido' })
        .uuid('roleId debe ser un UUID válido'),
});

const getRolesQuerySchema = z.object({
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
    search: z
        .string()
        .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
        .optional(),
});

module.exports = {
    uuidParamSchema,
    roleIdParamSchema,
    userIdParamSchema,
    createRoleSchema,
    updateRoleSchema,
    assignRoleSchema,
    getRolesQuerySchema,
};
