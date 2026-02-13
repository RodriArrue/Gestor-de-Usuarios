'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();

        await queryInterface.bulkInsert('roles', [
            {
                id: uuidv4(),
                name: 'admin',
                description: 'Administrador del sistema con acceso completo',
                is_active: true,
                created_at: now,
                updated_at: now,
            },
            {
                id: uuidv4(),
                name: 'moderator',
                description: 'Moderador con permisos de lectura y actualización',
                is_active: true,
                created_at: now,
                updated_at: now,
            },
            {
                id: uuidv4(),
                name: 'user',
                description: 'Usuario estándar con permisos básicos de lectura',
                is_active: true,
                created_at: now,
                updated_at: now,
            },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('roles', null, {});
    },
};
