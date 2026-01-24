const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
    /**
     * Registrar un nuevo usuario
     */
    async register({ username, email, password, firstName, lastName }) {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new Error('El email ya está registrado');
        }

        const existingUsername = await User.findOne({
            where: { username },
        });

        if (existingUsername) {
            throw new Error('El nombre de usuario ya está en uso');
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
        });

        // Asignar rol por defecto (user) si existe
        const defaultRole = await Role.findOne({ where: { name: 'user' } });
        if (defaultRole) {
            await user.addRole(defaultRole);
        }

        // Generar token
        const token = this.generateToken(user);

        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    /**
     * Iniciar sesión
     */
    async login({ email, password }) {
        // Buscar usuario por email
        const user = await User.findOne({
            where: { email },
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] },
            }],
        });

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        if (!user.isActive) {
            throw new Error('Usuario desactivado');
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Credenciales inválidas');
        }

        // Actualizar último login
        await user.update({ lastLogin: new Date() });

        // Generar token
        const token = this.generateToken(user);

        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    /**
     * Generar JWT
     */
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            username: user.username,
        };

        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
    }

    /**
     * Verificar JWT
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Token inválido o expirado');
        }
    }

    /**
     * Obtener usuario por ID (sin contraseña)
     */
    async getUserById(id) {
        const user = await User.findByPk(id, {
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] },
            }],
        });

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        return this.sanitizeUser(user);
    }

    /**
     * Remover campos sensibles del usuario
     */
    sanitizeUser(user) {
        const { password, ...sanitized } = user.toJSON();
        return sanitized;
    }
}

module.exports = new AuthService();
