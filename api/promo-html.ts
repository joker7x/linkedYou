import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as constants from '../constants.ts';

// Safely access constants with fallbacks
const SUPABASE_URL = constants.SUPABASE_URL || '';
const SUPABASE_KEY = constants.SUPABASE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const promoId = req.query.promo as string;
  
  // Default fallback values
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
        
        // Safety check: Ensure we got an array
        if (Array.isArray(promoData) && promoData.length > 0) {
          const promo = promoData[0];
          title = promo.title || title;
          
          // Take price data directly from the promo record, with safety checks
          priceNew = promo.price_new ? String(promo.price_new) : "";
          priceOld = promo.price_old ? String(promo.price_old) : "";
          
          const n = parseFloat(priceNew);
          const o = parseFloat(priceOld);
          if (!isNaN(n) && !isNaN(o) && o > 0 && o > n) {
            discount = Math.round(((o - n) / o) * 100);
          }
          description = (priceNew && priceOld) ? `السعر الجديد: ${priceNew} ج.م بدلاً من ${priceOld} ج.م` : description;
        }
      }
    }
  } catch (error) {
    console.error('Data fetch error (using defaults):', error);
  }


  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  const encodedName = encodeURIComponent(title);
  const encodedPriceNew = encodeURIComponent(priceNew);
  const encodedPriceOld = encodeURIComponent(priceOld);
  const encodedDiscount = encodeURIComponent(discount);
  
  const dynamicImageUrl = `${baseUrl}/api/og-image?name=${encodedName}&priceNew=${encodedPriceNew}&priceOld=${encodedPriceOld}&discount=${encodedDiscount}`;
  
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- Primary Meta Tags -->
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}/offer/${promoId}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${dynamicImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${dynamicImageUrl}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <script>window.location.href = "${baseUrl}/?promo=${promoId || ''}";</script>
</body>
</html>
  `;
    
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.send(html);
}
