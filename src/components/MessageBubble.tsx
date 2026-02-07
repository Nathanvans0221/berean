import { useMemo } from 'react';
import { User, BookMarked } from 'lucide-react';
import type { Message } from '../types';
import { getTheologian } from '../data/theologians';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function parseMarkdown(text: string): string {
  let html = text;

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-black/30 rounded-lg p-3 my-2 overflow-x-auto text-sm"><code>$2</code></pre>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em class="text-gold-300 italic">$1</em>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4 class="text-white font-semibold mt-4 mb-1 text-sm">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="text-white font-semibold mt-4 mb-2">$1</h3>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-white/10 my-4" />');

  // Bullet points
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-white/80">$1</li>');

  // Scripture references - highlight them
  html = html.replace(
    /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d+:\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)/g,
    '<span class="text-gold-400 font-medium cursor-help" title="Scripture Reference">$1 $2</span>'
  );

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="mb-3">');
  html = '<p class="mb-3">' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p class="mb-3"><\/p>/g, '');

  return html;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const theologian = message.theologianId ? getTheologian(message.theologianId) : null;
  const isUser = message.role === 'user';

  const parsedContent = useMemo(() => parseMarkdown(message.content), [message.content]);

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1"
          style={{ backgroundColor: theologian?.color || '#4263eb' }}
        >
          {theologian?.avatar || <BookMarked size={16} />}
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
        {!isUser && theologian && (
          <div className="text-xs text-white/40 mb-1 ml-1">{theologian.name}</div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-navy-600 text-white'
              : 'bg-white/5 text-white/85 border border-white/5'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div
              className="text-sm leading-relaxed prose-scripture"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          )}
          {isStreaming && (
            <div className="flex gap-1 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
            </div>
          )}
        </div>
        <div className="text-[10px] text-white/20 mt-1 ml-2">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center shrink-0 mt-1">
          <User size={16} className="text-white/70" />
        </div>
      )}
    </div>
  );
}

export function StreamingBubble({
  content,
  theologianId,
}: {
  content: string;
  theologianId: string;
}) {
  const theologian = getTheologian(theologianId);
  const parsedContent = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="flex gap-3 animate-fade-in">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1"
        style={{ backgroundColor: theologian?.color || '#4263eb' }}
      >
        {theologian?.avatar || <BookMarked size={16} />}
      </div>
      <div className="max-w-[75%]">
        {theologian && (
          <div className="text-xs text-white/40 mb-1 ml-1">{theologian.name}</div>
        )}
        <div className="rounded-2xl px-4 py-3 bg-white/5 text-white/85 border border-white/5">
          {content ? (
            <div
              className="text-sm leading-relaxed prose-scripture"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          ) : (
            <div className="flex gap-1 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 typing-dot" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
