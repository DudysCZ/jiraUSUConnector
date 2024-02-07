import Sequelize from "sequelize";
import database from "../database/database";

const db = database;
const BasicAuthCredential = db.define("basicauthcredentials", {
  ExternalUsername: {
    type: Sequelize.STRING,
  },
  ExternalUsernameToken: {
    type: Sequelize.STRING,
  },
  CloudInstanceURL: {
    type: Sequelize.STRING,
  },
  ClientID: {
    type: Sequelize.STRING,
  },
});

//BasicAuthCredential.sync();
export default BasicAuthCredential;
