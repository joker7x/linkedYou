import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL, SUPABASE_KEY } from '../constants.ts';

const CRAWLERS = [
  "whatsapp", "telegrambot", "facebookexternalhit",
  "twitterbot", "linkedinbot", "slackbot", "discordbot",
];

function isCrawler(ua: string) {
  return CRAWLERS.some((bot) => ua.toLowerCase().includes(bot));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { promo } = req.query;
  const promoId = promo as string;
  const ua = req.headers['user-agent'] || '';
  const host = req.headers.host || 'linked-you.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  // 1. Redirect normal users to the SPA
  if (!isCrawler(ua)) {
    return res.redirect(302, `${baseUrl}/?promo=${promoId || ''}`);
  }

  // 2. Crawler logic
  let title = "Pharma Core";
  let description = "تحديث أسعار الأدوية";
  let priceNew = "0";
  let priceOld = "0";
  let discount = 0;

  try {
    if (promoId && SUPABASE_URL && SUPABASE_KEY) {
      const promoRes = await fetch(`${SUPABASE_URL}/rest/v1/promo_links?id=eq.${promoId}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      
      if (promoRes.ok) {
        const promoData = await promoRes.json();
        
        if (Array.isArray(promoData) && promoData.length > 0) {
          const promo = promoData[0];
          title = promo.title || title;
          
          priceNew = promo.price_new ? String(promo.price_new) : "0";
          priceOld = promo.price_old ? String(promo.price_old) : "0";
          
          if (priceOld && priceNew) {
            const n = parseFloat(priceNew);
            const o = parseFloat(priceOld);
            if (!isNaN(n) && !isNaN(o) && o > 0 && o > n) {
              discount = Math.round(((o - n) / o) * 100);
            }
          }
          description = `السعر الجديد: ${priceNew} ج.م بدلاً من ${priceOld} ج.م`;
        }
      }
    }
  } catch (e) {
    console.error('Crawler data fetch error:', e);
  }

  const imageUrl = `${baseUrl}/api/og-image?name=${encodeURIComponent(title)}&priceNew=${encodeURIComponent(priceNew)}&priceOld=${encodeURIComponent(priceOld)}&discount=${encodeURIComponent(discount)}`;

  // 3. Return HTML for crawlers
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}/offer/${promoId || ''}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
</body>
</html>`;

  return res
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60")
    .send(html);
}
