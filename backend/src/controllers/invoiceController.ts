import { Request, Response } from 'express';
import { createWorker } from 'tesseract.js';
import { Invoice } from '../models/Invoice';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/invoices';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Process invoice using OCR
export const processInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();

    // Extract invoice data using regex patterns
    const invoiceData = extractInvoiceData(text);
    
    // Create new invoice
    const invoice = await Invoice.create({
      ...invoiceData,
      attachments: [req.file.path],
      createdBy: req.user?._id,
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get all invoices
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find({ createdBy: req.user?._id })
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get single invoice
export const getInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user?._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Update invoice
export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete invoice
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    // First find the invoice to get the attachments
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user?._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Delete attached files
    if (invoice.attachments && invoice.attachments.length > 0) {
      invoice.attachments.forEach((file: string) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    }

    // Now delete the invoice
    await Invoice.deleteOne({ _id: req.params.id });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function to extract invoice data from OCR text
function extractInvoiceData(text: string) {
  // Extract invoice number
  const invoiceNumberMatch = text.match(/Invoice\s*#?\s*([A-Z0-9-]+)/i);
  const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : '';

  // Extract dates
  const dateMatch = text.match(/Date:\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  const dueDateMatch = text.match(/Due\s*Date:\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  
  // Extract vendor information
  const vendorNameMatch = text.match(/Vendor:\s*([^\n]+)/i);
  const vatNumberMatch = text.match(/VAT\s*Number:\s*([A-Z0-9-]+)/i);
  
  // Extract items (this is a simplified version - you might need to adjust based on your invoice format)
  const itemsMatch = text.match(/Item[s]?:\s*([\s\S]+?)(?=Total|Subtotal)/i);
  const items = itemsMatch ? parseItems(itemsMatch[1]) : [];

  // Extract totals
  const subtotalMatch = text.match(/Subtotal:\s*([\d,.]+)/i);
  const vatTotalMatch = text.match(/VAT:\s*([\d,.]+)/i);
  const totalMatch = text.match(/Total:\s*([\d,.]+)/i);

  return {
    invoiceNumber,
    date: dateMatch ? new Date(dateMatch[1]) : new Date(),
    dueDate: dueDateMatch ? new Date(dueDateMatch[1]) : new Date(),
    vendor: {
      name: vendorNameMatch ? vendorNameMatch[1].trim() : '',
      vatNumber: vatNumberMatch ? vatNumberMatch[1] : '',
    },
    items,
    subtotal: subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0,
    vatTotal: vatTotalMatch ? parseFloat(vatTotalMatch[1].replace(/,/g, '')) : 0,
    total: totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0,
  };
}

// Helper function to parse items from OCR text
function parseItems(text: string) {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const parts = line.split(/\s+/);
    const quantity = parseFloat(parts[0]) || 0;
    const unitPrice = parseFloat(parts[parts.length - 2]) || 0;
    const totalAmount = parseFloat(parts[parts.length - 1]) || 0;
    const vatAmount = totalAmount * 0.15; // Assuming 15% VAT rate
    const description = parts.slice(1, -2).join(' ');

    return {
      description,
      quantity,
      unitPrice,
      vatRate: 15,
      vatAmount,
      totalAmount,
    };
  });
} 