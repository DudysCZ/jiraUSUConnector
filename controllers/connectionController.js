import request from 'request';
import { Op } from 'sequelize';

const {Interface, BasicAuthCredential} = require('../models/sequelize.js');

// Check USU connection
const connection_usu = async (req, res) => {
   //get interface data
   const clientKey = req.context.clientKey;
   const interfaceId = req.params.id;
   var actualInterF = await Interface.findOne({ where: {
       [Op.and]: [
           {ClientID: req.context.clientKey},
           {id:interfaceId}
           ]}
   });
   if (actualInterF == null) {
       console.log(clientKey + ': USU-Connection: Interface record not found!');
       res.status(500).send({
           message: "Database error: record not found."
       });
   }
   else {
       // Get plain data
       const interfaceData = actualInterF.get({ plain: true });

       var options = {
           'method': 'POST',
           'url': interfaceData.URL,
           'headers': {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify({
               "accessToken":interfaceData.AccessToken,
               "username":interfaceData.UserName,
               "password":interfaceData.CryptedPassword,
               "encrypted":"Y",
               "client":interfaceData.Client,
               "service":interfaceData.ServiceName,
               "params": {
                   "interfaceActionName" : "SIT_USU_Atlassian_Connector_CheckConnection_Cloud_" + interfaceData.InterfaceKey,
               }
           })
       };

       //add fixie proxy only if configured
       if (process.env.FIXIE_URL){
           options.proxy = process.env.FIXIE_URL;
       }

       request(options, function (err, response) {
           if (err) {
               console.log(clientKey + ': USU-Connection: Error: ' + err);
               res.status(503).send({
                   message: "Service Unavailable."
               });
               return;
           }
           console.log("USU-Connection response: " + response.body);
           res.json(response.body);
       });
   }
}

// Check JIRA connection
const connection_jira = (req, res) => {
    const interfaceId = req.params.id;
    const clientKey = req.context.clientKey;
    BasicAuthCredential.findOne({ where: {
        [Op.and]: [
            {ClientID: req.context.clientKey},
            {interfaceId:interfaceId}
            ]}
    }).then(record => {
        var basicAuthData = record.get({ plain: true });
        var credentials = basicAuthData.ExternalUsername + ":" + basicAuthData.ExternalUsernameToken;
        var url = basicAuthData.CloudInstanceURL  + '/rest/api/3/mypreferences/locale';
        var baseCR = Buffer.from(credentials).toString('base64');
        const AuthParams = "Basic " + baseCR;
        var options = {
            'method': 'GET',
            'url': url,
                'headers': {
                    'Authorization': AuthParams,
                    'Content-Type': 'application/json',
                },
        };

        request(options, function (err, response) {
            if (err) {
                console.log(clientKey + ': Jira-Connection: Error: ' + err);
                res.status(503).send({
                    message: err
                });
            }
            else {
                console.log(response.body);
                if (response.statusCode === 401) {
                    res.status(401).send({
                        message: "Authentication credentials are incorrect."
                    });
                }
                else {
                    res.status(response.statusCode).send();
                }
            }
        });
    }).catch((err) => {
        res.status(500).send({
          message: "Database error: couldn't retrieve the record."
        });
        console.log(clientKey + ': Jira-connection: Error retrieving BasicAuthCredential: ' + err);
    });
}

module.exports = {
    connection_usu,
    connection_jira
}