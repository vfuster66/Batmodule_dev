# 🎨 Insertion du Catalogue de Services BatModule

Ce dossier contient les scripts nécessaires pour insérer le catalogue complet de services dans la base de données BatModule.

## 📋 Catalogue inclus

**Grille tarifaire cohérente – Perpignan (2025, HT)**

- **Règle importante** : Minimum de facturation 250 € HT (≈ 300 € TTC)

### Catégories de services :

1. **Préparation des supports** (7 services)
   - Protection chantier, dépose papier peint, décapage, lessivage, rebouchage, ratissage, sous-couche

2. **Peinture intérieure** (11 services)
   - Murs, plafonds, portes, fenêtres, plinthes, escaliers, radiateurs

3. **Revêtements muraux** (4 services)
   - Papier peint classique/vinyle, toile de verre

4. **Peinture extérieure** (6 services)
   - Façades, crépi, volets, ferronnerie, bardage

5. **Revêtements sols** (7 services)
   - Peinture sol, résine, parquet, PVC, lino

6. **Travaux complémentaires** (3 services)
   - Déplacement, nettoyage, location matériel

**Total : 38 services répartis dans 6 catégories**

## 🚀 Utilisation

### 1. Lister les utilisateurs existants

```bash
cd backend
node ../scripts/list-users.js
```

Cette commande affiche tous les utilisateurs avec leurs UUID.

### 2. Insérer le catalogue pour un utilisateur

```bash
cd backend
node ../scripts/insert-catalogue-services.js <UUID_UTILISATEUR>
```

Remplacez `<UUID_UTILISATEUR>` par l'UUID de l'utilisateur cible.

### Exemple complet :

```bash
# Se placer dans le dossier backend
cd backend

# Lister les utilisateurs pour obtenir l'UUID
node ../scripts/list-users.js

# Insérer le catalogue (remplacer par le vrai UUID)
node ../scripts/insert-catalogue-services.js 12345678-1234-1234-1234-123456789abc
```

## ⚙️ Prérequis

- Base de données PostgreSQL configurée
- Variables d'environnement correctes (DATABASE_URL)
- Tables `users`, `service_categories` et `services` existantes
- Au moins un utilisateur créé dans la base

## 🛡️ Sécurité

- Les scripts utilisent des transactions pour garantir la cohérence
- Validation de l'existence de l'utilisateur avant insertion
- Rollback automatique en cas d'erreur

## 📊 Après insertion

Le catalogue sera disponible dans l'interface BatModule pour :

- Création de devis
- Gestion des services
- Calculs automatiques avec TVA (20%)
- Organisation par catégories colorées

## 🔧 Dépannage

Si vous rencontrez des erreurs :

1. Vérifiez la connexion à la base de données
2. Assurez-vous que l'utilisateur existe
3. Vérifiez que les tables sont créées
4. Consultez les logs d'erreur détaillés
