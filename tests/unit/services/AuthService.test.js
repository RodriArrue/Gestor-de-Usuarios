const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock de los modelos
jest.mock('../../../src/models', () => {
    const mockUser = {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
    };
    const mockRole = {
        findOne: jest.fn(),
    };
    return { User: mockUser, Role: mockRole };
});

const { User, Role } = require('../../../src/models');
const AuthService = require('../../../src/services/AuthService');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // register
    // =============================================
    describe('register', () => {
        const validData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
        };

        it('debe registrar un usuario exitosamente', async () => {
            User.findOne.mockResolvedValueOnce(null); // email no existe
            User.findOne.mockResolvedValueOnce(null); // username no existe

            const mockCreatedUser = {
                id: 'uuid-123',
                username: 'testuser',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                password: 'hashed_password',
                addRole: jest.fn().mockResolvedValue(true),
                toJSON: function () {
                    return { ...this };
                },
            };
            User.create.mockResolvedValue(mockCreatedUser);
            Role.findOne.mockResolvedValue({ id: 'role-uuid', name: 'user' });

            const result = await AuthService.register(validData);

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user).not.toHaveProperty('password');
            expect(User.create).toHaveBeenCalledTimes(1);
            expect(mockCreatedUser.addRole).toHaveBeenCalled();
        });

        it('debe lanzar error si el email ya está registrado', async () => {
            User.findOne.mockResolvedValueOnce({ id: 'existing-user' });

            await expect(AuthService.register(validData))
                .rejects.toThrow('El email ya está registrado');
        });

        it('debe lanzar error si el username ya está en uso', async () => {
            User.findOne.mockResolvedValueOnce(null); // email no existe
            User.findOne.mockResolvedValueOnce({ id: 'existing-user' }); // username existe

            await expect(AuthService.register(validData))
                .rejects.toThrow('El nombre de usuario ya está en uso');
        });

        it('debe registrar sin asignar rol si no existe rol por defecto', async () => {
            User.findOne.mockResolvedValueOnce(null);
            User.findOne.mockResolvedValueOnce(null);

            const mockCreatedUser = {
                id: 'uuid-123',
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashed',
                addRole: jest.fn(),
                toJSON: function () {
                    return { ...this };
                },
            };
            User.create.mockResolvedValue(mockCreatedUser);
            Role.findOne.mockResolvedValue(null); // No hay rol por defecto

            const result = await AuthService.register(validData);

            expect(result).toHaveProperty('token');
            expect(mockCreatedUser.addRole).not.toHaveBeenCalled();
        });
    });

    // =============================================
    // login
    // =============================================
    describe('login', () => {
        it('debe iniciar sesión exitosamente', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const mockUser = {
                id: 'uuid-123',
                email: 'test@example.com',
                username: 'testuser',
                password: hashedPassword,
                isActive: true,
                roles: [{ name: 'user' }],
                update: jest.fn().mockResolvedValue(true),
                toJSON: function () {
                    return {
                        id: this.id,
                        email: this.email,
                        username: this.username,
                        password: this.password,
                        isActive: this.isActive,
                        roles: this.roles,
                    };
                },
            };
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.login({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user).not.toHaveProperty('password');
            expect(mockUser.update).toHaveBeenCalledWith({ lastLogin: expect.any(Date) });
        });

        it('debe lanzar error con credenciales inválidas (usuario no existe)', async () => {
            User.findOne.mockResolvedValue(null);

            await expect(
                AuthService.login({ email: 'noexiste@test.com', password: '123456' })
            ).rejects.toThrow('Credenciales inválidas');
        });

        it('debe lanzar error si el usuario está desactivado', async () => {
            const mockUser = {
                id: 'uuid-123',
                email: 'test@example.com',
                password: 'hashed',
                isActive: false,
            };
            User.findOne.mockResolvedValue(mockUser);

            await expect(
                AuthService.login({ email: 'test@example.com', password: 'password123' })
            ).rejects.toThrow('Usuario desactivado');
        });

        it('debe lanzar error con contraseña incorrecta', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            const mockUser = {
                id: 'uuid-123',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: true,
            };
            User.findOne.mockResolvedValue(mockUser);

            await expect(
                AuthService.login({ email: 'test@example.com', password: 'wrongpassword' })
            ).rejects.toThrow('Credenciales inválidas');
        });
    });

    // =============================================
    // generateToken / verifyToken
    // =============================================
    describe('generateToken & verifyToken', () => {
        it('debe generar y verificar un token válido', () => {
            const user = { id: 'uuid-123', email: 'test@example.com', username: 'testuser' };
            const token = AuthService.generateToken(user);

            expect(typeof token).toBe('string');

            const decoded = AuthService.verifyToken(token);
            expect(decoded.id).toBe('uuid-123');
            expect(decoded.email).toBe('test@example.com');
            expect(decoded.username).toBe('testuser');
        });

        it('debe lanzar error con token inválido', () => {
            expect(() => AuthService.verifyToken('token-invalido'))
                .toThrow('Token inválido o expirado');
        });
    });

    // =============================================
    // getUserById
    // =============================================
    describe('getUserById', () => {
        it('debe retornar usuario sin contraseña', async () => {
            const mockUser = {
                id: 'uuid-123',
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashed',
                roles: [{ name: 'user' }],
                toJSON: function () {
                    return {
                        id: this.id,
                        email: this.email,
                        username: this.username,
                        password: this.password,
                        roles: this.roles,
                    };
                },
            };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await AuthService.getUserById('uuid-123');

            expect(result).not.toHaveProperty('password');
            expect(result.id).toBe('uuid-123');
        });

        it('debe lanzar error si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(AuthService.getUserById('no-existe'))
                .rejects.toThrow('Usuario no encontrado');
        });
    });

    // =============================================
    // sanitizeUser
    // =============================================
    describe('sanitizeUser', () => {
        it('debe remover el campo password', () => {
            const user = {
                toJSON: () => ({
                    id: 'uuid-123',
                    email: 'test@example.com',
                    password: 'should_be_removed',
                    username: 'testuser',
                }),
            };

            const sanitized = AuthService.sanitizeUser(user);

            expect(sanitized).not.toHaveProperty('password');
            expect(sanitized.id).toBe('uuid-123');
            expect(sanitized.email).toBe('test@example.com');
        });
    });
});
