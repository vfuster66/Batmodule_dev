# Configuration de Production BatModule

## 📋 Variables d'Environnement Obligatoires

Créez un fichier `.env` à la racine avec les variables suivantes :

```bash
# Configuration de base
NODE_ENV=production
PORT=3001

# Base de données PostgreSQL
DATABASE_URL=postgres://username:password@localhost:5432/batmodule

# Redis pour les sessions
REDIS_URL=redis://localhost:6379

# Sécurité (GÉNÉREZ DES CLÉS UNIQUES EN PRODUCTION)
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
SESSION_SECRET=your-super-secret-session-key-here-change-in-production
CSRF_SECRET=your-super-secret-csrf-key-here-change-in-production

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Dossiers
EXPORT_DIR=./exports
ARCHIVE_DIR=./archives

# Configuration BTP
BTP_VALIDATION_ENABLED=true
VAT_REDUCED_VALIDATION_ENABLED=true

# Configuration NF525 - DÉSACTIVER SI NON UTILISÉ
NF525_COMPLIANT=false
CASH_PAYMENTS_ENABLED=false
CASH_PAYMENT_LIMIT=1000.00

# Configuration B2C
B2C_ENABLED=false
WITHDRAWAL_PERIOD_DAYS=14

# Configuration de sécurité
CORS_ORIGIN=https://votre-domaine.com
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true

# Configuration TVA sur encaissements (optionnel)
VAT_ON_PAYMENTS_ENABLED=false
```

## 🔧 Configuration Minimale Requise

### **1. Paramètres de l'Entreprise (via API)**

```bash
# Récupérer les paramètres
GET /api/company-settings

# Mettre à jour les paramètres obligatoires
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

### **2. Désactiver les Paiements Espèces**

```bash
# Dans .env
CASH_PAYMENTS_ENABLED=false
NF525_COMPLIANT=false

# Via API
PUT /api/company-settings
{
  "cash_payments_enabled": false,
  "nf525_compliant": false
}
```

### **3. Configuration TVA sur Encaissements (Optionnel)**

```bash
# Dans .env
VAT_ON_PAYMENTS_ENABLED=true

# Via API
PUT /api/company-settings
{
  "vat_on_payments": true,
  "vat_on_payments_text": "TVA sur les encaissements (art. 283-1 CGI)"
}
```

## 🚀 Déploiement

### **1. Installation**

```bash
# Cloner et installer
git clone <repository>
cd BatModule
npm run install:all

# Configuration
cp ENV_PRODUCTION.md .env
# Éditer .env avec vos valeurs

# Base de données
createdb batmodule
psql -d batmodule -f database/init.sql
psql -d batmodule -f database/migrations/2025-01-complete-company-settings.sql
# ... autres migrations
```

### **2. Configuration Initiale**

```bash
# Démarrer l'application
npm run dev

# Configurer les paramètres via API
curl -X PUT http://localhost:3001/api/company-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "company_name": "Mon Entreprise",
    "siret": "12345678901234",
    "forme_juridique": "SARL",
    "address_line1": "123 Rue Example",
    "postal_code": "75001",
    "city": "Paris",
    "phone": "0123456789",
    "email": "contact@example.fr"
  }'
```

### **3. Vérification**

```bash
# Tester la configuration
node test-audit-fixes.js

# Vérifier la conformité
curl http://localhost:3001/api/company-settings/validate
```

## ⚠️ Points Importants

1. **SIRET** : Obligatoire et validé automatiquement
2. **Assurance** : Décennale obligatoire pour le BTP
3. **Espèces** : Désactiver si non utilisé (NF525)
4. **TVA** : Configurer selon votre régime
5. **Sécurité** : Changer toutes les clés en production

## 📞 Support

- **Documentation** : README.md
- **Tests** : `node test-audit-fixes.js`
- **API** : `/api/company-settings/validate`
