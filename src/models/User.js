const { DataTypes } = require('sequelize');
const dbInstance = require('../config/db');

/**
 * SystemAccount Entity
 * Represents operators within the dashboard application.
 * Users are categorized into explicit roles to drive access policies.
 */
const SystemAccount = dbInstance.define('SystemAccount', {
    accountId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'id' // Maps JS 'accountId' to DB 'id'
    },
    operatorName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'username'
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'A syntactically valid email address is required.' },
        },
        field: 'email'
    },
    secureSecret: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password'
    },
    assignedRole: {
        type: DataTypes.ENUM('Viewer', 'Analyst', 'Admin'),
        defaultValue: 'Viewer',
        field: 'role',
        comment: 'Determines the level of operational clearance'
    },
    accountState: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
        field: 'status'
    },
}, {
    tableName: 'Users', // Keep table name intact so existing DB doesn't break
    timestamps: true,
});

module.exports = SystemAccount;
