jest.mock('../../../src/models', () => {
    const mockUser = {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        findAndCountAll: jest.fn(),
        create: jest.fn(),
    };
    const mockRole = {
        findOne: jest.fn(),
        findAll: jest.fn(),
    };
    return { User: mockUser, Role: mockRole, Op: require('sequelize').Op };
});

const { User, Role } = require('../../../src/models');
const UserService = require('../../../src/services/UserService');

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // createUser
    // =============================================
    describe('createUser', () => {
        const validData = {
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'User',
        };

        it('debe crear un usuario exitosamente sin roleIds', async () => {
            User.findOne.mockResolvedValueOnce(null); // email
            User.findOne.mockResolvedValueOnce(null); // username

            const mockUser = {
                id: 'uuid-new',
                username: 'newuser',
                email: 'new@example.com',
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

            const result = await UserService.createUser(validData);

            expect(result).not.toHaveProperty('password');
            expect(User.create).toHaveBeenCalledTimes(1);
            expect(mockUser.addRole).toHaveBeenCalled();
        });

        it('debe crear un usuario con roleIds específicos', async () => {
            User.findOne.mockResolvedValueOnce(null);
            User.findOne.mockResolvedValueOnce(null);

            const mockUser = {
                id: 'uuid-new',
                username: 'newuser',
                email: 'new@example.com',
                password: 'hashed',
                addRole: jest.fn(),
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
            Role.findAll.mockResolvedValue([{ id: 'role-admin' }]);

            const result = await UserService.createUser({
                ...validData,
                roleIds: ['role-admin'],
            });

            expect(mockUser.addRoles).toHaveBeenCalled();
            expect(mockUser.addRole).not.toHaveBeenCalled();
        });

        it('debe lanzar error si el email ya existe', async () => {
            User.findOne.mockResolvedValueOnce({ id: 'existing' });

            await expect(UserService.createUser(validData))
                .rejects.toThrow('El email ya está registrado');
        });

        it('debe lanzar error si el username ya existe', async () => {
            User.findOne.mockResolvedValueOnce(null);
            User.findOne.mockResolvedValueOnce({ id: 'existing' });

            await expect(UserService.createUser(validData))
                .rejects.toThrow('El nombre de usuario ya está en uso');
        });
    });

    // =============================================
    // getAllUsers
    // =============================================
    describe('getAllUsers', () => {
        it('debe retornar usuarios con paginación', async () => {
            const mockUsers = [
                { id: 'u1', username: 'user1' },
                { id: 'u2', username: 'user2' },
            ];
            User.findAndCountAll.mockResolvedValue({
                count: 2,
                rows: mockUsers,
            });

            const result = await UserService.getAllUsers({ page: 1, limit: 10 });

            expect(result.users).toHaveLength(2);
            expect(result.pagination).toEqual({
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            });
        });

        it('debe aplicar filtro de búsqueda', async () => {
            User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await UserService.getAllUsers({ page: 1, limit: 10, search: 'test' });

            expect(User.findAndCountAll).toHaveBeenCalledTimes(1);
            const callArgs = User.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where).toBeDefined();
        });

        it('debe incluir inactivos cuando se solicita', async () => {
            User.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await UserService.getAllUsers({ page: 1, limit: 10, includeInactive: true });

            const callArgs = User.findAndCountAll.mock.calls[0][0];
            expect(callArgs.where.isActive).toBeUndefined();
        });
    });

    // =============================================
    // getUserById
    // =============================================
    describe('getUserById', () => {
        it('debe retornar el usuario por ID', async () => {
            const mockUser = { id: 'uuid-123', username: 'testuser', roles: [] };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserService.getUserById('uuid-123');

            expect(result.id).toBe('uuid-123');
        });

        it('debe lanzar error si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(UserService.getUserById('no-existe'))
                .rejects.toThrow('Usuario no encontrado');
        });
    });

    // =============================================
    // deactivateUser
    // =============================================
    describe('deactivateUser', () => {
        it('debe desactivar un usuario exitosamente', async () => {
            const mockUser = {
                id: 'uuid-target',
                username: 'targetuser',
                email: 'target@test.com',
                isActive: true,
                update: jest.fn().mockImplementation(function (data) {
                    this.isActive = data.isActive;
                    return Promise.resolve(this);
                }),
            };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserService.deactivateUser('uuid-target', 'uuid-current');

            expect(result.message).toBe('Usuario desactivado correctamente');
            expect(mockUser.update).toHaveBeenCalledWith({ isActive: false });
        });

        it('debe lanzar error al intentar auto-desactivarse', async () => {
            await expect(UserService.deactivateUser('uuid-same', 'uuid-same'))
                .rejects.toThrow('No puedes desactivarte a ti mismo');
        });

        it('debe lanzar error si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(UserService.deactivateUser('uuid-no', 'uuid-current'))
                .rejects.toThrow('Usuario no encontrado');
        });

        it('debe lanzar error si el usuario ya está desactivado', async () => {
            const mockUser = { id: 'uuid-target', isActive: false };
            User.findByPk.mockResolvedValue(mockUser);

            await expect(UserService.deactivateUser('uuid-target', 'uuid-current'))
                .rejects.toThrow('El usuario ya está desactivado');
        });
    });

    // =============================================
    // reactivateUser
    // =============================================
    describe('reactivateUser', () => {
        it('debe reactivar un usuario exitosamente', async () => {
            const mockUser = {
                id: 'uuid-target',
                username: 'targetuser',
                email: 'target@test.com',
                isActive: false,
                update: jest.fn().mockImplementation(function (data) {
                    this.isActive = data.isActive;
                    return Promise.resolve(this);
                }),
            };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await UserService.reactivateUser('uuid-target');

            expect(result.message).toBe('Usuario reactivado correctamente');
            expect(mockUser.update).toHaveBeenCalledWith({ isActive: true });
        });

        it('debe lanzar error si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(UserService.reactivateUser('no-existe'))
                .rejects.toThrow('Usuario no encontrado');
        });

        it('debe lanzar error si el usuario ya está activo', async () => {
            const mockUser = { id: 'uuid-target', isActive: true };
            User.findByPk.mockResolvedValue(mockUser);

            await expect(UserService.reactivateUser('uuid-target'))
                .rejects.toThrow('El usuario ya está activo');
        });
    });
});
