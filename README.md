# Nested Sets Behavior for Sequelize

Behavior for storing and managing nested sets


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
[wiki](https://github.com/checnev/sequelize-nested-sets/wiki/Usage)