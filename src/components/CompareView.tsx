import { useState, useRef, useMemo } from 'react';
import { Send, Square, BookOpen, GitCompareArrows } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Message, CompareChat } from '../types';
import { theologians, getTheologian } from '../data/theologians';
import { streamTheologianResponse } from '../api/claude';
import { StreamingBubble, MessageBubble } from './MessageBubble';
import { loadCompareChats, saveCompareChats } from '../utils/storage';

interface CompareViewProps {
  apiKey: string;
}

export function CompareView({ apiKey }: CompareViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(['sproul', 'macarthur']);
  const [question, setQuestion] = useState('');
  const [compareChats, setCompareChats] = useState<CompareChat[]>(() => loadCompareChats());
  const [activeCompare, setActiveCompare] = useState<CompareChat | null>(null);
  const [streamingStates, setStreamingStates] = useState<Record<string, { content: string; done: boolean }>>({});
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRefs = useRef<Record<string, AbortController>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleTheologian = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    const trimmed = question.trim();
    if (!trimmed || selectedIds.length < 2 || isComparing) return;

    setError(null);
    setIsComparing(true);

    const chat: CompareChat = {
      id: uuidv4(),
      title: trimmed.length > 60 ? trimmed.slice(0, 57) + '...' : trimmed,
      question: trimmed,
      theologianIds: [...selectedIds],
      responses: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setActiveCompare(chat);
    setQuestion('');

    const initialStreaming: Record<string, { content: string; done: boolean }> = {};
    for (const id of selectedIds) {
      initialStreaming[id] = { content: '', done: false };
    }
    setStreamingStates(initialStreaming);

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    // Stream all theologians in parallel
    const promises = selectedIds.map(async (theologianId) => {
      const theologian = getTheologian(theologianId);
      if (!theologian) return;

      const controller = new AbortController();
      abortRefs.current[theologianId] = controller;

      await streamTheologianResponse(
        theologian,
        [userMsg],
        apiKey,
        {
          onToken: (token) => {
            setStreamingStates((prev) => ({
              ...prev,
              [theologianId]: {
                content: (prev[theologianId]?.content || '') + token,
                done: false,
              },
            }));
          },
          onDone: (fullText) => {
            const assistantMsg: Message = {
              id: uuidv4(),
              role: 'assistant',
              content: fullText,
              theologianId,
              timestamp: Date.now(),
            };
            chat.responses[theologianId] = [userMsg, assistantMsg];
            setStreamingStates((prev) => ({
              ...prev,
              [theologianId]: { content: fullText, done: true },
            }));
          },
          onError: (errMsg) => {
            setStreamingStates((prev) => ({
              ...prev,
              [theologianId]: { content: `Error: ${errMsg}`, done: true },
            }));
          },
        },
        controller.signal
      );
    });

    await Promise.all(promises);

    chat.updatedAt = Date.now();
    const updated = [chat, ...compareChats];
    setCompareChats(updated);
    saveCompareChats(updated);
    setIsComparing(false);
    setActiveCompare(chat);
  };

  const stopAll = () => {
    Object.values(abortRefs.current).forEach((c) => c.abort());
    setIsComparing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCompare();
    }
  };

  const allDone = useMemo(
    () => Object.values(streamingStates).every((s) => s.done),
    [streamingStates]
  );

  return (
    <div className="flex-1 flex flex-col bg-navy-900">
      {/* Compare Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <GitCompareArrows size={20} className="text-gold-400" />
          <h2 className="text-lg font-serif text-white">Compare Theological Views</h2>
        </div>
        <p className="text-white/40 text-sm mb-4">
          Ask a question and see how different theologians would respond side by side.
        </p>

        {/* Theologian Selection */}
        <div className="flex gap-2 mb-4">
          {theologians.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTheologian(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer border ${
                selectedIds.includes(t.id)
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/5 text-white/30 hover:text-white/50 hover:border-white/10'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{
                  backgroundColor: selectedIds.includes(t.id)
                    ? t.color
                    : t.color + '40',
                }}
              >
                {t.avatar}
              </div>
              {t.shortName}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a theological question to compare perspectives..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/30 resize-none"
          />
          {isComparing ? (
            <button
              onClick={stopAll}
              className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleCompare}
              disabled={!question.trim() || selectedIds.length < 2}
              className="p-3 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Comparison Results */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {activeCompare ? (
          <div>
            <div className="mb-4 px-4 py-3 bg-navy-800 rounded-xl border border-white/10">
              <div className="text-xs text-white/30 mb-1">Question</div>
              <div className="text-white text-sm">{activeCompare.question}</div>
            </div>

            <div className={`grid gap-4 ${selectedIds.length === 2 ? 'grid-cols-2' : selectedIds.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {selectedIds.map((id) => {
                const theologian = getTheologian(id);
                if (!theologian) return null;

                const state = streamingStates[id];
                const savedResponse = activeCompare.responses[id]?.find(
                  (m) => m.role === 'assistant'
                );

                return (
                  <div key={id} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                    <div
                      className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2"
                      style={{ borderBottomColor: theologian.color + '40' }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: theologian.color }}
                      >
                        {theologian.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {theologian.name}
                        </div>
                        <div className="text-[10px] text-white/30">
                          {theologian.tradition}
                        </div>
                      </div>
                      {state && !state.done && (
                        <div className="ml-auto flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-sm text-white/80 leading-relaxed max-h-[60vh] overflow-y-auto scrollbar-thin">
                      {state?.content ? (
                        <CompareContent content={state.content} />
                      ) : savedResponse ? (
                        <CompareContent content={savedResponse.content} />
                      ) : (
                        <div className="text-white/20 italic">Waiting...</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-4">
              <GitCompareArrows size={28} className="text-gold-400/60" />
            </div>
            <h3 className="text-white/60 font-serif text-lg mb-2">
              Compare Perspectives
            </h3>
            <p className="text-white/30 text-sm max-w-md">
              Select two or more theologians above, ask a question, and see their
              different perspectives side by side. Great for understanding how faithful
              scholars can reach different conclusions from the same Scriptures.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareContent({ content }: { content: string }) {
  // Simple markdown rendering for compare view
  let html = content;
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="text-gold-300">$1</em>');
  html = html.replace(/^### (.+)$/gm, '<h4 class="text-white font-semibold mt-3 mb-1 text-sm">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="text-white font-semibold mt-3 mb-1">$1</h3>');
  html = html.replace(/^---$/gm, '<hr class="border-white/10 my-3" />');
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-white/70 text-sm">$1</li>');
  html = html.replace(
    /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d+:\d+(?:-\d+)?)/g,
    '<span class="text-gold-400 font-medium">$1 $2</span>'
  );
  html = html.replace(/\n\n/g, '</p><p class="mb-2">');
  html = '<p class="mb-2">' + html + '</p>';

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
