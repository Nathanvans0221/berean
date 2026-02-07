import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, system, messages, model } = req.body;

  const key = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return res.status(400).json({ error: 'No API key provided. Please add your Anthropic API key in Settings.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5-20250514',
        max_tokens: 4096,
        system,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.write(`data: ${JSON.stringify({ error: `Anthropic API error: ${response.status} - ${errText}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response stream' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'content_block_delta' && event.delta?.text) {
              res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
            }
          } catch {
            // skip
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
