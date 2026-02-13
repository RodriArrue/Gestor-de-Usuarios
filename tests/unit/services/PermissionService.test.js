jest.mock('../../../src/models', () => {
    const mockPermission = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };
    const mockRole = {
        findByPk: jest.fn(),
    };
    return { Permission: mockPermission, Role: mockRole };
});

const { Permission, Role } = require('../../../src/models');
const PermissionService = require('../../../src/services/PermissionService');

describe('PermissionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // getAllPermissions
    // =============================================
    describe('getAllPermissions', () => {
        it('debe retornar todos los permisos', async () => {
            const mockPermissions = [
                { id: 'p1', name: 'users.create', resource: 'users', action: 'create' },
                { id: 'p2', name: 'users.read', resource: 'users', action: 'read' },
            ];
            Permission.findAll.mockResolvedValue(mockPermissions);

            const result = await PermissionService.getAllPermissions();

            expect(result).toHaveLength(2);
            expect(Permission.findAll).toHaveBeenCalledTimes(1);
        });
    });

    // =============================================
    // getPermissionById
    // =============================================
    describe('getPermissionById', () => {
        it('debe retornar un permiso por ID', async () => {
            const mockPermission = {
                id: 'p1',
                name: 'users.create',
                resource: 'users',
                action: 'create',
                roles: [],
            };
            Permission.findByPk.mockResolvedValue(mockPermission);

            const result = await PermissionService.getPermissionById('p1');

            expect(result.name).toBe('users.create');
        });

        it('debe lanzar error si el permiso no existe', async () => {
            Permission.findByPk.mockResolvedValue(null);

            await expect(PermissionService.getPermissionById('no-existe'))
                .rejects.toThrow('Permiso no encontrado');
        });
    });

    // =============================================
    // createPermission
    // =============================================
    describe('createPermission', () => {
        it('debe crear un permiso exitosamente', async () => {
            Permission.findOne.mockResolvedValueOnce(null); // nombre no existe
            Permission.findOne.mockResolvedValueOnce(null); // resource+action no existe

            const mockPermission = {
                id: 'p-new',
                name: 'posts.create',
                resource: 'posts',
                action: 'create',
            };
            Permission.create.mockResolvedValue(mockPermission);

            const result = await PermissionService.createPermission({
                name: 'posts.create',
                description: 'Crear posts',
                resource: 'posts',
                action: 'create',
            });

            expect(result.name).toBe('posts.create');
            expect(Permission.create).toHaveBeenCalledTimes(1);
        });

        it('debe lanzar error si el nombre ya existe', async () => {
            Permission.findOne.mockResolvedValueOnce({ id: 'existing' });

            await expect(PermissionService.createPermission({
                name: 'users.create',
                resource: 'users',
                action: 'create',
            })).rejects.toThrow('Ya existe un permiso con ese nombre');
        });

        it('debe lanzar error si la combinación resource/action ya existe', async () => {
            Permission.findOne.mockResolvedValueOnce(null); // nombre no existe
            Permission.findOne.mockResolvedValueOnce({ id: 'existing' }); // resource+action existe

            await expect(PermissionService.createPermission({
                name: 'new.permission',
                resource: 'users',
                action: 'create',
            })).rejects.toThrow('Ya existe un permiso para create sobre users');
        });
    });

    // =============================================
    // updatePermission
    // =============================================
    describe('updatePermission', () => {
        it('debe actualizar un permiso exitosamente', async () => {
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

            const result = await PermissionService.updatePermission('p1', {
                description: 'Updated description',
            });

            expect(mockPermission.update).toHaveBeenCalled();
        });

        it('debe lanzar error si el nuevo nombre ya existe', async () => {
            const mockPermission = {
                id: 'p1',
                name: 'users.create',
                resource: 'users',
                action: 'create',
                roles: [],
            };
            Permission.findByPk.mockResolvedValue(mockPermission);
            Permission.findOne.mockResolvedValue({ id: 'p2', name: 'users.read' });

            await expect(PermissionService.updatePermission('p1', { name: 'users.read' }))
                .rejects.toThrow('Ya existe un permiso con ese nombre');
        });
    });

    // =============================================
    // deletePermission
    // =============================================
    describe('deletePermission', () => {
        it('debe eliminar un permiso exitosamente', async () => {
            const mockPermission = {
                id: 'p1',
                name: 'temp.perm',
                roles: [],
                destroy: jest.fn().mockResolvedValue(true),
            };
            Permission.findByPk.mockResolvedValue(mockPermission);

            const result = await PermissionService.deletePermission('p1');

            expect(result.message).toBe('Permiso eliminado exitosamente');
            expect(mockPermission.destroy).toHaveBeenCalled();
        });
    });

    // =============================================
    // assignPermissionToRole
    // =============================================
    describe('assignPermissionToRole', () => {
        it('debe asignar un permiso a un rol exitosamente', async () => {
            const mockRole = {
                id: 'r1',
                name: 'admin',
                hasPermission: jest.fn().mockResolvedValue(false),
                addPermission: jest.fn().mockResolvedValue(true),
            };
            const mockPermission = {
                id: 'p1',
                name: 'users.create',
                resource: 'users',
                action: 'create',
            };

            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findByPk.mockResolvedValue(mockPermission);

            const result = await PermissionService.assignPermissionToRole('r1', 'p1');

            expect(result.message).toBe('Permiso asignado exitosamente');
            expect(mockRole.addPermission).toHaveBeenCalledWith(mockPermission);
        });

        it('debe lanzar error si el rol no existe', async () => {
            Role.findByPk.mockResolvedValue(null);

            await expect(PermissionService.assignPermissionToRole('no-role', 'p1'))
                .rejects.toThrow('Rol no encontrado');
        });

        it('debe lanzar error si el permiso no existe', async () => {
            Role.findByPk.mockResolvedValue({ id: 'r1' });
            Permission.findByPk.mockResolvedValue(null);

            await expect(PermissionService.assignPermissionToRole('r1', 'no-perm'))
                .rejects.toThrow('Permiso no encontrado');
        });

        it('debe lanzar error si el rol ya tiene el permiso', async () => {
            const mockRole = {
                id: 'r1',
                hasPermission: jest.fn().mockResolvedValue(true),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findByPk.mockResolvedValue({ id: 'p1' });

            await expect(PermissionService.assignPermissionToRole('r1', 'p1'))
                .rejects.toThrow('El rol ya tiene este permiso asignado');
        });
    });

    // =============================================
    // removePermissionFromRole
    // =============================================
    describe('removePermissionFromRole', () => {
        it('debe remover un permiso de un rol exitosamente', async () => {
            const mockRole = {
                id: 'r1',
                name: 'admin',
                hasPermission: jest.fn().mockResolvedValue(true),
                removePermission: jest.fn().mockResolvedValue(true),
            };
            const mockPermission = { id: 'p1', name: 'users.create' };

            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findByPk.mockResolvedValue(mockPermission);

            const result = await PermissionService.removePermissionFromRole('r1', 'p1');

            expect(result.message).toBe('Permiso removido exitosamente');
        });

        it('debe lanzar error si el rol no tiene el permiso', async () => {
            const mockRole = {
                id: 'r1',
                hasPermission: jest.fn().mockResolvedValue(false),
            };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findByPk.mockResolvedValue({ id: 'p1' });

            await expect(PermissionService.removePermissionFromRole('r1', 'p1'))
                .rejects.toThrow('El rol no tiene este permiso asignado');
        });
    });

    // =============================================
    // getRolePermissions
    // =============================================
    describe('getRolePermissions', () => {
        it('debe retornar los permisos de un rol', async () => {
            const mockRole = {
                id: 'r1',
                permissions: [
                    { id: 'p1', name: 'users.create' },
                    { id: 'p2', name: 'users.read' },
                ],
            };
            Role.findByPk.mockResolvedValue(mockRole);

            const result = await PermissionService.getRolePermissions('r1');

            expect(result).toHaveLength(2);
        });

        it('debe lanzar error si el rol no existe', async () => {
            Role.findByPk.mockResolvedValue(null);

            await expect(PermissionService.getRolePermissions('no-role'))
                .rejects.toThrow('Rol no encontrado');
        });
    });

    // =============================================
    // assignMultiplePermissionsToRole
    // =============================================
    describe('assignMultiplePermissionsToRole', () => {
        it('debe asignar múltiples permisos exitosamente', async () => {
            const mockRole = {
                id: 'r1',
                name: 'admin',
                setPermissions: jest.fn().mockResolvedValue(true),
            };
            const mockPermissions = [
                { id: 'p1', name: 'users.create', resource: 'users', action: 'create' },
                { id: 'p2', name: 'users.read', resource: 'users', action: 'read' },
            ];

            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findAll.mockResolvedValue(mockPermissions);

            const result = await PermissionService.assignMultiplePermissionsToRole(
                'r1', ['p1', 'p2']
            );

            expect(result.message).toBe('Permisos asignados exitosamente');
            expect(result.permissions).toHaveLength(2);
            expect(mockRole.setPermissions).toHaveBeenCalledWith(mockPermissions);
        });

        it('debe lanzar error si el rol no existe', async () => {
            Role.findByPk.mockResolvedValue(null);

            await expect(PermissionService.assignMultiplePermissionsToRole('no-role', ['p1']))
                .rejects.toThrow('Rol no encontrado');
        });

        it('debe lanzar error si algunos permisos no existen', async () => {
            const mockRole = { id: 'r1', name: 'admin' };
            Role.findByPk.mockResolvedValue(mockRole);
            Permission.findAll.mockResolvedValue([{ id: 'p1' }]); // Solo 1 de 2

            await expect(
                PermissionService.assignMultiplePermissionsToRole('r1', ['p1', 'p2'])
            ).rejects.toThrow('Algunos permisos no fueron encontrados');
        });
    });
});
