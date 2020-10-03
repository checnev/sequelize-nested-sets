const { Model: SequelizeModel, DataTypes } = require('sequelize');

exports.prepareOptions = (options) => {
  const nsOptions = {
    leftAttribute: options.leftAttribute || 'lft',
    rightAttribute: options.rightAttribute || 'rgt',
    depthAttribute: options.depthAttribute || 'depth',
    treeAttribute: options.treeAttribute || false,
  };

  return { ...options, ...nsOptions };
};
exports.prepareAttributes = (attributes, options = {}) => {
  const baseAttributes = {
    lft: {
      type: DataTypes.INTEGER,
      field: options.leftAttribute,
      allowNull: false,
      defaultValue: 1,
    },
    rgt: {
      type: DataTypes.INTEGER,
      field: options.rightAttribute,
      allowNull: false,
      defaultValue: 2,
    },
    depth: {
      type: DataTypes.INTEGER,
      field: options.depthAttribute,
      allowNull: false,
      defaultValue: 0,
    },
  };

  if (options.treeAttribute) {
    baseAttributes.tree = {
      type: DataTypes.INTEGER,
      field: options.treeAttribute,
      allowNull: false,
      defaultValue: 1,
    };
  }

  return { ...attributes, ...baseAttributes };
};

exports.initModel = (sequelize, modelName, attributes, options = {}, Model = null) => {
  if (Model && Model.prototype instanceof SequelizeModel) {
    return Model.init(
      attributes,
      {
        sequelize,
        modelName,
        ...options,
      },
    );
  }

  return sequelize.define(
    modelName,
    attributes,
    {
      ...options,
    },
  );
};
