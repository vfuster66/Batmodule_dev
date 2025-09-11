<template>
  <div
    class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
  >
    <!-- Bouton menu mobile -->
    <button
      @click="$emit('toggle-sidebar')"
      class="p-2 -m-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
    >
      <svg
        class="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>

    <!-- Séparateur mobile -->
    <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" />

    <!-- Contenu principal de la navbar -->
    <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
      <!-- Titre de la page actuelle -->
      <div class="flex items-center">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ pageTitle }}
        </h1>
      </div>

      <!-- Actions de la page -->
      <div class="flex items-center gap-x-2 ml-auto">
        <slot name="actions" />
      </div>

      <!-- Actions globales -->
      <div class="flex items-center gap-x-4 lg:gap-x-6">
        <!-- Toggle thème -->
        <button
          @click="toggleTheme"
          class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          :title="isDark ? 'Mode clair' : 'Mode sombre'"
        >
          <svg
            v-if="isDark"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            ></path>
          </svg>
          <svg
            v-else
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            ></path>
          </svg>
        </button>

        <!-- Notifications -->
        <button
          @click="router.push('/dashboard')"
          class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 relative"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z"
            />
          </svg>
          <!-- Badge de notification -->
          <span
            v-if="unreadCount > 0"
            class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <!-- Bouton de déconnexion direct -->
        <button
          @click="handleLogout"
          class="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-200"
          title="Déconnexion"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>

        <!-- Menu utilisateur -->
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-x-2 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <div
              class="h-6 w-6 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
            >
              <img
                v-if="authStore.user?.avatar"
                :src="authStore.user.avatar"
                alt="Avatar"
                class="h-full w-full object-cover"
              />
              <span
                v-else
                class="text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                {{ userInitials }}
              </span>
            </div>
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Menu déroulant utilisateur -->
          <div
            v-if="showUserMenu"
            @click.away="showUserMenu = false"
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
          >
            <div
              class="px-4 py-2 border-b border-gray-200 dark:border-gray-700"
            >
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ authStore.user?.email }}
              </p>
            </div>
            <router-link
              to="/profile"
              class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg
                class="h-4 w-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5.121 17.804A3 3 0 017 17h10a3 3 0 011.879.804L21 19H3l2.121-1.196zM12 12a5 5 0 100-10 5 5 0 000 10z"
                />
              </svg>
              Profil
            </router-link>
            <router-link
              to="/settings"
              class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg
                class="h-4 w-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Paramètres
            </router-link>
            <button
              @click="handleLogout"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg
                class="h-4 w-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Définir les événements
defineEmits(['toggle-sidebar'])

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

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const isDark = ref(false)
const showUserMenu = ref(false)
const unreadCount = ref(0)

const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const firstName = authStore.user.firstName || ''
  const lastName = authStore.user.lastName || ''
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    toast.success('Déconnexion réussie')
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

onMounted(() => {
  // Récupérer le thème sauvegardé
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

onMounted(async () => {
  try {
    const { data } = await (
      await import('@/utils/api')
    ).default.get('/notifications')
    unreadCount.value = (data.notifications || []).filter(
      (n) => !n.is_read
    ).length
  } catch (e) {
    // silencieux
  }
})
</script>
