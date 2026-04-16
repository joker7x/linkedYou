import type { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const title = req.query.title as string || 'Pharma Core';
    const company = req.query.company as string || 'شركة الأدوية';
    const priceNew = req.query.priceNew as string || '---';
    const priceOld = req.query.priceOld as string || '---';

    // Fetch a font that supports Arabic (Tajawal)
    const fontRes = await fetch('https://raw.githubusercontent.com/googlefonts/tajawal/main/fonts/ttf/Tajawal-Bold.ttf');
    const fontBuffer = await fontRes.arrayBuffer();

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
}
