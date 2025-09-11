<template>
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg
          class="h-5 w-5 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-yellow-800">
          Configuration requise
        </h3>
        <div class="mt-2 text-sm text-yellow-700">
          <p>
            Pour utiliser l'application, vous devez d'abord compléter la
            configuration de votre entreprise.
          </p>
          <div class="mt-2">
            <p class="font-medium">Champs obligatoires :</p>
            <ul class="mt-1 list-disc list-inside">
              <li v-for="field in requiredFields" :key="field">{{ field }}</li>
            </ul>
          </div>
        </div>
        <div class="mt-4">
          <button
            @click="goToSettings"
            class="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Configurer maintenant
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// Champs obligatoires pour la configuration de base
const requiredFields = [
  "Nom de l'entreprise",
  'SIRET',
  'Forme juridique',
  'Adresse',
  'Code postal',
  'Ville',
  'Téléphone',
  'Email',
]

const goToSettings = () => {
  router.push('/company-settings')
}
</script>
