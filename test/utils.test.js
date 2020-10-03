const { Sequelize, Model, DataTypes } = require('sequelize');
const {
  prepareOptions,
  prepareAttributes,
  initModel,
} = require('../utils');
const config = require('./config');

describe('Utils: prepareOptions()', () => {
  test('Should return default Options', () => {
    const options = prepareOptions({});

    expect(options).toEqual(expect.objectContaining({
      leftAttribute: 'lft',
      rightAttribute: 'rgt',
      depthAttribute: 'depth',
      treeAttribute: false,
    }));
  });

  test('Should return merged options', () => {
    const options = {
      leftAttribute: 'left',
      rightAttribute: 'right',
      depthAttribute: 'level',
      treeAttribute: 'tree',
      someOption: true,
    };
    const preparedOptions = prepareOptions(options);

    expect(preparedOptions).toEqual(options);
  });
});

describe('Utils: prepareAttributes()', () => {
  test('Should return default Attributes', () => {
    const attributes = {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    };
    const options = prepareOptions({});
    const preparedAttributes = prepareAttributes(attributes, options);

    expect(preparedAttributes).toEqual(expect.objectContaining({
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
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
    }));
  });

  test('Should return Attributes for multi tree', () => {
    const attributes = {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    };
    const options = prepareOptions({ treeAttribute: 'tree' });
    const preparedAttributes = prepareAttributes(attributes, options);

    expect(preparedAttributes).toEqual(expect.objectContaining({
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
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
      tree: {
        type: DataTypes.INTEGER,
        field: options.treeAttribute,
        allowNull: false,
        defaultValue: 1,
      },
    }));
  });
});

describe('Utils: initModel()', () => {
  let sequelize;
  beforeAll(() => {
    sequelize = new Sequelize(config);
  });

  test('Should init the class inherited from the Model', () => {
    const options = prepareOptions({});
    const attributes = prepareAttributes({}, options);

    const ModelClass = class ModelClass extends Model {
      static test() { return true; }
    };
    const NSModel = initModel(sequelize, 'modelName', attributes, options, ModelClass);

    expect(NSModel).toBeInstanceOf(Function);
    expect(NSModel.test()).toBe(true);
  });

  test('Should init the model with standard method', () => {
    const options = prepareOptions({});
    const attributes = prepareAttributes({}, options);
    const NSModel = initModel(sequelize, 'modelName', attributes, options);

    expect(NSModel).toBeInstanceOf(Function);
  });
});
