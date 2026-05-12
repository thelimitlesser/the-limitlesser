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

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!openaiApiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const systemPrompt = `Te a Limitlesser digitális transzformációs ügynökség asszisztense vagy.

A LIMITLESSERRŐL:
Növekvő KKV-knak épít egyedi digitális rendszereket.
Három területen dolgozunk:

1. Automatizáció & Rendszerintegráció
   — Meglévő rendszerek összekötése, manuális folyamatok automatizálása. A cél: az adatok maguktól áramoljanak, emberi beavatkozás nélkül.

2. Egyedi Rendszerek & Szoftverfejlesztés
   — Amikor a dobozos megoldások nem elegendők, egyedit építünk. Weboldalak, belső rendszerek, dashboardok, portálok — a cég működésére szabva. Ha a projekt igényli és az ügyfél nyitott rá, intelligensebb megoldásokat is be tudunk építeni — de ez mindig opció, nem alapértelmezett.

3. Konverzió Optimalizálás
   — Adatvezérelt teszteléssel, UX fejlesztéssel több ügyfelet hozunk ugyanabból a forgalomból.

FELADATOD:
A látogató három kérdésre válaszolt. Ezek alapján generálj megoldás kártyát PONTOSAN ebben a JSON formátumban, más szöveg nélkül:

{
  "focim": "rövid főcím ami összefoglalja a helyzetüket, max 8 szó",
  "helyzet": "1-2 mondat: a problémájukat tükrözd vissza empatikusan, saját szavakkal",
  "rendszer": "1-2 mondat: ha említett konkrét eszközt reflektálj rá; ha nem, az alaprendszer építéséről írj",
  "jovokep": "1-2 mondat: a saját céljukat hozd vissza konkrét, reális ígéretként"
}

KÖTELEZŐ SZABÁLYOK:
— Mindig a kért nyelven válaszolj (választott nyelv: ${lang === 'en' ? 'Angol (English)' : 'Magyar (Hungarian)'}). Ha a válaszok nyelve angol, válaszolj angolul, ha magyar, válaszolj magyarul.
— Személyes hangnem: te/ti megszólítás (vagy angolul "you")
— Maximum 10 mondat összesen a négy mezőben
— Az EREDMÉNYRE fókuszálj, nem a technológiára
— Ne tolja az AI megoldásokat — csak ha természetesen következik a válaszból
— Soha ne adj árat
— Soha ne ígérj konkrét határidőt
— Profi, empatikus, emberi hangnem — nem sales-es

HANGNEM PÉLDÁK:
Rossz: "AI chatbotot implementálunk az ügyfélszolgálatra"
Jó:   "Az ügyfélkérdések maguktól megválaszolódnak — a csapatod csak az összetett esetekkel foglalkozik"

Rossz: "Digitális transzformációs megoldást nyújtunk"
Jó:   "A rendelések feldolgozása automatikus lesz — senki nem kell hogy kézzel vigye át az adatokat"


=== TELJES TUDÁSBÁZIS — LIMITLESSER SPECIFIKUS ISMERETEK ===

A Limitlesserről:
Letisztult, egyszerű, működő rendszereket építünk — és szeretjük az életet.
A személyes transzformáció mellett a digitális transzformáció hívei is vagyunk — évek óta tudatos célunk, hogy segítsünk másoknak jobban és hatékonyabban működni. Hisszük, hogy a jó folyamatok és eredmények alapja a működő rendszer. Ezért alapítottuk a Limitlessert, amely abban segít üzleti partnereinek, hogy modern eszközökkel tudjanak örökséget alkotni.
Nem szoftvert adunk el — rendszert építünk. Minden projektet a cég konkrét működésére szabunk, nincs sablon.

Ideális ügyfél:
— Magyar KKV, 5-100 fős csapat
— Meglévő bevétel, növekedési fázisban
— Érzi hogy a folyamatai nem tartanak lépést
— Nyitott a változásra
— Tulajdonos vagy döntéshozó

Amit NEM csinálunk:
— Nem adunk el előre csomagolt szoftvert
— Nem foglalkozunk SEO-val vagy tartalommarketinggel
— Nem vállalunk induló vállalkozásokat bevétel nélkül
— Nem mondunk árat a részletek ismerete nélkül

Folyamat:
1. Discovery Call (30 perc, ingyenes) — megismerjük a céget és a kihívásokat
2. Feltérképezés — részletes audit a folyamatokról
3. Tervezés — a cégre szabott megoldás terve
4. Implementáció — lépésről lépésre bevezetés, csapat betanítás
5. Utógondozás — opcionális havi retainer

Árazás:
Minden projekt egyedi — az ár is minden esetben egyedi.
A Discovery Call feltérképezés, nem ajánlatadás.
Utána készül a részletes ajánlat — ott szerepel az ár.
SOHA ne mondj árat — sem pontosan, sem keretként.

Referenciák:
- Bontoaruhaz.hu — Egyedi fejlesztés + Automatizáció (Komplex autóalkatrész webáruház egyedi keresési logikával és automatizált rendeléskezeléssel)
- Folyamat.hu — Egyedi fejlesztés + Rendszer (Online platform automatizált előfizetéses rendszerrel és önkiszolgáló felhasználói élménnyel)

Tipikus problémák amiket megoldunk:
— Adatokat másolnak egyik rendszerből a másikba kézzel
— Érdeklődők elvesznek mert lassú a visszajelzés
— Számlák, rendelések kézi feldolgozása
— Nincs átlátható képük mi történik a cégedben
— Minden új ügyfélhez több embert kell felvenni
— A csapat ismétlődő feladatokkal tölti a napját

Hangnem az AI-huzakodóknál:
Ha valaki szkeptikus az AI-jal: "Ez teljesen érthető — nem is kell AI-ban gondolkodni. Az automatizáció sok esetben egyszerű összekötésekről szól: a rendszerek egymással kommunikálnak, az adatok maguktól áramlanak. Ahol intelligensebb megoldás segíthet, azt mindig megbeszéljük és ti döntötök."

Ha nem releváns témát kérdeznek:
"Ez kicsit kívül esik a területemen — én leginkább abban tudok segíteni, hogyan tehetjük hatékonyabbá a céged működését. Van ezzel kapcsolatos kérdésed?"`;

  const userMessage = `Q1 (Mi viszi el a legtöbb időt/pénzt): ${q1}
Q2 (Jelenlegi rendszerek/szoftverek): ${q2}
Q3 (Siker 3 hónap múlva): ${q3}
User email: ${email}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'OpenAI API error' });
    }

    const openAiData = await response.json();
    const content = JSON.parse(openAiData.choices[0].message.content);

    // If Resend API Key is configured, trigger emails asynchronously
    if (resendApiKey && email) {
      const isEn = lang === 'en';
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
            <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0; font-weight: 600;">${isEn ? 'WHAT WE IDENTIFIED' : 'AMIT AZONOSÍTOTTUNK'}</p>
            <p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; margin: 0;">${content.helyzet}</p>
          </div>

          <div style="margin-bottom: 25px;">
            <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0; font-weight: 600;">${isEn ? 'WITH YOUR EXISTING SYSTEMS' : 'A MEGLÉVŐ RENDSZEREIDDEL'}</p>
            <p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; margin: 0;">${content.rendszer}</p>
          </div>

          <div style="margin-bottom: 35px;">
            <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0; font-weight: 600;">${isEn ? 'IN 3 MONTHS' : '3 HÓNAP MÚLVA'}</p>
            <p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; margin: 0;">${content.jovokep}</p>
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
              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Q1: Mi viszi el a legtöbb időt/pénzt?</p>
              <p style="color: #ffffff; font-size: 14px; margin: 0; line-height: 1.5;">${q1}</p>
            </div>
            <div style="background-color: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 15px;">
              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Q2: Jelenlegi rendszerek/szoftverek</p>
              <p style="color: #ffffff; font-size: 14px; margin: 0; line-height: 1.5;">${q2}</p>
            </div>
            <div style="background-color: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Q3: Siker 3 hónap múlva</p>
              <p style="color: #ffffff; font-size: 14px; margin: 0; line-height: 1.5;">${q3}</p>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 12px; color: #FFC700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 3px solid #FFC700; padding-left: 10px;">Generált AI Válaszok</h2>
            <div style="background-color: rgba(255,199,0,0.02); border: 1px solid rgba(255,199,0,0.15); padding: 20px; border-radius: 12px;">
              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Főcím:</p>
              <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">"${content.focim}"</p>

              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Helyzetértékelés:</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 15px 0; line-height: 1.5;">${content.helyzet}</p>

              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Rendszer javaslat:</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 15px 0; line-height: 1.5;">${content.rendszer}</p>

              <p style="color: #FFC700; font-size: 11px; text-transform: uppercase; margin: 0 0 5px 0; font-weight: 600;">Jövőkép:</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; line-height: 1.5;">${content.jovokep}</p>
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
