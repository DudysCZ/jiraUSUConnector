import express from 'express';
const router = express.Router();

const whController = require('../controllers/whController');
import { passRestWebhook} from '../utils/webHookUtils';

router.post('/', whController.webhook_register);
router.get('/:interfaceId', whController.webhook_get);
router.put('/', whController.webhook_refresh);
router.put('/status', whController. webhook_update_status);
router.delete('/', whController.webhook_delete);
router.post('/rest-register', passRestWebhook, whController.webhook_process);

module.exports = router;