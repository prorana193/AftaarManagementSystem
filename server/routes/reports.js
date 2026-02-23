const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { generatePDFReport } = require('../controllers/pdfController');

router.get('/pdf', verifyToken, generatePDFReport);

module.exports = router;
