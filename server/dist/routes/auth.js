"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Route for user registration
router.post('/register', authController_1.register);
// Route for user login
router.post('/login', authController_1.login);
// Example of a protected route
router.get('/profile', auth_1.authenticate, (req, res) => {
    res.status(200).json({ message: 'This is a protected route', user: req.user });
});
exports.default = router;
