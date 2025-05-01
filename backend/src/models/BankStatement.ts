import mongoose, { Schema, Document } from 'mongoose';

export interface IBankStatement extends Document {
  fileName: string;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  startDate: Date;
  endDate: Date;
  startBalance: number;
  endBalance: number;
  currency: string;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  processed: boolean;
  processingErrors?: string[];
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankStatementSchema: Schema = new Schema({
  fileName: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountName: {
    type: String
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startBalance: {
    type: Number,
    required: true
  },
  endBalance: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'MUR'
  },
  totalCredits: {
    type: Number,
    required: true
  },
  totalDebits: {
    type: Number,
    required: true
  },
  transactionCount: {
    type: Number,
    required: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  processingErrors: [{
    type: String
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model<IBankStatement>('BankStatement', BankStatementSchema); 