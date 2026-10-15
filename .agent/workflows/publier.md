---
description: Workflow automatique de release et publication pour Planiscol
---

# Workflow de Publication (/publier)

Ce workflow automatise l'ensemble du cycle de versionnage, de validation qualité et de publication sur GitHub pour Planiscol.

## Étapes exécutées par l'agent :

1. **Vérification du Working Tree Git**
   - Exécute `git status --porcelain`.
   - S'il reste des modifications non commitées, propose ou effectue un commit propre selon la convention : `fix:` ou `feat:` selon les changements.

2. **Validation Qualité Stricte**
   - Lance la suite de tests unitaires : `npm run test`.
   - Lance la compilation et le build : `npm run build`.
   - En cas d'échec sur l'une de ces étapes : **ARRÊT IMMÉDIAT** et rapport de l'erreur à l'utilisateur sans modifier de version ni pousser sur Git.

3. **Détermination de la Version (SemVer)**
   - Lit la version actuelle dans `package.json`.
   - Analyse les commits depuis le dernier tag (ou demande confirmation si non spécifié) :
     - `patch` (ex: 1.0.0 -> 1.0.1) pour des corrections de bugs (`fix:`).
     - `minor` (ex: 1.0.0 -> 1.1.0) pour de nouvelles fonctionnalités (`feat:`).
     - `major` (ex: 1.0.0 -> 2.0.0) pour des ruptures d'API ou refontes majeures (`BREAKING CHANGE`).

4. **Mise à jour des Fichiers & Changelog**
   - Met à jour le champ `"version"` dans `package.json`.
   - Met à jour ou génère la section correspondante dans `CHANGELOG.md` avec la date du jour et la liste structurée des changements groupés par type (`Fonctionnalités`, `Corrections`, etc.).

5. **Commit de Release & Tag Git**
   - Crée le commit de release :
     ```bash
     git add package.json CHANGELOG.md
     git commit -m "chore(release): vX.Y.Z"
     ```
   - Crée le tag Git annoté :
     ```bash
     git tag -a vX.Y.Z -m "Release vX.Y.Z"
     ```

6. **Publication vers GitHub**
   - Pousse la branche et le tag vers le dépôt distant :
     ```bash
     git push origin main
     git push origin vX.Y.Z
     ```
   - Le push du tag déclenche automatiquement le workflow GitHub Actions `.github/workflows/release.yml` qui compile l'installeur Windows `.exe` et publie la Release GitHub avec `latest.yml` pour `electron-updater`.

7. **Rapport Final**
   - Confirme à l'utilisateur le numéro de version publié, le lien vers la Release GitHub et le statut du déploiement.
