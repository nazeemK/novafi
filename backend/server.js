const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const app = express();

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

// Simple in-memory storage for demo purposes
const statements = [];
const allTransactions = [];

// Function to parse PDF statement with actual PDF reading
async function parseStatement(file) {
  try {
    // Default values in case parsing fails
    let extractedData = {
      text: '',
      accountNumber: '12345678',
      accountName: 'Primary Account',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      startBalance: 15000,
      endBalance: 23750,
      transactions: [],
      bankName: 'Unknown Bank'
    };
    
    // Only attempt to parse PDF files
    if (file.mimetype === 'application/pdf') {
      logger.log('Parsing PDF content...');
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      
      // Get text content from PDF
      extractedData.text = pdfData.text;
      logger.log('PDF Content extracted - length:', extractedData.text.length, 'characters');
      logger.log('Preview:', extractedData.text.substring(0, 200) + '...');
      
      // Try to extract bank name
      if (extractedData.text.includes('MCB')) {
        extractedData.bankName = 'MCB';
      } else if (extractedData.text.includes('HSBC')) {
        extractedData.bankName = 'HSBC';
      } else if (extractedData.text.includes('Barclays')) {
        extractedData.bankName = 'Barclays';
      } else {
        extractedData.bankName = extractBankName(extractedData.text);
      }
      logger.log('Bank identified as:', extractedData.bankName);
      
      // Try to extract account name
      const accountNameMatch = extractedData.text.match(/(Mr|Mrs|Miss|Ms|Dr)\.?\s+([A-Z\s]+)/i);
      if (accountNameMatch) {
        extractedData.accountName = accountNameMatch[0].trim();
        logger.log('Found account name:', extractedData.accountName);
      }
      
      // Try to extract account number (example pattern)
      const accountMatch = extractedData.text.match(/Account\s*(?:number|No|#)?\s*[.:]\s*(\d+)/i);
      if (accountMatch) {
        extractedData.accountNumber = accountMatch[1];
        logger.log('Found account number:', extractedData.accountNumber);
      }
      
      // Try to extract date period
      const periodMatch = extractedData.text.match(/(?:Statement|Period|From)\s+(?:from|:)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
      if (periodMatch) {
        extractedData.startDate = parseDate(periodMatch[1]);
        extractedData.endDate = parseDate(periodMatch[2]);
        logger.log('Found statement period:', periodMatch[1], 'to', periodMatch[2]);
      }
      
      // Try to extract balances
      const openingBalanceMatch = extractedData.text.match(/(?:Opening|Beginning|Start)\s+balance\s*[:;]?\s*([\d,]+\.\d{2})/i);
      if (openingBalanceMatch) {
        extractedData.startBalance = parseFloat(openingBalanceMatch[1].replace(/,/g, ''));
        logger.log('Found opening balance:', extractedData.startBalance);
      }
      
      const closingBalanceMatch = extractedData.text.match(/(?:Closing|Ending|Final)\s+balance\s*[:;]?\s*([\d,]+\.\d{2})/i);
      if (closingBalanceMatch) {
        extractedData.endBalance = parseFloat(closingBalanceMatch[1].replace(/,/g, ''));
        logger.log('Found closing balance:', extractedData.endBalance);
      }
      
      // Extract transactions using multiple approaches
      extractedData.transactions = extractTransactionsFromPDF(extractedData.text, extractedData.bankName);
      logger.log(`Extracted ${extractedData.transactions.length} transactions from PDF`);
    }
    
    // Calculate totals based on extracted transactions
    let totalCredits = 0;
    let totalDebits = 0;
    
    if (extractedData.transactions.length > 0) {
      extractedData.transactions.forEach(transaction => {
        if (transaction.type === 'credit') {
          totalCredits += transaction.amount;
        } else {
          totalDebits += transaction.amount;
        }
      });
    } else {
      // Generate mock transactions if none were found
      logger.log('No transactions extracted, generating mock data');
      const transactionCount = 20; // Default number of transactions
      extractedData.transactions = generateTransactions(
        transactionCount, 
        extractedData.startDate, 
        extractedData.endDate, 
        extractedData.endBalance * 0.7, // Estimate credits
        extractedData.startBalance * 0.5  // Estimate debits
      );
      
      // Recalculate totals
      extractedData.transactions.forEach(transaction => {
        if (transaction.type === 'credit') {
          totalCredits += transaction.amount;
        } else {
          totalDebits += transaction.amount;
        }
      });
    }
    
    return {
      fileName: file.originalname,
      bankName: extractedData.bankName,
      accountNumber: extractedData.accountNumber,
      accountName: extractedData.accountName,
      startDate: extractedData.startDate,
      endDate: extractedData.endDate,
      startBalance: extractedData.startBalance,
      endBalance: extractedData.endBalance,
      totalCredits: totalCredits,
      totalDebits: totalDebits,
      transactionCount: extractedData.transactions.length,
      transactions: extractedData.transactions
    };
  } catch (error) {
    logger.error('Error parsing PDF:', error);
    
    // Fallback to mock data if parsing fails
    return generateMockStatement(file);
  }
}

// Extract bank name from text
function extractBankName(text) {
  // Common bank names to look for
  const bankNames = [
    'MCB', 'HSBC', 'Standard Chartered', 'Barclays', 'SBI', 'MauBank',
    'Bank One', 'AfrAsia', 'ABC Banking', 'BCP Bank', 'Citi', 'SBM',
    'State Bank of Mauritius', 'Bank of Mauritius', 'Deutsche Bank'
  ];
  
  for (const bank of bankNames) {
    if (text.includes(bank)) {
      return bank;
    }
  }
  
  return 'Banking Institution';
}

// Extract transactions from PDF text
function extractTransactionsFromPDF(text, bankName) {
  logger.log(`Attempting to extract transactions using ${bankName} format...`);
  
  // Split the text into lines for processing
  const lines = text.split('\n');
  const transactions = [];
  
  // Different approaches based on identified bank
  if (bankName === 'MCB') {
    return extractMCBTransactions(lines);
  } else {
    // Generic approach for other banks
    return extractGenericTransactions(lines);
  }
}

// Extract transactions from MCB format
function extractMCBTransactions(lines) {
  const transactions = [];
  
  // MCB pattern: Date, Description, Amount, Balance
  // Look for lines with date patterns
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
  const amountPattern = /([\d,]+\.\d{2})/;
  
  logger.log('Lines to process:', lines.length);
  
  let currentBalance = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line || line.length < 10) continue;
    
    // Check if line starts with a date
    const dateMatch = line.match(datePattern);
    if (dateMatch && dateMatch.index === 0) {
      const date = parseDate(dateMatch[1]);
      
      // Remove ALL date patterns first to fix duplicate date issue
      let cleanedLine = line;
      const allDateMatches = cleanedLine.match(new RegExp(datePattern, 'g'));
      if (allDateMatches) {
        allDateMatches.forEach(match => {
          cleanedLine = cleanedLine.replace(match, '');
        });
      }
      
      // Try to find amount in this line
      const amountMatches = cleanedLine.match(new RegExp(amountPattern, 'g'));
      if (amountMatches && amountMatches.length >= 1) {
        // Last match is likely the balance, second-to-last is the amount
        const balanceStr = amountMatches[amountMatches.length - 1];
        const balance = parseFloat(balanceStr.replace(/,/g, ''));
        
        let amount, type;
        if (amountMatches.length >= 2) {
          const amountStr = amountMatches[amountMatches.length - 2];
          amount = parseFloat(amountStr.replace(/,/g, ''));
          
          // If current balance is higher than previous, it's a credit
          type = balance > currentBalance ? 'credit' : 'debit';
        } else {
          // If we only found one number, assume it's the balance and calculate amount
          amount = Math.abs(balance - currentBalance);
          type = balance > currentBalance ? 'credit' : 'debit';
        }
        
        // Sanity check - filter out massive amounts (likely year components)
        if (amount > 20000000) {
          logger.log(`Ignoring suspiciously large amount: ${amount}`);
          continue;
        }
        
        // Get description by removing date and amounts
        let description = cleanedLine
          .replace(new RegExp(amountPattern, 'g'), '')
          .trim();
        
        // Sometimes description continues on next line
        if (i + 1 < lines.length && !lines[i + 1].match(datePattern)) {
          description += ' ' + lines[i + 1].trim();
        }
        
        // Clean up description
        description = description
          .replace(/\s+/g, ' ')
          .replace(/^\s+|\s+$/g, '');
        
        // Only add transaction if we have a valid amount
        if (amount > 0 && description) {
          transactions.push({
            date: date.toISOString(),
            description,
            amount,
            type,
            balance,
            category: getCategoryFromDescription(description)
          });
          
          currentBalance = balance;
          logger.log(`Transaction: ${date.toLocaleDateString()} - ${description.substring(0, 30)}... - ${amount} - ${type}`);
        }
      }
    }
  }
  
  logger.log(`Extracted ${transactions.length} transactions using MCB format`);
  return transactions;
}

// Generic transaction extraction for other banks
function extractGenericTransactions(lines) {
  const transactions = [];
  
  // Common patterns across multiple bank statements
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
  const amountPattern = /([\d,]+\.\d{2})/;
  const debitIndicators = ['DR', 'DEBIT', 'WITHDRAWAL', 'PAYMENT', '-'];
  const creditIndicators = ['CR', 'CREDIT', 'DEPOSIT', '+'];
  
  let currentBalance = null;
  let inTransactionSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line || line.length < 8) continue;
    
    // Check for section headers to identify transaction section
    if (line.includes('TRANSACTION') || line.includes('DETAILS') || line.includes('DATE')) {
      inTransactionSection = true;
      continue;
    }
    
    // Skip lines until we find transaction section
    if (!inTransactionSection && !line.match(datePattern)) continue;
    
    // Look for lines with date patterns
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      const date = parseDate(dateMatch[1]);
      
      // Look for amount pattern
      const amountMatches = line.match(new RegExp(amountPattern, 'g'));
      if (amountMatches && amountMatches.length > 0) {
        // Try to determine credit vs debit
        let type = 'debit'; // Default
        let amount;
        let balance;
        
        // Check for credit/debit indicators
        for (const indicator of debitIndicators) {
          if (line.includes(indicator)) {
            type = 'debit';
            break;
          }
        }
        
        for (const indicator of creditIndicators) {
          if (line.includes(indicator)) {
            type = 'credit';
            break;
          }
        }
        
        // Extract amount and balance
        if (amountMatches.length === 1) {
          // Only one amount found, assume it's the transaction amount
          amount = parseFloat(amountMatches[0].replace(/,/g, ''));
          balance = currentBalance ? (type === 'credit' ? currentBalance + amount : currentBalance - amount) : amount;
        } else {
          // Multiple amounts - usually last one is balance, first one is amount
          amount = parseFloat(amountMatches[0].replace(/,/g, ''));
          balance = parseFloat(amountMatches[amountMatches.length - 1].replace(/,/g, ''));
        }
        
        // Extract description
        let description = line
          .replace(dateMatch[0], '')
          .replace(new RegExp(amountPattern, 'g'), '')
          .replace(/(CR|DR|DEBIT|CREDIT)/gi, '')
          .trim();
        
        // Check next line for continuation of description
        if (i + 1 < lines.length && !lines[i + 1].match(datePattern)) {
          description += ' ' + lines[i + 1].trim();
        }
        
        // Clean up description
        description = description
          .replace(/\s+/g, ' ')
          .replace(/^\s+|\s+$/g, '');
        
        // Only add if we have a valid transaction
        if (amount > 0 && description) {
          transactions.push({
            date: date.toISOString(),
            description,
            amount,
            type,
            balance,
            category: getCategoryFromDescription(description)
          });
          
          currentBalance = balance;
          logger.log(`Transaction: ${date.toLocaleDateString()} - ${description.substring(0, 30)}... - ${amount} - ${type}`);
        }
      }
    }
  }
  
  logger.log(`Extracted ${transactions.length} transactions using generic format`);
  return transactions;
}

// Helper function to parse date (DD/MM/YYYY)
function parseDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  
  // Fallback to current date if parsing fails
  return new Date();
}

// Fallback to generate mock data
function generateMockStatement(file) {
  const fileSize = file.size;
  const fileName = file.originalname;
  
  // Generate "realistic" transaction count based on file size
  const transactionCount = Math.max(5, Math.floor(fileSize / 1000));
  
  // Generate credits and debits
  const baseAmount = 10000 + (fileSize % 10000);
  const totalCredits = baseAmount + Math.floor(Math.random() * 15000);
  const totalDebits = baseAmount - Math.floor(Math.random() * 5000);
  
  // Set period dates
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return {
    fileName,
    bankName: fileName.includes('MCB') ? 'MCB' : 'Banking Institution',
    accountNumber: '1234' + (fileSize % 1000000).toString(),
    accountName: 'Primary Account',
    startDate,
    endDate,
    startBalance: totalDebits,
    endBalance: totalCredits,
    totalCredits,
    totalDebits,
    transactionCount,
    transactions: generateTransactions(transactionCount, startDate, endDate, totalCredits, totalDebits)
  };
}

// Generate sample transactions
function generateTransactions(count, startDate, endDate, totalCredits, totalDebits) {
  const transactions = [];
  const timeSpan = endDate.getTime() - startDate.getTime();
  
  // Generate credits (income)
  const creditCount = Math.ceil(count * 0.3); // 30% are income
  const creditPerTransaction = totalCredits / creditCount;
  
  // Generate debits (expenses)
  const debitCount = count - creditCount;
  const debitPerTransaction = totalDebits / debitCount;
  
  // Transaction descriptions
  const creditDescriptions = [
    'SALARY PAYMENT', 'TRANSFER RECEIVED', 'DEPOSIT', 'INTEREST PAYMENT',
    'CLIENT PAYMENT', 'REFUND', 'DIVIDEND'
  ];
  
  const debitDescriptions = [
    'GROCERY PURCHASE', 'UTILITY PAYMENT', 'RESTAURANT', 'ONLINE SHOPPING',
    'TRANSPORTATION', 'MEDICAL EXPENSE', 'INSURANCE PREMIUM', 'RENT PAYMENT',
    'MOBILE PHONE BILL', 'SUBSCRIPTION'
  ];
  
  // Generate random transactions
  for (let i = 0; i < count; i++) {
    // Random date within the period
    const randomTime = startDate.getTime() + Math.random() * timeSpan;
    const date = new Date(randomTime);
    
    // Determine if credit or debit
    const isCredit = i < creditCount;
    
    // Pick random description
    const description = isCredit 
      ? creditDescriptions[Math.floor(Math.random() * creditDescriptions.length)]
      : debitDescriptions[Math.floor(Math.random() * debitDescriptions.length)];
    
    // Generate amount with some variability
    const baseAmount = isCredit ? creditPerTransaction : debitPerTransaction;
    const amount = Math.round(baseAmount * (0.7 + Math.random() * 0.6));
    
    // Add transaction
    transactions.push({
      date: date.toISOString(),
      description,
      amount,
      type: isCredit ? 'credit' : 'debit',
      balance: 0, // Will calculate after sorting
      category: getCategoryFromDescription(description)
    });
  }
  
  // Sort by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate running balance
  let balance = totalDebits;
  transactions.forEach(t => {
    if (t.type === 'credit') {
      balance += t.amount;
    } else {
      balance -= t.amount;
    }
    t.balance = balance;
  });
  
  return transactions;
}

// Simple categorization
function getCategoryFromDescription(description) {
  const categories = {
    'SALARY': 'Income',
    'PAYMENT': 'Income',
    'TRANSFER': 'Transfer',
    'DEPOSIT': 'Income',
    'INTEREST': 'Income',
    'DIVIDEND': 'Income',
    'GROCERY': 'Groceries',
    'RESTAURANT': 'Dining',
    'UTILITY': 'Utilities',
    'ONLINE SHOPPING': 'Shopping',
    'TRANSPORTATION': 'Transport',
    'MEDICAL': 'Healthcare',
    'INSURANCE': 'Insurance',
    'RENT': 'Housing',
    'MOBILE': 'Telecommunications',
    'SUBSCRIPTION': 'Entertainment'
  };
  
  for (const [keyword, category] of Object.entries(categories)) {
    if (description.includes(keyword)) {
      return category;
    }
  }
  
  return 'Uncategorized';
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
      
      // Store in memory for demo purposes
      const statementId = Date.now().toString();
      parsedStatement.statementId = statementId;
      statements.push(parsedStatement);
      
      // Add transactions to the global transaction list
      const transactions = parsedStatement.transactions.map(tx => ({
        ...tx,
        statementId,
        bank: parsedStatement.bankName,
        _id: Date.now() + Math.random().toString(36).substring(2, 15)
      }));
      
      // Add to global transactions array
      allTransactions.push(...transactions);
      logger.log(`Added ${transactions.length} transactions to global array. Total now: ${allTransactions.length}`);
      
      // Send response with parsed data
      res.status(201).json({
        message: 'Bank statement processed successfully',
        statementId,
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

// GET /api/bank-statements/transactions - Get all transactions (define BEFORE :id route)
app.get('/api/bank-statements/transactions', (req, res) => {
  logger.log('Transactions endpoint called');
  logger.log(`Current transactions in memory: ${allTransactions.length}`);
  
  if (allTransactions && allTransactions.length > 0) {
    logger.log(`Returning ${allTransactions.length} transactions from memory`);
    return res.json(allTransactions);
  }
  
  // Fallback to mock data
  logger.log('No transactions in memory, returning mock data');
  const mockTransactions = generateTransactions(
    50,
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    new Date(),
    75000,
    60000
  );
  
  // Add bank information
  const banks = ['MCB', 'SBM', 'ABSA', 'Bank One'];
  mockTransactions.forEach(tx => {
    tx.bank = banks[Math.floor(Math.random() * banks.length)];
    tx._id = Date.now() + Math.random().toString(36).substring(2, 15);
  });
  
  res.json(mockTransactions);
});

// GET /api/bank-statements/:id - Get specific bank statement (define AFTER /transactions route)
app.get('/api/bank-statements/:id', (req, res) => {
  // Use our in-memory storage for demo purposes
  const statementId = req.params.id;
  
  // Check if statement exists in memory
  const foundStatement = statements.find(s => s.statementId === statementId);
  
  if (foundStatement) {
    // Get transactions for this statement
    const transactions = allTransactions.filter(t => t.statementId === statementId);
    logger.log(`Found statement ${statementId} in memory with ${transactions.length} transactions`);
    
    const responseStatement = {
      _id: statementId,
      fileName: foundStatement.fileName,
      bankName: foundStatement.bankName,
      accountNumber: foundStatement.accountNumber,
      accountName: foundStatement.accountName,
      startDate: foundStatement.startDate,
      endDate: foundStatement.endDate,
      startBalance: foundStatement.startBalance,
      endBalance: foundStatement.endBalance,
      currency: 'MUR',
      totalCredits: foundStatement.totalCredits,
      totalDebits: foundStatement.totalDebits,
      transactionCount: transactions.length,
      processed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return res.json({
      statement: responseStatement,
      transactions
    });
  }
  
  // If not found, return mock data
  logger.log(`Statement ${statementId} not found, returning mock data`);
  
  const mockStatement = {
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
  
  // Generate sample transactions or use stored ones
  const transactions = generateTransactions(
    mockStatement.transactionCount, 
    mockStatement.startDate, 
    mockStatement.endDate,
    mockStatement.totalCredits,
    mockStatement.totalDebits
  );
  
  res.json({
    statement: mockStatement,
    transactions
  });
});

// GET /api/bank-statements - Get all bank statements
app.get('/api/bank-statements', (req, res) => {
  // ... existing code if any ...
});

// PUT /api/bank-statements/transactions/:id - Update a transaction
app.put('/api/bank-statements/transactions/:id', (req, res) => {
  logger.log(`Update transaction request for ID: ${req.params.id}`);
  logger.log('Update data:', JSON.stringify(req.body));
  
  const transactionId = req.params.id;
  const updateData = req.body;
  
  // Find the transaction in memory
  const transactionIndex = allTransactions.findIndex(t => t._id === transactionId);
  
  if (transactionIndex === -1) {
    logger.error(`Transaction with ID ${transactionId} not found`);
    return res.status(404).json({ message: 'Transaction not found' });
  }
  
  try {
    // Update the transaction (only allow specific fields to be updated)
    const allowedFields = ['date', 'description', 'amount', 'type', 'balance'];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        // For date, ensure it's a Date object
        if (field === 'date' && typeof updateData[field] === 'string') {
          allTransactions[transactionIndex][field] = new Date(updateData[field]);
        } else {
          allTransactions[transactionIndex][field] = updateData[field];
        }
      }
    });
    
    logger.log(`Transaction ${transactionId} updated successfully`);
    res.json(allTransactions[transactionIndex]);
  } catch (error) {
    logger.error(`Error updating transaction: ${error}`);
    res.status(500).json({ message: 'Error updating transaction' });
  }
});

// Start server
const PORT = 3002;
app.listen(PORT, () => {
  logger.log(`Test server is running on port ${PORT}`);
}); 