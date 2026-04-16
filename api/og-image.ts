import type { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const name = req.query.name as string || 'منتج طبي';
    const priceNew = parseFloat(req.query.priceNew as string) || 0;
    const priceOld = parseFloat(req.query.priceOld as string) || 0;

    let diff = 0;
    if (priceOld > 0) {
      diff = Math.round(Math.abs((priceNew - priceOld) / priceOld) * 100);
    }
    const isDecrease = priceNew < priceOld;

    const fontRes = await fetch('https://raw.githubusercontent.com/googlefonts/tajawal/main/fonts/ttf/Tajawal-Bold.ttf');
    const fontBuffer = await fontRes.arrayBuffer();

    const svg = await satori(
      {
        type: 'div',
        props: {
          dir: 'rtl',
          style: {
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f7fb',
            color: '#1e293b',
            fontFamily: 'Tajawal',
            padding: '60px',
            flexDirection: 'column',
          },
          children: [
            // Branding
            { type: 'div', props: { style: { fontSize: '24px', color: '#64748b', marginBottom: '40px' }, children: 'PHARMA CORE' } },
            // Name
            { type: 'h1', props: { style: { fontSize: '72px', fontWeight: 'bold', marginBottom: 'auto', lineHeight: '1.2' }, children: name } },
            // Pricing Row
            {
              type: 'div',
              props: {
                style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
                children: [
                    // New Price
                    { type: 'div', props: { style: { fontSize: '84px', fontWeight: 'bold', color: '#0f172a' }, children: `${priceNew} ج.م` } },
                    // Status Badge
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                backgroundColor: isDecrease ? '#dcfce7' : '#fee2e2',
                                color: isDecrease ? '#166534' : '#991b1b',
                                padding: '15px 30px',
                                borderRadius: '16px',
                                fontSize: '32px',
                                fontWeight: 'bold'
                            },
                            children: [
                                { type: 'span', props: { children: isDecrease ? '⬇️' : '⬆️' } },
                                { type: 'span', props: { children: `${diff}%` } },
                                { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'normal', marginRight: '5px' }, children: priceOld > 0 ? `(${priceOld} ج.م)` : '' } }
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
        fonts: [{ name: 'Tajawal', data: fontBuffer, weight: 700, style: 'normal' }],
      }
    );

    const resvg = new Resvg(svg, { background: 'transparent', fitTo: { mode: 'width', value: 1200 } });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.send(resvg.render().asPng());
  } catch (error) {
    console.error('Error generating UI-styled OG image:', error);
    res.status(500).send('Error generating UI image');
  }
}
