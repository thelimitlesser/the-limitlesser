// api/ai.js
// Vercel Serverless Function to communicate securely with OpenAI API, provide personalized solutions, and send automated emails via Resend

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q1, q2, q3, email, lang = 'hu' } = req.body;

  if (!q1) {
    return res.status(400).json({ error: 'Missing questionnaire data' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  const systemPrompt = `Te a Limitlesser stratégája vagy. A feladatod egy EXTRÉM TÖMÖR "Alkalmassági Riport" generálása. 
Minden mező ("megoldas", "eredmeny") MAXIMUM 1-2 RÖVID MONDAT legyen! Semmi sallang, csak a lényeg.

JSON FORMÁTUM:
{"focim":"[Rövid diagnózis]","megoldas":"[1-2 rövid mondat]","eredmeny":"[1-2 rövid mondat]","lang":"hu/en", "rejected": true/false}

SZABÁLYOK:
1. DIAGNÓZIS (focim): 3-5 szavas megállapítás.
2. ALKALMASSÁG (megoldas): Max 1-2 mondat arról, miért ideális a cég.
3. POTENCIÁL (eredmeny): Max 1-2 mondat a várható előnyökről.

A szakmai CTA-t NE írd bele, azt a rendszer automatikusan hozzáadja.
RELEVANCIA: Ha nem szoftver/automatizáció, rejected=true és 1 mondatos elutasítás.
HANGNEM: Profi stratégiai tanácsadó. Beszélj az értékteremtésről (idő, skálázhatóság, profit).
SZÖVEGEZÉS: Alkosson TERMÉSZETES, gördülékeny mondatokat! Kerüld a darabos felsorolásokat és az önfényezést (pl. NE használd: "A Limitlesser ideális számodra", "Tökéletesek vagyunk").
KEZDÉS: A mondatokat kezdd közvetlenül a felhasználó folyamataival vagy a megoldás előnyével (pl. "A [tevékenységed] automatizálása felszabadítja...", "A folyamataid alkalmasak arra, hogy...").
FONTOS: Szigorú TEGEZŐDÉS (te/ti)! SOHA ne használj magázódást. Legyél közvetlen szakértő partner.`;

  const userMessage = `Q1 (Segítség): ${q1}\nQ2 (Működés): ${q2}\nQ3 (Siker): ${q3}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            { text: `${systemPrompt}\n\nKÖTELEZŐ NYELVI SZABÁLY (LANGUAGE RULE):\n1. Az alapértelmezett válaszadási nyelv a(z) '${lang === 'en' ? 'en (angol / English)' : 'hu (magyar / Hungarian)'}' legyen.\n2. KIVÉTEL: Ha a felhasználó egyértelműen a másik nyelven fogalmazta meg a válaszait (pl. ha az alapértelmezett nyelv angol, de ő magyarul írt be válaszokat, vagy ha az alapértelmezett magyar, de ő angolul írt), akkor alkalmazkodj hozzá, és válaszolj az ő nyelvén!\n3. A teljes JSON választ egységesen ugyanazon a nyelven generáld!\n4. A JSON-ben adj vissza egy "lang" kulcsot is, aminek az értéke a generált válasz nyelve legyen: 'hu' vagy 'en'.` }
          ]
        },
        contents: [
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'Gemini API error' });
    }

    const geminiData = await response.json();
    const contentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let content;
    try {
      // Clean up the text: sometimes AI adds markdown code blocks like ```json ... ```
      let cleanedText = contentText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      }
      content = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Raw text:', contentText);
      // Try a more aggressive regex extract if simple clean failed
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          content = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('Could not parse AI response as JSON. Raw: ' + contentText.substring(0, 500));
        }
      } else {
        throw new Error('AI response contains no valid JSON. Raw: ' + (contentText ? contentText.substring(0, 500) : 'EMPTY RESPONSE'));
      }
    }

    // If Resend API Key is configured, trigger emails asynchronously
    if (resendApiKey && email) {
      const isEn = (content.lang || lang) === 'en';
      const isRejected = content.rejected === true;
      const teamSubject = `${isRejected ? '⚠️ NEM RELEVÁNS: ' : '🚀 Új lead (AI kérdőív): '}${email}`;
      const teamHtml = `
        <div style="font-family: 'Inter', sans-serif; background-color: #0b0a05; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid rgba(255,199,0,0.15);">
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
            <h1 style="color: #FFC700; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Limitlesser AI Lead</h1>
            <p style="color: #888; font-size: 14px; margin-top: 10px;">Új interaktív kérdőív kitöltés érkezett</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 12px; color: ${isRejected ? '#ff4d4d' : '#FFC700'}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 3px solid ${isRejected ? '#ff4d4d' : '#FFC700'}; padding-left: 10px;">
              ${isRejected ? 'Lead adatok (NEM RELEVÁNS)' : 'Lead adatok'}
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888; width: 120px;">Email:</td><td style="padding: 8px 0; font-weight: 600;"><a href="mailto:${email}" style="color: #ffffff; text-decoration: none;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Nyelv:</td><td style="padding: 8px 0; text-transform: uppercase;">${lang}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Időpont:</td><td style="padding: 8px 0;">${new Date().toLocaleString('hu-HU')}</td></tr>
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 12px; color: #FFC700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 3px solid #FFC700; padding-left: 10px;">Ügyfél válaszai</h2>
            <div style="background-color: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 15px;">
              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Q1 (Segítség):</p>
              <p style="color: #ffffff; font-size: 14px; margin: 0; line-height: 1.5;">${q1}</p>
            </div>
            <div style="background-color: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 15px;">
              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Q2 (Működés):</p>
              <p style="color: #ffffff; font-size: 14px; margin: 0; line-height: 1.5;">${q2}</p>
            </div>
            <div style="background-color: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Q3 (Siker):</p>
              <p style="color: #ffffff; font-size: 14px; margin: 0; line-height: 1.5;">${q3}</p>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 12px; color: #FFC700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 3px solid #FFC700; padding-left: 10px;">Generált AI Válaszok</h2>
            <div style="background-color: rgba(255,199,0,0.02); border: 1px solid rgba(255,199,0,0.15); padding: 20px; border-radius: 12px;">
              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Főcím:</p>
              <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">"${content.focim}"</p>

              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Megoldás javaslat:</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 15px 0; line-height: 1.5;">${content.megoldas}</p>

              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0; line-height: 1.5;">Várható eredmény:</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; line-height: 1.5;">${content.eredmeny}</p>
            </div>
          </div>
        </div>
      `;

      // Trigger email sending
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'The Limitlesser <onboarding@resend.dev>',
          to: ['the.limitlesser@gmail.com'],
          subject: teamSubject,
          html: teamHtml,
        }),
      }).catch(err => {
        console.error('Error sending lead email via Resend:', err);
      });
    }

    return res.status(200).json(content);
  } catch (error) {
    console.error('SERVER ERROR:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
