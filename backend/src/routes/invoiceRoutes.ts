import express from 'express';
import { auth } from '../middleware/auth';
import {
  processInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  upload,
} from '../controllers/invoiceController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Process new invoice with OCR
router.post('/process', upload.single('invoice'), processInvoice);

// Get all invoices
router.get('/', getInvoices);

// Get single invoice
router.get('/:id', getInvoice);

// Update invoice
router.put('/:id', updateInvoice);

// Delete invoice
router.delete('/:id', deleteInvoice);

export default router; 