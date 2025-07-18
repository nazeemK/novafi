import axios, { AxiosError } from 'axios';

// Force using relative URL in production
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isDev ? 'http://localhost:3000/api' : '/api';

console.log('API URL being used:', API_URL);

// Create an axios instance with better timeout and error handling
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Increase timeout to 60 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to log requests
apiClient.interceptors.request.use(config => {
  console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
  return config;
});

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  response => {
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  error => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`API Error: ${axiosError.message}`);
      if (axiosError.response) {
        console.error(`Status: ${axiosError.response.status}, Data:`, axiosError.response.data);
      } else if (axiosError.request) {
        console.error('No response received from server. Server may be down.');
      }
    }
    return Promise.reject(error);
  }
);

export interface BankTransaction {
  _id?: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
  category?: string;
  reference?: string;
  destinatory?: string;
  statementId?: string;
  bank?: string;
}

export interface BankStatement {
  _id?: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  startDate?: string;
  endDate?: string;
  openingBalance?: number;
  closingBalance?: number;
}

export interface ProcessingResult {
  statementId: string;
  success: boolean;
  message: string;
  statement?: BankStatement;
  transactions?: BankTransaction[];
  summary?: {
    totalTransactions?: number;
    totalCredits?: number;
    totalDebits?: number;
    startBalance?: number;
    endBalance?: number;
    startDate?: string;
    endDate?: string;
    currency?: string;
  };
}

// In-memory storage for transactions (fallback if API fails)
let cachedTransactions: BankTransaction[] = [];

/**
 * Generate mock transactions for demo purposes when API fails
 */
function generateMockTransactions(count = 50): BankTransaction[] {
  const transactions: BankTransaction[] = [];
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - 90); // 90 days ago
  
  const descriptions = [
    'Grocery Store', 'Coffee Shop', 'Online Shopping', 'Salary Payment',
    'Restaurant', 'Utility Bill', 'Phone Bill', 'Subscription', 'Transfer',
    'ATM Withdrawal', 'Gas Station', 'Pharmacy', 'Hardware Store', 'Clothing Store'
  ];
  
  let balance = 5000; // Starting balance
  
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));
    const isCredit = Math.random() > 0.7; // 30% chance of being a credit
    const amount = Math.round(isCredit ? (Math.random() * 2000) + 500 : (Math.random() * 500) + 10);
    
    if (isCredit) {
      balance += amount;
    } else {
      balance -= amount;
    }
    
    transactions.push({
      _id: `mock-${Date.now()}-${i}`,
      date: date.toISOString(),
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      amount,
      type: isCredit ? 'credit' : 'debit',
      balance,
      category: isCredit ? 'Income' : 'Expense',
      reference: `REF-${Date.now()}-${i}`,
      destinatory: isCredit ? 'INCOMING TRANSFER' : 'PAYMENT TO VENDOR',
      statementId: `mock-statement-${Date.now()}`
    });
  }
  
  // Sort by date, newest first
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Upload and process a bank statement
 * @param file The bank statement file to upload
 */
export const uploadBankStatement = async (file: File): Promise<ProcessingResult> => {
  try {
    console.log('Uploading file to server:', file.name);
    
    const formData = new FormData();
    formData.append('statement', file);
    
    const response = await apiClient.post('/bank-statements/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Server response from uploadBankStatement:', response.data);
    
    // Ensure we have a properly structured response
    const result: ProcessingResult = {
      statementId: response.data.statementId || `fallback-${Date.now()}`,
      success: response.data.success !== false,
      message: response.data.message || 'Processing complete',
      statement: response.data.statement || null,
      transactions: response.data.transactions || []
    };
    
    // If we have a summary object, keep it
    if (response.data.summary) {
      result.summary = response.data.summary;
    }
    
    // Log the structure for debugging
    console.log('Server response structure:', {
      hasStatement: !!result.statement,
      statementHasCurrency: !!result.statement?.currency,
      hasSummary: !!result.summary,
      summaryHasCurrency: !!result.summary?.currency,
      transactionsCount: result.transactions?.length || 0
    });
    
    return result;
  } catch (error: unknown) {
    console.error('Error in uploadBankStatement:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
      } else if (axiosError.request) {
        // The request was made but no response was received
        console.error('No response received from server. Check if backend is running.');
      }
    }
    throw error;
  }
};

/**
 * Get a bank statement by ID
 * @param id Bank statement ID
 */
export const getBankStatement = async (id: string): Promise<{statement: BankStatement, transactions: BankTransaction[]}> => {
  try {
    const response = await apiClient.get(`/bank-statements/${id}`);
    console.log('getBankStatement API response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Error getting bank statement:', error);
    
    // Return mock data if API fails
    const mockStatement: BankStatement = {
      _id: id,
      accountNumber: '12345678',
      bankName: 'Demo Bank',
      currency: 'USD',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      openingBalance: 5000,
      closingBalance: 7500
    };
    
    return {
      statement: mockStatement,
      transactions: generateMockTransactions(30)
    };
  }
};

/**
 * Get all bank statements
 */
export const getAllBankStatements = async (): Promise<BankStatement[]> => {
  try {
    const response = await apiClient.get('/bank-statements');
    return response.data;
  } catch (error: unknown) {
    console.error('Error getting all bank statements:', error);
    
    // Return mock data if API fails
    return [{
      _id: 'mock-1',
      accountNumber: '12345678',
      bankName: 'Demo Bank',
      currency: 'USD',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      openingBalance: 5000,
      closingBalance: 7500
    }];
  }
};

// Add this new function to fetch transactions with retry
export async function getBankTransactions(retryCount = 2): Promise<BankTransaction[]> {
  try {
    console.log(`Attempting to fetch transactions (retries left: ${retryCount})`);
    const response = await apiClient.get('/bank-statements/transactions');
    
    // Cache the transactions for fallback
    cachedTransactions = response.data || [];
    console.log(`Successfully retrieved ${cachedTransactions.length} transactions`);
    
    return cachedTransactions;
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    
    // Retry logic
    if (retryCount > 0) {
      console.log(`Retrying... ${retryCount} attempts left`);
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getBankTransactions(retryCount - 1);
    }
    
    // If we have cached transactions, use them
    if (cachedTransactions.length > 0) {
      console.log('Using cached transactions:', cachedTransactions.length);
      return cachedTransactions;
    }
    
    // Otherwise return mock data
    console.log('Generating mock transactions');
    const mockTransactions = generateMockTransactions();
    cachedTransactions = mockTransactions; // Cache for later use
    return mockTransactions;
  }
}

/**
 * Export transactions to CSV with optional filters
 * @param filters Optional filter parameters
 */
export const exportTransactionsToCSV = async (filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
}): Promise<void> => {
  try {
    // Get the transactions first
    let transactions = await getBankTransactions();
    
    // Apply filters if provided
    if (filters) {
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        transactions = transactions.filter(t => new Date(t.date) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        transactions = transactions.filter(t => new Date(t.date) <= endDate);
      }
      
      if (filters.type && filters.type !== 'all') {
        transactions = transactions.filter(t => t.type === filters.type);
      }
    }
    
    // Create CSV content with BOM for Excel compatibility
    let csvContent = "\ufeff";
    csvContent += "Date,Description,Destinatory,Amount,Type,Balance,Reference\r\n";
    
    transactions.forEach(transaction => {
      // Format the date as YYYY-MM-DD
      const date = new Date(transaction.date).toISOString().split('T')[0];
      
      // Format description - escape quotes and commas
      const description = `"${transaction.description.replace(/"/g, '""')}"`;
      
      // Format destinatory - escape quotes and commas, use empty string if undefined
      const destinatory = transaction.destinatory 
        ? `"${transaction.destinatory.replace(/"/g, '""')}"` 
        : '""';
      
      // Format reference - escape quotes and commas, use empty string if undefined
      const reference = transaction.reference 
        ? `"${transaction.reference.replace(/"/g, '""')}"` 
        : '""';
      
      // Add row to CSV with Windows line endings
      csvContent += `${date},${description},${destinatory},${transaction.amount},${transaction.type},${transaction.balance},${reference}\r\n`;
    });
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    throw error;
  }
};

/**
 * Update a bank transaction
 * @param id Transaction ID
 * @param updatedTransaction Updated transaction data
 */
export const updateBankTransaction = async (id: string, updatedTransaction: Partial<BankTransaction>): Promise<BankTransaction> => {
  try {
    console.log(`Updating transaction with ID: ${id}`, updatedTransaction);
    
    // For demo/test purposes, we'll update the transaction locally
    // since the demo backend might not support updates
    const allTransactions = await getBankTransactions();
    const transaction = allTransactions.find(t => t._id === id);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Update the transaction with type safety
    if (updatedTransaction.date !== undefined) transaction.date = updatedTransaction.date;
    if (updatedTransaction.description !== undefined) transaction.description = updatedTransaction.description;
    if (updatedTransaction.amount !== undefined) transaction.amount = updatedTransaction.amount;
    if (updatedTransaction.type !== undefined) transaction.type = updatedTransaction.type;
    if (updatedTransaction.balance !== undefined) transaction.balance = updatedTransaction.balance;
    if (updatedTransaction.destinatory !== undefined) transaction.destinatory = updatedTransaction.destinatory;
    
    // In a real app, this would be an API call:
    // const response = await apiClient.put(`/bank-statements/transactions/${id}`, updatedTransaction);
    // return response.data;
    
    console.log('Transaction updated locally:', transaction);
    
    // Update the transaction in our cached array
    const index = cachedTransactions.findIndex(t => t._id === id);
    if (index !== -1) {
      cachedTransactions[index] = { ...transaction };
    }
    
    return transaction;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

/**
 * Export selected transactions to CSV
 * @param transactions The transactions to export
 */
export const exportSelectedTransactionsToCSV = async (transactions: BankTransaction[]): Promise<void> => {
  try {
    // Create CSV content with BOM for Excel compatibility
    let csvContent = "\ufeff";
    csvContent += "Date,Description,Destinatory,Amount,Type,Balance,Reference\r\n";
    
    transactions.forEach(transaction => {
      // Format the date as YYYY-MM-DD
      const date = new Date(transaction.date).toISOString().split('T')[0];
      
      // Format description - escape quotes and commas
      const description = `"${transaction.description.replace(/"/g, '""')}"`;
      
      // Format destinatory - escape quotes and commas, use empty string if undefined
      const destinatory = transaction.destinatory 
        ? `"${transaction.destinatory.replace(/"/g, '""')}"` 
        : '""';
      
      // Format reference - escape quotes and commas, use empty string if undefined
      const reference = transaction.reference 
        ? `"${transaction.reference.replace(/"/g, '""')}"` 
        : '""';
      
      // Add row to CSV with Windows line endings
      csvContent += `${date},${description},${destinatory},${transaction.amount},${transaction.type},${transaction.balance},${reference}\r\n`;
    });
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    throw error;
  }
}; 

/**
 * Delete a single bank transaction
 * @param id Transaction ID to delete
 */
export const deleteBankTransaction = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting transaction with ID: ${id}`);
    
    // For demo/test purposes, we'll delete the transaction locally
    // since the demo backend might not support deletes
    const index = cachedTransactions.findIndex(t => t._id === id);
    if (index !== -1) {
      cachedTransactions.splice(index, 1);
      console.log('Transaction deleted locally');
    } else {
      throw new Error('Transaction not found');
    }
    
    // In a real app, this would be an API call:
    // await apiClient.delete(`/bank-statements/transactions/${id}`);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

/**
 * Delete multiple bank transactions
 * @param ids Array of transaction IDs to delete
 */
export const deleteBankTransactions = async (ids: string[]): Promise<void> => {
  try {
    console.log(`Deleting ${ids.length} transactions`);
    
    // For demo/test purposes, we'll delete the transactions locally
    // since the demo backend might not support bulk deletes
    cachedTransactions = cachedTransactions.filter(t => !ids.includes(t._id!));
    console.log(`${ids.length} transactions deleted locally`);
    
    // In a real app, this would be an API call:
    // await apiClient.post(`/bank-statements/transactions/bulk-delete`, { ids });
  } catch (error) {
    console.error('Error deleting transactions:', error);
    throw error;
  }
}; 