import { useState } from 'react';
import { X, Key, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export function SettingsModal({ isOpen, apiKey, onSave, onClose }: SettingsModalProps) {
  const [key, setKey] = useState(apiKey);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-navy-900 border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-serif text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              <div className="flex items-center gap-2">
                <Key size={14} />
                Anthropic API Key
              </div>
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/30"
            />
            <div className="flex items-start gap-2 mt-2 text-xs text-white/30">
              <Info size={12} className="shrink-0 mt-0.5" />
              <p>
                Your API key is stored locally in your browser and sent directly to
                Anthropic's API. It is never stored on any server. Get a key at{' '}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 hover:text-gold-300"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(key);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gold-500/20 text-gold-400 text-sm font-medium hover:bg-gold-500/30 transition-all cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
