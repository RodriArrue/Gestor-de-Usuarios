jest.mock('../../../src/models', () => {
    const mockRole = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };
    const mockUser = {
        findByPk: jest.fn(),
    };
    const mockPermission = {};
    return { Role: mockRole, User: mockUser, Permission: mockPermission };
});

const { Role, User } = require('../../../src/models');
const RoleService = require('../../../src/services/RoleService');

describe('RoleService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // getAllRoles
    // =============================================
    describe('getAllRoles', () => {
        it('debe retornar todos los roles', async () => {
            const mockRoles = [
                { id: 'r1', name: 'admin', permissions: [] },
                { id: 'r2', name: 'user', permissions: [] },
            ];
            Role.findAll.mockResolvedValue(mockRoles);

            const result = await RoleService.getAllRoles();

            expect(result).toHaveLength(2);
            expect(Role.findAll).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================
    // getRoleById
    // =============================================
    describe('getRoleById', () => {
        it('debe retornar un rol por ID', async () => {
            const mockRole = { id: 'r1', name: 'admin', permissions: [] };
            Role.findByPk.mockResolvedValue(mockRole);

            const result = await RoleService.getRoleById('r1');

            expect(result.name).toBe('admin');
        });

        it('debe lanzar error si el rol no existe', async () => {
            Role.findByPk.mockResolvedValue(null);

            await expect(RoleService.getRoleById('no-existe'))
                .rejects.toThrow('Rol no encontrado');
        });
    });

    // =============================================
    // createRole
    // =============================================
    describe('createRole', () => {
        it('debe crear un rol exitosamente', async () => {
            Role.findOne.mockResolvedValue(null);
            const mockRole = { id: 'r-new', name: 'editor', description: 'Editor role' };
            Role.create.mockResolvedValue(mockRole);

            const result = await RoleService.createRole({
                name: 'editor',
                description: 'Editor role',
            });

            expect(result.name).toBe('editor');
            expect(Role.create).toHaveBeenCalledTimes(1);
        });

        it('debe lanzar error si el nombre ya existe', async () => {
            Role.findOne.mockResolvedValue({ id: 'existing', name: 'admin' });

            await expect(RoleService.createRole({ name: 'admin' }))
                .rejects.toThrow('Ya existe un rol con ese nombre');
        });
    });

    // =============================================
    // updateRole
    // =============================================
    describe('updateRole', () => {
        it('debe actualizar un rol exitosamente', async () => {
            const mockRole = {
                id: 'r1',
                name: 'admin',
                description: 'old',
                isActive: true,
                permissions: [],
                update: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Role.findOne.mockResolvedValue(null); // nombre no duplicado

            const result = await RoleService.updateRole('r1', {
                name: 'superadmin',
                description: 'Updated',
            });

            expect(mockRole.update).toHaveBeenCalled();
        });

        it('debe lanzar error si el nuevo nombre ya existe', async () => {
            const mockRole = {
                id: 'r1',
                name: 'admin',
                permissions: [],
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Role.findOne.mockResolvedValue({ id: 'r2', name: 'editor' });

            await expect(RoleService.updateRole('r1', { name: 'editor' }))
                .rejects.toThrow('Ya existe un rol con ese nombre');
        });
    });

    // =============================================
    // deleteRole
    // =============================================
    describe('deleteRole', () => {
        it('debe eliminar un rol exitosamente', async () => {
            const mockRole = {
                id: 'r1',
                name: 'temp',
                permissions: [],
                destroy: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);

            const result = await RoleService.deleteRole('r1');

            expect(result.message).toBe('Rol eliminado exitosamente');
            expect(mockRole.destroy).toHaveBeenCalled();
        });
    });

    // =============================================
    // assignRoleToUser
    // =============================================
    describe('assignRoleToUser', () => {
        it('debe asignar un rol a un usuario exitosamente', async () => {
            const mockUser = {
                id: 'u1',
                username: 'user1',
                hasRole: jest.fn().mockResolvedValue(false),
                addRole: jest.fn().mockResolvedValue(true),
            };
            const mockRole = { id: 'r1', name: 'admin' };

            User.findByPk.mockResolvedValue(mockUser);
            Role.findByPk.mockResolvedValue(mockRole);

            const result = await RoleService.assignRoleToUser('u1', 'r1');

            expect(result.message).toBe('Rol asignado exitosamente');
            expect(mockUser.addRole).toHaveBeenCalledWith(mockRole);
        });

        it('debe lanzar error si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(RoleService.assignRoleToUser('no-user', 'r1'))
                .rejects.toThrow('Usuario no encontrado');
        });

        it('debe lanzar error si el rol no existe', async () => {
            User.findByPk.mockResolvedValue({ id: 'u1' });
            Role.findByPk.mockResolvedValue(null);

            await expect(RoleService.assignRoleToUser('u1', 'no-role'))
                .rejects.toThrow('Rol no encontrado');
        });

        it('debe lanzar error si el usuario ya tiene el rol', async () => {
            const mockUser = {
                id: 'u1',
                hasRole: jest.fn().mockResolvedValue(true),
            };
            User.findByPk.mockResolvedValue(mockUser);
            Role.findByPk.mockResolvedValue({ id: 'r1', name: 'admin' });

            await expect(RoleService.assignRoleToUser('u1', 'r1'))
                .rejects.toThrow('El usuario ya tiene este rol asignado');
        });
    });

    // =============================================
    // removeRoleFromUser
    // =============================================
    describe('removeRoleFromUser', () => {
        it('debe remover un rol de un usuario exitosamente', async () => {
            const mockUser = {
                id: 'u1',
                username: 'user1',
                hasRole: jest.fn().mockResolvedValue(true),
                removeRole: jest.fn().mockResolvedValue(true),
            };
            const mockRole = { id: 'r1', name: 'admin' };

            User.findByPk.mockResolvedValue(mockUser);
            Role.findByPk.mockResolvedValue(mockRole);

            const result = await RoleService.removeRoleFromUser('u1', 'r1');

            expect(result.message).toBe('Rol removido exitosamente');
            expect(mockUser.removeRole).toHaveBeenCalledWith(mockRole);
        });

        it('debe lanzar error si el usuario no tiene el rol', async () => {
            const mockUser = {
                id: 'u1',
                hasRole: jest.fn().mockResolvedValue(false),
            };
            User.findByPk.mockResolvedValue(mockUser);
            Role.findByPk.mockResolvedValue({ id: 'r1', name: 'admin' });

            await expect(RoleService.removeRoleFromUser('u1', 'r1'))
                .rejects.toThrow('El usuario no tiene este rol asignado');
        });
    });

    // =============================================
    // getUserRoles
    // =============================================
    describe('getUserRoles', () => {
        it('debe retornar los roles de un usuario', async () => {
            const mockUser = {
                id: 'u1',
                roles: [
                    { id: 'r1', name: 'admin', permissions: [] },
                    { id: 'r2', name: 'user', permissions: [] },
                ],
            };
            User.findByPk.mockResolvedValue(mockUser);

            const result = await RoleService.getUserRoles('u1');

            expect(result).toHaveLength(2);
        });

        it('debe lanzar error si el usuario no existe', async () => {
            User.findByPk.mockResolvedValue(null);

            await expect(RoleService.getUserRoles('no-existe'))
                .rejects.toThrow('Usuario no encontrado');
        });
    });

    // =============================================
    // getRoleUsers
    // =============================================
    describe('getRoleUsers', () => {
        it('debe retornar los usuarios con un rol específico', async () => {
            const mockRole = {
                id: 'r1',
                users: [
                    { id: 'u1', username: 'user1' },
                    { id: 'u2', username: 'user2' },
                ],
            };
            Role.findByPk.mockResolvedValue(mockRole);

            const result = await RoleService.getRoleUsers('r1');

            expect(result).toHaveLength(2);
        });

        it('debe lanzar error si el rol no existe', async () => {
            Role.findByPk.mockResolvedValue(null);

            await expect(RoleService.getRoleUsers('no-role'))
                .rejects.toThrow('Rol no encontrado');
        });
    });
});
