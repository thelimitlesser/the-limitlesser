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

A látogató 3 kérdésre válaszolt a problémájáról, a működéséről és a víziójáról. A feladatod egy olyan letaglózóan profi és egyedi "Megoldás Kártya" generálása, ami azonnali konzultációra (konverzióra) ösztönzi.

Használd a 4-lépéses konverziós pszichológiát:
1. DIAGNÓZIS: Mutasd meg, hogy érted a fájdalmát. "Nem veled van a baj, a cég nőtte ki a jelenlegi rendszereit."
2. SZAKADÉK: Mi történik, ha nem lép? A napi tűzoltás felőrli a vízióját és a profitot.
3. HÍD (Limitlesser Megoldás): Nem dobozos szoftvert adunk, hanem egyedi, automatizált ökoszisztémát építünk, hogy ő újra a cégépítéssel (az "örökségével") foglalkozhasson.
4. CTA: Egyértelmű, kis kockázatú következő lépés az ajánlatkérésre.

Generálj CSAK ebben a JSON formátumban, más szöveg nélkül (a fenti 4 lépést elosztva a 3 mezőben):
{"focim":"[Diagnózis: Egy empátiát és profizmust sugárzó, max 8-10 szavas főcím a problémájára]","megoldas":"[Szakadék + Híd: 4-6 mondat arról, hogy a jelenlegi működés miért gátolja a vízióját, és a Limitlesser milyen konkrét rendszert/automatizációt épít erre]","eredmeny":"[Végkifejlet + CTA: 4-6 mondat a felszabadult időről/növekedésről, majd a legvégén egy elegáns, úriemberes felhívás egy privát szakmai egyeztetésre]","lang":"a generált válasz nyelve: 'hu' vagy 'en'"}

A LIMITLESSERRŐL (háttér tudás):
Növekvő KKV-knak épít egyedi digitális rendszereket bárhonnan a világból. Három területen dolgozunk:
1. Automatizáció & Rendszerintegráció — ismétlődő folyamatok automatizálása emberi beavatkozás nélkül
2. Egyedi Rendszerek & Szoftverfejlesztés — belső irányítópultok, portálok, rendeléskezelők, foglalási rendszerek
3. Konverzió Optimalizálás — több ügyfél ugyanabból a forgalomból, adatvezérelt döntések alapján

KÖTELEZŐ SZABÁLYOK:
— Csak és kizárólag JSON, más szöveg nélkül
— Személyes te/ti hangnem
— Generálj mélyreható, részletesen kifejtett válaszokat! 
— A "megoldas" mezőben pontosan arra a szűk keresztmetszetre adj választ, ami náluk fáj.
— Eredményre és felszabaduló időre fókuszálj, ne csak puszta technológiára.
— A Limitlesser mentalitás: "Segítünk modern eszközökkel örökséget alkotni. Emlékezz a nagyságodra."
— Soha ne mondj árat vagy határidőt
— Ha említett konkrét rendszert Q2-ben, arra konkrétan reflektálj.
— Magyar válasz alapból, angolul ha angolul írtak
— ÚRIEMBERES CTA A VÉGÉN: Az "eredmeny" mező legutolsó mondata kötelezően egy diszkrét, elegáns és exkluzív meghívás legyen. Ne használj nyomulós, olcsó értékesítői sablonokat! Szövegezd úgy, mintha egy komoly üzleti partner lennél. (Például valami hasonló: "Ha úgy érzed, eljött az ideje szintet lépni, üljünk le egy privát, 30 perces szakmai beszélgetésre. Felesleges körök nélkül, tiszta lappal megnézzük, miben lehetünk valódi partnerek.")

HANGNEM:
Rossz: "Szoftveres integrációt hajtunk végre és egyedi CRM-et fejlesztünk."
Jó: "Amíg manuálisan adminisztráltok, a tűzoltás felőrli a növekedést. Egy olyan egyedi, önműködő rendszert építünk nektek, amivel visszakapod a fókuszodat, hogy a cégépítéssel foglalkozhass."`;

  const userMessage = `Q1 (Segítség): ${q1}\nQ2 (Működés): ${q2}\nQ3 (Siker): ${q3}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
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
    const contentText = geminiData.candidates[0].content.parts[0].text;
    const content = JSON.parse(contentText);

    // If Resend API Key is configured, trigger emails asynchronously
    if (resendApiKey && email) {
      const isEn = (content.lang || lang) === 'en';
      const calendlyLink = 'https://calendly.com/limitlesser/discovery-call';

      // 1. Email to visitor
      const visitorSubject = isEn 
        ? "Your Tailored Solution Summary — Limitlesser" 
        : "A te helyzetedre szabott összefoglaló — Limitlesser";

      const visitorHtml = `
        <div style="font-family: 'Times New Roman', Times, serif; background-color: #0b0a05; color: #ffffff; padding: 40px; max-width: 650px; margin: 0 auto; border-radius: 24px; border: 1px solid rgba(255,199,0,0.15);">
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
            <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">${isEn ? 'TAILORED TO YOUR SITUATION' : 'A TE HELYZETEDRE SZABVA'}</p>
            <h1 style="color: #ffffff; font-size: 26px; font-weight: 500; margin: 10px 0 0; font-family: 'Times New Roman', serif;">${content.focim}</h1>
          </div>

          <div style="margin-bottom: 25px;">
            <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0; font-weight: 600;">${isEn ? 'THE SOLUTION' : 'A MEGOLDÁS'}</p>
            <p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; margin: 0;">${content.megoldas}</p>
          </div>

          <div style="margin-bottom: 35px;">
            <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0; font-weight: 600;">${isEn ? 'EXPECTED RESULT' : 'A VÁRHATÓ EREDMÉNY'}</p>
            <p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; margin: 0;">${content.eredmeny}</p>
          </div>

          <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 25px; border-radius: 16px; text-align: center;">
            <p style="color: rgba(255,255,255,0.4); font-size: 11px; line-height: 1.5; margin: 0 0 20px 0;">
              ${isEn 
                ? 'This is a preliminary summary based on the information you shared. Every situation is unique — for a complete and detailed analysis, book a free Discovery Call.' 
                : 'Ez egy előzetes összefoglaló az általad megosztott információk alapján. Minden helyzet egyedi — a teljes és részletes elemzésért foglalj egy ingyenes Discovery Callt.'}
            </p>
            <a href="${calendlyLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #FFC700, #FFE066); color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 100px; font-weight: 600; font-size: 14px; margin-bottom: 10px; transition: 0.3s;">
              ${isEn ? 'Book Discovery Call →' : 'Discovery Call foglalása →'}
            </a>
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 5px 0 0 0;">
              ${isEn ? 'Free. No obligation. 30 minutes.' : 'Ingyenes. Kötelezettségmentes. 30 perc.'}
            </p>
          </div>

          <div style="margin-top: 40px; text-align: center; color: rgba(255,255,255,0.3); font-size: 11px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px;">
            <p>&copy; 2026 Limitlesser. All rights reserved.</p>
          </div>
        </div>
      `;

      // 2. Email to Limitlesser team
      const teamSubject = `🚀 Új lead (AI kérdőív): ${email}`;
      const teamHtml = `
        <div style="font-family: 'Inter', sans-serif; background-color: #0b0a05; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid rgba(255,199,0,0.15);">
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
            <h1 style="color: #FFC700; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Limitlesser AI Lead</h1>
            <p style="color: #888; font-size: 14px; margin-top: 10px;">Új interaktív kérdőív kitöltés érkezett</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 12px; color: #FFC700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 3px solid #FFC700; padding-left: 10px;">Lead adatok</h2>
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

      // Use Promise.allSettled to send emails without blocking the main response
      Promise.allSettled([
        // Send email to visitor
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'The Limitlesser <onboarding@resend.dev>',
            to: [email],
            subject: visitorSubject,
            html: visitorHtml,
          }),
        }),
        // Send email to team
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
        })
      ]).catch(err => {
        console.error('Error sending background emails via Resend:', err);
      });
    }

    return res.status(200).json(content);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
