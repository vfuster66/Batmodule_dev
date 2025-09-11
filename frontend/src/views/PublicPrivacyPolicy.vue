<template>
  <div class="min-h-screen bg-gray-50">
    <!-- En-tête -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Politique de Confidentialité
            </h1>
            <p class="text-gray-600">
              Protection des données personnelles - RGPD
            </p>
          </div>
          <div class="text-sm text-gray-500">
            Dernière mise à jour : {{ new Date().toLocaleDateString('fr-FR') }}
          </div>
        </div>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="max-w-4xl mx-auto px-6 py-8">
      <!-- Contenu de la politique de confidentialité -->
      <div class="space-y-8">
        <!-- Introduction -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            1. Introduction
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>Fuster Peinture</strong> s'engage à protéger la vie privée
              et les données personnelles de ses clients et utilisateurs.
            </p>
            <p>
              Cette politique de confidentialité explique comment nous
              collectons, utilisons, stockons et protégeons vos informations
              personnelles conformément au Règlement Général sur la Protection
              des Données (RGPD) et à la loi française.
            </p>
            <p>
              En utilisant nos services, vous acceptez les pratiques décrites
              dans cette politique.
            </p>
          </div>
        </section>

        <!-- Responsable du traitement -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            2. Responsable du traitement
          </h2>
          <div class="space-y-3 text-gray-700">
            <p><strong>Raison sociale :</strong> FUSTER PEINTURE SARL</p>
            <p><strong>Forme juridique :</strong> SARL</p>
            <p><strong>SIRET :</strong> 42023890900022</p>
            <p><strong>N° TVA :</strong> FR42420238909</p>
            <p>
              <strong>Adresse :</strong> 15 Rue de la République, Bâtiment A,
              75001 Paris, France
            </p>
            <p><strong>Email :</strong> contact@fuster-peinture.fr</p>
            <p><strong>Téléphone :</strong> 01 23 45 67 89</p>
          </div>
        </section>

        <!-- Données collectées -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            3. Données personnelles collectées
          </h2>
          <div class="space-y-4 text-gray-700">
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                3.1. Données d'identification
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Adresse postale</li>
                <li>Date de naissance (si nécessaire)</li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                3.2. Données de navigation
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Adresse IP</li>
                <li>Type de navigateur</li>
                <li>Pages visitées</li>
                <li>Durée de visite</li>
                <li>Cookies et technologies similaires</li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                3.3. Données commerciales
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Historique des commandes</li>
                <li>Préférences de service</li>
                <li>Communications commerciales</li>
                <li>Évaluations et avis</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Finalités du traitement -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            4. Finalités du traitement
          </h2>
          <div class="space-y-4 text-gray-700">
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                4.1. Exécution des contrats
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Gestion des commandes et devis</li>
                <li>Exécution des prestations de peinture</li>
                <li>Facturation et paiement</li>
                <li>Service après-vente</li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                4.2. Obligations légales
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Conservation des factures (10 ans)</li>
                <li>Déclaration TVA</li>
                <li>Obligations comptables</li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                4.3. Intérêts légitimes
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Amélioration de nos services</li>
                <li>Communication commerciale (avec consentement)</li>
                <li>Prévention de la fraude</li>
                <li>Statistiques de fréquentation</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Base légale -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            5. Base légale du traitement
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>Exécution du contrat :</strong> Données nécessaires à la
              réalisation des prestations
            </p>
            <p>
              <strong>Obligation légale :</strong> Conservation des données
              comptables et fiscales
            </p>
            <p>
              <strong>Intérêt légitime :</strong> Amélioration des services et
              communication commerciale
            </p>
            <p>
              <strong>Consentement :</strong> Newsletter et marketing direct
              (retirable à tout moment)
            </p>
          </div>
        </section>

        <!-- Durée de conservation -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            6. Durée de conservation
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>Données clients :</strong> 3 ans après la fin de la
              relation commerciale
            </p>
            <p>
              <strong>Données comptables :</strong> 10 ans (obligation légale)
            </p>
            <p><strong>Données de navigation :</strong> 13 mois maximum</p>
            <p><strong>Newsletter :</strong> Jusqu'au désabonnement</p>
          </div>
        </section>

        <!-- Destinataires -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            7. Destinataires des données
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>Personnel autorisé :</strong> Employés ayant besoin
              d'accéder aux données pour leur travail
            </p>
            <p>
              <strong>Prestataires techniques :</strong> Hébergeur, services de
              paiement (sous contrat de confidentialité)
            </p>
            <p>
              <strong>Autorités compétentes :</strong> Sur demande légale
              uniquement
            </p>
            <p>
              <strong>Transferts internationaux :</strong> Aucun transfert hors
              Union Européenne
            </p>
          </div>
        </section>

        <!-- Droits des personnes -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            8. Vos droits
          </h2>
          <div class="space-y-4 text-gray-700">
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                8.1. Droits d'accès et de rectification
              </h3>
              <p>
                Vous pouvez demander l'accès à vos données et leur rectification
                si elles sont inexactes.
              </p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                8.2. Droit d'effacement
              </h3>
              <p>
                Vous pouvez demander la suppression de vos données dans
                certaines circonstances.
              </p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                8.3. Droit à la limitation
              </h3>
              <p>
                Vous pouvez demander la limitation du traitement de vos données.
              </p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                8.4. Droit à la portabilité
              </h3>
              <p>Vous pouvez récupérer vos données dans un format structuré.</p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                8.5. Droit d'opposition
              </h3>
              <p>
                Vous pouvez vous opposer au traitement de vos données pour des
                raisons légitimes.
              </p>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="font-semibold text-blue-900">
                Pour exercer vos droits :
              </p>
              <p class="text-blue-800">
                Contactez-nous à : contact@fuster-peinture.fr
              </p>
              <p class="text-blue-800">
                Ou par courrier à l'adresse du siège social
              </p>
            </div>
          </div>
        </section>

        <!-- Cookies -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            9. Cookies et technologies similaires
          </h2>
          <div class="space-y-4 text-gray-700">
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                9.1. Types de cookies utilisés
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong>Cookies essentiels :</strong> Nécessaires au
                  fonctionnement du site
                </li>
                <li>
                  <strong>Cookies analytiques :</strong> Mesure d'audience et
                  statistiques
                </li>
                <li>
                  <strong>Cookies de préférences :</strong> Mémorisation de vos
                  choix
                </li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">
                9.2. Gestion des cookies
              </h3>
              <p>
                Vous pouvez configurer votre navigateur pour accepter ou refuser
                les cookies. Cependant, le refus de certains cookies peut
                affecter le fonctionnement du site.
              </p>
            </div>
          </div>
        </section>

        <!-- Sécurité -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            10. Sécurité des données
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données :
            </p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>Chiffrement des données sensibles</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Formation du personnel à la protection des données</li>
              <li>Audits de sécurité réguliers</li>
              <li>Sauvegardes sécurisées</li>
            </ul>
          </div>
        </section>

        <!-- Réclamations -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            11. Réclamations
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez
              :
            </p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>Nous contacter directement à : contact@fuster-peinture.fr</li>
              <li>Saisir la CNIL : https://www.cnil.fr</li>
              <li>Recourir à un médiateur de la consommation</li>
            </ul>
          </div>
        </section>

        <!-- Modifications -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            12. Modifications de la politique
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Cette politique de confidentialité peut être modifiée à tout
              moment. Les modifications importantes vous seront notifiées par
              email ou via notre site web.
            </p>
            <p>
              Nous vous encourageons à consulter régulièrement cette page pour
              rester informé de nos pratiques.
            </p>
          </div>
        </section>

        <!-- Contact DPO -->
        <section class="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 class="text-xl font-semibold text-blue-900 mb-4">
            Contact - Délégué à la Protection des Données
          </h2>
          <div class="space-y-2 text-blue-800">
            <p><strong>Email :</strong> contact@fuster-peinture.fr</p>
            <p><strong>Téléphone :</strong> 01 23 45 67 89</p>
            <p>
              <strong>Adresse :</strong> 15 Rue de la République, Bâtiment A,
              75001 Paris, France
            </p>
          </div>
        </section>
      </div>
    </main>

    <!-- Pied de page -->
    <footer class="bg-gray-800 text-white py-6 mt-12">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <p class="text-sm text-gray-300">
          © {{ new Date().getFullYear() }} Fuster Peinture. Tous droits
          réservés.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Page statique - pas de logique JavaScript nécessaire
</script>
