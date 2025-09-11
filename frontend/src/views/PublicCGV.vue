<template>
  <div class="min-h-screen bg-gray-50">
    <!-- En-tête -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Conditions Générales de Vente
            </h1>
            <p class="text-gray-600">CGV - Fuster Peinture</p>
          </div>
          <div class="text-sm text-gray-500">
            Dernière mise à jour : {{ new Date().toLocaleDateString('fr-FR') }}
          </div>
        </div>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="max-w-4xl mx-auto px-6 py-8">
      <!-- Contenu des CGV -->
      <div class="space-y-8">
        <!-- Article 1 - Objet -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 1 - Objet
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Les présentes conditions générales de vente (CGV) s'appliquent à
              toutes les prestations de peinture et travaux de finition
              proposées par <strong>Fuster Peinture</strong>.
            </p>
            <p>
              Toute commande implique l'acceptation sans réserve des présentes
              conditions générales de vente.
            </p>
            <p>
              Les conditions particulières figurant sur le devis ou le bon de
              commande prévalent sur les présentes CGV en cas de contradiction.
            </p>
          </div>
        </section>

        <!-- Article 2 - Devis et commande -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 2 - Devis et commande
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>2.1.</strong> Toute prestation fait l'objet d'un devis
              détaillé établi gratuitement et sans engagement.
            </p>
            <p>
              <strong>2.2.</strong> Le devis est valable 30 jours à compter de
              sa date d'émission, sauf mention contraire.
            </p>
            <p>
              <strong>2.3.</strong> La commande est ferme et définitive dès
              signature du devis par le client.
            </p>
            <p>
              <strong>2.4.</strong> Toute modification du devis initial doit
              faire l'objet d'un avenant écrit et signé par les deux parties.
            </p>
          </div>
        </section>

        <!-- Article 3 - Prix -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 3 - Prix
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>3.1.</strong> Les prix sont indiqués en euros, hors taxes
              (HT) et toutes taxes comprises (TTC).
            </p>
            <p>
              <strong>3.2.</strong> Les prix sont fermes et non révisables
              pendant la durée de validité du devis.
            </p>
            <p>
              <strong>3.3.</strong> En cas de modification des conditions
              d'exécution, les prix pourront être révisés après accord écrit du
              client.
            </p>
            <p>
              <strong>3.4.</strong> Les frais de déplacement sont inclus dans le
              prix, sauf mention contraire.
            </p>
          </div>
        </section>

        <!-- Article 4 - Modalités de paiement -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 4 - Modalités de paiement
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>4.1.</strong> Le paiement s'effectue selon les modalités
              définies dans le devis :
            </p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>Acompte de 30% à la commande</li>
              <li>Solde à la livraison ou à la fin des travaux</li>
            </ul>
            <p>
              <strong>4.2.</strong> En cas de retard de paiement, des pénalités
              de retard sont exigibles au taux légal en vigueur.
            </p>
            <p>
              <strong>4.3.</strong> En cas de non-paiement à l'échéance, le
              client s'expose à des frais de recouvrement d'un montant
              forfaitaire de 40€.
            </p>
            <p>
              <strong>4.4.</strong> Le paiement peut s'effectuer par chèque,
              virement bancaire ou espèces (dans la limite de 1000€).
            </p>
          </div>
        </section>

        <!-- Article 5 - Exécution des travaux -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 5 - Exécution des travaux
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>5.1.</strong> Les travaux sont exécutés conformément aux
              règles de l'art et aux normes en vigueur.
            </p>
            <p>
              <strong>5.2.</strong> Le client s'engage à mettre à disposition
              les locaux dans les conditions convenues.
            </p>
            <p>
              <strong>5.3.</strong> Les délais d'exécution sont donnés à titre
              indicatif et ne constituent pas des délais impératifs.
            </p>
            <p>
              <strong>5.4.</strong> En cas de retard imputable au client, des
              frais de report pourront être facturés.
            </p>
          </div>
        </section>

        <!-- Article 6 - Réception des travaux -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 6 - Réception des travaux
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>6.1.</strong> La réception des travaux est constatée par
              un procès-verbal signé par les deux parties.
            </p>
            <p>
              <strong>6.2.</strong> En l'absence de réception expresse, les
              travaux sont réputés acceptés 8 jours après leur achèvement.
            </p>
            <p>
              <strong>6.3.</strong> Les réserves éventuelles doivent être
              formulées par écrit lors de la réception.
            </p>
          </div>
        </section>

        <!-- Article 7 - Garantie -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 7 - Garantie
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>7.1.</strong> Les travaux bénéficient de la garantie
              légale de conformité et de la garantie des vices cachés.
            </p>
            <p>
              <strong>7.2.</strong> Une garantie de bon fonctionnement de 2 ans
              est accordée sur les travaux de peinture.
            </p>
            <p>
              <strong>7.3.</strong> La garantie ne couvre pas les dommages
              résultant d'un usage anormal ou d'un défaut d'entretien.
            </p>
          </div>
        </section>

        <!-- Article 8 - Responsabilité -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 8 - Responsabilité
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>8.1.</strong> L'entreprise est couverte par une assurance
              responsabilité civile professionnelle : AXA Assurance - Police
              n°123456789.
            </p>
            <p>
              <strong>8.2.</strong> La responsabilité de l'entreprise ne saurait
              être engagée en cas de force majeure.
            </p>
            <p>
              <strong>8.3.</strong> Le client s'engage à souscrire une assurance
              dommages-ouvrage si les travaux le nécessitent.
            </p>
          </div>
        </section>

        <!-- Article 9 - Résiliation -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 9 - Résiliation
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>9.1.</strong> En cas de résiliation par le client, les
              travaux déjà effectués seront facturés au prorata.
            </p>
            <p>
              <strong>9.2.</strong> L'entreprise peut résilier le contrat en cas
              de non-paiement des acomptes.
            </p>
          </div>
        </section>

        <!-- Article 10 - Droit applicable -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 10 - Droit applicable
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              <strong>10.1.</strong> Les présentes CGV sont soumises au droit
              français.
            </p>
            <p>
              <strong>10.2.</strong> En cas de litige, les tribunaux français
              seront seuls compétents.
            </p>
            <p>
              <strong>10.3.</strong> Toute tentative de résolution amiable est
              encouragée avant tout recours contentieux.
            </p>
          </div>
        </section>

        <!-- Article 11 - Médiation -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Article 11 - Médiation
          </h2>
          <div class="space-y-3 text-gray-700">
            <p>
              Conformément aux dispositions du Code de la consommation
              concernant le règlement amiable des litiges, nous adhérons au
              service du médiateur de la consommation.
            </p>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p><strong>Médiateur :</strong> Médiateur de la consommation</p>
              <p>
                <strong>Site web :</strong>
                https://www.mediation-consommation.fr
              </p>
            </div>
          </div>
        </section>

        <!-- Informations de contact -->
        <section class="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 class="text-xl font-semibold text-blue-900 mb-4">Contact</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-blue-700">Téléphone</p>
              <p class="text-blue-900">01 23 45 67 89</p>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-700">Email</p>
              <p class="text-blue-900">contact@fuster-peinture.fr</p>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-700">Site web</p>
              <p class="text-blue-900">https://www.fuster-peinture.fr</p>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-700">Adresse</p>
              <p class="text-blue-900">
                15 Rue de la République, Bâtiment A<br />75001 Paris, France
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
