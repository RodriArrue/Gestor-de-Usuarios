const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Gestor de Usuarios RBAC API',
            version: '1.0.0',
            description: 'API REST para gestión de usuarios con control de acceso basado en roles (RBAC)',
            contact: {
                name: 'Rodrigo Arrue',
                url: 'https://github.com/RodriArrue/Gestor-de-Usuarios',
            },
        },
        servers: [
            {
                url: '/api',
                description: 'API Base',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenido del endpoint /auth/login',
                },
            },
            schemas: {
                // ========== Auth ==========
                RegisterRequest: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: { type: 'string', minLength: 3, maxLength: 50, example: 'john_doe' },
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        password: { type: 'string', minLength: 6, example: 'password123' },
                        firstName: { type: 'string', maxLength: 50, example: 'John', nullable: true },
                        lastName: { type: 'string', maxLength: 50, example: 'Doe', nullable: true },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@gestordeusuarios.com' },
                        password: { type: 'string', example: 'admin123' },
                    },
                },
                ChangePasswordRequest: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: { type: 'string', example: 'oldPassword123' },
                        newPassword: { type: 'string', minLength: 6, example: 'newPassword456' },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                user: { $ref: '#/components/schemas/User' },
                                token: { type: 'string', example: 'eyJhbGciOiJIUzI1...' },
                            },
                        },
                    },
                },
                // ========== User ==========
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string', example: 'john_doe' },
                        email: { type: 'string', format: 'email' },
                        firstName: { type: 'string', nullable: true },
                        lastName: { type: 'string', nullable: true },
                        isActive: { type: 'boolean' },
                        lastLogin: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        roles: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Role' },
                        },
                    },
                },
                CreateUserRequest: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: { type: 'string', minLength: 3, maxLength: 50, example: 'new_user' },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        password: { type: 'string', minLength: 6, example: 'password123' },
                        firstName: { type: 'string', nullable: true, example: 'New' },
                        lastName: { type: 'string', nullable: true, example: 'User' },
                        roleIds: {
                            type: 'array',
                            items: { type: 'string', format: 'uuid' },
                            description: 'IDs de roles a asignar (opcional)',
                        },
                    },
                },
                UpdateUserRequest: {
                    type: 'object',
                    properties: {
                        username: { type: 'string', minLength: 3, maxLength: 50 },
                        email: { type: 'string', format: 'email' },
                        firstName: { type: 'string', nullable: true },
                        lastName: { type: 'string', nullable: true },
                    },
                },
                // ========== Role ==========
                Role: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'admin' },
                        description: { type: 'string', nullable: true },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        permissions: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Permission' },
                        },
                    },
                },
                CreateRoleRequest: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', minLength: 2, maxLength: 50, example: 'editor' },
                        description: { type: 'string', maxLength: 255, nullable: true },
                        isActive: { type: 'boolean', default: true },
                    },
                },
                UpdateRoleRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', minLength: 2, maxLength: 50 },
                        description: { type: 'string', maxLength: 255, nullable: true },
                        isActive: { type: 'boolean' },
                    },
                },
                AssignRoleRequest: {
                    type: 'object',
                    required: ['userId', 'roleId'],
                    properties: {
                        userId: { type: 'string', format: 'uuid' },
                        roleId: { type: 'string', format: 'uuid' },
                    },
                },
                // ========== Permission ==========
                Permission: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'users.create' },
                        description: { type: 'string', nullable: true },
                        resource: { type: 'string', example: 'users' },
                        action: { type: 'string', enum: ['create', 'read', 'update', 'delete', 'manage'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                CreatePermissionRequest: {
                    type: 'object',
                    required: ['name', 'resource', 'action'],
                    properties: {
                        name: { type: 'string', minLength: 2, maxLength: 100, example: 'posts.create' },
                        description: { type: 'string', maxLength: 255, nullable: true },
                        resource: { type: 'string', maxLength: 50, example: 'posts' },
                        action: { type: 'string', enum: ['create', 'read', 'update', 'delete', 'manage'] },
                    },
                },
                UpdatePermissionRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', minLength: 2, maxLength: 100 },
                        description: { type: 'string', maxLength: 255, nullable: true },
                        resource: { type: 'string', maxLength: 50 },
                        action: { type: 'string', enum: ['create', 'read', 'update', 'delete', 'manage'] },
                    },
                },
                AssignPermissionRequest: {
                    type: 'object',
                    required: ['roleId', 'permissionId'],
                    properties: {
                        roleId: { type: 'string', format: 'uuid' },
                        permissionId: { type: 'string', format: 'uuid' },
                    },
                },
                BulkAssignPermissionsRequest: {
                    type: 'object',
                    required: ['permissionIds'],
                    properties: {
                        permissionIds: {
                            type: 'array',
                            items: { type: 'string', format: 'uuid' },
                            minItems: 1,
                        },
                    },
                },
                // ========== Common ==========
                Pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer', example: 50 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 5 },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error de validación' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
            parameters: {
                UuidParam: {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'string', format: 'uuid' },
                    description: 'UUID del recurso',
                },
                PageParam: {
                    in: 'query',
                    name: 'page',
                    schema: { type: 'integer', default: 1 },
                    description: 'Número de página',
                },
                LimitParam: {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'integer', default: 10 },
                    description: 'Resultados por página',
                },
                SearchParam: {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string' },
                    description: 'Término de búsqueda',
                },
            },
        },
        // ===================================================
        // PATHS - Todos los endpoints de la API
        // ===================================================
        paths: {
            // ==================== AUTH ====================
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Registrar nuevo usuario',
                    description: 'Crea una cuenta de usuario con rol "user" por defecto. Rate limit: 10 req/15min.',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
                    },
                    responses: {
                        201: { description: 'Usuario registrado exitosamente', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
                        400: { description: 'Error de validación', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                        409: { description: 'Email o username ya registrado' },
                        429: { description: 'Demasiadas solicitudes' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Iniciar sesión',
                    description: 'Autentica un usuario y retorna un token JWT. Rate limit: 10 req/15min.',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
                    },
                    responses: {
                        200: { description: 'Inicio de sesión exitoso', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
                        400: { description: 'Error de validación' },
                        401: { description: 'Credenciales inválidas o usuario desactivado' },
                        429: { description: 'Demasiadas solicitudes' },
                    },
                },
            },
            '/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Obtener perfil del usuario autenticado',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Perfil del usuario',
                            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' } } } } },
                        },
                        401: { description: 'Token inválido o no proporcionado' },
                    },
                },
            },
            '/auth/change-password': {
                patch: {
                    tags: ['Auth'],
                    summary: 'Cambiar contraseña',
                    description: 'Permite al usuario autenticado cambiar su contraseña verificando la actual.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
                    },
                    responses: {
                        200: { description: 'Contraseña actualizada correctamente' },
                        400: { description: 'Error de validación' },
                        401: { description: 'Contraseña actual incorrecta o token inválido' },
                    },
                },
            },
            // ==================== USERS ====================
            '/users': {
                get: {
                    tags: ['Users'],
                    summary: 'Listar usuarios (paginado)',
                    description: 'Requiere permiso `users:read`.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { $ref: '#/components/parameters/PageParam' },
                        { $ref: '#/components/parameters/LimitParam' },
                        { $ref: '#/components/parameters/SearchParam' },
                        { in: 'query', name: 'includeInactive', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Incluir usuarios desactivados' },
                    ],
                    responses: {
                        200: {
                            description: 'Lista de usuarios',
                            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/User' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } },
                        },
                        401: { description: 'No autenticado' },
                        403: { description: 'Sin permisos' },
                    },
                },
                post: {
                    tags: ['Users'],
                    summary: 'Crear usuario (admin)',
                    description: 'Requiere permiso `users:create`.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } },
                    },
                    responses: {
                        201: { description: 'Usuario creado' },
                        400: { description: 'Error de validación' },
                        409: { description: 'Email o username ya existe' },
                    },
                },
            },
            '/users/{id}': {
                get: {
                    tags: ['Users'],
                    summary: 'Obtener usuario por ID',
                    description: 'Requiere permiso `users:read`.',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    responses: {
                        200: { description: 'Datos del usuario', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' } } } } } },
                        404: { description: 'Usuario no encontrado' },
                    },
                },
                put: {
                    tags: ['Users'],
                    summary: 'Actualizar usuario',
                    description: 'Requiere permiso `users:update`. Permite actualizar username, email, firstName, lastName.',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } } },
                    },
                    responses: {
                        200: { description: 'Usuario actualizado' },
                        400: { description: 'Error de validación' },
                        404: { description: 'Usuario no encontrado' },
                        409: { description: 'Email o username ya existe' },
                    },
                },
            },
            '/users/{id}/deactivate': {
                patch: {
                    tags: ['Users'],
                    summary: 'Desactivar usuario (soft delete)',
                    description: 'Requiere permiso `users:delete`. No puedes desactivarte a ti mismo.',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    responses: {
                        200: { description: 'Usuario desactivado' },
                        400: { description: 'No puedes desactivarte a ti mismo / Ya está desactivado' },
                        404: { description: 'Usuario no encontrado' },
                    },
                },
            },
            '/users/{id}/reactivate': {
                patch: {
                    tags: ['Users'],
                    summary: 'Reactivar usuario',
                    description: 'Requiere permiso `users:update`.',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    responses: {
                        200: { description: 'Usuario reactivado' },
                        400: { description: 'El usuario ya está activo' },
                        404: { description: 'Usuario no encontrado' },
                    },
                },
            },
            // ==================== ROLES ====================
            '/roles': {
                get: {
                    tags: ['Roles'],
                    summary: 'Listar roles (paginado)',
                    description: 'Requiere permiso `roles:read`.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { $ref: '#/components/parameters/PageParam' },
                        { $ref: '#/components/parameters/LimitParam' },
                        { $ref: '#/components/parameters/SearchParam' },
                    ],
                    responses: {
                        200: {
                            description: 'Lista de roles',
                            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Role' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } },
                        },
                    },
                },
                post: {
                    tags: ['Roles'],
                    summary: 'Crear rol',
                    description: 'Requiere permiso `roles:create`.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRoleRequest' } } },
                    },
                    responses: {
                        201: { description: 'Rol creado' },
                        409: { description: 'Nombre de rol ya existe' },
                    },
                },
            },
            '/roles/{id}': {
                get: {
                    tags: ['Roles'],
                    summary: 'Obtener rol por ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    responses: {
                        200: { description: 'Datos del rol' },
                        404: { description: 'Rol no encontrado' },
                    },
                },
                put: {
                    tags: ['Roles'],
                    summary: 'Actualizar rol',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateRoleRequest' } } },
                    },
                    responses: {
                        200: { description: 'Rol actualizado' },
                        409: { description: 'Nombre ya existe' },
                    },
                },
                delete: {
                    tags: ['Roles'],
                    summary: 'Eliminar rol',
                    description: 'Requiere permiso `roles:delete`.',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    responses: {
                        200: { description: 'Rol eliminado' },
                        404: { description: 'Rol no encontrado' },
                    },
                },
            },
            '/roles/user/{userId}': {
                get: {
                    tags: ['Roles'],
                    summary: 'Obtener roles de un usuario',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string', format: 'uuid' } }],
                    responses: {
                        200: { description: 'Lista de roles del usuario' },
                        404: { description: 'Usuario no encontrado' },
                    },
                },
            },
            '/roles/{roleId}/users': {
                get: {
                    tags: ['Roles'],
                    summary: 'Obtener usuarios con un rol específico',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string', format: 'uuid' } }],
                    responses: {
                        200: { description: 'Lista de usuarios con el rol' },
                        404: { description: 'Rol no encontrado' },
                    },
                },
            },
            '/roles/assign': {
                post: {
                    tags: ['Roles'],
                    summary: 'Asignar rol a un usuario',
                    description: 'Requiere permiso `users:manage`.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignRoleRequest' } } },
                    },
                    responses: {
                        200: { description: 'Rol asignado' },
                        404: { description: 'Usuario o rol no encontrado' },
                        409: { description: 'El usuario ya tiene este rol' },
                    },
                },
            },
            '/roles/remove': {
                post: {
                    tags: ['Roles'],
                    summary: 'Remover rol de un usuario',
                    description: 'Requiere permiso `users:manage`.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignRoleRequest' } } },
                    },
                    responses: {
                        200: { description: 'Rol removido' },
                        404: { description: 'Usuario o rol no encontrado' },
                        409: { description: 'El usuario no tiene este rol' },
                    },
                },
            },
            // ==================== PERMISSIONS ====================
            '/permissions': {
                get: {
                    tags: ['Permissions'],
                    summary: 'Listar permisos (paginado)',
                    description: 'Requiere permiso `permissions:read`.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { $ref: '#/components/parameters/PageParam' },
                        { $ref: '#/components/parameters/LimitParam' },
                        { $ref: '#/components/parameters/SearchParam' },
                    ],
                    responses: {
                        200: {
                            description: 'Lista de permisos',
                            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Permission' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } },
                        },
                    },
                },
                post: {
                    tags: ['Permissions'],
                    summary: 'Crear permiso',
                    description: 'Requiere permiso `permissions:create`.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePermissionRequest' } } },
                    },
                    responses: {
                        201: { description: 'Permiso creado' },
                        409: { description: 'Nombre o combinación resource/action ya existe' },
                    },
                },
            },
            '/permissions/{id}': {
                get: {
                    tags: ['Permissions'],
                    summary: 'Obtener permiso por ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    responses: {
                        200: { description: 'Datos del permiso' },
                        404: { description: 'Permiso no encontrado' },
                    },
                },
                put: {
                    tags: ['Permissions'],
                    summary: 'Actualizar permiso',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePermissionRequest' } } },
                    },
                    responses: {
                        200: { description: 'Permiso actualizado' },
                        409: { description: 'Nombre o combinación ya existe' },
                    },
                },
                delete: {
                    tags: ['Permissions'],
                    summary: 'Eliminar permiso',
                    description: 'Requiere permiso `permissions:delete`.',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/UuidParam' }],
                    responses: {
                        200: { description: 'Permiso eliminado' },
                        404: { description: 'Permiso no encontrado' },
                    },
                },
            },
            '/permissions/role/{roleId}': {
                get: {
                    tags: ['Permissions'],
                    summary: 'Obtener permisos de un rol',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string', format: 'uuid' } }],
                    responses: {
                        200: { description: 'Lista de permisos del rol' },
                        404: { description: 'Rol no encontrado' },
                    },
                },
            },
            '/permissions/assign': {
                post: {
                    tags: ['Permissions'],
                    summary: 'Asignar permiso a un rol',
                    description: 'Requiere permiso `roles:manage`.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignPermissionRequest' } } },
                    },
                    responses: {
                        200: { description: 'Permiso asignado' },
                        404: { description: 'Rol o permiso no encontrado' },
                        409: { description: 'El rol ya tiene este permiso' },
                    },
                },
            },
            '/permissions/remove': {
                post: {
                    tags: ['Permissions'],
                    summary: 'Remover permiso de un rol',
                    description: 'Requiere permiso `roles:manage`.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignPermissionRequest' } } },
                    },
                    responses: {
                        200: { description: 'Permiso removido' },
                        404: { description: 'Rol o permiso no encontrado' },
                        409: { description: 'El rol no tiene este permiso' },
                    },
                },
            },
            '/permissions/role/{roleId}/bulk': {
                post: {
                    tags: ['Permissions'],
                    summary: 'Asignar múltiples permisos a un rol',
                    description: 'Requiere permiso `roles:manage`. Reemplaza los permisos actuales del rol.',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'roleId', required: true, schema: { type: 'string', format: 'uuid' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkAssignPermissionsRequest' } } },
                    },
                    responses: {
                        200: { description: 'Permisos asignados' },
                        400: { description: 'Algunos permisos no encontrados' },
                        404: { description: 'Rol no encontrado' },
                    },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Autenticación y gestión de cuenta' },
            { name: 'Users', description: 'Gestión de usuarios (requiere autenticación)' },
            { name: 'Roles', description: 'Gestión de roles (requiere autenticación)' },
            { name: 'Permissions', description: 'Gestión de permisos (requiere autenticación)' },
        ],
    },
    apis: [], // No usamos JSDoc comments, toda la spec está inline
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
