// ============================================
// KelasAI - AI Provider (Google Gemini)
// Works on any hosting platform (Netlify, Vercel, VPS)
// ============================================

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// Model + API version combinations to try in order
const MODEL_CONFIGS = [
  { model: 'gemini-2.0-flash', version: 'v1beta' },
  { model: 'gemini-2.0-flash', version: 'v1' },
  { model: 'gemini-1.5-flash', version: 'v1beta' },
  { model: 'gemini-1.5-flash', version: 'v1' },
  { model: 'gemini-1.5-flash-latest', version: 'v1beta' },
  { model: 'gemini-pro', version: 'v1beta' },
  { model: 'gemini-pro', version: 'v1' },
];

export async function callAI(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY belum diset. Tambahkan di Environment Variables Netlify: Site settings > Environment variables > Add GEMINI_API_KEY');
  }

  const contents: GeminiMessage[] = [
    {
      role: 'user',
      parts: [{ text: `System Instructions: ${systemPrompt}\n\n${userMessage}` }],
    },
  ];

  // Try each model + version combo in order
  let lastError: Error | null = null;

  for (const config of MODEL_CONFIGS) {
    try {
      const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${apiKey}`;
      console.log(`Trying Gemini: ${config.model} (${config.version})`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Gemini API error (${config.model}/${config.version}):`, response.status, errorData);

        // If it's a 404 (model not found), try the next combo
        if (response.status === 404) {
          console.log(`Model ${config.model} (${config.version}) not found, trying next...`);
          lastError = new Error(`AI API error (${config.model}): ${response.status} - ${errorData.substring(0, 200)}`);
          continue;
        }

        // If it's auth error, don't retry
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(`API Key tidak valid atau tidak memiliki akses. Pastikan API Key Google Gemini sudah benar dan Generative Language API sudah diaktifkan di Google Cloud Console.`);
        }

        // Rate limit or server error
        lastError = new Error(`AI API error (${config.model}): ${response.status} - ${errorData.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();

      // Check for blocked content
      if (data.promptFeedback?.blockReason) {
        console.error('Content blocked:', data.promptFeedback.blockReason);
        throw new Error('Permintaan diblokir oleh filter keamanan AI. Coba pertanyaan yang berbeda.');
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        const finishReason = data.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          throw new Error('Respons AI diblokir oleh filter keamanan. Coba pertanyaan yang berbeda.');
        }
        console.error('Empty AI response:', JSON.stringify(data).substring(0, 500));
        lastError = new Error('AI tidak mengembalikan respons. Coba lagi.');
        continue;
      }

      console.log(`Successfully used: ${config.model} (${config.version})`);
      return text;
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('API Key tidak valid') ||
        error.message.includes('diblokir oleh filter')
      )) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Error with ${config.model} (${config.version}):`, error);
    }
  }

  throw lastError || new Error('Semua model AI gagal. Coba lagi nanti.');
}
