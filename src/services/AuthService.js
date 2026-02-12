const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { UnauthorizedError, ConflictError, NotFoundError } = require('../errors/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
    /**
     * Registrar un nuevo usuario
     */
    async register({ username, email, password, firstName, lastName }) {
        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictError('El email ya está registrado');
        }

        const existingUsername = await User.findOne({
            where: { username },
        });

        if (existingUsername) {
            throw new ConflictError('El nombre de usuario ya está en uso');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
        });

        const defaultRole = await Role.findOne({ where: { name: 'user' } });
        if (defaultRole) {
            await user.addRole(defaultRole);
        }

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
        const user = await User.findOne({
            where: { email },
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] },
            }],
        });

        if (!user) {
            throw new UnauthorizedError('Credenciales inválidas');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Usuario desactivado');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new UnauthorizedError('Credenciales inválidas');
        }

        await user.update({ lastLogin: new Date() });

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
            throw new UnauthorizedError('Token inválido o expirado');
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
            throw new NotFoundError('Usuario no encontrado');
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
