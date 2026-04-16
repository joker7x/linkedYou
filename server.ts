
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { SUPABASE_URL, SUPABASE_KEY, MAIN_TABLE } from "./constants.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
        
        if (drugData && drugData.length > 0) {
          const drug = drugData[0];
          title = `تحديث سعر: ${drug.name_ar || drug.name_en}`;
          description = `السعر الجديد: ${drug.price_new} ج.م بدلاً من ${drug.price_old} ج.م | ${drug.company}`;
        }

        // Read index.html and inject tags
        const indexPath = process.env.NODE_ENV !== "production" 
          ? path.resolve(__dirname, 'index.html')
          : path.resolve(__dirname, 'dist', 'index.html');
          
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        // Replace OG tags
        html = html.replace(/<meta property="og:title" content="[^"]*" \/>/g, `<meta property="og:title" content="${title}" />`);
        html = html.replace(/<meta property="og:description" content="[^"]*" \/>/g, `<meta property="og:description" content="${description}" />`);
        
        // We can also generate a dynamic image URL if we have a service, but for now we use the text data
        // You could use a service like og-image.vercel.app to generate an image from text
        const encodedTitle = encodeURIComponent(title);
        const encodedDesc = encodeURIComponent(description);
        const dynamicImageUrl = `https://og-image.vercel.app/${encodedTitle}.png?theme=light&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-black.svg&widths=0&heights=0`;
        
        html = html.replace(/<meta property="og:image" content="[^"]*" \/>/g, `<meta property="og:image" content="${dynamicImageUrl}" />`);
        
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
