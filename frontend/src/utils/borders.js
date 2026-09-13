/**
 * 10 Professional Academic Page Border Art Definitions for Frontend
 * Default is "بدون إطار" (none).
 */

function generateStarBorderSvg() {
  const stars = [];
  const starPoly = (cx, cy, rOut = 6.5, rIn = 2.8) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * 36 - 90) * (Math.PI / 180);
      const r = i % 2 === 0 ? rOut : rIn;
      pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="#FFD700" stroke="#B8860B" stroke-width="0.7"/>`;
  };

  const xMin = 28, xMax = 766, yMin = 28, yMax = 1095;
  const numX = 33;
  const numY = 47;

  for (let i = 0; i < numX; i++) {
    const x = xMin + (i * (xMax - xMin)) / (numX - 1);
    stars.push(starPoly(x, yMin));
    stars.push(starPoly(x, yMax));
  }

  for (let j = 1; j < numY - 1; j++) {
    const y = yMin + (j * (yMax - yMin)) / (numY - 1);
    stars.push(starPoly(xMin, y));
    stars.push(starPoly(xMax, y));
  }

  return `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
    <rect x="20" y="20" width="754" height="1083" stroke="#DAA520" stroke-width="0.8" stroke-dasharray="2,2" fill="none"/>
    <rect x="36" y="36" width="722" height="1051" stroke="#DAA520" stroke-width="0.8" stroke-dasharray="2,2" fill="none"/>
    ${stars.join('\n    ')}
  </svg>`;
}

export const BORDERS_LIST = [
  // 1. 🚫 بدون إطار (No Border) — PRIMARY DEFAULT
  {
    borderId: 'none',
    name: 'بدون إطار',
    nameAr: 'بدون إطار',
    category: 'minimal',
    accentColor: '#94a3b8',
    svgPattern: '',
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="6" y="6" width="88" height="118" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="3,3" fill="#f8fafc"/>
      <text x="50" y="68" font-size="11" fill="#64748b" text-anchor="middle" font-family="sans-serif" font-weight="bold">بدون إطار</text>
    </svg>`
  },

  // 2. ⭐ Star Border (Word Academic Star Border Art)
  {
    borderId: 'stars',
    name: 'Star Border',
    nameAr: 'إطار النجوم',
    category: 'ornamental',
    accentColor: '#DAA520',
    svgPattern: generateStarBorderSvg(),
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="5" y="5" width="90" height="120" stroke="#DAA520" stroke-width="1.5" stroke-dasharray="2,2" fill="none"/>
      <polygon points="10,8 11.5,12 16,12 12.5,14.5 14,18.5 10,16 6,18.5 7.5,14.5 4,12 8.5,12" fill="#FFD700" stroke="#B8860B" stroke-width="0.5"/>
      <polygon points="50,8 51.5,12 56,12 52.5,14.5 54,18.5 50,16 46,18.5 47.5,14.5 44,12 48.5,12" fill="#FFD700" stroke="#B8860B" stroke-width="0.5"/>
      <polygon points="90,8 91.5,12 96,12 92.5,14.5 94,18.5 90,16 86,18.5 87.5,14.5 84,12 88.5,12" fill="#FFD700" stroke="#B8860B" stroke-width="0.5"/>
      <polygon points="10,65 11.5,69 16,69 12.5,71.5 14,75.5 10,73 6,75.5 7.5,71.5 4,69 8.5,69" fill="#FFD700" stroke="#B8860B" stroke-width="0.5"/>
      <polygon points="90,65 91.5,69 96,69 92.5,71.5 94,75.5 90,73 86,75.5 87.5,71.5 84,69 88.5,69" fill="#FFD700" stroke="#B8860B" stroke-width="0.5"/>
      <polygon points="10,120 11.5,124 16,124 12.5,126.5 14,130.5 10,128 6,130.5 7.5,126.5 4,124 8.5,124" fill="#FFD700" stroke="#B8860B" stroke-width="0.5"/>
      <polygon points="50,120 51.5,124 56,124 52.5,126.5 54,130.5 50,128 46,130.5 47.5,126.5 44,124 48.5,124" fill="#FFD700" stroke="#B8860B" stroke-width="0.5"/>
      <polygon points="90,120 91.5,124 96,124 92.5,126.5 94,130.5 90,128 86,130.5 87.5,126.5 84,124 88.5,124" fill="#FFD700" stroke="#B8860B" stroke-width="0.5"/>
    </svg>`
  },

  // 3. 🌸 Floral / Flower Decorative Border
  {
    borderId: 'floral',
    name: 'Floral Ornamental',
    nameAr: 'إطار الزهور',
    category: 'ornamental',
    accentColor: '#2D5A27',
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="24" y="24" width="746" height="1075" stroke="#2D5A27" stroke-width="2" fill="none"/>
      <rect x="30" y="30" width="734" height="1063" stroke="#8FBC8F" stroke-width="1" stroke-dasharray="4,3" fill="none"/>
      <rect x="36" y="36" width="722" height="1051" stroke="#2D5A27" stroke-width="1" fill="none"/>
      <g transform="translate(30, 30)"><circle cx="0" cy="0" r="12" fill="#FAF5EF" stroke="#2D5A27" stroke-width="1.2"/><path d="M0,-10 C4,-4 10,0 0,0 C-10,0 -4,-4 0,-10 Z" fill="#2D5A27"/><path d="M10,0 C4,4 0,10 0,0 C0,-10 4,-4 10,0 Z" fill="#2D5A27"/><path d="M0,10 C-4,4 -10,0 0,0 C10,0 4,4 0,10 Z" fill="#2D5A27"/><path d="M-10,0 C-4,-4 0,-10 0,0 C0,10 -4,4 -10,0 Z" fill="#2D5A27"/><circle cx="0" cy="0" r="3" fill="#D4AF37"/></g>
      <g transform="translate(764, 30)"><circle cx="0" cy="0" r="12" fill="#FAF5EF" stroke="#2D5A27" stroke-width="1.2"/><path d="M0,-10 C4,-4 10,0 0,0 C-10,0 -4,-4 0,-10 Z" fill="#2D5A27"/><path d="M10,0 C4,4 0,10 0,0 C0,-10 4,-4 10,0 Z" fill="#2D5A27"/><path d="M0,10 C-4,4 -10,0 0,0 C10,0 4,4 0,10 Z" fill="#2D5A27"/><path d="M-10,0 C-4,-4 0,-10 0,0 C0,10 -4,4 -10,0 Z" fill="#2D5A27"/><circle cx="0" cy="0" r="3" fill="#D4AF37"/></g>
      <g transform="translate(30, 1093)"><circle cx="0" cy="0" r="12" fill="#FAF5EF" stroke="#2D5A27" stroke-width="1.2"/><path d="M0,-10 C4,-4 10,0 0,0 C-10,0 -4,-4 0,-10 Z" fill="#2D5A27"/><path d="M10,0 C4,4 0,10 0,0 C0,-10 4,-4 10,0 Z" fill="#2D5A27"/><path d="M0,10 C-4,4 -10,0 0,0 C10,0 4,4 0,10 Z" fill="#2D5A27"/><path d="M-10,0 C-4,-4 0,-10 0,0 C0,10 -4,4 -10,0 Z" fill="#2D5A27"/><circle cx="0" cy="0" r="3" fill="#D4AF37"/></g>
      <g transform="translate(764, 1093)"><circle cx="0" cy="0" r="12" fill="#FAF5EF" stroke="#2D5A27" stroke-width="1.2"/><path d="M0,-10 C4,-4 10,0 0,0 C-10,0 -4,-4 0,-10 Z" fill="#2D5A27"/><path d="M10,0 C4,4 0,10 0,0 C0,-10 4,-4 10,0 Z" fill="#2D5A27"/><path d="M0,10 C-4,4 -10,0 0,0 C10,0 4,4 0,10 Z" fill="#2D5A27"/><path d="M-10,0 C-4,-4 0,-10 0,0 C0,10 -4,4 -10,0 Z" fill="#2D5A27"/><circle cx="0" cy="0" r="3" fill="#D4AF37"/></g>
    </svg>`,
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="6" y="6" width="88" height="118" stroke="#2D5A27" stroke-width="1.5" fill="none"/>
      <rect x="10" y="10" width="80" height="110" stroke="#8FBC8F" stroke-width="0.8" stroke-dasharray="2,2" fill="none"/>
      <circle cx="10" cy="10" r="4" fill="#2D5A27"/><circle cx="90" cy="10" r="4" fill="#2D5A27"/>
      <circle cx="10" cy="120" r="4" fill="#2D5A27"/><circle cx="90" cy="120" r="4" fill="#2D5A27"/>
    </svg>`
  },

  // 4. 🕌 Islamic Geometric Border
  {
    borderId: 'islamic',
    name: 'Islamic Geometric',
    nameAr: 'إطار إسلامي',
    category: 'islamic',
    accentColor: '#B8860B',
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="24" y="24" width="746" height="1075" stroke="#B8860B" stroke-width="2.5" fill="none"/>
      <rect x="32" y="32" width="730" height="1059" stroke="#1B4D3E" stroke-width="1" fill="none"/>
      <rect x="40" y="40" width="714" height="1043" stroke="#B8860B" stroke-width="1.5" stroke-dasharray="8,4" fill="none"/>
      <g transform="translate(32, 32)"><polygon points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5" fill="#B8860B"/><polygon points="-8.5,-8.5 0,-5 8.5,-8.5 5,0 8.5,8.5 0,5 -8.5,8.5 -5,0" fill="#1B4D3E"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(762, 32)"><polygon points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5" fill="#B8860B"/><polygon points="-8.5,-8.5 0,-5 8.5,-8.5 5,0 8.5,8.5 0,5 -8.5,8.5 -5,0" fill="#1B4D3E"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(32, 1091)"><polygon points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5" fill="#B8860B"/><polygon points="-8.5,-8.5 0,-5 8.5,-8.5 5,0 8.5,8.5 0,5 -8.5,8.5 -5,0" fill="#1B4D3E"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(762, 1091)"><polygon points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5" fill="#B8860B"/><polygon points="-8.5,-8.5 0,-5 8.5,-8.5 5,0 8.5,8.5 0,5 -8.5,8.5 -5,0" fill="#1B4D3E"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
    </svg>`,
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="6" y="6" width="88" height="118" stroke="#B8860B" stroke-width="1.5" fill="none"/>
      <rect x="10" y="10" width="80" height="110" stroke="#1B4D3E" stroke-width="0.8" stroke-dasharray="3,2" fill="none"/>
      <polygon points="10,6 12,9 15,10 12,11 10,14 8,11 5,10 8,9" fill="#B8860B"/>
      <polygon points="90,6 92,9 95,10 92,11 90,14 88,11 85,10 88,9" fill="#B8860B"/>
      <polygon points="10,116 12,119 15,120 12,121 10,124 8,121 5,120 8,119" fill="#B8860B"/>
      <polygon points="90,116 92,119 95,120 92,121 90,124 88,121 85,120 88,119" fill="#B8860B"/>
    </svg>`
  },

  // 5. 🏛️ Classic Academic Border
  {
    borderId: 'classic',
    name: 'Classic Academic',
    nameAr: 'إطار أكاديمي كلاسيكي',
    category: 'academic',
    accentColor: '#8B0000',
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="24" y="24" width="746" height="1075" rx="4" stroke="#8B0000" stroke-width="2" fill="none"/>
      <rect x="30" y="30" width="734" height="1063" rx="2" stroke="#2D5A27" stroke-width="1.2" stroke-dasharray="6,3" fill="none"/>
      <rect x="36" y="36" width="722" height="1051" stroke="#8B0000" stroke-width="1" fill="none"/>
      <g transform="translate(30, 30)"><circle cx="0" cy="0" r="12" fill="#FFF8F0" stroke="#8B0000" stroke-width="1.5"/><circle cx="0" cy="0" r="4" fill="#D4AF37"/></g>
      <g transform="translate(764, 30)"><circle cx="0" cy="0" r="12" fill="#FFF8F0" stroke="#8B0000" stroke-width="1.5"/><circle cx="0" cy="0" r="4" fill="#D4AF37"/></g>
      <g transform="translate(30, 1093)"><circle cx="0" cy="0" r="12" fill="#FFF8F0" stroke="#8B0000" stroke-width="1.5"/><circle cx="0" cy="0" r="4" fill="#D4AF37"/></g>
      <g transform="translate(764, 1093)"><circle cx="0" cy="0" r="12" fill="#FFF8F0" stroke="#8B0000" stroke-width="1.5"/><circle cx="0" cy="0" r="4" fill="#D4AF37"/></g>
    </svg>`,
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="6" y="6" width="88" height="118" stroke="#8B0000" stroke-width="1.5" fill="none"/>
      <rect x="10" y="10" width="80" height="110" stroke="#2D5A27" stroke-width="0.8" stroke-dasharray="2,2" fill="none"/>
      <circle cx="10" cy="10" r="3.5" fill="#FFF" stroke="#8B0000"/>
      <circle cx="90" cy="10" r="3.5" fill="#FFF" stroke="#8B0000"/>
      <circle cx="10" cy="120" r="3.5" fill="#FFF" stroke="#8B0000"/>
      <circle cx="90" cy="120" r="3.5" fill="#FFF" stroke="#8B0000"/>
    </svg>`
  },

  // 6. ✒️ Elegant Simple Line Border
  {
    borderId: 'elegant',
    name: 'Elegant Simple Line',
    nameAr: 'إطار أنيق',
    category: 'elegant',
    accentColor: '#1A365D',
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="25" y="25" width="744" height="1073" stroke="#1A365D" stroke-width="2.5" fill="none"/>
      <rect x="32" y="32" width="730" height="1059" stroke="#C5A059" stroke-width="1" fill="none"/>
      <rect x="38" y="38" width="718" height="1047" stroke="#1A365D" stroke-width="0.8" fill="none"/>
      <path d="M25,50 L50,25" stroke="#C5A059" stroke-width="1.5"/>
      <path d="M769,50 L744,25" stroke="#C5A059" stroke-width="1.5"/>
      <path d="M25,1073 L50,1098" stroke="#C5A059" stroke-width="1.5"/>
      <path d="M769,1073 L744,1098" stroke="#C5A059" stroke-width="1.5"/>
    </svg>`,
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="6" y="6" width="88" height="118" stroke="#1A365D" stroke-width="1.5" fill="none"/>
      <rect x="10" y="10" width="80" height="110" stroke="#C5A059" stroke-width="0.8" fill="none"/>
      <path d="M6,14 L14,6" stroke="#C5A059" stroke-width="1"/>
      <path d="M94,14 L86,6" stroke="#C5A059" stroke-width="1"/>
      <path d="M6,116 L14,124" stroke="#C5A059" stroke-width="1"/>
      <path d="M94,116 L86,124" stroke="#C5A059" stroke-width="1"/>
    </svg>`
  },

  // 7. 📐 Geometric Decorative Border
  {
    borderId: 'geometric',
    name: 'Geometric Decorative',
    nameAr: 'إطار هندسي',
    category: 'geometric',
    accentColor: '#1E3A8A',
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="26" y="26" width="742" height="1071" stroke="#1E3A8A" stroke-width="2" fill="none"/>
      <rect x="34" y="34" width="726" height="1055" stroke="#3B82F6" stroke-width="1.2" stroke-dasharray="6,6" fill="none"/>
      <rect x="42" y="42" width="710" height="1039" stroke="#1E3A8A" stroke-width="1" fill="none"/>
      <g transform="translate(34, 34)"><polygon points="0,-8 8,0 0,8 -8,0" fill="#1E3A8A"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(760, 34)"><polygon points="0,-8 8,0 0,8 -8,0" fill="#1E3A8A"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(34, 1089)"><polygon points="0,-8 8,0 0,8 -8,0" fill="#1E3A8A"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(760, 1089)"><polygon points="0,-8 8,0 0,8 -8,0" fill="#1E3A8A"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
    </svg>`,
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="6" y="6" width="88" height="118" stroke="#1E3A8A" stroke-width="1.5" fill="none"/>
      <rect x="10" y="10" width="80" height="110" stroke="#3B82F6" stroke-width="0.8" stroke-dasharray="2,2" fill="none"/>
      <polygon points="10,8 12,10 10,12 8,10" fill="#1E3A8A"/>
      <polygon points="90,8 92,10 90,12 88,10" fill="#1E3A8A"/>
      <polygon points="10,118 12,120 10,122 8,120" fill="#1E3A8A"/>
      <polygon points="90,118 92,120 90,122 88,120" fill="#1E3A8A"/>
    </svg>`
  },

  // 8. ⚜️ Decorative Corner Border
  {
    borderId: 'corners',
    name: 'Decorative Corner Border',
    nameAr: 'إطار الزوايا',
    category: 'ornamental',
    accentColor: '#A16207',
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="30" y="30" width="734" height="1063" stroke="#A16207" stroke-width="1.5" fill="none"/>
      <path d="M30,70 L50,70 C60,70 70,60 70,50 L70,30" stroke="#A16207" stroke-width="2" fill="none"/>
      <circle cx="50" cy="50" r="4" fill="#A16207"/>
      <path d="M764,70 L744,70 C734,70 724,60 724,50 L724,30" stroke="#A16207" stroke-width="2" fill="none"/>
      <circle cx="744" cy="50" r="4" fill="#A16207"/>
      <path d="M30,1053 L50,1053 C60,1053 70,1063 70,1073 L70,1093" stroke="#A16207" stroke-width="2" fill="none"/>
      <circle cx="50" cy="1073" r="4" fill="#A16207"/>
      <path d="M764,1053 L744,1053 C734,1053 724,1063 724,1073 L724,1093" stroke="#A16207" stroke-width="2" fill="none"/>
      <circle cx="744" cy="1073" r="4" fill="#A16207"/>
    </svg>`,
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="8" y="8" width="84" height="114" stroke="#A16207" stroke-width="1.2" fill="none"/>
      <path d="M8,18 L14,18 L14,8" stroke="#A16207" stroke-width="1.5" fill="none"/>
      <path d="M92,18 L86,18 L86,8" stroke="#A16207" stroke-width="1.5" fill="none"/>
      <path d="M8,112 L14,112 L14,122" stroke="#A16207" stroke-width="1.5" fill="none"/>
      <path d="M92,112 L86,112 L86,122" stroke="#A16207" stroke-width="1.5" fill="none"/>
    </svg>`
  },

  // 9. 📄 Minimal Academic Border
  {
    borderId: 'minimal',
    name: 'Minimal Academic',
    nameAr: 'إطار بسيط',
    category: 'minimal',
    accentColor: '#334155',
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="28" y="28" width="738" height="1067" stroke="#334155" stroke-width="1.5" fill="none"/>
      <rect x="34" y="34" width="726" height="1055" stroke="#94A3B8" stroke-width="0.75" fill="none"/>
    </svg>`,
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="7" y="7" width="86" height="116" stroke="#334155" stroke-width="1.2" fill="none"/>
      <rect x="10" y="10" width="80" height="110" stroke="#94A3B8" stroke-width="0.6" fill="none"/>
    </svg>`
  },

  // 10. ⚖️ Double-Line Classic Border
  {
    borderId: 'double',
    name: 'Double-Line Classic',
    nameAr: 'إطار مزدوج',
    category: 'classic',
    accentColor: '#0F172A',
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="25" y="25" width="744" height="1073" stroke="#0F172A" stroke-width="3" fill="none"/>
      <rect x="33" y="33" width="728" height="1057" stroke="#0F172A" stroke-width="1" fill="none"/>
      <rect x="23" y="23" width="12" height="12" fill="#0F172A"/>
      <rect x="759" y="23" width="12" height="12" fill="#0F172A"/>
      <rect x="23" y="1088" width="12" height="12" fill="#0F172A"/>
      <rect x="759" y="1088" width="12" height="12" fill="#0F172A"/>
    </svg>`,
    thumbnailSvg: `<svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="6" y="6" width="88" height="118" stroke="#0F172A" stroke-width="2" fill="none"/>
      <rect x="9" y="9" width="82" height="112" stroke="#0F172A" stroke-width="0.8" fill="none"/>
    </svg>`
  }
];

export function getBorderById(id) {
  if (!id || id === 'none') return BORDERS_LIST.find((b) => b.borderId === 'none') || BORDERS_LIST[0];
  const exact = BORDERS_LIST.find((b) => b.borderId === id);
  if (exact) return exact;

  // Legacy mappings
  if (id.includes('red')) return BORDERS_LIST.find((b) => b.borderId === 'classic');
  if (id.includes('gold') || id.includes('star')) return BORDERS_LIST.find((b) => b.borderId === 'stars');
  if (id.includes('islamic')) return BORDERS_LIST.find((b) => b.borderId === 'islamic');
  if (id.includes('navy')) return BORDERS_LIST.find((b) => b.borderId === 'elegant');
  if (id.includes('emerald') || id.includes('floral')) return BORDERS_LIST.find((b) => b.borderId === 'floral');
  if (id.includes('minimal')) return BORDERS_LIST.find((b) => b.borderId === 'minimal');

  return BORDERS_LIST.find((b) => b.borderId === 'none') || BORDERS_LIST[0]; // 'none' default
}
