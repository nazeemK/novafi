<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue: string | number
  type?: string
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>();

const inputId = computed(() => props.id || `input-${Math.random().toString(36).substring(2, 9)}`);
const focused = ref(false);

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div>
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <input
        :id="inputId"
        :type="type || 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :name="name"
        @input="updateValue"
        @focus="focused = true"
        @blur="focused = false"
        class="block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 px-4 py-2 border"
        :class="{
          'border-red-300': error,
          'opacity-60 cursor-not-allowed': disabled,
          'border-indigo-500 ring-1 ring-indigo-500': focused && !error
        }"
      />
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template> 