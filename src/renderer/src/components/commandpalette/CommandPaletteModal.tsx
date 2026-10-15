import React, { useState, useEffect } from 'react'
import {
  Command,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  Sparkles,
  Download,
  Moon,
  Sun,
  Search
} from 'lucide-react'
import { useSettingsStore } from '../../stores/useSettingsStore'

interface CommandPaletteModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tab: 'dashboard' | 'todo' | 'calendar' | 'subjects' | 'grades' | 'settings') => void
  onOpenQuickAdd: () => void
  onOpenPomodoro: () => void
  onOpenCreateTask: () => void
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenQuickAdd,
  onOpenPomodoro,
  onOpenCreateTask
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { updateSettings } = useSettingsStore()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const commands = [
    {
      id: 'quick-add',
      title: 'Ajout Rapide en Langage Naturel',
      category: 'Actions',
      icon: Sparkles,
      action: () => {
        onClose()
        onOpenQuickAdd()
      }
    },
    {
      id: 'create-task',
      title: 'Créer une nouvelle tâche',
      category: 'Actions',
      icon: CheckSquare,
      action: () => {
        onClose()
        onOpenCreateTask()
      }
    },
    {
      id: 'pomodoro',
      title: 'Ouvrir le minuteur Pomodoro',
      category: 'Actions',
      icon: Clock,
      action: () => {
        onClose()
        onOpenPomodoro()
      }
    },
    {
      id: 'nav-dash',
      title: 'Aller au Tableau de bord',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => {
        onClose()
        onNavigate('dashboard')
      }
    },
    {
      id: 'nav-todo',
      title: 'Aller aux Tâches (To-Do List)',
      category: 'Navigation',
      icon: CheckSquare,
      action: () => {
        onClose()
        onNavigate('todo')
      }
    },
    {
      id: 'nav-cal',
      title: 'Aller à l’Agenda & Calendrier',
      category: 'Navigation',
      icon: Calendar,
      action: () => {
        onClose()
        onNavigate('calendar')
      }
    },
    {
      id: 'nav-sub',
      title: 'Aller aux Matières & Cours',
      category: 'Navigation',
      icon: BookOpen,
      action: () => {
        onClose()
        onNavigate('subjects')
      }
    },
    {
      id: 'nav-grades',
      title: 'Aller au Suivi des Notes',
      category: 'Navigation',
      icon: GraduationCap,
      action: () => {
        onClose()
        onNavigate('grades')
      }
    },
    {
      id: 'theme-dark',
      title: 'Activer le Thème Sombre',
      category: 'Apparence',
      icon: Moon,
      action: () => {
        updateSettings({ theme: 'dark' })
        onClose()
      }
    },
    {
      id: 'theme-light',
      title: 'Activer le Thème Clair',
      category: 'Apparence',
      icon: Sun,
      action: () => {
        updateSettings({ theme: 'light' })
        onClose()
      }
    },
    {
      id: 'backup',
      title: 'Créer une sauvegarde locale instantanée',
      category: 'Sauvegarde',
      icon: Download,
      action: async () => {
        if (window.api) {
          await window.api.db.createBackup()
          window.api.notification.show({
            title: 'Sauvegarde créée',
            body: 'Un instantané complet a été enregistré dans le dossier utilisateur.'
          })
        }
        onClose()
      }
    }
  ]

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="glass-panel-elevated w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="p-3.5 border-b border-white/5 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tapez une commande ou cherchez un écran..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400">ESC</kbd>
        </div>

        {/* List of items */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Aucune commande trouvée.</p>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon
              const isSelected = index === selectedIndex
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-accent/20 text-white font-medium border border-accent/30'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-slate-400'}`} />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded bg-white/5">
                    {item.category}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
