const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const { createDeposit, getAllDeposits, deleteDeposit } = require('../controllers/depositController');

router.get('/', verifyToken, getAllDeposits);
router.post('/', verifyToken, isAdmin, createDeposit);
router.delete('/:id', verifyToken, isAdmin, deleteDeposit);

module.exports = router;
