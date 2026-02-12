const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uuidParamSchema, createUserSchema, getUsersQuerySchema } = require('../validations/user.schema');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de lectura (requieren permiso 'read' sobre 'users')
router.get('/', requirePermission('users', 'read'), validate({ query: getUsersQuerySchema }), UserController.getAll);
router.get('/:id', requirePermission('users', 'read'), validate({ params: uuidParamSchema }), UserController.getById);

// Crear usuario (requiere permiso 'create' sobre 'users' - solo ADMIN)
router.post('/', requirePermission('users', 'create'), validate({ body: createUserSchema }), UserController.create);

// Desactivar usuario (requiere permiso 'delete' sobre 'users')
router.patch('/:id/deactivate', requirePermission('users', 'delete'), validate({ params: uuidParamSchema }), UserController.deactivate);

// Reactivar usuario (requiere permiso 'update' sobre 'users')
router.patch('/:id/reactivate', requirePermission('users', 'update'), validate({ params: uuidParamSchema }), UserController.reactivate);

module.exports = router;
