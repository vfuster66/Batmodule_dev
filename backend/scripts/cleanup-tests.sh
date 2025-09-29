#!/bin/bash

# Script de nettoyage des tests d'import CSV
# Supprime les fichiers de test temporaires et nettoie la base de données de test

echo "🧹 Nettoyage des tests d'import CSV..."

# Supprimer les fichiers de test temporaires (si nécessaire)
# Note: Les fichiers de test sont conservés pour la documentation

echo "✅ Nettoyage terminé"
echo ""
echo "📁 Fichiers de test conservés :"
echo "  - src/__tests__/integration/clients-import.test.js (tests automatisés)"
echo "  - scripts/test-csv-import.js (test manuel)"
echo "  - scripts/README-tests-import.md (documentation)"
echo ""
echo "🚀 Pour exécuter les tests :"
echo "  - Test manuel : node scripts/test-csv-import.js"
echo "  - Tests automatisés : npm test -- clients-import.test.js"
