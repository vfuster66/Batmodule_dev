<template>
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="closeModal"
      ></div>

      <!-- This element is to trick the browser into centering the modal contents. -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
        >&#8203;</span
      >

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="w-full">
                <div class="flex items-center justify-between mb-4">
                  <h3
                    class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                    id="modal-title"
                  >
                    Nouvelle catégorie
                  </h3>
                  <button
                    type="button"
                    @click="closeModal"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                      ></path>
                    </svg>
                  </button>
                </div>

                <div class="space-y-6">
                  <!-- Nom de la catégorie -->
                  <div>
                    <label
                      for="name"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Nom de la catégorie *
                    </label>
                    <input
                      id="name"
                      v-model="formData.name"
                      type="text"
                      required
                      class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="Ex: Peinture, Plomberie, Électricité..."
                    />
                  </div>

                  <!-- Description -->
                  <div>
                    <label
                      for="description"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      v-model="formData.description"
                      rows="3"
                      class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="Description de la catégorie..."
                    ></textarea>
                  </div>

                  <!-- Couleur -->
                  <div>
                    <label
                      for="color"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Couleur
                    </label>
                    <div class="mt-2 flex items-center space-x-4">
                      <input
                        id="color"
                        v-model="formData.color"
                        type="color"
                        class="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                      />
                      <div class="flex flex-wrap gap-2">
                        <button
                          v-for="color in predefinedColors"
                          :key="color"
                          type="button"
                          @click="formData.color = color"
                          class="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                          :style="{ backgroundColor: color }"
                          :class="{
                            'ring-2 ring-blue-500': formData.color === color,
                          }"
                        ></button>
                      </div>
                    </div>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Cette couleur sera utilisée pour identifier visuellement
                      les services de cette catégorie
                    </p>
                  </div>

                  <!-- Aperçu -->
                  <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h4
                      class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Aperçu :
                    </h4>
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        :style="{ backgroundColor: formData.color }"
                      >
                        {{ getInitials(formData.name) }}
                      </div>
                      <div>
                        <p
                          class="text-sm font-medium text-gray-900 dark:text-white"
                        >
                          {{ formData.name || 'Nom de la catégorie' }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{
                            formData.description ||
                            'Description de la catégorie'
                          }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
          >
            <button
              type="submit"
              :disabled="loading || !formData.name"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="loading"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Créer la catégorie
            </button>
            <button
              type="button"
              @click="closeModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const emit = defineEmits(['close', 'save'])

const loading = ref(false)

// Couleurs prédéfinies
const predefinedColors = [
  '#FF6B6B', // Rouge
  '#4ECDC4', // Turquoise
  '#45B7D1', // Bleu
  '#96CEB4', // Vert
  '#FFEAA7', // Jaune
  '#DDA0DD', // Violet
  '#98D8C8', // Vert menthe
  '#F7DC6F', // Jaune doré
  '#BB8FCE', // Lavande
  '#85C1E9', // Bleu ciel
  '#F8C471', // Orange
  '#82E0AA', // Vert clair
]

// Données du formulaire
const formData = reactive({
  name: '',
  description: '',
  color: '#004AAD',
})

// Gestion de la soumission
const handleSubmit = async () => {
  loading.value = true

  try {
    // Validation basique
    if (!formData.name.trim()) {
      throw new Error('Le nom de la catégorie est obligatoire')
    }

    // Préparer les données à envoyer
    const categoryData = { ...formData }

    // Nettoyer les champs vides
    if (categoryData.description === '') {
      categoryData.description = null
    }

    emit('save', categoryData)
  } catch (error) {
    console.error('Erreur lors de la validation:', error)
    // L'erreur sera gérée par le composant parent
  } finally {
    loading.value = false
  }
}

// Fermer le modal
const closeModal = () => {
  emit('close')
}

// Utilitaires
const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
</script>
