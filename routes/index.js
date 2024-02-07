const interfacesRoutes = require('./interfaces');
const basicAuthRoutes = require('./basicauths');
const dynamicWHRoutes = require('./dynamicWebhooks');
const oAuthRoutes = require('./oauths');
const oAuthCallBackRoutes = require('./oauthCallback');
const connectionRoutes = require('./connections');

import { processAttachment, appendIssueAttachments } from '../utils/attachments.js';
import request from 'request';
import {passWebhook} from '../utils/webHookUtils';

const {Interface, BasicAuthCredential, OAuthCredential, WebHook} = require('../models/sequelize.js');

export default function routes(app, addon) {
	// Redirect root path to /atlassian-connect.json,
	// which will be served by atlassian-connect-express.
	app.get('/', (req, res) => {
		res.redirect('/atlassian-connect.json');
	});

    app.post('/uninstalled', addon.authenticate(), async function (req) {
        //after uinstalling all atlassian webhooks are gone -> need to be deleted from the helper database table as well
        const AtlasClientKey = req.context.clientKey;
        await WebHook.destroy({where: {
            ClientID: AtlasClientKey
        }});
        console.log(AtlasClientKey + ": After Uninstall:  WebHooks records dropped!");
    });

    //AFTER THE MOMENT OF SHARING KEYS ... CREATE INTERFACE + OAuthCredential
    addon.on('host_settings_saved', function(clientKey) {

        //if already exist - don't add it
        Interface.findOne({where: {ClientID: clientKey}})
        .then(record => {
            if (!record) {
                Interface.create({
                    ClientID: clientKey,
                    Name: "Default",
                    ServiceName: "",
                    UserName: "",
                    URL: "",
                    AccessToken: "",
                    CryptedPassword: "",
                    Client: "",
                    InterfaceKey: clientKey,
                    AccountID: "",
                })
                .then(newInterface => {
                    console.log(clientKey + ": After Install: Interface created.");
                    OAuthCredential.create({
                        ClientID: clientKey,
                        OAClientID: "",
                        OARefreshToken: "",
                        OASecret: "",
                        interfaceId: newInterface.id
                    }).then(() => console.log(clientKey + ": After Install: OAuthCredential created."))
                    .catch(err => console.log(clientKey + ": After Install: OAuthCredential: " + err));
                    
                    BasicAuthCredential.create({
                        ClientID: clientKey,
                        ExternalUsername: "",
                        ExternalUsernameToken: "",
                        CloudInstanceURL: "",
                        interfaceId: newInterface.id
                    }).then(() => console.log(clientKey + ": After Install: BasicAuthCredential created."))
                    .catch(err => console.log(clientKey + ": After Install: BasicAuthCredential: " + err));
                })
                .catch(err => console.log(clientKey + ": After Install: Interface created: " + err));
            }
            else {
                console.log(clientKey + ": After Install: An interface within this current client already exists.");
            }
        })
        .catch((err) => {
            console.log(clientKey + ": After Install: Error retrieving Interface: " + err + ".");
        });
    });

	// Add additional route handlers here...
    app.use('/api/v1/connection', addon.checkValidToken(), connectionRoutes);
    app.use('/api/v1/interfaces', addon.checkValidToken(), interfacesRoutes);
    app.use('/api/v1/basicauth', addon.checkValidToken(), basicAuthRoutes);
    app.use('/api/v1/oauth2/credential', addon.checkValidToken(), oAuthRoutes);
    app.use('/api/v1/oauth2', function (req, res, next) {
        req.addon_config = {
            addon: addon,
        };
        next();
    },  oAuthCallBackRoutes);
    app.use('/api/v1/app-webhooks', addon.checkValidToken(), function (req, res, next) {
        req.addon_config = {
            addon: addon,
        };
        next();
    }, dynamicWHRoutes);

    // Processing of webhooks created within the Jira System
    app.post("/api/v1/hooks-basic", passWebhook, async (req, res) => {
        const interfaceKey = req.query['interfacekey'];
        //get interface data
        var actualInterF = await Interface.findOne({ where: {InterfaceKey: interfaceKey},
            include: [OAuthCredential, BasicAuthCredential],
            raw: true,
            nest: true, });
        if (actualInterF == null) {
            console.log("InterfaceKey: " + interfaceKey + ': WH-Basic: Interface record not found!');
            res.sendStatus(404);
        }
        else {

            const atlasClientId = actualInterF.ClientID;
            // BASIC AUTHORIZATION
            var basicAuthData = actualInterF.basicauthcredential;
            const credentials = basicAuthData.ExternalUsername + ":" + basicAuthData.ExternalUsernameToken;
            var baseCR = Buffer.from(credentials).toString('base64');
            const AuthParams = "Basic " + baseCR;

            var url;
            var interfaceAction;

            var issueKey;
            //Should be always there
            var webhookEvent = req.body.webhookEvent;
            if (webhookEvent === "attachment_created") {
                issueKey = req.query['issue_key']
            }
            else {
                issueKey = req.body.issue.key;
            }                    
            var addIssueParams = false;                     

            //interfaceAction mapping
            switch(webhookEvent) {
                case "jira:issue_created":
                    url = basicAuthData.CloudInstanceURL + '/rest/api/2/issue/' + issueKey;
                    interfaceAction = "SIT_USU_Atlassian_Connector_CreateTicket_Cloud_";
                    break;
                case "jira:issue_updated":
                    url = basicAuthData.CloudInstanceURL + '/rest/api/2/issue/' + issueKey;
                    interfaceAction = "SIT_USU_Atlassian_Connector_UpdateTicket_Cloud_";
                    break;
                case "comment_created":
                    url = basicAuthData.CloudInstanceURL + '/rest/api/2/issue/' + issueKey + '/comment/' + req.body.comment.id;
                    interfaceAction = "SIT_USU_Atlassian_Connector_CreateTicketdesc_Cloud_";
                    addIssueParams = true;
                    break;
                case "comment_updated":
                    url = basicAuthData.CloudInstanceURL + '/rest/api/2/issue/' + issueKey + '/comment/' + req.body.comment.id;
                    interfaceAction = "SIT_USU_Atlassian_Connector_UpdateTicketdesc_Cloud_";
                    addIssueParams = true;
                    break;
                case "attachment_created":                            
                    interfaceAction = "SIT_USU_Atlassian_Connector_CreateAttachment_Cloud_";
                    var attachmentId = req.body.attachment.id;
                    break;
                case "attachment_deleted":
                    url = basicAuthData.CloudInstanceURL + '/rest/api/2/issue/' + issueKey;
                    interfaceAction = "SIT_USU_Atlassian_Connector_DeleteAttachment_Cloud_";
                    break;
                default:
                    // code block
            }                  

            if (webhookEvent === "attachment_created") {      
                var attachment = {};
                try {
                    attachment = await processAttachment(issueKey, attachmentId, AuthParams, basicAuthData.CloudInstanceURL);
                }
                catch(err) {
                    console.log(atlasClientId + ': WH-Basic-AC: Error: Something went wrong during the attachment processing.');
                    res.status(503).send();
                    return;
                }     
                callInterfaceAction(actualInterF, attachment, interfaceAction, interfaceKey, res);
            }
            else {
                console.log(atlasClientId + ': WH-Basic: URL to send to: ' + url);
                // getRequest to the client's Jira
                var options = {
                    'method': 'GET',
                    'url': url,
                    'headers': {
                        'Authorization': AuthParams,
                        'Content-Type': 'application/json',
                    },
                };

                request(options, async function (err, response) {
                    if (err) {
                        console.log(atlasClientId + ': WH-Basic: Error: ' + err);
                        res.status(503).send();
                        return;
                    }

                    var jiraGetRequestBody = JSON.parse(response.body);

                    if (addIssueParams) {                 
                        var issueParams = new Object();
                        issueParams.key = issueKey;             
                        jiraGetRequestBody.issue = issueParams;
                    }

                    if (webhookEvent === "jira:issue_created") {

                        try{
                            console.log(atlasClientId + ': WH-Basic: No. of attachments: ' + jiraGetRequestBody.fields.attachment.length);
                        }
                        catch (err) {
                            console.log(atlasClientId + ': WH-Basic: Aattachment processing Error: ' + err.message);
                            return;
                        }
                        
                        // check, if issue contains some attachment
                        if (jiraGetRequestBody.fields.attachment.length > 0) {
                            jiraGetRequestBody = await appendIssueAttachments(jiraGetRequestBody, AuthParams, null, null);
                            if (jiraGetRequestBody == null) {
                                //GENERATE SOME ERROR
                                console.log(atlasClientId + ': WH-Basic: Error: Something went wrong during the appendIusseAttachment processing.');
                                res.status(503).send();
                                return;
                            }                                    
                        }
                    }
                    callInterfaceAction(actualInterF, jiraGetRequestBody, interfaceAction, interfaceKey, res);
                });
            } 
        }
    });

    function callInterfaceAction(interfaceData, requestBody, interfaceAction, interfaceKey, res) {
        
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
                        "interfaceActionName" : interfaceAction + interfaceKey,
                        "webHookBody" : requestBody
                    }
                })
            };
            //add fixie proxy only if configured
            if (process.env.FIXIE_URL){
                options.proxy = process.env.FIXIE_URL;
            }

            request(options, function (err, response) {
                if (err) {
                    console.log("InterfaceKey: " + interfaceKey + ': WH-Basic: Error: ' + err);
                    res.status(503).send();
                    return;
                }
                console.log("InterfaceKey: " + interfaceKey + ": WH-Basic: USU response: " + response.body);
                res.sendStatus(200);
            });
    }

    // Render the main page
	app.get('/admin-form', addon.authenticate(), async function(req, res) {
        const clientKey = req.context.clientKey;
        if (req.query['lic'] === "active" || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'development' ) {
            var interfaces = await Interface.findAll({ where: {ClientID: req.context.clientKey},
                                                         include: [OAuthCredential, BasicAuthCredential],
                                                         raw: true,
                                                         nest: true, }).
                                                         catch(err => console.log(clientKey + ': Settings page:  Error: ' + err));
                                     
            if (interfaces.length === 0) { //or undefined
                console.log(clientKey + ': Settings page: Interface record: Not found!');
            }
            
            res.render('interfaces-page', { title: "USU-Service-Management-Connector",
                                       data: interfaces,
            });
            
        }
        else {
            res.render('license-page', { title: "USU Service Management Connector for Jira License"});
        }
    });
}