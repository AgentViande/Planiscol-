import React, { useEffect, useState } from 'react'
import { Minus, Square, Copy, X, Sparkles, Command } from 'lucide-react'

interface TitleBarProps {
  onOpenQuickAdd: () => void
  onOpenCommandPalette: () => void
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenQuickAdd, onOpenCommandPalette }) => {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (window.api) {
      window.api.window.isMaximized().then(setIsMaximized)
    }
  }, [])

  const handleMinimize = (): void => {
    window.api?.window.minimize()
  }

  const handleMaximize = async (): Promise<void> => {
    if (window.api) {
      window.api.window.maximize()
      const max = await window.api.window.isMaximized()
      setIsMaximized(max)
    }
  }

  const handleClose = (): void => {
    window.api?.window.close()
  }

  return (
    <header className="h-10 bg-slate-950/80 border-b border-white/5 flex items-center justify-between px-3 select-none titlebar-drag-region z-50">
      {/* Logo & App Name */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
          <span className="text-[11px] font-bold text-white">P</span>
        </div>
        <span className="font-display font-semibold text-xs tracking-wider uppercase text-slate-200">
          Planiscol
        </span>
      </div>

      {/* Quick Actions Shortcuts in TitleBar */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors border border-white/5"
          title="Ajout rapide en langage naturel (Ctrl+Space)"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Ajout Rapide</span>
          <kbd className="text-[10px] bg-white/10 px-1 py-0.5 rounded text-slate-400">Ctrl+Space</kbd>
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors border border-white/5"
          title="Palette de commandes (Ctrl+K)"
        >
          <Command className="w-3.5 h-3.5 text-slate-400" />
          <kbd className="text-[10px] bg-white/10 px-1 py-0.5 rounded text-slate-400">Ctrl+K</kbd>
        </button>
      </div>

      {/* Windows Window Controls */}
      <div className="flex items-center titlebar-no-drag">
        <button
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
          title="Réduire"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
          title={isMaximized ? 'Restaurer' : 'Agrandir'}
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>

        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white text-slate-400 transition-colors"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
