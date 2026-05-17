// ============================================
// KelasAI - AI Provider (Google Gemini)
// Works on any hosting platform (Netlify, Vercel, VPS)
// ============================================

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export async function callAI(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum diset. Tambahkan di environment variables.');
  }

  const contents: GeminiMessage[] = [
    {
      role: 'user',
      parts: [{ text: `System Instructions: ${systemPrompt}\n\n${userMessage}` }],
    },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
    console.error('Gemini API error:', response.status, errorData);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('AI tidak mengembalikan respons');
  }

  return text;
}
