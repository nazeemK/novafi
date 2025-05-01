import { ParsedStatement, ParsedTransaction } from '../types';
import { getCategoryFromDescription } from './utils';

/**
 * Generate a mock bank statement for demonstration or testing
 * @param baseAmount Base amount to use for calculations
 * @param transactionCount Number of transactions to generate
 * @returns A mock parsed statement
 */
export function generateMockStatement(baseAmount = 10000, transactionCount = 20): ParsedStatement {
  // Set period dates
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  // Generate credits and debits
  const totalCredits = baseAmount + Math.floor(Math.random() * 15000);
  const totalDebits = baseAmount - Math.floor(Math.random() * 5000);
  
  // Generate transactions
  const transactions = generateTransactions(
    transactionCount, 
    startDate, 
    endDate, 
    totalCredits, 
    totalDebits
  );
  
  return {
    bankName: 'Demo Bank',
    accountNumber: String(Math.floor(Math.random() * 10000000000)),
    accountName: 'Demo Account',
    startDate,
    endDate,
    startBalance: totalDebits,
    endBalance: totalDebits + totalCredits - totalDebits,
    totalCredits,
    totalDebits,
    transactions,
    currency: 'MUR'
  };
}

/**
 * Generate sample transactions
 * @param count Number of transactions to generate
 * @param startDate Start date for transactions
 * @param endDate End date for transactions
 * @param totalCredits Total credit amount to distribute
 * @param totalDebits Total debit amount to distribute
 * @returns List of generated transactions
 */
export function generateTransactions(
  count: number, 
  startDate: Date, 
  endDate: Date, 
  totalCredits: number, 
  totalDebits: number
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
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
      date: date,
      description,
      amount,
      type: isCredit ? 'credit' : 'debit',
      balance: 0, // Will calculate after sorting
      category: getCategoryFromDescription(description)
    });
  }
  
  // Sort by date
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
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