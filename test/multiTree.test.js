const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config');
const NS = require('..');

const sequelize = new Sequelize(config);
const data = require('./data/multi-tree');

const Model = NS(
  sequelize,
  'multiTree',
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

beforeAll(async () => {
  await Model.sync({ force: true });
  await Model.bulkCreate(data);
});

describe('MultiTree: Model.roots()', () => {
  let roots = [];

  beforeAll(async () => {
    roots = await Model.roots();
  });

  test('Should return 2 roots', () => {
    roots.forEach((root) => {
      expect(root).toEqual(expect.objectContaining({
        lft: 1,
        depth: 0,
        tree: expect.any(Number),
      }));
    });

    expect(roots.length).toBe(2);
  });

  test('Should be different tries', () => {
    expect(roots[0].tree).not.toBe(roots[1].tree);
  });

  test('Should return tree by condition', async () => {
    const root = await Model.roots({ where: { name: 'cars' } });
    expect(root[0]).toEqual(expect.objectContaining({
      name: 'cars',
      lft: 1,
      depth: 0,
    }));
    expect(root.length).toBe(1);
  });
});

describe('MultiTree: Model.leaves()', () => {
  test('Should return 5 leaves', async () => {
    const leaves = await Model.leaves();

    leaves.forEach((leaf) => {
      expect(leaf.rgt - leaf.lft).toBe(1);
    });

    expect(leaves.length).toBe(5);
  });

  test('Should return 4 leaves by condition', async () => {
    const leaves = await Model.leaves({ where: { depth: 2 } });
    expect(leaves.length).toBe(4);
  });
});

describe('MultiTree: Model.getTree', () => {
  test('Should return tree with 4 items of the root', async () => {
    const treeId = 1;
    const depth = 1;

    const tree = await Model.getTree(depth, treeId);
    expect(tree.length).toBe(4);
  });
});

describe('Multitree: isRoot()', () => {
  test('Should return true', async () => {
    const root = await Model.findOne({ where: { name: 'cars' } });
    expect(root.isRoot()).toBe(true);
  });

  test('Should return false', async () => {
    const root = await Model.findOne({ where: { name: 'ford focus' } });
    expect(root.isRoot()).toBe(false);
  });
});

describe('Multitree: isLeaf()', () => {
  test('Should return true', async () => {
    const root = await Model.findOne({ where: { name: 'ford focus' } });
    expect(root.isLeaf()).toBe(true);
  });

  test('Should return false', async () => {
    const root = await Model.findOne({ where: { name: 'cars' } });
    expect(root.isLeaf()).toBe(false);
  });
});

describe('Multitree: hasChild()', () => {
  test('Should return true', async () => {
    const root = await Model.findOne({ where: { name: 'cars' } });
    expect(root.hasChild()).toBe(true);
  });

  test('Should return false', async () => {
    const root = await Model.findOne({ where: { name: 'ford focus' } });
    expect(root.hasChild()).toBe(false);
  });
});

describe('Multitree: isChildOf()', () => {
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

describe('Multitree: isParentOf()', () => {
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

describe('MiltiTree: leaves()', () => {
  test('Should return 3 leaves', async () => {
    const model = await Model.findOne({ where: { name: 'cars' } });
    const leaves = await model.leaves();
    expect(leaves.length).toBe(3);

    leaves.forEach((leaf) => {
      expect(leaf).toEqual(expect.objectContaining({
        rgt: leaf.lft + 1,
        tree: model.tree,
      }));
      expect(leaf.depth).toBeGreaterThan(model.depth);
    });
  });

  test('Should return 0 leaves', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const leaves = await model.leaves();
    expect(leaves.length).toBe(0);
  });

  test('Should return 1 leaves by condition', async () => {
    const model = await Model.findOne({ where: { name: 'cars' } });
    const leaves = await model.leaves({ where: { name: 'ford cargo' } });

    expect(leaves[0]).toEqual(expect.objectContaining({
      name: 'ford cargo',
      rgt: leaves[0].lft + 1,
    }));
    expect(leaves[0].isChildOf(model)).toBe(true);
    expect(leaves.length).toBe(1);
  });
});

describe('MiltiTree: children()', () => {
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

  test('Should return 1 children by condition', async () => {
    const model = await Model.findOne({ where: { name: 'cars' } });
    const children = await model.children(1, { where: { name: 'freight' } });

    expect(children[0].name).toBe('freight');
    expect(children[0].isChildOf(model)).toBe(true);
    expect(children.length).toBe(1);
  });
});

describe('MiltiTree: parents()', () => {
  test('Should return 1 parent', async () => {
    const depth = 1;
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const parents = await model.parents(depth);

    expect(parents.length).toBe(1);
    parents.forEach((parent) => {
      expect(parent.isParentOf(model)).toBe(true);
    });
  });

  test('Should return 2 parents', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const parents = await model.parents();

    expect(parents.length).toBe(2);
    parents.forEach((parent) => {
      expect(parent.isParentOf(model)).toBe(true);
    });
  });

  test('Should return 1 parent by condition', async () => {
    const model = await Model.findOne({ where: { name: 'ford cargo' } });
    const parents = await model.parents(null, { where: { name: 'cars' } });

    expect(parents[0].name).toBe('cars');
    expect(parents[0].isParentOf(model)).toBe(true);
    expect(parents.length).toBe(1);
  });
});

describe('MultiTree: prev()', () => {
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

describe('MultiTree: next()', () => {
  test('Should return next sibling', async () => {
    const model = await Model.findOne({ where: { name: 'passenger' } });
    const nextSibling = await model.next();

    expect(nextSibling.lft).toBe(model.rgt + 1);
    expect(nextSibling.depth).toBe(model.depth);
  });

  test('Should return null', async () => {
    const model = await Model.findOne({ where: { name: 'moto' } });
    const nextSibling = await model.next();

    expect(nextSibling).toBe(null);
  });
});

describe('MultiTree: makeRoot()', () => {
  beforeAll(async () => {
    await Model.sync({ force: true });
    await Model.bulkCreate(data);
  });

  test('Should create new root', async () => {
    const boat = Model.build({ name: 'boat' });
    await boat.makeRoot();

    expect(boat).toEqual(expect.objectContaining({
      lft: 1,
      rgt: 2,
      depth: 0,
    }));
  });

  test('Should move the existing node as the root', async () => {
    const model = await Model.findOne({ where: { name: 'passenger' } });
    const delta = model.rgt - model.lft;

    await model.makeRoot();

    expect(model.rgt).toBe(model.lft + delta);
    expect(model).toEqual(expect.objectContaining({
      lft: 1,
      depth: 0,
    }));
    expect(model.tree).toBe(model.id);
  });

  test('Should to throw Error("Can not move the root node as the root")', async () => {
    const root = await Model.findOne({ where: { name: 'cars' } });
    const error = new Error('Can not move the root node as the root.');

    await expect(root.makeRoot()).rejects.toThrow(error);
  });
});

describe('MultiTree: appendTo()', () => {
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
      tree: node.tree,
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
      tree: node.tree,
    }));
  });

  test('Should move existing node as last child of the target node, from one tree to another', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'moto' } });

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
      tree: node.tree,
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
      tree: node.tree,
    }));

    children.forEach((child) => {
      expect(child.isChildOf(node)).toBe(true);
    });
  });

  test('Should move node as last child of the target node, several times in 1 target', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'cars' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.appendTo(node);
    await model.appendTo(node);
    await model.appendTo(node);

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.rgt,
      rgt: oldNode.rgt + delta - 1,
      depth: oldNode.depth + 1,
      tree: node.tree,
    }));
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
      tree: node.tree,
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

describe('MultiTree: prependTo()', () => {
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
      tree: node.tree,
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
      tree: node.tree,
    }));
  });

  test('Should move existing node as first child of the target node, from one tree to another', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'moto' } });

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
      tree: node.tree,
    }));
  });

  test('Should move node as first child of the target node, several times in 1 target', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'cars' } });

    const delta = model.rgt - model.lft + 1;
    const oldNode = {
      lft: node.lft,
      rgt: node.rgt,
      depth: node.depth,
    };

    await model.prependTo(node);
    await model.prependTo(node);
    await model.prependTo(node);

    expect(model).toEqual(expect.objectContaining({
      lft: oldNode.lft + 1,
      rgt: oldNode.lft + delta,
      depth: oldNode.depth + 1,
      tree: node.tree,
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
      tree: node.tree,
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
      tree: node.tree,
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

describe('MultiTree: insertBefore()', () => {
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
      tree: node.tree,
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
      tree: node.tree,
    }));
  });

  test('Should move node as previous sibling of the target node, several times in 1 target', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'passenger' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertBefore(node);
    await model.insertBefore(node);
    await model.insertBefore(node);

    expect(model).toEqual(expect.objectContaining({
      lft: node.lft - delta,
      rgt: node.lft - 1,
      depth: node.depth,
      tree: node.tree,
    }));
  });

  test('Should move existing node as previous sibling of the target node, from one tree to another', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'supersport' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertBefore(node);

    expect(model).toEqual(expect.objectContaining({
      lft: node.lft - delta,
      rgt: node.lft - 1,
      depth: node.depth,
      tree: node.tree,
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
      tree: node.tree,
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
      tree: node.tree,
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

describe('MultiTree: insertAfter()', () => {
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
      tree: node.tree,
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
      tree: node.tree,
    }));
  });

  test('Should move existing node as next sibling of the target node, from one tree to another', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'supersport' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertAfter(node);

    expect(model).toEqual(expect.objectContaining({
      lft: node.rgt + 1,
      rgt: node.rgt + delta,
      depth: node.depth,
      tree: node.tree,
    }));
  });

  test('Should move node as next sibling of the target node, several times in 1 target', async () => {
    const model = await Model.findOne({ where: { name: 'ford focus' } });
    const node = await Model.findOne({ where: { name: 'passenger' } });

    const delta = model.rgt - model.lft + 1;

    await model.insertAfter(node);
    await model.insertAfter(node);
    await model.insertAfter(node);

    expect(model).toEqual(expect.objectContaining({
      lft: node.rgt + 1,
      rgt: node.rgt + delta,
      depth: node.depth,
      tree: node.tree,
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
      tree: node.tree,
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
      tree: node.tree,
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

describe('MultiTree: isEqual()', () => {
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

describe('MultiTree: Model.afterDestroy()', () => {
  test('Should destroy node with children', async () => {
    const model = await Model.findOne({ where: { name: 'personal' } });
    await model.destroy();
    const children = await model.children();

    expect(children.length).toBe(0);
  });
});
