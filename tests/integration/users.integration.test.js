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

const generateTestToken = (payload = {}) => {
    return jwt.sign({
        id: 'admin-uuid',
        email: 'admin@test.com',
        username: 'admin',
        ...payload,
    }, JWT_SECRET, { expiresIn: '1h' });
};

// Helper: mock de usuario con permisos para que pase requirePermission
const mockAuthenticatedUser = (permissions = []) => {
    User.findByPk.mockResolvedValue({
        id: 'admin-uuid',
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
            mockAuthenticatedUser([]); // sin permisos

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
            // Primera llamada: requirePermission, segunda: getUserById
            User.findByPk
                .mockResolvedValueOnce({
                    id: 'admin-uuid',
                    roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'read' }] }],
                })
                .mockResolvedValueOnce({
                    id: 'target-uuid',
                    username: 'target',
                    roles: [],
                });

            const res = await request(app)
                .get('/api/users/target-uuid')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 404 si el usuario no existe', async () => {
            const token = generateTestToken();
            User.findByPk
                .mockResolvedValueOnce({
                    id: 'admin-uuid',
                    roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'read' }] }],
                })
                .mockResolvedValueOnce(null);

            const res = await request(app)
                .get('/api/users/no-existe')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });

    // =============================================
    // POST /api/users
    // =============================================
    describe('POST /api/users', () => {
        it('debe crear un usuario con permisos (201)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'create' }]);

            User.findOne.mockResolvedValueOnce(null); // email
            User.findOne.mockResolvedValueOnce(null); // username

            const mockUser = {
                id: 'new-uuid',
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
            Role.findOne.mockResolvedValue({ id: 'role-user', name: 'user' });

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
        });

        it('debe retornar 403 sin permiso de creación', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'read' }]); // solo read

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
                id: 'target-uuid',
                username: 'target',
                email: 'target@test.com',
                isActive: true,
                update: jest.fn().mockImplementation(function (data) {
                    this.isActive = data.isActive;
                    return Promise.resolve(this);
                }),
            };
            // Después de requirePermission, el findByPk del servicio
            User.findByPk
                .mockResolvedValueOnce({
                    id: 'admin-uuid',
                    roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'delete' }] }],
                })
                .mockResolvedValueOnce(mockUser);

            const res = await request(app)
                .patch('/api/users/target-uuid/deactivate')
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
                id: 'target-uuid',
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
                    id: 'admin-uuid',
                    roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'update' }] }],
                })
                .mockResolvedValueOnce(mockUser);

            const res = await request(app)
                .patch('/api/users/target-uuid/reactivate')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
