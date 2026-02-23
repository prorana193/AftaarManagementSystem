const mongoose = require('mongoose');

const aftaarEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  totalBill: {
    type: Number,
    required: [true, 'Total bill is required'],
    min: [1, 'Total bill must be at least 1'],
  },
  perPersonShare: {
    type: Number,
    required: true,
  },
  participants: [{
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
    },
    share: {
      type: Number,
      required: true,
    },
  }],
  note: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AftaarEntry', aftaarEntrySchema);
