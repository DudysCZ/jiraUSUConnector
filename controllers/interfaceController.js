const {Interface, BasicAuthCredential, OAuthCredential} = require("../models/sequelize");
import { Op } from "sequelize";

const interface_create = (req, res) => {
    const clientKey = req.context.clientKey;
    Interface.create({
        ClientID: clientKey,
        Name: "New Interface",
        ServiceName: "",
        UserName: "",
        URL: "",
        AccessToken: "",
        CryptedPassword: "",
        Client: "",
        InterfaceKey: "",
        AccountID: "",
    })
    .then((newInterface) => {
        console.log(clientKey + ": New Interface: Interface created.");

        OAuthCredential.create({
            ClientID: clientKey,
            OAClientID: "",
            OARefreshToken: "",
            OASecret: "",
            interfaceId: newInterface.id,
        })
        .then(() => {
            console.log(
                clientKey + ": New Interface: OAuthCredential created."
            );
        })
        .catch((err) => {
            console.log(clientKey + ": New Interface OAuthCredential: Error: " + err);
            res.status(500).send({
                message:
                    "Database error: Creating OAuthCredential record.",
            });
            return;
        });

        BasicAuthCredential.create({
            ClientID: clientKey,
            ExternalUsername: "",
            ExternalUsernameToken: "",
            CloudInstanceURL: "",
            interfaceId: newInterface.id,
        })
        .then(() => {
            console.log(clientKey + ": New Interface: BasicAuthCredential created." );
            res.status(200).send(newInterface);
        })
        .catch((err) => {
            console.log(clientKey + ": New Interface BasicAuthCredential: Error: " + err);
            res.status(500).send({
                message:
                    "Database error: Creating AuthCredential record.",
                });
            });
    })
    .catch((err) => {
        console.log(clientKey + ": New Interface: Error: " + err);
        res.status(500).send({
            message: "Database error: Creating Interface record.",
        });
    });
} 

const interface_update = (req, res) => {
    const clientKey = req.context.clientKey;
    const interfaceId = req.params.id;
    Interface.findOne({
        where: {
            [Op.and]: [
                { ClientID: req.context.clientKey },
                { id: interfaceId },
            ],
        },
    })
    .then((record) => {
        if (!record) { 
            console.log( clientKey + ": Update interface: No interface record found." );
            res.status(404).send({
                message: "Databse error: : record not found.",
            });
            return;
        }
        let values = {
            Name: req.body.name,
            ServiceName: req.body.service,
            UserName: req.body.username,
            URL: req.body.url,
            AccessToken: req.body.accessToken,
            CryptedPassword: req.body.password,
            Client: req.body.client,
            AccountID: req.body.accountId,
            InterfaceKey: req.body.interfaceKey,
        };
        record
            .update(values)
            .then((updatedRecord) => {
                res.send(updatedRecord);
            })
            .catch((err) => {
                res.status(500).send({
                    //the interfaceKey might be not unique
                    message: "Database error: couldn't update the record.",
                });
                console.log(clientKey + ": Error updating Interface:" + err);
            });
    })
    .catch((err) => {
        res.status(500).send({
            message: "Database error: couldn't retrieve the record.",
        });
        console.log(clientKey +  ": Update interface: Error retrieving interface: " + err);
    });
}

const interface_get = (req, res) => {
    const clientKey = req.context.clientKey;
    const interfaceId = req.params.id;

    Interface.findOne({
        where: {
            [Op.and]: [
                { ClientID: req.context.clientKey },
                { id: interfaceId },
            ],
        },
        include: [OAuthCredential, BasicAuthCredential],
    })
    .then((interfaceToGet) => res.send(interfaceToGet))
    .catch((err) => {
        res.status(500).send({
            message: "Database error: couldn't retrieve the record.",
        });
        console.log(clientKey + ": GET: Error retrieving Interface:" + err);
    });
}

const interface_delete = (req, res) => {
    const clientKey = req.context.clientKey;
    const interfaceId = req.params.id;
    Interface.findOne({
        where: {
            [Op.and]: [
                { ClientID: req.context.clientKey },
                { id: interfaceId },
            ],
        },
    })
    .then((interfaceToDelete) => {
        interfaceToDelete.destroy();
        res.status(200).send();
    })
    .catch((err) => {
        res.status(500).send({
            message: "Database error: couldn't retrieve the record.",
        });
        console.log(clientKey + ": Deleting interface: Error: " + err);
    });
}

module.exports = {
    interface_create,
    interface_update,
    interface_get,
    interface_delete
}