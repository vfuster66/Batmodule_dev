<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <Sidebar :sidebar-open="sidebarOpen" @toggle="toggleSidebar" />

    <!-- Overlay pour mobile -->
    <div
      v-if="sidebarOpen"
      @click="toggleSidebar"
      class="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
    />

    <!-- Contenu principal -->
    <div class="lg:pl-64">
      <!-- Navbar -->
      <Navbar
        :page-title="pageTitle"
        :notification-count="notificationCount"
        @toggle-sidebar="toggleSidebar"
      >
        <template #actions>
          <slot name="navbar-actions" />
        </template>
      </Navbar>

      <!-- Contenu de la page -->
      <main class="py-6">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

// Props
defineProps({
  pageTitle: {
    type: String,
    default: 'BatModule',
  },
  notificationCount: {
    type: Number,
    default: 0,
  },
})

const route = useRoute()
const sidebarOpen = ref(false)

// Titre de la page basé sur la route
const pageTitle = computed(() => {
  const titles = {
    '/dashboard': 'Tableau de bord',
    '/clients': 'Clients',
    '/services': 'Services',
    '/quotes': 'Devis',
    '/invoices': 'Factures',
    '/settings': 'Paramètres',
    '/profile': 'Mon Profil',
    '/legal': 'Mentions légales',
    '/company': 'Entreprise',
    '/analytics': 'Statistiques',
  }
  return titles[route.path] || 'BatModule'
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>
