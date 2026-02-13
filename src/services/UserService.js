const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, ConflictError, BadRequestError } = require('../errors/AppError');

class UserService {
    /**
     * Crear un nuevo usuario (solo ADMIN)
     */
    async createUser({ username, email, password, firstName, lastName, roleIds }) {
        const existingEmail = await User.findOne({
            where: { email },
            paranoid: false,
        });

        if (existingEmail) {
            throw new ConflictError('El email ya está registrado');
        }

        const existingUsername = await User.findOne({
            where: { username },
            paranoid: false,
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

        if (roleIds && roleIds.length > 0) {
            const roles = await Role.findAll({
                where: { id: roleIds },
            });
            await user.addRoles(roles);
        } else {
            const defaultRole = await Role.findOne({ where: { name: 'user' } });
            if (defaultRole) {
                await user.addRole(defaultRole);
            }
        }

        await user.reload({
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] },
            }],
        });

        return this.sanitizeUser(user);
    }

    /**
     * Obtener todos los usuarios con paginación
     */
    async getAllUsers({ page = 1, limit = 10, includeInactive = false, search }) {
        const offset = (page - 1) * limit;

        const whereClause = {};

        if (!includeInactive) {
            whereClause.isActive = true;
        }

        if (search) {
            whereClause[Op.or] = [
                { username: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] },
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['password'] },
        });

        return {
            users: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * Obtener usuario por ID
     */
    async getUserById(id) {
        const user = await User.findByPk(id, {
            include: [{
                model: Role,
                as: 'roles',
                through: { attributes: [] },
            }],
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        return user;
    }

    /**
     * Desactivar usuario (soft delete)
     */
    async deactivateUser(id, currentUserId) {
        if (id === currentUserId) {
            throw new BadRequestError('No puedes desactivarte a ti mismo');
        }

        const user = await User.findByPk(id);

        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        if (!user.isActive) {
            throw new BadRequestError('El usuario ya está desactivado');
        }

        await user.update({ isActive: false });

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            isActive: user.isActive,
            message: 'Usuario desactivado correctamente',
        };
    }

    /**
     * Reactivar usuario
     */
    async reactivateUser(id) {
        const user = await User.findByPk(id);

        if (!user) {
            throw new NotFoundError('Usuario no encontrado');
        }

        if (user.isActive) {
            throw new BadRequestError('El usuario ya está activo');
        }

        await user.update({ isActive: true });

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            isActive: user.isActive,
            message: 'Usuario reactivado correctamente',
        };
    }

    /**
     * Remover campos sensibles del usuario
     */
    sanitizeUser(user) {
        const { password, ...sanitized } = user.toJSON();
        return sanitized;
    }
}

module.exports = new UserService();
