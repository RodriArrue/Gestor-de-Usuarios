const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [2, 50],
            },
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    }, {
        tableName: 'roles',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['name'] },
            { fields: ['is_active'] },
        ],
    });

    Role.associate = (models) => {
        // Un rol puede pertenecer a muchos usuarios (Many-to-Many)
        Role.belongsToMany(models.User, {
            through: 'user_roles',
            foreignKey: 'role_id',
            otherKey: 'user_id',
            as: 'users',
        });

        // Un rol puede tener muchos permisos (Many-to-Many)
        Role.belongsToMany(models.Permission, {
            through: 'role_permissions',
            foreignKey: 'role_id',
            otherKey: 'permission_id',
            as: 'permissions',
        });
    };

    return Role;
};
