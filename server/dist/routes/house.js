"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const houseController_1 = require("../controllers/houseController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, houseController_1.registerHouse);
router.get('/:userId', auth_1.authenticate, houseController_1.getHousesByUser);
exports.default = router;
