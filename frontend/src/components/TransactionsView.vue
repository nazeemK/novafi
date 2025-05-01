<template>
  <v-container>
    <v-card class="mt-4 mb-4">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <h2>Transactions</h2>
          <p class="text-caption">
            {{ filteredTransactions.length }} transactions found
          </p>
        </div>
        <div>
          <v-btn 
            color="primary" 
            variant="outlined" 
            class="ml-2"
            @click="exportToCsv"
          >
            <v-icon size="small" class="mr-1">mdi-download</v-icon>
            Export CSV
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search transactions"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="typeFilter"
              label="Transaction Type"
              :items="transactionTypes"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="categoryFilter"
              label="Category"
              :items="categoryOptions"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              variant="outlined"
              block
              @click="resetFilters"
              density="compact"
            >
              Reset Filters
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Data Table -->
      <v-data-table
        :headers="headers"
        :items="filteredTransactions"
        :loading="loading"
        :items-per-page="10"
        class="elevation-1"
      >
        <!-- Custom slot for amount to color based on credit/debit -->
        <template v-slot:item.amount="{ item }">
          <span :class="item.raw.type === 'credit' ? 'text-success' : 'text-error'">
            {{ item.raw.type === 'credit' ? '+' : '-' }} {{ formatCurrency(Math.abs(item.raw.amount)) }}
          </span>
        </template>

        <!-- Custom slot for date formatting -->
        <template v-slot:item.date="{ item }">
          {{ formatDate(item.raw.date) }}
        </template>

        <!-- Custom slot for category with editing capability -->
        <template v-slot:item.category="{ item }">
          <div class="d-flex align-center">
            <span v-if="!isEditingCategory(item.raw._id)">
              {{ item.raw.category || 'Uncategorized' }}
            </span>
            <v-select
              v-else
              v-model="editCategoryValue"
              :items="categoryOptions"
              variant="outlined"
              density="compact"
              hide-details
              class="category-edit"
            ></v-select>
            <v-btn
              v-if="!isEditingCategory(item.raw._id)"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="startEditCategory(item.raw)"
            ></v-btn>
            <v-btn
              v-else
              icon="mdi-check"
              size="small"
              variant="text"
              color="success"
              @click="saveCategory(item.raw)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { VDataTable } from 'vuetify/labs/VDataTable'
import { getBankTransactions } from '@/services/bankStatementService'
import { BankTransaction } from '@/services/bankStatementService'

export default defineComponent({
  name: 'TransactionsView',
  components: {
    VDataTable,
  },
  setup() {
    const transactions = ref<BankTransaction[]>([])
    const loading = ref(true)
    const search = ref('')
    const typeFilter = ref('')
    const categoryFilter = ref('')
    const editingCategoryId = ref<string | null>(null)
    const editCategoryValue = ref('')

    // Define table headers
    const headers = [
      { title: 'Date', key: 'date', sortable: true },
      { title: 'Description', key: 'description', sortable: true },
      { title: 'Amount', key: 'amount', sortable: true, align: 'end' },
      { title: 'Balance', key: 'balance', sortable: true, align: 'end' },
      { title: 'Category', key: 'category', sortable: true }
    ]

    // Category options (can be expanded)
    const categoryOptions = [
      'Food & Dining',
      'Shopping',
      'Housing',
      'Transportation',
      'Utilities',
      'Entertainment',
      'Healthcare',
      'Education',
      'Personal Care',
      'Travel',
      'Income',
      'Investments',
      'Other'
    ]

    const transactionTypes = ['credit', 'debit']

    // Load transactions data
    onMounted(async () => {
      try {
        loading.value = true
        // Assuming this API call returns BankTransaction[] 
        // You may need to modify this depending on your API structure
        const response = await getBankTransactions()
        transactions.value = response || []
      } catch (error) {
        console.error('Error loading transactions:', error)
      } finally {
        loading.value = false
      }
    })

    // Filter transactions based on search, type, and category
    const filteredTransactions = computed(() => {
      return transactions.value.filter(transaction => {
        // Filter by search text (description)
        const matchesSearch = search.value === '' || 
          transaction.description.toLowerCase().includes(search.value.toLowerCase())
        
        // Filter by transaction type
        const matchesType = typeFilter.value === '' || 
          transaction.type === typeFilter.value
        
        // Filter by category
        const matchesCategory = categoryFilter.value === '' || 
          transaction.category === categoryFilter.value
        
        return matchesSearch && matchesType && matchesCategory
      })
    })

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD', // You might want to make this dynamic
      }).format(amount)
    }

    // Format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
    }

    // Category editing functions
    const isEditingCategory = (id: string) => {
      return editingCategoryId.value === id
    }

    const startEditCategory = (transaction: BankTransaction) => {
      if (transaction._id) {
        editingCategoryId.value = transaction._id
        editCategoryValue.value = transaction.category || ''
      }
    }

    const saveCategory = (transaction: BankTransaction) => {
      if (transaction._id) {
        // Find and update the transaction in our local state
        const index = transactions.value.findIndex(t => t._id === transaction._id)
        if (index !== -1) {
          transactions.value[index].category = editCategoryValue.value
        }
        
        // TODO: You would also want to save this to your backend
        // saveTransactionCategory(transaction._id, editCategoryValue.value)
        
        // Reset editing state
        editingCategoryId.value = null
      }
    }

    // Reset all filters
    const resetFilters = () => {
      search.value = ''
      typeFilter.value = ''
      categoryFilter.value = ''
    }

    // Export transactions to CSV
    const exportToCsv = () => {
      const csvHeader = 'Date,Description,Amount,Balance,Category\n'
      const csvContent = filteredTransactions.value.map(t => {
        return `${t.date},"${t.description.replace(/"/g, '""')}",${t.amount},${t.balance},${t.category || ''}`
      }).join('\n')

      const csv = csvHeader + csvContent
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', 'transactions.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    return {
      transactions,
      loading,
      headers,
      search,
      typeFilter,
      categoryFilter,
      categoryOptions,
      transactionTypes,
      filteredTransactions,
      formatCurrency,
      formatDate,
      resetFilters,
      exportToCsv,
      isEditingCategory,
      startEditCategory,
      saveCategory,
      editingCategoryId,
      editCategoryValue
    }
  }
})
</script>

<style scoped>
.category-edit {
  max-width: 150px;
}
</style> 