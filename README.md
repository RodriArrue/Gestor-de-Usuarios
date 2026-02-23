# 🔐 Gestor de Usuarios — RBAC API

API REST para gestión de usuarios con sistema completo de **Control de Acceso Basado en Roles (RBAC)**, construida con Node.js, Express y PostgreSQL.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?logo=sequelize&logoColor=white)
![Jest](https://img.shields.io/badge/Tests-147%20passing-15C213?logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-Docs-85EA2D?logo=swagger&logoColor=black)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tech Stack](#-tech-stack)
- [Instalación](#-instalación)
- [Docker](#-docker)
- [Variables de Entorno](#-variables-de-entorno)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Documentación Swagger](#-documentación-swagger)
- [Tests](#-tests)
- [Estructura del Proyecto](#-estructura-del-proyecto)

---

## ✨ Características

| Feature | Descripción |
|---------|-------------|
| **Autenticación JWT** | Registro, login, perfil y cambio de contraseña |
| **RBAC Completo** | Roles y permisos granulares (`resource:action`) |
| **CRUD de Usuarios** | Crear, listar, actualizar, desactivar y reactivar |
| **Gestión de Roles** | CRUD + asignación/remoción a usuarios |
| **Gestión de Permisos** | CRUD + asignación individual y masiva a roles |
| **Validación** | Schemas Zod en todos los endpoints |
| **Error Handling** | Manejo centralizado con clases de error custom |
| **Rate Limiting** | Global (100 req/15min) + auth (10 req/15min) |
| **Auditoría** | Logging automático de todas las operaciones |
| **Paginación** | En todos los endpoints de listado con búsqueda |
| **Migraciones** | Sequelize CLI para versionado del esquema |
| **Documentación** | Swagger/OpenAPI 3.0 con 29 endpoints |
| **Docker** | Dockerfile multi-stage + docker-compose |
| **Tests** | 147 tests (unitarios + integración) |

---

## 🏗️ Arquitectura

```
Request → Rate Limiter → Auth Middleware → RBAC Middleware → Validation (Zod)
    → Controller → Service → Sequelize Model → PostgreSQL
    → Audit Middleware (logging automático)
    → Error Handler (respuestas estandarizadas)
```

**Patrón de diseño:** Controller → Service → Model (separación de responsabilidades)

- **Controllers**: Manejan HTTP request/response
- **Services**: Contienen la lógica de negocio
- **Models**: Definen la estructura de datos y relaciones
- **Middlewares**: Auth, RBAC, validación, rate limiting, auditoría, error handling

---

## 🛠️ Tech Stack

| Categoría | Tecnología |
|-----------|------------|
| Runtime | Node.js 22 |
| Framework | Express 5 |
| Base de Datos | PostgreSQL 16 |
| ORM | Sequelize 6 |
| Autenticación | JWT (jsonwebtoken) |
| Validación | Zod 4 |
| Hashing | bcryptjs |
| Rate Limiting | express-rate-limit |
| Documentación | swagger-jsdoc + swagger-ui-express |
| Testing | Jest + Supertest |
| Containerización | Docker + Docker Compose |

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/RodriArrue/Gestor-de-Usuarios.git
cd Gestor-de-Usuarios

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 4. Crear la base de datos
createdb gestor_usuarios

# 5. Ejecutar migraciones y seeders
npm run db:fresh

# 6. Iniciar el servidor
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Usuario admin por defecto

| Campo | Valor |
|-------|-------|
| Email | `admin@gestordeusuarios.com` |
| Password | `admin123` |

---

## 🐳 Docker

```bash
# Levantar todo (PostgreSQL + API)
npm run docker:up

# Ver logs
npm run docker:logs

# Ejecutar migraciones dentro del container
docker compose exec api npx sequelize-cli db:migrate
docker compose exec api npx sequelize-cli db:seed:all

# Parar todo
npm run docker:down
```

---

## 🔑 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno (`development`, `test`, `production`) | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `gestor_usuarios` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `JWT_SECRET` | Clave secreta para JWT (min. 10 caracteres) | — |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `24h` |

> Las variables se validan al iniciar la app con Zod. Si falta alguna requerida, la app falla con un mensaje descriptivo.

---

## 📡 Endpoints de la API

### Auth
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Registrar usuario | ❌ |
| `POST` | `/api/auth/login` | Iniciar sesión | ❌ |
| `GET` | `/api/auth/me` | Obtener perfil | ✅ |
| `PATCH` | `/api/auth/change-password` | Cambiar contraseña | ✅ |

### Users
| Método | Ruta | Descripción | Permiso |
|--------|------|-------------|---------|
| `GET` | `/api/users` | Listar usuarios (paginado) | `users:read` |
| `GET` | `/api/users/:id` | Obtener usuario por ID | `users:read` |
| `POST` | `/api/users` | Crear usuario | `users:create` |
| `PUT` | `/api/users/:id` | Actualizar usuario | `users:update` |
| `PATCH` | `/api/users/:id/deactivate` | Desactivar usuario | `users:delete` |
| `PATCH` | `/api/users/:id/reactivate` | Reactivar usuario | `users:update` |

### Roles
| Método | Ruta | Descripción | Permiso |
|--------|------|-------------|---------|
| `GET` | `/api/roles` | Listar roles (paginado) | `roles:read` |
| `GET` | `/api/roles/:id` | Obtener rol por ID | `roles:read` |
| `POST` | `/api/roles` | Crear rol | `roles:create` |
| `PUT` | `/api/roles/:id` | Actualizar rol | `roles:update` |
| `DELETE` | `/api/roles/:id` | Eliminar rol | `roles:delete` |
| `GET` | `/api/roles/user/:userId` | Roles de un usuario | `roles:read` |
| `GET` | `/api/roles/:roleId/users` | Usuarios con un rol | `roles:read` |
| `POST` | `/api/roles/assign` | Asignar rol a usuario | `users:manage` |
| `POST` | `/api/roles/remove` | Remover rol de usuario | `users:manage` |

### Permissions
| Método | Ruta | Descripción | Permiso |
|--------|------|-------------|---------|
| `GET` | `/api/permissions` | Listar permisos (paginado) | `permissions:read` |
| `GET` | `/api/permissions/:id` | Obtener permiso por ID | `permissions:read` |
| `POST` | `/api/permissions` | Crear permiso | `permissions:create` |
| `PUT` | `/api/permissions/:id` | Actualizar permiso | `permissions:update` |
| `DELETE` | `/api/permissions/:id` | Eliminar permiso | `permissions:delete` |
| `GET` | `/api/permissions/role/:roleId` | Permisos de un rol | `permissions:read` |
| `POST` | `/api/permissions/assign` | Asignar permiso a rol | `roles:manage` |
| `POST` | `/api/permissions/remove` | Remover permiso de rol | `roles:manage` |
| `POST` | `/api/permissions/role/:roleId/bulk` | Asignación masiva | `roles:manage` |

---

## 📖 Documentación Swagger

Con el servidor corriendo, accedé a:

```
http://localhost:3000/api-docs
```

Desde ahí podés probar todos los endpoints interactivamente. Para endpoints protegidos:

1. Hacé login con `POST /auth/login`
2. Copiá el token de la respuesta
3. Clickeá **Authorize** y pegá el token

---

## 🧪 Tests

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura (si está configurado)
npm test -- --coverage
```

**147 tests** distribuidos en:

| Suite | Tests |
|-------|-------|
| AuthService | ✅ Unit tests |
| UserService | ✅ Unit tests |
| RoleService | ✅ Unit tests |
| PermissionService | ✅ Unit tests |
| Auth Middleware | ✅ Unit tests |
| Audit Middleware | ✅ Unit tests |
| Auth Integration | ✅ Integration tests |
| Users Integration | ✅ Integration tests |
| Roles Integration | ✅ Integration tests |
| Permissions Integration | ✅ Integration tests |

---

## 📁 Estructura del Proyecto

```
src/
├── config/
│   ├── database.js          # Configuración Sequelize por entorno
│   ├── env.js               # Validación de variables de entorno (Zod)
│   ├── index.js              # Instancia de Sequelize
│   └── swagger.js            # Spec OpenAPI 3.0.3
├── controllers/
│   ├── AuthController.js
│   ├── UserController.js
│   ├── RoleController.js
│   └── PermissionController.js
├── database/
│   ├── migrations/            # 6 migraciones del esquema
│   └── seeders/               # Datos iniciales (roles, permisos, admin)
├── errors/
│   └── AppError.js            # Jerarquía de errores custom
├── middlewares/
│   ├── auth.js                # JWT + RBAC (requireRoles, requirePermission)
│   ├── audit.js               # Logging automático de operaciones
│   ├── errorHandler.js        # Manejo centralizado de errores
│   ├── rateLimiter.js         # Rate limiting global + auth
│   └── validate.js            # Middleware de validación Zod
├── models/
│   ├── index.js               # Registro de modelos y asociaciones
│   ├── User.js
│   ├── Role.js
│   ├── Permission.js
│   └── AuditLog.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── roles.js
│   └── permissions.js
├── services/
│   ├── AuthService.js
│   ├── UserService.js
│   ├── RoleService.js
│   └── PermissionService.js
├── validations/
│   ├── auth.schema.js
│   ├── user.schema.js
│   ├── role.schema.js
│   └── permission.schema.js
├── app.js                     # Express app setup
└── server.js                  # Entry point
tests/
├── integration/               # Tests de endpoints HTTP
└── unit/                      # Tests de services y middlewares
```

---

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor en modo desarrollo (nodemon) |
| `npm start` | Servidor en modo producción |
| `npm test` | Ejecutar tests |
| `npm run db:migrate` | Ejecutar migraciones |
| `npm run db:seed` | Ejecutar seeders |
| `npm run db:fresh` | Reset completo (migrate + seed) |
| `npm run db:status` | Estado de las migraciones |
| `npm run docker:up` | Levantar con Docker |
| `npm run docker:down` | Parar Docker |
| `npm run docker:logs` | Ver logs del container |

---

## 📄 Licencia

ISC

---

Desarrollado por [Rodrigo Arrue](https://github.com/RodriArrue)
