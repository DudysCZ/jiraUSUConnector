import express from 'express';
const router = express.Router();

const oauthCallBackController = require('../controllers/oauthCallBackController');

//all routes here start with /api/v1/oauth2
router.get('/', oauthCallBackController.oauth_callback);

module.exports = router;