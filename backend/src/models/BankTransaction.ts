import mongoose, { Schema, Document } from 'mongoose';

export interface IBankTransaction extends Document {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
  category?: string;
  reference?: string;
  destinatory?: string;
  statementId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankTransactionSchema: Schema = new Schema({
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
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
    type: String
  },
  reference: {
    type: String
  },
  destinatory: {
    type: String
  },
  statementId: {
    type: Schema.Types.ObjectId,
    ref: 'BankStatement',
    required: true
  }
}, { timestamps: true });

export default mongoose.model<IBankTransaction>('BankTransaction', BankTransactionSchema); 