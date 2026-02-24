const AftaarEntry = require('../models/AftaarEntry');
const Participant = require('../models/Participant');
const Deposit = require('../models/Deposit');

const createAftaarEntry = async (req, res) => {
  try {
    const { date, totalBill, participantIds, note } = req.body;

    if (!date || !totalBill || !participantIds || participantIds.length === 0) {
      return res.status(400).json({
        message: 'Date, total bill, and at least one participant are required.',
      });
    }

    const validParticipants = await Participant.find({
      _id: { $in: participantIds },
      isActive: true,
    });

    if (validParticipants.length !== participantIds.length) {
      return res.status(400).json({
        message: 'One or more participants are invalid or inactive.',
      });
    }

    const perPersonShare = Math.round((Number(totalBill) / participantIds.length) * 100) / 100;

    const participants = participantIds.map((id) => ({
      participant: id,
      share: perPersonShare,
    }));

    const entry = await AftaarEntry.create({
      date: new Date(date),
      totalBill: Number(totalBill),
      perPersonShare,
      participants,
      note: note || '',
    });

    for (const id of participantIds) {
      await Participant.findByIdAndUpdate(id, {
        $inc: { totalExpense: perPersonShare },
      });
    }

    const populated = await AftaarEntry.findById(entry._id)
      .populate('participants.participant', 'name');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllAftaarEntries = async (req, res) => {
  try {
    const entries = await AftaarEntry.find()
      .populate('participants.participant', 'name')
      .sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAftaarEntry = async (req, res) => {
  try {
    const entry = await AftaarEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Aftaar entry not found.' });
    }

    for (const p of entry.participants) {
      await Participant.findByIdAndUpdate(p.participant, {
        $inc: { totalExpense: -p.share },
      });
    }

    await AftaarEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Aftaar entry deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReportData = async (req, res) => {
  try {
    const participants = await Participant.find().sort({ name: 1 });
    const deposits = await Deposit.find()
      .populate('participant', 'name')
      .sort({ date: -1 });
    const entries = await AftaarEntry.find()
      .populate('participants.participant', 'name')
      .sort({ date: -1 });

    const totalDeposits = participants.reduce((sum, p) => sum + p.totalDeposited, 0);
    const totalExpenses = participants.reduce((sum, p) => sum + p.totalExpense, 0);

    res.json({
      participants: participants.map((p) => ({
        name: p.name,
        totalDeposited: p.totalDeposited,
        totalExpense: p.totalExpense,
        remainingBalance: p.remainingBalance,
      })),
      deposits,
      aftaarEntries: entries,
      summary: {
        totalParticipants: participants.length,
        totalDeposits,
        totalExpenses,
        totalBalance: totalDeposits - totalExpenses,
        totalAftaarDays: entries.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAftaarEntry, getAllAftaarEntries, deleteAftaarEntry, getReportData };
