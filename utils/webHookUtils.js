import Interface from "../models/Interface.js";
import { Op } from "sequelize";

function getWebHookAccountId(req) {
    var accountId;
    var webhookEvent = req.body.webhookEvent;

    switch (webhookEvent) {
        case "jira:issue_created":
            accountId = req.body.user.accountId;
            break;
        case "jira:issue_updated":
            accountId = req.body.user.accountId;
            break;
        case "comment_created":
            accountId = req.body.comment.author.accountId;
            break;
        case "comment_updated":
            accountId = req.body.comment.author.accountId;
            break;
        case "attachment_created":
            accountId = req.body.attachment.author.accountId;
            break;
        case "attachment_deleted":
            accountId = req.body.attachment.author.accountId;
            break;
        default:
            accountId = "";
        // code block
    }
    return accountId;
}

//Verify Dynamically Created Webhook
export const passRestWebhook = async (req, res, next) => {
    const clientToken = req.context.clientKey;
    var webhook_accountId = getWebHookAccountId(req);
    if (webhook_accountId !== "") {
        // Check if in database
        var actualInterF = await Interface.findOne({
            where: {
                [Op.and]: [
                    { AccountID: webhook_accountId },
                    { ClientID: clientToken },
                ],
            },
        });
        if (actualInterF === null) {
            console.log(clientToken + ": Dynamic-WH-Verification: accountIds are not the same: webhook-pass!");
            next();
        } 
        else {
            console.log(clientToken + ": Dynamic-WH-Verification: Loop-webhook-avoided");
            res.sendStatus(403);
        }
    } 
    else {
        console.log(clientToken + ": Dynamic-WH-Verification: " + req.body.webhookEvent + " not supported.");
        res.sendStatus(403);
    }
};

// Verify Webhook
export const passWebhook = async (req, res, next) => {
    const clientToken = req.query["interfacekey"];
    if (typeof clientToken !== "undefined") {
        var webhook_accountId = getWebHookAccountId(req);
        if (webhook_accountId !== "") {
            // Check if in database
            var actualInterF = await Interface.findOne({
                where: {
                    [Op.and]: [
                        { AccountID: webhook_accountId },
                        { InterfaceKey: clientToken },
                    ],
                },
            });
            if (actualInterF === null) {
                console.log(clientToken + ": WH-Basic-Verification: accountIds are not the same: webhook-pass!");
                next();
            } 
            else {
                console.log(clientToken + ": WH-Basic-Verification: Loop-webhook-avoided");
                res.sendStatus(403);
            }
        } 
        else {
            console.log(clientToken + ": WH-Basic-Verification: " + req.body.webhookEvent + " not supported.");
            res.sendStatus(403);
        }
    } 
    else {
        // Forbidden
        console.log(clientToken + ": WH-Basic-Verification: Access denied. InterfaceKey was not defined." );
        res.sendStatus(403);
    }
};