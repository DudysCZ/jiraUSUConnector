import { Op } from 'sequelize';
import request from 'request';

const {Interface, BasicAuthCredential, OAuthCredential} = require('../models/sequelize');

const oauth_callback = async (req, res) => {
    //getCODE and clientKey from URL
    const userBounds = req.query['state'].split(":");
    const clientid = userBounds[0];
    const interfaceId = userBounds[1];
    const code = req.query['code'];
    
    const addon_config =  req.addon_config;

    var actualInterface = await Interface.findOne({ where: {
        [Op.and]: [
            {ClientID: clientid},
            {id: interfaceId}
            ]}, 
            include: [OAuthCredential, BasicAuthCredential],
            raw: true,
            nest: true
    });
    if (actualInterface == null) {
        console.log(clientid + ': OAuthCallback: No Interface record found.');
        res.sendStatus(404);
        return;
    }
    else {
        //anchor
        var options = {
            'method': 'POST',
            'url': "https://auth.atlassian.com/oauth/token",
            'headers': {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "grant_type":"authorization_code",
                "client_id": actualInterface.oauthcredential.OAClientID,
                "client_secret": actualInterface.oauthcredential.OASecret,
                "code":code,
                "redirect_uri":  addon_config.addon.config.localBaseUrl(),
            })
        };

        request(options, function (err, response) {
            if (err) {
                console.log(clientid + ': OAuthCallback: Error: ' + err);
                res.status(503).send();
                return;
            }
            var body = JSON.parse(response.body);
            //CHECK response body if everything went okay
            if (body.refresh_token) {
                const refreshToken = body.refresh_token;
                //save both gained tokens
                OAuthCredential.findOne({ where: {
                    [Op.and]: [
                        {ClientID: clientid},
                        {interfaceId: interfaceId}
                        ]},
                })
                .then(record => {
                    if (!record) {
                        console.log(clientid + ': OAuthCallback: No OAuthCredential record found.');
                        res.sendStatus(404);
                        return;
                    }
                    let values = {
                        OARefreshToken: refreshToken,
                    };
                    record.update(values).then( updatedRecord => {
                        //SEND UPDATED RECORD TO VM
                        let updatedRecordData = updatedRecord.get({ plain: true });
                        
                        var options = {
                            'method': 'POST',
                            'url': actualInterface.URL,
                            'headers': {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                "accessToken":actualInterface.AccessToken,
                                "username":actualInterface.UserName,
                                "password":actualInterface.CryptedPassword,
                                "encrypted":"Y",
                                "client":actualInterface.Client,
                                "service":actualInterface.ServiceName,
                                "params": {
                                    "interfaceActionName" : "SIT_USU_Atlassian_Connector_SetAuthenticationParams_Cloud_" + actualInterface.InterfaceKey,
                                    "accountId":actualInterface.AccountID,
                                    "client_id": updatedRecordData.OAClientID,
                                    "client_secret": updatedRecordData.OASecret,
                                    "refresh_token": updatedRecordData.OARefreshToken,
                                    "username":actualInterface.ExternalUsername,
                                    "password":actualInterface.ExternalUsernameToken,
                                    "sourceSystemName":"SIT_JIRA_CLOUD_" + actualInterface.InterfaceKey
                                }
                            })
                        };
                        
                        request(options, function (err, response) {
                            if (err) {
                                console.log(clientid + ': OAuthCallback: USU Request Error: ' + err);
                                res.sendStatus(response.statusCode);
                                return;
                            }
                            console.log("OAuthCallback: USU response: " + response.body);

                            var body = JSON.parse(response.body);
                            if (body["result"]["score"] === "success") {
                                res.status(200).send("OAuth: Successful. Now you can close this tab.");
                            }
                            else {
                                res.status(500).send("OAuth: Something gone wrong during the authorization process.");
                            }
                        });
                    });
                })
                .catch((err) => {
                res.status(500).send({
                    message: "OAuth: Error retrieving OAuthCredential: " + err
                });
                console.log(clientid + ': OAuthCallback: Error retrieving OAuthCredential: ' + err);
                });
            }
            else {
                console.log(clientid + ': OAuthCallback process went wrong: ' + body);
                res.sendStatus(401);
            }
        });
    }
}

module.exports = {
    oauth_callback
}