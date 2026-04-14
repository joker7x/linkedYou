import { BOT_TOKEN, SUPABASE_URL, SUPABASE_KEY } from '../constants';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message || !message.text) {
    return res.status(200).send('ok');
  }

  const chatId = message.chat.id;
  const text = message.text;
  
  // Dynamically determine the app URL for the WebApp button
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'pharmacore.app';
  const protocol = 'https';
  const appBaseUrl = `${protocol}://${host}`;

  // Handle Secure Deep Links: /start inv_<invoiceId>_<token>
  if (text.startsWith('/start inv_')) {
    const payload = text.split(' ')[1]; 
    if (payload) {
      const parts = payload.split('_');
      const invoiceId = parts[1];
      const token = parts[2];

      try {
        // Server-side validation against Supabase
        const checkRes = await fetch(
          `${SUPABASE_URL}/rest/v1/invoice_shares?invoice_id=eq.${invoiceId}&token=eq.${token}&select=*`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          }
        );
        
        const shares = await checkRes.json();
        const share = shares?.[0];
        const now = new Date();
        const isValid = share && new Date(share.expires_at) > now;

        if (isValid) {
          const responseText = `📄 *Pharma Core – Invoice Ready*\n\n*Invoice ID:* \`${invoiceId}\`\n*Status:* Secure & Read-Only\n\nTap the button below to view the full invoice details within the app.`;
          
          await sendTelegramMessage(chatId, responseText, [
            [{ 
              text: "👁️ View Invoice", 
              web_app: { 
                // We open the app and pass the token/id via hash params to keep it inside the SPA logic
                url: `${appBaseUrl}/#invoice?token=${token}&id=${invoiceId}` 
              }
            }]
          ]);
        } else {
          await sendTelegramMessage(chatId, "⚠️ *Access Denied*\n\nThis invoice link is either invalid, expired, or has already been used. Please contact the pharmacy for a new link.");
        }
      } catch (err) {
        console.error("Bot Security Error:", err);
        await sendTelegramMessage(chatId, "❌ *System Error*\n\nUnable to verify the invoice link right now. Please try again in a few minutes.");
      }
    }
  } 
  // Default fallback for general messages
  else {
    await sendTelegramMessage(chatId, "🛡️ *Pharma Core Secure Gateway*\n\nThis bot is a secure portal for viewing verified medical invoices.\n\nPlease use an official link provided by your pharmacist to access your documents.");
  }

  return res.status(200).send('ok');
}

async function sendTelegramMessage(chatId: number, text: string, keyboard?: any[][]) {
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
  };
  if (keyboard) {
    body.reply_markup = { inline_keyboard: keyboard };
  }

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (e) {
    console.error("Telegram Webhook Error:", e);
  }
}