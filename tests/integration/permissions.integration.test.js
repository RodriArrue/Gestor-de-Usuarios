const request = require('supertest');
const jwt = require('jsonwebtoken');

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
        create: jest.fn(),
    };
    const mockPermission = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
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
const { User, Role, Permission } = require('../../src/models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const generateTestToken = (payload = {}) => {
    return jwt.sign({
        id: 'admin-uuid',
        email: 'admin@test.com',
        username: 'admin',
        ...payload,
    }, JWT_SECRET, { expiresIn: '1h' });
};

const mockAuthenticatedUser = (permissions = []) => {
    User.findByPk.mockResolvedValue({
        id: 'admin-uuid',
        username: 'admin',
        email: 'admin@test.com',
        roles: [{
            name: 'admin',
            permissions,
        }],
    });
};

describe('Permissions API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // GET /api/permissions
    // =============================================
    describe('GET /api/permissions', () => {
        it('debe retornar todos los permisos (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'read' }]);

            Permission.findAll.mockResolvedValue([
                { id: 'p1', name: 'users.create', resource: 'users', action: 'create' },
                { id: 'p2', name: 'users.read', resource: 'users', action: 'read' },
            ]);

            const res = await request(app)
                .get('/api/permissions')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });

        it('debe retornar 401 sin autenticación', async () => {
            const res = await request(app).get('/api/permissions');
            expect(res.status).toBe(401);
        });

        it('debe retornar 403 sin permiso', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([]);

            const res = await request(app)
                .get('/api/permissions')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    // =============================================
    // GET /api/permissions/:id
    // =============================================
    describe('GET /api/permissions/:id', () => {
        it('debe retornar un permiso por ID (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'read' }]);

            Permission.findByPk.mockResolvedValue({
                id: 'p1',
                name: 'users.create',
                resource: 'users',
                action: 'create',
                roles: [],
            });

            const res = await request(app)
                .get('/api/permissions/p1')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    // =============================================
    // POST /api/permissions
    // =============================================
    describe('POST /api/permissions', () => {
        it('debe crear un permiso exitosamente (201)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'create' }]);

            Permission.findOne.mockResolvedValueOnce(null); // nombre
            Permission.findOne.mockResolvedValueOnce(null); // resource+action
            Permission.create.mockResolvedValue({
                id: 'p-new',
                name: 'posts.create',
                resource: 'posts',
                action: 'create',
            });

            const res = await request(app)
                .post('/api/permissions')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'posts.create',
                    description: 'Crear posts',
                    resource: 'posts',
                    action: 'create',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 400 si faltan campos requeridos', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'create' }]);

            const res = await request(app)
                .post('/api/permissions')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'test' });

            expect(res.status).toBe(400);
        });

        it('debe retornar 400 si la action es inválida', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'create' }]);

            const res = await request(app)
                .post('/api/permissions')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'test.perm',
                    resource: 'test',
                    action: 'invalid_action',
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('action debe ser uno de');
        });
    });

    // =============================================
    // PUT /api/permissions/:id
    // =============================================
    describe('PUT /api/permissions/:id', () => {
        it('debe actualizar un permiso (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'update' }]);

            const mockPermission = {
                id: 'p1',
                name: 'users.create',
                resource: 'users',
                action: 'create',
                description: 'old',
                roles: [],
                update: jest.fn().mockResolvedValue(true),
            };
            Permission.findByPk.mockResolvedValue(mockPermission);
            Permission.findOne.mockResolvedValue(null);

            const res = await request(app)
                .put('/api/permissions/p1')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'Updated' });

            expect(res.status).toBe(200);
        });
    });

    // =============================================
    // DELETE /api/permissions/:id
    // =============================================
    describe('DELETE /api/permissions/:id', () => {
        it('debe eliminar un permiso (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'delete' }]);

            const mockPermission = {
                id: 'p1',
                name: 'temp',
                roles: [],
                destroy: jest.fn().mockResolvedValue(true),
            };
            Permission.findByPk.mockResolvedValue(mockPermission);

            const res = await request(app)
                .delete('/api/permissions/p1')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    // =============================================
    // POST /api/permissions/assign
    // =============================================
    describe('POST /api/permissions/assign', () => {
        it('debe asignar un permiso a un rol (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const mockRole = {
                id: 'r1',
                name: 'editor',
                hasPermission: jest.fn().mockResolvedValue(false),
                addPermission: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findByPk.mockResolvedValue({
                id: 'p1',
                name: 'users.create',
                resource: 'users',
                action: 'create',
            });

            const res = await request(app)
                .post('/api/permissions/assign')
                .set('Authorization', `Bearer ${token}`)
                .send({ roleId: 'r1', permissionId: 'p1' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 400 si faltan roleId o permissionId', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const res = await request(app)
                .post('/api/permissions/assign')
                .set('Authorization', `Bearer ${token}`)
                .send({ roleId: 'r1' });

            expect(res.status).toBe(400);
        });
    });

    // =============================================
    // POST /api/permissions/remove
    // =============================================
    describe('POST /api/permissions/remove', () => {
        it('debe remover un permiso de un rol (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const mockRole = {
                id: 'r1',
                name: 'editor',
                hasPermission: jest.fn().mockResolvedValue(true),
                removePermission: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findByPk.mockResolvedValue({ id: 'p1', name: 'users.create' });

            const res = await request(app)
                .post('/api/permissions/remove')
                .set('Authorization', `Bearer ${token}`)
                .send({ roleId: 'r1', permissionId: 'p1' });

            expect(res.status).toBe(200);
        });
    });

    // =============================================
    // POST /api/permissions/role/:roleId/bulk
    // =============================================
    describe('POST /api/permissions/role/:roleId/bulk', () => {
        it('debe asignar múltiples permisos a un rol (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const mockRole = {
                id: 'r1',
                name: 'editor',
                setPermissions: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findAll.mockResolvedValue([
                { id: 'p1', name: 'users.create', resource: 'users', action: 'create' },
                { id: 'p2', name: 'users.read', resource: 'users', action: 'read' },
            ]);

            const res = await request(app)
                .post('/api/permissions/role/r1/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ permissionIds: ['p1', 'p2'] });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 400 si permissionIds no es un array', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const res = await request(app)
                .post('/api/permissions/role/r1/bulk')
                .set('Authorization', `Bearer ${token}`)
                .send({ permissionIds: 'not-array' });

            expect(res.status).toBe(400);
        });
    });
});
