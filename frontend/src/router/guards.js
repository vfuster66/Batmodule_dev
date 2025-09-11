// Pages qui nécessitent une configuration complète
const pagesRequiringSetup = [
  '/dashboard',
  '/clients',
  '/quotes',
  '/invoices',
  '/services',
]

// Pages publiques qui n'ont pas besoin de configuration
const publicPages = [
  '/login',
  '/register',
  '/public/legal',
  '/public/privacy',
  '/public/cgv',
  '/mentions-legales',
  '/cgv',
  '/politique-confidentialite',
]

export function setupNavigationGuards(router) {
  router.beforeEach(async (to, from, next) => {
    // Si c'est une page publique, laisser passer
    if (publicPages.some((page) => to.path.startsWith(page))) {
      return next()
    }

    // Si c'est la page de configuration, laisser passer
    if (to.path === '/company-settings' || to.path === '/settings') {
      return next()
    }

    // Si c'est une page qui nécessite une configuration, vérifier
    if (pagesRequiringSetup.some((page) => to.path.startsWith(page))) {
      try {
        // Import dynamique pour éviter les boucles
        const { useCompanySettingsStore } = await import(
          '@/stores/companySettings'
        )
        const companyStore = useCompanySettingsStore()

        // Vérifier si les paramètres sont déjà chargés
        if (Object.keys(companyStore.settings).length === 0) {
          // Si pas de paramètres chargés, rediriger directement
          console.log(
            "Aucun paramètre d'entreprise chargé, redirection vers company-settings"
          )
          return next('/company-settings')
        }

        // Champs obligatoires pour la configuration de base
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

        // Vérifier si la configuration est complète
        const isSetupComplete = requiredFields.every((field) => {
          const value = companyStore.settings[field]
          return value && value.toString().trim() !== ''
        })

        if (!isSetupComplete) {
          console.log(
            'Configuration incomplète, redirection vers company-settings'
          )
          return next('/company-settings')
        }

        next()
      } catch (error) {
        console.error(
          'Erreur lors de la vérification de la configuration:',
          error
        )
        next('/company-settings')
      }
    } else {
      next()
    }
  })
}
