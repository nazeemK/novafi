import { parseDate, parseAmount, getCategoryFromDescription } from './utils';
import { ParsedTransaction } from '../types';

/**
 * Extract transactions from MCB bank statement
 * @param text Bank statement text content
 */
export function extractMCBTransactions(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  // Split the text into lines for processing
  const lines = text.split('\n');
  console.info('=== RAW CONTENT START ===');
  console.info(text);
  console.info('=== RAW CONTENT END ===');
  console.info('MCB Parser: Processing', lines.length, 'lines');
  
  // MCB pattern: Date, Description, Amount, Balance
  // Look for lines with date patterns
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
  const amountPattern = /([\d,]+\.\d{2})/;
  const referencePattern = /((?:Inward Transfer|Instant Payment|JuicePro Transfer)\s+[A-Z0-9\\]+)/;
  
  let currentBalance = 0;
  
  // Log a preview of lines for diagnostic purposes
  console.info('MCB Parser: First 10 lines sample:');
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    console.info(`Line ${i}: ${lines[i]}`);
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line || line.length < 10) continue;
    
    // Check if line starts with a date
    const dateMatch = line.match(datePattern);
    if (dateMatch && dateMatch.index === 0) {
      const date = parseDate(dateMatch[1]);
      console.info('MCB Parser: Found transaction date:', dateMatch[1], '→', date);
      
      // Try to find amount in this line
      const amountMatches = line.match(new RegExp(amountPattern, 'g'));
      if (amountMatches && amountMatches.length >= 1) {
        // Last match is likely the balance, second-to-last is the amount
        const balanceStr = amountMatches[amountMatches.length - 1];
        const balance = parseAmount(balanceStr);
        
        let amount: number;
        let type: 'credit' | 'debit';
        if (amountMatches.length >= 2) {
          const amountStr = amountMatches[amountMatches.length - 2];
          amount = parseAmount(amountStr);
          
          // If current balance is higher than previous, it's a credit
          type = balance > currentBalance ? 'credit' : 'debit';
        } else {
          // If we only found one number, assume it's the balance and calculate amount
          amount = Math.abs(balance - currentBalance);
          type = balance > currentBalance ? 'credit' : 'debit';
        }
        
        // Get the main line by removing date and amounts
        let mainLine = line
          .replace(dateMatch[0], '')
          .replace(new RegExp(amountPattern, 'g'), '')
          .trim();
        
        // Extract reference and description
        let reference = '';
        let destinatory = '';
        
        // Try to find reference in the main line
        const referenceMatch = mainLine.match(referencePattern);
        if (referenceMatch) {
          reference = referenceMatch[1].trim();
          mainLine = mainLine.replace(reference, '').trim();
          console.info('MCB Parser: Found reference:', reference);
        }
        
        // Check next line for destinatory
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          console.info('MCB Parser: Checking line for destinatory:', nextLine);
          
          // Check if next line does NOT start with a date and doesn't contain amount pattern
          if (!nextLine.match(datePattern) && !nextLine.match(amountPattern) && nextLine.length > 0) {
            // Check if it's not a reference line
            if (!nextLine.match(referencePattern)) {
              destinatory = nextLine;
              console.info('MCB Parser: Found destinatory:', destinatory);
              i++; // Skip the next line since we've used it
            }
          }
        }
        
        // Clean up strings
        mainLine = mainLine.replace(/\s+/g, ' ').trim();
        reference = reference.replace(/\s+/g, ' ').trim();
        destinatory = destinatory.replace(/\s+/g, ' ').trim();
        
        // Only add transaction if we have a valid amount
        if (amount > 0) {
          const transaction = {
            date: date,
            description: mainLine || reference,
            amount,
            type,
            balance,
            reference,
            destinatory,
            category: getCategoryFromDescription(mainLine || reference)
          };
          
          console.info('MCB Parser: Adding transaction:', {
            date: transaction.date,
            reference: transaction.reference,
            destinatory: transaction.destinatory ? `"${transaction.destinatory}"` : 'NONE',
            amount: transaction.amount,
            type: transaction.type
          });
          
          transactions.push(transaction);
          currentBalance = balance;
        }
      }
    }
  }
  
  console.info(`MCB Parser: Extracted ${transactions.length} transactions`);
  return transactions;
} 