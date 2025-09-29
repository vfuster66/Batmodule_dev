# BatModule - Makefile pour développement local
.PHONY: help install dev build start stop clean logs

# Variables
COMPOSE_FILE = docker-compose.yml
DEV_COMPOSE_FILE = docker-compose.dev.yml

help: ## Afficher l'aide
	@echo "🎨 BatModule - Commandes disponibles:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Installer les dépendances et configurer l'environnement
	@echo "📦 Installation des dépendances..."
	docker-compose -f $(DEV_COMPOSE_FILE) build
	@echo "✅ Installation terminée"

dev: ## Lancer l'environnement de développement
	@echo "🚀 Démarrage de l'environnement de développement..."
	docker-compose -f $(DEV_COMPOSE_FILE) up -d
	@echo "✅ Environnement démarré:"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:3001"
	@echo "   Base de données: localhost:5432"

build: ## Construire les images Docker
	@echo "🔨 Construction des images..."
	docker-compose -f $(DEV_COMPOSE_FILE) build

start: ## Démarrer les services
	@echo "▶️  Démarrage des services..."
	docker-compose -f $(DEV_COMPOSE_FILE) up -d

stop: ## Arrêter les services
	@echo "⏹️  Arrêt des services..."
	docker-compose -f $(DEV_COMPOSE_FILE) down

restart: stop start ## Redémarrer les services

restart-backend: ## Redémarrer le backend uniquement
	@echo "🔄 Redémarrage du backend..."
	docker-compose -f $(DEV_COMPOSE_FILE) restart backend
	@echo "✅ Backend redémarré"

restart-frontend: ## Redémarrer le frontend uniquement
	@echo "🔄 Redémarrage du frontend..."
	docker-compose -f $(DEV_COMPOSE_FILE) restart frontend
	@echo "✅ Frontend redémarré"

rebuild-backend: ## Reconstruire et redémarrer le backend
	@echo "🔨 Reconstruction et redémarrage du backend..."
	docker-compose -f $(DEV_COMPOSE_FILE) up -d --build backend
	@echo "✅ Backend reconstruit et redémarré"

rebuild-frontend: ## Reconstruire et redémarrer le frontend
	@echo "🔨 Reconstruction et redémarrage du frontend..."
	docker-compose -f $(DEV_COMPOSE_FILE) up -d --build frontend
	@echo "✅ Frontend reconstruit et redémarré"

clean: ## Nettoyer les conteneurs et volumes
	@echo "🧹 Nettoyage..."
	docker-compose -f $(DEV_COMPOSE_FILE) down -v --remove-orphans
	docker system prune -f

logs: ## Afficher les logs
	docker-compose -f $(DEV_COMPOSE_FILE) logs -f

logs-backend: ## Logs du backend uniquement
	docker-compose -f $(DEV_COMPOSE_FILE) logs -f backend

logs-frontend: ## Logs du frontend uniquement
	docker-compose -f $(DEV_COMPOSE_FILE) logs -f frontend

db-reset: ## Réinitialiser la base de données
	@echo "🗄️  Réinitialisation de la base de données..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec postgres psql - batmodule -d batmodule -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@echo "✅ Base de données réinitialisée"

db-migrate: ## Exécuter les migrations
	@echo "🔄 Exécution des migrations..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm run migrate

test: ## Lancer les tests
	@echo "🧪 Lancement des tests..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm test
	docker-compose -f $(DEV_COMPOSE_FILE) exec frontend npm test

test-backend: ## Lancer les tests backend uniquement
	@echo "🧪 Tests backend..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm test

test-frontend: ## Lancer les tests frontend uniquement
	@echo "🧪 Tests frontend..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec frontend npm test

test-watch: ## Lancer les tests en mode watch
	@echo "🧪 Tests en mode watch..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm test -- --watch
	docker-compose -f $(DEV_COMPOSE_FILE) exec frontend npm test -- --watch

lint: ## Lancer le linting sur tous les projets
	@echo "🔍 Linting backend et frontend..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm run lint
	docker-compose -f $(DEV_COMPOSE_FILE) exec frontend npm run lint

lint-backend: ## Linting backend uniquement
	@echo "🔍 Linting backend..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm run lint

lint-frontend: ## Linting frontend uniquement
	@echo "🔍 Linting frontend..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec frontend npm run lint

format: ## Formater le code sur tous les projets
	@echo "✨ Formatage du code..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm run format
	docker-compose -f $(DEV_COMPOSE_FILE) exec frontend npm run format

format-backend: ## Formatage backend uniquement
	@echo "✨ Formatage backend..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm run format

format-frontend: ## Formatage frontend uniquement
	@echo "✨ Formatage frontend..."
	docker-compose -f $(DEV_COMPOSE_FILE) exec frontend npm run format

check: lint test ## Vérification complète (lint + tests)
	@echo "✅ Vérification terminée !"

# Commandes de production
generate-keys: ## Générer les clés de production sécurisées
	@echo "🔐 Génération des clés de production..."
	node scripts/generate-production-keys.js

deploy-prod: ## Déployer en production
	@echo "🚀 Déploiement en production..."
	./scripts/deploy.sh

backup-db: ## Sauvegarder la base de données
	@echo "🗄️ Sauvegarde de la base de données..."
	./scripts/backup-database.sh

monitoring: ## Démarrer les services de monitoring
	@echo "📊 Démarrage du monitoring..."
	docker-compose -f docker-compose.monitoring.yml up -d

logs-prod: ## Afficher les logs de production
	@echo "📋 Logs de production..."
	docker-compose -f docker-compose.prod.yml logs -f

status-prod: ## Vérifier l'état des services de production
	@echo "🔍 État des services de production..."
	docker-compose -f docker-compose.prod.yml ps

setup: install dev ## Configuration complète (install + dev)
	@echo "🎉 Configuration terminée !"
	@echo "   Accédez à l'application: http://localhost:3000"
