<template>
  <div class="transactions-container">
    <div class="header-section">
      <h1>Transactions</h1>
      <div class="statement-info" v-if="statementInfo">
        <div class="info-item">
          <span class="label">Account:</span>
          <span class="value">{{ statementInfo.accountNumber }}</span>
        </div>
        <div class="info-item">
          <span class="label">Period:</span>
          <span class="value">{{ formatDate(statementInfo.startDate) }} - {{ formatDate(statementInfo.endDate) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Bank:</span>
          <span class="value">{{ statementInfo.bankName }}</span>
        </div>
      </div>
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
    
    <div class="transactions-table-container" v-if="filteredTransactions.length > 0">
      <table class="transactions-table">
        <thead>
          <tr>
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in filteredTransactions" :key="transaction._id">
            <td>{{ formatDate(transaction.date) }}</td>
            <td class="description">{{ transaction.description }}</td>
            <td class="destinatory">{{ transaction.destinatory || '-' }}</td>
            <td :class="transaction.type">{{ formatCurrency(transaction.amount) }}</td>
            <td>{{ transaction.type }}</td>
            <td>{{ formatCurrency(transaction.balance) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else class="no-data">
      <p>No transactions match your filter criteria.</p>
      <button class="reset-btn" @click="resetFilters">Reset Filters</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getBankStatement, BankTransaction, BankStatement } from '../services/bankStatementService';

const route = useRoute();
const router = useRouter();
const allTransactions = ref<BankTransaction[]>([]);
const statementInfo = ref<BankStatement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Sorting
const sortKey = ref('date');
const sortOrder = ref('desc');

// Filters
const filters = reactive({
  search: '',
  startDate: '',
  endDate: '',
  type: 'all',
  minAmount: '',
  maxAmount: ''
});

// Get transactions
onMounted(async () => {
  try {
    const statementId = route.params.id as string;
    if (!statementId) {
      router.push('/bank-statements');
      return;
    }
    
    const response = await getBankStatement(statementId);
    console.log('TransactionsView - Full API response:', response);
    console.log('TransactionsView - Statement:', response.statement);
    console.log('TransactionsView - Transactions count:', response.transactions?.length);
    
    allTransactions.value = response.transactions;
    statementInfo.value = response.statement;
    
    console.log('TransactionsView - statementInfo after assignment:', statementInfo.value);
    
    // Initialize date filters with statement date range if available
    if (response.statement.startDate) {
      filters.startDate = response.statement.startDate.split('T')[0];
    }
    if (response.statement.endDate) {
      filters.endDate = response.statement.endDate.split('T')[0];
    }
    
    loading.value = false;
  } catch (err) {
    console.error('Error fetching transactions:', err);
    error.value = 'Failed to load transactions. Please try again.';
    loading.value = false;
  }
});

// Filtered transactions
const filteredTransactions = computed(() => {
  return allTransactions.value
    .filter(transaction => {
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
    .sort((a, b) => {
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
          ? a[sortKey.value].localeCompare(b[sortKey.value])
          : b[sortKey.value].localeCompare(a[sortKey.value]);
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
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  
  // Log the currency selection
  const currency = statementInfo.value?.currency || 'USD';
  console.log('TransactionsView - statementInfo:', statementInfo.value);
  console.log('TransactionsView - using currency:', currency);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const sortBy = (key) => {
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
  filters.startDate = statementInfo.value?.startDate?.split('T')[0] || '';
  filters.endDate = statementInfo.value?.endDate?.split('T')[0] || '';
  filters.type = 'all';
  filters.minAmount = '';
  filters.maxAmount = '';
};
</script>

<style scoped>
.transactions-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.statement-info {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.label {
  font-weight: 600;
  color: #4b5563;
}

.value {
  color: #1f2937;
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

.reset-btn {
  margin-left: auto;
  align-self: flex-end;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background-color: #e5e7eb;
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
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.transactions-table-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th, .transactions-table td {
  padding: 1rem;
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

.credit {
  color: #059669;
}

.debit {
  color: #dc2626;
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

@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
  }
  
  .transactions-container {
    padding: 1rem;
  }
}
</style> 