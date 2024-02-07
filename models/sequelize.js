import Interface from "../models/Interface.js";
import OAuthCredential from "../models/OAuthCredential.js";
import BasicAuthCredential from "../models/BasicAuthCredential.js";
import WebHook from "../models/WebHook.js";
import database from "../database/database";

const db = database;

/*ADD ANY DATABAE RELATIONSHIP*/
Interface.hasOne(OAuthCredential, {
  onDelete: "cascade",
});

OAuthCredential.belongsTo(Interface, {
  foreignKey: {
    allowNull: false,
  },
});

Interface.hasOne(BasicAuthCredential, {
  onDelete: "cascade",
});

BasicAuthCredential.belongsTo(Interface, {
  foreignKey: {
    allowNull: false,
  },
});

/*WEBHOOKS*/
Interface.hasMany(WebHook, {
  onDelete: "cascade",
});

WebHook.belongsTo(Interface, {
  foreignKey: {
    allowNull: false,
  },
});

//  This creates the tables if don't exist (and does nothing if already exist)
db.sync().then(() => {
  console.log(`Database & tables created!`);
});

module.exports = {
  Interface,
  BasicAuthCredential,
  OAuthCredential,
  WebHook,
};
