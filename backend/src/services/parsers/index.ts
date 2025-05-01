/**
 * Bank statement parsers
 * This file exports all the bank-specific parsers
 */

// Import all parsers
import { extractMCBTransactions } from './mcbParser';
import { extractGenericTransactions } from './genericParser';
import { 
  parseDate, 
  parseAmount, 
  extractBankName, 
  extractAccountNumber, 
  getCategoryFromDescription 
} from './utils';
import { 
  generateMockStatement, 
  generateTransactions 
} from './mockGenerator';

// Export all parser functionality
export {
  // Bank-specific parsers
  extractMCBTransactions,
  extractGenericTransactions,
  
  // Utility functions
  parseDate,
  parseAmount,
  extractBankName,
  extractAccountNumber,
  getCategoryFromDescription,
  
  // Mock data generation
  generateMockStatement,
  generateTransactions
}; 