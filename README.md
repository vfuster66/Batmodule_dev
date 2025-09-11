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

## 🚀 Installation

### Prérequis

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker (optionnel)

### Installation Rapide

```bash
# 1. Cloner le projet
git clone <repository-url>
cd BatModule

# 2. Installer les dépendances
npm run install:all

# 3. Configuration
cp ENV_TEMPLATE.md .env
# Éditer .env avec vos valeurs

# 4. Base de données
createdb batmodule
psql -d batmodule -f database/init.sql
psql -d batmodule -f database/migrations/2025-01-add-btp-validation-fields.sql
psql -d batmodule -f database/migrations/2025-01-add-btp-compliance-tables.sql
psql -d batmodule -f database/migrations/2025-01-add-b2c-legal-fields.sql
psql -d batmodule -f database/migrations/2025-01-add-nf525-compliance.sql
psql -d batmodule -f database/migrations/2025-01-add-vat-attestations-table.sql
psql -d batmodule -f database/migrations/2025-01-enable-rls-security.sql

# 5. Démarrer
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

## ⚙️ Configuration

ique### Configuration Minimale Obligatoire

#### 1. **Variables d'Environnement**

Créez un fichier `.env` à la racine (voir `ENV_PRODUCTION.md` pour la configuration complète) :

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
├── docker-compose.yml     # Services Docker
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

## 🧪 Tests

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

### Tests Unitaires

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

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

## 🚀 Déploiement

### Production

```bash
# 1. Configuration production
NODE_ENV=production
DATABASE_URL=postgres://user:pass@prod-db:5432/batmodule
REDIS_URL=redis://prod-redis:6379

# 2. Sécurité
# - Générer des clés uniques
# - Configurer HTTPS
# - Activer les CORS restrictifs
# - Configurer les backups

# 3. Monitoring
# - Logs centralisés
# - Monitoring des performances
# - Alertes de sécurité
```

### Docker Production

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: batmodule
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/batmodule
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: https://api.votre-domaine.com
```

## 📊 Monitoring

### Métriques Importantes

- **Performance** : Temps de réponse API
- **Sécurité** : Tentatives de connexion échouées
- **Conformité** : Alertes de renouvellement
- **Utilisation** : Nombre de factures générées

### Logs

```bash
# Logs de l'application
tail -f logs/app.log

# Logs de sécurité
tail -f logs/security.log

# Logs de conformité
tail -f logs/compliance.log
```

## 🆘 Support

### Problèmes Courants

**Erreur de connexion DB**

```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql
psql -d batmodule -c "SELECT 1;"
```

**Erreur Redis**

```bash
# Vérifier Redis
redis-cli ping
```

**Erreur de session**

```bash
# Vérifier les variables d'environnement
echo $SESSION_SECRET
echo $REDIS_URL
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
