#!/bin/bash

# Script de sauvegarde de la base de données
# Usage: ./scripts/backup-database.sh [nom-du-fichier]

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-batmodule}
DB_USER=${DB_USER:-batmodule}
BACKUP_DIR=${BACKUP_DIR:-./backups}
DATE=$(date +%Y%m%d_%H%M%S)

# Création du répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Nom du fichier de sauvegarde
if [ -n "$1" ]; then
    BACKUP_FILE="$BACKUP_DIR/$1"
else
    BACKUP_FILE="$BACKUP_DIR/batmodule_backup_$DATE.sql"
fi

echo "🗄️  Sauvegarde de la base de données..."
echo "📁 Fichier: $BACKUP_FILE"

# Sauvegarde
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --verbose \
    --clean \
    --create \
    --if-exists \
    --format=plain \
    --file=$BACKUP_FILE

# Compression
echo "📦 Compression de la sauvegarde..."
gzip $BACKUP_FILE
BACKUP_FILE="$BACKUP_FILE.gz"

# Vérification de la sauvegarde
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Sauvegarde terminée avec succès!"
    echo "📊 Taille: $SIZE"
    echo "📁 Emplacement: $BACKUP_FILE"
    
    # Nettoyage des anciennes sauvegardes (garde les 7 dernières)
    echo "🧹 Nettoyage des anciennes sauvegardes..."
    cd $BACKUP_DIR
    ls -t batmodule_backup_*.sql.gz | tail -n +8 | xargs -r rm
    cd - > /dev/null
    
else
    echo "❌ Erreur lors de la sauvegarde"
    exit 1
fi

echo "✅ Sauvegarde terminée!"
