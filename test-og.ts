import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

async function test() {
  try {
    const fontRes = await fetch('https://raw.githubusercontent.com/googlefonts/tajawal/main/fonts/ttf/Tajawal-Bold.ttf');
    console.log('Font fetch status:', fontRes.status);
    const fontBuffer = await fontRes.arrayBuffer();
    
    const svg = await satori(
      { type: 'div', props: { style: { display: 'flex' }, children: 'Test' } },
      { width: 1200, height: 630, fonts: [{ name: 'Cairo', data: fontBuffer, weight: 700, style: 'normal' }] }
    );
    console.log('SVG generated');
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
