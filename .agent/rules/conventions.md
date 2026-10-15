# Conventions de Développement — Planiscol

Ce document définit les normes architecturales, les règles de sécurité et les standards de code applicables au projet **Planiscol**.

---

## 1. Sécurité Electron (Non Négociable)

1. **Isolation de contexte & Node Integration** :
   - `contextIsolation: true` impératif sur toutes les fenêtres `BrowserWindow`.
   - `nodeIntegration: false` impératif.
   - Jamais d'accès direct aux modules Node.js (`fs`, `child_process`, etc.) depuis le renderer.
2. **Preload & IPC typé** :
   - Toute interaction système passe par `contextBridge.exposeInMainWorld('api', {...})`.
   - Les arguments reçus dans `ipcMain.handle` doivent être vérifiés et assainis.
   - Les canaux IPC doivent être documentés et typés dans `src/preload/index.d.ts`.
3. **Ouverture de fichiers et liens externes** :
   - Utiliser exclusivement `shell.openPath` et `shell.showItemInFolder`.
   - Les liens web externes doivent s'ouvrir avec `shell.openExternal` après validation de protocole (`http:` ou `https:` uniquement).

---

## 2. Règle Absolue : Jamais de Copie de Fichiers Utilisateur

1. **Stockage par référence uniquement** :
   - Lorsqu'un utilisateur associe un document (PDF, Word, image, etc.) ou un dossier de cours à une tâche ou matière, l'application enregistre **strictement** le chemin d'accès absolu (`file_path`).
   - Le fichier ne doit **JAMAIS** être copié, déplacé, renommé ou dupliqué dans les répertoires internes de l'application ou dans `userData`.
2. **Détection des liens rompus** :
   - Avant de tenter d'ouvrir un fichier ou lors de l'affichage du détail d'une tâche, le renderer interroge le Main Process pour vérifier l'existence (`fs.existsSync`).
   - Si le fichier est manquant ou déplacé, un statut d'avertissement visuel clair est affiché avec option de relocalisation manuelle.
3. **Tests de conformité** :
   - Des tests automatisés (Vitest) doivent valider en continu qu'aucun octet n'est copié lors de l'attachement d'un fichier.

---

## 3. Persistance et Intégrité des Données

1. **Local-first et Zéro Télémétrie** :
   - 100% des données restent sur la machine de l'utilisateur (`app.getPath('userData')`).
   - Aucun envoi vers un serveur externe, aucune collecte de données personnelles.
2. **Gestion des Moteurs de Base de Données** :
   - SQLite via `better-sqlite3` avec gestion transactionnelle (`db.transaction()`).
   - Mécanisme de fallback transparent vers un stockage JSON atomique pour assurer la portabilité et le bon fonctionnement immédiat quel que soit l'environnement hôte.
3. **Sauvegardes automatiques rotatives** :
   - Les 10 dernières sauvegardes sont automatiquement conservées sous format JSON horodaté dans `userData/backups/`.
4. **Migrations versionnées** :
   - Chaque modification de structure passe par la table `schema_migrations` afin de garantir que les mises à jour logicielles n'écrasent jamais les données existantes.

---

## 4. Conventions de Commits (Conventional Commits)

Les messages de commit doivent respecter rigoureusement le standard [Conventional Commits](https://www.conventionalcommits.org/) :
- `feat: <description>` : Nouvelle fonctionnalité utilisateur.
- `fix: <description>` : Correction de bug.
- `chore: <description>` : Tâches de maintenance, dépendances, configuration.
- `refactor: <description>` : Refactorisation sans changement de comportement.
- `style: <description>` : Ajustements de style, design system, CSS.
- `test: <description>` : Ajout ou correction de tests.
- `docs: <description>` : Documentation, README, guides.
- `chore(release): vX.Y.Z` : Commits de release générés automatiquement.

---

## 5. Qualité de Code & TypeScript

- TypeScript en mode `strict: true` sans exceptions.
- Pas de `any` non justifié ; typer l'ensemble des payloads IPC et des modèles de domaine.
- Composants React modulaires, réutilisables, séparés de la logique métier (stores Zustand).
- Commentaires et documentation d'architecture rédigés en français.
