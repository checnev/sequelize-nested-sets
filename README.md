# Nested Sets Behavior for Sequelize

Behavior for storing and managing nested sets

[![Build Status](https://travis-ci.org/checnev/sequelize-nested-sets.svg?branch=master)](https://travis-ci.org/checnev/sequelize-nested-sets) [![Test Coverage](https://api.codeclimate.com/v1/badges/850e50f6618e3052ceca/test_coverage)](https://codeclimate.com/github/checnev/sequelize-nested-sets/test_coverage) ![npm](https://img.shields.io/npm/dt/sequelize-nested-sets)

## Installation


```bash
npm install --save sequelize-nested-sets
```

## Configuring
The library works as a wrapper over the model before initialization.

### Configure model:
```javascript
// yourModel.js
const { Model } = require('sequelize');
const ns = require('sequelize-nested-sets');

// with class extending Model
module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    // additional methods, associations
  }

  return ns(sequelize, 'menu', {
      name: DataTypes.STRING,
    }, {
      tableName: 'menu',
      treeAttribute: 'tree',
    },
    Menu
  );
};
```
```javascript
// or without ES6 classes
module.exports = (sequelize, DataTypes) => {  
  const Menu = ns(sequelize, 'menu', {
      name: DataTypes.STRING,
    }, {
      tableName: 'menu',
      treeAttribute: 'tree',
    }
  );
  return Menu;
};
```
### DB Table Structure:
Your table must have follow columns:
- lft (int unsigned NOT NULL)
- rgt (int unsigned NOT NULL)
- depth (int unsigned NOT NULL)
- tree (int unsigned NOT NULL) (**if you use multiple tree**)
> You can specify custom column names in options


### Nested Sets Options

```javascript
ns(sequelize, modelName, attributes, [options], [Model])
```
To use multiple tree mode set treeAttribute.

Adds nested set behavior using the model wrapper


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sequelize | <code>sequelize</code> |  | Ready sequelize object with connection |
| modelName | <code>string</code> |  | Model name |
| attributes | <code>object</code> |  | Model attributes |
| [options] | <code>object</code> | <code>{}</code> | Sequelize and Nested sets options |
| [options.treeAttribute] | <code>string</code> | <code>false</code> | Column name for tree id, specify for use multiple tree |
| [options.leftAttribute] | <code>string</code> | <code>&quot;lft&quot;</code> | Column name for left attribute |
| [options.rightAttribute] | <code>string</code> | <code>&quot;rgt&quot;</code> | Column name for right attribute |
| [options.depthAttribute] | <code>string</code> | <code>&quot;depth&quot;</code> | Column name for depth attribute |
| [Model] | <code>Model</code> | <code></code> | Extended Model class |


## Usage

### Moving, Creating node
### Making a root node
To make a root node
```javascript
const menu = Menu.build({ name: 'Main Menu' });
await menu.makeRoot();
```
The tree will look like this
```
— Main Menu
```

### Prepending a node as the first child of another node
To prepend a node as the first child of another node
```javascript
const productPage = Menu.build({ name: 'Product Page' });
await productPage.prependTo(menu);
```
The tree will look like this
```
— Main Menu
— — Product Page
```

### Appending a node as the last child of another node
To prepend a node as the last child of another node
```javascript
const faqPage= Menu.build({ name: 'FAQ Page' });
await faqPage.appendTo(menu);
```
The tree will look like this
```
— Main Menu
— — Product Page
— — FAQ Page
```

### Inserting a node before another node
To insert a node before another node
```javascript
const homePage = Menu.build({ name: 'Home Page' });
await homePage.insertBefore(productPage);
```
The tree will look like this
```
— Main Menu
— — Home Page
— — Product Page
— — FAQ Page
```

### Inserting a node after another node
To insert a node after another node
```javascript
const contactPage = Menu.build({ name: 'Contact Page' });
await contactPage.insertBefore(faqPage);
```
The tree will look like this
```
— Main Menu
— — Home Page
— — Product Page
— — FAQ Page
— — Contact Page
```

### Getting nodes
### Getting the root nodes
To get all the root nodes
```javascript
const roots = await Menu.roots();
```

### Getting the leaves nodes
To get all the leaves nodes
```javascript
const leaves = await Menu.leaves();
```
To get all the leaves of a node
```javascript
const menu = await Menu.findOne({ where: { name: 'Main Menu' } });
const leaves = await menu.leave();
```
### Getting children of a node
To get all the children of a node
```javascript
const menu = await Menu.findOne({ where: { name: 'Main Menu' } });
const children = await menu.children();
```
To get the first level children of a node
```javascript
const menu = await Menu.findOne({ where: { name: 'Main Menu' } });
const children = await menu.children(1);
```

### Getting parents of a node
To get all the parents of a node
```javascript
const faqPage = await Menu.findOne({ where: { name: 'FAQ Page' } });
const parents = await faqPage.parents();
```
To get the first parent of a node
```javascript
const faqPage = await Menu.findOne({ where: { name: 'FAQ Page' } });
const parents = await faqPage.parents(1);
```

### All methods see in [wiki](https://github.com/checnev/sequelize-nested-sets/wiki)