import express from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  uploadBankStatement, 
  getBankStatement, 
  getAllBankStatements,
  getAllTransactions,
  deleteBankTransaction,
  deleteBankTransactions
} from '../controllers/bankStatementController';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Accept PDFs, CSVs, and Excel files
  const allowedTypes = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain' // Some exported bank statements are in text format
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
    // Return a new error for rejection but don't pass it to the callback
    return new Error('Invalid file type. Only PDF, CSV, and Excel files are allowed.');
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.post('/upload', upload.single('statement'), uploadBankStatement);
router.get('/transactions', getAllTransactions);
router.get('/:id', getBankStatement);
router.get('/', getAllBankStatements);

// Add delete routes
router.delete('/transactions/:id', deleteBankTransaction);
router.post('/transactions/bulk-delete', deleteBankTransactions);

export default router; 