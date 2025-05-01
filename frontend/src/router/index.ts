import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import BankStatementView from '../views/BankStatementView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import AllTransactionsView from '../views/AllTransactionsView.vue'

// Create placeholder components for now
const Invoices = { template: '<div>Invoices Page</div>' }
const CsvImport = { template: '<div>CSV Import Page</div>' }
const Profile = { template: '<div>Profile Page</div>' }
const Settings = { template: '<div>Settings Page</div>' }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: DashboardView },
    { path: '/invoices', component: Invoices },
    { path: '/csv', component: CsvImport },
    { path: '/bank-statements', component: BankStatementView },
    { path: '/profile', component: Profile },
    { path: '/settings', component: Settings },
    { path: '/login', component: { template: '<div>Login Page</div>' } },
    { path: '/transactions/:id', component: TransactionsView },
    { path: '/all-transactions', component: AllTransactionsView }
  ]
})

export default router 