const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock de modelos
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

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// UUIDs de prueba válidos
const ADMIN_UUID = 'a0000000-0000-4000-a000-000000000001';
const TARGET_UUID = 'b0000000-0000-4000-b000-000000000002';
const ROLE_UUID = 'a0000000-0000-4000-8000-000000000003';

const generateTestToken = (payload = {}) => {
    return jwt.sign({
        id: ADMIN_UUID,
        email: 'admin@test.com',
        username: 'admin',
        ...payload,
    }, JWT_SECRET, { expiresIn: '1h' });
};

const mockAuthenticatedUser = (permissions = []) => {
    User.findByPk.mockResolvedValue({
        id: ADMIN_UUID,
        username: 'admin',
        email: 'admin@test.com',
        roles: [{
            name: 'admin',
            permissions: permissions,
        }],
    });
};

describe('Users API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // GET /api/users
    // =============================================
    describe('GET /api/users', () => {
        it('debe retornar lista de usuarios con permisos (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'read' }]);

            User.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: [{ id: 'u1', username: 'user1' }],
            });

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
        });

        it('debe retornar 401 sin autenticación', async () => {
            const res = await request(app).get('/api/users');
            expect(res.status).toBe(401);
        });

        it('debe retornar 403 sin permiso de lectura', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([]);

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    // =============================================
    // GET /api/users/:id
    // =============================================
    describe('GET /api/users/:id', () => {
        it('debe retornar un usuario por ID (200)', async () => {
            const token = generateTestToken();
            User.findByPk
                .mockResolvedValueOnce({
                    id: ADMIN_UUID,
                    roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'read' }] }],
                })
                .mockResolvedValueOnce({
                    id: TARGET_UUID,
                    username: 'target',
                    roles: [],
                });

            const res = await request(app)
                .get(`/api/users/${TARGET_UUID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 404 si el usuario no existe', async () => {
            const token = generateTestToken();
            User.findByPk
                .mockResolvedValueOnce({
                    id: ADMIN_UUID,
                    roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'read' }] }],
                })
                .mockResolvedValueOnce(null);

            const res = await request(app)
                .get(`/api/users/${TARGET_UUID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('debe retornar 400 con ID no UUID', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'read' }]);

            const res = await request(app)
                .get('/api/users/no-es-uuid')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
        });
    });

    // =============================================
    // POST /api/users
    // =============================================
    describe('POST /api/users', () => {
        it('debe crear un usuario con permisos (201)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'create' }]);

            User.findOne.mockResolvedValueOnce(null);
            User.findOne.mockResolvedValueOnce(null);

            const mockUser = {
                id: TARGET_UUID,
                username: 'newuser',
                email: 'new@test.com',
                password: 'hashed',
                addRole: jest.fn().mockResolvedValue(true),
                addRoles: jest.fn().mockResolvedValue(true),
                reload: jest.fn().mockResolvedValue(true),
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
            Role.findOne.mockResolvedValue({ id: ROLE_UUID, name: 'user' });

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    username: 'newuser',
                    email: 'new@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 400 si faltan campos requeridos', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'create' }]);

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send({ username: 'test' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
            expect(res.body.errors).toBeDefined();
        });

        it('debe retornar 403 sin permiso de creación', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'read' }]);

            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    username: 'newuser',
                    email: 'new@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(403);
        });
    });

    // =============================================
    // PATCH /api/users/:id/deactivate
    // =============================================
    describe('PATCH /api/users/:id/deactivate', () => {
        it('debe desactivar un usuario (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'delete' }]);

            const mockUser = {
                id: TARGET_UUID,
                username: 'target',
                email: 'target@test.com',
                isActive: true,
                update: jest.fn().mockImplementation(function (data) {
                    this.isActive = data.isActive;
                    return Promise.resolve(this);
                }),
            };
            User.findByPk
                .mockResolvedValueOnce({
                    id: ADMIN_UUID,
                    roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'delete' }] }],
                })
                .mockResolvedValueOnce(mockUser);

            const res = await request(app)
                .patch(`/api/users/${TARGET_UUID}/deactivate`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // =============================================
    // PATCH /api/users/:id/reactivate
    // =============================================
    describe('PATCH /api/users/:id/reactivate', () => {
        it('debe reactivar un usuario (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'update' }]);

            const mockUser = {
                id: TARGET_UUID,
                username: 'target',
                email: 'target@test.com',
                isActive: false,
                update: jest.fn().mockImplementation(function (data) {
                    this.isActive = data.isActive;
                    return Promise.resolve(this);
                }),
            };
            User.findByPk
                .mockResolvedValueOnce({
                    id: ADMIN_UUID,
                    roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'update' }] }],
                })
                .mockResolvedValueOnce(mockUser);

            const res = await request(app)
                .patch(`/api/users/${TARGET_UUID}/reactivate`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
