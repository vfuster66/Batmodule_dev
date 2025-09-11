<template>
  <div
    class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4"
    >
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-cobalt"
      ></div>
      <span class="text-gray-900 dark:text-white font-medium">{{
        message
      }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'Chargement...',
  },
})
</script>
