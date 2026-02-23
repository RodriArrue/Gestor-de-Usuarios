'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * Crea un usuario admin y le asigna el rol 'admin' con
 * todos los permisos 'manage' sobre todos los recursos.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // --- Crear usuario admin ---
        const adminId = uuidv4();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await queryInterface.bulkInsert('users', [
            {
                id: adminId,
                username: 'admin',
                email: 'admin@gestordeusuarios.com',
                password: hashedPassword,
                first_name: 'Admin',
                last_name: 'Sistema',
                is_active: true,
                created_at: now,
                updated_at: now,
            },
        ]);

        // --- Obtener rol admin ---
        const [roles] = await queryInterface.sequelize.query(
            "SELECT id FROM roles WHERE name = 'admin' LIMIT 1;"
        );

        if (roles.length === 0) {
            console.warn('⚠️  Rol admin no encontrado. Ejecuta el seeder de roles primero.');
            return;
        }

        const adminRoleId = roles[0].id;

        // --- Asignar rol admin al usuario ---
        await queryInterface.bulkInsert('user_roles', [
            {
                user_id: adminId,
                role_id: adminRoleId,
                created_at: now,
                updated_at: now,
            },
        ]);

        // --- Obtener permisos manage (wildcard) ---
        const [managePermissions] = await queryInterface.sequelize.query(
            "SELECT id FROM permissions WHERE action = 'manage';"
        );

        if (managePermissions.length === 0) {
            console.warn('⚠️  Permisos manage no encontrados. Ejecuta el seeder de permisos primero.');
            return;
        }

        // --- Asignar todos los permisos manage al rol admin ---
        const rolePermissions = managePermissions.map((perm) => ({
            role_id: adminRoleId,
            permission_id: perm.id,
            created_at: now,
            updated_at: now,
        }));

        await queryInterface.bulkInsert('role_permissions', rolePermissions);

        console.log('✅ Usuario admin creado: admin@gestordeusuarios.com / admin123');
    },

    async down(queryInterface) {
        // Eliminar en orden inverso (por FK constraints)
        await queryInterface.bulkDelete('role_permissions', null, {});
        await queryInterface.bulkDelete('user_roles', null, {});
        await queryInterface.bulkDelete('users', {
            email: 'admin@gestordeusuarios.com',
        });
    },
};
