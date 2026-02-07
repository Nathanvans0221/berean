import { BookOpen, GitCompareArrows, Settings } from 'lucide-react';
import type { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onSettingsClick: () => void;
}

export function Header({ currentView, onViewChange, onSettingsClick }: HeaderProps) {
  const navItems: { view: ViewMode; label: string; icon: React.ReactNode }[] = [
    { view: 'chat', label: 'Study', icon: <BookOpen size={18} /> },
    { view: 'compare', label: 'Compare Views', icon: <GitCompareArrows size={18} /> },
  ];

  return (
    <header className="bg-navy-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
            <BookOpen size={18} className="text-gold-400" />
          </div>
          <h1 className="text-lg font-semibold text-white font-serif tracking-wide">
            Berean
          </h1>
        </div>

        <nav className="ml-8 flex gap-1">
          {navItems.map(({ view, label, icon }) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentView === view
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all cursor-pointer"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
