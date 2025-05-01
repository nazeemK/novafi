/**
 * Type definitions for bank statement parsing services
 */

/**
 * Parsed bank statement data
 */
export interface ParsedStatement {
  bankName: string;
  accountNumber: string;
  accountName?: string;
  startDate: Date;
  endDate: Date;
  startBalance: number;
  endBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactions: ParsedTransaction[];
  currency: string;
}

/**
 * Parsed transaction from bank statement
 */
export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
  reference?: string;
  destinatory?: string;
  category?: string;
} 