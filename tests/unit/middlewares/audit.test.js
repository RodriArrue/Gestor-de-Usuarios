// Mock del modelo AuditLog
jest.mock('../../../src/models', () => {
    const mockAuditLog = {
        create: jest.fn().mockResolvedValue(true),
    };
    return { AuditLog: mockAuditLog };
});

const { AuditLog } = require('../../../src/models');
const { auditMiddleware } = require('../../../src/middlewares/audit');

// Helpers
const mockRequest = (overrides = {}) => ({
    path: '/api/users',
    originalUrl: '/api/users',
    method: 'GET',
    headers: { 'user-agent': 'jest-test-agent' },
    body: {},
    ip: '127.0.0.1',
    user: null,
    connection: { remoteAddress: '127.0.0.1' },
    ...overrides,
});

const mockResponse = () => {
    const res = {};
    res.statusCode = 200;
    res.json = jest.fn().mockImplementation(function (data) {
        return data;
    });
    return res;
};

const mockNext = () => jest.fn();

describe('Audit Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // Rutas excluidas
    // =============================================
    describe('Rutas excluidas', () => {
        it('debe excluir /health', async () => {
            const req = mockRequest({ path: '/health' });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            // No debe haber interceptado res.json
            expect(typeof res.json).toBe('function');
        });

        it('debe excluir la ruta raíz /', async () => {
            const req = mockRequest({ path: '/' });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('debe excluir /favicon.ico', async () => {
            const req = mockRequest({ path: '/favicon.ico' });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    // =============================================
    // Interceptación de requests
    // =============================================
    describe('Interceptación y logging', () => {
        it('debe interceptar requests normales y crear un log', async () => {
            const req = mockRequest({
                path: '/api/users',
                method: 'POST',
                body: { username: 'test', email: 'test@test.com' },
            });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();

            // Simular que la ruta responde
            res.statusCode = 201;
            res.json({ success: true });

            expect(AuditLog.create).toHaveBeenCalledTimes(1);
            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.action).toBe('CREATE');
            expect(logData.resource).toBe('/api/users');
            expect(logData.method).toBe('POST');
            expect(logData.statusCode).toBe(201);
        });

        it('debe mapear GET a READ', async () => {
            const req = mockRequest({ method: 'GET' });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.action).toBe('READ');
        });

        it('debe mapear PUT a UPDATE', async () => {
            const req = mockRequest({ method: 'PUT' });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.action).toBe('UPDATE');
        });

        it('debe mapear PATCH a UPDATE', async () => {
            const req = mockRequest({ method: 'PATCH' });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.action).toBe('UPDATE');
        });

        it('debe mapear DELETE a DELETE', async () => {
            const req = mockRequest({ method: 'DELETE' });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.action).toBe('DELETE');
        });
    });

    // =============================================
    // Sanitización de body
    // =============================================
    describe('Sanitización de campos sensibles', () => {
        it('debe redactar el campo password del body', async () => {
            const req = mockRequest({
                body: { username: 'test', password: 'secret123' },
            });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.requestBody.password).toBe('[REDACTED]');
            expect(logData.requestBody.username).toBe('test');
        });

        it('debe redactar múltiples campos sensibles', async () => {
            const req = mockRequest({
                body: { token: 'my-token', secret: 'my-secret', name: 'visible' },
            });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.requestBody.token).toBe('[REDACTED]');
            expect(logData.requestBody.secret).toBe('[REDACTED]');
            expect(logData.requestBody.name).toBe('visible');
        });
    });

    // =============================================
    // Extracción de UUID
    // =============================================
    describe('Extracción de resourceId', () => {
        it('debe extraer UUID de la URL', async () => {
            const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const req = mockRequest({
                originalUrl: `/api/users/${uuid}`,
            });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.resourceId).toBe(uuid);
        });

        it('debe retornar null si no hay UUID en la URL', async () => {
            const req = mockRequest({ originalUrl: '/api/users' });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.resourceId).toBeNull();
        });
    });

    // =============================================
    // UserId del usuario autenticado
    // =============================================
    describe('UserId', () => {
        it('debe incluir userId si el usuario está autenticado', async () => {
            const req = mockRequest({
                user: { id: 'auth-user-uuid' },
            });
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.userId).toBe('auth-user-uuid');
        });

        it('debe tener userId null si no hay usuario autenticado', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await auditMiddleware(req, res, next);
            res.json({});

            const logData = AuditLog.create.mock.calls[0][0];
            expect(logData.userId).toBeNull();
        });
    });
});
