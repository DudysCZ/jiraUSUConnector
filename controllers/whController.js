import { Op } from 'sequelize';
import request from 'request';
import {appendIssueAttachments} from '../utils/attachments.js';
const {Interface, WebHook} = require('../models/sequelize');

/*
    GET dynamically registered webhooks - authorized access.
    Atlassian GET - returns paginated list of the webhooks registered by the calling app.
    Get all webhooks for the specific interface from the helper WH table.
    If any of the Atlassian WHs corresponds to the specific interface WH - "save" it to show it.
*/
const webhook_get = (req, res) => {
    const clientKey = req.context.clientKey;
    const interfaceId = req.params.interfaceId;
    const addon_config =  req.addon_config;
    const httpClient = addon_config.addon.httpClient(req);
    httpClient.get({
        url: '/rest/api/2/webhook',
        headers: {
        "Accept": 'application/json',
        },
    }, function(err, httpResponse, body) {
        if (err) {
        console.log(clientKey + ': Dynamic-WH-Get: Error: ' + err);
        res.status(503).send({
            message: "Atlassian error: " + err
        });
        }
        else {
        var parseBody = JSON.parse(body);
        var interfaceWBIds = new Array();
        var specificIntWebHooks = new Array();
        WebHook.findAll({ where: {
            [Op.and]: [
                {ClientID: req.context.clientKey},
                {interfaceId:interfaceId}
                ]}
        }).then(webhooks => {
            webhooks.forEach(element => {
                var whElement = new Object();
                    whElement.id = parseInt(element.AtlassianID);
                    whElement.status = element.Status;

                interfaceWBIds.push(whElement);
            });
            parseBody.values.forEach((element) => {
                //if element in array of interface webhook id -> save it to show it
                interfaceWBIds.some(e => {
                    if (e.id === element.id) {
                        /* interfaceWBIds contains the element we're looking for */
                        element.status = e.status;
                        specificIntWebHooks.push(element);
                    }
                }); 
                
            });
            res.status(httpResponse.statusCode).json(JSON.stringify(specificIntWebHooks));
        }).catch((err) => {
            res.status(500).send({
                message: "Database error: couldn't retrieve the record."
            });
            console.log(clientKey + ': Dynamic-WH-Get:Retrieving WHs: Error: ' + err);
        });
        }
    });
}

// Refresh dynamically registered webhooks - authorized access
// Webhooks registered through the REST API expire after 30 days. "Call this resource periodically to keep them alive.
const webhook_refresh = (req, res) => {
    const clientKey = req.context.clientKey;
    const whId = req.body.id;
    const addon_config =  req.addon_config;
    const httpClient = addon_config.addon.httpClient(req);
    httpClient.put({
        url: '/rest/api/2/webhook/refresh',
        headers: {
        "Accept": 'application/json',
        "Content-Type": 'application/json',
        },
        json: true,
        body:   {
        "webhookIds": [whId]
        },
    }, function(err, httpResponse, body) {
        if (err) {
        console.log(clientKey + ': Dynamic-WH-Refresh: Error: ' + err);
        res.status(503).send({
            message: "Atlassian error: " + err
        });
        return;
        }
        console.log('Response: ' + httpResponse.statusCode + '\n Body: ' +  JSON.stringify(body));
        res.status(httpResponse.statusCode).json(body);
    });
}

/*
    DELETE dynamically registered webhooks - authorized access.
    Atlassian DELETE - removes webhooks by ID. Only webhooks registered by the calling app are removed.
    If Atlassien DELETE was succesfull - delete the WH even from the helper WH table.
*/
const webhook_delete = (req, res) => {
    const whId = req.body.id;
    const interfaceId = req.body.interfaceId;
    const addon_config =  req.addon_config;
    const httpClient = addon_config.addon.httpClient(req);
    const clientKey = req.context.clientKey;
    httpClient.del({
        url: '/rest/api/2/webhook',
        headers: {
        "Content-Type": 'application/json',
        },
        json: true,
        body:   {
        "webhookIds": [whId]
        },
    }, 
    function(err, httpResponse) {
        if (err) {
            console.log(clientKey + ': Dynamic-WH-Delete: Error: ' + err);
            res.status(503).send({
                message: "Atlassian error: " + err
            });
        }
        else if (httpResponse.statusCode === 202) {
            WebHook.findOne({ where: {
                [Op.and]: [
                    {ClientID: req.context.clientKey},
                    {interfaceId: interfaceId},
                    {AtlassianID: whId}
                    ]}
            }).then(webhookToDelete => {
                webhookToDelete.destroy();
                res.status(httpResponse.statusCode).send();
            })
            .catch((err) => {
                res.status(500).send({
                    message: "Database error: couldn't retrieve the record."
                });
                console.log(clientKey + ': Dynamic-WH-Delete: Error: ' + err);
            });
        }
        else {
            res.status(httpResponse.statusCode).send();
        }
    });
}

/*
    Register webhooks (dynamic) - authorized access.
    Atlassian REGISTER - Registers webhooks.
    If the registration was succesfull - create a record for the specivic interface in the helper WH table.
*/
const webhook_register = (req, res) => {
    const jqlFilter = req.body.jqlFilter;
    const events = req.body.events;
    const interfaceId = req.body.interfaceId;
    const clientId = req.context.clientKey;
    const addon_config =  req.addon_config;
    var httpClient = addon_config.addon.httpClient(req);
    httpClient.post({
        url: '/rest/api/2/webhook',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        },
        json: true,
        body:   {
        "webhooks": [
            {
            "jqlFilter": jqlFilter,
            "events": events
            }
        ], 
        "url": addon_config.addon.config.localBaseUrl() + 'api/v1/app-webhooks/rest-register'
        },
    }, 
    function(err, httpResponse, body) {
        if (err) {
            console.log(clientId + ': Dynamic-WH-Register: Error: ' + err);
            res.status(503).send({
                message: "Atlassian error: " + err
            });
            return;
        }
        console.log('Response: ' + httpResponse.statusCode + '\n Body: ' +  JSON.stringify(body));
        
        //save created one to the database if okay
        if (httpResponse.statusCode === 200) {
            if (body.webhookRegistrationResult[0].createdWebhookId) {
                WebHook.create({
                    ClientID: clientId,
                    interfaceId: interfaceId,
                    AtlassianID: body.webhookRegistrationResult[0].createdWebhookId,
                    Status: true
                }).then( 
                    res.status(httpResponse.statusCode).send(body)
                ).catch(err => {
                    res.status(500).send({
                        message: "Database error: couldn't create the record."
                    });
                    console.log(clientId + ': Dynamic-WH-Register: Create Error: ' + err);
                });
            }
            else {
                //wasnt't created
                console.log(clientId + ': Dynamic-WH-Register: Atlassian Error: ' + err);
                res.status(httpResponse.statusCode).send(body); 
            }
        }
        else {
            //status code different from 200
            console.log(clientId + ': Dynamic-WH-Register: Atlassian Error: ' + err);
            res.status(httpResponse.statusCode).send(body);
        }
    });
}

// Change status of dynamically registered webhooks - authorized access
const webhook_update_status = (req, res) => {
    const whId = req.body.id;
    const interfaceId = req.body.interfaceId;
    const status = req.body.status
    const clientKey = req.context.clientKey;
    console.log(whId + " " + "" + interfaceId + " " + status);
    WebHook.findOne({ where: {
        [Op.and]: [
            {ClientID: req.context.clientKey},
            {interfaceId:interfaceId},
            {AtlassianID: whId}
        ]}
    })
    .then(record => {
        if (!record) {
            console.log(clientKey + ': Dynamic-WH-Update-Status: No WebHook record found.');
            res.status(404).send({
                message: "Database error: record not found."
            });
            return;
        }
        let values = {
            Status: status,
        };
        record.update(values).then( 
            res.sendStatus(204)
            // login into your DB and confirm update
        );
    })
    .catch((err) => {
        res.status(500).send({
            message: "Database error: couldn't retrieve the record."
        });
        console.log(clientKey + ': Dynamic-WH-Update-Status: Error retrieving WebHook record: ' + err);
    });
}

// Processing of dynamically registered webhooks
const webhook_process = async (req, res) => {
    const clientToken = req.context.clientKey;
    const addon_config =  req.addon_config;

    //GET INTERFACES DATA FROM matchedWebhook attribute
    var matchedWebhookIds = req.body.matchedWebhookIds;
    var interfacesToSendWhTo = new Array();

    /*
        For each matched WB ID look to the helper table to check the WH status.
        If the status is not false - collect the interface (which the WH is linked to) info.
        If the status is false - avoid it.
    */
    for (const matchedId of matchedWebhookIds) {
        var webhook = await WebHook.findOne({ where: {
            [Op.and]: [
                {ClientID: req.context.clientKey},
                {AtlassianID:  matchedId.toString()}
                ]}
        });
        if (webhook == null) {
            console.log(clientToken + ': Dynamic-WH-processing: WebHook record not found!');
            res.status(500).send({
                message: 'Rest-Registered-WH-processing: WebHook record not found!'
            });
        }
        else {
            var webhookData = webhook.get({ plain: true });
            // if status false - don't search for anythin
            if (webhookData.Status !== false) {
                var interfaceToSendWbTo = await Interface.findOne({ where: {
                    [Op.and]: [
                        {ClientID: req.context.clientKey},
                        {id: webhookData.interfaceId}
                        ]}
                });
                if (interfaceToSendWbTo == null) {
                    console.log(clientToken + ': Dynamic-WH-processing: Interface record not found!');
                    res.status(500).send({
                        message: 'Rest-Registered-WH-processing: Interface record not found!'
                    });
                }
                else {
                    //add interfaceData where the WH should be send to
                    var interfaceData = interfaceToSendWbTo.get({ plain: true });
                    interfacesToSendWhTo.push(interfaceData);
                }
            }
            else {
                console.log(clientToken + ': Dynamic-WH-processing: WebHook has been avoided due to its status.');
            }
            
        }
    }

    // If there's no interface to send the webhook data to - don't do anything
    if (interfacesToSendWhTo.length === 0) {
        console.log(clientToken + ': Dynamic-WH-processing: No interface to send WebHook data to.'); 
        res.status(200).send();
        return;
    }
    
    var url;
    var interfaceAction;
    //Should be always there
    var webhookEvent = req.body.webhookEvent;
    var issueKey = req.body.issue.key;
    var addIssueParams = false;
    //interfaceAction mapping
    switch(webhookEvent) {
        case "jira:issue_created":
        url = '/rest/api/2/issue/' + issueKey;
        interfaceAction = "SIT_USU_Atlassian_Connector_CreateTicket_Cloud_";
        break;
        case "jira:issue_updated":
        url = '/rest/api/2/issue/' + issueKey;
        interfaceAction = "SIT_USU_Atlassian_Connector_UpdateTicket_Cloud_";
        break;
        case "comment_created":
        url = '/rest/api/2/issue/' + issueKey + '/comment/' + req.body.comment.id;
        interfaceAction = "SIT_USU_Atlassian_Connector_CreateTicketdesc_Cloud_";
        addIssueParams = true;
        break;
        case "comment_updated":
        url = '/rest/api/2/issue/' + issueKey + '/comment/' + req.body.comment.id;
        interfaceAction = "SIT_USU_Atlassian_Connector_UpdateTicketdesc_Cloud_";
        addIssueParams = true;
        break;
            
    }       
    // authorized access to client's Jira
    const httpClient = addon_config.addon.httpClient(req);
    httpClient.get({
        url: url,
        headers: {
            "Accept": 'application/json',
        },
        }, async function(err, httpResponse, body) {
        if (err) {
            console.log(clientToken + ': Dynamic-WH-GetJiraData: Error: ' + err);
            res.status(503).send({
                message: 'Dynamic-WH-GetJiraData: Error: ' + err
            });
            return;
        }
        var jiraGetRequestBody = JSON.parse(body);
        if (addIssueParams) {
            var issueParams = new Object();
                issueParams.key = issueKey;
            jiraGetRequestBody.issue = issueParams;
        }

        if (webhookEvent === "jira:issue_created") {

            try{
                console.log(clientToken + ': Dynamic-WH-processing: No. of attachments: ' + jiraGetRequestBody.fields.attachment.length);
            }
            catch (err) {
                console.log(clientToken + ': Dynamic-WH-processing: Aattachment processing Error: ' + err.message);
                return;
            }
            
            // check, if issue contains some attachment
            if (jiraGetRequestBody.fields.attachment.length > 0) {
                jiraGetRequestBody = await appendIssueAttachments(jiraGetRequestBody, null, addon_config.addon, req);
                if (jiraGetRequestBody == null) {
                    //GENERATE SOME ERROR
                    console.log(clientToken + ':Dynamic-WH-processing: Error: Something went wrong during the appendIssueAttachments processing.');
                    res.status(503).send({
                        message: "Dynamic-WH-processing: Error: Something went wrong during the appendIssueAttachments processing."
                    });
                    return;
                }                                    
            }
        }

        var responses = [];
        var completed_requests = 0;
    
        // Send WH data to every interface located in interfacesToSendWhTo array
        interfacesToSendWhTo.forEach(intData => {
            var options = {
                'method': 'POST',
                'url': intData.URL,
                'headers': {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                        "accessToken":intData.AccessToken,
                        "username":intData.UserName,
                        "password":intData.CryptedPassword,
                        "encrypted":"Y",
                        "client":intData.Client,
                        "service":intData.ServiceName,
                        "params": {
                            "interfaceActionName" : interfaceAction + intData.InterfaceKey,
                            "webHookBody" : jiraGetRequestBody
                        }
                })
            };
        
            //add fixie proxy only if configured
            if (process.env.FIXIE_URL){
                options.proxy = process.env.FIXIE_URL;
            }
            
            request(options, function (err, response) {
                if (err) {
                    var ErrorResponse = new Object();
                        ErrorResponse.url = options.url;
                        ErrorResponse.response = err.message;
                    completed_requests++;
                    responses.push(ErrorResponse);
                }
                else {
                    var USUResponse = new Object();
                        USUResponse.url = options.url;
                        USUResponse.response = response.body;
                    responses.push(USUResponse);
                    completed_requests++;
                }
                // after processing all requests - log the response
                if (completed_requests == interfacesToSendWhTo.length) {
                    console.log(clientToken + ': Dynamic-WH: USU responses:');
                    console.log(responses);
                    res.sendStatus(200);
                }
            });
        });
    });
}

module.exports = {
    webhook_get,
    webhook_refresh,
    webhook_delete,
    webhook_register,
    webhook_update_status,
    webhook_process
}