// api/debug.js
export default async function handler(req, res) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
    const data = await response.json();
    return res.status(200).json({ 
      message: "Available models for your key:",
      models: data.models ? data.models.map(m => m.name) : "No models found",
      raw: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
