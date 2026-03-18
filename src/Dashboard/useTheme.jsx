/* ═══════════════════════════════════════════════════════════════
   LoveLine — Theme System (Light & Dark)
   ═══════════════════════════════════════════════════════════════ */
import { createContext, useContext, useState, useEffect } from 'react';

// ─── Palette ─────────────────────────────────────────────────────────────────
export const LIGHT = {
  // Backgrounds
  bg:           '#FDF6F0',
  bgDark:       '#F5EDE5',
  bgCard:       '#FFFFFF',
  beige:        '#F0EAD6',
  lavender:     '#E6E6FA',
  lavenderSoft: '#F3F3FF',

  // Text
  text:         '#1A0812',
  textMid:      '#2D1020',
  textSoft:     '#7B4D5E',
  textMuted:    '#B08A9A',

  // Accents
  gold:         '#D4AF37',
  goldDark:     '#B8942E',
  goldLight:    '#F0D875',
  rose:         '#880E4F',
  roseLight:    '#C2185B',
  roseSoft:     '#FCE4EC',

  // Action colors
  like:         '#E91E63',
  nope:         '#607D8B',
  superlike:    '#2196F3',
  boost:        '#9C27B0',

  // Glass
  glassBg:      'rgba(255, 255, 255, 0.55)',
  glassBorder:  'rgba(255, 255, 255, 0.80)',
  glassBlur:    '24px',
  navGlass:     'rgba(253, 246, 240, 0.70)',
  navBorder:    'rgba(212, 175, 55, 0.15)',

  // Shadows
  shadowCard:   '0 8px 40px rgba(136, 14, 79, 0.08)',
  shadowGold:   '0 4px 24px rgba(212, 175, 55, 0.20)',
  shadowDeep:   '0 24px 80px rgba(26, 8, 18, 0.12)',

  // Status
  online:       '#4CAF50',
  offline:      '#9E9E9E',
};

export const DARK = {
  bg:           '#0F0810',
  bgDark:       '#160B18',
  bgCard:       '#1E1020',
  beige:        '#2A1A2E',
  lavender:     '#2D2040',
  lavenderSoft: '#251830',

  text:         '#F8EDF5',
  textMid:      '#E8D5E0',
  textSoft:     '#B890A8',
  textMuted:    '#7A5570',

  gold:         '#D4AF37',
  goldDark:     '#B8942E',
  goldLight:    '#EDD060',
  rose:         '#C2185B',
  roseLight:    '#E91E63',
  roseSoft:     '#3D0A20',

  like:         '#E91E63',
  nope:         '#546E7A',
  superlike:    '#1565C0',
  boost:        '#7B1FA2',

  glassBg:      'rgba(30, 16, 32, 0.65)',
  glassBorder:  'rgba(212, 175, 55, 0.12)',
  glassBlur:    '24px',
  navGlass:     'rgba(15, 8, 16, 0.75)',
  navBorder:    'rgba(212, 175, 55, 0.12)',

  shadowCard:   '0 8px 40px rgba(0, 0, 0, 0.40)',
  shadowGold:   '0 4px 24px rgba(212, 175, 55, 0.15)',
  shadowDeep:   '0 24px 80px rgba(0, 0, 0, 0.50)',

  online:       '#66BB6A',
  offline:      '#616161',
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ll_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggle = () => setIsDark(d => {
    localStorage.setItem('ll_theme', !d ? 'dark' : 'light');
    return !d;
  });

  const T = isDark ? DARK : LIGHT;

  // Apply CSS vars to :root
  useEffect(() => {
    const r = document.documentElement.style;
    Object.entries(T).forEach(([k, v]) => {
      r.setProperty(`--ll-${k}`, v);
    });
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark, T]);

  return (
    <ThemeCtx.Provider value={{ T, isDark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};
