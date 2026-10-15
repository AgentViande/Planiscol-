# Journal des modifications (Changelog) — Planiscol

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [1.1.0] - 2026-10-15

### Ajouts (Features)
- **Nouvelle Vue Kanban interactive** :
  - Déplacement fluide des tâches par glisser-déposer (`@dnd-kit` et animations `Framer Motion`).
  - Colonnes par défaut : *À faire*, *En cours*, *Terminé* avec confettis de célébration.
  - Cartes de tâches riches et compactes : bande de matière, badge de priorité accessible (icône + couleur + libellé), échéance intelligente (« En retard », « Demain », « Ven. 18h »), barre de progression des sous-tâches, compteur de documents attachés avec détection des liens cassés, tags.
  - Clic direct sur carte ouvrant la fiche détaillée complète (`TaskDetailModal`).
  - **Création rapide** en bas de chaque colonne avec saisie immédiate et statut pré-appliqué.
  - **Couloirs horizontaux (Swimlanes)** : regroupement au choix par matière ou par priorité.
  - **Tri interne configurable** : manuel (position sauvegardée en base), par date d'échéance ou par priorité.
  - **Option de masquage** automatique des tâches terminées depuis plus de 7 jours.
  - **Colonnes personnalisables** : ajout, renommage, réordonnancement et suppression de colonnes (avec règle de sécurité garantissant qu'au moins une colonne existe pour chaque statut fondamental).
  - **Annuler / Rétablir (Ctrl+Z / Ctrl+Y)** : historique dédié pour les déplacements de cartes.
  - **Triple synchronisation instantanée** : basculement fluide et cohérence temps réel entre la To-do list, le Tableau Kanban et l'Agenda.
  - Onglet Kanban dans la barre latérale, sélecteur d'affichage et raccourci clavier de navigation (`Ctrl+3`).
  - Ajout de la commande « Aller au Tableau Kanban » dans la palette de commandes (`Ctrl+K`).
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
