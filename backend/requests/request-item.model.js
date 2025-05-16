const { DataTypes } = require("sequelize");

module.exports = model;

function model(sequelize) {
  const attributes = {
    requestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "requests",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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

  return sequelize.define("requestItem", attributes, options);
}
