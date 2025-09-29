/**
 * Valide un numéro SIRET selon l'algorithme de Luhn
 * @param {string} siret - Le numéro SIRET à valider
 * @returns {boolean} - true si le SIRET est valide, false sinon
 */
function validateSiret(siret) {
  // Vérifier que le SIRET est une chaîne de 14 chiffres
  if (!siret || typeof siret !== 'string') {
    return false
  }

  // Nettoyer le SIRET (supprimer les espaces, tirets, etc.)
  const cleanSiret = siret.replace(/[\s-]/g, '')

  // Vérifier que c'est bien 14 caractères et que ce sont tous des chiffres
  if (!/^\d{14}$/.test(cleanSiret)) {
    return false
  }

  // Algorithme de Luhn pour valider la clé de contrôle
  let sum = 0
  let isEven = false

  // Parcourir les chiffres de droite à gauche
  for (let i = cleanSiret.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanSiret[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Extrait le SIREN (9 premiers chiffres) d'un SIRET
 * @param {string} siret - Le numéro SIRET
 * @returns {string|null} - Le SIREN ou null si invalide
 */
function extractSiren(siret) {
  if (!validateSiret(siret)) {
    return null
  }

  const cleanSiret = siret.replace(/[\s-]/g, '')
  return cleanSiret.substring(0, 9)
}

module.exports = {
  validateSiret,
  extractSiren,
}
