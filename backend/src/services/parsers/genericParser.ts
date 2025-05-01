import { parseDate, parseAmount, getCategoryFromDescription } from './utils';
import { ParsedTransaction } from '../types';

/**
 * Extract transactions using a generic approach for various bank formats
 * @param text Bank statement text content
 */
export function extractGenericTransactions(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  // Common patterns across multiple bank statements
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
  const amountPattern = /([\d,]+\.\d{2})/;
  const debitIndicators = ['DR', 'DEBIT', 'WITHDRAWAL', 'PAYMENT', '-'];
  const creditIndicators = ['CR', 'CREDIT', 'DEPOSIT', '+'];
  
  // Split the text into lines
  const lines = text.split('\n');
  
  let currentBalance: number | null = null;
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
        let type: 'credit' | 'debit' = 'debit'; // Default
        let amount: number;
        let balance: number;
        
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
          amount = parseAmount(amountMatches[0]);
          balance = currentBalance ? (type === 'credit' ? currentBalance + amount : currentBalance - amount) : amount;
        } else {
          // Multiple amounts - usually last one is balance, first one is amount
          amount = parseAmount(amountMatches[0]);
          balance = parseAmount(amountMatches[amountMatches.length - 1]);
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
            date: date,
            description,
            amount,
            type,
            balance,
            category: getCategoryFromDescription(description)
          });
          
          currentBalance = balance;
        }
      }
    }
  }
  
  return transactions;
} 