'use strict';

module.exports = (sequelize, DataTypes) => {
  var Message = sequelize.define('message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contactId: DataTypes.INTEGER,
    contactlink: DataTypes.STRING,
    shortlinkId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    platformtypeId: DataTypes.INTEGER,
    clickcount: DataTypes.INTEGER,
    deliverytime: DataTypes.DATE,
    readtime: DataTypes.DATE,
    firstclicktime: DataTypes.DATE,
    message_id: DataTypes.STRING,
    status: DataTypes.INTEGER,
  }, {});

  Message.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Message.belongsTo(models.Platformtype, {
      foreignKey: 'platformtypeId',
    });
    Message.belongsTo(models.Shortlink, {
      foreignKey: 'shortlinkId',
    });
    Message.belongsTo(models.Campaign, {
      foreignKey: 'campaignId',
    });
    Message.belongsTo(models.Contact, {
      foreignKey: 'contactId',
    });
  }

  return Message;
}



/* const Sequelize = require('sequelize');
const db = require('../config/db');
// const Contact = require('./Contact');
const Contact = db.import("./Contact");
const ContactGroup = require('./ContactGroup');

// const ContactGroup = db.define('contact_group');

const Group = db.define('Group', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.STRING
  },
  count: {
    type: Sequelize.INTEGER
  },
})

Group.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });

Group.associate = function (models) {
  // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
  Group.belongsTo(models.User);
  // Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'GroupId' });
}

module.exports = Group; */