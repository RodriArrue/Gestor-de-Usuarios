const { z } = require('zod');

const uuidSchema = z.string().uuid('ID inválido, debe ser un UUID válido');

const VALID_ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

const uuidParamSchema = z.object({
    id: uuidSchema,
});

const roleIdParamSchema = z.object({
    roleId: uuidSchema,
});

const createPermissionSchema = z.object({
    name: z
        .string({ required_error: 'El nombre del permiso es requerido' })
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .trim(),
    description: z
        .string()
        .max(255, 'La descripción no puede exceder 255 caracteres')
        .trim()
        .optional()
        .nullable(),
    resource: z
        .string({ required_error: 'El recurso es requerido' })
        .min(1, 'El recurso es requerido')
        .max(50, 'El recurso no puede exceder 50 caracteres')
        .trim(),
    action: z.enum(VALID_ACTIONS, {
        required_error: 'La acción es requerida',
        invalid_type_error: `La acción debe ser una de: ${VALID_ACTIONS.join(', ')}`,
    }),
});

const updatePermissionSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .trim()
        .optional(),
    description: z
        .string()
        .max(255, 'La descripción no puede exceder 255 caracteres')
        .trim()
        .optional()
        .nullable(),
    resource: z
        .string()
        .max(50, 'El recurso no puede exceder 50 caracteres')
        .trim()
        .optional(),
    action: z.enum(VALID_ACTIONS, {
        invalid_type_error: `La acción debe ser una de: ${VALID_ACTIONS.join(', ')}`,
    }).optional(),
});

const assignPermissionSchema = z.object({
    roleId: z
        .string({ required_error: 'roleId es requerido' })
        .uuid('roleId debe ser un UUID válido'),
    permissionId: z
        .string({ required_error: 'permissionId es requerido' })
        .uuid('permissionId debe ser un UUID válido'),
});

const bulkAssignSchema = z.object({
    permissionIds: z
        .array(uuidSchema, {
            required_error: 'permissionIds es requerido',
            invalid_type_error: 'permissionIds debe ser un array',
        })
        .min(1, 'Debe incluir al menos un permiso'),
});

const getPermissionsQuerySchema = z.object({
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
    createPermissionSchema,
    updatePermissionSchema,
    assignPermissionSchema,
    bulkAssignSchema,
    getPermissionsQuerySchema,
};
