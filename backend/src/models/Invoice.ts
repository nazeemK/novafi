import mongoose from 'mongoose';

export interface IInvoice extends mongoose.Document {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  vendor: {
    name: string;
    vatNumber?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  vatTotal: number;
  total: number;
  currency: string;
  status: 'pending' | 'processed' | 'paid';
  paymentMethod?: string;
  paymentDate?: Date;
  notes?: string;
  attachments: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Invoice date is required'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  vendor: {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    vatNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  items: [{
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    vatRate: {
      type: Number,
      required: [true, 'VAT rate is required'],
      min: [0, 'VAT rate cannot be negative'],
      default: 15, // Default VAT rate in Mauritius
    },
    vatAmount: {
      type: Number,
      required: [true, 'VAT amount is required'],
      min: [0, 'VAT amount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
  }],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative'],
  },
  vatTotal: {
    type: Number,
    required: [true, 'VAT total is required'],
    min: [0, 'VAT total cannot be negative'],
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative'],
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'MUR',
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    trim: true,
  },
  paymentDate: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
  },
  attachments: [{
    type: String,
    trim: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required'],
  },
}, {
  timestamps: true,
});

// Calculate totals before saving
invoiceSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    this.vatTotal = this.items.reduce((sum, item) => sum + item.vatAmount, 0);
    this.total = this.subtotal + this.vatTotal;
  }
  next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema); 