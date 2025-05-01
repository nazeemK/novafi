/**
 * Common utilities for parsing bank statements
 */

/**
 * Parse date string to Date object
 * @param dateStr Date string in DD/MM/YYYY format
 */
export function parseDate(dateStr: string): Date {
  // Handle common date formats (DD/MM/YYYY)
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

/**
 * Parse amount string to number
 * @param amountStr Amount string with possible commas
 */
export function parseAmount(amountStr: string): number {
  // Remove commas and convert to number
  return parseFloat(amountStr.replace(/,/g, ''));
}

/**
 * Extract bank name from text
 * @param text Bank statement text content
 */
export function extractBankName(text: string): string {
  // Common bank names and their variations
  const bankPatterns = {
    'MCB': ['MCB', 'Mauritius Commercial Bank', 'MCB Ltd', 'MCB Limited'],
    'HSBC': ['HSBC', 'Hong Kong Shanghai Banking'],
    'Standard Chartered': ['Standard Chartered', 'SCB'],
    'Barclays': ['Barclays', 'ABSA'],
    'SBI': ['SBI', 'State Bank of India'],
    'MauBank': ['MauBank', 'Mau Bank'],
    'Bank One': ['Bank One'],
    'AfrAsia': ['AfrAsia', 'Afr Asia', 'AfrAsia Bank'],
    'ABC Banking': ['ABC Banking', 'ABC Bank'],
    'BCP Bank': ['BCP Bank', 'BCP'],
    'Citi': ['Citi', 'Citibank'],
    'SBM': ['SBM', 'State Bank of Mauritius', 'SBM Bank'],
    'Bank of Mauritius': ['Bank of Mauritius', 'BOM'],
    'Deutsche Bank': ['Deutsche Bank', 'DB']
  };
  
  // Convert text to uppercase for case-insensitive matching
  const upperText = text.toUpperCase();
  
  console.log('===== BANK NAME DETECTION =====');
  console.log('Raw text sample (first 200 chars):', text.substring(0, 200));
  console.log('Text in uppercase (first 200 chars):', upperText.substring(0, 200));
  
  for (const [bankName, variations] of Object.entries(bankPatterns)) {
    for (const variation of variations) {
      const upperVariation = variation.toUpperCase();
      if (upperText.includes(upperVariation)) {
        console.log(`Found bank name match: "${variation}" -> "${bankName}"`);
        return bankName;
      }
    }
  }
  
  console.log('No bank name match found, using default');
  return 'Banking Institution';
}

/**
 * Extract account number from text
 * @param text Bank statement text content
 */
export function extractAccountNumber(text: string): string {
  const accountMatch = text.match(/Account\s*(?:number|No|#)?\s*[.:]\s*(\d+)/i);
  return accountMatch ? accountMatch[1] : '000000000'; // Default if not found
}

/**
 * Determine category from transaction description
 * @param description Transaction description text
 */
export function getCategoryFromDescription(description: string): string {
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
    'SUBSCRIPTION': 'Entertainment',
    'ATM': 'Cash Withdrawal',
    'WITHDRAWAL': 'Cash Withdrawal'
  };
  
  const upperDesc = description.toUpperCase();
  for (const [keyword, category] of Object.entries(categories)) {
    if (upperDesc.includes(keyword)) {
      return category;
    }
  }
  
  return 'Uncategorized';
} 