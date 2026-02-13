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

const ADMIN_UUID = 'a0000000-0000-4000-a000-000000000001';
const USER_UUID = 'b0000000-0000-4000-b000-000000000002';
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
            permissions,
        }],
    });
};

describe('Roles API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // GET /api/roles
    // =============================================
    describe('GET /api/roles', () => {
        it('debe retornar todos los roles (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'read' }]);

            Role.findAll.mockResolvedValue([
                { id: ROLE_UUID, name: 'admin', permissions: [] },
                { id: 'a0000000-0000-4000-8000-000000000099', name: 'user', permissions: [] },
            ]);

            const res = await request(app)
                .get('/api/roles')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });

        it('debe retornar 401 sin autenticación', async () => {
            const res = await request(app).get('/api/roles');
            expect(res.status).toBe(401);
        });

        it('debe retornar 403 sin permiso', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([]);

            const res = await request(app)
                .get('/api/roles')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    // =============================================
    // GET /api/roles/:id
    // =============================================
    describe('GET /api/roles/:id', () => {
        it('debe retornar un rol por ID (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'read' }]);

            Role.findByPk.mockResolvedValue({
                id: ROLE_UUID, name: 'admin', permissions: [],
            });

            const res = await request(app)
                .get(`/api/roles/${ROLE_UUID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });

        it('debe retornar 400 con ID no UUID', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'read' }]);

            const res = await request(app)
                .get('/api/roles/no-es-uuid')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
        });
    });

    // =============================================
    // POST /api/roles
    // =============================================
    describe('POST /api/roles', () => {
        it('debe crear un rol exitosamente (201)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'create' }]);

            Role.findOne.mockResolvedValue(null);
            Role.create.mockResolvedValue({
                id: ROLE_UUID,
                name: 'editor',
                description: 'Editor role',
            });

            const res = await request(app)
                .post('/api/roles')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'editor', description: 'Editor role' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 400 si falta el nombre', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'create' }]);

            const res = await request(app)
                .post('/api/roles')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'No name' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
        });
    });

    // =============================================
    // PUT /api/roles/:id
    // =============================================
    describe('PUT /api/roles/:id', () => {
        it('debe retornar 403 sin permiso de actualización', async () => {
            const token = generateTestToken();
            User.findByPk.mockResolvedValue({
                id: ADMIN_UUID,
                username: 'admin',
                email: 'admin@test.com',
                roles: [{ name: 'user', permissions: [{ resource: 'roles', action: 'read' }] }],
            });

            const res = await request(app)
                .put(`/api/roles/${ROLE_UUID}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'Updated' });

            expect(res.status).toBe(403);
        });

        it('debe retornar 400 con ID no UUID', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'update' }]);

            const res = await request(app)
                .put('/api/roles/no-es-uuid')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'Updated' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
        });
    });

    // =============================================
    // DELETE /api/roles/:id
    // =============================================
    describe('DELETE /api/roles/:id', () => {
        it('debe eliminar un rol (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'roles', action: 'delete' }]);

            const mockRole = {
                id: ROLE_UUID,
                name: 'temp',
                permissions: [],
                destroy: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);

            const res = await request(app)
                .delete(`/api/roles/${ROLE_UUID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // =============================================
    // POST /api/roles/assign
    // =============================================
    describe('POST /api/roles/assign', () => {
        it('debe asignar un rol a un usuario (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'manage' }]);

            const mockUser = {
                id: USER_UUID,
                username: 'user1',
                hasRole: jest.fn().mockResolvedValue(false),
                addRole: jest.fn().mockResolvedValue(true),
            };
            User.findByPk.mockResolvedValueOnce({
                id: ADMIN_UUID,
                roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'manage' }] }],
            });
            User.findByPk.mockResolvedValueOnce(mockUser);
            Role.findByPk.mockResolvedValue({ id: ROLE_UUID, name: 'editor' });

            const res = await request(app)
                .post('/api/roles/assign')
                .set('Authorization', `Bearer ${token}`)
                .send({ userId: USER_UUID, roleId: ROLE_UUID });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('debe retornar 400 si faltan userId o roleId', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'manage' }]);

            const res = await request(app)
                .post('/api/roles/assign')
                .set('Authorization', `Bearer ${token}`)
                .send({ userId: USER_UUID });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Error de validación');
        });

        it('debe retornar 400 si userId no es UUID', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'manage' }]);

            const res = await request(app)
                .post('/api/roles/assign')
                .set('Authorization', `Bearer ${token}`)
                .send({ userId: 'no-uuid', roleId: ROLE_UUID });

            expect(res.status).toBe(400);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'userId' }),
                ])
            );
        });
    });

    // =============================================
    // POST /api/roles/remove
    // =============================================
    describe('POST /api/roles/remove', () => {
        it('debe remover un rol de un usuario (200)', async () => {
            const token = generateTestToken();
            mockAuthenticatedUser([{ resource: 'users', action: 'manage' }]);

            const mockUser = {
                id: USER_UUID,
                username: 'user1',
                hasRole: jest.fn().mockResolvedValue(true),
                removeRole: jest.fn().mockResolvedValue(true),
            };
            User.findByPk.mockResolvedValueOnce({
                id: ADMIN_UUID,
                roles: [{ name: 'admin', permissions: [{ resource: 'users', action: 'manage' }] }],
            });
            User.findByPk.mockResolvedValueOnce(mockUser);
            Role.findByPk.mockResolvedValue({ id: ROLE_UUID, name: 'editor' });

            const res = await request(app)
                .post('/api/roles/remove')
                .set('Authorization', `Bearer ${token}`)
                .send({ userId: USER_UUID, roleId: ROLE_UUID });

            expect(res.status).toBe(200);
        });
    });
});
