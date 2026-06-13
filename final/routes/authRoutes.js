const express = require('express');
const router = express.Router();

const { register, login, logout } = require('../controllers/authController');
const { validateRegister } = require('../middleware/validate');

router.post('/register', validateRegister, register);
router.post('/login', login);
router.get('/logout', logout);

module.exports = router;
