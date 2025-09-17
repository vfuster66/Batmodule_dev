#!/usr/bin/env node

/**
 * Script pour générer des clés de production sécurisées
 * Usage: node scripts/generate-production-keys.js
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

console.log('🔐 Génération des clés de production sécurisées...\n')

// Génération des clés
const keys = {
  JWT_SECRET: crypto.randomBytes(64).toString('hex'),
  CSRF_SECRET: crypto.randomBytes(32).toString('hex'),
  SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
  API_KEY: crypto.randomBytes(16).toString('hex'),
  WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
}

// Génération des mots de passe de base de données
const dbPassword = crypto.randomBytes(16).toString('hex')
const redisPassword = crypto.randomBytes(16).toString('hex')

// Configuration de production
const productionConfig = {
  NODE_ENV: 'production',
  PORT: 3000,

  // Base de données
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_NAME: 'batmodule_prod',
  DB_USER: 'batmodule_prod',
  DB_PASSWORD: dbPassword,
  DATABASE_URL: `postgresql://batmodule_prod:${dbPassword}@localhost:5432/batmodule_prod`,

  // Redis
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: redisPassword,
  REDIS_URL: `redis://:${redisPassword}@localhost:6379`,

  // Sécurité
  JWT_SECRET: keys.JWT_SECRET,
  JWT_EXPIRES_IN: '24h',
  CSRF_SECRET: keys.CSRF_SECRET,
  SESSION_SECRET: keys.SESSION_SECRET,

  // Chiffrement
  ENCRYPTION_KEY: keys.ENCRYPTION_KEY,

  // API
  API_KEY: keys.API_KEY,
  WEBHOOK_SECRET: keys.WEBHOOK_SECRET,

  // CORS
  CORS_ORIGIN: 'https://votre-domaine.com',

  // Email (à configurer selon votre fournisseur)
  SMTP_HOST: 'smtp.votre-fournisseur.com',
  SMTP_PORT: 587,
  SMTP_USER: 'votre-email@votre-domaine.com',
  SMTP_PASSWORD: 'votre-mot-de-passe-email',

  // Uploads
  UPLOAD_MAX_SIZE: '10MB',
  UPLOAD_ALLOWED_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',

  // Logs
  LOG_LEVEL: 'info',
  LOG_FILE: '/var/log/batmodule/app.log',
}

// Création du fichier .env.production
const envContent = Object.entries(productionConfig)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')

const envPath = path.join(__dirname, '..', '.env.production')
fs.writeFileSync(envPath, envContent)

console.log('✅ Fichier .env.production créé avec succès')
console.log(`📁 Emplacement: ${envPath}`)

// Création du fichier de configuration Docker Compose pour la production
const dockerComposeProd = `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: batmodule_postgres_prod
    environment:
      POSTGRES_DB: batmodule_prod
      POSTGRES_USER: batmodule_prod
      POSTGRES_PASSWORD: ${dbPassword}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - batmodule_network

  redis:
    image: redis:7-alpine
    container_name: batmodule_redis_prod
    command: redis-server --requirepass ${redisPassword}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - batmodule_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: batmodule_backend_prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://batmodule_prod:${dbPassword}@postgres:5432/batmodule_prod
      - REDIS_URL=redis://:${redisPassword}@redis:6379
      - JWT_SECRET=${keys.JWT_SECRET}
      - CSRF_SECRET=${keys.CSRF_SECRET}
      - SESSION_SECRET=${keys.SESSION_SECRET}
      - ENCRYPTION_KEY=${keys.ENCRYPTION_KEY}
      - API_KEY=${keys.API_KEY}
      - WEBHOOK_SECRET=${keys.WEBHOOK_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - batmodule_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: batmodule_frontend_prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - batmodule_network

volumes:
  postgres_data:
  redis_data:

networks:
  batmodule_network:
    driver: bridge
`

const dockerComposePath = path.join(__dirname, '..', 'docker-compose.prod.yml')
fs.writeFileSync(dockerComposePath, dockerComposeProd)

console.log('✅ Fichier docker-compose.prod.yml créé avec succès')
console.log(`📁 Emplacement: ${dockerComposePath}`)

// Création du fichier de configuration Nginx
const nginxConfig = `server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Certificats SSL (à générer avec Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API Backend
    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout pour les requêtes longues
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Gestion des erreurs
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
`

const nginxPath = path.join(__dirname, '..', 'nginx.conf')
fs.writeFileSync(nginxPath, nginxConfig)

console.log('✅ Fichier nginx.conf créé avec succès')
console.log(`📁 Emplacement: ${nginxPath}`)

// Création du script de déploiement
const deployScript = `#!/bin/bash

# Script de déploiement en production
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Déploiement de BatModule en production..."

# Vérification des prérequis
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Arrêt des services existants
echo "🛑 Arrêt des services existants..."
docker-compose -f docker-compose.prod.yml down

# Construction des images
echo "🔨 Construction des images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrage des services
echo "🚀 Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Attente que les services soient prêts
echo "⏳ Attente que les services soient prêts..."
sleep 30

# Vérification de l'état des services
echo "🔍 Vérification de l'état des services..."
docker-compose -f docker-compose.prod.yml ps

# Exécution des migrations
echo "📊 Exécution des migrations..."
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

echo "✅ Déploiement terminé avec succès!"
echo "🌐 Application disponible sur: https://votre-domaine.com"
`

const deployPath = path.join(__dirname, '..', 'scripts', 'deploy.sh')
fs.writeFileSync(deployPath, deployScript)
fs.chmodSync(deployPath, '755')

console.log('✅ Script de déploiement créé avec succès')
console.log(`📁 Emplacement: ${deployPath}`)

// Affichage des informations importantes
console.log('\n🔐 INFORMATIONS IMPORTANTES:')
console.log('================================')
console.log('⚠️  GARDEZ CES INFORMATIONS EN SÉCURITÉ:')
console.log('')
console.log('🔑 Clés générées:')
Object.entries(keys).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`)
})
console.log('')
console.log('🗄️  Mots de passe base de données:')
console.log(`   PostgreSQL: ${dbPassword}`)
console.log(`   Redis: ${redisPassword}`)
console.log('')
console.log('📋 PROCHAINES ÉTAPES:')
console.log('1. Modifiez les domaines dans nginx.conf et .env.production')
console.log("2. Configurez votre fournisseur d'email SMTP")
console.log("3. Générez des certificats SSL avec Let's Encrypt")
console.log('4. Déployez avec: ./scripts/deploy.sh')
console.log('')
console.log('🔒 SÉCURITÉ:')
console.log('- Changez tous les mots de passe par défaut')
console.log('- Configurez un pare-feu approprié')
console.log('- Activez la surveillance des logs')
console.log('- Sauvegardez régulièrement la base de données')
console.log('')
console.log('✅ Génération terminée avec succès!')
