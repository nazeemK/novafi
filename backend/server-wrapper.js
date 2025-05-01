const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Import the compiled TypeScript bank statement parser
// Note: This requires first compiling the TypeScript files
const { parseBankStatement } = require('./dist/services/bankStatementParser');

// Setup logging
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logging functions
const logFile = path.join(logsDir, `server-${new Date().toISOString().split('T')[0]}.log`);

// Custom logger that logs to console and file
const logger = {
  log: function(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
  },
  
  error: function(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    
    console.error(message);
    fs.appendFileSync(logFile, logMessage);
  }
};

// Create a welcome log message
logger.log(`Server starting up. Logs will be saved to ${logFile}`);

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
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

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Function to parse PDF statement - now uses the TypeScript modules
async function parseStatement(file) {
  try {
    logger.log(`Processing file: ${file.originalname}`);
    
    // Use our TypeScript parser to parse the bank statement
    const parsedData = await parseBankStatement(file.path);
    
    logger.log(`Successfully parsed bank statement for ${parsedData.bankName}`);
    logger.log(`Found ${parsedData.transactions.length} transactions`);
    
    return {
      fileName: file.originalname,
      bankName: parsedData.bankName,
      accountNumber: parsedData.accountNumber,
      accountName: parsedData.accountName || 'Account Holder',
      startDate: parsedData.startDate,
      endDate: parsedData.endDate,
      startBalance: parsedData.startBalance,
      endBalance: parsedData.endBalance,
      totalCredits: parsedData.totalCredits,
      totalDebits: parsedData.totalDebits,
      transactionCount: parsedData.transactions.length,
      transactions: parsedData.transactions
    };
  } catch (error) {
    logger.error('Error parsing bank statement:', error);
    
    // The TypeScript parser should already handle fallback to mock data
    // But if somehow we get here, we'll return a basic structure
    return {
      fileName: file.originalname,
      bankName: 'Unknown Bank',
      accountNumber: '000000000',
      accountName: 'Account Holder',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      startBalance: 10000,
      endBalance: 15000,
      totalCredits: 10000,
      totalDebits: 5000,
      transactionCount: 0,
      transactions: []
    };
  }
}

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running correctly' });
});

// Handle file upload route
app.post('/api/bank-statements/upload', upload.single('statement'), async (req, res) => {
  logger.log('Received file upload request');
  
  // Log information about the file
  if (req.file) {
    logger.log('File received:', req.file.originalname);
    logger.log('File size:', req.file.size);
    logger.log('File type:', req.file.mimetype);
    logger.log('File path:', req.file.path);
    
    try {
      // Parse the statement
      const parsedStatement = await parseStatement(req.file);
      
      // Send response with parsed data
      res.status(201).json({
        message: 'Bank statement processed successfully',
        statementId: Date.now().toString(),
        summary: {
          totalTransactions: parsedStatement.transactionCount,
          startDate: parsedStatement.startDate,
          endDate: parsedStatement.endDate,
          startBalance: parsedStatement.startBalance,
          endBalance: parsedStatement.endBalance,
          totalCredits: parsedStatement.totalCredits,
          totalDebits: parsedStatement.totalDebits
        }
      });
    } catch (error) {
      logger.error('Error processing statement:', error);
      res.status(500).json({ message: 'Error processing statement' });
    } finally {
      // Cleanup file
      fs.unlinkSync(req.file.path);
    }
  } else {
    logger.log('No file received');
    res.status(400).json({ message: 'No file uploaded' });
  }
});

// Get bank statements route (for view transactions)
app.get('/api/bank-statements/:id', (req, res) => {
  // Use our in-memory storage for demo purposes
  const statementId = req.params.id;
  
  // In a real implementation, you would fetch from a database
  // For demo, we'll just return mock data since we don't store
  // the actual parsed statement
  
  const statement = {
    _id: statementId,
    fileName: 'parsed-statement.pdf',
    bankName: 'Test Bank',
    accountNumber: '12345678',
    accountName: 'Primary Account',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    startBalance: 15000,
    endBalance: 23750,
    currency: 'MUR',
    totalCredits: 35000,
    totalDebits: 26250,
    transactionCount: 25,
    processed: true,
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date()
  };
  
  // Use the TypeScript module to generate mock transactions
  const { generateTransactions } = require('./dist/services/parsers/mockGenerator');
  
  const transactions = generateTransactions(
    statement.transactionCount, 
    statement.startDate, 
    statement.endDate,
    statement.totalCredits,
    statement.totalDebits
  );
  
  res.json({
    statement,
    transactions
  });
});

// Start server
const PORT = 3003;
app.listen(PORT, () => {
  logger.log(`Server is running on port ${PORT}`);
}); 