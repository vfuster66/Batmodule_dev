// Helpers pour la conformité légale française

/**
 * Génère automatiquement les mentions légales conformes à la réglementation française
 */
export function generateLegalMentions(companySettings) {
  if (!companySettings) return ''

  const mentions = []

  // En-tête de l'entreprise
  mentions.push(
    `<h2>${companySettings.company_name || "Nom de l'entreprise"}</h2>`
  )

  if (
    companySettings.legal_name &&
    companySettings.legal_name !== companySettings.company_name
  ) {
    mentions.push(
      `<p><strong>Nom commercial :</strong> ${companySettings.company_name}</p>`
    )
  }

  // Informations légales obligatoires
  if (companySettings.forme_juridique) {
    mentions.push(
      `<p><strong>Forme juridique :</strong> ${companySettings.forme_juridique}</p>`
    )
  }

  if (companySettings.capital_social) {
    mentions.push(
      `<p><strong>Capital social :</strong> ${formatCurrency(companySettings.capital_social)}</p>`
    )
  }

  if (companySettings.siret) {
    mentions.push(`<p><strong>SIRET :</strong> ${companySettings.siret}</p>`)
  }

  if (companySettings.vat_number) {
    mentions.push(
      `<p><strong>N° de TVA intracommunautaire :</strong> ${companySettings.vat_number}</p>`
    )
  }

  if (companySettings.rcs_number) {
    mentions.push(`<p><strong>RCS :</strong> ${companySettings.rcs_number}</p>`)
  }

  if (companySettings.ape_code) {
    mentions.push(
      `<p><strong>Code APE :</strong> ${companySettings.ape_code}</p>`
    )
  }

  // Adresse
  if (companySettings.address_line1) {
    mentions.push('<p><strong>Adresse :</strong></p>')
    mentions.push('<p>')
    mentions.push(companySettings.address_line1)
    if (companySettings.address_line2) {
      mentions.push(`<br>${companySettings.address_line2}`)
    }
    if (companySettings.postal_code && companySettings.city) {
      mentions.push(
        `<br>${companySettings.postal_code} ${companySettings.city}`
      )
    }
    if (companySettings.country) {
      mentions.push(`<br>${companySettings.country}`)
    }
    mentions.push('</p>')
  }

  // Contact
  if (companySettings.phone) {
    mentions.push(
      `<p><strong>Téléphone :</strong> ${companySettings.phone}</p>`
    )
  }

  if (companySettings.email) {
    mentions.push(`<p><strong>Email :</strong> ${companySettings.email}</p>`)
  }

  if (companySettings.website) {
    mentions.push(
      `<p><strong>Site web :</strong> <a href="${companySettings.website}" target="_blank">${companySettings.website}</a></p>`
    )
  }

  // Dirigeant
  if (companySettings.dirigeant_nom) {
    let dirigeant = companySettings.dirigeant_nom
    if (companySettings.dirigeant_qualite) {
      dirigeant += ` (${companySettings.dirigeant_qualite})`
    }
    mentions.push(`<p><strong>Dirigeant :</strong> ${dirigeant}</p>`)
  }

  // Tribunal et assurance
  if (companySettings.tribunal_commercial) {
    mentions.push(
      `<p><strong>Tribunal de commerce :</strong> ${companySettings.tribunal_commercial}</p>`
    )
  }

  if (companySettings.assurance_rc) {
    mentions.push(
      `<p><strong>Assurance responsabilité civile :</strong> ${companySettings.assurance_rc}</p>`
    )
  }

  // Hébergement
  mentions.push('<h3>Hébergement</h3>')
  mentions.push(
    '<p>Ce site est hébergé par BatModule, plateforme de gestion pour artisans du bâtiment.</p>'
  )

  // RGPD
  if (companySettings.rgpd_compliance) {
    mentions.push('<h3>Protection des données personnelles</h3>')
    mentions.push(
      '<p>Cette entreprise s\'engage à respecter le Règlement Général sur la Protection des Données (RGPD) et la loi "Informatique et Libertés".</p>'
    )

    if (companySettings.politique_confidentialite) {
      mentions.push(
        '<p><a href="#politique-confidentialite">Politique de confidentialité</a></p>'
      )
    }
  }

  return mentions.join('\n')
}

/**
 * Génère automatiquement les CGV de base pour artisans
 */
export function generateDefaultCGV(companySettings) {
  const cgv = []

  cgv.push('<h2>Conditions Générales de Vente</h2>')
  cgv.push(`<p><strong>Préambule</strong></p>`)
  cgv.push(
    `<p>Les présentes conditions générales de vente s'appliquent à tous les services proposés par ${companySettings.company_name || "l'entreprise"}.</p>`
  )

  cgv.push('<h3>1. Définitions</h3>')
  cgv.push(
    '<p><strong>Vendeur :</strong> ' +
      (companySettings.company_name || "L'entreprise") +
      '</p>'
  )
  cgv.push(
    '<p><strong>Acheteur :</strong> Toute personne physique ou morale qui passe commande</p>'
  )
  cgv.push(
    '<p><strong>Services :</strong> Prestations de services dans le domaine du bâtiment et de la rénovation</p>'
  )

  cgv.push('<h3>2. Objet</h3>')
  cgv.push(
    "<p>Les présentes conditions générales de vente ont pour objet de définir les conditions dans lesquelles les services sont fournis par le vendeur à l'acheteur.</p>"
  )

  cgv.push('<h3>3. Devis et commande</h3>')
  cgv.push(
    "<p>Toute commande fait l'objet d'un devis détaillé. Le devis est valable 30 jours à compter de sa date d'émission, sauf mention contraire.</p>"
  )
  cgv.push(
    "<p>La commande est ferme et définitive dès signature du devis par l'acheteur.</p>"
  )

  cgv.push('<h3>4. Prix et modalités de paiement</h3>')
  cgv.push(
    "<p>Les prix sont indiqués en euros et s'entendent hors taxes. La TVA est ajoutée au prix selon la réglementation en vigueur.</p>"
  )
  cgv.push(
    `<p>Le délai de paiement est de ${companySettings.payment_terms || 30} jours à compter de la date d'émission de la facture.</p>`
  )
  cgv.push(
    "<p>En cas de retard de paiement, des pénalités de retard sont applicables au taux de 3 fois le taux d'intérêt légal.</p>"
  )

  cgv.push('<h3>5. Exécution des services</h3>')
  cgv.push(
    "<p>Les services sont exécutés selon les règles de l'art et dans le respect des normes en vigueur.</p>"
  )
  cgv.push(
    "<p>Le vendeur s'engage à respecter les délais convenus dans le devis, sous réserve des cas de force majeure.</p>"
  )

  cgv.push('<h3>6. Garantie</h3>')
  cgv.push(
    '<p>Les services bénéficient de la garantie légale de conformité et de la garantie des vices cachés.</p>'
  )
  cgv.push(
    "<p>La garantie décennale s'applique aux travaux de construction selon la réglementation en vigueur.</p>"
  )

  cgv.push('<h3>7. Responsabilité</h3>')
  cgv.push(
    '<p>Le vendeur est couvert par une assurance responsabilité civile professionnelle.</p>'
  )
  if (companySettings.assurance_rc) {
    cgv.push(`<p>Assurance RC : ${companySettings.assurance_rc}</p>`)
  }

  cgv.push('<h3>8. Droit applicable</h3>')
  cgv.push(
    '<p>Les présentes conditions générales de vente sont soumises au droit français.</p>'
  )
  if (companySettings.tribunal_commercial) {
    cgv.push(
      `<p>En cas de litige, les tribunaux de ${companySettings.tribunal_commercial} seront compétents.</p>`
    )
  }

  return cgv.join('\n')
}

/**
 * Génère automatiquement une politique de confidentialité RGPD
 */
export function generateDefaultPrivacyPolicy(companySettings) {
  const policy = []

  policy.push('<h2>Politique de confidentialité</h2>')
  policy.push(
    `<p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>`
  )

  policy.push('<h3>1. Responsable du traitement</h3>')
  policy.push(
    `<p>${companySettings.company_name || "L'entreprise"} est responsable du traitement des données personnelles collectées.</p>`
  )

  if (companySettings.email) {
    policy.push(`<p><strong>Contact :</strong> ${companySettings.email}</p>`)
  }

  policy.push('<h3>2. Données collectées</h3>')
  policy.push('<p>Nous collectons les données personnelles suivantes :</p>')
  policy.push('<ul>')
  policy.push('<li>Nom et prénom</li>')
  policy.push('<li>Adresse email</li>')
  policy.push('<li>Numéro de téléphone</li>')
  policy.push('<li>Adresse postale</li>')
  policy.push('<li>Informations relatives aux projets (devis, factures)</li>')
  policy.push('</ul>')

  policy.push('<h3>3. Finalités du traitement</h3>')
  policy.push('<p>Les données personnelles sont collectées pour :</p>')
  policy.push('<ul>')
  policy.push("<li>L'établissement de devis et factures</li>")
  policy.push('<li>La communication avec les clients</li>')
  policy.push("<li>L'exécution des services commandés</li>")
  policy.push('<li>Le respect des obligations légales et comptables</li>')
  policy.push('</ul>')

  policy.push('<h3>4. Base légale</h3>')
  policy.push('<p>Le traitement des données personnelles est basé sur :</p>')
  policy.push('<ul>')
  policy.push("<li>L'exécution du contrat (article 6.1.b du RGPD)</li>")
  policy.push(
    "<li>Le respect d'obligations légales (article 6.1.c du RGPD)</li>"
  )
  policy.push("<li>L'intérêt légitime (article 6.1.f du RGPD)</li>")
  policy.push('</ul>')

  policy.push('<h3>5. Conservation des données</h3>')
  policy.push('<p>Les données personnelles sont conservées :</p>')
  policy.push('<ul>')
  policy.push(
    '<li>Données clients : 3 ans après la fin de la relation contractuelle</li>'
  )
  policy.push('<li>Données comptables : 10 ans (obligation légale)</li>')
  policy.push('<li>Données de prospection : 3 ans sans contact</li>')
  policy.push('</ul>')

  policy.push('<h3>6. Droits des personnes</h3>')
  policy.push(
    '<p>Conformément au RGPD, vous disposez des droits suivants :</p>'
  )
  policy.push('<ul>')
  policy.push("<li>Droit d'accès à vos données</li>")
  policy.push('<li>Droit de rectification</li>')
  policy.push("<li>Droit à l'effacement</li>")
  policy.push('<li>Droit à la limitation du traitement</li>')
  policy.push('<li>Droit à la portabilité</li>')
  policy.push("<li>Droit d'opposition</li>")
  policy.push('</ul>')
  policy.push(
    "<p>Pour exercer ces droits, contactez-nous à l'adresse email indiquée ci-dessus.</p>"
  )

  policy.push('<h3>7. Sécurité</h3>')
  policy.push(
    '<p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, altération, divulgation ou destruction.</p>'
  )

  policy.push('<h3>8. Cookies</h3>')
  policy.push(
    "<p>Notre site utilise des cookies techniques nécessaires au fonctionnement de l'application. Aucun cookie de tracking n'est utilisé.</p>"
  )

  return policy.join('\n')
}

/**
 * Formate un montant en euros
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Valide la conformité des informations légales
 */
export function validateLegalCompliance(companySettings) {
  const errors = []
  const warnings = []

  // Vérifications obligatoires
  if (!companySettings.company_name) {
    errors.push("Le nom de l'entreprise est obligatoire")
  }

  if (!companySettings.address_line1) {
    errors.push("L'adresse de l'entreprise est obligatoire")
  }

  if (!companySettings.phone && !companySettings.email) {
    errors.push(
      'Au moins un moyen de contact (téléphone ou email) est obligatoire'
    )
  }

  // Vérifications recommandées
  if (!companySettings.forme_juridique) {
    warnings.push('La forme juridique est recommandée')
  }

  if (!companySettings.siret) {
    warnings.push('Le numéro SIRET est recommandé')
  }

  if (!companySettings.vat_number) {
    warnings.push('Le numéro de TVA est recommandé')
  }

  if (!companySettings.assurance_rc) {
    warnings.push("L'assurance responsabilité civile est recommandée")
  }

  if (!companySettings.rgpd_compliance) {
    warnings.push('La conformité RGPD est recommandée')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
