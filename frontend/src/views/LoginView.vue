<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Logo -->
      <div class="flex justify-center">
        <div
          class="h-12 w-12 bg-blue-cobalt rounded-lg flex items-center justify-center"
        >
          <span class="text-white font-bold text-xl">B</span>
        </div>
      </div>
      <h2
        class="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white"
      >
        Connexion à BatModule
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Ou
        <router-link
          to="/register"
          class="font-medium text-blue-cobalt hover:text-blue-700 dark:text-blue-400"
        >
          créez un nouveau compte
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div
        class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10"
      >
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Adresse email
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mot de passe
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                placeholder="Votre mot de passe"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-blue-cobalt focus:ring-blue-cobalt border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                for="remember-me"
                class="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                Se souvenir de moi
              </label>
            </div>

            <div class="text-sm">
              <a
                href="#"
                class="font-medium text-blue-cobalt hover:text-blue-700 dark:text-blue-400"
              >
                Mot de passe oublié ?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-cobalt hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-cobalt disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span
                v-if="isLoading"
                class="absolute left-0 inset-y-0 flex items-center pl-3"
              >
                <svg
                  class="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </span>
              {{ isLoading ? 'Connexion...' : 'Se connecter' }}
            </button>
          </div>
        </form>

        <!-- Mode démo -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div
                class="w-full border-t border-gray-300 dark:border-gray-600"
              />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500"
                >Mode démo</span
              >
            </div>
          </div>

          <div class="mt-6">
            <button
              @click="loginDemo"
              class="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-cobalt transition-colors duration-200"
            >
              Se connecter en mode démo
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(false)

const form = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const handleLogin = async () => {
  if (!form.email || !form.password) {
    toast.error('Veuillez remplir tous les champs')
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.login({
      email: form.email,
      password: form.password,
    })

    if (result.success) {
      toast.success('Connexion réussie !')
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Erreur de connexion:', error)
  } finally {
    isLoading.value = false
  }
}

const loginDemo = async () => {
  isLoading.value = true

  try {
    const result = await authStore.login({
      email: 'demo@batmodule.fr',
      password: 'demo123',
    })

    if (result.success) {
      toast.success('Connexion en mode démo réussie !')
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Erreur de connexion démo:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
