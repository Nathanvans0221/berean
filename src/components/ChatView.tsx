import { useState, useRef, useEffect } from 'react';
import { Send, Square, Download, BookOpen } from 'lucide-react';
import type { Chat } from '../types';
import { getTheologian } from '../data/theologians';
import { MessageBubble, StreamingBubble } from './MessageBubble';
import { exportChat } from '../utils/storage';

interface ChatViewProps {
  chat: Chat | null;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  selectedTheologian: string;
  onSendMessage: (chatId: string, content: string) => void;
  onStopStreaming: () => void;
  onNewChat: () => void;
}

const SUGGESTED_QUESTIONS = [
  'What does it mean that God is sovereign over salvation?',
  'Explain Romans 9 and the doctrine of election.',
  'What is the relationship between faith and works in James 2?',
  'How should we understand the Lord\'s Supper?',
  'What does "total depravity" actually mean?',
  'Explain the difference between justification and sanctification.',
];

export function ChatView({
  chat,
  isStreaming,
  streamingContent,
  error,
  selectedTheologian,
  onSendMessage,
  onStopStreaming,
  onNewChat,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const theologian = getTheologian(selectedTheologian);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, streamingContent]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [chat?.id]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    if (!chat) {
      onNewChat();
      return;
    }
    onSendMessage(chat.id, trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExport = () => {
    if (!chat) return;
    const markdown = exportChat(chat);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berean-${chat.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Empty state — no active chat
  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-navy-900 px-8">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center mx-auto mb-6">
            <BookOpen size={32} className="text-gold-400" />
          </div>
          <h2 className="text-2xl font-serif text-white mb-2">Begin Your Study</h2>
          <p className="text-white/40 mb-8">
            Select a theologian from the sidebar and start a conversation. Ask questions
            about Scripture, doctrine, or theology and receive responses grounded in their
            actual published works and positions.
          </p>

          {theologian && (
            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: theologian.color }}
                >
                  {theologian.avatar}
                </div>
                <div>
                  <div className="text-white font-medium">{theologian.name}</div>
                  <div className="text-white/40 text-xs">{theologian.years} &middot; {theologian.tradition}</div>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">{theologian.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs text-white/30 uppercase tracking-wider mb-3">
              Try asking
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    onNewChat();
                    setInput(q);
                  }}
                  className="text-left px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-white/60 text-sm hover:bg-white/10 hover:text-white/80 transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-navy-900">
      {/* Chat Header */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {theologian && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: theologian.color }}
            >
              {theologian.avatar}
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-white truncate max-w-md">
              {chat.title}
            </div>
            <div className="text-xs text-white/30">
              {theologian?.name} &middot; {chat.messages.length} messages
            </div>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
          title="Export conversation"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
        {chat.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <StreamingBubble
            content={streamingContent}
            theologianId={chat.theologianId}
          />
        )}
        {error && (
          <div className="mx-auto max-w-md text-center animate-fade-in">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${theologian?.shortName || 'a question'}...`}
              rows={1}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/30 resize-none"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          {isStreaming ? (
            <button
              onClick={onStopStreaming}
              className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={18} />
            </button>
          )}
        </div>
        <div className="text-[10px] text-white/20 mt-2 text-center">
          Responses represent theological positions, not personal advice. Always verify with Scripture. Acts 17:11
        </div>
      </div>
    </div>
  );
}
