import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { SUPABASE_URL, SUPABASE_KEY, MAIN_TABLE } from '../../constants.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const promoId = req.query.promo as string;
  
  if (!promoId) {
    return res.status(400).send('Missing promo ID');
  }

  try {
    // Fetch promo link details
    const promoRes = await fetch(`${SUPABASE_URL}/rest/v1/promo_links?id=eq.${promoId}&select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const promoData = await promoRes.json();
    
    let title = "Pharma Core Premium";
    let description = "منصة متكاملة لمتابعة أحدث أسعار الأدوية، النواقص، والتحديثات الحصرية في السوق المصري.";
    let company = "";
    let priceNew = "";
    let priceOld = "";

    if (promoData && promoData.length > 0) {
      const promo = promoData[0];
      const drugNo = promo.drug_no;
      title = promo.title || title;
      
      // Fetch drug details
      const drugRes = await fetch(`${SUPABASE_URL}/rest/v1/${MAIN_TABLE}?drug_no=eq.${drugNo}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const drugData = await drugRes.json();
      
      if (drugData && drugData.length > 0) {
        const drug = drugData[0];
        title = drug.name_ar || drug.name_en || title;
        company = drug.company || company;
        priceNew = drug.price_new || priceNew;
        priceOld = drug.price_old || priceOld;
        description = `السعر الجديد: ${priceNew} ج.م بدلاً من ${priceOld} ج.م | ${company}`;
      } else if (promo.description) {
        // Fallback to promo description if drug not found
        const match = promo.description.match(/\d+/);
        if (match) {
          priceNew = match[0];
          description = `السعر الجديد: ${priceNew} ج.م`;
        }
      }
    }

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    // Use dynamic OG image endpoint
    const encodedTitle = encodeURIComponent(title);
    const encodedCompany = encodeURIComponent(company);
    const encodedPriceNew = encodeURIComponent(priceNew);
    const encodedPriceOld = encodeURIComponent(priceOld);
    
    const dynamicImageUrl = `${baseUrl}/api/og-image?title=${encodedTitle}&company=${encodedCompany}&priceNew=${encodedPriceNew}&priceOld=${encodedPriceOld}`;

    // Generate HTML directly
    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${dynamicImageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${dynamicImageUrl}" />
  <meta http-equiv="refresh" content="0;url=${baseUrl}/?promo=${promoId}" />
</head>
<body>
  <script>window.location.href = "${baseUrl}/?promo=${promoId}";</script>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.send(html);
  } catch (error) {
    console.error('Error serving promo HTML:', error);
    res.status(500).send('Internal Server Error');
  }
}
