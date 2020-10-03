const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config');
const data = require('./data/single-tree');
const NS = require('..');

const sequelize = new Sequelize(config);

const Model = NS(
  sequelize,
  'singleTree',
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
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  },
  {},
);

beforeAll(async () => {
  await Model.sync({ force: true });
  await Model.bulkCreate(data);
});

describe('SingleTree: Model.roots()', () => {
  test('Should return 1 root', async () => {
    const roots = await Model.roots();

    expect(roots[0]).toEqual(expect.objectContaining({
      lft: 1,
      depth: 0,
    }));
    expect(roots.length).toBe(1);
  });
});

describe('SingleTree: Model.leaves()', () => {
  test('Should return 3 leaves', async () => {
    const leaves = await Model.leaves();

    leaves.forEach((leaf) => {
      expect(leaf.rgt - leaf.lft).toBe(1);
    });

    expect(leaves.length).toBe(3);
  });
});

describe('SingleTree: Model.getTree', () => {
  test('Should return tree with 4 items of the root', async () => {
    const depth = 1;

    const tree = await Model.getTree(depth);
    expect(tree.length).toBe(4);
  });
});

describe('SingleTree: isRoot()', () => {
  test('Should return true', async () => {
    const root = await Model.findOne({ where: { name: 'cars' } });
    expect(root.isRoot()).toBe(true);
  });

  test('Should return false', async () => {
    const root = await Model.findOne({ where: { name: 'ford focus' } });
    expect(root.isRoot()).toBe(false);
  });
});

describe('SingleTree: isLeaf()', () => {
  test('Should return true', async () => {
    const root = await Model.findOne({ where: { name: 'ford focus' } });
    expect(root.isLeaf()).toBe(true);
  });

  test('Should return false', async () => {
    const root = await Model.findOne({ where: { name: 'cars' } });
    expect(root.isLeaf()).toBe(false);
  });
});

describe('SingleTree: hasChild()', () => {
  test('Should return true', async () => {
    const root = await Model.findOne({ where: { name: 'cars' } });
    expect(root.hasChild()).toBe(true);
  });

  test('Should return false', async () => {
    const root = await Model.findOne({ where: { name: 'ford focus' } });
    expect(root.hasChild()).toBe(false);
  });
});

describe('SingleTree: isChildOf()', () => {
  let node;
  let model;

  beforeAll(async () => {
    node = await Model.findOne({ where: { name: 'cars' } });
    model = await Model.findOne({ where: { name: 'ford focus' } });
  });

  test('Should return true', async () => {
    expect(model.isChildOf(node)).toBe(true);
  });

  test('Should return false', async () => {
    expect(node.isChildOf(model)).toBe(false);
  });
});

describe('SingleTree: isParentOf()', () => {
  let node;
  let model;

  beforeAll(async () => {
    node = await Model.findOne({ where: { name: 'cars' } });
    model = await Model.findOne({ where: { name: 'ford focus' } });
  });

  test('Should return true', async () => {
    expect(node.isParentOf(model)).toBe(true);
  });

  test('Should return false', async () => {
    expect(model.isParentOf(node)).toBe(false);
  });
});

describe('SingleTree: leaves()', () => {
  test('Should return 3 leaves', async () => {
    const model = await Model.findOne({ where: { name: 'cars' } });
    const leaves = await model.leaves();
    expect(leaves.length).toBe(3);

    leaves.forEach((leaf) => {
      expect(leaf).toEqual(expect.objectContaining({
        rgt: leaf.lft + 1,
      }));
      expect(leaf.depth).toBeGreaterThan(model.depth);
    });
  });

  test('Should return 0 leaves', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const leaves = await model.leaves();
    expect(leaves.length).toBe(0);
  });
});

describe('SingleTree: children()', () => {
  test('Should return 3 children', async () => {
    const depth = 1;
    const model = await Model.findOne({ where: { name: 'cars' } });
    const children = await model.children(depth);

    expect(children.length).toBe(3);
    children.forEach((child) => {
      expect(child.isChildOf(model)).toBe(true);
    });
  });

  test('Should return 6 children', async () => {
    const model = await Model.findOne({ where: { name: 'cars' } });
    const children = await model.children();

    expect(children.length).toBe(6);
    children.forEach((child) => {
      expect(child.isChildOf(model)).toBe(true);
    });
  });
});

describe('SingleTree: parents()', () => {
  test('Should return 1 parent', async () => {
    const depth = 1;
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const parents = await model.parents(depth);

    expect(parents.length).toBe(1);
    parents.forEach((parent) => {
      expect(parent.isParentOf(model)).toBe(true);
    });
  });

  test('Should return 2 children', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const parents = await model.parents();

    expect(parents.length).toBe(2);
    parents.forEach((parent) => {
      expect(parent.isParentOf(model)).toBe(true);
    });
  });
});

describe('SingleTree: prev()', () => {
  test('Should return prev sibling', async () => {
    const model = await Model.findOne({ where: { name: 'passenger' } });
    const prevSibling = await model.prev();

    expect(prevSibling.rgt).toBe(model.lft - 1);
    expect(prevSibling.depth).toBe(model.depth);
  });

  test('Should return null', async () => {
    const model = await Model.findOne({ where: { name: 'cars' } });
    const prevSibling = await model.prev();

    expect(prevSibling).toBe(null);
  });
});

describe('SingleTree: next()', () => {
  test('Should return next sibling', async () => {
    const model = await Model.findOne({ where: { name: 'passenger' } });
    const nextSibling = await model.next();

    expect(nextSibling.lft).toBe(model.rgt + 1);
    expect(nextSibling.depth).toBe(model.depth);
  });

  test('Should return null', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const nextSibling = await model.next();

    expect(nextSibling).toBe(null);
  });
});

describe('SingleTree: makeRoot()', () => {
  beforeAll(async () => {
    await Model.sync({ force: true });
    await Model.bulkCreate(data);
  });

  test('Should to throw Error("Can not create more than one root when "treeAttribute" is false")', async () => {
    const root = Model.build({ where: { name: 'boat' } });
    const error = new Error('Can not create more than one root when "treeAttribute" is false.');

    await expect(root.makeRoot()).rejects.toThrow(error);
  });
});

describe('SingleTree: appendTo()', () => {
  beforeEach(async () => {
    await Model.sync({ force: true });
    await Model.bulkCreate(data);
  });

  test('Should move new node as last child of the target node', async () => {
    const model = Model.build({ name: 'toyota camry' });
    const node = await Model.findOne({ where: { name: 'personal' } });
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.appendTo(node);

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.rgt,
      rgt: oldNode.rgt + 1,
      depth: oldNode.depth + 1,
    }));

    expect(node).toEqual(expect.objectContaining({
      lft: oldNode.lft,
      rgt: oldNode.rgt + 2,
    }));
  });

  test('Should move existing node as last child of the target node', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'cars' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.appendTo(node);

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.rgt,
      rgt: oldNode.rgt + delta - 1,
      depth: oldNode.depth + 1,
    }));
  });

  test('Should move existing node with children as last child of the target node', async () => {
    const model = await Model.findOne({ where: { name: 'passenger' } });
    const node = await Model.findOne({ where: { name: 'personal' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.appendTo(node);
    const children = await model.children();

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.rgt,
      rgt: oldNode.rgt + delta - 1,
      depth: oldNode.depth + 1,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(node)).toBe(true);
    });
  });

  test('Should move existing node with children as last child of the target node, top => down', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'ford transit bus' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.appendTo(node);
    const children = await model.children();

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.rgt,
      rgt: oldNode.rgt + delta - 1,
      depth: oldNode.depth + 1,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(node)).toBe(true);
    });
  });

  test('Should to throw Error("Can not move a node when the target node is new record")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = Model.build({ name: 'nissan almera' });
    const error = new Error('Can not move a node when the target node is new record.');

    await expect(model.appendTo(node)).rejects.toThrow(error);
  });

  test('Should to throw Error("Can not move a node when the target node is child")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'ford focus' } });
    const error = new Error('Can not move a node when the target node is child.');

    await expect(model.appendTo(node)).rejects.toThrow(error);
  });

  test('Should to throw Error("Can not move a node when the target node is same")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'personal' } });
    const error = new Error('Can not move a node when the target node is same.');

    await expect(model.appendTo(node)).rejects.toThrow(error);
  });
});

describe('SingleTree: prependTo()', () => {
  beforeEach(async () => {
    await Model.sync({ force: true });
    await Model.bulkCreate(data);
  });

  test('Should move new node as first child of the target node', async () => {
    const model = Model.build({ name: 'toyota camry' });
    const node = await Model.findOne({ where: { name: 'personal' } });
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.prependTo(node);

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.lft + 1,
      rgt: oldNode.lft + 2,
      depth: oldNode.depth + 1,
    }));

    expect(node).toEqual(expect.objectContaining({
      lft: oldNode.lft,
      rgt: oldNode.rgt + 2,
    }));
  });

  test('Should move existing node as first child of the target node', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'cars' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.prependTo(node);

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.lft + 1,
      rgt: oldNode.lft + delta,
      depth: oldNode.depth + 1,
    }));
  });

  test('Should move existing node with children as first child of the target node', async () => {
    const model = await Model.findOne({ where: { name: 'passenger' } });
    const node = await Model.findOne({ where: { name: 'personal' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.prependTo(node);
    const children = await model.children();

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.lft + 1,
      rgt: oldNode.lft + delta,
      depth: oldNode.depth + 1,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(node)).toBe(true);
    });
  });

  test('Should move existing node with children as first child of the target node, top => down', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'ford transit bus' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.prependTo(node);
    const children = await model.children();

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.lft + 1,
      rgt: oldNode.lft + delta,
      depth: oldNode.depth + 1,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(node)).toBe(true);
    });
  });

  test('Should to throw Error("Can not move a node when the target node is new record")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = Model.build({ name: 'nissan almera' });
    const error = new Error('Can not move a node when the target node is new record.');

    await expect(model.prependTo(node)).rejects.toThrow(error);
  });

  test('Should to throw Error("Can not move a node when the target node is child")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'ford focus' } });
    const error = new Error('Can not move a node when the target node is child.');

    await expect(model.prependTo(node)).rejects.toThrow(error);
  });

  test('Should to throw Error("Can not move a node when the target node is same")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'personal' } });
    const error = new Error('Can not move a node when the target node is same.');

    await expect(model.prependTo(node)).rejects.toThrow(error);
  });
});

describe('SingleTree: insertBefore()', () => {
  beforeEach(async () => {
    await Model.sync({ force: true });
    await Model.bulkCreate(data);
  });

  test('Should move new node as previous sibling of the target node', async () => {
    const model = Model.build({ name: 'toyota camry' });
    const node = await Model.findOne({ where: { name: 'personal' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.insertBefore(node);

    expect(model).toEqual(expect.objectContaining({
      lft: node.lft - delta,
      rgt: node.lft - 1,
      depth: node.depth,
    }));

    expect(node).toEqual(expect.objectContaining({
      lft: oldNode.lft + delta,
      rgt: oldNode.rgt + delta,
      depth: oldNode.depth,
    }));
  });

  test('Should move existing node as previous sibling of the target node', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'passenger' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertBefore(node);

    expect(model).toEqual(expect.objectContaining({
      lft: node.lft - delta,
      rgt: node.lft - 1,
      depth: node.depth,
    }));
  });

  test('Should move existing node with children as previous sibling of the target node', async () => {
    const model = await Model.findOne({ where: { name: 'passenger' } });
    const node = await Model.findOne({ where: { name: 'freight' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertBefore(node);
    const children = await model.children();

    expect(model).toEqual(expect.objectContaining({
      lft: node.lft - delta,
      rgt: node.lft - 1,
      depth: node.depth,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(model)).toBe(true);
    });
  });

  test('Should move existing node with children as previous sibling of the target node, top => down', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'ford transit bus' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertBefore(node);
    const children = await model.children();

    expect(model).toEqual(expect.objectContaining({
      lft: node.lft - delta,
      rgt: node.lft - 1,
      depth: node.depth,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(model)).toBe(true);
    });
  });

  test('Should to throw Error("Can not move a node when the target node is root")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'cars' } });
    const error = new Error('Can not move a node when the target node is root.');

    await expect(model.insertBefore(node)).rejects.toThrow(error);
  });

  test('Should to throw Error("Can not move a node when the target node is child")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'ford focus' } });
    const error = new Error('Can not move a node when the target node is child.');

    await expect(model.insertBefore(node)).rejects.toThrow(error);
  });

  test('Should to throw Error("Can not move a node when the target node is same")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'personal' } });
    const error = new Error('Can not move a node when the target node is same.');

    await expect(model.insertBefore(node)).rejects.toThrow(error);
  });
});

describe('SingleTree: insertAfter()', () => {
  beforeEach(async () => {
    await Model.sync({ force: true });
    await Model.bulkCreate(data);
  });

  test('Should move new node as next sibling of the target node', async () => {
    const model = Model.build({ name: 'toyota camry' });
    const node = await Model.findOne({ where: { name: 'personal' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.insertAfter(node);

    expect(model).toEqual(expect.objectContaining({
      lft: node.rgt + 1,
      rgt: node.rgt + delta,
      depth: node.depth,
    }));

    expect(node).toEqual(expect.objectContaining({
      lft: oldNode.lft,
      rgt: oldNode.rgt,
      depth: oldNode.depth,
    }));
  });

  test('Should move existing node as next sibling of the target node', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'passenger' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertAfter(node);

    expect(model).toEqual(expect.objectContaining({
      lft: node.rgt + 1,
      rgt: node.rgt + delta,
      depth: node.depth,
    }));
  });

  test('Should move existing node with children as next sibling of the target node', async () => {
    const model = await Model.findOne({ where: { name: 'passenger' } });
    const node = await Model.findOne({ where: { name: 'freight' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertAfter(node);
    const children = await model.children();

    expect(model).toEqual(expect.objectContaining({
      lft: node.rgt + 1,
      rgt: node.rgt + delta,
      depth: node.depth,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(model)).toBe(true);
    });
  });

  test('Should move existing node with children as next sibling of the target node, top => down', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'ford transit bus' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertAfter(node);
    const children = await model.children();

    expect(model).toEqual(expect.objectContaining({
      lft: node.rgt + 1,
      rgt: node.rgt + delta,
      depth: node.depth,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(model)).toBe(true);
    });
  });

  test('Should to throw Error("Can not move a node when the target node is root")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'cars' } });
    const error = new Error('Can not move a node when the target node is root.');

    await expect(model.insertAfter(node)).rejects.toThrow(error);
  });

  test('Should to throw Error("Can not move a node when the target node is child")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'ford focus' } });
    const error = new Error('Can not move a node when the target node is child.');

    await expect(model.insertAfter(node)).rejects.toThrow(error);
  });

  test('Should to throw Error("Can not move a node when the target node is same")', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'personal' } });
    const error = new Error('Can not move a node when the target node is same.');

    await expect(model.insertAfter(node)).rejects.toThrow(error);
  });
});

describe('SingleTree: isEqual()', () => {
  test('Should return true', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    expect(model.isEqual(model)).toBe(true);
  });

  test('Should return false', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    const node = await Model.findOne({ where: { name: 'cars' } });
    expect(model.isEqual(node)).toBe(false);
  });
});

describe('SingleTree: Model.afterDestroy()', () => {
  beforeAll(async () => {
    await Model.sync({ force: true });
    await Model.bulkCreate(data);
  });

  test('Should destroy node with children', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    await model.destroy();
    const children = await model.children();

    expect(children.length).toBe(0);
  });
});
