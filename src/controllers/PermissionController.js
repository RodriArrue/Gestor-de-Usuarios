const PermissionService = require('../services/PermissionService');

class PermissionController {
    /**
     * GET /api/permissions
     * Obtener todos los permisos
     */
    async getAll(req, res, next) {
        try {
            const permissions = await PermissionService.getAllPermissions();

            res.status(200).json({
                success: true,
                data: permissions,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/permissions/:id
     * Obtener permiso por ID
     */
    async getById(req, res, next) {
        try {
            const permission = await PermissionService.getPermissionById(req.params.id);

            res.status(200).json({
                success: true,
                data: permission,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/permissions
     * Crear un nuevo permiso
     */
    async create(req, res, next) {
        try {
            const { name, description, resource, action } = req.body;

            const permission = await PermissionService.createPermission({
                name,
                description,
                resource,
                action,
            });

            res.status(201).json({
                success: true,
                message: 'Permiso creado exitosamente',
                data: permission,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/permissions/:id
     * Actualizar un permiso
     */
    async update(req, res, next) {
        try {
            const { name, description, resource, action } = req.body;

            const permission = await PermissionService.updatePermission(req.params.id, {
                name,
                description,
                resource,
                action,
            });

            res.status(200).json({
                success: true,
                message: 'Permiso actualizado exitosamente',
                data: permission,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/permissions/:id
     * Eliminar un permiso
     */
    async delete(req, res, next) {
        try {
            const result = await PermissionService.deletePermission(req.params.id);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/permissions/assign
     * Asignar permiso a un rol
     */
    async assignToRole(req, res, next) {
        try {
            const { roleId, permissionId } = req.body;

            const result = await PermissionService.assignPermissionToRole(roleId, permissionId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/permissions/remove
     * Remover permiso de un rol
     */
    async removeFromRole(req, res, next) {
        try {
            const { roleId, permissionId } = req.body;

            const result = await PermissionService.removePermissionFromRole(roleId, permissionId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/permissions/role/:roleId
     * Obtener permisos de un rol
     */
    async getRolePermissions(req, res, next) {
        try {
            const permissions = await PermissionService.getRolePermissions(req.params.roleId);

            res.status(200).json({
                success: true,
                data: permissions,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/permissions/role/:roleId/bulk
     * Asignar múltiples permisos a un rol
     */
    async assignBulkToRole(req, res, next) {
        try {
            const { roleId } = req.params;
            const { permissionIds } = req.body;

            const result = await PermissionService.assignMultiplePermissionsToRole(
                roleId,
                permissionIds
            );

            res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PermissionController();
