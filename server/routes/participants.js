const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  getAllParticipants,
  createParticipant,
  getParticipantProfile,
  updateParticipant,
  deleteParticipant,
} = require('../controllers/participantController');

router.get('/', verifyToken, getAllParticipants);
router.post('/', verifyToken, isAdmin, createParticipant);
router.get('/:id', verifyToken, getParticipantProfile);
router.put('/:id', verifyToken, isAdmin, updateParticipant);
router.delete('/:id', verifyToken, isAdmin, deleteParticipant);

module.exports = router;
