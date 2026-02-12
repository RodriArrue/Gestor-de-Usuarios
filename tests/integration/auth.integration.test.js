const request = require('supertest');

// Mock completo de modelos antes de cargar la app
jest.mock('../../src/models', () => {
    const mockUser = {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        findAndCountAll: jest.fn(),
        create: jest.fn(),
    };
    const mockRole = {
        findOne: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
    };
    const mockPermission = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
    };
    const mockAuditLog = {
        create: jest.fn().mockResolvedValue(true),
    };
    const { Sequelize } = require('sequelize');
    return {
        sequelize: { sync: jest.fn() },
        Sequelize,
        User: mockUser,
        Role: mockRole,
        Permission: mockPermission,
        AuditLog: mockAuditLog,
    };
});

const app = require('../../src/app');
const { User, Role } = require('../../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper para generar un token válido
const generateTestToken = (payload = {}) => {
    const defaultPayload = {
        id: 'test-user-uuid',
        email: 'test@test.com',
        username: 'testuser',
        ...payload,
    };
    return jwt.sign(defaultPayload, JWT_SECRET, { expiresIn: '1h' });
};

describe('Auth API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // POST /api/auth/register
    // =============================================
    describe('POST /api/auth/register', () => {
        it('debe registrar un usuario exitosamente (201)', async () => {
            User.findOne.mockResolvedValueOnce(null); // email
            User.findOne.mockResolvedValueOnce(null); // username

            const mockUser = {
                id: 'new-uuid',
                username: 'newuser',
                email: 'new@test.com',
                password: 'hashed',
                addRole: jest.fn().mockResolvedValue(true),
                toJSON: function () {
                    return {
                        id: this.id,
                        username: this.username,
                        email: this.email,
                        password: this.password,
                    };
                },
            };
            User.create.mockResolvedValue(mockUser);
            Role.findOne.mockResolvedValue({ id: 'role-user', name: 'user' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    email: 'new@test.com',
                    password: 'password123',
                    firstName: 'New',
                    lastName: 'User',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
        });

        it('debe retornar 400 si faltan campos requeridos', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'test' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('debe retornar 400 si la contraseña es muy corta', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'test',
                    email: 'test@test.com',
                    password: '123',
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('al menos 6 caracteres');
        });

        it('debe retornar 400 si el email ya existe', async () => {
            User.findOne.mockResolvedValueOnce({ id: 'existing' }); // email existe

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    email: 'existing@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('email ya está registrado');
        });
    });

    // =============================================
    // POST /api/auth/login
    // =============================================
    describe('POST /api/auth/login', () => {
        it('debe iniciar sesión exitosamente (200)', async () => {
            const hashedPwd = await bcrypt.hash('password123', 10);
            const mockUser = {
                id: 'user-uuid',
                email: 'test@test.com',
                username: 'testuser',
                password: hashedPwd,
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

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
        });

        it('debe retornar 400 si faltan campos', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.com' });

            expect(res.status).toBe(400);
        });

        it('debe retornar 401 con credenciales inválidas', async () => {
            User.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'noexiste@test.com', password: 'wrong' });

            expect(res.status).toBe(401);
        });
    });

    // =============================================
    // GET /api/auth/me
    // =============================================
    describe('GET /api/auth/me', () => {
        it('debe retornar perfil con token válido (200)', async () => {
            const token = generateTestToken();
            const mockUser = {
                id: 'test-user-uuid',
                email: 'test@test.com',
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

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).not.toHaveProperty('password');
        });

        it('debe retornar 401 sin token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.status).toBe(401);
        });

        it('debe retornar 401 con token inválido', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer token-invalido');

            expect(res.status).toBe(401);
        });
    });
});
