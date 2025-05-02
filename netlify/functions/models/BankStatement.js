const mongoose = require('mongoose');

// Bank Statement Schema
const bankStatementSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    required: true,
    trim: true,
    default: 'USD'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  openingBalance: {
    type: Number
  },
  closingBalance: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
module.exports = mongoose.models.BankStatement || mongoose.model('BankStatement', bankStatementSchema); 