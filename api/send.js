// api/send.js
// Vercel Serverless Function to send email via Resend

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lastName, firstName, email, phone, brandName, website, companyName, taxId, message, budget } = req.body;

  // Basic validation
  if (!email || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API key not configured' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'The Limitlesser <onboarding@resend.dev>',
        to: ['hello@thelimitlesser.hu'],
        subject: `🚀 Új ajánlatkérés: ${brandName || (lastName + ' ' + firstName)}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; background-color: #050200; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid #1a1a1a;">
            <div style="border-bottom: 1px solid #333; padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
              <h1 style="color: #FF8A00; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Limitlesser Leads</h1>
              <p style="color: #888; font-size: 14px; margin-top: 10px;">Új ajánlatkérési űrlap érkezett a weboldalról</p>
            </div>

            <!-- Kapcsolattartó adatai -->
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 12px; color: #FF8A00; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 3px solid #FF8A00; padding-left: 10px;">Kapcsolattartó</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #888; width: 120px;">Név:</td><td style="padding: 8px 0; font-weight: 600;">${lastName} ${firstName}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #ffffff; text-decoration: none;">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Telefon:</td><td style="padding: 8px 0;">${phone}</td></tr>
              </table>
            </div>

            <!-- Cég / Brand adatai -->
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 12px; color: #FF8A00; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 3px solid #FF8A00; padding-left: 10px;">Vállalkozás</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #888; width: 120px;">Brand:</td><td style="padding: 8px 0; font-weight: 600;">${brandName || 'Nincs megadva'}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Weboldal:</td><td style="padding: 8px 0;">${website || 'Nincs megadva'}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Cégnév:</td><td style="padding: 8px 0;">${companyName || 'Nincs megadva'}</td></tr>
                <tr><td style="padding: 8px 0; color: #888;">Adószám:</td><td style="padding: 8px 0;">${taxId || 'Nincs megadva'}</td></tr>
              </table>
            </div>

            <!-- Projekt részletek -->
            <div style="background-color: #111; padding: 25px; border-radius: 15px; border: 1px solid #222;">
              <h2 style="font-size: 12px; color: #FF8A00; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Projekt Igények</h2>
              <p style="color: #888; font-size: 13px; margin-bottom: 5px;">Miben segíthetünk?</p>
              <p style="color: #ffffff; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">${message.replace(/\n/g, '<br />')}</p>
              
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #333; padding-top: 15px;">
                <div>
                  <p style="color: #888; font-size: 11px; margin: 0; text-transform: uppercase;">Költségkeret</p>
                  <p style="color: #FF8A00; font-size: 18px; font-weight: 700; margin: 5px 0 0;">${budget}</p>
                </div>
              </div>
            </div>

            <div style="margin-top: 40px; text-align: center; color: #555; font-size: 11px;">
              <p>Ez az üzenet automatikusan generálódott a thelimitlesser.hu weboldalról.</p>
            </div>
          </div>
        `,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, id: data.id });
    } else {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.message });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
