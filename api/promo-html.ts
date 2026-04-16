import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL, SUPABASE_KEY, MAIN_TABLE } from '../../constants.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const promoId = req.query.promo as string;
  
  // Default fallback values
  let title = "Pharma Core";
  let description = "تحديث أسعار الأدوية";
  let priceNew = "0";
  let priceOld = "0";
  let discount = 0;

  try {
    if (promoId) {
      const promoRes = await fetch(`${SUPABASE_URL}/rest/v1/promo_links?id=eq.${promoId}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const promoData = await promoRes.json();
      
      if (promoData && promoData.length > 0) {
        const promo = promoData[0];
        const drugNo = promo.drug_no;
        title = promo.title || title;
        
        const drugRes = await fetch(`${SUPABASE_URL}/rest/v1/${MAIN_TABLE}?drug_no=eq.${drugNo}&select=*`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const drugData = await drugRes.json();
        
        if (drugData && drugData.length > 0) {
          const drug = drugData[0];
          title = drug.name_ar || drug.name_en || title;
          priceNew = drug.price_new ? String(drug.price_new) : priceNew;
          priceOld = drug.price_old ? String(drug.price_old) : priceOld;
          
          const n = parseFloat(priceNew);
          const o = parseFloat(priceOld);
          if (o > 0 && o > n) {
            discount = Math.round(((o - n) / o) * 100);
          }
          description = `السعر الجديد: ${priceNew} ج.م بدلاً من ${priceOld} ج.م`;
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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${baseUrl}/offer/${promoId}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${dynamicImageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${dynamicImageUrl}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="${baseUrl}/?promo=${promoId || ''}">اضغط هنا للانتقال للمتجر</a>
  <script>window.location.href = "${baseUrl}/?promo=${promoId || ''}";</script>
</body>
</html>
  `;
    
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.send(html);
}
