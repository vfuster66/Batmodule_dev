<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- En-tête avec score de conformité -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900">
          Paramètres de l'entreprise
        </h1>
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <div class="text-sm text-gray-500">Score de conformité</div>
            <div class="text-2xl font-bold" :class="complianceScoreClass">
              {{ complianceScore }}%
            </div>
          </div>
          <div class="w-16 h-16">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                class="text-gray-200"
                stroke="currentColor"
                stroke-width="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                :class="complianceScoreColor"
                stroke="currentColor"
                stroke-width="3"
                fill="none"
                :stroke-dasharray="`${complianceScore}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Alertes de conformité -->
      <div
        v-if="!isCompliant"
        class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
      >
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
              Configuration incomplète
            </h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p>
                Certains champs obligatoires sont manquants pour la conformité
                légale :
              </p>
              <ul class="mt-1 list-disc list-inside">
                <li v-for="field in missingFields" :key="field">
                  {{ getFieldLabel(field) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulaire -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Informations de base -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          Informations de base
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise *
            </label>
            <input
              v-model="form.company_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              SIRET *
            </label>
            <input
              v-model="form.siret"
              type="text"
              required
              maxlength="14"
              pattern="[0-9]{14}"
              @input="formatSIRETInput"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{
                'border-red-500': form.siret && !validateSIRET(form.siret),
              }"
            />
            <p
              v-if="form.siret && !validateSIRET(form.siret)"
              class="mt-1 text-sm text-red-600"
            >
              SIRET invalide
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Forme juridique *
            </label>
            <select
              v-model="form.forme_juridique"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              <option value="SARL">SARL</option>
              <option value="SAS">SAS</option>
              <option value="EURL">EURL</option>
              <option value="SASU">SASU</option>
              <option value="SA">SA</option>
              <option value="SNC">SNC</option>
              <option value="SCI">SCI</option>
              <option value="Auto-entrepreneur">Auto-entrepreneur</option>
              <option value="Micro-entreprise">Micro-entreprise</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Code APE
            </label>
            <input
              v-model="form.ape_code"
              type="text"
              placeholder="ex: 4331Z"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Logo et branding -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Logo et branding</h2>
        <div class="space-y-6">
          <!-- Upload du logo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Logo de l'entreprise
            </label>
            <div class="flex items-center space-x-4">
              <!-- Aperçu du logo actuel -->
              <div v-if="form.logo_base64" class="flex-shrink-0">
                <img
                  :src="form.logo_base64"
                  alt="Logo actuel"
                  class="h-16 w-16 object-contain border border-gray-300 rounded"
                />
              </div>
              <div
                v-else
                class="flex-shrink-0 h-16 w-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center"
              >
                <svg
                  class="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <!-- Bouton d'upload -->
              <div class="flex-1">
                <input
                  ref="logoInput"
                  type="file"
                  accept="image/*"
                  @change="handleLogoUpload"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="$refs.logoInput.click()"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  {{ form.logo_base64 ? 'Changer le logo' : 'Ajouter un logo' }}
                </button>
                <p class="mt-1 text-sm text-gray-500">
                  Formats acceptés : JPG, PNG, SVG (max 5MB)
                </p>
              </div>
            </div>
          </div>

          <!-- Couleurs de l'entreprise -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                for="primary_color"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Couleur principale
              </label>
              <div class="flex items-center space-x-3">
                <input
                  id="primary_color"
                  v-model="form.primary_color"
                  type="color"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  v-model="form.primary_color"
                  type="text"
                  class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="#004AAD"
                />
              </div>
            </div>
            <div>
              <label
                for="secondary_color"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Couleur secondaire
              </label>
              <div class="flex items-center space-x-3">
                <input
                  id="secondary_color"
                  v-model="form.secondary_color"
                  type="color"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  v-model="form.secondary_color"
                  type="text"
                  class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="#6B7280"
                />
              </div>
            </div>
          </div>

          <!-- Options d'affichage -->
          <div>
            <label class="flex items-center">
              <input
                v-model="form.show_logo_on_documents"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span class="ml-2 text-sm text-gray-700">
                Afficher le logo sur les documents (devis, factures)
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Adresse -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Adresse</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Adresse ligne 1 *
            </label>
            <input
              v-model="form.address_line1"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Adresse ligne 2
            </label>
            <input
              v-model="form.address_line2"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Code postal *
            </label>
            <input
              v-model="form.postal_code"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ville *
            </label>
            <input
              v-model="form.city"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pays
            </label>
            <select
              v-model="form.country"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="France">France</option>
              <option value="Belgique">Belgique</option>
              <option value="Suisse">Suisse</option>
              <option value="Luxembourg">Luxembourg</option>
              <option value="Monaco">Monaco</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Contact</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Téléphone *
            </label>
            <input
              v-model="form.phone"
              type="tel"
              required
              @input="formatPhoneInput"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{
                'border-red-500': form.email && !validateEmail(form.email),
              }"
            />
            <p
              v-if="form.email && !validateEmail(form.email)"
              class="mt-1 text-sm text-red-600"
            >
              Email invalide
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Site web
            </label>
            <div class="flex">
              <span
                class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"
              >
                https://
              </span>
              <input
                v-model="websiteDomain"
                type="text"
                placeholder="www.example.com"
                @blur="formatWebsite"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p class="mt-1 text-sm text-gray-500">
              Entrez juste le nom de domaine (ex: www.fuster-peinture.fr)
            </p>
          </div>
        </div>
      </div>

      <!-- Informations légales -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          Informations légales
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Numéro RCS
            </label>
            <input
              v-model="form.rcs_number"
              type="text"
              placeholder="RCS Paris B 123 456 789"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tribunal de commerce
            </label>
            <input
              v-model="form.tribunal_commercial"
              type="text"
              placeholder="Tribunal de Commerce de Paris"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              TVA intracommunautaire
            </label>
            <input
              v-model="form.tva_intracommunautaire"
              type="text"
              placeholder="FR12345678901"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Assurance -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          Assurance (obligatoire pour BTP)
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Compagnie d'assurance
            </label>
            <input
              v-model="form.insurance_company"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Numéro de police
            </label>
            <input
              v-model="form.insurance_policy_number"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Montant de couverture (€)
            </label>
            <input
              v-model.number="form.insurance_coverage"
              type="number"
              min="0"
              step="1000"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Informations bancaires -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          Informations bancaires
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              IBAN
            </label>
            <input
              v-model="form.iban"
              type="text"
              @input="formatIBANInput"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="{
                'border-red-500': form.iban && !validateIBAN(form.iban),
              }"
            />
            <p
              v-if="form.iban && !validateIBAN(form.iban)"
              class="mt-1 text-sm text-red-600"
            >
              Format IBAN invalide
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              BIC
            </label>
            <input
              v-model="form.bic"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nom de la banque
            </label>
            <input
              v-model="form.bank_name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Configuration des paiements -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          Configuration des paiements
        </h2>
        <div class="space-y-6">
          <div class="flex items-center">
            <input
              v-model="form.cash_payments_enabled"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900">
              Activer les paiements en espèces
            </label>
          </div>

          <div v-if="form.cash_payments_enabled" class="ml-6 space-y-4">
            <div class="flex items-center">
              <input
                v-model="form.nf525_compliant"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label class="ml-2 block text-sm text-gray-900">
                Conforme NF525 (anti-fraude)
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Plafond espèces (€)
              </label>
              <input
                v-model.number="form.cash_payment_limit"
                type="number"
                min="0"
                step="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="flex items-center">
            <input
              v-model="form.is_b2c"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900">
              Vente aux particuliers (B2C)
            </label>
          </div>

          <div v-if="form.is_b2c" class="ml-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nom du médiateur de la consommation
              </label>
              <input
                v-model="form.mediator_name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Site web du médiateur
              </label>
              <div class="flex">
                <span
                  class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"
                >
                  https://
                </span>
                <input
                  v-model="mediatorWebsiteDomain"
                  type="text"
                  placeholder="www.mediateur.fr"
                  @blur="formatMediatorWebsite"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center">
            <input
              v-model="form.vat_on_payments"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900">
              TVA sur les encaissements
            </label>
          </div>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div class="flex justify-between">
        <button
          type="button"
          @click="validateForm"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Valider la conformité
        </button>

        <div class="space-x-4">
          <button
            type="button"
            @click="resetForm"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Annuler
          </button>

          <button
            type="submit"
            :disabled="loading"
            class="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ loading ? 'Sauvegarde...' : 'Sauvegarder' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCompanySettingsStore } from '../stores/companySettings'
import { useToast } from 'vue-toastification'

const store = useCompanySettingsStore()
const toast = useToast()

// État local
const form = ref({})
const loading = ref(false)

// Variables pour les domaines de sites web
const websiteDomain = ref('')
const mediatorWebsiteDomain = ref('')

// Watchers pour synchroniser les domaines avec le formulaire
watch(websiteDomain, (newValue) => {
  if (newValue) {
    // Supprimer le protocole s'il est déjà présent
    let domain = newValue.replace(/^https?:\/\//, '')
    // Supprimer le slash final s'il existe
    domain = domain.replace(/\/$/, '')
    // Ajouter le protocole https://
    form.value.website = `https://${domain}`
  } else {
    form.value.website = ''
  }
})

watch(mediatorWebsiteDomain, (newValue) => {
  if (newValue) {
    // Supprimer le protocole s'il est déjà présent
    let domain = newValue.replace(/^https?:\/\//, '')
    // Supprimer le slash final s'il existe
    domain = domain.replace(/\/$/, '')
    // Ajouter le protocole https://
    form.value.mediator_website = `https://${domain}`
  } else {
    form.value.mediator_website = ''
  }
})

// Watchers pour synchroniser le formulaire avec les domaines
watch(
  () => form.value.website,
  (newValue) => {
    if (newValue) {
      websiteDomain.value = newValue.replace(/^https?:\/\//, '')
    } else {
      websiteDomain.value = ''
    }
  }
)

watch(
  () => form.value.mediator_website,
  (newValue) => {
    if (newValue) {
      mediatorWebsiteDomain.value = newValue.replace(/^https?:\/\//, '')
    } else {
      mediatorWebsiteDomain.value = ''
    }
  }
)

// Getters
const complianceScore = computed(() => store.complianceScore)
const isCompliant = computed(() => store.isCompliant)
const missingFields = computed(() => store.missingFields)
const recommendations = computed(() => store.recommendations)

// Classes CSS pour le score
const complianceScoreClass = computed(() => {
  if (complianceScore.value >= 80) return 'text-green-600'
  if (complianceScore.value >= 60) return 'text-yellow-600'
  return 'text-red-600'
})

const complianceScoreColor = computed(() => {
  if (complianceScore.value >= 80) return 'text-green-500'
  if (complianceScore.value >= 60) return 'text-yellow-500'
  return 'text-red-500'
})

// Méthodes
const loadSettings = async () => {
  try {
    await store.fetchSettings()
    form.value = { ...store.settings }

    // Forcer la synchronisation des domaines après le chargement
    if (form.value.website) {
      websiteDomain.value = form.value.website.replace(/^https?:\/\//, '')
    }
    if (form.value.mediator_website) {
      mediatorWebsiteDomain.value = form.value.mediator_website.replace(
        /^https?:\/\//,
        ''
      )
    }

    // Calculer le score de conformité
    await store.validateSettings()
  } catch (error) {
    toast.error('Erreur lors du chargement des paramètres')
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    // Nettoyer les données en supprimant les champs non modifiables
    const cleanData = { ...form.value }
    delete cleanData.id
    delete cleanData.user_id
    delete cleanData.created_at
    delete cleanData.updated_at

    await store.updateSettings(cleanData)

    // Recalculer le score de conformité après la sauvegarde
    await store.validateSettings()

    toast.success('Paramètres sauvegardés avec succès')
    // Recharger les données pour mettre à jour l'affichage
    await loadSettings()
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    loading.value = false
  }
}

const validateForm = async () => {
  try {
    await store.validateSettings()
    if (store.isCompliant) {
      toast.success('Configuration conforme !')
    } else {
      toast.warning('Configuration incomplète')
    }
  } catch (error) {
    toast.error('Erreur lors de la validation')
  }
}

const resetForm = () => {
  form.value = { ...store.settings }
}

const handleLogoUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    // Vérifier la taille du fichier (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 5MB)')
      return
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image')
      return
    }

    // Uploader le logo via le store
    const base64 = await store.uploadLogo(file)
    form.value.logo_base64 = base64
    toast.success('Logo uploadé avec succès')
  } catch (error) {
    console.error("Erreur lors de l'upload du logo:", error)
    toast.error("Erreur lors de l'upload du logo")
  }
}

// Fonctions de formatage des sites web
const formatWebsite = () => {
  if (websiteDomain.value) {
    // Supprimer le protocole s'il est déjà présent
    let domain = websiteDomain.value.replace(/^https?:\/\//, '')
    // Supprimer le slash final s'il existe
    domain = domain.replace(/\/$/, '')
    // Ajouter le protocole https://
    form.value.website = `https://${domain}`
  } else {
    form.value.website = ''
  }
}

const formatMediatorWebsite = () => {
  if (mediatorWebsiteDomain.value) {
    // Supprimer le protocole s'il est déjà présent
    let domain = mediatorWebsiteDomain.value.replace(/^https?:\/\//, '')
    // Supprimer le slash final s'il existe
    domain = domain.replace(/\/$/, '')
    // Ajouter le protocole https://
    form.value.mediator_website = `https://${domain}`
  } else {
    form.value.mediator_website = ''
  }
}

// Validation locale
const validateSIRET = (siret) => store.validateSIRET(siret)
const validateEmail = (email) => store.validateEmail(email)
const validatePhone = (phone) => store.validatePhone(phone)
const validateIBAN = (iban) => store.validateIBAN(iban)

// Formatters
const formatSIRETInput = (event) => {
  const value = event.target.value.replace(/\D/g, '')
  if (value.length <= 14) {
    form.value.siret = value
  }
}

const formatPhoneInput = (event) => {
  const value = event.target.value.replace(/\D/g, '')
  if (value.length <= 10) {
    form.value.phone = store.formatPhone(value)
  }
}

const formatIBANInput = (event) => {
  const value = event.target.value.replace(/\s/g, '')
  form.value.iban = store.formatIBAN(value)
}

const getFieldLabel = (field) => {
  const labels = {
    company_name: "Nom de l'entreprise",
    siret: 'SIRET',
    forme_juridique: 'Forme juridique',
    address_line1: 'Adresse',
    postal_code: 'Code postal',
    city: 'Ville',
    phone: 'Téléphone',
    email: 'Email',
  }
  return labels[field] || field
}

// Lifecycle
onMounted(() => {
  // Ne pas charger les paramètres ici car ils sont déjà chargés par CompanySettingsView
  if (Object.keys(store.settings).length === 0) {
    loadSettings()
  } else {
    form.value = { ...store.settings }
    // Synchroniser les domaines même si les paramètres sont déjà chargés
    if (form.value.website) {
      websiteDomain.value = form.value.website.replace(/^https?:\/\//, '')
    }
    if (form.value.mediator_website) {
      mediatorWebsiteDomain.value = form.value.mediator_website.replace(
        /^https?:\/\//,
        ''
      )
    }
  }
})

// Watchers
watch(
  () => store.settings,
  (newSettings) => {
    if (newSettings && Object.keys(newSettings).length > 0) {
      form.value = { ...newSettings }
      // Synchroniser les domaines quand les paramètres changent
      if (form.value.website) {
        websiteDomain.value = form.value.website.replace(/^https?:\/\//, '')
      }
      if (form.value.mediator_website) {
        mediatorWebsiteDomain.value = form.value.mediator_website.replace(
          /^https?:\/\//,
          ''
        )
      }
    }
  },
  { deep: true }
)
</script>
