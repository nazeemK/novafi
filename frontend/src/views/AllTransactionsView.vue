<template>
  <div class="transactions-container">
    <div class="header-section">
      <h1>All Transactions</h1>
      <p class="subtitle">View and filter transactions from all your bank statements</p>
    </div>
    
    <div class="actions-bar">
      <button 
        class="mode-btn" 
        @click="toggleEditMode" 
        :class="{ 'active': editMode }"
      >
        {{ editMode ? 'Exit Edit Mode' : 'Edit Mode' }}
      </button>
      <div v-if="selectedIds.length > 0" class="selected-actions">
        <span class="selected-count">{{ selectedIds.length }} transaction(s) selected</span>
        <button 
          class="delete-btn" 
          @click="confirmDeleteSelected"
          :disabled="loading"
        >
          Delete Selected
        </button>
      </div>
    </div>
    
    <!-- Connection status indicator -->
    <div v-if="connectionStatus !== 'connected'" class="connection-warning">
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">
        <span v-if="connectionStatus === 'disconnected'">
          Server connection issue: Working in offline mode. Changes will be stored locally.
        </span>
        <span v-else-if="connectionStatus === 'limited'">
          Limited connection to server: Some features may not work properly.
        </span>
      </div>
    </div>
    
    <!-- Success notification -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    
    <div class="filters-section">
      <div class="filter-group">
        <label for="search">Search:</label>
        <input 
          type="text" 
          id="search" 
          v-model="filters.search" 
          placeholder="Search in descriptions..." 
          @input="applyFilters"
        >
      </div>
      
      <div class="filter-group">
        <label for="dateRange">Date Range:</label>
        <div class="date-range">
          <input 
            type="date" 
            id="startDate" 
            v-model="filters.startDate" 
            @change="applyFilters"
          >
          <span>to</span>
          <input 
            type="date" 
            id="endDate" 
            v-model="filters.endDate" 
            @change="applyFilters"
          >
        </div>
      </div>
      
      <div class="filter-group">
        <label for="type">Transaction Type:</label>
        <select id="type" v-model="filters.type" @change="applyFilters">
          <option value="all">All Types</option>
          <option value="credit">Credits Only</option>
          <option value="debit">Debits Only</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="amount">Amount Range:</label>
        <div class="amount-range">
          <input 
            type="number" 
            id="minAmount" 
            v-model="filters.minAmount" 
            placeholder="Min" 
            @input="applyFilters"
          >
          <span>to</span>
          <input 
            type="number" 
            id="maxAmount" 
            v-model="filters.maxAmount" 
            placeholder="Max" 
            @input="applyFilters"
          >
        </div>
      </div>
      
      <button class="reset-btn" @click="resetFilters">Reset Filters</button>
      <button 
        class="export-btn" 
        @click="exportToCSV" 
        :disabled="loading || error"
      >
        Download All CSV
      </button>
      <button 
        v-if="selectedIds.length > 0" 
        class="export-selected-btn" 
        @click="exportSelectedToCSV"
      >
        Export Selected
      </button>
    </div>
    
    <div class="summary-section">
      <div class="summary-card">
        <div class="card-title">Total Credits</div>
        <div class="card-value credit">{{ formatCurrency(filteredSummary.totalCredits) }}</div>
      </div>
      
      <div class="summary-card">
        <div class="card-title">Total Debits</div>
        <div class="card-value debit">{{ formatCurrency(filteredSummary.totalDebits) }}</div>
      </div>
      
      <div class="summary-card">
        <div class="card-title">Net Flow</div>
        <div class="card-value" :class="filteredSummary.netFlow >= 0 ? 'credit' : 'debit'">
          {{ formatCurrency(filteredSummary.netFlow) }}
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-title">Transactions</div>
        <div class="card-value">{{ filteredTransactions.length }}</div>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading transactions...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchTransactions" class="retry-btn">Retry</button>
    </div>
    
    <div class="transactions-table-container" v-else-if="filteredTransactions.length > 0">
      <div v-if="editMode" class="edit-mode-notice">
        <p>Edit mode active. Click on any cell to edit, then press Enter to save or Escape to cancel.</p>
      </div>
      
      <table class="transactions-table">
        <thead>
          <tr>
            <th class="select-column">
              <input 
                type="checkbox" 
                :checked="allSelected" 
                @change="toggleSelectAll" 
                :disabled="loading"
              >
            </th>
            <th @click="sortBy('date')" class="sortable">
              Date
              <span class="sort-icon" v-if="sortKey === 'date'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('description')" class="sortable">
              Description
              <span class="sort-icon" v-if="sortKey === 'description'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('destinatory')" class="sortable">
              Destinatory
              <span class="sort-icon" v-if="sortKey === 'destinatory'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('amount')" class="sortable">
              Amount
              <span class="sort-icon" v-if="sortKey === 'amount'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Type</th>
            <th @click="sortBy('balance')" class="sortable">
              Balance
              <span class="sort-icon" v-if="sortKey === 'balance'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th v-if="editMode">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="transaction in filteredTransactions" 
            :key="transaction._id"
            :class="{ 'editing': editingId === transaction._id, 'selected': isSelected(transaction._id) }"
          >
            <td class="select-column">
              <input 
                type="checkbox" 
                :checked="isSelected(transaction._id)" 
                @change="toggleSelect(transaction._id)"
                :disabled="loading"
              >
            </td>
            <td>
              <div v-if="editMode && editingId === transaction._id">
                <input 
                  type="date" 
                  v-model="editedTransaction.date" 
                  @keyup.enter="saveEdit" 
                  @keyup.esc="cancelEdit"
                  class="edit-input"
                >
              </div>
              <div v-else @click="editMode && startEdit(transaction)">
                {{ formatDate(transaction.date) }}
              </div>
            </td>
            <td class="description">
              <div v-if="editMode && editingId === transaction._id">
                <input 
                  type="text" 
                  v-model="editedTransaction.description" 
                  @keyup.enter="saveEdit" 
                  @keyup.esc="cancelEdit"
                >
              </div>
              <div v-else @click="editMode && startEdit(transaction)">
                {{ transaction.description }}
              </div>
            </td>
            <td class="destinatory">
              <div v-if="editMode && editingId === transaction._id">
                <input 
                  type="text" 
                  v-model="editedTransaction.destinatory" 
                  @keyup.enter="saveEdit" 
                  @keyup.esc="cancelEdit"
                >
              </div>
              <div v-else @click="editMode && startEdit(transaction)">
                {{ transaction.destinatory || '-' }}
              </div>
            </td>
            <td :class="transaction.type">
              <div v-if="editMode && editingId === transaction._id">
                <input 
                  type="number" 
                  step="0.01" 
                  v-model.number="editedTransaction.amount" 
                  @keyup.enter="saveEdit" 
                  @keyup.esc="cancelEdit"
                >
              </div>
              <div v-else @click="editMode && startEdit(transaction)">
                {{ formatCurrency(transaction.amount) }}
              </div>
            </td>
            <td>
              <div v-if="editMode && editingId === transaction._id">
                <select 
                  v-model="editedTransaction.type" 
                  @keyup.enter="saveEdit" 
                  @keyup.esc="cancelEdit"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div v-else @click="editMode && startEdit(transaction)">
                {{ transaction.type }}
              </div>
            </td>
            <td>
              <div v-if="editMode && editingId === transaction._id">
                <input 
                  type="number" 
                  step="0.01" 
                  v-model.number="editedTransaction.balance" 
                  @keyup.enter="saveEdit" 
                  @keyup.esc="cancelEdit"
                >
              </div>
              <div v-else @click="editMode && startEdit(transaction)">
                {{ formatCurrency(transaction.balance) }}
              </div>
            </td>
            <td v-if="editMode">
              <div class="action-buttons" v-if="editingId === transaction._id">
                <button class="save-btn" @click="saveEdit">Save</button>
                <button class="cancel-btn" @click="cancelEdit">Cancel</button>
              </div>
              <div class="action-buttons" v-else>
                <button class="edit-btn" @click="startEdit(transaction)">Edit</button>
                <button class="delete-btn" @click="confirmDeleteSingle(transaction._id)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else class="no-data">
      <p>No transactions match your filter criteria.</p>
      <button class="reset-btn" @click="resetFilters">Reset Filters</button>
    </div>
  </div>

  <!-- Add confirmation dialog -->
  <div v-if="showDeleteConfirm" class="delete-confirm-overlay">
    <div class="delete-confirm-dialog">
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete {{ selectedIds.length }} transaction(s)?</p>
      <p class="warning">This action cannot be undone.</p>
      <div class="dialog-actions">
        <button class="cancel-btn" @click="showDeleteConfirm = false">Cancel</button>
        <button class="delete-btn" @click="deleteSelected" :disabled="loading">
          {{ loading ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, nextTick } from 'vue';
import { 
  getBankTransactions, 
  exportTransactionsToCSV, 
  updateBankTransaction,
  exportSelectedTransactionsToCSV,
  deleteBankTransaction,
  deleteBankTransactions,
  BankTransaction
} from '../services/bankStatementService';

// Type declarations
interface Filters {
  search: string;
  startDate: string;
  endDate: string;
  type: 'all' | 'credit' | 'debit';
  minAmount: string;
  maxAmount: string;
  bank: string;
}

// State
const allTransactions = ref<BankTransaction[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const connectionStatus = ref<'connected' | 'limited' | 'disconnected'>('connected');

// Sorting
const sortKey = ref<string>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Edit mode
const editMode = ref<boolean>(false);
const editingId = ref<string | null>(null);
const editedTransaction = ref<Partial<BankTransaction>>({});

// Selection
const selectedIds = ref<string[]>([]);

// Delete confirmation
const showDeleteConfirm = ref<boolean>(false);
const deleteTarget = ref<string | string[]>('');

// Filters
const filters = reactive<Filters>({
  search: '',
  startDate: '',
  endDate: '',
  type: 'all',
  minAmount: '',
  maxAmount: '',
  bank: ''
});

// Get all unique banks
const banksList = computed(() => {
  const banks = new Set(allTransactions.value.map((t: BankTransaction) => t.bank).filter(Boolean));
  return [...banks];
});

// Toggle edit mode
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  // Exit any active edit when toggling mode
  if (!editMode.value) {
    editingId.value = null;
  }
};

// Start editing a transaction
const startEdit = (transaction: BankTransaction) => {
  // First, cancel any existing edit
  if (editingId.value) {
    cancelEdit();
  }
  
  if (!transaction._id) {
    console.error('Transaction has no ID');
    return;
  }
  
  editingId.value = transaction._id;
  
  // Format date for the date input (YYYY-MM-DD)
  const formattedDate = new Date(transaction.date).toISOString().split('T')[0];
  
  // Make a copy to avoid direct mutation
  editedTransaction.value = { 
    ...transaction,
    date: formattedDate
  };
};

// Save edited transaction with better handling
const saveEdit = async () => {
  if (!editingId.value) return;
  
  loading.value = true;
  error.value = null;
  successMessage.value = null;
  
  try {
    // Validate form data
    if (!editedTransaction.value.date) {
      throw new Error('Date is required');
    }
    
    if (!editedTransaction.value.description) {
      throw new Error('Description is required');
    }
    
    if (isNaN(Number(editedTransaction.value.amount)) || 
        Number(editedTransaction.value.amount) <= 0) {
      throw new Error('Amount must be a positive number');
    }
    
    if (isNaN(Number(editedTransaction.value.balance))) {
      throw new Error('Balance must be a number');
    }
    
    // Create the update object with clean data
    const updateData = {
      date: editedTransaction.value.date,
      description: editedTransaction.value.description,
      amount: Number(editedTransaction.value.amount),
      type: editedTransaction.value.type,
      balance: Number(editedTransaction.value.balance),
      destinatory: editedTransaction.value.destinatory || ''
    };
    
    // Update using local function 
    try {
      console.log('Updating transaction:', updateData);
      const updatedTransaction = await updateBankTransaction(
        editingId.value,
        updateData
      );
      
      // Update local data
      const index = allTransactions.value.findIndex(t => t._id === editingId.value);
      if (index !== -1) {
        console.log('Found transaction in local array, updating');
        allTransactions.value[index] = {
          ...allTransactions.value[index],
          ...updatedTransaction
        };
      } else {
        console.warn('Transaction not found in local array');
      }
      
      // Exit edit mode for this item
      editingId.value = null;
      
      // Show success message
      successMessage.value = connectionStatus.value === 'connected' 
        ? 'Transaction updated successfully!' 
        : 'Transaction updated locally (offline mode)';
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } catch (updateError) {
      // Handle API errors
      console.error('Error during save:', updateError);
      connectionStatus.value = 'disconnected'; // Mark as disconnected if update fails
      throw new Error('Failed to save changes. The data has been stored locally.');
    }
  } catch (err: any) {
    console.error('Error saving transaction:', err);
    error.value = err.message || 'Failed to save changes. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Cancel editing
const cancelEdit = () => {
  editingId.value = null;
  editedTransaction.value = {};
};

// Selection functions
const toggleSelect = (id: string): void => {
  const index = selectedIds.value.indexOf(id);
  if (index === -1) {
    selectedIds.value.push(id);
  } else {
    selectedIds.value.splice(index, 1);
  }
};

const isSelected = (id: string): boolean => {
  return selectedIds.value.includes(id);
};

const toggleSelectAll = (): void => {
  if (selectedIds.value.length === filteredTransactions.value.length) {
    // Deselect all
    selectedIds.value = [];
  } else {
    // Select all filtered transactions
    selectedIds.value = filteredTransactions.value.map((t: BankTransaction) => t._id!);
  }
};

const allSelected = computed((): boolean => {
  return filteredTransactions.value.length > 0 && 
         selectedIds.value.length === filteredTransactions.value.length;
});

const selectedTransactions = computed((): BankTransaction[] => {
  return filteredTransactions.value.filter((t: BankTransaction) => selectedIds.value.includes(t._id!));
});

// Export selected transactions to CSV
const exportSelectedToCSV = () => {
  if (selectedTransactions.value.length === 0) {
    // Show error or notification
    return;
  }
  
  try {
    exportSelectedTransactionsToCSV(selectedTransactions.value);
  } catch (error) {
    console.error('Error exporting selected to CSV:', error);
  }
};

// Check server connection
const checkServerConnection = async () => {
  try {
    console.log('Checking server connection status...');
    // Attempt to ping the server (implemented in getBankTransactions)
    await getBankTransactions(1); // Try once with a single retry
    connectionStatus.value = 'connected';
    console.log('Connected to server');
  } catch (err) {
    console.error('Server connection issue detected', err);
    connectionStatus.value = 'disconnected';
  }
};

// Fetch all transactions
const fetchTransactions = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching transactions...');
    await checkServerConnection();
    const transactions = await getBankTransactions();
    console.log(`Received ${transactions.length} transactions`);
    
    if (transactions.length === 0) {
      // If no transactions, show message but don't set error
      // This allows using other UI components
      console.log('No transactions found');
    }
    
    allTransactions.value = transactions;
  } catch (err) {
    console.error('Error fetching transactions:', err);
    error.value = 'Failed to load transactions. Using offline data.';
    connectionStatus.value = 'disconnected';
    // Continue to show the UI even with error, as we have fallback data
  } finally {
    loading.value = false;
  }
};

// Perform connection check and load data when component mounts
onMounted(async () => {
  try {
    await checkServerConnection();
  } catch (err) {
    console.error('Initial connection check failed:', err);
    connectionStatus.value = 'disconnected';
  }
  fetchTransactions();
});

// Filtered transactions with type annotations
const filteredTransactions = computed((): BankTransaction[] => {
  return allTransactions.value
    .filter((transaction: BankTransaction) => {
      // Search filter
      if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Date filter
      if (filters.startDate && new Date(transaction.date) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(transaction.date) > new Date(filters.endDate)) {
        return false;
      }
      
      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }
      
      // Amount filter
      if (filters.minAmount && transaction.amount < Number(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && transaction.amount > Number(filters.maxAmount)) {
        return false;
      }
      
      return true;
    })
    .sort((a: BankTransaction, b: BankTransaction) => {
      // Sort by selected key
      if (sortKey.value === 'date') {
        return sortOrder.value === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortKey.value === 'amount' || sortKey.value === 'balance') {
        return sortOrder.value === 'asc' 
          ? a[sortKey.value] - b[sortKey.value]
          : b[sortKey.value] - a[sortKey.value];
      } else {
        // String comparison for description
        return sortOrder.value === 'asc'
          ? String(a[sortKey.value]).localeCompare(String(b[sortKey.value]))
          : String(b[sortKey.value]).localeCompare(String(a[sortKey.value]));
      }
    });
});

// Filtered summary statistics
const filteredSummary = computed(() => {
  let totalCredits = 0;
  let totalDebits = 0;
  
  filteredTransactions.value.forEach(transaction => {
    if (transaction.type === 'credit') {
      totalCredits += transaction.amount;
    } else {
      totalDebits += transaction.amount;
    }
  });
  
  return {
    totalCredits,
    totalDebits,
    netFlow: totalCredits - totalDebits
  };
});

// Helper functions
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const sortBy = (key: string): void => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const applyFilters = () => {
  // This function is called by filter inputs
  // The computed property handles the actual filtering
};

const resetFilters = () => {
  filters.search = '';
  filters.startDate = '';
  filters.endDate = '';
  filters.type = 'all';
  filters.minAmount = '';
  filters.maxAmount = '';
  filters.bank = '';
};

// Function to export transactions to CSV
const exportToCSV = () => {
  try {
    // Pass current filters to the export function
    exportTransactionsToCSV({
      startDate: filters.startDate,
      endDate: filters.endDate,
      type: filters.type !== 'all' ? filters.type : undefined
    });
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    // You could add error notification here
  }
};

const confirmDeleteSingle = (id: string) => {
  deleteTarget.value = id;
  showDeleteConfirm.value = true;
};

const confirmDeleteSelected = () => {
  deleteTarget.value = selectedIds.value;
  showDeleteConfirm.value = true;
};

const deleteSelected = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    if (Array.isArray(deleteTarget.value)) {
      await deleteBankTransactions(deleteTarget.value);
      selectedIds.value = []; // Clear selection
    } else {
      await deleteBankTransaction(deleteTarget.value);
      const index = selectedIds.value.indexOf(deleteTarget.value);
      if (index !== -1) {
        selectedIds.value.splice(index, 1);
      }
    }
    
    // Refresh the transactions list
    await fetchTransactions();
    
    // Show success message
    successMessage.value = connectionStatus.value === 'connected'
      ? 'Transaction(s) deleted successfully!'
      : 'Transaction(s) deleted locally (offline mode)';
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    console.error('Error deleting transactions:', err);
    error.value = err.message || 'Failed to delete transactions. Please try again.';
  } finally {
    loading.value = false;
    showDeleteConfirm.value = false;
    deleteTarget.value = '';
  }
};
</script>

<style scoped>
.transactions-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 1.5rem;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.mode-btn {
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background-color: #0e7e74;
  color: white;
  border-color: #0e7e74;
}

.mode-btn:hover {
  background-color: #0e7e74;
  color: white;
}

.selected-count {
  display: inline-block;
  font-weight: 500;
  color: #0e7e74;
  background-color: #e8faf8;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #0e7e74;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
}

input, select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  outline: none;
  font-size: 0.875rem;
}

input:focus, select:focus {
  border-color: #0e7e74;
  box-shadow: 0 0 0 1px #0e7e74;
}

.date-range, .amount-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range span, .amount-range span {
  color: #6b7280;
}

.reset-btn, .export-btn, .export-selected-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  margin-left: auto;
}

.reset-btn:hover {
  background-color: #e5e7eb;
}

.export-btn, .export-selected-btn {
  background-color: #0e7e74;
  color: white;
  border: none;
  margin-left: 0.5rem;
}

.export-btn:hover, .export-selected-btn:hover {
  background-color: #0c6b63;
}

.export-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.export-selected-btn {
  background-color: #065f59;
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  text-align: center;
}

.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.transactions-table-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.edit-mode-notice {
  padding: 0.75rem;
  background-color: #e8faf8;
  border-bottom: 1px solid #d1d5db;
  color: #0e7e74;
  font-size: 0.875rem;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th, .transactions-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.transactions-table th {
  font-weight: 600;
  color: #4b5563;
  background-color: #f9fafb;
  position: sticky;
  top: 0;
}

.select-column {
  width: 40px;
  text-align: center;
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background-color: #f3f4f6;
}

.sort-icon {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.description {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.destinatory {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.credit {
  color: #059669;
}

.debit {
  color: #dc2626;
}

tr.selected {
  background-color: #e8faf8;
}

tr.editing {
  background-color: #fffbeb;
}

tr:hover {
  background-color: #f9fafb;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .save-btn, .cancel-btn {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.edit-btn {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #4b5563;
}

.save-btn {
  background-color: #0e7e74;
  border: none;
  color: white;
}

.cancel-btn {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #4b5563;
}

.no-data {
  padding: 3rem;
  text-align: center;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.no-data p {
  margin-bottom: 1rem;
  color: #6b7280;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #0e7e74;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-message {
  padding: 2rem;
  text-align: center;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #0e7e74;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background-color: #0c6b64;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
  }
  
  .transactions-container {
    padding: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}

.success-message {
  background-color: #e8faf8;
  color: #0e7e74;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  border-left: 4px solid #0e7e74;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.connection-warning {
  background-color: #fef9c3;
  color: #854d0e;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  border-left: 4px solid #f59e0b;
  display: flex;
  align-items: center;
}

.warning-icon {
  font-size: 1.25rem;
  margin-right: 0.75rem;
}

.warning-text {
  flex: 1;
}

.delete-btn {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background-color: #b91c1c;
}

.delete-btn:disabled {
  background-color: #f87171;
  cursor: not-allowed;
}

.delete-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.delete-confirm-dialog {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.delete-confirm-dialog h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.delete-confirm-dialog p {
  margin: 0 0 1rem 0;
  color: #4b5563;
}

.delete-confirm-dialog .warning {
  color: #dc2626;
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.selected-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style> 