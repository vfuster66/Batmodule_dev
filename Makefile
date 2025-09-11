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

setup: install dev ## Configuration complète (install + dev)
	@echo "🎉 Configuration terminée !"
	@echo "   Accédez à l'application: http://localhost:3000"
