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
        Créer un compte BatModule
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Ou
        <router-link
          to="/login"
          class="font-medium text-blue-cobalt hover:text-blue-700 dark:text-blue-400"
        >
          connectez-vous à votre compte existant
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div
        class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10"
      >
        <form class="space-y-6" @submit.prevent="handleRegister">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="firstName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Prénom
              </label>
              <div class="mt-1">
                <input
                  id="firstName"
                  v-model="form.firstName"
                  name="firstName"
                  type="text"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                  placeholder="Jean"
                />
              </div>
            </div>

            <div>
              <label
                for="lastName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nom
              </label>
              <div class="mt-1">
                <input
                  id="lastName"
                  v-model="form.lastName"
                  name="lastName"
                  type="text"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                  placeholder="Dupont"
                />
              </div>
            </div>
          </div>

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
              for="companyName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nom de l'entreprise (optionnel)
            </label>
            <div class="mt-1">
              <input
                id="companyName"
                v-model="form.companyName"
                name="companyName"
                type="text"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                placeholder="Entreprise Dupont"
              />
            </div>
          </div>

          <div>
            <label
              for="phone"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Téléphone (optionnel)
            </label>
            <div class="mt-1">
              <input
                id="phone"
                v-model="form.phone"
                name="phone"
                type="tel"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                placeholder="01 23 45 67 89"
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
                autocomplete="new-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                placeholder="Minimum 8 caractères"
              />
            </div>
          </div>

          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirmer le mot de passe
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                placeholder="Répétez votre mot de passe"
              />
            </div>
          </div>

          <div>
            <label
              for="address"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Adresse (optionnel)
            </label>
            <div class="mt-1">
              <textarea
                id="address"
                v-model="form.address"
                name="address"
                rows="3"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-cobalt focus:border-blue-cobalt sm:text-sm"
                placeholder="123 rue de la Paix, 75001 Paris"
              />
            </div>
          </div>

          <div class="flex items-center">
            <input
              id="terms"
              v-model="form.acceptTerms"
              name="terms"
              type="checkbox"
              required
              class="h-4 w-4 text-blue-cobalt focus:ring-blue-cobalt border-gray-300 dark:border-gray-600 rounded"
            />
            <label
              for="terms"
              class="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              J'accepte les
              <a
                href="#"
                class="text-blue-cobalt hover:text-blue-700 dark:text-blue-400"
                >conditions d'utilisation</a
              >
              et la
              <a
                href="#"
                class="text-blue-cobalt hover:text-blue-700 dark:text-blue-400"
                >politique de confidentialité</a
              >
            </label>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading || !form.acceptTerms"
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
              {{ isLoading ? 'Création du compte...' : 'Créer mon compte' }}
            </button>
          </div>
        </form>
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
  firstName: '',
  lastName: '',
  email: '',
  companyName: '',
  phone: '',
  password: '',
  confirmPassword: '',
  address: '',
  acceptTerms: false,
})

const handleRegister = async () => {
  // Validation
  if (!form.firstName || !form.lastName || !form.email || !form.password) {
    toast.error('Veuillez remplir tous les champs obligatoires')
    return
  }

  if (form.password !== form.confirmPassword) {
    toast.error('Les mots de passe ne correspondent pas')
    return
  }

  if (form.password.length < 8) {
    toast.error('Le mot de passe doit contenir au moins 8 caractères')
    return
  }

  if (!form.acceptTerms) {
    toast.error("Veuillez accepter les conditions d'utilisation")
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      companyName: form.companyName || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
    })

    if (result.success) {
      toast.success('Compte créé avec succès !')
      router.push('/dashboard')
    }
  } catch (error) {
    console.error("Erreur d'inscription:", error)
  } finally {
    isLoading.value = false
  }
}
</script>
