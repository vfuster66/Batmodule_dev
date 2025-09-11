<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3
        class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4"
      >
        Mentions légales
      </h3>

      <div class="prose prose-sm max-w-none dark:prose-invert">
        <div v-if="companySettings" class="space-y-4">
          <!-- En-tête de l'entreprise -->
          <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white">
              {{ companySettings.displayName || companySettings.company_name }}
            </h4>
            <p
              v-if="
                companySettings.legal_name &&
                companySettings.legal_name !== companySettings.company_name
              "
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              Nom commercial : {{ companySettings.company_name }}
            </p>
          </div>

          <!-- Informations légales -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-if="companySettings.forme_juridique">
              <strong>Forme juridique :</strong>
              {{ companySettings.forme_juridique }}
            </div>

            <div v-if="companySettings.capital_social">
              <strong>Capital social :</strong>
              {{ formatCurrency(companySettings.capital_social) }}
            </div>

            <div v-if="companySettings.siret">
              <strong>SIRET :</strong> {{ companySettings.siret }}
            </div>

            <div v-if="companySettings.vat_number">
              <strong>N° TVA :</strong> {{ companySettings.vat_number }}
            </div>

            <div v-if="companySettings.rcs_number">
              <strong>RCS :</strong> {{ companySettings.rcs_number }}
            </div>

            <div v-if="companySettings.ape_code">
              <strong>Code APE :</strong> {{ companySettings.ape_code }}
            </div>
          </div>

          <!-- Adresse -->
          <div v-if="companySettings.fullAddress">
            <strong>Adresse :</strong><br />
            <div class="ml-4">
              {{ companySettings.address_line1 }}<br />
              <span v-if="companySettings.address_line2"
                >{{ companySettings.address_line2 }}<br
              /></span>
              {{ companySettings.postal_code }} {{ companySettings.city }}<br />
              {{ companySettings.country }}
            </div>
          </div>

          <!-- Contact -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-if="companySettings.phone">
              <strong>Téléphone :</strong> {{ companySettings.phone }}
            </div>

            <div v-if="companySettings.email">
              <strong>Email :</strong> {{ companySettings.email }}
            </div>

            <div v-if="companySettings.website">
              <strong>Site web :</strong>
              <a
                :href="companySettings.website"
                target="_blank"
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {{ companySettings.website }}
              </a>
            </div>
          </div>

          <!-- Dirigeant -->
          <div v-if="companySettings.dirigeant_nom">
            <strong>Dirigeant :</strong> {{ companySettings.dirigeant_nom }}
            <span v-if="companySettings.dirigeant_qualite">
              ({{ companySettings.dirigeant_qualite }})</span
            >
          </div>

          <!-- Tribunal et assurance -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-if="companySettings.tribunal_commercial">
              <strong>Tribunal de commerce :</strong>
              {{ companySettings.tribunal_commercial }}
            </div>

            <div v-if="companySettings.assurance_rc">
              <strong>Assurance RC :</strong> {{ companySettings.assurance_rc }}
            </div>
          </div>

          <!-- Hébergement -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h5 class="font-semibold text-gray-900 dark:text-white mb-2">
              Hébergement
            </h5>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Ce site est hébergé par BatModule, plateforme de gestion pour
              artisans du bâtiment.
            </p>
          </div>

          <!-- RGPD -->
          <div
            v-if="companySettings.rgpd_compliance"
            class="border-t border-gray-200 dark:border-gray-700 pt-4"
          >
            <h5 class="font-semibold text-gray-900 dark:text-white mb-2">
              Protection des données
            </h5>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Cette entreprise s'engage à respecter le Règlement Général sur la
              Protection des Données (RGPD).
            </p>
            <div v-if="companySettings.politique_confidentialite" class="mt-2">
              <a
                href="#"
                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                Politique de confidentialité
              </a>
            </div>
          </div>

          <!-- Textes personnalisés -->
          <div
            v-if="companySettings.mentions_legales"
            class="border-t border-gray-200 dark:border-gray-700 pt-4"
          >
            <h5 class="font-semibold text-gray-900 dark:text-white mb-2">
              Mentions complémentaires
            </h5>
            <div
              class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line"
              v-html="companySettings.mentions_legales"
            ></div>
          </div>
        </div>

        <!-- Message si pas de paramètres -->
        <div v-else class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">
            Aucune information légale configurée.
          </p>
          <router-link
            to="/settings"
            class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Configurer les paramètres
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useCompanyStore } from '@/stores/company'

const companyStore = useCompanyStore()

// Charger les paramètres de l'entreprise seulement si pas déjà chargés
onMounted(() => {
  if (
    Object.keys(companyStore.settings).length === 0 ||
    !companyStore.settings.company_name
  ) {
    companyStore.fetchSettings()
  }
})

const companySettings = computed(() => companyStore.settings)

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
</script>
