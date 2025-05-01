<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// You would normally use authStore here
const isAuthenticated = ref(true);
const user = ref({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
});

const router = useRouter();
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const logout = () => {
  // Call logout from your auth store
  router.push('/login');
};

defineProps({
  sidebarOpen: {
    type: Boolean,
    required: true
  }
});

defineEmits(['toggle-sidebar']);

const dropdownOpen = ref(false);

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};
</script>

<template>
  <nav class="bg-indigo-600">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <!-- Sidebar toggle button -->
          <button 
            @click="$emit('toggle-sidebar')" 
            class="text-white p-1 rounded-md hover:bg-indigo-700 focus:outline-none mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span class="sr-only">Toggle sidebar</span>
          </button>
          
          <div class="flex-shrink-0">
            <h1 class="text-white font-bold text-xl">NovaFi</h1>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <router-link
                to="/dashboard"
                class="text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                active-class="bg-indigo-700"
              >
                Dashboard
              </router-link>

              <router-link
                to="/invoices"
                class="text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                active-class="bg-indigo-700"
              >
                Invoices
              </router-link>

              <router-link
                to="/csv"
                class="text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                active-class="bg-indigo-700"
              >
                CSV Import
              </router-link>

              <router-link
                to="/bank"
                class="text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                active-class="bg-indigo-700"
              >
                Bank Statements
              </router-link>
            </div>
          </div>
        </div>
        <div class="hidden md:block">
          <div class="ml-4 flex items-center md:ml-6">
            <!-- User profile dropdown -->
            <div class="ml-3 relative">
              <div>
                <button
                  @click="toggleDropdown"
                  class="max-w-xs bg-indigo-700 flex items-center text-sm rounded-full text-white focus:outline-none"
                  id="user-menu"
                  aria-haspopup="true"
                >
                  <span class="sr-only">Open user menu</span>
                  <div class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span class="font-medium">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</span>
                  </div>
                </button>
              </div>
              <!-- Dropdown menu, show/hide based on menu state. -->
              <div
                v-if="dropdownOpen"
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu"
              >
                <div class="px-4 py-2 text-sm text-gray-700 border-b">
                  <div class="font-medium">{{ user.firstName }} {{ user.lastName }}</div>
                  <div class="text-gray-500 truncate">{{ user.email }}</div>
                </div>
                <router-link to="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  Your Profile
                </router-link>
                <router-link to="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                  Settings
                </router-link>
                <button
                  @click="logout"
                  class="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="-mr-2 flex md:hidden">
          <!-- Mobile menu button -->
          <button
            @click="toggleMobileMenu"
            class="bg-indigo-700 inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-800 focus:ring-white"
          >
            <span class="sr-only">Open main menu</span>
            <!-- Icon when menu is closed -->
            <svg
              :class="{ 'hidden': isMobileMenuOpen, 'block': !isMobileMenuOpen }"
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <!-- Icon when menu is open -->
            <svg
              :class="{ 'hidden': !isMobileMenuOpen, 'block': isMobileMenuOpen }"
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu, show/hide based on menu state -->
    <div :class="{ block: isMobileMenuOpen, hidden: !isMobileMenuOpen }" class="md:hidden">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <router-link
          to="/dashboard"
          class="text-white hover:bg-indigo-700 block px-3 py-2 rounded-md text-base font-medium"
          active-class="bg-indigo-700"
        >
          Dashboard
        </router-link>

        <router-link
          to="/invoices"
          class="text-white hover:bg-indigo-700 block px-3 py-2 rounded-md text-base font-medium"
          active-class="bg-indigo-700"
        >
          Invoices
        </router-link>

        <router-link
          to="/csv"
          class="text-white hover:bg-indigo-700 block px-3 py-2 rounded-md text-base font-medium"
          active-class="bg-indigo-700"
        >
          CSV Import
        </router-link>

        <router-link
          to="/bank"
          class="text-white hover:bg-indigo-700 block px-3 py-2 rounded-md text-base font-medium"
          active-class="bg-indigo-700"
        >
          Bank Statements
        </router-link>
      </div>
      <div class="pt-4 pb-3 border-t border-indigo-700">
        <div class="flex items-center px-5">
          <div class="flex-shrink-0">
            <div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
              <span class="font-medium text-white">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</span>
            </div>
          </div>
          <div class="ml-3">
            <div class="text-base font-medium leading-none text-white">{{ user.firstName }} {{ user.lastName }}</div>
            <div class="text-sm font-medium leading-none text-indigo-200 mt-1">{{ user.email }}</div>
          </div>
        </div>
        <div class="mt-3 px-2 space-y-1">
          <router-link to="/profile" class="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-700">
            Your Profile
          </router-link>
          <router-link to="/settings" class="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-700">
            Settings
          </router-link>
          <button
            @click="logout"
            class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template> 