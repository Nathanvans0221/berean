import type { Message, Theologian } from '../types';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export async function streamTheologianResponse(
  theologian: Theologian,
  messages: Message[],
  apiKey: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const systemPrompt = `${theologian.systemPrompt}

ADDITIONAL INSTRUCTIONS FOR ALL RESPONSES:
1. When relevant, include original Hebrew or Greek words that illuminate the text. Format these inline using this pattern: **[English word]** (Greek/Hebrew: *original_word*, transliterated: *transliteration*, meaning: "precise meaning").

2. Always cite Scripture references precisely (Book Chapter:Verse) and quote the relevant text when making claims.

3. At the end of your response, if you referenced original language words, include a section formatted exactly like this:

---
**Original Language Notes:**
- **[English]** — [Hebrew/Greek]: *[original]* ([transliteration]) — [expanded meaning and usage notes]

4. Be thorough but conversational. You're having a study session, not writing an academic paper.

5. If the question involves a passage, work through it carefully — show the exegetical reasoning, don't just state conclusions.

6. When your position differs from other major evangelical teachers, briefly note the difference and why you hold your view.`;

  const apiMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        system: systemPrompt,
        messages: apiMessages,
        model: 'claude-sonnet-4-5-20250514',
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      callbacks.onError(`API Error: ${err}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('No response stream available');
      return;
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            callbacks.onDone(fullText);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              callbacks.onToken(parsed.text);
            }
            if (parsed.error) {
              callbacks.onError(parsed.error);
              return;
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    }

    callbacks.onDone(fullText);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return;
    callbacks.onError(err instanceof Error ? err.message : 'Unknown error');
  }
}
