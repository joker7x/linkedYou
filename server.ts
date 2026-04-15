
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

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
