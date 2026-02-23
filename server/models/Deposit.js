const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: [true, 'Participant is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be at least 1'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Deposit', depositSchema);
