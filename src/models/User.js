const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50],
            },
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        firstName: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'first_name',
        },
        lastName: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'last_name',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_login',
        },
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true,
        paranoid: true, // Soft delete
        indexes: [
            { fields: ['email'] },
            { fields: ['username'] },
            { fields: ['is_active'] },
        ],
    });

    User.associate = (models) => {
        // Un usuario puede tener muchos roles (Many-to-Many)
        User.belongsToMany(models.Role, {
            through: 'user_roles',
            foreignKey: 'user_id',
            otherKey: 'role_id',
            as: 'roles',
        });
    };

    return User;
};
