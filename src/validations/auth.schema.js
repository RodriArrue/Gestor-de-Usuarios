const { z } = require('zod');

const registerSchema = z.object({
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
});

const loginSchema = z.object({
    email: z
        .string({ required_error: 'El email es requerido' })
        .email('El email no es válido')
        .trim()
        .toLowerCase(),
    password: z
        .string({ required_error: 'La contraseña es requerida' })
        .min(1, 'La contraseña es requerida'),
});

const changePasswordSchema = z.object({
    currentPassword: z
        .string({ required_error: 'La contraseña actual es requerida' })
        .min(1, 'La contraseña actual es requerida'),
    newPassword: z
        .string({ required_error: 'La nueva contraseña es requerida' })
        .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
        .max(128, 'La nueva contraseña no puede exceder 128 caracteres'),
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
};
