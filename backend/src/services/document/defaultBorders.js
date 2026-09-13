/**
 * 10 Professional Academic Page Border Art Definitions
 * Default is "بدون إطار" (none).
 * Scalable SVG vector patterns for A4 (794px x 1123px)
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

const defaultBorders = [
  // 1. 🚫 بدون إطار (No Border) — DEFAULT FOR EVERY NEW RESEARCH
  {
    borderId: 'none',
    id: 'none',
    name: 'بدون إطار',
    nameAr: 'بدون إطار',
    category: 'minimal',
    type: 'none',
    accentColor: '#94a3b8',
    isDefault: true,
    active: true,
    svgPattern: '',
    docxBorder: {
      style: 'none',
      size: 0,
      color: 'auto'
    }
  },

  // 2. ⭐ Star Border (Word Academic Star Border Art)
  {
    borderId: 'stars',
    id: 'stars',
    name: 'Star Border',
    nameAr: '⭐ إطار النجوم (Word Art)',
    category: 'ornamental',
    accentColor: '#DAA520',
    isDefault: false,
    active: true,
    svgPattern: generateStarBorderSvg(),
    docxBorder: {
      style: 'double',
      size: 12,
      color: 'DAA520'
    }
  },

  // 3. 🌸 Floral / Flower Decorative Border
  {
    borderId: 'floral',
    id: 'floral',
    name: 'Floral Ornamental',
    nameAr: '🌸 إطار الزهور',
    category: 'ornamental',
    accentColor: '#2D5A27',
    isDefault: false,
    active: true,
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="24" y="24" width="746" height="1075" stroke="#2D5A27" stroke-width="2" fill="none"/>
      <rect x="30" y="30" width="734" height="1063" stroke="#8FBC8F" stroke-width="1" stroke-dasharray="4,3" fill="none"/>
      <rect x="36" y="36" width="722" height="1051" stroke="#2D5A27" stroke-width="1" fill="none"/>
      
      <g transform="translate(30, 30)">
        <circle cx="0" cy="0" r="12" fill="#FAF5EF" stroke="#2D5A27" stroke-width="1.2"/>
        <path d="M0,-10 C4,-4 10,0 0,0 C-10,0 -4,-4 0,-10 Z" fill="#2D5A27"/>
        <path d="M10,0 C4,4 0,10 0,0 C0,-10 4,-4 10,0 Z" fill="#2D5A27"/>
        <path d="M0,10 C-4,4 -10,0 0,0 C10,0 4,4 0,10 Z" fill="#2D5A27"/>
        <path d="M-10,0 C-4,-4 0,-10 0,0 C0,10 -4,4 -10,0 Z" fill="#2D5A27"/>
        <circle cx="0" cy="0" r="3" fill="#D4AF37"/>
      </g>
      <g transform="translate(764, 30)">
        <circle cx="0" cy="0" r="12" fill="#FAF5EF" stroke="#2D5A27" stroke-width="1.2"/>
        <path d="M0,-10 C4,-4 10,0 0,0 C-10,0 -4,-4 0,-10 Z" fill="#2D5A27"/>
        <path d="M10,0 C4,4 0,10 0,0 C0,-10 4,-4 10,0 Z" fill="#2D5A27"/>
        <path d="M0,10 C-4,4 -10,0 0,0 C10,0 4,4 0,10 Z" fill="#2D5A27"/>
        <path d="M-10,0 C-4,-4 0,-10 0,0 C0,10 -4,4 -10,0 Z" fill="#2D5A27"/>
        <circle cx="0" cy="0" r="3" fill="#D4AF37"/>
      </g>
      <g transform="translate(30, 1093)">
        <circle cx="0" cy="0" r="12" fill="#FAF5EF" stroke="#2D5A27" stroke-width="1.2"/>
        <path d="M0,-10 C4,-4 10,0 0,0 C-10,0 -4,-4 0,-10 Z" fill="#2D5A27"/>
        <path d="M10,0 C4,4 0,10 0,0 C0,-10 4,-4 10,0 Z" fill="#2D5A27"/>
        <path d="M0,10 C-4,4 -10,0 0,0 C10,0 4,4 0,10 Z" fill="#2D5A27"/>
        <path d="M-10,0 C-4,-4 0,-10 0,0 C0,10 -4,4 -10,0 Z" fill="#2D5A27"/>
        <circle cx="0" cy="0" r="3" fill="#D4AF37"/>
      </g>
      <g transform="translate(764, 1093)">
        <circle cx="0" cy="0" r="12" fill="#FAF5EF" stroke="#2D5A27" stroke-width="1.2"/>
        <path d="M0,-10 C4,-4 10,0 0,0 C-10,0 -4,-4 0,-10 Z" fill="#2D5A27"/>
        <path d="M10,0 C4,4 0,10 0,0 C0,-10 4,-4 10,0 Z" fill="#2D5A27"/>
        <path d="M0,10 C-4,4 -10,0 0,0 C10,0 4,4 0,10 Z" fill="#2D5A27"/>
        <path d="M-10,0 C-4,-4 0,-10 0,0 C0,10 -4,4 -10,0 Z" fill="#2D5A27"/>
        <circle cx="0" cy="0" r="3" fill="#D4AF37"/>
      </g>
    </svg>`,
    docxBorder: {
      style: 'single',
      size: 12,
      color: '2D5A27'
    }
  },

  // 4. 🕌 Islamic Geometric Border (Rub el Hizb)
  {
    borderId: 'islamic',
    id: 'islamic',
    name: 'Islamic Geometric',
    nameAr: 'إطار إسلامي',
    category: 'islamic',
    accentColor: '#B8860B',
    isDefault: false,
    active: true,
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="24" y="24" width="746" height="1075" stroke="#B8860B" stroke-width="2.5" fill="none"/>
      <rect x="32" y="32" width="730" height="1059" stroke="#1B4D3E" stroke-width="1" fill="none"/>
      <rect x="40" y="40" width="714" height="1043" stroke="#B8860B" stroke-width="1.5" stroke-dasharray="8,4" fill="none"/>
      
      <g transform="translate(32, 32)">
        <polygon points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5" fill="#B8860B"/>
        <polygon points="-8.5,-8.5 0,-5 8.5,-8.5 5,0 8.5,8.5 0,5 -8.5,8.5 -5,0" fill="#1B4D3E"/>
        <circle cx="0" cy="0" r="2.5" fill="#FFF"/>
      </g>
      <g transform="translate(762, 32)">
        <polygon points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5" fill="#B8860B"/>
        <polygon points="-8.5,-8.5 0,-5 8.5,-8.5 5,0 8.5,8.5 0,5 -8.5,8.5 -5,0" fill="#1B4D3E"/>
        <circle cx="0" cy="0" r="2.5" fill="#FFF"/>
      </g>
      <g transform="translate(32, 1091)">
        <polygon points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5" fill="#B8860B"/>
        <polygon points="-8.5,-8.5 0,-5 8.5,-8.5 5,0 8.5,8.5 0,5 -8.5,8.5 -5,0" fill="#1B4D3E"/>
        <circle cx="0" cy="0" r="2.5" fill="#FFF"/>
      </g>
      <g transform="translate(762, 1091)">
        <polygon points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5" fill="#B8860B"/>
        <polygon points="-8.5,-8.5 0,-5 8.5,-8.5 5,0 8.5,8.5 0,5 -8.5,8.5 -5,0" fill="#1B4D3E"/>
        <circle cx="0" cy="0" r="2.5" fill="#FFF"/>
      </g>
    </svg>`,
    docxBorder: {
      style: 'triple',
      size: 12,
      color: 'B8860B'
    }
  },

  // 5. 🏛️ Classic Academic Border
  {
    borderId: 'classic',
    id: 'classic',
    name: 'Classic Academic',
    nameAr: 'إطار أكاديمي كلاسيكي',
    category: 'academic',
    accentColor: '#8B0000',
    isDefault: false,
    active: true,
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="24" y="24" width="746" height="1075" rx="4" stroke="#8B0000" stroke-width="2" fill="none"/>
      <rect x="30" y="30" width="734" height="1063" rx="2" stroke="#2D5A27" stroke-width="1.2" stroke-dasharray="6,3" fill="none"/>
      <rect x="36" y="36" width="722" height="1051" stroke="#8B0000" stroke-width="1" fill="none"/>
      
      <g transform="translate(30, 30)"><circle cx="0" cy="0" r="12" fill="#FFF8F0" stroke="#8B0000" stroke-width="1.5"/><circle cx="0" cy="0" r="4" fill="#D4AF37"/></g>
      <g transform="translate(764, 30)"><circle cx="0" cy="0" r="12" fill="#FFF8F0" stroke="#8B0000" stroke-width="1.5"/><circle cx="0" cy="0" r="4" fill="#D4AF37"/></g>
      <g transform="translate(30, 1093)"><circle cx="0" cy="0" r="12" fill="#FFF8F0" stroke="#8B0000" stroke-width="1.5"/><circle cx="0" cy="0" r="4" fill="#D4AF37"/></g>
      <g transform="translate(764, 1093)"><circle cx="0" cy="0" r="12" fill="#FFF8F0" stroke="#8B0000" stroke-width="1.5"/><circle cx="0" cy="0" r="4" fill="#D4AF37"/></g>
    </svg>`,
    docxBorder: {
      style: 'double',
      size: 12,
      color: '8B0000'
    }
  },

  // 6. ✒️ Elegant Line Border
  {
    borderId: 'elegant',
    id: 'elegant',
    name: 'Elegant Simple Line',
    nameAr: 'إطار أنيق',
    category: 'elegant',
    accentColor: '#1A365D',
    isDefault: false,
    active: true,
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="25" y="25" width="744" height="1073" stroke="#1A365D" stroke-width="2.5" fill="none"/>
      <rect x="32" y="32" width="730" height="1059" stroke="#C5A059" stroke-width="1" fill="none"/>
      <rect x="38" y="38" width="718" height="1047" stroke="#1A365D" stroke-width="0.8" fill="none"/>
      
      <path d="M25,50 L50,25" stroke="#C5A059" stroke-width="1.5"/>
      <path d="M769,50 L744,25" stroke="#C5A059" stroke-width="1.5"/>
      <path d="M25,1073 L50,1098" stroke="#C5A059" stroke-width="1.5"/>
      <path d="M769,1073 L744,1098" stroke="#C5A059" stroke-width="1.5"/>
    </svg>`,
    docxBorder: {
      style: 'thinThickMediumGap',
      size: 12,
      color: '1A365D'
    }
  },

  // 7. 📐 Geometric Decorative Border
  {
    borderId: 'geometric',
    id: 'geometric',
    name: 'Geometric Decorative',
    nameAr: 'إطار هندسي',
    category: 'geometric',
    accentColor: '#1E3A8A',
    isDefault: false,
    active: true,
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="26" y="26" width="742" height="1071" stroke="#1E3A8A" stroke-width="2" fill="none"/>
      <rect x="34" y="34" width="726" height="1055" stroke="#3B82F6" stroke-width="1.2" stroke-dasharray="6,6" fill="none"/>
      <rect x="42" y="42" width="710" height="1039" stroke="#1E3A8A" stroke-width="1" fill="none"/>
      
      <g transform="translate(34, 34)"><polygon points="0,-8 8,0 0,8 -8,0" fill="#1E3A8A"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(760, 34)"><polygon points="0,-8 8,0 0,8 -8,0" fill="#1E3A8A"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(34, 1089)"><polygon points="0,-8 8,0 0,8 -8,0" fill="#1E3A8A"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
      <g transform="translate(760, 1089)"><polygon points="0,-8 8,0 0,8 -8,0" fill="#1E3A8A"/><circle cx="0" cy="0" r="2.5" fill="#FFF"/></g>
    </svg>`,
    docxBorder: {
      style: 'dashSmallGap',
      size: 12,
      color: '1E3A8A'
    }
  },

  // 8. ⚜️ Decorative Corner Border
  {
    borderId: 'corners',
    id: 'corners',
    name: 'Decorative Corner Frame',
    nameAr: 'إطار الزوايا',
    category: 'ornamental',
    accentColor: '#A16207',
    isDefault: false,
    active: true,
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
    docxBorder: {
      style: 'single',
      size: 12,
      color: 'A16207'
    }
  },

  // 9. 📄 Minimal Academic Border
  {
    borderId: 'minimal',
    id: 'minimal',
    name: 'Minimal Academic',
    nameAr: 'إطار بسيط',
    category: 'minimal',
    accentColor: '#334155',
    isDefault: false,
    active: true,
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="28" y="28" width="738" height="1067" stroke="#334155" stroke-width="1.5" fill="none"/>
      <rect x="34" y="34" width="726" height="1055" stroke="#94A3B8" stroke-width="0.75" fill="none"/>
    </svg>`,
    docxBorder: {
      style: 'single',
      size: 8,
      color: '334155'
    }
  },

  // 10. ⚖️ Double-Line Classic Border
  {
    borderId: 'double',
    id: 'double',
    name: 'Double-Line Classic',
    nameAr: 'إطار مزدوج',
    category: 'classic',
    accentColor: '#0F172A',
    isDefault: false,
    active: true,
    svgPattern: `<svg viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect x="25" y="25" width="744" height="1073" stroke="#0F172A" stroke-width="3" fill="none"/>
      <rect x="33" y="33" width="728" height="1057" stroke="#0F172A" stroke-width="1" fill="none"/>
      <rect x="23" y="23" width="12" height="12" fill="#0F172A"/>
      <rect x="759" y="23" width="12" height="12" fill="#0F172A"/>
      <rect x="23" y="1088" width="12" height="12" fill="#0F172A"/>
      <rect x="759" y="1088" width="12" height="12" fill="#0F172A"/>
    </svg>`,
    docxBorder: {
      style: 'double',
      size: 16,
      color: '0F172A'
    }
  }
];

// Helper to normalize any historical border ID to one of the 10 standard IDs
defaultBorders.getNormalizedBorder = function (id) {
  if (!id || id === 'none') return defaultBorders.find((b) => b.borderId === 'none');
  const exact = defaultBorders.find((b) => b.borderId === id || b.id === id);
  if (exact) return exact;

  // Legacy mappings
  if (id.includes('red')) return defaultBorders.find((b) => b.borderId === 'classic');
  if (id.includes('gold') || id.includes('star')) return defaultBorders.find((b) => b.borderId === 'stars');
  if (id.includes('islamic')) return defaultBorders.find((b) => b.borderId === 'islamic');
  if (id.includes('navy')) return defaultBorders.find((b) => b.borderId === 'elegant');
  if (id.includes('emerald') || id.includes('floral')) return defaultBorders.find((b) => b.borderId === 'floral');
  if (id.includes('minimal')) return defaultBorders.find((b) => b.borderId === 'minimal');

  return defaultBorders.find((b) => b.borderId === 'none'); // 'none' default
};

module.exports = defaultBorders;
