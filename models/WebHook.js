import Sequelize from 'sequelize';
import database from '../database/database';

const db = database;
const WebHook = db.define('webhooks', {
    AtlassianID: {
        type: Sequelize.STRING
    },
    ClientID: {
        type: Sequelize.STRING
    },
    Status: {
        type: Sequelize.BOOLEAN
    },
});

export default WebHook;
