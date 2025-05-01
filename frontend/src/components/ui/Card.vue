<script setup lang="ts">
defineProps<{
  title?: string
  noPadding?: boolean
  bordered?: boolean
}>();
</script>

<template>
  <div
    class="bg-white rounded-lg shadow-sm overflow-hidden"
    :class="{ 'border border-gray-200': bordered }"
  >
    <div v-if="title" class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
    </div>
    <div :class="{ 'p-6': !noPadding }">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <slot name="footer"></slot>
    </div>
  </div>
</template> 