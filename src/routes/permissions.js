const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/PermissionController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de lectura (requieren permiso 'read' sobre 'permissions')
router.get('/', requirePermission('permissions', 'read'), PermissionController.getAll);
router.get('/role/:roleId', requirePermission('permissions', 'read'), PermissionController.getRolePermissions);
router.get('/:id', requirePermission('permissions', 'read'), PermissionController.getById);

// Rutas de escritura (requieren permisos específicos)
router.post('/', requirePermission('permissions', 'create'), PermissionController.create);
router.put('/:id', requirePermission('permissions', 'update'), PermissionController.update);
router.delete('/:id', requirePermission('permissions', 'delete'), PermissionController.delete);

// Rutas de asignación (requieren permiso 'manage' sobre 'roles')
router.post('/assign', requirePermission('roles', 'manage'), PermissionController.assignToRole);
router.post('/remove', requirePermission('roles', 'manage'), PermissionController.removeFromRole);
router.post('/role/:roleId/bulk', requirePermission('roles', 'manage'), PermissionController.assignBulkToRole);

module.exports = router;
