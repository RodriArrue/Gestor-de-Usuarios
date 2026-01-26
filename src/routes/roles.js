const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de lectura (requieren permiso 'read' sobre 'roles')
router.get('/', requirePermission('roles', 'read'), RoleController.getAll);
router.get('/user/:userId', requirePermission('roles', 'read'), RoleController.getUserRoles);
router.get('/:id', requirePermission('roles', 'read'), RoleController.getById);
router.get('/:roleId/users', requirePermission('roles', 'read'), RoleController.getRoleUsers);

// Rutas de escritura (requieren permisos específicos)
router.post('/', requirePermission('roles', 'create'), RoleController.create);
router.put('/:id', requirePermission('roles', 'update'), RoleController.update);
router.delete('/:id', requirePermission('roles', 'delete'), RoleController.delete);

// Rutas de asignación (requieren permiso 'manage' sobre 'users')
router.post('/assign', requirePermission('users', 'manage'), RoleController.assignToUser);
router.post('/remove', requirePermission('users', 'manage'), RoleController.removeFromUser);

module.exports = router;
