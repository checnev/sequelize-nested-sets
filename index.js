const cloneDeep = require('clone-deep');
const { Op } = require('sequelize');
const {
  prepareOptions,
  prepareAttributes,
  initModel,
} = require('./utils');

/**
 * Adds nested set behavior using the model wrapper
 * @param {sequelize} sequelize - Ready sequelize object with connection
 * @param {string} modelName - Model name
 * @param {object} attributes - Model attributes
 * @param {object=} [options={}] - Sequelize and Nested sets options
 * @param {string} [options.treeAttribute=false] - Column name for tree id,
 * specify for use multiple tree
 * @param {string} [options.leftAttribute=lft] - Column name for left attribute
 * @param {string} [options.rightAttribute=rgt] - Column name for right attribute
 * @param {string} [options.depthAttribute=depth] - Column name for depth attribute
 * @param {Model=} [Model=null]  - Extended Model class
 */
module.exports = (sequelize, modelName, attributes, options = {}, Model = null) => {
  /* eslint-disable no-param-reassign */
  options = prepareOptions(options);
  attributes = prepareAttributes(attributes, options);
  Model = initModel(sequelize, modelName, attributes);

  const addTreeToCondition = (where, tree) => {
    if (options.treeAttribute) {
      where.tree = tree;
    }
    return where;
  };

  /**
   * Get the root nodes
   * @param {object=} [params={}] - Sequelize query options
   * @returns {Promise<Array<Model>>}
   */
  Model.roots = async (params = {}) => {
    params = cloneDeep(params);
    params.where = params.where || {};
    params.where.lft = 1;

    params.order = ['lft'];
    return Model.findAll(params);
  };

  /**
  * Get the leaf nodes
  * @param {object=} [params={}] - Sequelize query options
  * @returns {Promise<Array<Model>>}
  */
  Model.leaves = async (params = {}) => {
    params = cloneDeep(params);
    params.where = params.where || {};
    params.where.rgt = { [Op.eq]: sequelize.literal('lft + 1') };

    params.order = ['lft'];
    return Model.findAll(params);
  };

  /**
   * Get tree nodes
   * @param {int=} [depth=null] - Depth leave blank to get the whole tree
   * @param {int=} [tree=null] - Tree id
   * @param {object=} [params={}] - Sequelize query options
   * @returns {Promise<Array<Model>>}
   */
  Model.getTree = async (depth = null, tree = null, params = {}) => {
    params = cloneDeep(params);
    params.where = params.where || {};
    params.where.lft = { [Op.gte]: 1 };

    if (depth) {
      params.where.depth = { [Op.between]: [0, depth] };
    }
    addTreeToCondition(params.where, tree);

    params.order = ['lft'];
    return Model.findAll(params);
  };

  /**
   * Test if node is root
   * @returns {boolean}
   */
  Model.prototype.isRoot = function isRoot() {
    return this.lft === 1;
  };

  /**
   * Test if node is leaf
   * @returns {boolean}
   */
  Model.prototype.isLeaf = function isLeaf() {
    return (this.rgt - this.lft) === 1;
  };

  /**
   * Test if node has child
   * @returns {boolean}
   */
  Model.prototype.hasChild = function hasChild() {
    return (this.rgt - this.lft) !== 1;
  };

  /**
   * Test if node is child of target node
   * @param {Model} node - Target node
   * @returns {boolean}
   */
  Model.prototype.isChildOf = function isChildOf(node) {
    return (this.lft > node.lft && this.rgt < node.rgt && this.tree === node.tree);
  };

  /**
   * Test if node is parent of target node
   * @param {Model} node - Target node
   * @returns {boolean}
   */
  Model.prototype.isParentOf = function isParentOf(node) {
    return (this.lft < node.lft && this.rgt > node.rgt && this.tree === node.tree);
  };

  /**
   * Get child leaf nodes
   * @param {object=} [params={}] - Sequelize query options
   * @returns {Promise<Array<Model>>}
   */
  Model.prototype.leaves = async function leaves(params = {}) {
    params = cloneDeep(params);
    params.where = params.where || {};

    params.where.rgt = {
      [Op.and]: [
        { [Op.eq]: sequelize.literal('lft + 1') },
        { [Op.lt]: this.rgt },
      ],
    };
    params.where.lft = { [Op.gt]: this.lft };
    addTreeToCondition(params.where, this.tree);

    params.order = ['lft'];

    return Model.findAll(params);
  };

  /**
   * Get children nodes
   * @param {int=} [depth=null] - Depth leave blank to get the whole tree
   * @param {object=} [params={}] - Sequelize query options
   * @returns {Promise<Array<Model>>}
   */
  Model.prototype.children = async function children(depth = null, params = {}) {
    params = cloneDeep(params);
    params.where = params.where || {};
    params.where.lft = { [Op.gt]: this.lft };
    params.where.rgt = { [Op.lt]: this.rgt };

    if (depth) {
      params.where.depth = { [Op.lte]: +(this.depth + depth) };
    }
    addTreeToCondition(params.where, this.tree);

    params.order = ['lft'];
    return Model.findAll(params);
  };

  /**
   * Get parent nodes
   * @param {int=} [depth=null] - Depth leave blank to get all the parents
   * @param {object=} [params={}] - Sequelize query options
   * @returns {Promise<Array<Model>>}
   */
  Model.prototype.parents = async function parents(depth = null, params = {}) {
    params = cloneDeep(params);
    params.where = params.where || {};
    params.where.lft = { [Op.lt]: this.lft };
    params.where.rgt = { [Op.gt]: this.rgt };

    if (depth) {
      params.where.depth = { [Op.gte]: +(this.depth - depth) };
    }
    addTreeToCondition(params.where, this.tree);

    params.order = ['lft'];
    return Model.findAll(params);
  };

  /**
   * Get next sibling node
   * @returns {Promise<Model>}
   */
  Model.prototype.prev = async function prev() {
    return Model.findOne({
      where: addTreeToCondition({ rgt: this.lft - 1 }, this.tree),
    });
  };

  /**
   * Get previous sibling node
   * @returns {Promise<Model>}
   */
  Model.prototype.next = async function next() {
    return Model.findOne({
      where: addTreeToCondition({ lft: this.rgt + 1 }, this.tree),
    });
  };

  /**
   * Move the node as root or if the record is new, creates it
   * @returns {Promise<Model>}
   * @throws Will throw an error if root exists and treeAttribute is false
   * @throws Will throw an error if node is the root
   */
  Model.prototype.makeRoot = async function makeRoot() {
    const roots = await Model.roots();
    if (!options.treeAttribute && roots.length) {
      throw new Error('Can not create more than one root when "treeAttribute" is false.');
    }

    if (!this.isNewRecord && this.isRoot()) {
      throw new Error('Can not move the root node as the root.');
    }

    return sequelize.transaction(async () => {
      if (!this.isNewRecord) {
        return this.moveNodeAsRoot();
      }

      return this.save();
    });
  };

  /**
   * Moves the node as the previous sibling of the target node
   * if record is new creates it
   * @param {Model} node - Target node
   * @returns {Promise<Model>}
   * @throws Will throw an error if target node is root
   * @throws Will throw an error if target node is child
   * @throws Will throw an error if target node is same
   */
  Model.prototype.insertBefore = async function insertBefore(node) {
    if (node.isRoot()) {
      throw new Error('Can not move a node when the target node is root.');
    }

    return sequelize.transaction(async () => {
      await node.reload();
      return this.moveNode(node, node.lft, 0);
    });
  };

  /**
   * Moves the node as the next sibling of the target node
   * if record is new creates it
   * @param {Model} node - Target node
   * @returns {Promise<Model>}
   * @throws Will throw an error if target node is root
   * @throws Will throw an error if target node is child
   * @throws Will throw an error if target node is same
   */
  Model.prototype.insertAfter = async function insertAfter(node) {
    if (node.isRoot()) {
      throw new Error('Can not move a node when the target node is root.');
    }

    return sequelize.transaction(async () => {
      await node.reload();
      return this.moveNode(node, node.rgt + 1, 0);
    });
  };

  /**
   * Moves the node as the first child of the target node
   * if record is new creates it
   * @param {Model} node - Target node
   * @returns {Promise<Model>}
   * @throws Will throw an error if target node is new record
   */
  Model.prototype.prependTo = async function prependTo(node) {
    if (node.isNewRecord) {
      throw new Error('Can not move a node when the target node is new record.');
    }

    return sequelize.transaction(async () => {
      await node.reload();
      return this.moveNode(node, node.lft + 1, 1);
    });
  };

  /**
   * Moves the node as the last child of the target node
   * if record is new creates it
   * @param {Model} node - Target node
   * @returns {Promise<Model>}
   * @throws Will throw an error if target node is new record
   */
  Model.prototype.appendTo = async function appendTo(node) {
    if (node.isNewRecord) {
      throw new Error('Can not move a node when the target node is new record.');
    }

    return sequelize.transaction(async () => {
      await node.reload();
      return this.moveNode(node, node.rgt, 1);
    });
  };

  /**
   * Moves the node to the specified location
   * @param {Model} node - Target node
   * @param {int} start - Start of place to insert
   * @param {int} depth - Future depth relative to target node
   * @returns {Promise<Model>}
   * @throws Will throw an error if target node is child
   * @throws Will throw an error if target node is same
   */
  Model.prototype.moveNode = async function moveNode(node, start, depth) {
    if (node.isChildOf(this)) {
      throw new Error('Can not move a node when the target node is child.');
    }

    if (this.isEqual(node)) {
      throw new Error('Can not move a node when the target node is same.');
    }

    const delta = this.rgt - this.lft + 1;

    const old = {
      lft: this.lft,
      rgt: this.rgt,
      depth: this.depth,
      tree: this.tree,
    };

    // if the node is already in the desired position
    if (start - delta !== this.lft) {
      this.lft = start;
      this.rgt = this.lft + (delta - 1);
    }

    this.depth += node.depth - this.depth + depth;
    this.tree = node.tree;

    if (this.isNewRecord) {
      await Model.shiftLRValues(start, 2, node.tree);
    } else {
      await Model.shiftLRValues(start, delta, node.tree);

      // current position after first shift
      const leftValue = (old.lft >= start) ? old.lft + delta : old.lft;
      const rightValue = (old.lft >= start) ? old.rgt + delta : old.rgt;

      await Model.update({
        lft: sequelize.literal(`lft + ${start - leftValue}`),
        rgt: sequelize.literal(`rgt + ${start - leftValue}`),
        depth: sequelize.literal(`depth + ${node.depth - old.depth + depth}`),
        tree: node.tree,
      }, {
        where: addTreeToCondition({
          lft: { [Op.gte]: leftValue },
          rgt: { [Op.lte]: rightValue },
        }, old.tree),
      });
      await Model.shiftLRValues(old.rgt + 1, -delta, old.tree);
    }

    await node.reload();
    return this.save();
  };

  /**
   * Moves existing node as the root
   * @returns {Promise<Model>}
   */
  Model.prototype.moveNodeAsRoot = async function moveNodeAsRoot() {
    await Model.update({
      lft: sequelize.literal(`lft - ${this.lft - 1}`),
      rgt: sequelize.literal(`rgt - ${this.lft - 1}`),
      depth: sequelize.literal(`depth - ${this.depth}`),
      tree: this.id,
    }, {
      where: addTreeToCondition({
        lft: { [Op.gte]: this.lft },
        rgt: { [Op.lte]: this.rgt },
      }, this.tree),
    });

    const delta = this.lft - this.rgt - 1;
    await Model.shiftLRValues(this.lft, delta, this.tree);

    return this.reload();
  };

  /**
   * Test if node is equal target node
   * @param {Model} node - Target node
   * @returns {boolean}
   */
  Model.prototype.isEqual = function isEqual(node) {
    return (this.lft === node.lft && this.rgt === node.rgt && this.tree === node.tree);
  };

  /**
   * Shifts nodes to make room for insertion or movement
   * @param {int} start - From which element to shift
   * @param {int} delta - How much to shift
   * @param {int} [tree=null] - Work tree id
   */
  Model.shiftLRValues = (start, delta, tree = null) => {
    const leftShift = Model.increment('lft', {
      by: delta,
      where: addTreeToCondition({
        lft: { [Op.gte]: start },
      }, tree),
    });

    const rightShift = Model.increment('rgt', {
      by: delta,
      where: addTreeToCondition({
        rgt: { [Op.gte]: start },
      }, tree),
    });

    return Promise.all([leftShift, rightShift]);
  };

  /**
   * set tree after create
   */
  Model.afterCreate(async (model) => {
    if (options.treeAttribute && model.isRoot()) {
      model.tree = model.id;
      await model.save();
    }
  });

  /**
   * Destroys the descendants of the node after destroy the parent
   */
  Model.afterDestroy(async (model) => {
    const delta = model.rgt - model.lft + 1;
    if (model.hasChild()) {
      await Model.destroy({
        where: addTreeToCondition({
          lft: { [Op.gt]: model.lft },
          rgt: { [Op.lt]: model.rgt },
        }, model.tree),
      });
    }

    await Model.shiftLRValues(model.rgt, -delta, model.tree);
  });

  return Model;
};
