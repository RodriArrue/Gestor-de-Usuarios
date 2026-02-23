const jwt = require('jsonwebtoken');

// Mock de AuthService
jest.mock('../../../src/services/AuthService', () => ({
    verifyToken: jest.fn(),
    getUserById: jest.fn(),
}));

// Mock de models (requerido por requirePermission)
jest.mock('../../../src/models', () => {
    const mockUser = { findByPk: jest.fn() };
    const mockRole = {};
    const mockPermission = {};
    return { User: mockUser, Role: mockRole, Permission: mockPermission };
});

const AuthService = require('../../../src/services/AuthService');
const { User } = require('../../../src/models');
const { authMiddleware, requireRoles, requirePermission } = require('../../../src/middlewares/auth');
const { UnauthorizedError, ForbiddenError } = require('../../../src/errors/AppError');

// Helpers para crear mocks de req/res/next
const mockRequest = (overrides = {}) => ({
    headers: {},
    user: null,
    ...overrides,
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = () => jest.fn();

describe('Auth Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // authMiddleware
    // =============================================
    describe('authMiddleware', () => {
        it('debe llamar a next() con un token válido', async () => {
            const decoded = { id: 'uuid-123', email: 'test@test.com', username: 'test' };
            AuthService.verifyToken.mockReturnValue(decoded);

            const req = mockRequest({
                headers: { authorization: 'Bearer valid-token' },
            });
            const res = mockResponse();
            const next = mockNext();

            await authMiddleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(req.user).toEqual(decoded);
        });

        it('debe llamar a next con UnauthorizedError si no hay token', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await authMiddleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
            expect(next.mock.calls[0][0].message).toBe('Token de acceso no proporcionado');
        });

        it('debe llamar a next con UnauthorizedError si el header no empieza con Bearer', async () => {
            const req = mockRequest({
                headers: { authorization: 'Basic some-token' },
            });
            const res = mockResponse();
            const next = mockNext();

            await authMiddleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        });

        it('debe llamar a next con UnauthorizedError si el token es inválido', async () => {
            AuthService.verifyToken.mockImplementation(() => {
                throw new Error('jwt malformed');
            });

            const req = mockRequest({
                headers: { authorization: 'Bearer invalid-token' },
            });
            const res = mockResponse();
            const next = mockNext();

            await authMiddleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
            expect(next.mock.calls[0][0].message).toBe('Token inválido o expirado');
        });
    });

    // =============================================
    // requireRoles
    // =============================================
    describe('requireRoles', () => {
        it('debe llamar a next() si el usuario tiene un rol permitido', async () => {
            AuthService.getUserById.mockResolvedValue({
                id: 'uuid-123',
                roles: [{ name: 'admin' }],
            });

            const middleware = requireRoles('admin', 'superadmin');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(req.userRoles).toContain('admin');
        });

        it('debe llamar a next con ForbiddenError si el usuario no tiene roles asignados', async () => {
            AuthService.getUserById.mockResolvedValue({
                id: 'uuid-123',
                roles: [],
            });

            const middleware = requireRoles('admin');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect(next.mock.calls[0][0].message).toBe('Acceso denegado: sin roles asignados');
        });

        it('debe llamar a next con ForbiddenError si el usuario tiene un rol insuficiente', async () => {
            AuthService.getUserById.mockResolvedValue({
                id: 'uuid-123',
                roles: [{ name: 'user' }],
            });

            const middleware = requireRoles('admin', 'superadmin');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect(next.mock.calls[0][0].message).toBe('Acceso denegado: rol insuficiente');
        });

        it('debe llamar a next con error si hay un error interno', async () => {
            AuthService.getUserById.mockRejectedValue(new Error('DB Error'));

            const middleware = requireRoles('admin');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('DB Error');
        });
    });

    // =============================================
    // requirePermission
    // =============================================
    describe('requirePermission', () => {
        it('debe llamar a next() si el usuario tiene el permiso requerido', async () => {
            const mockUser = {
                id: 'uuid-123',
                roles: [{
                    name: 'admin',
                    permissions: [
                        { resource: 'users', action: 'create' },
                        { resource: 'users', action: 'read' },
                    ],
                }],
            };
            User.findByPk.mockResolvedValue(mockUser);

            const middleware = requirePermission('users', 'create');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(req.userPermissions).toBeDefined();
        });

        it('debe permitir acceso con permiso manage (wildcard de acción)', async () => {
            const mockUser = {
                id: 'uuid-123',
                roles: [{
                    name: 'admin',
                    permissions: [
                        { resource: 'users', action: 'manage' },
                    ],
                }],
            };
            User.findByPk.mockResolvedValue(mockUser);

            const middleware = requirePermission('users', 'delete');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('debe permitir acceso con super admin (* manage)', async () => {
            const mockUser = {
                id: 'uuid-123',
                roles: [{
                    name: 'superadmin',
                    permissions: [
                        { resource: '*', action: 'manage' },
                    ],
                }],
            };
            User.findByPk.mockResolvedValue(mockUser);

            const middleware = requirePermission('anything', 'delete');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('debe llamar a next con ForbiddenError si el usuario no tiene el permiso', async () => {
            const mockUser = {
                id: 'uuid-123',
                roles: [{
                    name: 'user',
                    permissions: [
                        { resource: 'users', action: 'read' },
                    ],
                }],
            };
            User.findByPk.mockResolvedValue(mockUser);

            const middleware = requirePermission('users', 'delete');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });

        it('debe llamar a next con UnauthorizedError si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);

            const middleware = requirePermission('users', 'read');
            const req = mockRequest({ user: { id: 'no-existe' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        });

        it('debe llamar a next con ForbiddenError si el usuario no tiene roles', async () => {
            const mockUser = { id: 'uuid-123', roles: [] };
            User.findByPk.mockResolvedValue(mockUser);

            const middleware = requirePermission('users', 'read');
            const req = mockRequest({ user: { id: 'uuid-123' } });
            const res = mockResponse();
            const next = mockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });
    });
});
