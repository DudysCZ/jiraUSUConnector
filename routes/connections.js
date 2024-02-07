import express from 'express';
const router = express.Router();

const connectionController = require('../controllers/connectionController');

//all routes here start with /api/v1/oauth2
router.get('/usu-connection/:id', connectionController.connection_usu);
router.get('/jira-connection/:id', connectionController.connection_jira);

module.exports = router;