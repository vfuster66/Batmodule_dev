#!/bin/bash

# Script de configuration pour CI/CD
set -e

echo "🚀 Configuration CI/CD pour BatModule"

# Charger les variables d'environnement pour CI
if [ -f "ci.env" ]; then
    echo "📋 Chargement des variables d'environnement CI..."
    export $(cat ci.env | grep -v '^#' | xargs)
fi

# Vérifier que PostgreSQL est disponible
echo "🐘 Vérification de PostgreSQL..."
until pg_isready -h localhost -p 5432 -U test; do
    echo "⏳ En attente de PostgreSQL..."
    sleep 2
done

# Créer la base de données de test si elle n'existe pas
echo "🗄️ Configuration de la base de données de test..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U test -d postgres -c "CREATE DATABASE batmodule_test;" || echo "Base de données existe déjà"

# Exécuter les migrations
echo "🔄 Exécution des migrations..."
cd backend
npm run migrate

echo "✅ Configuration CI terminée"
