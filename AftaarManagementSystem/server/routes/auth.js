const express = require('express');
const router = express.Router();
const { login, verifySession } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.get('/verify', verifyToken, verifySession);

module.exports = router;
