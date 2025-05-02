/**
 * Parse date string in format DD/MM/YYYY
 * @param {string} dateStr Date string in DD/MM/YYYY format
 * @returns {Date} JavaScript date object
 */
function parseDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    console.error(`Failed to parse date: ${dateStr}`);
    return new Date();
  }
  
  // Format is DD/MM/YYYY
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}

/**
 * Parse amount string to number
 * @param {string} amountStr Amount string (e.g. "1,234.56")
 * @returns {number} Amount as number
 */
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  
  // Remove commas and convert to number
  return parseFloat(amountStr.replace(/,/g, ''));
}

/**
 * Get category from transaction description
 * @param {string} description Transaction description
 * @returns {string} Category
 */
function getCategoryFromDescription(description) {
  // Default category
  let category = 'Other';
  
  if (!description) return category;
  
  // Convert to lowercase for case-insensitive matching
  const lowercaseDesc = description.toLowerCase();
  
  // Define category patterns
  const categories = {
    'Food & Dining': [
      'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'dining', 'takeaway', 
      'mcdonalds', 'kfc', 'subway', 'bakery', 'supermarket', 'grocery'
    ],
    'Shopping': [
      'shopping', 'retail', 'store', 'shop', 'mall', 'market', 'purchase',
      'amazon', 'ebay', 'clothing', 'shoes', 'apparel'
    ],
    'Housing': [
      'rent', 'lease', 'mortgage', 'housing', 'accommodation', 'apartment', 'condo',
      'property', 'real estate', 'landlord'
    ],
    'Transportation': [
      'uber', 'lyft', 'taxi', 'cab', 'transport', 'bus', 'train', 'subway', 'metro',
      'railway', 'flight', 'airline', 'car', 'gas', 'fuel', 'petrol', 'parking'
    ],
    'Utilities': [
      'utility', 'bill', 'electricity', 'water', 'gas', 'internet', 'wifi', 'phone',
      'mobile', 'cellular', 'service', 'subscription'
    ],
    'Entertainment': [
      'movie', 'theatre', 'cinema', 'concert', 'show', 'event', 'ticket', 'netflix',
      'spotify', 'entertainment', 'streaming', 'game', 'play', 'music'
    ],
    'Healthcare': [
      'doctor', 'hospital', 'clinic', 'medical', 'health', 'pharmacy', 'drug', 'medicine',
      'dental', 'dentist', 'healthcare', 'insurance'
    ],
    'Education': [
      'school', 'college', 'university', 'tuition', 'course', 'education', 'learning',
      'book', 'study', 'student', 'training'
    ],
    'Personal Care': [
      'salon', 'spa', 'hair', 'beauty', 'cosmetic', 'personal care', 'grooming',
      'barber', 'stylist'
    ],
    'Travel': [
      'travel', 'hotel', 'motel', 'lodge', 'accommodation', 'vacation', 'holiday',
      'trip', 'tour', 'booking', 'flight', 'airline', 'airfare'
    ],
    'Income': [
      'salary', 'wage', 'payroll', 'income', 'deposit', 'revenue', 'earning', 'payment',
      'transfer in', 'credit'
    ],
    'Investments': [
      'investment', 'stock', 'bond', 'mutual fund', 'etf', 'share', 'dividend',
      'portfolio', 'trading', 'broker', 'financial'
    ]
  };
  
  // Check if description matches any category patterns
  for (const [categoryName, patterns] of Object.entries(categories)) {
    for (const pattern of patterns) {
      if (lowercaseDesc.includes(pattern)) {
        return categoryName;
      }
    }
  }
  
  // If "salary" or similar terms appear, it's Income
  if (lowercaseDesc.includes('salary') || 
      lowercaseDesc.includes('payroll') || 
      lowercaseDesc.includes('wages')) {
    return 'Income';
  }
  
  // If credit or deposit appears, it's likely Income
  if ((lowercaseDesc.includes('credit') || lowercaseDesc.includes('deposit')) && 
      !lowercaseDesc.includes('card')) {
    return 'Income';
  }
  
  return category;
}

module.exports = {
  parseDate,
  parseAmount,
  getCategoryFromDescription
}; 