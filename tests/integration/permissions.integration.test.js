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

const ADMIN_UUID = 'a0000000-0000-4000-a000-000000000001';
const ROLE_UUID = 'a0000000-0000-4000-8000-000000000003';
const PERM_UUID = 'a0000000-0000-4000-9000-000000000004';
const PERM_UUID_2 = 'a0000000-0000-4000-9000-000000000005';

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
                { id: PERM_UUID, name: 'users.create', resource: 'users', action: 'create' },
                { id: PERM_UUID_2, name: 'users.read', resource: 'users', action: 'read' },
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
                id: PERM_UUID,
                name: 'users.create',
                resource: 'users',
                action: 'create',
                roles: [],
            });

            const res = await request(app)
                .get(`/api/permissions/${PERM_UUID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });

        it('debe retornar 400 con ID no UUID', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'read' }]);

            const res = await request(app)
                .get('/api/permissions/no-es-uuid')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
        });
    });

    // =============================================
    // POST /api/permissions
    // =============================================
    describe('POST /api/permissions', () => {
        it('debe crear un permiso exitosamente (201)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'permissions', action: 'create' }]);

            Permission.findOne.mockResolvedValueOnce(null);
            Permission.findOne.mockResolvedValueOnce(null);
            Permission.create.mockResolvedValue({
                id: PERM_UUID,
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
            expect(res.body.message).toBe('Error de validación');
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
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'action' }),
                ])
            );
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
                id: PERM_UUID,
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
                .put(`/api/permissions/${PERM_UUID}`)
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
                id: PERM_UUID,
                name: 'temp',
                roles: [],
                destroy: jest.fn().mockResolvedValue(true),
            };
            Permission.findByPk.mockResolvedValue(mockPermission);

            const res = await request(app)
                .delete(`/api/permissions/${PERM_UUID}`)
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
                id: ROLE_UUID,
                name: 'editor',
                hasPermission: jest.fn().mockResolvedValue(false),
                addPermission: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findByPk.mockResolvedValue({
                id: PERM_UUID,
                name: 'users.create',
                resource: 'users',
                action: 'create',
            });

            const res = await request(app)
                .post('/api/permissions/assign')
                .set('Authorization', `Bearer ${token}`)
                .send({ roleId: ROLE_UUID, permissionId: PERM_UUID });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 400 si faltan roleId o permissionId', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const res = await request(app)
                .post('/api/permissions/assign')
                .set('Authorization', `Bearer ${token}`)
                .send({ roleId: ROLE_UUID });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
        });

        it('debe retornar 400 si roleId no es UUID', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const res = await request(app)
                .post('/api/permissions/assign')
                .set('Authorization', `Bearer ${token}`)
                .send({ roleId: 'no-uuid', permissionId: PERM_UUID });

            expect(res.status).toBe(400);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'roleId' }),
                ])
            );
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
                id: ROLE_UUID,
                name: 'editor',
                hasPermission: jest.fn().mockResolvedValue(true),
                removePermission: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findByPk.mockResolvedValue({ id: PERM_UUID, name: 'users.create' });

            const res = await request(app)
                .post('/api/permissions/remove')
                .set('Authorization', `Bearer ${token}`)
                .send({ roleId: ROLE_UUID, permissionId: PERM_UUID });

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
                id: ROLE_UUID,
                name: 'editor',
                setPermissions: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findAll.mockResolvedValue([
                { id: PERM_UUID, name: 'users.create', resource: 'users', action: 'create' },
                { id: PERM_UUID_2, name: 'users.read', resource: 'users', action: 'read' },
            ]);

            const res = await request(app)
                .post(`/api/permissions/role/${ROLE_UUID}/bulk`)
                .set('Authorization', `Bearer ${token}`)
                .send({ permissionIds: [PERM_UUID, PERM_UUID_2] });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 400 si permissionIds no es un array', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const res = await request(app)
                .post(`/api/permissions/role/${ROLE_UUID}/bulk`)
                .set('Authorization', `Bearer ${token}`)
                .send({ permissionIds: 'not-array' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
        });

        it('debe retornar 400 si permissionIds tiene UUIDs inválidos', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'manage' }]);

            const res = await request(app)
                .post(`/api/permissions/role/${ROLE_UUID}/bulk`)
                .set('Authorization', `Bearer ${token}`)
                .send({ permissionIds: ['no-uuid', 'tampoco-uuid'] });

            expect(res.status).toBe(400);
            expect(res.body.errors).toBeDefined();
        });
    });
});
