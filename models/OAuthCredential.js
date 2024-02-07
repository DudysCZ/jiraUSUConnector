 import Sequelize from 'sequelize';
 import database from '../database/database';

 const db = database;
 const OAuthCredential = db.define('oauthcredentials', {
     OAClientID: {
         type: Sequelize.STRING
     },
     OASecret: {
         type: Sequelize.STRING
     },
     OARefreshToken: {
             type: Sequelize.STRING
     },
     ClientID: {
         type: Sequelize.STRING
     },
 });

export default OAuthCredential;
