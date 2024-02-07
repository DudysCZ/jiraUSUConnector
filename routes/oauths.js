import express from 'express';
const router = express.Router();

const oauthController = require('../controllers/oauthController');

//all routes here start with /api/v1/oauth2
router.put('/', oauthController.oauth_save_modify);

module.exports = router;