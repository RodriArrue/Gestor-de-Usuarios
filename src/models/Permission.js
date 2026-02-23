const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Permission = sequelize.define('Permission', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                len: [2, 100],
            },
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        resource: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Recurso al que aplica el permiso (ej: users, roles, posts)',
        },
        action: {
            type: DataTypes.ENUM('create', 'read', 'update', 'delete', 'manage'),
            allowNull: false,
            comment: 'Acción permitida sobre el recurso',
        },
    }, {
        tableName: 'permissions',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['name'] },
            { fields: ['resource'] },
            { fields: ['action'] },
            {
                unique: true,
                fields: ['resource', 'action'],
                name: 'permissions_resource_action_unique',
            },
        ],
    });

    Permission.associate = (models) => {
        // Un permiso puede pertenecer a muchos roles (Many-to-Many)
        Permission.belongsToMany(models.Role, {
            through: 'role_permissions',
            foreignKey: 'permission_id',
            otherKey: 'role_id',
            as: 'roles',
        });
    };

    return Permission;
};
