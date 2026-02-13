'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('audit_logs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            action: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            resource: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            resource_id: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            method: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            status_code: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            ip_address: {
                type: Sequelize.STRING(45),
                allowNull: true,
            },
            user_agent: {
                type: Sequelize.STRING(500),
                allowNull: true,
            },
            request_body: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            response_time: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        await queryInterface.addIndex('audit_logs', ['user_id']);
        await queryInterface.addIndex('audit_logs', ['action']);
        await queryInterface.addIndex('audit_logs', ['resource']);
        await queryInterface.addIndex('audit_logs', ['created_at']);
        await queryInterface.addIndex('audit_logs', ['status_code']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('audit_logs');
    },
};
