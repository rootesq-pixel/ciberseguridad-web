/* Ilustraciones SVG procedurales de producto (sin imágenes externas) */
const C = h => ({ a:`hsl(${h} 100% 60%)`, b:`hsl(${h+20} 100% 45%)`, g:`hsl(${h} 100% 70%)` });
const wrap = (h, inner, glyph='') => {
  const c = C(h);
  return `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
<defs><radialGradient id='bg' cx='50%' cy='45%' r='70%'><stop offset='0' stop-color='hsl(${h} 90% 22%)'/><stop offset='.55' stop-color='#050a18'/><stop offset='1' stop-color='#02040a'/></radialGradient>
<linearGradient id='m' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#2a3550'/><stop offset='.5' stop-color='#0d1426'/><stop offset='1' stop-color='#1b2540'/></linearGradient>
<linearGradient id='gold' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ffe7a3'/><stop offset='1' stop-color='#b9862b'/></linearGradient>
<linearGradient id='n' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='${c.g}'/><stop offset='1' stop-color='${c.b}'/></linearGradient>
<filter id='glow' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='8' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>
<pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'><path d='M40 0H0V40' fill='none' stroke='${c.a}' stroke-opacity='.08'/></pattern></defs>
<rect width='800' height='600' fill='url(#bg)'/><rect width='800' height='600' fill='url(#grid)'/>
<ellipse cx='400' cy='500' rx='230' ry='26' fill='${c.a}' opacity='.18' filter='url(#glow)'/>
${inner(c)}${glyph}</svg>`;
};
const ART = {
  key: c => `<g transform='rotate(-18 400 300)'><rect x='330' y='120' width='140' height='330' rx='42' fill='url(#m)' stroke='${c.a}' stroke-opacity='.6' stroke-width='2'/>
<circle cx='400' cy='165' r='20' fill='#02040a' stroke='${c.a}' stroke-opacity='.5'/><rect x='365' y='450' width='70' height='60' rx='8' fill='url(#gold)'/>
<rect x='378' y='462' width='44' height='8' rx='3' fill='#7a5a1c'/><circle cx='400' cy='300' r='44' fill='#02040a' stroke='url(#gold)' stroke-width='5'/>
<g filter='url(#glow)' fill='none' stroke='${c.g}' stroke-width='3' stroke-linecap='round'><path d='M378 300a22 22 0 0 1 44 0'/><path d='M386 312a14 14 0 0 1 28-12'/><path d='M370 290a32 32 0 0 1 60 2'/><path d='M396 318v-14'/></g>
<text x='400' y='400' fill='${c.a}' fill-opacity='.7' font-family='monospace' font-size='16' text-anchor='middle' letter-spacing='4'>FIDO2</text></g>`,
  nano: c => `<rect x='300' y='210' width='200' height='170' rx='26' fill='url(#m)' stroke='${c.a}' stroke-opacity='.6' stroke-width='2'/>
<rect x='340' y='380' width='120' height='40' rx='6' fill='url(#gold)'/><circle cx='400' cy='295' r='34' fill='#02040a' stroke='url(#gold)' stroke-width='4'/>
<circle cx='400' cy='295' r='16' fill='${c.g}' filter='url(#glow)'/>`,
  firewall: c => `<path d='M180 260 400 170 620 260 400 350z' fill='#1d2740' stroke='${c.a}' stroke-opacity='.5'/><path d='M180 260v90l220 90v-90z' fill='#0d1426' stroke='${c.a}' stroke-opacity='.5'/><path d='M620 260v90l-220 90v-90z' fill='#141c32' stroke='${c.a}' stroke-opacity='.5'/>
${[0,1,2,3].map(i=>`<rect x='${430+i*40}' y='${355-i*16}' width='22' height='16' fill='#02040a' stroke='${c.a}' stroke-opacity='.6' transform='skewY(-22)' />`).join('')}
${[0,1,2,3,4].map(i=>`<circle cx='${215+i*30}' cy='${318+i*12}' r='5' fill='${i%2?c.g:'#29f0a6'}' filter='url(#glow)'/>`).join('')}
<path d='M330 230 400 202 470 230 400 258z' fill='none' stroke='${c.g}' stroke-width='2' filter='url(#glow)'/>`,
  usb: c => `<g transform='rotate(-25 400 300)'><rect x='270' y='240' width='300' height='120' rx='26' fill='url(#m)' stroke='${c.a}' stroke-opacity='.6' stroke-width='2'/><rect x='570' y='265' width='70' height='70' rx='6' fill='#c9d2e3'/>
${[0,1,2,3,4].map(i=>[0,1].map(j=>`<rect x='${300+i*42}' y='${262+j*42}' width='30' height='30' rx='7' fill='#0a1020' stroke='${c.a}' stroke-opacity='.7'/><text x='${315+i*42}' y='${283+j*42}' fill='${c.g}' font-family='monospace' font-size='14' text-anchor='middle'>${(i+j*5+1)%10}</text>`).join('')).join('')}
<circle cx='520' cy='250' r='5' fill='#29f0a6' filter='url(#glow)'/></g>`,
  edr: c => `<path d='M400 130 270 185v95c0 85 55 150 130 175 75-25 130-90 130-175v-95z' fill='url(#m)' stroke='url(#n)' stroke-width='4' filter='url(#glow)'/>
<path d='M300 310h45l20-45 30 90 25-60 15 15h65' fill='none' stroke='${c.g}' stroke-width='5' stroke-linejoin='round' filter='url(#glow)'/>`,
  vpn: c => `${[0,1,2,3,4,5].map(i=>`<ellipse cx='400' cy='300' rx='${270-i*42}' ry='${170-i*26}' fill='none' stroke='${c.a}' stroke-opacity='${.15+i*.12}' stroke-width='2'/>`).join('')}
<rect x='360' y='290' width='80' height='66' rx='10' fill='url(#m)' stroke='${c.g}' stroke-width='3' filter='url(#glow)'/><path d='M375 290v-22a25 25 0 0 1 50 0v22' fill='none' stroke='${c.g}' stroke-width='6'/><circle cx='400' cy='322' r='7' fill='${c.g}'/>`,
  pass: c => `<rect x='220' y='180' width='360' height='240' rx='30' fill='url(#m)' stroke='${c.a}' stroke-opacity='.6' stroke-width='2'/>
<circle cx='330' cy='300' r='70' fill='#02040a' stroke='url(#gold)' stroke-width='5'/>${[...Array(12)].map((_,i)=>`<line x1='330' y1='240' x2='330' y2='252' stroke='${c.g}' stroke-width='3' transform='rotate(${i*30} 330 300)'/>`).join('')}
<circle cx='330' cy='300' r='22' fill='${c.g}' filter='url(#glow)'/><text x='480' y='310' fill='${c.g}' font-family='monospace' font-size='34' text-anchor='middle' letter-spacing='4' filter='url(#glow)'>••••</text>`,
  kit: c => `${ART.edr(c).replace(/<path d='M400 130/,"<path transform='translate(-120 20) scale(.8)' d='M400 130").replace("<path d='M300 310","<path transform='translate(-120 20) scale(.8)' d='M300 310")}<g transform='translate(130 30) scale(.75)'>${ART.key(c)}</g>`,
  kitpro: c => `${[0,1,2].map(i=>`<rect x='250' y='${200+i*70}' width='300' height='56' rx='8' fill='url(#m)' stroke='${c.a}' stroke-opacity='.6'/>${[0,1,2,3].map(j=>`<circle cx='${280+j*18}' cy='${228+i*70}' r='4' fill='${j%2?c.g:'#29f0a6'}' filter='url(#glow)'/>`).join('')}<rect x='400' y='${222+i*70}' width='120' height='12' rx='3' fill='#02040a'/>`).join('')}
<path d='M560 150 510 172v38c0 34 22 60 50 70 28-10 50-36 50-70v-38z' fill='#02040a' stroke='${c.g}' stroke-width='4' filter='url(#glow)'/>`,
};
export function productArt(p) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wrap(p.hue, ART[p.art])); }
export function courseArt(c) {
  const h = c.hue;
  const inner = col => `${[...Array(14)].map((_,i)=>`<path d='M0 ${300+Math.sin(i)*40} Q 200 ${150+i*18} 400 ${300-i*6} T 800 ${260+i*12}' fill='none' stroke='${col.a}' stroke-opacity='${.06+i*.025}' stroke-width='2'/>`).join('')}
<text x='400' y='350' fill='${col.g}' font-family='JetBrains Mono, monospace' font-size='170' font-weight='700' text-anchor='middle' filter='url(#glow)'>${c.glyph.replace('<','&lt;').replace('>','&gt;')}</text>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wrap(h, inner));
}
