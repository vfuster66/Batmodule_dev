# Changelog - Améliorations des Services

## Problèmes Critiques Corrigés

### 1. Service PDF (pdfServiceSimple.js)

- **Problème** : Méthode `addInvoiceItems` manquante causant des erreurs lors de la génération de PDF de factures
- **Solution** : Remplacé `this.addInvoiceItems()` par `this.addItemsTable()` qui existe déjà
- **Impact** : Les PDF de factures peuvent maintenant être générés sans erreur

### 2. Service de Rappels (reminderService.js)

- **Problème 1** : `nodemailer.createTransporter` n'existe pas (devrait être `createTransport`)
- **Solution** : Corrigé `createTransporter` → `createTransport`
- **Problème 2** : Colonnes INSERT décalées et inexistantes
- **Solution** :
  - Supprimé les colonnes `invoice_type` et `parent_invoice_id` qui n'existent pas dans la table `invoices`
  - Corrigé les colonnes `invoice_items` : `unit_price` → `unit_price_ht`, `total_price` → `total_ht` et `total_ttc`
  - Corrigé `reminderInvoice.email` → `reminderInvoice.client_email`
- **Impact** : Les rappels par email peuvent maintenant être envoyés correctement

### 3. Service de Rétention de Données (dataRetentionService.js)

- **Problème** : Purge des clients sans filtrage par utilisateur (risque multi-tenant)
- **Solution** :
  - Ajouté le paramètre `userId` aux méthodes `cleanupInactiveClients` et `deleteClientData`
  - Ajouté des filtres `WHERE user_id = $1` dans toutes les requêtes de suppression
- **Impact** : Sécurisation de la purge des données multi-tenant

## Nouvelles Fonctionnalités

### 4. Système de Numérotation des Services

- **Migration** : `2025-01-add-service-numbering.sql`
  - Ajout de `category_number` (INTEGER) aux `service_categories`
  - Ajout de `service_number` (VARCHAR(10)) aux `services`
  - Fonctions automatiques de génération de numéros
  - Triggers pour auto-assigner les numéros

- **Backend** : Routes mises à jour
  - Inclusion des champs `category_number` et `service_number` dans les réponses API
  - Tri par numéro de catégorie

- **Frontend** : Interface améliorée
  - Affichage des numéros de catégories (ex: "1 - Maçonnerie")
  - Affichage des numéros de services (ex: "101", "102", "201")
  - Groupement par catégories avec accordéons
  - Interface plus organisée et facile à naviguer

### 5. Interface Utilisateur Améliorée

- **Accordéons par Catégorie** : Les services sont maintenant groupés par catégorie avec des accordéons
- **Numérotation Visible** :
  - Catégories affichent leur numéro (ex: "1 - Maçonnerie")
  - Services affichent leur numéro (ex: "101 - Pose de briques")
- **Navigation Améliorée** : Plus facile de trouver et organiser les services
- **Compteurs** : Affichage du nombre de services par catégorie

## Structure de Numérotation

### Catégories

- Numérotation automatique : 1, 2, 3, 4, ...
- Affichage : "1 - Maçonnerie", "2 - Plomberie", etc.

### Services

- Format : `{numéro_catégorie}{numéro_service}`
- Exemples :
  - Catégorie 1 (Maçonnerie) : 101, 102, 103, ...
  - Catégorie 2 (Plomberie) : 201, 202, 203, ...
  - Catégorie 3 (Électricité) : 301, 302, 303, ...

## Prochaines Étapes Recommandées

1. **Appliquer la migration** : Exécuter le script `apply-service-numbering-migration.js` en production
2. **Tests** : Vérifier que les PDF se génèrent correctement
3. **Tests des rappels** : Vérifier l'envoi d'emails de rappel
4. **Formation utilisateurs** : Expliquer le nouveau système de numérotation
5. **Documentation** : Mettre à jour la documentation utilisateur

## Fichiers Modifiés

### Backend

- `backend/src/services/pdfServiceSimple.js` - Correction méthode manquante
- `backend/src/services/reminderService.js` - Correction API nodemailer et colonnes
- `backend/src/services/dataRetentionService.js` - Sécurisation multi-tenant
- `backend/src/routes/services.js` - Ajout des champs de numérotation
- `database/migrations/2025-01-add-service-numbering.sql` - Migration DB

### Frontend

- `frontend/src/views/ServicesView.vue` - Interface avec accordéons et numéros
- `frontend/src/types/index.ts` - Types TypeScript mis à jour

### Scripts

- `backend/scripts/apply-service-numbering-migration.js` - Script d'application de migration
