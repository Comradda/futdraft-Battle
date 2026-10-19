import type {
  FilterCategory,
  FilterPreset,
  MaskShape,
  TransitionType,
} from '../types/editor'

export const FILTER_CATEGORIES: Array<{ id: FilterCategory; label: string }> = [
  { id: 'cine', label: 'Cine & Película' },
  { id: 'lifestyle', label: 'Historias IG & Lifestyle' },
  { id: 'urbano', label: 'Urbano & Nocturno' },
  { id: 'retro', label: 'Retro & Analógico' },
  { id: 'bw', label: 'Blanco y Negro' },
]

export const MASK_SHAPE_TO_INT: Record<MaskShape, number> = {
  none: 0,
  split: 1,
  mirror: 2,
  circle: 3,
  rectangle: 4,
  heart: 5,
  star: 6,
}

export const TRANSITION_TYPE_TO_INT: Record<TransitionType, number> = {
  none: 0,
  dissolve: 1,
  white_flash: 2,
  black_flash: 3,
  whip_zoom: 4,
  whip_pan: 5,
  digital_glitch: 6,
  directional_blur: 7,
}

/**
 * 32 Pre-Loaded Categorized Color LUT / Matrix Presets
 */
export const FILTER_PRESETS: FilterPreset[] = [
  // =========================================================================
  // 1. CINE & PELÍCULA (8 filters)
  // =========================================================================
  {
    id: 'oppenheimer_imax',
    name: 'Oppenheimer IMAX',
    category: 'cine',
    categoryLabel: 'Cine & Película',
    description: 'Contraste épico de 70mm, ámbar cálido y sombras densas de celuloide.',
    badgeColor: 'linear-gradient(135deg, #b45309 0%, #1e293b 100%)',
    matrix: [
      1.12, 0.04, -0.04, 0,
      0.02, 1.02, -0.02, 0,
      -0.06, 0.02, 0.94, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.03, -0.02, 0.01],
    gamma: [0.95, 0.96, 1.02],
    gain: [1.14, 1.06, 0.95],
    contrast: 1.22,
    saturation: 0.88,
    halation: 0.18,
    grain: 0.14,
  },
  {
    id: 'teal_orange',
    name: 'Teal & Orange',
    category: 'cine',
    categoryLabel: 'Cine & Película',
    description: 'Separación cromática Hollywood: pieles cálidas y sombras cian.',
    badgeColor: 'linear-gradient(135deg, #0284c7 0%, #f97316 100%)',
    matrix: [
      1.16, -0.04, -0.08, 0,
      -0.02, 1.03, 0.02, 0,
      -0.11, 0.08, 1.15, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.04, 0.01, 0.05],
    gamma: [1.02, 1.0, 0.96],
    gain: [1.15, 1.04, 0.92],
    contrast: 1.15,
    saturation: 1.16,
  },
  {
    id: 'kodak_2383',
    name: 'Kodak 2383',
    category: 'cine',
    categoryLabel: 'Cine & Película',
    description: 'Emulsión de impresión Vision3 con curva en S rica y rojos profundos.',
    badgeColor: 'linear-gradient(135deg, #d97706 0%, #7c2d12 100%)',
    matrix: [
      1.1, 0.05, -0.03, 0,
      0.01, 1.04, -0.02, 0,
      -0.04, 0.03, 0.96, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.01, -0.01, 0.02],
    gamma: [0.97, 0.99, 1.03],
    gain: [1.12, 1.07, 0.97],
    contrast: 1.18,
    saturation: 1.08,
    grain: 0.12,
  },
  {
    id: 'fuji_eterna',
    name: 'Fuji Eterna',
    category: 'cine',
    categoryLabel: 'Cine & Película',
    description: 'Rango dinámico suave, verdes esmeralda orgánicos y tonos pastel.',
    badgeColor: 'linear-gradient(135deg, #059669 0%, #0f766e 100%)',
    matrix: [
      0.98, 0.03, -0.01, 0,
      0.02, 1.06, 0.02, 0,
      -0.02, 0.05, 1.02, 0,
      0, 0, 0, 1,
    ],
    lift: [0.02, 0.03, 0.03],
    gamma: [1.04, 1.05, 1.02],
    gain: [0.96, 1.01, 0.99],
    contrast: 0.94,
    saturation: 0.92,
  },
  {
    id: 'dune_gold',
    name: 'Dune Gold',
    category: 'cine',
    categoryLabel: 'Cine & Película',
    description: 'Atmósfera desértica monocromática en ocre, arena y oro quemado.',
    badgeColor: 'linear-gradient(135deg, #eab308 0%, #78350f 100%)',
    matrix: [
      1.18, 0.08, -0.06, 0,
      0.06, 1.02, -0.05, 0,
      -0.08, -0.04, 0.78, 0,
      0, 0, 0, 1,
    ],
    lift: [0.02, 0.0, -0.04],
    gamma: [1.03, 0.99, 0.88],
    gain: [1.16, 1.06, 0.82],
    contrast: 1.14,
    saturation: 0.82,
  },
  {
    id: 'blade_runner_cyan',
    name: 'Blade Runner Cyan',
    category: 'cine',
    categoryLabel: 'Cine & Película',
    description: 'Distopía neo-noir bañada en neón turquesa y sombras azul acero.',
    badgeColor: 'linear-gradient(135deg, #06b6d4 0%, #1e1b4b 100%)',
    matrix: [
      0.86, -0.04, 0.08, 0,
      -0.02, 1.08, 0.09, 0,
      0.04, 0.12, 1.22, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.03, 0.02, 0.06],
    gamma: [0.92, 1.03, 1.08],
    gain: [0.92, 1.08, 1.2],
    contrast: 1.2,
    saturation: 1.12,
    halation: 0.22,
  },
  {
    id: 'anamorphic_warm',
    name: 'Anamorphic Warm',
    category: 'cine',
    categoryLabel: 'Cine & Película',
    description: 'Brillo de lente anamórfico vintage con altas luces doradas.',
    badgeColor: 'linear-gradient(135deg, #f59e0b 0%, #431407 100%)',
    matrix: [
      1.1, 0.04, -0.02, 0,
      0.02, 1.02, 0.0, 0,
      -0.04, 0.0, 0.94, 0,
      0, 0, 0, 1,
    ],
    lift: [0.01, 0.0, -0.02],
    gamma: [1.03, 1.0, 0.96],
    gain: [1.14, 1.05, 0.94],
    contrast: 1.1,
    saturation: 1.05,
    halation: 0.15,
  },
  {
    id: 'sin_city_red',
    name: 'Sin City Red',
    category: 'cine',
    categoryLabel: 'Cine & Película',
    description: 'Alto contraste dramático que enfatiza los carmesíes y desatura el resto.',
    badgeColor: 'linear-gradient(135deg, #dc2626 0%, #09090b 100%)',
    matrix: [
      1.35, -0.15, -0.15, 0,
      0.18, 0.58, 0.18, 0,
      0.18, 0.18, 0.58, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.05, -0.05, -0.05],
    gamma: [0.95, 0.9, 0.9],
    gain: [1.22, 0.95, 0.95],
    contrast: 1.32,
    saturation: 0.78,
  },

  // =========================================================================
  // 2. HISTORIAS IG & LIFESTYLE (8 filters)
  // =========================================================================
  {
    id: 'clean_aesthetic',
    name: 'Clean Aesthetic',
    category: 'lifestyle',
    categoryLabel: 'Historias IG & Lifestyle',
    description: 'Blancos puros, piel luminosa y micro-contraste limpio para Reels.',
    badgeColor: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
    matrix: [
      1.05, 0.02, 0.0, 0,
      0.01, 1.05, 0.01, 0,
      0.0, 0.02, 1.06, 0,
      0, 0, 0, 1,
    ],
    lift: [0.02, 0.02, 0.03],
    gamma: [1.05, 1.05, 1.06],
    gain: [1.06, 1.06, 1.08],
    contrast: 1.06,
    saturation: 0.95,
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    category: 'lifestyle',
    categoryLabel: 'Historias IG & Lifestyle',
    description: 'Atardecer mágico con resplandor ámbar y sombras aterciopeladas.',
    badgeColor: 'linear-gradient(135deg, #fb923c 0%, #db2777 100%)',
    matrix: [
      1.14, 0.05, -0.03, 0,
      0.03, 1.03, -0.02, 0,
      -0.05, -0.01, 0.9, 0,
      0, 0, 0, 1,
    ],
    lift: [0.02, 0.0, -0.02],
    gamma: [1.04, 1.01, 0.94],
    gain: [1.16, 1.05, 0.9],
    contrast: 1.08,
    saturation: 1.14,
  },
  {
    id: 'miami_peach',
    name: 'Miami Peach',
    category: 'lifestyle',
    categoryLabel: 'Historias IG & Lifestyle',
    description: 'Tonos durazno vibrantes, turquesas tropicales y piel bronceada.',
    badgeColor: 'linear-gradient(135deg, #fda4af 0%, #2dd4bf 100%)',
    matrix: [
      1.12, 0.04, 0.02, 0,
      0.01, 1.02, 0.04, 0,
      -0.03, 0.06, 1.04, 0,
      0, 0, 0, 1,
    ],
    lift: [0.03, 0.01, 0.02],
    gamma: [1.05, 1.0, 1.02],
    gain: [1.12, 1.02, 1.04],
    contrast: 1.05,
    saturation: 1.15,
  },
  {
    id: 'crisp_daylight',
    name: 'Crisp Daylight',
    category: 'lifestyle',
    categoryLabel: 'Historias IG & Lifestyle',
    description: 'Luz diurna cristalina con azules cielo intensos y nitidez editorial.',
    badgeColor: 'linear-gradient(135deg, #38bdf8 0%, #e0f2fe 100%)',
    matrix: [
      1.04, 0.0, 0.0, 0,
      0.0, 1.06, 0.02, 0,
      -0.02, 0.04, 1.12, 0,
      0, 0, 0, 1,
    ],
    lift: [0.0, 0.01, 0.02],
    gamma: [1.02, 1.03, 1.05],
    gain: [1.06, 1.08, 1.12],
    contrast: 1.12,
    saturation: 1.1,
  },
  {
    id: 'matcha_soft',
    name: 'Matcha Soft',
    category: 'lifestyle',
    categoryLabel: 'Historias IG & Lifestyle',
    description: 'Estética botánica japonesa con verdes salvia y negros lavados.',
    badgeColor: 'linear-gradient(135deg, #84cc16 0%, #3f6212 100%)',
    matrix: [
      0.96, 0.04, -0.02, 0,
      0.03, 1.08, 0.02, 0,
      -0.02, 0.04, 0.95, 0,
      0, 0, 0, 1,
    ],
    lift: [0.03, 0.04, 0.02],
    gamma: [1.02, 1.05, 0.99],
    gain: [0.98, 1.04, 0.96],
    contrast: 0.95,
    saturation: 0.9,
  },
  {
    id: 'bronzed_skin',
    name: 'Bronzed Skin',
    category: 'lifestyle',
    categoryLabel: 'Historias IG & Lifestyle',
    description: 'Realza los tonos dorados y cobrizos de la piel con brillo satinado.',
    badgeColor: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
    matrix: [
      1.13, 0.05, -0.04, 0,
      0.03, 1.02, -0.03, 0,
      -0.04, -0.02, 0.9, 0,
      0, 0, 0, 1,
    ],
    lift: [0.0, -0.01, -0.02],
    gamma: [1.02, 0.98, 0.93],
    gain: [1.12, 1.03, 0.92],
    contrast: 1.12,
    saturation: 1.08,
  },
  {
    id: 'minimalist_air',
    name: 'Minimalist Air',
    category: 'lifestyle',
    categoryLabel: 'Historias IG & Lifestyle',
    description: 'Aireado, etéreo y desaturado para vlogs de moda y arquitectura.',
    badgeColor: 'linear-gradient(135deg, #e2e8f0 0%, #64748b 100%)',
    matrix: [
      1.02, 0.03, 0.03, 0,
      0.03, 1.02, 0.03, 0,
      0.03, 0.03, 1.03, 0,
      0, 0, 0, 1,
    ],
    lift: [0.05, 0.05, 0.05],
    gamma: [1.08, 1.08, 1.08],
    gain: [1.04, 1.04, 1.05],
    contrast: 0.92,
    saturation: 0.78,
  },
  {
    id: 'coffee_matte',
    name: 'Coffee Matte',
    category: 'lifestyle',
    categoryLabel: 'Historias IG & Lifestyle',
    description: 'Tonos espresso tostados con sombras mate cálidas estilo editorial.',
    badgeColor: 'linear-gradient(135deg, #78350f 0%, #27272a 100%)',
    matrix: [
      1.06, 0.05, -0.02, 0,
      0.03, 0.99, -0.01, 0,
      -0.03, 0.01, 0.89, 0,
      0, 0, 0, 1,
    ],
    lift: [0.04, 0.02, 0.0],
    gamma: [0.98, 0.96, 0.92],
    gain: [1.05, 0.99, 0.91],
    contrast: 1.04,
    saturation: 0.85,
  },

  // =========================================================================
  // 3. URBANO & NOCTURNO (6 filters)
  // =========================================================================
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    category: 'urbano',
    categoryLabel: 'Urbano & Nocturno',
    description: 'Magentas eléctricos y cianes láser para escenas nocturnas.',
    badgeColor: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
    matrix: [
      1.15, -0.08, 0.14, 0,
      -0.06, 0.96, 0.1, 0,
      0.12, 0.08, 1.24, 0,
      0, 0, 0, 1,
    ],
    lift: [0.01, -0.03, 0.06],
    gamma: [1.02, 0.94, 1.08],
    gain: [1.18, 0.96, 1.24],
    contrast: 1.2,
    saturation: 1.28,
    halation: 0.25,
  },
  {
    id: 'tokyo_night',
    name: 'Tokyo Night',
    category: 'urbano',
    categoryLabel: 'Urbano & Nocturno',
    description: 'Reflejos de lluvia en Shibuya con sombras índigo y luces neón.',
    badgeColor: 'linear-gradient(135deg, #6366f1 0%, #0f172a 100%)',
    matrix: [
      0.96, -0.02, 0.08, 0,
      -0.02, 1.02, 0.06, 0,
      0.04, 0.08, 1.18, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.02, -0.01, 0.05],
    gamma: [0.96, 0.99, 1.06],
    gain: [1.02, 1.06, 1.18],
    contrast: 1.18,
    saturation: 1.14,
  },
  {
    id: 'matrix_emerald',
    name: 'Matrix Emerald',
    category: 'urbano',
    categoryLabel: 'Urbano & Nocturno',
    description: 'Tinte ciber-esmeralda en medios tonos y negros profundos.',
    badgeColor: 'linear-gradient(135deg, #10b981 0%, #022c22 100%)',
    matrix: [
      0.82, 0.08, -0.04, 0,
      0.06, 1.18, 0.04, 0,
      -0.04, 0.08, 0.86, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.03, 0.02, -0.02],
    gamma: [0.9, 1.06, 0.92],
    gain: [0.88, 1.15, 0.9],
    contrast: 1.22,
    saturation: 0.92,
  },
  {
    id: 'gotham_dark',
    name: 'Gotham Dark',
    category: 'urbano',
    categoryLabel: 'Urbano & Nocturno',
    description: 'Grises pizarra acerados y atmósfera sombría de thriller urbano.',
    badgeColor: 'linear-gradient(135deg, #334155 0%, #020617 100%)',
    matrix: [
      0.9, 0.02, 0.02, 0,
      0.02, 0.94, 0.04, 0,
      0.02, 0.05, 1.04, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.04, -0.03, -0.01],
    gamma: [0.88, 0.91, 0.96],
    gain: [0.96, 1.0, 1.06],
    contrast: 1.26,
    saturation: 0.72,
  },
  {
    id: 'street_moody',
    name: 'Street Moody',
    category: 'urbano',
    categoryLabel: 'Urbano & Nocturno',
    description: 'Asfalto húmedo, desaturación selectiva y micro-contraste callejero.',
    badgeColor: 'linear-gradient(135deg, #52525b 0%, #18181b 100%)',
    matrix: [
      1.02, 0.02, -0.02, 0,
      0.02, 0.98, 0.0, 0,
      -0.02, 0.02, 0.96, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.02, -0.02, -0.01],
    gamma: [0.93, 0.94, 0.96],
    gain: [1.06, 1.04, 1.02],
    contrast: 1.2,
    saturation: 0.76,
    grain: 0.15,
  },
  {
    id: 'tungsten_club',
    name: 'Tungsten Club',
    category: 'urbano',
    categoryLabel: 'Urbano & Nocturno',
    description: 'Luces halógenas de club nocturno con ámbar cálido y sombras violetas.',
    badgeColor: 'linear-gradient(135deg, #f59e0b 0%, #4c1d95 100%)',
    matrix: [
      1.16, 0.02, 0.04, 0,
      0.02, 0.98, 0.0, 0,
      0.04, -0.02, 1.08, 0,
      0, 0, 0, 1,
    ],
    lift: [0.02, -0.03, 0.05],
    gamma: [1.04, 0.96, 1.02],
    gain: [1.16, 1.02, 1.06],
    contrast: 1.16,
    saturation: 1.12,
    halation: 0.2,
  },

  // =========================================================================
  // 4. RETRO & ANALÓGICO (5 filters)
  // =========================================================================
  {
    id: 'vhs_1994',
    name: 'VHS 1994 (con Scanlines)',
    category: 'retro',
    categoryLabel: 'Retro & Analógico',
    description: 'Cinta magnética de los 90 con líneas de escaneo CRT y grano analógico.',
    badgeColor: 'linear-gradient(135deg, #a855f7 0%, #2563eb 100%)',
    matrix: [
      1.08, 0.04, 0.06, 0,
      0.02, 0.96, 0.04, 0,
      0.06, 0.04, 1.12, 0,
      0, 0, 0, 1,
    ],
    lift: [0.05, 0.03, 0.07],
    gamma: [1.04, 0.98, 1.06],
    gain: [1.08, 1.0, 1.12],
    contrast: 1.06,
    saturation: 1.12,
    scanlines: 0.45,
    grain: 0.35,
  },
  {
    id: 'polaroid_600',
    name: 'Polaroid 600',
    category: 'retro',
    categoryLabel: 'Retro & Analógico',
    description: 'Química instantánea vintage con altas luces crema y sombras verdosas.',
    badgeColor: 'linear-gradient(135deg, #fde047 0%, #0d9488 100%)',
    matrix: [
      1.08, 0.06, -0.02, 0,
      0.02, 1.04, 0.03, 0,
      -0.02, 0.05, 0.92, 0,
      0, 0, 0, 1,
    ],
    lift: [0.04, 0.05, 0.02],
    gamma: [1.04, 1.03, 0.96],
    gain: [1.08, 1.04, 0.92],
    contrast: 0.98,
    saturation: 0.92,
    grain: 0.2,
  },
  {
    id: 'super_8mm',
    name: 'Super 8mm',
    category: 'retro',
    categoryLabel: 'Retro & Analógico',
    description: 'Celuloide casero de los 70 con halación cálida y grano pronunciado.',
    badgeColor: 'linear-gradient(135deg, #ea580c 0%, #713f12 100%)',
    matrix: [
      1.16, 0.08, -0.04, 0,
      0.04, 1.02, -0.03, 0,
      -0.06, -0.02, 0.84, 0,
      0, 0, 0, 1,
    ],
    lift: [0.04, 0.01, -0.03],
    gamma: [1.04, 0.98, 0.9],
    gain: [1.14, 1.02, 0.86],
    contrast: 1.12,
    saturation: 0.96,
    grain: 0.4,
    halation: 0.3,
  },
  {
    id: 'kodachrome_64',
    name: 'Kodachrome 64',
    category: 'retro',
    categoryLabel: 'Retro & Analógico',
    description: 'Diapositiva legendaria de National Geographic con rojos y amarillos ricos.',
    badgeColor: 'linear-gradient(135deg, #ef4444 0%, #eab308 100%)',
    matrix: [
      1.16, 0.03, -0.03, 0,
      0.02, 1.06, -0.02, 0,
      -0.04, 0.02, 0.96, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.01, -0.01, -0.01],
    gamma: [0.98, 0.99, 0.97],
    gain: [1.14, 1.08, 0.96],
    contrast: 1.18,
    saturation: 1.18,
    grain: 0.16,
  },
  {
    id: 'camcorder_90s',
    name: '90s Camcorder',
    category: 'retro',
    categoryLabel: 'Retro & Analógico',
    description: 'Video CCD Handycam con scanlines sutiles y tinte frío noventero.',
    badgeColor: 'linear-gradient(135deg, #3b82f6 0%, #1e293b 100%)',
    matrix: [
      0.96, 0.02, 0.02, 0,
      0.02, 1.04, 0.03, 0,
      0.0, 0.04, 1.08, 0,
      0, 0, 0, 1,
    ],
    lift: [0.02, 0.03, 0.04],
    gamma: [0.99, 1.02, 1.04],
    gain: [1.0, 1.04, 1.08],
    contrast: 1.08,
    saturation: 0.94,
    scanlines: 0.25,
    grain: 0.18,
  },

  // =========================================================================
  // 5. BLANCO Y NEGRO (5 filters)
  // =========================================================================
  {
    id: 'leica_monochrom',
    name: 'Leica Monochrom',
    category: 'bw',
    categoryLabel: 'Blanco y Negro',
    description: 'Sensor monocromo puro con gradación tonal rica y micro-detalle.',
    badgeColor: 'linear-gradient(135deg, #d4d4d8 0%, #18181b 100%)',
    matrix: [
      0.32, 0.56, 0.12, 0,
      0.32, 0.56, 0.12, 0,
      0.32, 0.56, 0.12, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.01, -0.01, -0.01],
    gamma: [1.0, 1.0, 1.0],
    gain: [1.08, 1.08, 1.08],
    contrast: 1.18,
    saturation: 0.0,
    grain: 0.1,
  },
  {
    id: 'high_contrast_noir',
    name: 'High Contrast Noir',
    category: 'bw',
    categoryLabel: 'Blanco y Negro',
    description: 'Claroscuro dramático de cine negro con sombras de tinta profunda.',
    badgeColor: 'linear-gradient(135deg, #71717a 0%, #000000 100%)',
    matrix: [
      0.38, 0.52, 0.1, 0,
      0.38, 0.52, 0.1, 0,
      0.38, 0.52, 0.1, 0,
      0, 0, 0, 1,
    ],
    lift: [-0.06, -0.06, -0.06],
    gamma: [0.88, 0.88, 0.88],
    gain: [1.22, 1.22, 1.22],
    contrast: 1.38,
    saturation: 0.0,
    grain: 0.2,
  },
  {
    id: 'silver_gelatin',
    name: 'Silver Gelatin',
    category: 'bw',
    categoryLabel: 'Blanco y Negro',
    description: 'Papel baritado de cuarto oscuro con ligero matiz platino-selenio.',
    badgeColor: 'linear-gradient(135deg, #e4e4e7 0%, #3f3f46 100%)',
    matrix: [
      0.31, 0.58, 0.11, 0,
      0.3, 0.59, 0.11, 0,
      0.29, 0.58, 0.15, 0,
      0, 0, 0, 1,
    ],
    lift: [0.0, 0.0, 0.01],
    gamma: [1.02, 1.02, 1.04],
    gain: [1.06, 1.06, 1.09],
    contrast: 1.14,
    saturation: 0.04,
    grain: 0.15,
  },
  {
    id: 'soft_matte_bw',
    name: 'Soft Matte B&W',
    category: 'bw',
    categoryLabel: 'Blanco y Negro',
    description: 'Blanco y negro aterciopelado con negros levantados y luces sedosas.',
    badgeColor: 'linear-gradient(135deg, #a1a1aa 0%, #27272a 100%)',
    matrix: [
      0.33, 0.54, 0.13, 0,
      0.33, 0.54, 0.13, 0,
      0.33, 0.54, 0.13, 0,
      0, 0, 0, 1,
    ],
    lift: [0.06, 0.06, 0.06],
    gamma: [1.06, 1.06, 1.06],
    gain: [0.96, 0.96, 0.96],
    contrast: 0.92,
    saturation: 0.0,
  },
  {
    id: 'newspaper_grit',
    name: 'Newspaper Grit',
    category: 'bw',
    categoryLabel: 'Blanco y Negro',
    description: 'Textura de prensa impresa en película Ilford HP5 forzada a ISO 3200.',
    badgeColor: 'linear-gradient(135deg, #d6d3d1 0%, #1c1917 100%)',
    matrix: [
      0.36, 0.53, 0.11, 0,
      0.35, 0.53, 0.11, 0,
      0.33, 0.51, 0.1, 0,
      0, 0, 0, 1,
    ],
    lift: [0.02, 0.01, -0.01],
    gamma: [0.94, 0.93, 0.9],
    gain: [1.14, 1.12, 1.06],
    contrast: 1.28,
    saturation: 0.05,
    grain: 0.5,
  },
]

export function getFilterPresetById(id: string): FilterPreset | undefined {
  if (!id || id === 'none') return undefined
  return FILTER_PRESETS.find((preset) => preset.id === id)
}

/**
 * WebGL2 Vertex Shader (#version 300 es)
 */
export const VERTEX_SHADER_300 = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

out vec2 v_uv;

void main() {
  v_uv = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

/**
 * WebGL2 Fragment Shader (#version 300 es)
 * Implements:
 * 1. GLSL Transitions (Dissolve, White/Black Flash, Whip Zoom, Whip Pan, Digital Glitch, Directional Blur)
 * 2. Chromatic Aberration & Halation (Red Cinema Glow)
 * 3. Edge-Preserving 5-tap Bilateral Denoiser
 * 4. AMD FidelityFX CAS (Contrast Adaptive Sharpening) 5-tap no-halo kernel
 * 5. 16-Parameter Color Grading Suite (Exposure, Brightness, Contrast, Highlights, Shadows, Whites, Blacks,
 *    Saturation, Skin-Protected Vibrance, Temperature, Tint, Sharpness, Film Grain, Vignette, Midtone Clarity, Deband Dither)
 * 6. 32 Filter Matrix + Lift / Gamma / Gain + Scanlines
 * 7. Chroma Key (RGB/YCbCr similarity, smoothness, green/blue spill suppression)
 * 8. Interactive Vector SDF Masks (Split, Mirror, Circle, Rounded Rectangle, Heart, 5-Point Star)
 */
export const FRAGMENT_SHADER_300 = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform vec2 u_texelSize;
uniform float u_time;
uniform float u_opacity;

// Quality Enhancer Pro
uniform int u_qualityEnabled;
uniform float u_casSharpen;       // 0..1.5 (includes extra CAS boost)
uniform float u_bilateralDenoise; // 0..1
uniform float u_debandDither;     // 0..1
uniform float u_midtoneClarity;   // 0..1

// 16-Parameter Color Grading
uniform float u_exposure;     // -1..1
uniform float u_contrast;     // -1..1
uniform float u_brightness;   // -1..1
uniform float u_highlights;   // -1..1
uniform float u_shadows;      // -1..1
uniform float u_whites;       // -1..1
uniform float u_blacks;       // -1..1
uniform float u_saturation;   // -1..1
uniform float u_vibrance;     // -1..1
uniform float u_temperature;  // -1..1
uniform float u_tint;         // -1..1
uniform float u_sharpness;    // 0..1
uniform float u_filmGrain;    // 0..1
uniform float u_vignette;     // -1..1
uniform float u_chromatic;    // 0..1
uniform float u_halation;     // 0..1

// Filter Preset Uniforms
uniform float u_filterIntensity; // 0..1
uniform mat4 u_filterMatrix;
uniform vec3 u_filterLift;
uniform vec3 u_filterGamma;
uniform vec3 u_filterGain;
uniform float u_filterContrast;
uniform float u_filterSaturation;
uniform float u_scanlines;

// Chroma Key
uniform int u_chromaEnabled;
uniform vec3 u_chromaKeyColor;
uniform float u_chromaSimilarity;
uniform float u_chromaSmoothness;
uniform float u_chromaSpill;

// Interactive Vector Masks
uniform int u_maskShape; // 0=none, 1=split, 2=mirror, 3=circle, 4=rect, 5=heart, 6=star
uniform vec2 u_maskCenter;
uniform vec2 u_maskScale;
uniform float u_maskRotation;
uniform float u_maskFeather;
uniform int u_maskInvert;
uniform float u_maskCornerRadius;

// Transitions
uniform int u_transitionType; // 0=none,1=dissolve,2=white_flash,3=black_flash,4=whip_zoom,5=whip_pan,6=digital_glitch,7=directional_blur
uniform float u_transitionProgress; // 0..1 (0 = start of transition, 1 = fully settled)

float getLuma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float safePow(float baseVal, float expVal) {
  return pow(max(baseVal, 0.0001), expVal);
}

vec3 safePow3(vec3 baseVal, vec3 expVal) {
  return pow(max(baseVal, vec3(0.0001)), max(expVal, vec3(0.05)));
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Signed Distance Functions for Vector Masks
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float dot2(vec2 v) {
  return dot(v, v);
}

float sdHeart(vec2 p) {
  p.x = abs(p.x);
  p.y = -p.y + 0.35;
  if (p.y + p.x > 1.0) {
    return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  }
  return sqrt(min(dot2(p - vec2(0.00, 1.00)),
                  dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}

float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

vec3 sampleWithChromatic(vec2 uv, float caAmount) {
  if (caAmount <= 0.001) {
    return texture(u_tex, clamp(uv, 0.0, 1.0)).rgb;
  }
  vec2 centered = uv - 0.5;
  float dist = length(centered);
  vec2 offset = centered * dist * caAmount * 0.035;
  float r = texture(u_tex, clamp(uv + offset, 0.0, 1.0)).r;
  float g = texture(u_tex, clamp(uv, 0.0, 1.0)).g;
  float b = texture(u_tex, clamp(uv - offset, 0.0, 1.0)).b;
  return vec3(r, g, b);
}

void main() {
  vec2 uv = v_uv;
  float transAlpha = 1.0;
  vec3 flashOverlay = vec3(0.0);
  float flashMix = 0.0;

  // ---------------------------------------------------------------------------
  // 1. GLSL Transitions (when u_transitionType > 0 and u_transitionProgress < 1.0)
  // ---------------------------------------------------------------------------
  float tp = clamp(u_transitionProgress, 0.0, 1.0);
  float invTp = max(0.0, 1.0 - tp);

  if (u_transitionType == 1) {
    // Dissolve
    transAlpha = smoothstep(0.0, 1.0, tp);
  } else if (u_transitionType == 2 && invTp > 0.001) {
    // White Flash
    flashOverlay = vec3(1.0);
    flashMix = safePow(invTp, 1.6) * 0.92;
  } else if (u_transitionType == 3 && invTp > 0.001) {
    // Black Flash
    flashOverlay = vec3(0.0);
    flashMix = safePow(invTp, 1.5) * 0.95;
  } else if (u_transitionType == 4) {
    // Whip Zoom
    float zoom = 1.0 + invTp * invTp * 1.45;
    uv = (uv - 0.5) / zoom + 0.5;
  } else if (u_transitionType == 5) {
    // Whip Pan
    uv.x = fract(uv.x - invTp * invTp * 0.65);
  } else if (u_transitionType == 6) {
    // Digital Glitch
    float sliceY = floor(uv.y * 28.0);
    float n = hash12(vec2(sliceY, floor(u_time * 24.0)));
    if (n < invTp * 0.75) {
      uv.x += (n - 0.5) * invTp * 0.22;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Base Sampling + Directional Blur / Whip Blur + Chromatic Aberration
  // ---------------------------------------------------------------------------
  float extraCA = (u_transitionType == 6) ? invTp * 0.55 : 0.0;
  float totalCA = clamp(u_chromatic + extraCA, 0.0, 1.0);

  vec3 centerCol = sampleWithChromatic(uv, totalCA);

  if ((u_transitionType == 7 || u_transitionType == 4 || u_transitionType == 5) && invTp > 0.001) {
    float blurStrength = invTp * invTp * 0.04;
    vec2 rawDir = uv - 0.5;
    vec2 dir = (u_transitionType == 4 && length(rawDir) > 0.001) ? normalize(rawDir) : vec2(1.0, 0.0);
    vec3 acc = centerCol;
    for (int i = 1; i <= 4; i++) {
      float f = float(i) * 0.25;
      acc += sampleWithChromatic(uv + dir * blurStrength * f, totalCA);
      acc += sampleWithChromatic(uv - dir * blurStrength * f, totalCA);
    }
    centerCol = acc / 9.0;
  }

  // ---------------------------------------------------------------------------
  // 3. 5-Tap Neighbor Sampling for Bilateral Denoiser & AMD FidelityFX CAS
  // ---------------------------------------------------------------------------
  vec2 casStep = u_texelSize * (1.6 + clamp(u_casSharpen, 0.0, 1.5) * 1.4);
  vec3 cN = texture(u_tex, clamp(uv + vec2(0.0, -casStep.y), 0.0, 1.0)).rgb;
  vec3 cS = texture(u_tex, clamp(uv + vec2(0.0,  casStep.y), 0.0, 1.0)).rgb;
  vec3 cW = texture(u_tex, clamp(uv + vec2(-casStep.x, 0.0), 0.0, 1.0)).rgb;
  vec3 cE = texture(u_tex, clamp(uv + vec2( casStep.x, 0.0), 0.0, 1.0)).rgb;

  vec3 workingCol = centerCol;

  // Edge-Preserving 5-Tap Bilateral Denoiser
  if (u_qualityEnabled == 1 && u_bilateralDenoise > 0.001) {
    float sigmaColor = mix(0.04, 0.22, u_bilateralDenoise);
    float inv2Sigma = 1.0 / (2.0 * sigmaColor * sigmaColor);

    float wN = exp(-dot(cN - centerCol, cN - centerCol) * inv2Sigma) * 0.75;
    float wS = exp(-dot(cS - centerCol, cS - centerCol) * inv2Sigma) * 0.75;
    float wW = exp(-dot(cW - centerCol, cW - centerCol) * inv2Sigma) * 0.75;
    float wE = exp(-dot(cE - centerCol, cE - centerCol) * inv2Sigma) * 0.75;

    vec3 denoised = (centerCol + cN * wN + cS * wS + cW * wW + cE * wE) / (1.0 + wN + wS + wW + wE);
    workingCol = mix(workingCol, denoised, u_bilateralDenoise);
  }

  // AMD FidelityFX CAS (Contrast Adaptive Sharpening) + Manual Sharpness
  float totalSharpen = u_sharpness * 0.85 + ((u_qualityEnabled == 1) ? u_casSharpen * 1.25 : 0.0);
  if (totalSharpen > 0.001) {
    vec3 minRGB = min(workingCol, min(min(cN, cS), min(cW, cE)));
    vec3 maxRGB = max(workingCol, max(max(cN, cS), max(cW, cE)));
    vec3 amp = clamp(min(minRGB, 1.0 - maxRGB) / max(maxRGB, vec3(0.0001)), 0.0, 1.0);
    amp = sqrt(max(amp, vec3(0.0)));
    float peak = -1.0 / mix(8.0, 3.8, clamp(totalSharpen, 0.0, 1.5));
    vec3 w = amp * peak;
    vec3 rcpWeight = 1.0 / max(vec3(0.001), 1.0 + 4.0 * w);
    workingCol = clamp((workingCol + (cN + cS + cW + cE) * w) * rcpWeight, 0.0, 1.0);
  } else if (totalSharpen < -0.001) {
    vec3 blurCol = (cN + cS + cW + cE) * 0.25;
    workingCol = mix(workingCol, blurCol, clamp(-totalSharpen, 0.0, 0.75));
  }

  // ---------------------------------------------------------------------------
  // 4. Halation (Warm Red Cinema Bloom on High-Luminance Areas)
  // ---------------------------------------------------------------------------
  if (u_halation > 0.001) {
    vec2 hStep = u_texelSize * 3.5;
    vec3 hSample =
      texture(u_tex, clamp(uv + vec2(hStep.x, hStep.y), 0.0, 1.0)).rgb +
      texture(u_tex, clamp(uv + vec2(-hStep.x, hStep.y), 0.0, 1.0)).rgb +
      texture(u_tex, clamp(uv + vec2(hStep.x, -hStep.y), 0.0, 1.0)).rgb +
      texture(u_tex, clamp(uv + vec2(-hStep.x, -hStep.y), 0.0, 1.0)).rgb;
    hSample *= 0.25;
    float hiLuma = smoothstep(0.58, 0.95, getLuma(hSample));
    workingCol += vec3(1.0, 0.26, 0.08) * hiLuma * u_halation * 0.42;
  }

  // ---------------------------------------------------------------------------
  // 5. 16-Parameter Color Grading Suite
  // ---------------------------------------------------------------------------
  // Exposure (EV stops) & Brightness
  workingCol *= exp2(u_exposure * 1.35);
  workingCol += u_brightness * 0.25;

  // Temperature (Kelvin Warm/Cool) & Tint (Green/Magenta)
  workingCol.r += u_temperature * 0.14;
  workingCol.b -= u_temperature * 0.14;
  workingCol.g += u_tint * 0.12;
  workingCol.r -= u_tint * 0.05;
  workingCol.b -= u_tint * 0.05;

  // Highlights, Shadows, Whites, Blacks (safe polynomial + safePow so luma=0 or luma=1 never produces NaN)
  float luma = clamp(getLuma(workingCol), 0.0, 1.0);
  float invLuma = 1.0 - luma;
  float shadowMask = safePow(invLuma, 1.7);
  float highlightMask = safePow(luma, 1.7);
  float blackMask = invLuma * invLuma * invLuma;
  float whiteMask = luma * luma * luma;

  workingCol += u_shadows * shadowMask * 0.28;
  workingCol += u_highlights * highlightMask * 0.28;
  workingCol += u_blacks * blackMask * 0.22;
  workingCol += u_whites * whiteMask * 0.22;

  // Contrast & Midtone Clarity Punch
  float contrastFactor = 1.0 + u_contrast * 0.85;
  workingCol = (workingCol - 0.5) * contrastFactor + 0.5;

  if (u_qualityEnabled == 1 && u_midtoneClarity > 0.001) {
    vec2 wideStep = u_texelSize * 3.6;
    vec3 wideMean = (
      texture(u_tex, clamp(uv + vec2(wideStep.x, wideStep.y), 0.0, 1.0)).rgb +
      texture(u_tex, clamp(uv + vec2(-wideStep.x, wideStep.y), 0.0, 1.0)).rgb +
      texture(u_tex, clamp(uv + vec2(wideStep.x, -wideStep.y), 0.0, 1.0)).rgb +
      texture(u_tex, clamp(uv + vec2(-wideStep.x, -wideStep.y), 0.0, 1.0)).rgb
    ) * 0.25;
    float midWeight = 4.0 * luma * (1.0 - luma);
    workingCol += (workingCol - wideMean) * u_midtoneClarity * midWeight * 1.35;
  }

  // Saturation & Skin-Tone Protected Vibrance
  luma = clamp(getLuma(workingCol), 0.0, 1.0);
  float maxC = max(workingCol.r, max(workingCol.g, workingCol.b));
  float minC = min(workingCol.r, min(workingCol.g, workingCol.b));
  float currentSat = maxC - minC;

  // Protect skin tones (orange/red dominance where R > G > B)
  float skinProtection = 1.0 - clamp((workingCol.r - workingCol.g) * 2.2, 0.0, 0.65) * step(workingCol.b, workingCol.g);
  float vibranceBoost = u_vibrance * (1.0 - currentSat) * skinProtection;
  float totalSat = max(0.0, 1.0 + u_saturation + vibranceBoost);
  workingCol = mix(vec3(luma), workingCol, totalSat);

  // ---------------------------------------------------------------------------
  // 6. 32 Filter Matrix + Lift / Gamma / Gain + Scanlines
  // ---------------------------------------------------------------------------
  if (u_filterIntensity > 0.001) {
    vec3 fCol = (u_filterMatrix * vec4(workingCol, 1.0)).rgb;
    fCol = max(vec3(0.0), fCol + u_filterLift);
    fCol = safePow3(fCol * u_filterGain, 1.0 / max(vec3(0.1), u_filterGamma));
    fCol = (fCol - 0.5) * u_filterContrast + 0.5;
    float fLuma = getLuma(fCol);
    fCol = mix(vec3(fLuma), fCol, u_filterSaturation);

    if (u_scanlines > 0.001) {
      float scan = sin(uv.y * u_resolution.y * 1.15 + u_time * 8.0) * 0.5 + 0.5;
      fCol *= 1.0 - u_scanlines * 0.28 * step(0.5, scan);
    }

    workingCol = mix(workingCol, clamp(fCol, 0.0, 1.0), clamp(u_filterIntensity, 0.0, 1.0));
  }

  // ---------------------------------------------------------------------------
  // 7. Film Grain, Vignette & Debanding Blue-Noise Dither
  // ---------------------------------------------------------------------------
  if (u_filmGrain > 0.001) {
    float grainNoise = hash12(uv * u_resolution + vec2(u_time * 67.3, u_time * 31.7)) - 0.5;
    workingCol += grainNoise * u_filmGrain * 0.18;
  }

  if (abs(u_vignette) > 0.001) {
    float distCenter = length((uv - 0.5) * vec2(1.1, 1.1));
    float vig = smoothstep(0.28, 0.88, distCenter);
    workingCol = mix(workingCol, workingCol * (1.0 - u_vignette * 0.85), vig);
  }

  if (u_qualityEnabled == 1 && u_debandDither > 0.001) {
    float dither = (hash12(gl_FragCoord.xy + fract(u_time)) - 0.5) * (u_debandDither * 0.015);
    workingCol += dither;
  }

  // Apply Flash Transition Overlay if active
  if (flashMix > 0.001) {
    workingCol = mix(workingCol, flashOverlay, flashMix);
  }

  workingCol = clamp(workingCol, 0.0, 1.0);
  float finalAlpha = u_opacity * transAlpha;

  // ---------------------------------------------------------------------------
  // 8. Chroma Key + Spill Suppression
  // ---------------------------------------------------------------------------
  if (u_chromaEnabled == 1) {
    float dist = distance(workingCol, u_chromaKeyColor);
    float sim = max(0.01, u_chromaSimilarity);
    float smoothEdge = max(0.005, u_chromaSmoothness);
    float keyAlpha = smoothstep(sim, sim + smoothEdge, dist);
    finalAlpha *= keyAlpha;

    if (u_chromaSpill > 0.001) {
      float spillFactor = (1.0 - keyAlpha) * u_chromaSpill;
      float avgRB = (workingCol.r + workingCol.b) * 0.5;
      workingCol.g = mix(workingCol.g, min(workingCol.g, avgRB), spillFactor);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Interactive Vector Masks (SDF)
  // ---------------------------------------------------------------------------
  if (u_maskShape > 0) {
    float aspect = u_resolution.x / max(1.0, u_resolution.y);
    // Convert UV (0..1, top-left origin) to normalized mask space (-1..1)
    vec2 normPos = (uv - 0.5) * 2.0;
    vec2 p = normPos - u_maskCenter;
    p.x *= aspect;

    float rad = radians(-u_maskRotation);
    float c = cos(rad);
    float s = sin(rad);
    p = mat2(c, -s, s, c) * p;

    vec2 sc = max(vec2(0.05), u_maskScale);
    float feather = max(0.004, u_maskFeather * 0.008);
    float sdf = 0.0;

    if (u_maskShape == 1) {
      // Split half-plane
      sdf = p.y;
    } else if (u_maskShape == 2) {
      // Mirror parallel band
      sdf = abs(p.y) - sc.y * 0.65;
    } else if (u_maskShape == 3) {
      // Circle / Ellipse
      sdf = length(p / sc) - 0.85;
    } else if (u_maskShape == 4) {
      // Rounded Rectangle
      float r = clamp(u_maskCornerRadius * 0.006, 0.0, min(sc.x, sc.y) * 0.75);
      sdf = sdRoundedBox(p, sc * 0.85, r);
    } else if (u_maskShape == 5) {
      // Heart
      sdf = sdHeart(p / (sc * 1.15));
    } else if (u_maskShape == 6) {
      // 5-Pointed Star
      sdf = sdStar5(p / (sc * 1.15), 0.78, 0.42);
    }

    float maskAlpha = 1.0 - smoothstep(-feather, feather, sdf);
    if (u_maskInvert == 1) {
      maskAlpha = 1.0 - maskAlpha;
    }
    finalAlpha *= maskAlpha;
  }

  outColor = vec4(workingCol, clamp(finalAlpha, 0.0, 1.0));
}
`
