// api/chat.js
// Vercel Serverless Function to communicate securely with Google Gemini API

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, lang = 'hu' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing message parameter' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  const systemPrompt = `You are the AI assistant of Limitlesser, a premium digital transformation agency. Limitlesser builds custom AI systems, process automation, and conversion rate optimization for growing SMBs (KKVs).
  
Your task is to analyze the user's input business problem and respond appropriately in the requested language: "${lang}".

Rules:
1. Always categorize the user's problem into exactly one of these four categories: "lead", "manual", "visibility", "scale". If it is ambiguous, classify it as "general".
2. Respond with an empathetic, supportive, and professional tone.
3. Your response MUST be a valid JSON object containing exactly these fields:
   - "category": the chosen category ("lead" | "manual" | "visibility" | "scale" | "general")
   - "response": a short, warm, and professional 1-2 sentence empathy statement in the user's language ("${lang}") acknowledging their pain point.
   - "question": a brief follow-up question in the user's language ("${lang}") that narrows down their issue.
   - "options": an array of 4 short, clickable option strings (buttons) representing specific issues in that category, in the user's language ("${lang}").

Example HU:
{
  "category": "manual",
  "response": "Értem a helyzetet – rengeteg értékes idő megy el ismétlődő, napi adminisztratív feladatokra.",
  "question": "Melyik területen érzitek jelenleg a legnagyobb terhet?",
  "options": [
    "Számlázás & adminisztráció",
    "Ügyfélkommunikáció",
    "Adatrögzítés rendszerek között",
    "Rendeléskezelés"
  ]
}

Example EN:
{
  "category": "manual",
  "response": "I understand the situation – a massive amount of valuable time is wasted on repetitive, daily administrative tasks.",
  "question": "In which area do you feel the heaviest burden right now?",
  "options": [
    "Invoicing & Admin",
    "Customer Communication",
    "Data Sync Between Systems",
    "Order Management"
  ]
}

Ensure the output is strictly valid JSON with no markdown wrapping, no backticks, and no extra text outside the JSON block.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { role: 'user', parts: [{ text: message }] }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 400,
          responseMimeType: 'application/json'
        }
      }),
    });

    if (response.ok) {
      const geminiData = await response.json();
      const contentText = geminiData.candidates[0].content.parts[0].text;
      const content = JSON.parse(contentText);
      return res.status(200).json(content);
    } else {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'Gemini API error' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
