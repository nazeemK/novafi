<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { uploadBankStatement, ProcessingResult } from '../services/bankStatementService';

const router = useRouter();
const file = ref<File | null>(null);
const uploadProgress = ref(0);
const isProcessing = ref(false);
const processingComplete = ref(false);
const uploadError = ref('');
const result = ref<ProcessingResult | null>(null);
const statementCurrency = ref('USD'); // Default currency

// Computed properties for summary data
const transactionCount = computed(() => {
  return result.value?.transactions?.length || 0;
});

const startDate = computed(() => {
  return result.value?.statement?.startDate || '';
});

const endDate = computed(() => {
  return result.value?.statement?.endDate || '';
});

const totalCredits = computed(() => {
  if (!result.value?.transactions) return 0;
  return result.value.transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
});

const totalDebits = computed(() => {
  if (!result.value?.transactions) return 0;
  return result.value.transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
});

const startBalance = computed(() => {
  return result.value?.statement?.openingBalance || 0;
});

const endBalance = computed(() => {
  return result.value?.statement?.closingBalance || 0;
});

// Form validation
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    file.value = input.files[0];
    uploadError.value = '';
  }
};

// Process bank statement
const uploadFile = async () => {
  if (!file.value) {
    uploadError.value = 'Please select a file to upload';
    return;
  }

  // Validate file type
  const validTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'text/plain'];
  if (!validTypes.includes(file.value.type)) {
    uploadError.value = 'Invalid file type. Please upload a PDF, CSV, or bank statement file.';
    return;
  }

  let progressInterval: number;
  
  try {
    // Start processing
    isProcessing.value = true;
    uploadProgress.value = 0;
    
    // Simulate upload progress
    progressInterval = window.setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 5;
      }
    }, 200);
    
    // Upload file to server
    const response = await uploadBankStatement(file.value);
    
    // Complete progress animation
    clearInterval(progressInterval);
    uploadProgress.value = 100;
    
    // Validate response structure
    if (!response) {
      throw new Error('Empty response received from server');
    }
    
    // Store result and show success screen
    result.value = response;
    
    // Validate required data is present
    if (!response.transactions || !Array.isArray(response.transactions)) {
      console.warn('No transactions array in response:', response);
    }
    
    if (!response.statement) {
      console.warn('No statement object in response:', response);
    }
    
    // Extract and store the currency with a fallback
    if (response.statement?.currency) {
      statementCurrency.value = response.statement.currency;
      console.log('Setting currency from statement:', statementCurrency.value);
    } else {
      console.warn('No currency found in response, using default:', statementCurrency.value);
    }
    
    // Comprehensive debugging to see the data structure
    console.log('COMPLETE RESPONSE:', response);
    console.log('Statement object:', response.statement);
    console.log('Transactions array length:', response.transactions?.length || 0);
    console.log('Currency in statement:', response.statement?.currency);
    console.log('Selected currency:', statementCurrency.value);
    
    // Wait a moment to show 100% progress
    setTimeout(() => {
      isProcessing.value = false;
      processingComplete.value = true;
    }, 500);
    
  } catch (error) {
    console.error('Error uploading file:', error);
    if (progressInterval) clearInterval(progressInterval);
    isProcessing.value = false;
    
    if (error.response?.data?.message) {
      uploadError.value = error.response.data.message;
    } else if (error.message) {
      uploadError.value = `Error: ${error.message}`;
    } else {
      uploadError.value = 'Failed to process bank statement. Please try again.';
    }
  }
};

const resetForm = () => {
  file.value = null;
  uploadProgress.value = 0;
  isProcessing.value = false;
  processingComplete.value = false;
  uploadError.value = '';
  result.value = null;
};

const viewTransactions = () => {
  if (result.value) {
    router.push(`/transactions/${result.value.statementId}`);
  }
};

// Format currency based on the statement's currency
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  
  // Add more defensive programming with a fallback
  const safeCurrency = statementCurrency.value || 'USD';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency
    }).format(amount);
  } catch (error) {
    console.error(`Error formatting currency with ${safeCurrency}:`, error);
    // Fallback to basic formatting if there's an error with the currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};
</script>

<template>
  <div class="bank-statement-container">
    <div class="bank-statement-content">
      <h1 class="page-title">Bank Statement Processing</h1>
      
      <div class="upload-container" v-if="!processingComplete">
        <div class="upload-section">
          <div v-if="!isProcessing" class="upload-form">
            <h2 class="section-title">Upload Bank Statement</h2>
            <p class="upload-description">
              Upload your bank statement to automatically extract and categorize transactions. 
              We support PDF, CSV, and most major bank formats.
            </p>
            
            <div class="file-input-container">
              <label for="bank-statement" class="file-label">
                <div class="file-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span v-if="!file">Choose a bank statement file</span>
                <span v-else>{{ file.name }}</span>
                <input 
                  id="bank-statement" 
                  type="file" 
                  accept=".pdf,.csv,.xls,.xlsx,.txt" 
                  class="hidden-file-input" 
                  @change="handleFileChange"
                />
              </label>
            </div>
            
            <div v-if="uploadError" class="error-message">{{ uploadError }}</div>
            
            <div class="action-buttons">
              <button class="upload-button" @click="uploadFile" :disabled="!file">
                Process Statement
              </button>
              <button class="reset-button" @click="resetForm" v-if="file">
                Reset
              </button>
            </div>
          </div>
          
          <div v-else class="processing-status">
            <h2 class="status-title">Processing Your Statement</h2>
            <div class="progress-container">
              <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p class="status-text">{{ uploadProgress < 100 ? 'Uploading...' : 'Analyzing transactions...' }}</p>
          </div>
        </div>
      </div>
      
      <div v-else class="results-container">
        <h2 class="results-title">Statement Processing Complete</h2>
        
        <div class="results-summary" v-if="result">
          <div class="result-card">
            <h3 class="card-title">Transactions</h3>
            <div class="card-value">{{ transactionCount }}</div>
            <div class="card-details">
              <div class="detail-item">
                <span>Period:</span>
                <span class="value">{{ startDate ? new Date(startDate).toLocaleDateString() : 'N/A' }} to {{ endDate ? new Date(endDate).toLocaleDateString() : 'N/A' }}</span>
              </div>
            </div>
          </div>
          
          <div class="result-card">
            <h3 class="card-title">Financial Summary</h3>
            <div class="card-details financial">
              <div class="detail-item">
                <span>Income:</span>
                <span class="value income">{{ formatCurrency(totalCredits) }}</span>
              </div>
              <div class="detail-item">
                <span>Expenses:</span>
                <span class="value expense">{{ formatCurrency(totalDebits) }}</span>
              </div>
              <div class="detail-item total">
                <span>Net:</span>
                <span class="value" :class="totalCredits - totalDebits > 0 ? 'income' : 'expense'">
                  {{ formatCurrency(totalCredits - totalDebits) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="result-card">
            <h3 class="card-title">Balance Change</h3>
            <div class="card-details period">
              <div class="detail-item">
                <span>Opening:</span>
                <span class="value">{{ formatCurrency(startBalance) }}</span>
              </div>
              <div class="detail-item">
                <span>Closing:</span>
                <span class="value">{{ formatCurrency(endBalance) }}</span>
              </div>
              <div class="detail-item total">
                <span>Change:</span>
                <span class="value" :class="endBalance - startBalance > 0 ? 'income' : 'expense'">
                  {{ formatCurrency(endBalance - startBalance) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <button class="view-button" @click="viewTransactions">View Transactions</button>
          <button class="upload-button" @click="resetForm">Process Another Statement</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bank-statement-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f8f3eb;
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.bank-statement-content {
  width: 100%;
  max-width: 1000px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
  text-align: left;
}

.upload-container, .results-container {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.section-title, .status-title, .results-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.upload-description {
  color: #4b5563;
  margin-bottom: 2rem;
  max-width: 600px;
}

.file-input-container {
  margin-bottom: 2rem;
}

.file-label {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.file-label:hover {
  border-color: #0e7e74;
  background-color: rgba(14, 126, 116, 0.05);
}

.file-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(14, 126, 116, 0.1);
  color: #0e7e74;
  border-radius: 0.5rem;
  margin-right: 1rem;
}

.file-icon .icon {
  width: 1.5rem;
  height: 1.5rem;
}

.hidden-file-input {
  display: none;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.upload-button, .reset-button, .view-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-button {
  background-color: #0e7e74;
  color: white;
}

.upload-button:hover {
  background-color: #0a5a54;
}

.upload-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.reset-button, .view-button {
  background-color: transparent;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.reset-button:hover, .view-button:hover {
  background-color: #f3f4f6;
}

.processing-status {
  text-align: center;
  padding: 2rem 0;
}

.progress-container {
  width: 100%;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  margin: 1.5rem 0;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #0e7e74;
  transition: width 0.3s;
}

.status-text {
  color: #4b5563;
  font-size: 1rem;
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.result-card {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.card-details {
  color: #4b5563;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.value {
  font-weight: 600;
}

.income {
  color: #059669;
}

.expense {
  color: #dc2626;
}

.financial .detail-item.total, 
.period .detail-item.total {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.date-range {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #1f2937;
}

.separator {
  color: #9ca3af;
  font-weight: normal;
}
</style> 