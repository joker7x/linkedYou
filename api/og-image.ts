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
            backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #7e22ce 100%)',
            color: 'white',
            fontFamily: 'Tajawal',
            padding: '40px',
            flexDirection: 'column',
          },
          children: [
            // Top: Branding
            {
              type: 'div',
              props: {
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
                children: [
                    { type: 'div', props: { style: { fontSize: '32px', fontWeight: 'bold', letterSpacing: '-1px' }, children: 'PHARMA CORE' } },
                    { type: 'div', props: { style: { backgroundColor: '#ef4444', color: 'white', padding: '8px 20px', borderRadius: '50px', fontSize: '20px', fontWeight: 'bold' }, children: '🔥 تحديث سعر' } }
                ]
              }
            },
            // Center: Product Name
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px'
                },
                children: { 
                  type: 'h1', 
                  props: { 
                    style: { fontSize: '72px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.1' }, 
                    children: name 
                  } 
                }
              }
            },
            // Bottom: Pricing Section
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '30px',
                  borderRadius: '25px',
                },
                children: [
                  { 
                    type: 'div', 
                    props: { 
                      style: { display: 'flex', alignItems: 'center', gap: '15px', textShadow: '0 4px 10px rgba(0,0,0,0.3)' },
                      children: [
                        { type: 'span', props: { style: { fontSize: '80px', fontWeight: 'bold', color: '#22c55e' }, children: `${priceNew} ج.م` } },
                        priceOld > priceNew ? { type: 'span', props: { style: { fontSize: '40px', color: '#94a3b8', textDecoration: 'line-through' }, children: `${priceOld} ج.م` } } : {}
                      ]
                    } 
                  },
                  discount > 0 ? { 
                    type: 'div', 
                    props: { 
                      style: { backgroundColor: '#ef4444', color: 'white', padding: '15px 30px', borderRadius: '15px', fontSize: '40px', fontWeight: 'bold', transform: 'rotate(-5deg)' }, 
                      children: `وفر ${discount}%` 
                    } 
                  } : {}
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
    console.error('Error generating high-converting OG image:', error);
    res.status(500).send('Error generating Ad image');
  }
}
