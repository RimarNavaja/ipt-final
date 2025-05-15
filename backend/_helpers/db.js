const config = require('config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    // create db if it doesn't already exist
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    
    // connect to db
    const sequelize = new Sequelize(database, user, password, { 
        dialect: 'mysql',
        logging: console.log 
    });
    
    // init models and add them to the exported db object
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
    db.Workflow = require('../workflows/workflow.model')(sequelize);
    db.Request = require('../requests/request.model')(sequelize);
    db.RequestItem = require('../requests/request-item.model')(sequelize);
    db.Department = require('../departments/department.model')(sequelize);
    db.Employee = require('../employees/employee.model')(sequelize);
    
    // define relationships
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);
    
    // Request relationships
    db.Request.hasMany(db.RequestItem, { onDelete: 'CASCADE' });
    db.RequestItem.belongsTo(db.Request);
    
    // Employee and Department relationships
    // Use constraints: false to prevent Sequelize from trying to create foreign keys
    // that are already defined in the models
    db.Department.hasMany(db.Employee, { 
        foreignKey: { 
            name: 'departmentId',
            allowNull: false
        }, 
        constraints: false 
    });
    
    db.Employee.belongsTo(db.Department, { 
        foreignKey: { 
            name: 'departmentId',
            allowNull: false
        }, 
        constraints: false 
    });
    
    db.Account.hasOne(db.Employee, { 
        foreignKey: { 
            name: 'userId',
            allowNull: false
        }, 
        constraints: false 
    });
    
    db.Employee.belongsTo(db.Account, { 
        foreignKey: { 
            name: 'userId',
            allowNull: false
        }, 
        constraints: false 
    });
    
    // sync all models with database - set alter to false initially
    // this will avoid attempting to add columns that already exist
    await sequelize.sync({ alter: false });
    
    // After syncing, manually add any missing foreign key constraints if needed
    console.log("Database sync complete");
}
