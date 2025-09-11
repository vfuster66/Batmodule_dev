import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useCompanySettingsStore = defineStore('companySettings', () => {
  // État
  const settings = ref({})
  const loading = ref(false)
  const error = ref(null)
  const validation = ref({})
  const lastFetchedAt = ref(0)
  const MIN_FETCH_INTERVAL_MS = 15000 // 15s anti-spam réseau

  // Getters
  const isConfigured = computed(() => {
    const requiredFields = [
      'company_name',
      'siret',
      'forme_juridique',
      'address_line1',
      'postal_code',
      'city',
      'phone',
      'email',
    ]
    return requiredFields.every((field) => settings.value[field])
  })

  const complianceScore = computed(() => {
    if (!validation.value.score) return 0
    return validation.value.score
  })

  const isCompliant = computed(() => {
    return complianceScore.value >= 100
  })

  const missingFields = computed(() => {
    if (complianceScore.value >= 100) return []
    return validation.value.missingFields || []
  })

  const recommendations = computed(() => {
    return validation.value.recommendations || []
  })

  // Actions
  const fetchSettings = async () => {
    // Anti-boucle: si déjà en cours, ne rien faire
    if (loading.value) return

    // Anti-spam: si on a déjà des données récentes, ne pas recharger
    const now = Date.now()
    const hasData = settings.value && Object.keys(settings.value).length > 0
    if (hasData && now - lastFetchedAt.value < MIN_FETCH_INTERVAL_MS) return

    loading.value = true
    error.value = null

    try {
      const response = await api.get('/company-settings')
      settings.value = response.data.data
      lastFetchedAt.value = Date.now()
    } catch (err) {
      // En cas d'erreur 500/422/etc., ne relance pas immédiatement
      error.value =
        err.response?.data?.error ||
        'Erreur lors de la récupération des paramètres'
      console.error('Erreur fetchSettings:', err)
      // Marque une tentative pour éviter les boucles de retry croisées
      lastFetchedAt.value = Date.now()
    } finally {
      loading.value = false
    }
  }

  const updateSettings = async (updateData) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.put('/company-settings', updateData)
      settings.value = response.data.data
      return response.data
    } catch (err) {
      error.value =
        err.response?.data?.error ||
        'Erreur lors de la mise à jour des paramètres'
      console.error('Erreur updateSettings:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mettre à jour un seul champ de manière pratique
  const updateSetting = async (key, value) => {
    return updateSettings({ [key]: value })
  }

  // Convertir un fichier image en base64 (PNG/JPEG)
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Uploader un logo et le sauvegarder côté API
  const uploadLogo = async (file) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux (max 5MB)')
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('Veuillez sélectionner un fichier image')
      }

      const base64 = await convertFileToBase64(file)
      await updateSetting('logo_base64', base64)
      return base64
    } catch (err) {
      console.error('Erreur uploadLogo:', err)
      throw err
    }
  }

  const validateSettings = async () => {
    try {
      const response = await api.get('/company-settings/validate')
      validation.value = response.data.data
      return response.data.data
    } catch (err) {
      console.error('Erreur validateSettings:', err)
      throw err
    }
  }

  const getComplianceReport = async () => {
    try {
      const response = await api.get('/company-settings/compliance-report')
      return response.data.data
    } catch (err) {
      console.error('Erreur getComplianceReport:', err)
      throw err
    }
  }

  const resetSettings = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await api.post('/company-settings/reset', {
        confirm: true,
      })
      settings.value = response.data.data
      return response.data
    } catch (err) {
      error.value =
        err.response?.data?.error || 'Erreur lors de la réinitialisation'
      console.error('Erreur resetSettings:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getLegalTemplates = async () => {
    try {
      const response = await api.get('/company-settings/legal-templates')
      return response.data.data
    } catch (err) {
      console.error('Erreur getLegalTemplates:', err)
      throw err
    }
  }

  // Validation locale
  const validateSIRET = (siret) => {
    if (!siret || siret.length !== 14) return false
    if (!/^\d{14}$/.test(siret)) return false

    // Algorithme de Luhn pour SIRET français (positions impaires)
    let sum = 0
    for (let i = 0; i < 13; i++) {
      let digit = parseInt(siret[i])
      if (i % 2 === 0) {
        // Positions impaires (1, 3, 5, 7, 9, 11, 13) en 0-indexed
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
    }

    return (10 - (sum % 10)) % 10 === parseInt(siret[13])
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const validateIBAN = (iban) => {
    if (!iban || iban.length < 15) return false
    // Validation IBAN plus flexible - accepte les lettres et chiffres
    const ibanRegex = /^FR\d{2}[A-Z0-9\s]{20,30}$/
    return ibanRegex.test(iban)
  }

  // Formatters
  const formatSIRET = (siret) => {
    if (!siret) return ''
    return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')
  }

  const formatPhone = (phone) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return cleaned.replace(
        /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
        '$1 $2 $3 $4 $5'
      )
    }
    return phone
  }

  const formatIBAN = (iban) => {
    if (!iban) return ''
    const cleaned = iban.replace(/\s/g, '')
    return cleaned.replace(/(.{4})/g, '$1 ').trim()
  }

  return {
    // État
    settings,
    loading,
    error,
    validation,

    // Getters
    isConfigured,
    complianceScore,
    isCompliant,
    missingFields,
    recommendations,

    // Actions
    fetchSettings,
    updateSettings,
    updateSetting,
    validateSettings,
    getComplianceReport,
    resetSettings,
    getLegalTemplates,
    uploadLogo,
    convertFileToBase64,

    // Validation
    validateSIRET,
    validateEmail,
    validatePhone,
    validateIBAN,

    // Formatters
    formatSIRET,
    formatPhone,
    formatIBAN,
  }
})
