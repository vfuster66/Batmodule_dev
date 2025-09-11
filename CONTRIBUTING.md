# Guide de Contribution

## 🌳 Workflow Git

### Branches
- **`main`** : Branche de production (stable, déployée)
- **`dev`** : Branche de développement (intégration des features)

### Workflow de développement
1. **Créer une feature branch** depuis `dev` :
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/nom-de-la-feature
   ```

2. **Développer et commiter** :
   ```bash
   git add .
   git commit -m "feat: ajouter nouvelle fonctionnalité"
   ```

3. **Pousser et créer une PR** :
   ```bash
   git push origin feature/nom-de-la-feature
   # Créer une PR vers 'dev' sur GitHub
   ```

4. **Après validation, merger vers `dev`**

5. **Déploiement en production** :
   - Créer une PR de `dev` vers `main`
   - Après validation, merger vers `main`
   - Déploiement automatique via GitHub Actions

## 📝 Convention de commits

Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/) :

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Types autorisés :
- **feat** : Nouvelle fonctionnalité
- **fix** : Correction de bug
- **docs** : Documentation
- **style** : Formatage, point-virgules manquants, etc.
- **refactor** : Refactoring de code
- **test** : Ajout ou modification de tests
- **chore** : Tâches de maintenance

### Exemples :
```bash
git commit -m "feat(auth): ajouter authentification 2FA"
git commit -m "fix(invoice): corriger calcul TVA"
git commit -m "docs: mettre à jour README"
```

## 🔧 Outils de développement

### Pre-commit hooks
Les hooks Git vérifient automatiquement :
- Lint (ESLint)
- Formatage (Prettier)
- Qualité du code

### Scripts disponibles
```bash
# Développement
npm run dev                 # Lancer l'app en dev
npm run dev:frontend       # Frontend seulement
npm run dev:backend        # Backend seulement

# Qualité du code
npm run lint               # Linter
npm run format             # Formater le code
npm run lint:staged        # Lint des fichiers modifiés

# Tests
npm run test               # Lancer les tests
npm run test:coverage      # Tests avec couverture

# Documentation
npm run storybook          # Documentation des composants

# Performance
npm run analyze            # Analyser la taille des bundles

# Production
docker build -f Dockerfile.prod  # Build Docker optimisé
```

## 🚀 Déploiement

### Développement
- Branche `dev` : Intégration continue
- Tests automatiques sur chaque push/PR

### Production
- Branche `main` : Déploiement automatique
- Image Docker optimisée
- Vérifications de sécurité

## 🐛 Signaler un bug

1. Vérifier que le bug n'existe pas déjà dans les issues
2. Créer une issue avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Environnement (OS, navigateur, etc.)
   - Captures d'écran si nécessaire

## ✨ Proposer une feature

1. Créer une issue pour discuter de la feature
2. Attendre l'approbation
3. Créer une branche feature
4. Implémenter avec des tests
5. Créer une PR vers `dev`

## 📋 Checklist PR

- [ ] Code testé localement
- [ ] Tests passent
- [ ] Lint/format OK
- [ ] Documentation mise à jour
- [ ] Commit messages conformes
- [ ] PR title descriptif
- [ ] Description détaillée des changements
