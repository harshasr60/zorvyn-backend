const { DataTypes } = require('sequelize');
const dbInstance = require('../config/db');
const SystemAccount = require('./User'); // Still requires the file 'User.js'

/**
 * FinancialLedger Entity
 * Chronicles all monetary movements (incomes & expenses) tracked by the system.
 */
const FinancialLedger = dbInstance.define('FinancialLedger', {
    ledgerId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'id'
    },
    transactionValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Transaction value cannot be negative.' }
        },
        field: 'amount'
    },
    movementType: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
        field: 'type'
    },
    classification: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'category'
    },
    executionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'date'
    },
    additionalRemarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'notes'
    },
    authorizerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: SystemAccount,
            key: 'accountId' // This maps back to the primary key of SystemAccount
        },
        field: 'createdBy'
    },
    obsolete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'isDeleted',
        comment: 'Marks entry as soft-deleted without purging the actual row'
    }
}, {
    tableName: 'Records', // Preserve table schema binding
    timestamps: true,
});

// Configure structural relationship
SystemAccount.hasMany(FinancialLedger, { foreignKey: 'authorizerId', as: 'ledgerEntries' });
FinancialLedger.belongsTo(SystemAccount, { foreignKey: 'authorizerId', as: 'author' });

module.exports = FinancialLedger;
