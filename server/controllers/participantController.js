const Participant = require('../models/Participant');
const Deposit = require('../models/Deposit');
const AftaarEntry = require('../models/AftaarEntry');

const getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find().sort({ name: 1 });
    const result = participants.map((p) => ({
      _id: p._id,
      name: p.name,
      totalDeposited: p.totalDeposited,
      totalExpense: p.totalExpense,
      remainingBalance: p.remainingBalance,
      isActive: p.isActive,
      createdAt: p.createdAt,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createParticipant = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    const participant = await Participant.create({ name: name.trim() });
    res.status(201).json({
      _id: participant._id,
      name: participant.name,
      totalDeposited: participant.totalDeposited,
      totalExpense: participant.totalExpense,
      remainingBalance: participant.remainingBalance,
      isActive: participant.isActive,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Participant with this name already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getParticipantProfile = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' });
    }

    const deposits = await Deposit.find({ participant: participant._id })
      .sort({ date: -1 });

    const aftaarEntries = await AftaarEntry.find({ 'participants.participant': participant._id })
      .sort({ date: -1 });

    const aftaarHistory = aftaarEntries.map((entry) => {
      const pEntry = entry.participants.find(
        (p) => p.participant.toString() === participant._id.toString()
      );
      return {
        _id: entry._id,
        date: entry.date,
        totalBill: entry.totalBill,
        share: pEntry ? pEntry.share : 0,
        totalParticipants: entry.participants.length,
      };
    });

    res.json({
      _id: participant._id,
      name: participant.name,
      totalDeposited: participant.totalDeposited,
      totalExpense: participant.totalExpense,
      remainingBalance: participant.remainingBalance,
      isActive: participant.isActive,
      totalAftaarParticipations: aftaarEntries.length,
      deposits,
      aftaarHistory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateParticipant = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' });
    }
    if (name) participant.name = name.trim();
    if (typeof isActive === 'boolean') participant.isActive = isActive;
    await participant.save();
    res.json({
      _id: participant._id,
      name: participant.name,
      totalDeposited: participant.totalDeposited,
      totalExpense: participant.totalExpense,
      remainingBalance: participant.remainingBalance,
      isActive: participant.isActive,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Participant with this name already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteParticipant = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' });
    }
    const hasDeposits = await Deposit.exists({ participant: participant._id });
    const hasAftaar = await AftaarEntry.exists({ 'participants.participant': participant._id });
    if (hasDeposits || hasAftaar) {
      participant.isActive = false;
      await participant.save();
      return res.json({ message: 'Participant deactivated (has transaction history).' });
    }
    await Participant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Participant deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllParticipants,
  createParticipant,
  getParticipantProfile,
  updateParticipant,
  deleteParticipant,
};
