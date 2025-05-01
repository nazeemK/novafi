<script setup lang="ts">
import Navbar from '../components/layout/Navbar.vue';
import Sidebar from '../components/layout/Sidebar.vue';
import { ref } from 'vue';

const sidebarOpen = ref(true);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <transition name="slide">
      <Sidebar v-if="sidebarOpen" class="flex-shrink-0" />
    </transition>

    <!-- Main Content -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <Navbar @toggle-sidebar="toggleSidebar" :sidebar-open="sidebarOpen" />
      
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style> 