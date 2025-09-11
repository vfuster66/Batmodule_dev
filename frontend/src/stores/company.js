import { defineStore } from 'pinia'
import api from '@/utils/api'

export const useCompanyStore = defineStore('company', {
  state: () => ({
    settings: {
      // Informations de base
      company_name: '',
      legal_name: '',
      siret: '',
      vat_number: '',
      rcs_number: '',
      ape_code: '',

      // Adresse
      address_line1: '',
      address_line2: '',
      postal_code: '',
      city: '',
      country: 'France',

      // Contact
      phone: '',
      email: '',
      website: '',

      // Logo et branding
      logo_url: '',
      logo_base64: '',
      signature_email_base64: '',
      primary_color: '#004AAD',
      secondary_color: '#6B7280',

      // Paramètres financiers
      default_vat_rate: 20.0,
      currency: 'EUR',
      payment_terms: 30,

      // Paramètres de numérotation
      quote_prefix: 'DEV',
      invoice_prefix: 'FAC',
      quote_counter: 0,
      invoice_counter: 0,

      // Paramètres légaux (conformité française)
      legal_notice: '',
      terms_conditions: '',
      privacy_policy: '',
      cgv: '',
      mentions_legales: '',
      politique_confidentialite: '',
      rgpd_compliance: false,
      capital_social: null,
      forme_juridique: '',
      dirigeant_nom: '',
      dirigeant_qualite: '',
      assurance_rc: '',
      numero_rcs: '',
      tribunal_commercial: '',
      code_ape: '',
      tva_intracommunautaire: '',

      // Paramètres d'affichage
      show_vat: true,
      show_logo_on_documents: true,
      document_footer: '',

      // Coordonnées bancaires
      bank_name: '',
      iban: '',
      bic: '',
      bank_address: '',
      payment_instructions: '',

      // Assurance
      insurance_company: '',
      insurance_policy_number: '',
      insurance_coverage: '',
    },
    loading: false,
    error: null,
  }),

  getters: {
    // Adresse complète formatée
    fullAddress: (state) => {
      const parts = [
        state.settings.address_line1,
        state.settings.address_line2,
        state.settings.postal_code,
        state.settings.city,
        state.settings.country,
      ].filter(Boolean)
      return parts.join(', ')
    },

    // Nom complet de l'entreprise (nom légal ou nom commercial)
    displayName: (state) => {
      return state.settings.legal_name || state.settings.company_name
    },

    // Informations légales formatées
    legalInfo: (state) => {
      const info = []
      if (state.settings.siret) info.push(`SIRET: ${state.settings.siret}`)
      if (state.settings.vat_number)
        info.push(`TVA: ${state.settings.vat_number}`)
      if (state.settings.rcs_number)
        info.push(`RCS: ${state.settings.rcs_number}`)
      if (state.settings.ape_code) info.push(`APE: ${state.settings.ape_code}`)
      return info.join(' - ')
    },

    // Logo à afficher (URL ou base64)
    displayLogo: (state) => {
      return state.settings.logo_url || state.settings.logo_base64
    },
  },

  actions: {
    // Charger les paramètres de l'entreprise
    async fetchSettings() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/company-settings')
        // Fusionner intelligemment les paramètres (ne pas écraser avec null)
        const serverSettings = response.data.data || response.data.settings
        this.settings = { ...this.settings }

        // Mettre à jour seulement les champs non-null du serveur
        if (serverSettings) {
          Object.keys(serverSettings).forEach((key) => {
            if (
              serverSettings[key] !== null &&
              serverSettings[key] !== undefined
            ) {
              this.settings[key] = serverSettings[key]
            }
          })
        }
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          'Erreur lors du chargement des paramètres'
        console.error('Erreur lors du chargement des paramètres:', error)
      } finally {
        this.loading = false
      }
    },

    // Sauvegarder les paramètres de l'entreprise
    async saveSettings(settingsData) {
      this.loading = true
      this.error = null

      try {
        const response = await api.put('/company-settings', settingsData)
        // Fusionner intelligemment les paramètres (ne pas écraser avec null)
        const serverSettings = response.data.data || response.data.settings
        this.settings = { ...this.settings }

        // Mettre à jour seulement les champs non-null du serveur
        if (serverSettings) {
          Object.keys(serverSettings).forEach((key) => {
            if (
              serverSettings[key] !== null &&
              serverSettings[key] !== undefined
            ) {
              this.settings[key] = serverSettings[key]
            }
          })
        }
        return response.data
      } catch (error) {
        this.error =
          error.response?.data?.message || 'Erreur lors de la sauvegarde'
        console.error('Erreur lors de la sauvegarde des paramètres:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Mettre à jour un paramètre spécifique
    async updateSetting(key, value) {
      const updateData = { [key]: value }
      return await this.saveSettings(updateData)
    },

    // Convertir un fichier en base64 pour le logo avec compression
    async convertFileToBase64(file) {
      return new Promise((resolve, reject) => {
        // Créer une image pour redimensionner
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        img.onload = () => {
          // Redimensionner l'image pour optimiser la taille
          const maxSize = 200 // Taille maximale en pixels
          let { width, height } = img

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          // Dessiner l'image redimensionnée
          ctx.drawImage(img, 0, 0, width, height)

          // Convertir en base64 en conservant la transparence si possible
          // Utiliser PNG pour préserver l'alpha (évite les fonds noirs sur PNG/SVG)
          // Garder JPEG uniquement si l'original est un JPEG
          const mimeType =
            file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
          const base64 =
            mimeType === 'image/jpeg'
              ? canvas.toDataURL('image/jpeg', 0.8) // compression 80%
              : canvas.toDataURL('image/png') // préserve la transparence
          resolve(base64)
        }

        img.onerror = reject

        // Charger l'image
        const reader = new FileReader()
        reader.onload = (e) => {
          img.src = e.target.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },

    // Uploader un logo
    async uploadLogo(file) {
      try {
        console.log(
          '🖼️ Upload du logo:',
          file.name,
          'Taille:',
          file.size,
          'bytes'
        )

        // Vérifier la taille du fichier (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Le fichier est trop volumineux (max 5MB)')
        }

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          throw new Error('Veuillez sélectionner un fichier image')
        }

        const base64 = await this.convertFileToBase64(file)
        console.log(
          '✅ Logo converti en base64, taille:',
          base64.length,
          'caractères'
        )

        await this.updateSetting('logo_base64', base64)
        console.log('✅ Logo sauvegardé avec succès')

        return base64
      } catch (error) {
        console.error("❌ Erreur lors de l'upload du logo:", error)
        throw error
      }
    },

    // Uploader un logo de signature email
    async uploadSignatureEmail(file) {
      try {
        console.log(
          '📧 Upload du logo de signature email:',
          file.name,
          'Taille:',
          file.size,
          'bytes'
        )

        // Vérifier la taille du fichier (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Le fichier est trop volumineux (max 5MB)')
        }

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          throw new Error('Veuillez sélectionner un fichier image')
        }

        const base64 = await this.convertFileToBase64(file)
        console.log(
          '✅ Logo de signature email converti en base64, taille:',
          base64.length,
          'caractères'
        )

        await this.updateSetting('signature_email_base64', base64)
        console.log('✅ Logo de signature email sauvegardé avec succès')

        return base64
      } catch (error) {
        console.error(
          "❌ Erreur lors de l'upload du logo de signature email:",
          error
        )
        throw error
      }
    },

    // Réinitialiser les paramètres
    resetSettings() {
      this.settings = {
        company_name: '',
        legal_name: '',
        siret: '',
        vat_number: '',
        rcs_number: '',
        ape_code: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        city: '',
        country: 'France',
        phone: '',
        email: '',
        website: '',
        logo_url: '',
        logo_base64: '',
        signature_email_base64: '',
        primary_color: '#004AAD',
        secondary_color: '#6B7280',
        default_vat_rate: 20.0,
        currency: 'EUR',
        payment_terms: 30,
        quote_prefix: 'DEV',
        invoice_prefix: 'FAC',
        quote_counter: 0,
        invoice_counter: 0,
        legal_notice: '',
        terms_conditions: '',
        privacy_policy: '',
        cgv: '',
        mentions_legales: '',
        politique_confidentialite: '',
        rgpd_compliance: false,
        capital_social: null,
        forme_juridique: '',
        dirigeant_nom: '',
        dirigeant_qualite: '',
        assurance_rc: '',
        numero_rcs: '',
        tribunal_commercial: '',
        code_ape: '',
        tva_intracommunautaire: '',
        show_vat: true,
        show_logo_on_documents: true,
        document_footer: '',
        bank_name: '',
        iban: '',
        bic: '',
        bank_address: '',
        payment_instructions: '',
        insurance_company: '',
        insurance_policy_number: '',
        insurance_coverage: '',
      }
    },
  },
})
