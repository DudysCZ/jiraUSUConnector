 import Sequelize from 'sequelize';
 import database from '../database/database';

 const db = database;
 const Interface = db.define('interfaces', {
    Name: {
        type: Sequelize.STRING
    }, 
    ServiceName: {
         type: Sequelize.STRING
     },
     UserName: {
         type: Sequelize.STRING
     },
     URL: {
         type: Sequelize.STRING
     },
     AccessToken: {
         type: Sequelize.STRING
     },
     CryptedPassword: {
         type: Sequelize.STRING
     },
     Client: {
         type: Sequelize.STRING
     },
     AccountID: {
        type: Sequelize.STRING
     },
     InterfaceKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
     },
     ClientID: {
        type: Sequelize.STRING
     }
 });

export default Interface;
