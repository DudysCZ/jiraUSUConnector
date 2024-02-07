import express from 'express';
const router = express.Router();

const basicauthController = require('../controllers/basicauthController');

//all routes here start with /api/v1/basicauth
router.put('/:id', basicauthController.basicauth_update);

module.exports = router;