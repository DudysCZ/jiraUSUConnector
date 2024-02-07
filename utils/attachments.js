import request from 'request';

// output structure for webhook event attachment_created
function prepareAttachmentToSend(att) {

    var body = {
        "key": att.issueKey,
        "attachments": [
            {
                "name": att.filename,
                "value": att.body
            }
        ]
    };

    return body;        
}

// process attachment for webhook event attachment_created
export function processAttachment(issueKey, attId, authParams, jiraUrl) {    
    return new Promise(function (resolve, reject) {
        var url = jiraUrl + '/rest/api/2/attachment/' + attId;

        // getRequest to the client's Jira
        var options = {
            'method': 'GET',
            'url': url,
            'headers': {
                'Authorization': authParams,
                'Content-Type': 'application/json',
            },
        };    
    
        request(options, function (error, response) {
            if (error) {
                console.log("WH-Basic:  processAttachment: " + error);
                reject(error);
            }
    
            
            var body = JSON.parse(response.body);
    
            var att = {};
            att.issueKey = issueKey;
            att.filename = body.filename;
            att.filesize = body.size;
            att.mimeType = body.mimeType;
            att.created = body.created;
            att.id = body.id;
            att.contentUrl = body.content;
            att.thumbnailUrl = body.thumbnail;
    
            url = att.contentUrl;
        
            var options = {
                // 'method': 'GET',
                'url': url,
                'headers': {
                    'Authorization': authParams,
                },
                'encoding': null
            };
    
            request(options, function (error, response) {
                if (error) {
                    console.log("WH-Basic:  processAttachment: " + error);
                    reject(error)
                }
                att.body = response.body.toString('base64');
                var prepared = prepareAttachmentToSend(att);
                resolve(prepared);
            })
        });  
    });         
}

// output structure of attachments for webhook event issue_created
function prepareIssueAttachmentsToSend(atts) {
    var result = [];
    for (var i = 0; i < atts.length; i++) {
        var att = atts[i];
        result.push({"name": att.filename, "value": att.body});      
    }
    return result;
}

// attachment get for webhook event issue_created
function getAttchment(attachmentBody, issueKey, authParams) {
    return new Promise(function (resolve, reject) {
        var att = {};
        att.issueKey = issueKey;
        att.filename = attachmentBody.filename;
        att.filesize = attachmentBody.size;
        att.mimeType = attachmentBody.mimeType;
        att.created = attachmentBody.created;
        att.id = attachmentBody.id;
        att.contentUrl = attachmentBody.content;
        att.thumbnailUrl = attachmentBody.thumbnail;

        var url = att.contentUrl;

        var options = {
            // 'method': 'GET',
            'url': url,
            'headers': {
                'Authorization': authParams,
            },
            'encoding': null
        };

        request(options, async function (error, response) {
            if (error) {
                reject(error);
            }
            att.body = response.body.toString('base64');
            resolve(att);
        });
    }); 
}

// attachment get for webhook event issue_created - uses addon.httpClient (for DynamicWH)
function getAttchmentAddon(attachmentBody, issueKey, addon, req) {
    return new Promise(function (resolve, reject) {
        var att = {};
        att.issueKey = issueKey;
        att.filename = attachmentBody.filename;
        att.filesize = attachmentBody.size;
        att.mimeType = attachmentBody.mimeType;
        att.created = attachmentBody.created;
        att.id = attachmentBody.id;
        att.contentUrl = attachmentBody.content;
        att.thumbnailUrl = attachmentBody.thumbnail;

        var url = att.contentUrl;

        const httpClient = addon.httpClient(req);
        httpClient.get({
            'url': url,
            'encoding': null
        }, async function(err,  response) {
            if (err) {
                reject(err);
            }
            att.body = response.body.toString('base64');
            resolve(att);
        });
    }); 
}

// processing of attachments for webhook event issue_created
export async function appendIssueAttachments(issueBody, authParams, addon, req) {  
    var issueKey = issueBody.key;
    var atts = [];
    for (var i = 0; i < issueBody.fields.attachment.length; i++) {
        var attachmentBody = issueBody.fields.attachment[i];
        var att;
        //if there's no authParams use getAttchmentAddon  (authorization is handled by the add-on - DynamicWH)
        try {
            if (authParams === null) {
                att = await getAttchmentAddon(attachmentBody, issueKey, addon, req);
            }
            else {
                att = await getAttchment(attachmentBody, issueKey, authParams);
            }
        }
        catch(err) {
            console.log("WH-Basic: getAttchmentAddon: " + err);
            return null;
        }
        atts.push(att);       
    }
    var prepared = prepareIssueAttachmentsToSend(atts);       
    issueBody.attachments = prepared;
    return issueBody;  
}