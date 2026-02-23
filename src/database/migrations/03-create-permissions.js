'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Crear el tipo ENUM primero
        await queryInterface.sequelize.query(
            "CREATE TYPE \"enum_permissions_action\" AS ENUM ('create', 'read', 'update', 'delete', 'manage');"
        );

        await queryInterface.createTable('permissions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            description: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            resource: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            action: {
                type: Sequelize.ENUM('create', 'read', 'update', 'delete', 'manage'),
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        await queryInterface.addIndex('permissions', ['name']);
        await queryInterface.addIndex('permissions', ['resource']);
        await queryInterface.addIndex('permissions', ['action']);
        await queryInterface.addIndex('permissions', ['resource', 'action'], {
            unique: true,
            name: 'permissions_resource_action_unique',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('permissions');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_permissions_action";');
    },
};
