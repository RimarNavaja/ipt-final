const { DataTypes } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employees",
        key: "id",
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Pending",
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  };

  const options = {
    timestamps: false,
  };

  return sequelize.define("workflow", attributes, options);
}
