const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/PermissionController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
    uuidParamSchema,
    roleIdParamSchema,
    createPermissionSchema,
    updatePermissionSchema,
    assignPermissionSchema,
    bulkAssignSchema,
} = require('../validations/permission.schema');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de lectura (requieren permiso 'read' sobre 'permissions')
router.get('/', requirePermission('permissions', 'read'), PermissionController.getAll);
router.get('/role/:roleId', requirePermission('permissions', 'read'), validate({ params: roleIdParamSchema }), PermissionController.getRolePermissions);
router.get('/:id', requirePermission('permissions', 'read'), validate({ params: uuidParamSchema }), PermissionController.getById);

// Rutas de escritura (requieren permisos específicos)
router.post('/', requirePermission('permissions', 'create'), validate({ body: createPermissionSchema }), PermissionController.create);
router.put('/:id', requirePermission('permissions', 'update'), validate({ params: uuidParamSchema, body: updatePermissionSchema }), PermissionController.update);
router.delete('/:id', requirePermission('permissions', 'delete'), validate({ params: uuidParamSchema }), PermissionController.delete);

// Rutas de asignación (requieren permiso 'manage' sobre 'roles')
router.post('/assign', requirePermission('roles', 'manage'), validate({ body: assignPermissionSchema }), PermissionController.assignToRole);
router.post('/remove', requirePermission('roles', 'manage'), validate({ body: assignPermissionSchema }), PermissionController.removeFromRole);
router.post('/role/:roleId/bulk', requirePermission('roles', 'manage'), validate({ params: roleIdParamSchema, body: bulkAssignSchema }), PermissionController.assignBulkToRole);

module.exports = router;
