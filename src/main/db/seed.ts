import { Subject, UserSettings } from './types'

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accentColor: '#6366f1', // Indigo Vibrant
  schoolLevel: 'lycee',
  autoUpdate: true,
  closeToTray: true,
  launchAtStartup: false,
  reminderNotifications: true,
  onboardingCompleted: false,
  pomodoroWorkDuration: 25,
  pomodoroBreakDuration: 5
}

export function getDefaultSubjects(schoolLevel: 'college' | 'lycee' | 'superieur'): Subject[] {
  const now = new Date().toISOString()
  
  if (schoolLevel === 'college') {
    return [
      {
        id: 'sub-maths',
        name: 'Mathématiques',
        category: 'Sciences',
        color: '#3b82f6', // Bleu
        icon: '📐',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-francais',
        name: 'Français',
        category: 'Lettres & Langues',
        color: '#ef4444', // Rouge
        icon: '📖',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-histoire',
        name: 'Histoire-Géographie & EMC',
        category: 'Sciences Humaines',
        color: '#f97316', // Orange
        icon: '🌍',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-svt',
        name: 'Sciences de la Vie et de la Terre',
        category: 'Sciences',
        color: '#10b981', // Vert émeraude
        icon: '🧬',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-physique',
        name: 'Physique-Chimie',
        category: 'Sciences',
        color: '#06b6d4', // Cyan
        icon: '⚡',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-anglais',
        name: 'Anglais (LV1)',
        category: 'Lettres & Langues',
        color: '#8b5cf6', // Violet
        icon: '🇬🇧',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-espagnol',
        name: 'Espagnol (LV2)',
        category: 'Lettres & Langues',
        color: '#ec4899', // Rose
        icon: '🇪🇸',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-techno',
        name: 'Technologie',
        category: 'Sciences',
        color: '#64748b', // Slate
        icon: '💻',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-eps',
        name: 'EPS',
        category: 'Sport',
        color: '#84cc16', // Lime
        icon: '🏃',
        coefficient: 1,
        createdAt: now,
        updatedAt: now
      }
    ]
  }

  if (schoolLevel === 'superieur') {
    return [
      {
        id: 'sub-maths-app',
        name: 'Mathématiques & Algorithmique',
        category: 'Sciences Fondamentales',
        color: '#3b82f6',
        icon: '∑',
        coefficient: 3,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-info',
        name: 'Informatique & Programmation',
        category: 'Ingénierie',
        color: '#6366f1',
        icon: '💻',
        coefficient: 4,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-physique-sup',
        name: 'Physique Appliquée / Électronique',
        category: 'Ingénierie',
        color: '#06b6d4',
        icon: '⚛️',
        coefficient: 3,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-anglais-pro',
        name: 'Anglais Professionnel & Toeic',
        category: 'Langues & Communication',
        color: '#8b5cf6',
        icon: '🌐',
        coefficient: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-gestion',
        name: 'Management & Droit de l’Entreprise',
        category: 'Sciences Humaines',
        color: '#f59e0b',
        icon: '📊',
        coefficient: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sub-projet',
        name: 'Projet Semestriel',
        category: 'Projets & Ateliers',
        color: '#10b981',
        icon: '🚀',
        coefficient: 5,
        createdAt: now,
        updatedAt: now
      }
    ]
  }

  // Par défaut : Lycée
  return [
    {
      id: 'sub-maths-lycee',
      name: 'Mathématiques',
      category: 'Sciences',
      color: '#3b82f6',
      icon: '📐',
      coefficient: 5,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sub-physique-lycee',
      name: 'Physique-Chimie',
      category: 'Sciences',
      color: '#06b6d4',
      icon: '⚡',
      coefficient: 5,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sub-svt-lycee',
      name: 'Sciences de la Vie et de la Terre',
      category: 'Sciences',
      color: '#10b981',
      icon: '🧬',
      coefficient: 5,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sub-francais-lycee',
      name: 'Français / Philosophie',
      category: 'Lettres & Humanités',
      color: '#ef4444',
      icon: '📜',
      coefficient: 5,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sub-histoire-lycee',
      name: 'Histoire-Géographie & Géopolitique',
      category: 'Sciences Humaines',
      color: '#f97316',
      icon: '🏛️',
      coefficient: 3,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sub-anglais-lycee',
      name: 'Anglais (LVA)',
      category: 'Langues',
      color: '#8b5cf6',
      icon: '🇬🇧',
      coefficient: 3,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sub-espagnol-lycee',
      name: 'Espagnol (LVB)',
      category: 'Langues',
      color: '#ec4899',
      icon: '🇪🇸',
      coefficient: 3,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sub-ses-lycee',
      name: 'Sciences Économiques et Sociales',
      category: 'Sciences Humaines',
      color: '#f59e0b',
      icon: '📈',
      coefficient: 4,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'sub-eps-lycee',
      name: 'EPS',
      category: 'Sport',
      color: '#84cc16',
      icon: '🏃',
      coefficient: 2,
      createdAt: now,
      updatedAt: now
    }
  ]
}
