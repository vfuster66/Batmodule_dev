#!/bin/bash

# Script pour faciliter le développement solo avec PR

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier qu'on est sur la branche dev
check_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "dev" ]; then
        print_warning "Tu n'es pas sur la branche 'dev'. Basculement..."
        git checkout dev
        git pull origin dev
    fi
}

# Créer une nouvelle feature branch
create_feature() {
    if [ -z "$1" ]; then
        print_error "Usage: $0 create <nom-de-la-feature>"
        exit 1
    fi
    
    feature_name="$1"
    branch_name="feature/$feature_name"
    
    print_message "Création de la branche: $branch_name"
    
    check_branch
    git checkout -b "$branch_name"
    
    print_success "Branche '$branch_name' créée et basculée"
    print_message "Tu peux maintenant développer ta feature"
}

# Finaliser une feature et créer une PR
finish_feature() {
    current_branch=$(git branch --show-current)
    
    if [[ ! "$current_branch" =~ ^feature/ ]]; then
        print_error "Tu n'es pas sur une branche feature (feature/*)"
        exit 1
    fi
    
    print_message "Finalisation de la feature: $current_branch"
    
    # Vérifier s'il y a des changements non commités
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Il y a des changements non commités. Commit automatique..."
        git add .
        git commit -m "feat: $current_branch - work in progress"
    fi
    
    # Pousser la branche
    print_message "Poussage de la branche..."
    git push origin "$current_branch"
    
    # Créer la PR
    print_message "Création de la PR vers 'dev'..."
    gh pr create --base dev --head "$current_branch" --title "feat: $current_branch" --body "Feature: $current_branch

- [ ] Code testé localement
- [ ] Lint/format OK
- [ ] Documentation mise à jour si nécessaire

Auto-merge activé pour le développement solo." --assignee vfuster66
    
    print_success "PR créée ! Tu peux la merger automatiquement ou manuellement"
    print_message "Pour merger automatiquement: gh pr merge --auto"
    print_message "Pour merger manuellement: gh pr merge --squash"
}

# Merger une PR et nettoyer
merge_pr() {
    current_branch=$(git branch --show-current)
    
    if [[ ! "$current_branch" =~ ^feature/ ]]; then
        print_error "Tu n'es pas sur une branche feature"
        exit 1
    fi
    
    print_message "Merge de la PR pour: $current_branch"
    
    # Merger la PR
    gh pr merge --squash
    
    # Revenir sur dev et nettoyer
    git checkout dev
    git pull origin dev
    git branch -d "$current_branch"
    git push origin --delete "$current_branch"
    
    print_success "Feature mergée et branche nettoyée !"
}

# Déployer en production
deploy_prod() {
    print_message "Création de la PR de déploiement vers 'main'..."
    
    # Créer une branche de release
    release_branch="release/$(date +%Y%m%d-%H%M%S)"
    git checkout -b "$release_branch"
    git push origin "$release_branch"
    
    # Créer la PR
    gh pr create --base main --head "$release_branch" --title "🚀 Release: $(date +%Y-%m-%d)" --body "Déploiement en production

- [ ] Tests validés
- [ ] Documentation à jour
- [ ] Changelog mis à jour

Prêt pour le déploiement !" --assignee vfuster66
    
    print_success "PR de déploiement créée !"
    print_message "Pour déployer: gh pr merge --squash"
}

# Afficher l'aide
show_help() {
    echo "🛠️  Script de développement solo pour BatModule"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create <nom>     Créer une nouvelle feature branch"
    echo "  finish           Finaliser la feature actuelle et créer une PR"
    echo "  merge            Merger la PR actuelle et nettoyer"
    echo "  deploy           Créer une PR de déploiement vers main"
    echo "  help             Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 create nouvelle-fonctionnalite"
    echo "  $0 finish"
    echo "  $0 merge"
    echo "  $0 deploy"
}

# Main
case "$1" in
    create)
        create_feature "$2"
        ;;
    finish)
        finish_feature
        ;;
    merge)
        merge_pr
        ;;
    deploy)
        deploy_prod
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Commande inconnue: $1"
        show_help
        exit 1
        ;;
esac
