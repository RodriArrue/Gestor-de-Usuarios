const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController');
const { authMiddleware, requirePermission } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
    uuidParamSchema,
    roleIdParamSchema,
    userIdParamSchema,
    createRoleSchema,
    updateRoleSchema,
    assignRoleSchema,
} = require('../validations/role.schema');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de lectura (requieren permiso 'read' sobre 'roles')
router.get('/', requirePermission('roles', 'read'), RoleController.getAll);
router.get('/user/:userId', requirePermission('roles', 'read'), validate({ params: userIdParamSchema }), RoleController.getUserRoles);
router.get('/:id', requirePermission('roles', 'read'), validate({ params: uuidParamSchema }), RoleController.getById);
router.get('/:roleId/users', requirePermission('roles', 'read'), validate({ params: roleIdParamSchema }), RoleController.getRoleUsers);

// Rutas de escritura (requieren permisos específicos)
router.post('/', requirePermission('roles', 'create'), validate({ body: createRoleSchema }), RoleController.create);
router.put('/:id', requirePermission('roles', 'update'), validate({ params: uuidParamSchema, body: updateRoleSchema }), RoleController.update);
router.delete('/:id', requirePermission('roles', 'delete'), validate({ params: uuidParamSchema }), RoleController.delete);

// Rutas de asignación (requieren permiso 'manage' sobre 'users')
router.post('/assign', requirePermission('users', 'manage'), validate({ body: assignRoleSchema }), RoleController.assignToUser);
router.post('/remove', requirePermission('users', 'manage'), validate({ body: assignRoleSchema }), RoleController.removeFromUser);

module.exports = router;
