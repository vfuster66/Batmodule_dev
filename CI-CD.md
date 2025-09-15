# 🚀 CI/CD Pipeline - BatModule

Ce document décrit la configuration CI/CD complète pour BatModule, incluant les tests backend et frontend.

## 📋 Workflows GitHub Actions

### 1. Tests & Quality (`tests.yml`)

**Déclencheur :** Push sur `main`/`develop`, Pull Requests

**Jobs :**

- **Backend Tests** : Tests unitaires avec PostgreSQL
- **Frontend Tests** : Tests de composants Vue avec Vitest
- **Integration Tests** : Tests end-to-end
- **Code Quality** : Vérification du formatage et du linting

### 2. Security & Dependencies (`security.yml`)

**Déclencheur :** Push, PR, et chaque lundi à 2h

**Jobs :**

- **Dependency Audit** : Audit des vulnérabilités npm
- **CodeQL Analysis** : Analyse de sécurité du code
- **Trivy Scan** : Scan de vulnérabilités des images Docker
- **Secret Scan** : Détection de secrets dans le code

### 3. Deploy (`deploy.yml`)

**Déclencheur :** Push sur `main`, Déclenchement manuel

**Jobs :**

- **Pre-deploy Tests** : Tests complets avant déploiement
- **Build & Deploy** : Construction et déploiement automatique

### 4. Release (`release.yml`)

**Déclencheur :** Tags version, Déclenchement manuel

**Jobs :**

- **Pre-release Tests** : Tests complets avant release
- **Create Release** : Création automatique de release GitHub
- **Build Docker** : Construction et push de l'image Docker

## 🛠️ Scripts NPM Disponibles

### Tests

```bash
# Tous les tests
npm run test

# Tests backend seulement
npm run test:backend

# Tests frontend seulement
npm run test:frontend

# Tests en mode watch
npm run test:watch

# Tests pour CI
npm run test:ci
```

### Linting & Formatage

```bash
# Linting complet
npm run lint

# Formatage complet
npm run format

# Par composant
npm run lint:backend
npm run lint:frontend
npm run format:backend
npm run format:frontend
```

## 🗄️ Configuration Base de Données

### Variables d'environnement CI

Le fichier `ci.env` contient la configuration pour les tests CI :

```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/batmodule_test
JWT_SECRET=test-secret-key-for-ci-cd-pipeline
ENCRYPTION_KEY=test-encryption-key-32-chars-long-for-ci
```

### Script de Setup CI

Le script `scripts/ci-setup.sh` configure automatiquement :

- Vérification de PostgreSQL
- Création de la base de test
- Exécution des migrations

## 📊 Couverture de Code

### Backend

- **Framework :** Jest
- **Couverture :** Générée automatiquement
- **Rapport :** `backend/coverage/`

### Frontend

- **Framework :** Vitest
- **Couverture :** Générée automatiquement
- **Rapport :** `frontend/coverage/`
- **Script propre :** `npm run test:coverage` (supprime les erreurs non gérées)

## 🔧 Configuration Locale

### Prérequis

```bash
# PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Installation

```bash
# Installation complète
npm run install:all

# Configuration de la base de données
cp ci.env .env.test
# Modifier les paramètres selon votre environnement local

# Exécution des tests
npm run test
```

## 🚀 Déploiement

### Staging

- Déclenchement automatique sur push `main`
- Tests complets avant déploiement
- Notification des résultats

### Production

- Déclenchement manuel via GitHub Actions
- Sélection de l'environnement (staging/production)
- Tests complets obligatoires

## 📈 Monitoring & Notifications

### Résultats des Tests

- Résumé automatique dans GitHub Actions
- Upload des rapports de couverture vers Codecov
- Notifications en cas d'échec

### Sécurité

- Alertes automatiques pour les vulnérabilités
- Scan hebdomadaire des dépendances
- Rapport de sécurité dans l'onglet Security

## 🔍 Dépannage

### Tests qui échouent

```bash
# Tests backend
cd backend && npm run test:watch

# Tests frontend
cd frontend && npm run test:clean

# Logs détaillés
npm run test -- --verbose
```

### Problèmes de base de données

```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Créer la base de test manuellement
createdb batmodule_test
```

### Erreurs de linting

```bash
# Corriger automatiquement
npm run lint:backend -- --fix
npm run lint:frontend -- --fix
```

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
