const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        employeeId: { 
            type: DataTypes.STRING, 
            allowNull: false,
            unique: true
        },
        userId: { 
            type: DataTypes.INTEGER, 
            allowNull: false 
        },
        position: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        hireDate: { 
            type: DataTypes.DATEONLY, 
            allowNull: false 
        },
        departmentId: { 
            type: DataTypes.INTEGER, 
            allowNull: false 
        },
        created: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        },
        updated: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        }
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('employee', attributes, options);
} 