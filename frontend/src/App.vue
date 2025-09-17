<template>
  <div id="app">
    <LoadingSpinner
      v-if="isInitializing"
      message="Initialisation de l'application..."
    />
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useSecurity } from '@/composables/useSecurity'

const authStore = useAuthStore()
const isInitializing = ref(true)

// Initialiser les protections de sécurité
useSecurity()

onMounted(async () => {
  try {
    // Initialiser l'authentification au démarrage
    await authStore.initializeAuth()
  } finally {
    isInitializing.value = false
  }
})
</script>
