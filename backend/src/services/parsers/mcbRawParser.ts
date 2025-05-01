import { parseDate, parseAmount, getCategoryFromDescription } from './utils';
import { ParsedTransaction } from '../types';

/**
 * Extracts transactions from MCB raw data format
 * @param text Raw bank statement text content
 * @returns Array of parsed transactions
 */
export function extractMCBRawTransactions(text: string): ParsedTransaction[] {
  console.log("MCB Raw Parser started processing...");
  console.log("Text length:", text.length);
  console.log("First 200 chars:", text.substring(0, 200));
  
  const transactions: ParsedTransaction[] = [];
  
  // Split the text into lines for processing
  const lines = text.split('\n');
  console.log("Total lines to process:", lines.length);
  
  // MCB raw data patterns
  const datePattern = /(\d{2}\/\d{2}\/\d{4})/;
  const amountPattern = /([\d,]+\.\d{2})/g;
  const balancePattern = /balance(?:\s*:)?\s*([\d,]+\.\d{2})/i;
  
  let currentBalance = 0;
  let inTransactionSection = false;
  
  // Log some sample lines to help debug
  console.log("Sample lines:");
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    console.log(`Line ${i}: ${lines[i].trim()}`);
  }
  
  // Look for transaction data in raw format
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line || line.length < 5) continue;
    
    // Check if this is a header line indicating the start of transaction data
    if (line.match(/transactions|statement|details/i) && !inTransactionSection) {
      inTransactionSection = true;
      console.log(`Transaction section found at line ${i}: ${line}`);
      continue;
    }
    
    // Check for opening balance
    const balanceMatch = line.match(balancePattern);
    if (balanceMatch && balanceMatch[1]) {
      currentBalance = parseAmount(balanceMatch[1]);
      console.log(`Balance found: ${currentBalance}`);
      continue;
    }
    
    // Check for transaction lines (typically contain a date and amount)
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      console.log(`Potential transaction found at line ${i}: ${line}`);
      
      // Extract date
      const transactionDate = parseDate(dateMatch[0]);
      if (!transactionDate) {
        console.log(`Invalid date at line ${i}: ${dateMatch[0]}`);
        continue;
      }
      
      // Extract amounts - usually there are multiple amounts in a line
      const amountMatches = line.match(amountPattern);
      if (!amountMatches || amountMatches.length === 0) {
        console.log(`No amounts found in line ${i}`);
        continue;
      }
      
      // The last amount is usually the balance after transaction
      const newBalance = parseAmount(amountMatches[amountMatches.length - 1]);
      
      // First amount is typically the transaction amount
      let amount = parseAmount(amountMatches[0]);
      
      // Determine transaction type based on balance change
      let type: 'credit' | 'debit';
      
      // If balance increased, it's a credit; if decreased, it's a debit
      if (newBalance > currentBalance) {
        type = 'credit';
        // For credits, ensure amount is positive
        amount = Math.abs(amount);
      } else {
        type = 'debit';
        // For debits, ensure amount is positive (will be treated as negative in UI)
        amount = Math.abs(amount);
      }
      
      // Extract description by removing date and amounts
      let description = line
        .replace(dateMatch[0], '')  // Remove date
        .replace(new RegExp(amountPattern, 'g'), '') // Remove all amounts
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();
        
      // Create transaction object
      const transaction: ParsedTransaction = {
        date: transactionDate,
        description: description,
        amount: amount,
        type: type,
        balance: newBalance,
        category: getCategoryFromDescription(description)
      };
      
      console.log(`Extracted transaction: ${JSON.stringify(transaction)}`);
      transactions.push(transaction);
      
      // Update current balance for next iteration
      currentBalance = newBalance;
    }
  }
  
  // Clean up and finalize
  console.log(`MCB Raw Parser finished. Found ${transactions.length} transactions.`);
  
  return transactions;
} 