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
            backgroundColor: '#f5f7fb',
            color: '#1e293b',
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
                  width: '800px',
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
                  padding: '60px',
                },
                children: [
                  // App Branding (Minimal)
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: '20px', color: '#64748b', marginBottom: '40px', letterSpacing: '0.05em' },
                      children: 'PHARMA CORE'
                    }
                  },
                  // Product Name
                  { 
                    type: 'h1', 
                    props: { 
                      style: { fontSize: '56px', fontWeight: 'bold', marginBottom: '50px', lineHeight: '1.2' }, 
                      children: name 
                    } 
                  },
                  // Pricing Row
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', alignItems: 'flex-end', gap: '20px' },
                            children: [
                              { type: 'span', props: { style: { fontSize: '56px', fontWeight: 'bold', color: '#3b82f6' }, children: `${priceNew} ج.م` } },
                              priceOld > priceNew ? { type: 'span', props: { style: { fontSize: '32px', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '8px' }, children: `${priceOld} ج.م` } } : {}
                            ]
                          }
                        },
                        discount > 0 ? {
                          type: 'div',
                          props: {
                            style: { backgroundColor: '#eff6ff', color: '#3b82f6', padding: '10px 20px', borderRadius: '12px', fontSize: '24px', fontWeight: 'bold' },
                            children: `وفر ${discount}%`
                          }
                        } : {}
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
    console.error('Error generating UI-consistent OG image:', error);
    res.status(500).send('Error generating UI image');
  }
}
