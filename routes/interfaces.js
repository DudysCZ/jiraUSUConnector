import express from "express";
const router = express.Router();

const interfaceController = require('../controllers/interfaceController');

//all routes here start with /api/v1/interfaces

router.post("/", interfaceController.interface_create);
router.put("/:id",interfaceController. interface_update, );
router.get("/:id",interfaceController.interface_get );
router.delete("/:id", interfaceController.interface_delete);

module.exports = router;