// ============================================
// KelasAI - AI Provider (Google Gemini)
// Works on any hosting platform (Netlify, Vercel, VPS)
// ============================================

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// Model fallback list - try each in order until one works
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
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

  // Try each model in the fallback list
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Gemini API error with model ${model}:`, response.status, errorData);
        lastError = new Error(`AI API error (${model}): ${response.status} - ${errorData.substring(0, 200)}`);

        // If it's a 404 (model not found), try the next model
        if (response.status === 404) {
          console.log(`Model ${model} not found, trying next...`);
          continue;
        }

        // If it's a 400 (bad request, e.g., API key invalid), don't retry
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(`API Key tidak valid atau tidak memiliki akses. Pastikan API Key Google Gemini sudah benar dan Generative Language API sudah diaktifkan di Google Cloud Console.`);
        }

        // For other errors (429 rate limit, 500 server), also throw
        throw lastError;
      }

      const data = await response.json();

      // Check for blocked content
      if (data.promptFeedback?.blockReason) {
        console.error('Content blocked:', data.promptFeedback.blockReason);
        throw new Error('Permintaan diblokir oleh filter keamanan AI. Coba pertanyaan yang berbeda.');
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        // Check if the candidate was blocked
        const finishReason = data.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          throw new Error('Respons AI diblokir oleh filter keamanan. Coba pertanyaan yang berbeda.');
        }
        console.error('Empty AI response. Full response:', JSON.stringify(data).substring(0, 500));
        throw new Error('AI tidak mengembalikan respons. Coba lagi.');
      }

      console.log(`Successfully used model: ${model}`);
      return text;
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('API Key tidak valid') ||
        error.message.includes('diblokir oleh filter')
      )) {
        throw error; // Don't retry these errors
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Error with model ${model}:`, error);
    }
  }

  throw lastError || new Error('Semua model AI gagal. Coba lagi nanti.');
}
