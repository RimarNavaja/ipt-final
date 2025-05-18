const config = require("config.js");
const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

module.exports = db = {};

initialize();

async function initialize() {
  // create db if it doesn't already exist
  const { host, port, user, password, database } = config.database;
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

  // connect to db
  const sequelize = new Sequelize(database, user, password, {
    dialect: "mysql",
    logging: console.log,
  });

  // export sequelize instance
  db.sequelize = sequelize;

  // init models and add them to the exported db object
  db.Account = require("../accounts/account.model")(sequelize);
  db.RefreshToken = require("../accounts/refresh-token.model")(sequelize);
  db.Workflow = require("../workflows/workflow.model")(sequelize);
  db.Request = require("../requests/request.model")(sequelize);
  db.RequestItem = require("../requests/request-item.model")(sequelize);
  db.Department = require("../departments/department.model")(sequelize);
  db.Employee = require("../employees/employee.model")(sequelize);

  // define relationships
  db.Account.hasMany(db.RefreshToken, { onDelete: "CASCADE" });
  db.RefreshToken.belongsTo(db.Account);

  // Request relationships
  db.Request.hasMany(db.RequestItem, { onDelete: "CASCADE" });
  db.RequestItem.belongsTo(db.Request);

  // Employee and Department relationships
  // Use constraints: false to prevent Sequelize from trying to create foreign keys
  // that are already defined in the models
  db.Department.hasMany(db.Employee, {
    foreignKey: {
      name: "departmentId",
      allowNull: false,
    },
    constraints: false,
  });

  db.Employee.belongsTo(db.Department, {
    foreignKey: {
      name: "departmentId",
      allowNull: false,
    },
    constraints: false,
  });

  db.Account.hasOne(db.Employee, {
    foreignKey: {
      name: "userId",
      allowNull: false,
    },
    constraints: false,
  });

  db.Employee.belongsTo(db.Account, {
    foreignKey: {
      name: "userId",
      allowNull: false,
    },
    constraints: false,
  });

  // Employee to Workflow and Request relationships
  db.Employee.hasMany(db.Workflow, {
    foreignKey: "employeeId",
    constraints: false,
  });
  db.Workflow.belongsTo(db.Employee, {
    foreignKey: "employeeId",
    constraints: false,
  });

  db.Employee.hasMany(db.Request, {
    foreignKey: "employeeId",
    constraints: false,
  });
  db.Request.belongsTo(db.Employee, {
    foreignKey: "employeeId",
    constraints: false,
  });

  // sync all models with database - set alter to true to update schema
  await sequelize.sync({ alter: true });

  // Create default data if needed
  await createDefaultData();

  console.log("Database sync complete");
}

// Function to create default data if it doesn't exist
async function createDefaultData() {
  try {
    // Check if departments exist
    const departmentCount = await db.Department.count();
    if (departmentCount === 0) {
      // Create default departments
      const departments = await db.Department.bulkCreate([
        {
          name: "Engineering",
          description: "Software development team",
        },
        {
          name: "Marketing",
          description: "Marketing team",
        },
      ]);
      console.log("Created default departments");
    }

    // Check if admin account exists
    let adminAccount = await db.Account.findOne({
      where: { email: "admin@example.com" },
    });
    if (!adminAccount) {
      // Create admin account
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash("admin", 10);

      adminAccount = await db.Account.create({
        title: "Mr",
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        passwordHash: passwordHash,
        role: "Admin",
        verified: new Date(),
        isActive: true,
      });
      console.log("Created admin account");
    } else {
      // Update admin account to ensure it's active
      if (!adminAccount.isActive) {
        adminAccount.isActive = true;
        await adminAccount.save();
        console.log("Updated admin account to active");
      }
    }

    // Check if default user account exists
    let userAccount = await db.Account.findOne({
      where: { email: "user@example.com" },
    });
    if (!userAccount) {
      // Create user account
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash("user", 10);

      userAccount = await db.Account.create({
        title: "Mr",
        firstName: "Normal",
        lastName: "User",
        email: "user@example.com",
        passwordHash: passwordHash,
        role: "User",
        verified: new Date(),
        isActive: true,
      });
      console.log("Created user account");
    } else {
      // Update user account to ensure it's active
      if (!userAccount.isActive) {
        userAccount.isActive = true;
        await userAccount.save();
        console.log("Updated user account to active");
      }
    }

    // Create default employees if they don't exist
    const engineeringDept = await db.Department.findOne({
      where: { name: "Engineering" },
    });
    const marketingDept = await db.Department.findOne({
      where: { name: "Marketing" },
    });

    if (engineeringDept && adminAccount) {
      const adminEmployee = await db.Employee.findOne({
        where: { userId: adminAccount.id },
      });
      if (!adminEmployee) {
        await db.Employee.create({
          employeeId: "EMP001",
          userId: adminAccount.id,
          position: "Developer",
          departmentId: engineeringDept.id,
          hireDate: "2025-01-01",
          status: "Active",
        });
        console.log("Created admin employee record");
      }
    }

    if (engineeringDept && userAccount) {
      const userEmployee = await db.Employee.findOne({
        where: { userId: userAccount.id },
      });
      if (!userEmployee) {
        await db.Employee.create({
          employeeId: "EMP002",
          userId: userAccount.id,
          position: "Designer",
          departmentId: engineeringDept.id,
          hireDate: "2025-02-01",
          status: "Active",
        });
        console.log("Created user employee record");
      }
    }

    console.log("Default data setup complete");
  } catch (error) {
    console.error("Error creating default data:", error);
  }
}
