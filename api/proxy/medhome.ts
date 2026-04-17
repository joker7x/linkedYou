import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { offset } = req.body;
  const MEDHOME_API_URL = "https://dwaprices.com/api_dr88g/serverz.php";

  try {
    const response = await fetch(MEDHOME_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: `lastpricesForFlutter=${offset}`
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `API Error: ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: "Failed to fetch from external API" });
  }
}
