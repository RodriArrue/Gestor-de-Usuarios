'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Permisos CRUD (+manage) para cada recurso del sistema.
 * manage = wildcard que incluye create/read/update/delete.
 */
const RESOURCES = ['users', 'roles', 'permissions'];
const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();

        const permissions = [];

        for (const resource of RESOURCES) {
            for (const action of ACTIONS) {
                permissions.push({
                    id: uuidv4(),
                    name: `${resource}.${action}`,
                    description: `Permiso para ${action} sobre ${resource}`,
                    resource,
                    action,
                    created_at: now,
                    updated_at: now,
                });
            }
        }

        await queryInterface.bulkInsert('permissions', permissions);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('permissions', null, {});
    },
};
