
import { Op } from 'sequelize';
const {BasicAuthCredential} = require('../models/sequelize.js');

const basicauth_update = (req, res) => {
    const clientid = req.context.clientKey;
    const interfaceId = req.params.id;
    BasicAuthCredential.findOne({ where: {
        [Op.and]: [
            {ClientID: req.context.clientKey},
            {interfaceId:interfaceId}
            ]}
    })
    .then(record => {
        if (!record) {
            console.log(clientid + ': Update basicAuth: No basicAuth record found.');
            res.status(404).send({
                message: "Database error: record not found."
            });
            return;
        }
        let values = {
            ExternalUsername: req.body.externalUsername,
            ExternalUsernameToken: req.body.externalToken,
            CloudInstanceURL: req.body.cloudURL,
        };
          record.update(values).then( 
            res.sendStatus(204)
            // login into your DB and confirm update
          )
          .catch(err => {
            res.status(500).send({
                //the interfaceKey might be not unique
                message: "Database error: couldn't update the record."
            });
            console.log(clientid + ': Update basicAuth: Error:' + err);
          });
    })
    .catch((err) => {
        res.status(500).send({
            message: "Database error: couldn't retrieve the record."
        });
        console.log(clientid + ': Update basicAuth: Error: ' + err);
    });
}

module.exports = {
    basicauth_update
}