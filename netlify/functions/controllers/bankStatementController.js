const BankStatement = require('../models/BankStatement');
const BankTransaction = require('../models/BankTransaction');
const { extractMCBTransactions } = require('../services/parsers/mcbParser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join('/tmp', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Configure upload
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
}).single('statement');

// Get all bank statements
exports.getAllBankStatements = async (req, res) => {
  try {
    const statements = await BankStatement.find().sort({ createdAt: -1 });
    res.json(statements);
  } catch (error) {
    console.error('Error getting bank statements:', error);
    res.status(500).json({ message: 'Failed to retrieve bank statements' });
  }
};

// Get a bank statement by ID
exports.getBankStatementById = async (req, res) => {
  try {
    const statement = await BankStatement.findById(req.params.id);
    
    if (!statement) {
      return res.status(404).json({ message: 'Bank statement not found' });
    }
    
    const transactions = await BankTransaction.find({ statementId: statement._id })
      .sort({ date: -1 });
    
    res.json({ statement, transactions });
  } catch (error) {
    console.error('Error getting bank statement:', error);
    res.status(500).json({ message: 'Failed to retrieve bank statement' });
  }
};

// Upload and process a bank statement
exports.uploadBankStatement = async (req, res) => {
  // Use multer to handle file upload
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(400).json({ message: err.message || 'Error uploading file' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
      // Extract text from PDF
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      const pdfText = pdfData.text;
      
      // Extract information from the PDF text
      const transactions = extractMCBTransactions(pdfText);
      
      if (transactions.length === 0) {
        return res.status(400).json({ message: 'No transactions found in the statement' });
      }
      
      // Create a new bank statement
      const statement = new BankStatement({
        accountNumber: 'Auto-detected', // This would be extracted in a real implementation
        bankName: 'MCB', // This would be detected based on the statement format
        currency: 'MUR', // This would be extracted in a real implementation
        startDate: transactions[transactions.length - 1].date,
        endDate: transactions[0].date,
        openingBalance: transactions[transactions.length - 1].balance,
        closingBalance: transactions[0].balance
      });
      
      // Save the statement
      await statement.save();
      
      // Create transaction records
      const transactionRecords = transactions.map(tx => ({
        ...tx,
        statementId: statement._id
      }));
      
      // Save all transactions
      await BankTransaction.insertMany(transactionRecords);
      
      // Delete the temporary file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json({
        success: true,
        message: 'Bank statement processed successfully',
        statementId: statement._id,
        statement: statement,
        transactions: transactionRecords
      });
    } catch (error) {
      console.error('Error processing bank statement:', error);
      res.status(500).json({ message: 'Failed to process bank statement' });
    }
  });
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await BankTransaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Failed to retrieve transactions' });
  }
}; 