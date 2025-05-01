<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, /* BarElement, */ ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Pie } from 'vue-chartjs';
import { useRouter } from 'vue-router';

// Get router instance
const router = useRouter();

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, /* BarElement, */ ArcElement, Title, Tooltip, Legend);

// Data for summary metrics
const metrics = ref([
  { 
    title: 'Profit / Loss', 
    value: '$8,120', 
    icon: '↗', 
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600' 
  },
  { 
    title: 'VAT Liabilities', 
    value: '$3,850', 
    icon: '●', 
    bgColor: 'bg-red-100',
    iconColor: 'text-red-400' 
  },
  { 
    title: 'Bank Balance', 
    value: '$24,500', 
    icon: '🏦', 
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600' 
  }
]);

// Cash Flow Line Chart Data
const cashFlowLineData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Cash Flow',
      data: [2000, 3500, 5000, 4200, 6000, 7800, 10000],
      fill: true,
      backgroundColor: 'rgba(72, 202, 194, 0.2)',
      borderColor: 'rgba(72, 202, 194, 1)',
      tension: 0.4
    }
  ]
};

const cashFlowLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          if (value === 0) return '0';
          return value / 1000 + 'k';
        }
      }
    }
  }
};

// Bank Balances Pie Chart Data
const bankBalancesPieData = {
  labels: ['Account 1', 'Account 2', 'Account 3'],
  datasets: [{
    data: [30, 30, 18],
    backgroundColor: [
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 135, 120, 0.8)',
      'rgba(149, 224, 215, 0.8)'
    ],
    borderWidth: 0
  }]
};

const bankBalancesPieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  }
};
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard">
      <!-- Left Sidebar -->
      <div class="sidebar">
        <!-- Logo -->
        <div class="logo-section">
          <h1 class="logo">NovaFi</h1>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <h2 class="section-title">Quick Actions</h2>
          
          <div class="action-button">
            <div class="action-content">
              <div class="icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <div class="action-text">Upload</div>
                <div class="action-text">invoice</div>
              </div>
            </div>
          </div>
          
          <div class="action-button">
            <div class="action-content">
              <div class="icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div class="action-text">Upload</div>
                <div class="action-text">CSV</div>
              </div>
            </div>
          </div>
          
          <!-- New Bank Statement Upload Button -->
          <div class="action-button" @click="router.push('/bank-statements')">
            <div class="action-content">
              <div class="icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <div class="action-text">Upload</div>
                <div class="action-text">bank statement</div>
              </div>
            </div>
          </div>
          
          <!-- All Transactions Button -->
          <div class="action-button" @click="router.push('/all-transactions')">
            <div class="action-content">
              <div class="icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <div class="action-text">View All</div>
                <div class="action-text">Transactions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main Content Area -->
      <div class="main-content">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <div v-for="(metric, index) in metrics" :key="index" class="summary-card">
            <div :class="[metric.bgColor, 'metric-icon-container']">
              <span :class="metric.iconColor" class="metric-icon">{{ metric.icon }}</span>
            </div>
            <div>
              <div class="metric-title">{{ metric.title }}</div>
              <div class="metric-value">{{ metric.value }}</div>
            </div>
          </div>
        </div>
        
        <!-- Charts Section -->
        <div class="charts-grid">
          <!-- Cash Flow Line Chart -->
          <div class="chart-card">
            <h3 class="chart-title">Cash Flow</h3>
            <div class="chart-container">
              <Line :data="cashFlowLineData" :options="cashFlowLineOptions" />
            </div>
          </div>
          
          <!-- Bank Balances Pie Chart (Restored) -->
          <div class="chart-card">
            <h3 class="chart-title">Bank Balances</h3>
            <div class="chart-with-legend">
              <div class="pie-container">
                <Pie :data="bankBalancesPieData" :options="bankBalancesPieOptions" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f8f3eb;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+CiAgPGcgb3BhY2l0eT0iMC4wMyI+CiAgICA8cGF0aCBkPSJNMTQwLDE1IEw2MCwxNSBMMTUsMTQwIEwxNSw2MCBMMTQwLDE1IFoiIGZpbGw9IiMwNDk0OTQiLz4KICA8L2c+Cjwvc3ZnPg==');
  background-size: 300px;
  background-position: 100% 0%;
  background-repeat: no-repeat;
  padding: 0;
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dashboard {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* Sidebar Styles */
.sidebar {
  width: 320px;
  min-height: 100vh;
  background: linear-gradient(to bottom, #7dd3c8, #0e7e74);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar::before {
  content: '';
  position: absolute;
  bottom: -20%;
  left: -20%;
  width: 80%;
  height: 80%;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  z-index: 0;
}

.sidebar::after {
  content: '';
  position: absolute;
  bottom: -10%;
  right: -30%;
  width: 70%;
  height: 70%;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  z-index: 0;
}

.logo-section {
  padding: 2rem;
  position: relative;
  z-index: 1;
}

.logo {
  font-size: 3rem;
  font-weight: bold;
  color: #1e4b48;
}

.quick-actions-section {
  padding: 1rem 2rem;
  background-color: #0e7e74;
  position: relative;
  z-index: 1;
}

.section-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.action-button {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: rgba(84, 211, 194, 0.3);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: rgba(84, 211, 194, 0.4);
}

.action-content {
  display: flex;
  align-items: center;
  color: white;
}

.icon-container {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  margin-right: 0.75rem;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
}

.action-text {
  font-size: 1.25rem;
  font-weight: 500;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  padding: 2rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.metric-icon-container {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.metric-icon {
  font-size: 1.5rem;
}

.metric-title {
  color: #4b5563;
  font-weight: 500;
}

.metric-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.chart-card {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.chart-container {
  height: 15rem;
}

.chart-with-legend {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-container {
  height: 13rem;
  width: 13rem;
}

.legend-container {
  margin-left: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.legend-color {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.legend-label {
  font-weight: 500;
}
</style> 