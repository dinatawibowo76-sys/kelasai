// ============================================
// KelasAI - AI Provider (OpenRouter)
// Works on any hosting platform (Netlify, Vercel, VPS)
// Uses OpenRouter API with free Llama 3.3 70B model
// ============================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Free models on OpenRouter - try in order
const MODEL_CONFIGS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-v4-flash:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

export async function callAI(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set in environment variables');
    throw new Error('OPENROUTER_API_KEY belum diset. Tambahkan di Environment Variables Netlify: Site settings > Environment variables > Add OPENROUTER_API_KEY');
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];

  // Try each model in order
  let lastError: Error | null = null;

  for (const model of MODEL_CONFIGS) {
    try {
      console.log(`Trying OpenRouter model: ${model}`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dinatatechkelasai.netlify.app',
          'X-Title': 'KelasAI',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenRouter API error with model ${model}:`, response.status, errorData);

        // Parse error to check for rate limit
        try {
          const parsed = JSON.parse(errorData);
          if (parsed.error?.code === 429) {
            console.log(`Model ${model} rate-limited, trying next...`);
            lastError = new Error(`Model ${model} rate-limited. Coba lagi dalam beberapa detik.`);
            continue;
          }
          if (parsed.error?.code === 404) {
            console.log(`Model ${model} not found, trying next...`);
            lastError = new Error(`Model ${model} tidak tersedia.`);
            continue;
          }
        } catch {
          // Not JSON error
        }

        // Auth errors - don't retry
        if (response.status === 401 || response.status === 403) {
          throw new Error('API Key OpenRouter tidak valid. Pastikan key sudah benar dan aktif.');
        }

        lastError = new Error(`AI API error (${model}): ${response.status}`);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        console.error('Empty AI response:', JSON.stringify(data).substring(0, 500));
        lastError = new Error('AI tidak mengembalikan respons. Coba lagi.');
        continue;
      }

      console.log(`Successfully used model: ${model}`);
      return text;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API Key OpenRouter tidak valid')) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Error with model ${model}:`, error);
    }
  }

  throw lastError || new Error('Semua model AI gagal. Coba lagi nanti.');
}
