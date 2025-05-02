const mongoose = require('mongoose');

// Bank Transaction Schema
const bankTransactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  destinatory: {
    type: String,
    trim: true
  },
  statementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankStatement',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
module.exports = mongoose.models.BankTransaction || mongoose.model('BankTransaction', bankTransactionSchema); 