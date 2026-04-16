
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { SUPABASE_URL, SUPABASE_KEY, MAIN_TABLE } from "./constants.ts";
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let fontBuffer: ArrayBuffer | null = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Dynamic OG Image Endpoint
  app.get('/api/og-image', async (req, res) => {
    try {
      const title = req.query.title as string || 'Pharma Core';
      const company = req.query.company as string || 'شركة الأدوية';
      const priceNew = req.query.priceNew as string || '---';
      const priceOld = req.query.priceOld as string || '---';

      if (!fontBuffer) {
        // Fetch a font that supports Arabic (Tajawal)
        const fontRes = await fetch('https://raw.githubusercontent.com/googlefonts/tajawal/main/fonts/ttf/Tajawal-Bold.ttf');
        fontBuffer = await fontRes.arrayBuffer();
      }

      const svg = await satori(
        {
          type: 'div',
          props: {
            dir: 'rtl',
            style: {
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#0f172a',
              color: 'white',
              padding: '60px',
              fontFamily: 'Tajawal',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              backgroundImage: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '10px 30px',
                    borderRadius: '40px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '40px',
                  },
                  children: 'عرض ترويجي حصري',
                }
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '70px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    color: '#ffffff',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    maxWidth: '1000px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                  children: title,
                }
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '40px',
                    marginBottom: '60px',
                    color: '#94a3b8',
                  },
                  children: company,
                }
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '40px',
                    width: '100%',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '2px solid rgba(16, 185, 129, 0.2)',
                          padding: '30px 50px',
                          borderRadius: '30px',
                        },
                        children: [
                          { type: 'span', props: { style: { fontSize: '24px', color: '#34d399', marginBottom: '10px' }, children: 'السعر الجديد' } },
                          { type: 'span', props: { style: { fontSize: '60px', fontWeight: 'bold', color: '#10b981' }, children: `${priceNew} ج.م` } }
                        ]
                      }
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          border: '2px solid rgba(148, 163, 184, 0.2)',
                          padding: '30px 50px',
                          borderRadius: '30px',
                        },
                        children: [
                          { type: 'span', props: { style: { fontSize: '24px', color: '#94a3b8', marginBottom: '10px' }, children: 'السعر القديم' } },
                          { type: 'span', props: { style: { fontSize: '60px', fontWeight: 'bold', color: '#64748b', textDecoration: 'line-through' }, children: `${priceOld} ج.م` } }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          width: 1200,
          height: 630,
          fonts: [
            {
              name: 'Tajawal',
              data: fontBuffer,
              weight: 700,
              style: 'normal',
            },
          ],
        }
      );

      const resvg = new Resvg(svg, {
        background: 'rgba(15, 23, 42, 1)',
        fitTo: {
          mode: 'width',
          value: 1200,
        },
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(pngBuffer);
    } catch (error) {
      console.error('Error generating OG image:', error);
      res.status(500).send('Error generating image');
    }
  });

  // API Proxy for Medhome
  app.post("/api/proxy/medhome", async (req, res) => {
    console.log("Proxy endpoint hit");
    const { offset } = req.body;
    const MEDHOME_API_URL = "https://dwaprices.com/api_dr88g/serverz.php";
    
    try {
      console.log(`Proxying request to ${MEDHOME_API_URL} with offset ${offset}`);
      const response = await fetch(MEDHOME_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body: `lastpricesForFlutter=${offset}`
      });

      console.log(`External API response status: ${response.status}`);
      if (!response.ok) {
        const text = await response.text();
        console.error(`External API error response: ${text}`);
        return res.status(response.status).json({ error: `API Error: ${response.status}`, details: text });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from external API", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Dynamic OG Tags Interceptor
  app.get('/', async (req, res, next) => {
    const promoId = req.query.promo as string;
    if (!promoId) {
      return next();
    }

    try {
      // Fetch promo link details from Supabase REST API directly
      const promoRes = await fetch(`${SUPABASE_URL}/rest/v1/promo_links?id=eq.${promoId}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const promoData = await promoRes.json();
      
      if (promoData && promoData.length > 0) {
        const promo = promoData[0];
        const drugNo = promo.drug_no;
        
        // Fetch drug details
        const drugRes = await fetch(`${SUPABASE_URL}/rest/v1/${MAIN_TABLE}?drug_no=eq.${drugNo}&select=*`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const drugData = await drugRes.json();
        
        let title = promo.title || "Pharma Core Premium";
        let description = "منصة متكاملة لمتابعة أحدث أسعار الأدوية، النواقص، والتحديثات الحصرية في السوق المصري.";
        let company = "";
        let priceNew = "";
        let priceOld = "";
        
        if (drugData && drugData.length > 0) {
          const drug = drugData[0];
          title = drug.name_ar || drug.name_en || title;
          company = drug.company || company;
          priceNew = drug.price_new || priceNew;
          priceOld = drug.price_old || priceOld;
          description = `السعر الجديد: ${priceNew} ج.م بدلاً من ${priceOld} ج.م | ${company}`;
        }

        // Read index.html and inject tags
        const indexPath = process.env.NODE_ENV !== "production" 
          ? path.resolve(__dirname, 'index.html')
          : path.resolve(__dirname, 'dist', 'index.html');
          
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // Replace OG tags
        html = html.replace(/<meta property="og:title" content="[^"]*" \/>/g, `<meta property="og:title" content="${title}" />`);
        html = html.replace(/<meta property="og:description" content="[^"]*" \/>/g, `<meta property="og:description" content="${description}" />`);
        
        // Use our dynamic OG image endpoint
        const encodedTitle = encodeURIComponent(title);
        const encodedCompany = encodeURIComponent(company);
        const encodedPriceNew = encodeURIComponent(priceNew);
        const encodedPriceOld = encodeURIComponent(priceOld);
        
        // Construct the absolute URL for the OG image
        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;
        const dynamicImageUrl = `${baseUrl}/api/og-image?title=${encodedTitle}&company=${encodedCompany}&priceNew=${encodedPriceNew}&priceOld=${encodedPriceOld}`;
        
        html = html.replace(/<meta property="og:image" content="[^"]*" \/>/g, `<meta property="og:image" content="${dynamicImageUrl}" />`);
        html = html.replace(/<meta name="twitter:image" content="[^"]*" \/>/g, `<meta name="twitter:image" content="${dynamicImageUrl}" />`);
        
        // If using Vite middleware, we need to let Vite transform the HTML first
        if (process.env.NODE_ENV !== "production") {
          // We can't easily intercept Vite's HTML transform here without a plugin, 
          // but we can send it directly for crawlers
          const userAgent = req.headers['user-agent'] || '';
          const isCrawler = /bot|facebook|whatsapp|telegram|twitter|linkedin/i.test(userAgent);
          
          if (isCrawler) {
            return res.send(html);
          }
          return next();
        } else {
          return res.send(html);
        }
      }
    } catch (error) {
      console.error("Error injecting OG tags:", error);
    }
    
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
