const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config');
const NS = require('..');

const sequelize = new Sequelize(config);
let Model;

beforeAll(() => {
  Model = NS(
    sequelize,
    'category',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lft: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rgt: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      depth: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tree: {
        type: DataTypes.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    }, {
      treeAttribute: 'tree',
    },
  );
});

describe('NestedSets: NS()', () => {
  test('Should add static method .roots()', () => {
    expect(Model.roots).toBeInstanceOf(Function);
  });

  test('Should add static method .leaves()', () => {
    expect(Model.leaves).toBeInstanceOf(Function);
  });

  test('Should add static method .getTree()', () => {
    expect(Model.getTree).toBeInstanceOf(Function);
  });

  test('Should add method .isRoot()', () => {
    expect(Model.prototype.isRoot).toBeInstanceOf(Function);
  });

  test('Should add method .isLeaf()', () => {
    expect(Model.prototype.isLeaf).toBeInstanceOf(Function);
  });

  test('Should add method .hasChild()', () => {
    expect(Model.prototype.hasChild).toBeInstanceOf(Function);
  });

  test('Should add method .isChildOf()', () => {
    expect(Model.prototype.isChildOf).toBeInstanceOf(Function);
  });

  test('Should add method .isParentOf()', () => {
    expect(Model.prototype.isParentOf).toBeInstanceOf(Function);
  });

  test('Should add method .isEqual()', () => {
    expect(Model.prototype.isEqual).toBeInstanceOf(Function);
  });

  test('Should add method .leaves()', () => {
    expect(Model.prototype.leaves).toBeInstanceOf(Function);
  });

  test('Should add method .children()', () => {
    expect(Model.prototype.children).toBeInstanceOf(Function);
  });

  test('Should add method .parents()', () => {
    expect(Model.prototype.parents).toBeInstanceOf(Function);
  });

  test('Should add method .prev()', () => {
    expect(Model.prototype.prev).toBeInstanceOf(Function);
  });

  test('Should add method .next()', () => {
    expect(Model.prototype.next).toBeInstanceOf(Function);
  });

  test('Should add method .makeRoot()', () => {
    expect(Model.prototype.makeRoot).toBeInstanceOf(Function);
  });

  test('Should add method .insertBefore()', () => {
    expect(Model.prototype.insertBefore).toBeInstanceOf(Function);
  });

  test('Should add method .insertAfter()', () => {
    expect(Model.prototype.insertAfter).toBeInstanceOf(Function);
  });

  test('Should add method .appendTo()', () => {
    expect(Model.prototype.appendTo).toBeInstanceOf(Function);
  });

  test('Should add method .prependTo()', () => {
    expect(Model.prototype.prependTo).toBeInstanceOf(Function);
  });

  test('Should add method .moveNode()', () => {
    expect(Model.prototype.moveNode).toBeInstanceOf(Function);
  });

  test('Should add method .moveNodeAsRoot()', () => {
    expect(Model.prototype.moveNodeAsRoot).toBeInstanceOf(Function);
  });

  test('Should add static method .shiftLRValues()', () => {
    expect(Model.shiftLRValues).toBeInstanceOf(Function);
  });

  test('Should add handler of afterCreate hook', () => {
    expect(Model.afterCreate).toBeInstanceOf(Function);
  });

  test('Should add handler of afterDestroy hook', () => {
    expect(Model.afterDestroy).toBeInstanceOf(Function);
  });
});
