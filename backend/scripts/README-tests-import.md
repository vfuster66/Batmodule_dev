# Tests d'import CSV - Documentation

## Vue d'ensemble

Ce dossier contient les tests et scripts de validation pour l'import CSV des clients, avec un focus particulier sur :

- La validation et normalisation des SIRET
- La détection des doublons (email et SIRET)
- La validation des entreprises sans prénom/nom

## Fichiers de test

### 1. Tests automatisés

- `src/__tests__/integration/clients-import.test.js` : Tests d'intégration complets
- Utilise Jest et Supertest pour tester l'API
- Couvre tous les cas d'usage et cas limites

### 2. Test manuel rapide

- `scripts/test-csv-import.js` : Script de test manuel
- Simule la logique de validation côté serveur
- Permet de tester rapidement sans base de données

## Exécution des tests

### Test manuel (recommandé pour validation rapide)

```bash
cd backend
node scripts/test-csv-import.js
```

### Tests automatisés (nécessite Jest)

```bash
cd backend
npm test -- clients-import.test.js
```

## Cas de test couverts

### ✅ Validation SIRET

- **SIRET invalide** : Rejeté avec message d'erreur clair
- **SIRET avec espaces** : Normalisé automatiquement (`123 456 789 01234` → `12345678901234`)
- **SIRET avec tirets** : Normalisé automatiquement (`123-456-789-01234` → `12345678901234`)
- **Algorithme de Luhn** : Validation de la clé de contrôle

### ✅ Détection des doublons

- **Doublon par email** : Détecté et rejeté
- **Doublon par SIRET** : Détecté même avec formatage différent
- **Unicité garantie** : Impossible de créer des doublons

### ✅ Validation des entreprises

- **Entreprise sans contact** : Acceptée si nom d'entreprise fourni
- **Entreprise sans nom** : Rejetée si ni nom ni contact
- **Particulier** : Prénom et nom obligatoires

### ✅ Gestion des erreurs

- **Lot mixte** : Traitement correct des succès et erreurs
- **Messages clairs** : Erreurs explicites pour chaque cas
- **Robustesse** : Gestion des cas limites et données manquantes

## Exemple de sortie

```
🧪 Test d'import CSV des clients

Total: 5 clients
✅ Succès: 2
❌ Erreurs: 3

📋 Clients importés avec succès:
  1. Jean Dupont
  4. Pierre Durand (Entreprise Test)

🚨 Erreurs détectées:
  2. Marie Martin (Entreprise Martin)
     Erreur: Le numéro SIRET n'est pas valide (clé Luhn incorrecte)
  3. Société Durand
     Erreur: Le numéro SIRET n'est pas valide (clé Luhn incorrecte)
  5. Autre Client
     Erreur: Un client avec cet email existe déjà
```

## Points d'attention

### Normalisation SIRET

- **Côté serveur uniquement** : La normalisation se fait dans les validateurs Joi
- **Cohérence garantie** : Même logique pour création, mise à jour et import
- **Format uniforme** : Tous les SIRET sont stockés sans espaces ni tirets

### Performance

- **Validation en lot** : Traitement séquentiel pour éviter les conflits
- **Détection précoce** : Arrêt dès la première erreur par client
- **Messages détaillés** : Index et données pour faciliter la correction

### Évolutions futures

- **Tests automatisés** : Ajouter à la CI/CD
- **Base de données de test** : Isoler les tests d'intégration
- **Couverture complète** : Tester tous les cas limites identifiés

## Maintenance

### Ajout de nouveaux cas de test

1. Modifier `testClientsData` dans `test-csv-import.js`
2. Ajouter le cas correspondant dans `clients-import.test.js`
3. Vérifier que les messages d'erreur sont clairs

### Mise à jour des validations

1. Modifier les validateurs Joi dans `routes/clients.js`
2. Mettre à jour les tests pour refléter les nouveaux comportements
3. Exécuter les tests pour vérifier la cohérence

## Support

Pour toute question sur les tests d'import :

- Consulter les logs détaillés dans la sortie des tests
- Vérifier la cohérence entre validation côté serveur et tests
- Tester manuellement avec des données réelles si nécessaire
