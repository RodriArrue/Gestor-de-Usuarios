const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de lectura (requieren permiso 'read' sobre 'users')
router.get('/', requirePermission('users', 'read'), UserController.getAll);
router.get('/:id', requirePermission('users', 'read'), UserController.getById);

// Crear usuario (requiere permiso 'create' sobre 'users' - solo ADMIN)
router.post('/', requirePermission('users', 'create'), UserController.create);

// Desactivar usuario (requiere permiso 'delete' sobre 'users')
router.patch('/:id/deactivate', requirePermission('users', 'delete'), UserController.deactivate);

// Reactivar usuario (requiere permiso 'update' sobre 'users')
router.patch('/:id/reactivate', requirePermission('users', 'update'), UserController.reactivate);

module.exports = router;
