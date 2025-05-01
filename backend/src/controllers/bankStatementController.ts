import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { parseBankStatement } from '../services/bankStatementParser';
import BankStatement from '../models/BankStatement';
import BankTransaction from '../models/BankTransaction';
import mongoose from 'mongoose';

// Temporary mock user ID for testing
const MOCK_USER_ID = new mongoose.Types.ObjectId();

/**
 * Upload and process a bank statement
 */
export const uploadBankStatement = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Parse the bank statement
    const parsedStatement = await parseBankStatement(filePath);
    
    // Debug: log first 3 parsed transactions including destinatory
    console.log('First 3 parsed transactions:', parsedStatement.transactions.slice(0, 3));
    
    // Create a new bank statement record
    const bankStatement = new BankStatement({
      fileName,
      bankName: parsedStatement.bankName,
      accountNumber: parsedStatement.accountNumber,
      accountName: parsedStatement.accountName || '',
      startDate: parsedStatement.startDate,
      endDate: parsedStatement.endDate,
      startBalance: parsedStatement.startBalance,
      endBalance: parsedStatement.endBalance,
      currency: parsedStatement.currency,
      totalCredits: parsedStatement.totalCredits,
      totalDebits: parsedStatement.totalDebits,
      transactionCount: parsedStatement.transactions.length,
      processed: true,
      userId: req.user?.id || MOCK_USER_ID // For development - would use authenticated user ID
    });

    // Save the bank statement
    const savedStatement = await bankStatement.save();

    // Create transaction records
    parsedStatement.transactions.forEach((transaction, idx) => {
      console.log(
        `Transaction: ${transaction.date.toISOString().slice(0,10)} - ${transaction.description} - ${transaction.amount} - ${transaction.type}` +
        (transaction.destinatory ? ` - Destinatory: ${transaction.destinatory}` : '')
      );
    });
    const transactions = parsedStatement.transactions.map(transaction => ({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      balance: transaction.balance,
      reference: transaction.reference || '',
      destinatory: transaction.destinatory || '',
      statementId: savedStatement._id
    }));

    // Save all transactions
    await BankTransaction.insertMany(transactions);

    // Generate categories for transactions (simplified)
    await categorizeBankTransactions(savedStatement._id);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    return res.status(201).json({
      message: 'Bank statement processed successfully',
      statementId: savedStatement._id,
      summary: {
        totalTransactions: savedStatement.transactionCount,
        startDate: savedStatement.startDate,
        endDate: savedStatement.endDate,
        startBalance: savedStatement.startBalance,
        endBalance: savedStatement.endBalance,
        totalCredits: savedStatement.totalCredits,
        totalDebits: savedStatement.totalDebits
      }
    });
  } catch (error: unknown) {
    console.error('Error processing bank statement:', error);
    return res.status(500).json({ 
      message: 'Error processing bank statement', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Get bank statement details by ID
 */
export const getBankStatement = async (req: Request, res: Response) => {
  try {
    const statementId = req.params.id;
    
    const statement = await BankStatement.findById(statementId);
    
    if (!statement) {
      return res.status(404).json({ message: 'Bank statement not found' });
    }
    
    // Check if the user has access to this statement (in production)
    // if (statement.userId.toString() !== req.user.id) {
    //   return res.status(403).json({ message: 'Access denied' });
    // }
    
    // Get transactions for the statement
    const transactions = await BankTransaction.find({ statementId });
    
    return res.json({
      statement,
      transactions
    });
  } catch (error: unknown) {
    console.error('Error fetching bank statement:', error);
    return res.status(500).json({ 
      message: 'Error fetching bank statement details', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Get all bank statements for a user
 */
export const getAllBankStatements = async (req: Request, res: Response) => {
  try {
    // In production, you would use req.user.id
    const userId = req.user?.id || MOCK_USER_ID;
    
    const statements = await BankStatement.find({ userId })
      .sort({ createdAt: -1 });
    
    return res.json(statements);
  } catch (error: unknown) {
    console.error('Error fetching bank statements:', error);
    return res.status(500).json({ 
      message: 'Error fetching bank statements', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Get all transactions for a user from all bank statements
 */
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    // In production, you would use req.user.id
    const userId = req.user?.id || MOCK_USER_ID;
    
    // Get all statement IDs for this user
    const statements = await BankStatement.find({ userId }, '_id');
    const statementIds = statements.map(statement => statement._id);
    
    // Get all transactions for these statements
    const transactions = await BankTransaction.find({ 
      statementId: { $in: statementIds } 
    }).sort({ date: -1 });
    
    return res.json(transactions);
  } catch (error: unknown) {
    console.error('Error fetching all transactions:', error);
    return res.status(500).json({ 
      message: 'Error fetching transactions', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Apply automatic categorization to bank transactions
 * This is a simplified version for demo purposes
 */
async function categorizeBankTransactions(statementId: mongoose.Types.ObjectId) {
  try {
    const transactions = await BankTransaction.find({ statementId });
    
    // Simple categorization rules based on keywords
    const categories = {
      'SALARY': 'Income',
      'PAYMENT': 'Income',
      'TRANSFER': 'Transfer',
      'ATM': 'Cash Withdrawal',
      'WITHDRAWAL': 'Cash Withdrawal',
      'PURCHASE': 'Shopping',
      'SUPERMARKET': 'Groceries',
      'RESTAURANT': 'Dining',
      'CAFE': 'Dining',
      'UTILITY': 'Utilities',
      'ELECTRICITY': 'Utilities',
      'WATER': 'Utilities',
      'MOBILE': 'Telecommunications',
      'PHONE': 'Telecommunications',
      'INTERNET': 'Telecommunications',
      'INSURANCE': 'Insurance',
      'MORTGAGE': 'Housing',
      'RENT': 'Housing'
    };
    
    for (const transaction of transactions) {
      let category = 'Uncategorized';
      
      // Check for keyword matches
      const description = transaction.description.toUpperCase();
      for (const [keyword, categoryName] of Object.entries(categories)) {
        if (description.includes(keyword)) {
          category = categoryName;
          break;
        }
      }
      
      // Update transaction with category
      transaction.category = category;
      await transaction.save();
    }
    
    return true;
  } catch (error: unknown) {
    console.error('Error categorizing transactions:', error);
    return false;
  }
} 