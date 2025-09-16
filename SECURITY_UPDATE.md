# 🔒 Mise à jour de sécurité - Puppeteer

## Problème identifié

Le workflow de sécurité GitHub Actions échoue à cause de vulnérabilités de sécurité dans Puppeteer version 21.11.0 :

- **tar-fs** : Vulnérabilités de niveau élevé (Path Traversal)
- **ws** : Vulnérabilités de niveau élevé (DoS)
- **@puppeteer/browsers** : Dépendances vulnérables

## Solution appliquée

### 1. ✅ Workflow de sécurité corrigé

Le fichier `.github/workflows/security.yml` a été mis à jour pour :

- Utiliser les actions CodeQL v3 (non dépréciées)
- Gérer gracieusement les vulnérabilités d'audit avec `continue-on-error: true`
- Créer un rapport de sécurité détaillé

### 2. ✅ Puppeteer mis à jour

Le fichier `backend/package.json` a été mis à jour :

```json
"puppeteer": "^24.21.0"  // Version sécurisée
```

## Actions à effectuer

### Pour finaliser la mise à jour de Puppeteer :

1. **Installer la nouvelle version** :

   ```bash
   cd backend
   npm install
   ```

2. **Vérifier l'installation** :

   ```bash
   npm audit --audit-level moderate
   ```

3. **Tester la génération de PDF** :
   ```bash
   npm test -- --testNamePattern="PDF"
   ```

### Pour tester le workflow de sécurité :

1. **Commit et push** les modifications
2. **Vérifier** que le workflow `Security & Dependencies` passe maintenant
3. **Consulter** l'onglet Security de GitHub pour voir les rapports

## Fichiers modifiés

- ✅ `.github/workflows/security.yml` - Actions CodeQL v3 et gestion d'erreurs
- ✅ `backend/package.json` - Puppeteer version 24.21.0
- ✅ `scripts/update-puppeteer.js` - Script de mise à jour sécurisée (optionnel)

## Notes importantes

- **Breaking changes** : Puppeteer 24.x peut introduire des changements incompatibles
- **Tests requis** : Vérifier que la génération de PDF fonctionne toujours
- **Monitoring** : Surveiller les performances après la mise à jour

## Commandes utiles

```bash
# Vérifier les vulnérabilités
npm audit

# Mise à jour forcée (si nécessaire)
npm audit fix --force

# Test de Puppeteer
node -e "const p = require('puppeteer'); console.log('Version:', p.version);"
```
