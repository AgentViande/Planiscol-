# Journal des modifications (Changelog) — Planiscol

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [1.2.0] - 2026-10-16

### Ajouts (Features)
- **Mode Plein Écran Immersif Pomodoro (Focus Mode)** :
  - Minuteur circulaire SVG grand format avec animations fluides `Framer Motion`.
  - Précision d'horloge absolue (`Date.now()`), totalement insensible au throttling d'arrière-plan, aux ralentissements et à la mise en veille du système.
  - Gestion automatique des 3 phases : Travail, Pause courte, Pause longue (après 4 cycles configurables).
  - Synthétiseur audio doux et harmonique généré via Web Audio API, sans dépendance de fichier externe.
  - Mode silencieux activable à tout moment et option de passage automatique en plein écran OS natif.
  - Panneau latéral escamotable avec 4 onglets :
    - *Tâche* : détails complets, badge de matière, échéance et description.
    - *Sous-tâches* : liste interactive permettant de cocher et d'ajouter de nouvelles sous-tâches en cours de session.
    - *Documents* : consultation des fichiers et dossiers associés, bouton d'ouverture dans l'explorateur Windows et indicateur de liens introuvables.
    - *Notes* : éditeur de notes de session avec auto-sauvegarde continue.
  - Dialogue de fin de session avec sélection de l'action sur les notes (fusionner à la tâche, conserver en brouillon, ignorer).
  - Cumul en base de données du temps réel passé (`actualDuration`) et du nombre de sessions de focus (`focusSessionsCount`).
  - Déclenchement en 1 clic (« Se concentrer ») depuis la To-do list, les cartes Kanban et la modale de tâche.
  - Paramétrage fin dans l'onglet Paramètres (durée travail, pause courte, pause longue, cycles, cloche, plein écran).
- **Migration de base de données V3** :
  - Migration rétrocompatible automatique ajoutant les colonnes `actualDuration`, `focusSessionsCount` et `focusNotesDraft` sur la table `tasks`, ainsi que les préférences Pomodoro dans `user_settings`.

### Corrections de bugs (Fixes)
- **BUG 1 — Formulaire de tâche unifié (Fichiers liés et sous-tâches à la création)** :
  - Unification complète de la fenêtre `TaskDetailModal` pour la création et la modification de tâche.
  - Possibilité d'associer des fichiers locaux (sélecteur natif Windows ou glisser-déposer, avec politique de zéro copie locale) et d'ajouter des sous-tâches (réordonnancement haut/bas, renommage, suppression) dès la création.
  - Gestion sécurisée en mémoire (brouillon) : l'annulation ne persiste aucune donnée résiduelle.
  - Sauvegarde en une transaction atomique unique `saveTaskWithDetails` liant immédiatement la tâche, ses sous-tâches et ses documents.
  - Parité stricte de l'ensemble des champs (récurrence, rappels, tags, durée estimée, planificateur de révisions espacées).
- **BUG 2 — Diagnostic et fiabilisation du système de mise à jour automatique (electron-updater)** :
  - Résolution de la défaillance de détection : ajout de la recherche automatique au démarrage (5s) et d'une vérification périodique toutes les 4 heures dans le processus principal.
  - Journalisation persistante avec `electron-log` dans `planiscol-updater.log` et bouton « Ouvrir le journal de mise à jour » dans les paramètres.
  - Affichage temps réel dans les Paramètres : version installée, date/heure de dernière vérification, et état exact (`À jour`, `Recherche en cours...`, `Mise à jour disponible...`, ou libellé d'erreur détaillé).
  - Bannière flottante in-app non intrusive lors du téléchargement d'une mise à jour avec affichage des notes de version et bouton « Redémarrer et installer ».
  - Correction de la configuration d'installation `nsis.perMachine: false` dans `electron-builder.yml` pour fiabiliser les droits d'écriture sous Windows.
  - Script de test et validation de configuration : `npm run test:updater`.

## [1.1.0] - 2026-10-15

### Ajouts (Features)
- **Nouvelle Vue Kanban interactive** :
  - Déplacement fluide des tâches par glisser-déposer (`@dnd-kit` et animations `Framer Motion`).
  - Colonnes par défaut : *À faire*, *En cours*, *Terminé* avec confettis de célébration.
  - Cartes de tâches riches et compactes : bande de matière, badge de priorité accessible, échéance intelligente, progression des sous-tâches, compteur de documents avec vérification d'intégrité.
  - Création rapide, couloirs horizontaux (swimlanes par matière ou priorité), tri configurable, masquage automatique des tâches terminées et historique Annuler / Rétablir (`Ctrl+Z` / `Ctrl+Y`).
- **Migration de base de données V2** :
  - Ajout des champs `position` et `columnId` sur les tâches et de la table des colonnes Kanban sans perte de données existantes.
  - Suite complète de tests unitaires Vitest pour les déplacements, la synchronisation, les filtres et la migration rétrocompatible.

## [1.0.0] - 2026-10-15

### Ajouts (Features)
- Initialisation de Planiscol : agenda 100% scolaire et local pour Windows.
- Architecture sécurisée Electron (contextIsolation, nodeIntegration false, IPC typé).
- Système de gestion de base de données locale sécurisée avec transactions, sauvegardes rotatives et migrations.
- Vue To-do list synchronisée avec regroupement, filtres combinables, sections intelligentes et recherche.
- Vue Calendrier type Google Agenda avec FullCalendar personnalisé, créneaux en drag & drop et redimensionnement.
- Gestion des matières avec couleurs, professeurs, coefficients, salles et catégories.
- Attachement de fichiers locaux sans copie (ouverture OS, affichage dans le dossier, vérification d'intégrité).
- Dashboard avec compte à rebours de contrôles, vue du jour et statistiques.
- Suivi des notes et calcul des moyennes générales pondérées.
- Minuteur Pomodoro lié aux devoirs pour mesurer le temps de travail effectif.
- Ajout rapide en langage naturel (Ctrl+Space) et palette de commandes (Ctrl+K).
- Thèmes Sombre immersif, Clair moderne et Système avec personnalisation de la couleur d'accent.
- Workflow Antigravity `/publier` et GitHub Actions de packaging Windows NSIS avec `electron-updater`.
