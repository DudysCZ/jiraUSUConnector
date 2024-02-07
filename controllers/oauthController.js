import { Op } from 'sequelize';

const {OAuthCredential} = require('../models/sequelize');

const oauth_save_modify = (req, res) => {
    const clientKey = req.context.clientKey;
    //save oauthData
    OAuthCredential.findOne({ where: {
        [Op.and]: [
            {ClientID: req.context.clientKey},
            {interfaceId:req.body.interfaceId}
            ]}
    })
    .then(record => {
        if (!record) {
            console.log(clientKey + ': Update OAuth2: No OAuthCredential record found!');
            res.status(404).send({
                message: "Database error: record not found."
            });
            return;
        }
        let values = {
            OAClientID: req.body.oaclientid,
            OASecret: req.body.oasecret,
        }
        record.update(values).then( () => {
            // login into your DB and confirm update

            // process the authorization URL
            var url = String(req.body.oaurl);
            url = url.replace('${YOUR_USER_BOUND_VALUE}', req.context.clientKey + ":" + req.body.interfaceId);
            url = url.replace('scope=', 'scope=offline_access%20');

            res.send(url);
        })
        .catch(err => {
            res.status(500).send({
                //the interfaceKey might be not unique
                message: "Database error: couldn't update the record."
            });
            console.log(clientKey + ': Update OAuth2: Error:' + err);
        });
    })
    .catch((err) => {
        res.status(500).send({
            message: "Database error: couldn't retrieve the record."
        });
        console.log(clientKey + ': Update OAuth2: Error  retrieving OAuthCredential: ' + err);
    });
}

module.exports = {
    oauth_save_modify
}