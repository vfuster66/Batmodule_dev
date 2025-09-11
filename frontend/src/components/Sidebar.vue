<template>
  <div
    :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      // Keep the sidebar fixed on desktop; only control its visibility
      // to avoid double layout shifts with the content padding.
      'lg:translate-x-0',
    ]"
  >
    <!-- Logo de l'entreprise -->
    <div
      class="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 relative"
    >
      <div class="flex items-center justify-center">
        <!-- Logo de l'entreprise -->
        <img
          v-if="companyStore.settings?.logo_url"
          :src="companyStore.settings.logo_url"
          alt="Logo entreprise"
          class="max-h-16 w-auto object-contain"
        />
        <img
          v-else-if="companyStore.settings?.logo_base64"
          :src="companyStore.settings.logo_base64"
          alt="Logo entreprise"
          class="max-h-16 w-auto object-contain"
        />
        <div
          v-else
          class="h-16 w-16 bg-blue-cobalt rounded-lg flex items-center justify-center"
        >
          <span class="text-white font-bold text-2xl">
            {{
              companyStore.settings?.company_name?.charAt(0)?.toUpperCase() ||
              'E'
            }}
          </span>
        </div>
      </div>
      <button
        @click="$emit('toggle')"
        class="lg:hidden absolute right-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Navigation principale -->
    <nav class="mt-5 px-2">
      <div class="space-y-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
            $route.path === item.href
              ? 'bg-blue-cobalt text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
          ]"
        >
          <component
            :is="item.icon"
            :class="[
              'mr-3 h-5 w-5 flex-shrink-0',
              $route.path === item.href
                ? 'text-white'
                : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
            ]"
          />
          {{ item.name }}
        </router-link>
      </div>

      <!-- Section entreprise -->
      <div class="mt-8">
        <h3
          class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          Gestion entreprise
        </h3>
        <div class="mt-2 space-y-1">
          <template v-for="item in companyNavigation" :key="item.name">
            <router-link
              v-if="!item.action"
              :to="item.href"
              :class="[
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                $route.path === item.href
                  ? 'bg-blue-cobalt text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  'mr-3 h-5 w-5 flex-shrink-0',
                  $route.path === item.href
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                ]"
              />
              {{ item.name }}
            </router-link>
            <button
              v-else
              @click="handleLogout"
              :class="[
                'group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  'mr-3 h-5 w-5 flex-shrink-0',
                  'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                ]"
              />
              {{ item.name }}
            </button>
          </template>
        </div>
      </div>

      <!-- Section pages publiques -->
      <div class="mt-8">
        <h3
          class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          Pages publiques
        </h3>
        <div class="mt-2 space-y-1">
          <template v-for="item in publicPagesNavigation" :key="item.name">
            <a
              :href="item.href"
              target="_blank"
              :class="[
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  'mr-3 h-5 w-5 flex-shrink-0',
                  'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                ]"
              />
              {{ item.name }}
              <ExternalLinkIcon
                :class="[
                  'ml-auto h-4 w-4 flex-shrink-0',
                  'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                ]"
              />
            </a>
          </template>
        </div>
      </div>
    </nav>

    <!-- Informations utilisateur -->
    <!-- Footer avec logo et copyright -->
    <div
      class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700"
    >
      <!-- Logo BatModule -->
      <div class="flex items-center justify-center mb-3">
        <div class="h-12 flex items-center justify-center">
          <img
            v-if="isDark"
            :src="logoDark"
            alt="BatModule"
            class="max-h-12 object-contain"
          />
          <img
            v-else
            :src="logoLight"
            alt="BatModule"
            class="max-h-12 w-auto object-contain"
          />
        </div>
      </div>

      <!-- Copyright -->
      <div class="text-center mb-3">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          © {{ new Date().getFullYear() }} BatModule
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, h, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'
import { useToast } from 'vue-toastification'
import logoLight from '@/assets/9.svg'
import logoDark from '@/assets/11.svg'

// Définir les événements
defineEmits(['toggle'])

// Props
defineProps({
  sidebarOpen: {
    type: Boolean,
    default: false,
  },
})

// Icônes SVG comme composants
const HomeIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      }),
    ]
  )

const UsersIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      }),
    ]
  )

const WrenchScrewdriverIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 010-3.586l.745-.745a2.548 2.548 0 013.586 0l5.653 4.655M8.5 11.5l2.5-2.5m-5 5l2.5-2.5',
      }),
    ]
  )

const DocumentTextIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      }),
    ]
  )

const ReceiptPercentIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      }),
    ]
  )

const CogIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      }),
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      }),
    ]
  )

const BuildingOfficeIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3zM9 9h6m-6 3h6m-6 3h6',
      }),
    ]
  )

const ChartBarIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      }),
    ]
  )

const LogoutIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      }),
    ]
  )

// Icônes pour les pages publiques
const DocumentIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      }),
    ]
  )

const ShieldCheckIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      }),
    ]
  )

const ExternalLinkIcon = () =>
  h(
    'svg',
    {
      class: 'h-5 w-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    },
    [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
      }),
    ]
  )

const router = useRouter()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const toast = useToast()

// Gestion du thème pour le logo adaptatif
const isDark = ref(false)

// Fonction pour détecter le thème
const checkTheme = () => {
  isDark.value = document.documentElement.classList.contains('dark')
}

// Écouter les changements de thème et charger les paramètres d'entreprise
onMounted(async () => {
  checkTheme()
  // Observer les changements de classe sur html
  const observer = new MutationObserver(checkTheme)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  // Charger les paramètres d'entreprise pour le logo (une seule fois, si absent)
  try {
    if (
      !companyStore.settings ||
      Object.keys(companyStore.settings).length === 0
    ) {
      await companyStore.fetchSettings()
    }
  } catch (error) {
    console.error(
      "Erreur lors du chargement des paramètres d'entreprise:",
      error
    )
  }
})

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Clients', href: '/clients', icon: UsersIcon },
  { name: 'Services', href: '/services', icon: WrenchScrewdriverIcon },
  { name: 'Devis', href: '/quotes', icon: DocumentTextIcon },
  { name: 'Factures', href: '/invoices', icon: ReceiptPercentIcon },
  { name: 'Statistiques', href: '/analytics', icon: ChartBarIcon },
]

const companyNavigation = [
  { name: 'Mon Profil', href: '/profile', icon: UsersIcon },
  {
    name: 'Configuration entreprise',
    href: '/settings',
    icon: BuildingOfficeIcon,
  },
  // Onglets doublons retirés: Paramètres, Mentions légales, Entreprise et Statistiques
  { name: 'Déconnexion', href: '/logout', icon: LogoutIcon, action: 'logout' },
]

const publicPagesNavigation = [
  {
    name: 'Mentions légales',
    href: '/mentions-legales',
    icon: DocumentIcon,
    external: true,
  },
  { name: 'CGV', href: '/cgv', icon: DocumentIcon, external: true },
  {
    name: 'Politique de confidentialité',
    href: '/politique-confidentialite',
    icon: ShieldCheckIcon,
    external: true,
  },
]

const handleLogout = async () => {
  try {
    await authStore.logout()
    toast.success('Déconnexion réussie')
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}
</script>
