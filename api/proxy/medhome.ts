import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { offset, search } = req.body;
  const MEDHOME_API_URL = "https://dwaprices.com/api_dr88g/serverz.php";

  try {
    const bodyData = `lastpricesForFlutter=${offset || 0}${search ? `&searchForFlutter=${encodeURIComponent(search)}` : ''}`;
    
    const response = await fetch(MEDHOME_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: bodyData
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `API Error: ${response.status}` });
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return res.json([]);
    }

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (e) {
      console.error("JSON Parse Error:", e, "Text:", text);
      res.status(500).json({ error: "Invalid JSON from external API" });
    }
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: "Failed to fetch from external API" });
  }
}
