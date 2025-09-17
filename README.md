# BatModule - SaaS de Gestion BTP/Peinture

## 🎯 Vue d'ensemble

**BatModule** est un SaaS complet de gestion pour les entreprises du bâtiment, spécialement conçu pour les entreprises de peinture. L'application respecte intégralement la législation française et offre toutes les fonctionnalités nécessaires à la conformité BTP.

### ✨ Fonctionnalités Principales

- 📊 **Gestion complète** : Clients, devis, factures, paiements
- 🏗️ **Conformité BTP** : Assurances décennales, certifications, validations TVA
- 📋 **RGPD** : Export, suppression, archivage légal
- 🔒 **Sécurité** : Sessions sécurisées, CSRF, RLS PostgreSQL
- 📄 **PDF** : Génération automatique avec mentions légales
- 🗂️ **Archivage** : Stockage sécurisé avec hash SHA-256
- 📈 **Tableau de bord** : Conformité en temps réel

## 🌳 Workflow Git

- **`main`** : Branche de production (stable, déployée)
- **`dev`** : Branche de développement (intégration des features)

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le guide complet de contribution.

## 🚀 Installation et Développement

### Prérequis

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker (optionnel)

### Installation Rapide

```bash
# 1. Cloner le projet
git clone git@github.com:vfuster66/Batmodule_dev.git
cd BatModule

# 2. Basculer sur la branche de développement
git checkout dev

# 3. Installer les dépendances
npm run install:all

# 4. Configuration
cp ENV_TEMPLATE.md .env
# Éditer .env avec vos valeurs

# 5. Base de données
createdb batmodule
psql -d batmodule -f database/init.sql
psql -d batmodule -f database/migrations/2025-01-add-btp-validation-fields.sql
psql -d batmodule -f database/migrations/2025-01-add-btp-compliance-tables.sql
psql -d batmodule -f database/migrations/2025-01-add-b2c-legal-fields.sql
psql -d batmodule -f database/migrations/2025-01-add-nf525-compliance.sql
psql -d batmodule -f database/migrations/2025-01-add-vat-attestations-table.sql
psql -d batmodule -f database/migrations/2025-01-enable-rls-security.sql

# 6. Démarrer
make full-reset
```

### Installation Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Appliquer les migrations
docker-compose exec backend npm run migrate

# Vérifier le statut
docker-compose ps
```

### Commandes de Développement

```bash
# Commandes principales
make dev          # Démarrer en mode développement
make test         # Lancer tous les tests
make lint         # Linting backend et frontend
make format       # Formatage du code
make check        # Vérification complète (lint + tests)

# Commandes spécifiques
make test-backend    # Tests backend uniquement
make test-frontend   # Tests frontend uniquement
make lint-backend    # Linting backend uniquement
make lint-frontend   # Linting frontend uniquement
make format-backend  # Formatage backend uniquement
make format-frontend # Formatage frontend uniquement
```

## ⚙️ Configuration

### Configuration Minimale Obligatoire

#### 1. **Variables d'Environnement**

Créez un fichier `.env` à la racine :

```bash
# Configuration de base
NODE_ENV=development
PORT=3001

# Base de données
DATABASE_URL=postgres://batmodule:batmodule123@localhost:5432/batmodule

# Configuration NF525 - DÉSACTIVER SI NON UTILISÉ
CASH_PAYMENTS_ENABLED=false
NF525_COMPLIANT=false

# Configuration B2C
B2C_ENABLED=false

# Configuration TVA sur encaissements (optionnel)
VAT_ON_PAYMENTS_ENABLED=false
REDIS_URL=redis://localhost:6379

# Sécurité (GÉNÉREZ DES CLÉS UNIQUES)
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here
CSRF_SECRET=your-super-secret-csrf-key-here

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Dossiers
EXPORT_DIR=./exports
ARCHIVE_DIR=./archives

# Configuration BTP
BTP_VALIDATION_ENABLED=true
VAT_REDUCED_VALIDATION_ENABLED=true

# Configuration NF525
NF525_COMPLIANT=false
CASH_PAYMENTS_ENABLED=false

# Configuration B2C
B2C_ENABLED=false
WITHDRAWAL_PERIOD_DAYS=14
```

#### 2. **Paramètres de l'Entreprise (via API)**

```bash
# Configuration via API
PUT /api/company-settings
{
  "company_name": "Mon Entreprise de Peinture",
  "siret": "12345678901234",
  "forme_juridique": "SARL",
  "rcs_number": "RCS Paris B 123 456 789",
  "tribunal_commercial": "Tribunal de Commerce de Paris",
  "tva_intracommunautaire": "FR12345678901",
  "ape_code": "4331Z",
  "address_line1": "123 Rue de la Peinture",
  "postal_code": "75001",
  "city": "Paris",
  "phone": "0123456789",
  "email": "contact@monentreprise.fr",
  "insurance_company": "Assureur Décennale",
  "insurance_policy_number": "POL-2024-001",
  "insurance_coverage": 1000000
}
```

#### 3. **Script de Configuration Automatique**

```bash
# Configuration interactive
node setup-company-settings.js

# Vérification de la conformité
node test-audit-fixes.js
```

### Génération des Clés Sécurisées

```bash
# Générer des clés de 32 caractères
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🏗️ Architecture

### Stack Technique

**Backend**

- Node.js + Express
- PostgreSQL avec RLS
- Redis pour les sessions
- Puppeteer pour les PDF
- JWT + Sessions sécurisées

**Frontend**

- Vue 3 + Composition API
- TailwindCSS
- Pinia pour l'état
- Axios pour les API

**Sécurité**

- CSRF Protection
- Row Level Security (RLS)
- Sessions HttpOnly
- Rate Limiting
- Helmet.js

### Structure du Projet

```
BatModule/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── config/         # Configuration DB
│   │   ├── middleware/     # Auth, CSRF, sessions
│   │   ├── routes/         # Endpoints API
│   │   ├── services/       # Logique métier
│   │   └── server.js       # Point d'entrée
│   └── package.json
├── frontend/               # Interface Vue.js
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── views/          # Pages
│   │   ├── stores/         # État Pinia
│   │   └── utils/          # Utilitaires
│   └── package.json
├── database/               # Schémas et migrations
│   ├── init.sql           # Schéma initial
│   └── migrations/        # Migrations
├── scripts/               # Scripts utilitaires
│   ├── generate-production-keys.js
│   ├── deploy.sh
│   └── backup-database.sh
├── docker-compose.yml     # Services Docker
├── docker-compose.prod.yml # Production
├── docker-compose.monitoring.yml # Monitoring
└── Makefile              # Commandes utiles
```

## 📚 API Documentation

### Authentification

#### Inscription

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Mon Entreprise"
}
```

#### Connexion

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

#### Token CSRF

```http
GET /api/auth/csrf
```

### Gestion des Clients

```http
# Lister les clients
GET /api/clients

# Créer un client
POST /api/clients
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@example.com",
  "phone": "0123456789",
  "address": "123 Rue Example"
}

# Mettre à jour un client
PUT /api/clients/:id
```

### Gestion des Devis

```http
# Lister les devis
GET /api/quotes

# Créer un devis
POST /api/quotes
{
  "clientId": "uuid",
  "items": [
    {
      "description": "Peinture salon",
      "quantity": 1,
      "unit": "m²",
      "unitPrice": 25.00
    }
  ],
  "validityDays": 30
}

# Générer PDF
GET /api/quotes/:id/pdf

# Accepter publiquement
POST /api/quotes/:id/accept
{
  "otp": "123456"
}
```

### Gestion des Factures

```http
# Lister les factures
GET /api/invoices

# Créer une facture
POST /api/invoices
{
  "quoteId": "uuid",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "reverseChargeBtp": false,
  "reducedVatApplied": true,
  "reducedVatRate": 10.0,
  "reducedVatJustification": "Travaux de rénovation"
}

# Générer PDF
GET /api/invoices/:id/pdf

# Enregistrer un paiement
POST /api/invoices/:id/payments
{
  "amount": 1000.00,
  "paymentMethod": "bank_transfer",
  "paymentDate": "2024-01-20"
}
```

### Conformité BTP

#### Assurances

```http
# Lister les assurances
GET /api/insurance

# Créer une assurance
POST /api/insurance
{
  "certificateType": "decennale",
  "certificateNumber": "DEC-2024-001",
  "insuranceCompany": "Assureur Test",
  "startDate": "2024-01-01",
  "endDate": "2025-01-01",
  "coverageAmount": 1000000
}

# Vérifier la conformité
GET /api/insurance/compliance/check
```

#### Certifications

```http
# Lister les certifications
GET /api/certifications

# Créer une certification
POST /api/certifications
{
  "certificationType": "rge",
  "certificationNumber": "RGE-2024-001",
  "issuingBody": "Qualit EnR",
  "startDate": "2024-01-01",
  "endDate": "2027-01-01"
}
```

#### Déchets

```http
# Enregistrer des déchets
POST /api/waste
{
  "projectId": "uuid",
  "wasteType": "peinture",
  "wasteCode": "08 01 11",
  "quantity": 50.5,
  "unit": "kg",
  "collectionDate": "2024-01-15",
  "transporterName": "Transporteur Test",
  "bsdNumber": "BSD-2024-001"
}
```

### Tableau de Bord de Conformité

```http
# Tableau de bord complet
GET /api/compliance/dashboard

# Alertes de conformité
GET /api/compliance/alerts

# Résoudre une alerte
PUT /api/compliance/alerts/:id/resolve
{
  "notes": "Assurance renouvelée"
}
```

### RGPD

```http
# Export des données
GET /api/rgpd/export

# Suppression des données
DELETE /api/rgpd/delete-data
{
  "confirm": true,
  "keepAccountingData": true
}

# Rapport de conformité
GET /api/rgpd/compliance-report
```

### Exports Comptables

```http
# Export FEC
GET /api/exports/fec?startDate=2024-01-01&endDate=2024-12-31

# Export CSV ventes
GET /api/exports/sales?startDate=2024-01-01&endDate=2024-12-31
```

## 🧪 Tests et CI/CD

### Tests Unitaires

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Ou utiliser les commandes Makefile
make test-backend
make test-frontend
make test
```

### Tests de Conformité BTP

```bash
# Tester les fonctionnalités BTP
node test-btp-compliance.js
```

### Tests de Sécurité

```bash
# Tester les corrections de sécurité
node test-security-fixes.js
```

### Pipeline CI/CD

Le projet utilise GitHub Actions avec plusieurs workflows :

#### Tests & Quality (`tests.yml`)

- **Déclencheur** : Push sur `main`/`develop`, Pull Requests
- **Jobs** : Backend Tests, Frontend Tests, Integration Tests, Code Quality

#### Security & Dependencies (`security.yml`)

- **Déclencheur** : Push, PR, et chaque lundi à 2h
- **Jobs** : Dependency Audit, CodeQL Analysis, Trivy Scan, Secret Scan

#### Deploy (`deploy.yml`)

- **Déclencheur** : Push sur `main`, Déclenchement manuel
- **Jobs** : Pre-deploy Tests, Build & Deploy

#### Release (`release.yml`)

- **Déclencheur** : Tags version, Déclenchement manuel
- **Jobs** : Pre-release Tests, Create Release, Build Docker

### Configuration CI

Le fichier `ci.env` contient la configuration pour les tests CI :

```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/batmodule_test
JWT_SECRET=test-secret-key-for-ci-cd-pipeline
ENCRYPTION_KEY=test-encryption-key-32-chars-long-for-ci
```

### Couverture de Code

- **Backend** : Jest avec rapport dans `backend/coverage/`
- **Frontend** : Vitest avec rapport dans `frontend/coverage/`
- **Script propre** : `npm run test:coverage` (supprime les erreurs non gérées)

## 🔒 Sécurité

### Authentification Sécurisée

- **Sessions HttpOnly** : Protection contre XSS
- **CSRF Protection** : Tokens synchronisés
- **Rate Limiting** : Protection contre les attaques par force brute
- **RLS PostgreSQL** : Isolation des données par utilisateur

### Conformité Légale

- **RGPD** : Export, suppression, archivage
- **BTP** : Assurances décennales, certifications
- **Fiscal** : TVA réduite, autoliquidation
- **NF525** : Conformité logiciel de caisse

### Bonnes Pratiques

1. **Variables d'environnement** : Jamais de secrets en dur
2. **HTTPS** : Obligatoire en production
3. **CORS** : Configuration restrictive
4. **Logs** : Traçabilité des actions sensibles

## 🚀 Déploiement en Production

### Déploiement Rapide

#### 1. Génération des Clés de Production

```bash
# Générer les clés sécurisées
make generate-keys
# ou
node scripts/generate-production-keys.js
```

Cette commande génère :

- `.env.production` : Variables d'environnement de production
- `docker-compose.prod.yml` : Configuration Docker Compose pour la production
- `nginx.conf` : Configuration Nginx avec SSL
- `scripts/deploy.sh` : Script de déploiement automatisé

#### 2. Configuration Préalable

**Modifier les Domaines**
Éditez les fichiers générés pour remplacer `votre-domaine.com` par votre vrai domaine :

```bash
# Dans .env.production
CORS_ORIGIN=https://votre-domaine.com

# Dans nginx.conf
server_name votre-domaine.com www.votre-domaine.com;
```

**Configuration Email SMTP**
Modifiez les variables SMTP dans `.env.production` :

```bash
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=587
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASSWORD=votre-mot-de-passe-email
```

#### 3. Certificats SSL

**Avec Let's Encrypt (Recommandé)**

```bash
# Installation de Certbot
sudo apt-get install certbot python3-certbot-nginx

# Génération du certificat
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

**Avec un certificat existant**
Placez vos certificats dans `/etc/letsencrypt/live/votre-domaine.com/` et modifiez `nginx.conf`.

#### 4. Déploiement

```bash
# Déploiement automatisé
make deploy-prod
# ou
./scripts/deploy.sh
```

Ou manuellement :

```bash
# Construction et démarrage
docker-compose -f docker-compose.prod.yml up -d

# Exécution des migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

### Configuration Avancée

#### Surveillance et Monitoring

```bash
# Démarrage des services de monitoring
make monitoring
# ou
docker-compose -f docker-compose.monitoring.yml up -d
```

Accès aux interfaces :

- **Grafana** : http://votre-domaine.com:3001 (admin/admin123)
- **Prometheus** : http://votre-domaine.com:9090

#### Sauvegarde de la Base de Données

```bash
# Sauvegarde manuelle
make backup-db
# ou
./scripts/backup-database.sh

# Sauvegarde automatisée (crontab)
# Ajoutez cette ligne à votre crontab :
0 2 * * * /chemin/vers/BatModule/scripts/backup-database.sh
```

#### Mise à Jour

```bash
# Arrêt des services
docker-compose -f docker-compose.prod.yml down

# Mise à jour du code
git pull origin main

# Reconstruction et redémarrage
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Checklist de Sécurité

- [ ] Changer tous les mots de passe par défaut
- [ ] Configurer un pare-feu (UFW/iptables)
- [ ] Activer les logs de sécurité
- [ ] Configurer la surveillance des tentatives de connexion
- [ ] Mettre en place des sauvegardes automatiques
- [ ] Tester la restauration des sauvegardes
- [ ] Configurer les alertes de monitoring

### Configuration du Pare-feu

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # Backend (accès interne uniquement)
sudo ufw deny 5432/tcp   # PostgreSQL (accès interne uniquement)
sudo ufw deny 6379/tcp   # Redis (accès interne uniquement)
```

### Surveillance des Logs

```bash
# Logs de l'application
make logs-prod
# ou
docker-compose -f docker-compose.prod.yml logs -f backend

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs système
sudo journalctl -f
```

## 📊 Monitoring

### Métriques Disponibles

- **Performance** : Temps de réponse, CPU, mémoire
- **Base de données** : Connexions, requêtes lentes
- **Sécurité** : Tentatives de connexion, erreurs d'authentification
- **Business** : Nombre de clients, devis, factures

### Alertes Recommandées

- CPU > 80% pendant 5 minutes
- Mémoire > 90%
- Espace disque < 10%
- Erreurs 5xx > 10 en 1 minute
- Temps de réponse > 2 secondes

## 🆘 Dépannage

### Problèmes Courants

#### Service non accessible

```bash
# Vérifier l'état des conteneurs
make status-prod
# ou
docker-compose -f docker-compose.prod.yml ps

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs backend
```

#### Problème de base de données

```bash
# Connexion à la base
docker-compose -f docker-compose.prod.yml exec postgres psql -U batmodule_prod -d batmodule_prod

# Vérifier les connexions
docker-compose -f docker-compose.prod.yml exec postgres psql -U batmodule_prod -d batmodule_prod -c "SELECT * FROM pg_stat_activity;"
```

#### Problème de certificat SSL

```bash
# Renouvellement automatique
sudo certbot renew --dry-run

# Test de la configuration SSL
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com
```

### Restauration d'Urgence

```bash
# Restauration de la base de données
gunzip -c backups/batmodule_backup_YYYYMMDD_HHMMSS.sql.gz | \
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U batmodule_prod -d batmodule_prod

# Redémarrage des services
docker-compose -f docker-compose.prod.yml restart
```

### Debug

```bash
# Mode debug
NODE_ENV=development DEBUG=* npm run dev

# Logs détaillés
LOG_LEVEL=debug npm start
```

### Contact

- **Documentation** : Ce README
- **Issues** : GitHub Issues
- **Support** : support@batmodule.fr

## 📈 Roadmap

### Version 1.1

- [ ] Interface frontend complète
- [ ] Notifications email
- [ ] Intégrations externes (assureurs)
- [ ] Rapports avancés

### Version 1.2

- [ ] Factur-X / Chorus Pro
- [ ] Mobile app
- [ ] API webhooks
- [ ] Multi-langues

### Version 2.0

- [ ] IA pour recommandations
- [ ] Analytics avancées
- [ ] Marketplace intégré
- [ ] White-label

## 📄 Licence

Copyright © 2024 BatModule. Tous droits réservés.

---

**BatModule v1.0** - Conformité BTP Française ✅

**⚠️ Important** : Gardez toujours une copie de sauvegarde de vos clés et mots de passe en lieu sûr !
