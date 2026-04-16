import type { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const name = req.query.name as string || 'منتج طبي';
    const priceNew = parseFloat(req.query.priceNew as string) || 0;
    const priceOld = parseFloat(req.query.priceOld as string) || 0;
    const discount = req.query.discount ? parseInt(req.query.discount as string) : 
                    (priceOld > priceNew && priceOld > 0 ? Math.round(((priceOld - priceNew) / priceOld) * 100) : 0);

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
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            fontFamily: 'Tajawal',
            alignItems: 'center',
            justifyContent: 'center',
          },
          children: [
            // Card
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  width: '900px',
                  height: '450px',
                  backgroundColor: 'white',
                  borderRadius: '30px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  padding: '40px',
                  position: 'relative',
                },
                children: [
                  // Branding
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
                      children: [
                        { type: 'span', props: { style: { fontSize: '24px', fontWeight: 'bold' }, children: 'PHARMA CORE' } },
                        { type: 'span', props: { style: { fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }, children: 'Premium' } }
                      ]
                    }
                  },
                  // Badges
                  {
                    type: 'div',
                    props: { style: { display: 'flex', gap: '10px', marginBottom: '20px' }, children: [
                        { type: 'div', props: { style: { backgroundColor: '#fef2f2', color: '#ef4444', padding: '5px 15px', borderRadius: '8px', fontSize: '16px' }, children: 'Price Update 🔥' } },
                        discount > 0 ? { type: 'div', props: { style: { backgroundColor: '#ef4444', color: 'white', padding: '5px 15px', borderRadius: '8px', fontSize: '16px' }, children: `-${discount}%` } } : {}
                    ]}
                  },
                  // Product Name
                  { type: 'h1', props: { style: { fontSize: '48px', fontWeight: 'bold', marginBottom: 'auto' }, children: name } },
                  
                  // Pricing
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'flex-end', gap: '20px' },
                      children: [
                        { type: 'span', props: { style: { fontSize: '64px', fontWeight: 'bold', color: '#10b981' }, children: `${priceNew} ج.م` } },
                        priceOld > priceNew ? { type: 'span', props: { style: { fontSize: '32px', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '10px' }, children: `${priceOld} ج.م` } } : {}
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
    console.error('Error generating modern OG image:', error);
    res.status(500).send('Error generating prompt image');
  }
}
