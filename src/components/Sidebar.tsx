import { Plus, Trash2 } from 'lucide-react';
import type { Chat } from '../types';
import { theologians, getTheologian } from '../data/theologians';

interface SidebarProps {
  chats: Chat[];
  activeChat: string | null;
  selectedTheologian: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onSelectTheologian: (id: string) => void;
}

export function Sidebar({
  chats,
  activeChat,
  selectedTheologian,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onSelectTheologian,
}: SidebarProps) {
  return (
    <aside className="w-72 bg-navy-950 border-r border-white/10 flex flex-col h-full">
      {/* Theologian Selector */}
      <div className="p-4 border-b border-white/10">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
          Study With
        </label>
        <div className="space-y-1">
          {theologians.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTheologian(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                selectedTheologian === t.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: t.color }}
              >
                {t.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{t.name}</div>
                <div className="text-xs text-white/30 truncate">{t.tradition}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition-all text-sm font-medium cursor-pointer"
        >
          <Plus size={16} />
          New Study Session
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
        <div className="text-xs font-medium text-white/30 uppercase tracking-wider mb-2 px-1">
          History
        </div>
        {chats.length === 0 ? (
          <div className="text-center text-white/20 text-sm py-8">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {chats.map((chat) => {
              const theologian = getTheologian(chat.theologianId);
              return (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    activeChat === chat.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: theologian?.color || '#666' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{chat.title}</div>
                    <div className="text-xs text-white/20">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
