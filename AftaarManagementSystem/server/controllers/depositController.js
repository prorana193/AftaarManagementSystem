const Deposit = require('../models/Deposit');
const Participant = require('../models/Participant');

const createDeposit = async (req, res) => {
  try {
    const { participantId, amount, date, note } = req.body;

    if (!participantId || !amount || !date) {
      return res.status(400).json({ message: 'Participant, amount, and date are required.' });
    }

    const participant = await Participant.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' });
    }

    const deposit = await Deposit.create({
      participant: participantId,
      amount: Number(amount),
      date: new Date(date),
      note: note || '',
    });

    participant.totalDeposited += Number(amount);
    await participant.save();

    const populated = await Deposit.findById(deposit._id).populate('participant', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .populate('participant', 'name')
      .sort({ date: -1 });
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found.' });
    }

    const participant = await Participant.findById(deposit.participant);
    if (participant) {
      participant.totalDeposited -= deposit.amount;
      await participant.save();
    }

    await Deposit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deposit deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDeposit, getAllDeposits, deleteDeposit };
