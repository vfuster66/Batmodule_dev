<template>
  <div class="min-h-screen bg-gray-50">
    <!-- En-tête -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Mentions Légales</h1>
            <p class="text-gray-600">Informations légales obligatoires</p>
          </div>
          <div class="text-sm text-gray-500">
            Dernière mise à jour : {{ new Date().toLocaleDateString('fr-FR') }}
          </div>
        </div>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="max-w-4xl mx-auto px-6 py-8">
      <!-- Contenu des mentions légales -->
      <div class="space-y-8">
        <!-- Informations sur l'entreprise -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Informations sur l'entreprise
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500">Raison sociale</p>
              <p class="text-gray-900">FUSTER PEINTURE</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Forme juridique</p>
              <p class="text-gray-900">EURL</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">SIRET</p>
              <p class="text-gray-900">42023890900022</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">
                N° TVA Intracommunautaire
              </p>
              <p class="text-gray-900">FR42420238909</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">RCS</p>
              <p class="text-gray-900">RCS Paris B 420 238 909</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Code APE/NAF</p>
              <p class="text-gray-900">4332Z</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Capital social</p>
              <p class="text-gray-900">5 000 €</p>
            </div>
          </div>
        </section>

        <!-- Siège social -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Siège social</h2>
          <div class="space-y-2">
            <p class="text-gray-900">27 rue Federico Garcia Lorca</p>
            <p class="text-gray-900">66330 Cabestany</p>
            <p class="text-gray-900">France</p>
          </div>
        </section>

        <!-- Contact -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500">Téléphone</p>
              <p class="text-gray-900">06 61 94 55 73</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Email</p>
              <p class="text-gray-900">contact@fuster-peinture.fr</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Site web</p>
              <p class="text-gray-900">https://www.fuster-peinture.fr</p>
            </div>
          </div>
        </section>

        <!-- Dirigeant -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Dirigeant</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500">Nom</p>
              <p class="text-gray-900">Georges FUSTER PEREZ</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Qualité</p>
              <p class="text-gray-900">Gérant</p>
            </div>
          </div>
        </section>

        <!-- Assurance -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Assurance</h2>
          <div class="space-y-2">
            <p class="text-gray-900">
              <strong>Assurance Responsabilité Civile :</strong> AXA Assurance -
              Police n°123456789
            </p>
            <p class="text-sm text-gray-600">
              L'assurance couvre les dommages causés aux tiers dans le cadre de
              l'activité professionnelle.
            </p>
          </div>
        </section>

        <!-- Hébergement -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Hébergement</h2>
          <div class="space-y-2">
            <p class="text-gray-900"><strong>Hébergeur :</strong> OVH SAS</p>
            <p class="text-gray-900">
              <strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France
            </p>
            <p class="text-gray-900">
              <strong>Téléphone :</strong> 1007 (numéro non surtaxé)
            </p>
            <p class="text-gray-900">
              <strong>Site web :</strong> https://www.ovh.com
            </p>
          </div>
        </section>

        <!-- Directeur de publication -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Directeur de publication
          </h2>
          <div class="space-y-2">
            <p class="text-gray-900">
              <strong>Nom :</strong> Georges FUSTER PEREZ
            </p>
            <p class="text-gray-900"><strong>Qualité :</strong> Gérant</p>
          </div>
        </section>

        <!-- Propriété intellectuelle -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Propriété intellectuelle
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              L'ensemble de ce site relève de la législation française et
              internationale sur le droit d'auteur et la propriété
              intellectuelle. Tous les droits de reproduction sont réservés, y
              compris pour les documents téléchargeables et les représentations
              iconographiques et photographiques.
            </p>
            <p>
              La reproduction de tout ou partie de ce site sur un support
              électronique quel qu'il soit est formellement interdite sauf
              autorisation expresse du directeur de la publication.
            </p>
          </div>
        </section>

        <!-- Collecte de données -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Collecte et traitement des données personnelles
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Conformément à la loi « Informatique et Libertés » du 6 janvier
              1978 modifiée et au Règlement Général sur la Protection des
              Données (RGPD), vous disposez d'un droit d'accès, de
              rectification, de suppression et d'opposition aux données
              personnelles vous concernant.
            </p>
            <p>
              Pour exercer ce droit, contactez-nous à l'adresse :
              contact@fuster-peinture.fr
            </p>
          </div>
        </section>

        <!-- Cookies -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Cookies</h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Ce site utilise des cookies pour améliorer votre expérience de
              navigation et analyser le trafic. En continuant à utiliser ce
              site, vous acceptez l'utilisation de cookies.
            </p>
            <p>
              Vous pouvez configurer votre navigateur pour refuser les cookies,
              mais cela peut affecter certaines fonctionnalités du site.
            </p>
          </div>
        </section>

        <!-- Droit applicable -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Droit applicable
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Le présent site est soumis au droit français. En cas de litige,
              les tribunaux français seront seuls compétents.
            </p>
            <p>
              Toute tentative de résolution amiable des litiges est encouragée
              avant tout recours contentieux.
            </p>
          </div>
        </section>

        <!-- Médiation -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Médiation</h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Conformément aux dispositions du Code de la consommation
              concernant le règlement amiable des litiges, nous adhérons au
              service du médiateur de la consommation dont les coordonnées sont
              les suivantes :
            </p>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p><strong>Médiateur :</strong> Médiateur de la consommation</p>
              <p>
                <strong>Site web :</strong>
                https://www.mediation-consommation.fr
              </p>
              <p class="text-sm text-gray-600 mt-2">
                Le médiateur peut être saisi directement en ligne sur le site
                mentionné ci-dessus ou par courrier postal.
              </p>
            </div>
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
