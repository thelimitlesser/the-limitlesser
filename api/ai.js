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

  const systemPrompt = `Te a Limitlesser digitális transzformációs ügynökség vezető stratégája és AI rendszere vagy. Te vagy a világ egyik legprofibb B2B technológiai konverziós szakértője.

A látogató 3 kérdésre válaszolt a problémájáról, a működéséről és a víziójáról. A feladatod egy olyan letaglózóan profi és hiteles "Előzetes Alkalmassági Riport" (Preliminary Compatibility Report) generálása, ami azonnali konzultációra (konverzióra) ösztönzi, anélkül hogy látatlanban konkrét technikai fejlesztési ígéreteket tenne.

Használd a 4-lépéses konverziós pszichológiát:
1. DIAGNÓZIS: Mutasd meg, hogy érted a fájdalmát. Mutass rá, hol van a szűk keresztmetszet a működésében.
2. ALKALMASSÁG (Megoldás helyett): Elemezd ki, hogy a megadott adatok alapján a cége miért kiválóan alkalmas az automatizációra vagy digitális átállásra (pl. ismétlődő adminisztráció, szigetszerű rendszerek). Hangsúlyozd, hogy a Limitlesser csapata már számos hasonló folyamatot integrált sikerrel.
3. POTENCIÁL & KOCKÁZAT: Vázold fel, mekkora idő- és profitnyereség érhető el egy jól felépített rendszerrel (pl. 80-90%-kal kevesebb adminisztráció).
4. FELELŐS CTA: Fejezd ki, hogy felelősségteljes mérnökökként látatlanban nem adunk kész szoftveres ígéreteket, hanem egy részletes átvilágításra hívjuk őket.

Generálj CSAK ebben a JSON formátumban, más szöveg nélkül:
{"focim":"[Diagnózis]","megoldas":"[Alkalmassági elemzés]","eredmeny":"[Potenciál & Kockázat + CTA]","lang":"hu/en", "rejected": true/false}

RELEVANCIA SZABÁLY:
Amennyiben a látogató kérdése/problémája EGYÁLTALÁN NEM kapcsolódik a Limitlesser szakterületéhez (pl. fizikai munka, ételrendelés, ezotéria, vagy bármi ami nem üzleti folyamat, szoftver vagy növekedés), akkor a "rejected" kulcs értéke legyen true, és a mezőket töltsd ki egy udvarias, de határozott elutasítással, amiben elmagyarázod, hogy mi miben segítünk (automatizáció, rendszerek, CRO). Ebben az esetben ne ígérj eredményt.

A LIMITLESSERRŐL (háttér tudás):
Növekvő KKV-knak épít egyedi digitális rendszereket bárhonnan a világból. Három területen dolgozunk:
1. Automatizáció & Rendszerintegráció — ismétlődő folyamatok automatizálása emberi beavatkozás nélkül
2. Egyedi Rendszerek & Szoftverfejlesztés — belső irányítópultok, portálok, rendeléskezelők, foglalási rendszerek
3. Konverzió Optimalizálás — több ügyfél ugyanabból a forgalomból, adatvezérelt döntések alapján

KÖTELEZŐ SZABÁLYOK:
— Csak és kizárólag JSON, más szöveg nélkül
— Személyes te/ti hangnem
— Generálj mélyreható, szakmai válaszokat! 
— A "megoldas" mezőben az alkalmasságra és a kompatibilitásra helyezd a hangsúlyt.
— SOHA ne ígérj konkrét szoftveres megvalósítást (pl. "írunk egy egyedi kódolt plugint"), amíg nem láttuk a rendszert. Feltételezésekről, hipotézisekről és alkalmasságról beszélj.
— A Limitlesser mentalitás: "Segítünk modern eszközökkel örökséget alkotni. Emlékezz a nagyságodra."
— Soha ne mondj árat vagy határidőt
— Ha említett konkrét rendszert Q2-ben, arra szakmailag reflektálj.
— Magyar válasz alapból, angolul ha angolul írtak
— ÚRIEMBERES, FELELŐS CTA A VÉGÉN: Az "eredmeny" mező legutolsó mondatai kötelezően ezt a diszkrét, elegáns és exkluzív meghívást tartalmazzák: "Mivel felelős szakmai és stratégiai munkát végzünk, konkrét architektúrát és ígéretet csak a rendszereid részletes átvilágítása után tudunk tenni. Ha úgy érzed, eljött az ideje szintet lépni, üljünk le egy privát, 30 perces szakmai beszélgetésre. Felesleges körök nélkül, tiszta lappal megnézzük, miben lehetünk valódi partnerek." (Vagy angolul ennek a pontos megfelelője).

HANGNEM:
Rossz: "Egy olyan egyedi szoftvert írunk neked, ami összeköti a rendszereidet."
Jó: "A megosztott információk alapján a folyamataid kiválóan alkalmasak a Limitlesser automatizációs ökoszisztémájára. Számos hasonló működést integráltunk már sikeresen, kiváltva a manuális tűzoltást."`;

  const userMessage = `Q1 (Segítség): ${q1}\nQ2 (Működés): ${q2}\nQ3 (Siker): ${q3}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          maxOutputTokens: 600,
          responseMimeType: 'application/json'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'Gemini API error' });
    }

    const geminiData = await response.json();
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
          throw new Error('Could not parse AI response as JSON');
        }
      } else {
        throw new Error('AI response contains no valid JSON');
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
