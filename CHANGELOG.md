# Journal des modifications (Changelog) — Planiscol

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

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
