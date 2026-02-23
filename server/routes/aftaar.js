const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  createAftaarEntry,
  getAllAftaarEntries,
  deleteAftaarEntry,
  getReportData,
} = require('../controllers/aftaarController');

router.get('/', verifyToken, getAllAftaarEntries);
router.post('/', verifyToken, isAdmin, createAftaarEntry);
router.delete('/:id', verifyToken, isAdmin, deleteAftaarEntry);
router.get('/report', verifyToken, getReportData);

module.exports = router;
