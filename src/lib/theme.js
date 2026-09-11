// Shared theme engine. Two CSS variables (--brand-navy, --brand-blue) drive
// every bg-brand-navy / text-brand-navy / border-brand-navy class across the
// entire app (see tailwind.config.js + src/index.css) — so applying a theme
// here re-skins every existing page with zero per-page changes.

// A curated set of primary/accent pairs, chosen to still read as "premium
// hospitality" rather than a generic color-picker grid. Each hotel/group
// (via PropertySettings) or platform admin (via their own view preference)
// can also enter a fully custom hex pair.
export const THEME_PRESETS = [
  { name: 'Hostera Navy', primary: '#123B63', accent: '#1F5A8A' },
  { name: 'Emerald Resort', primary: '#0F4C3A', accent: '#15803D' },
  { name: 'Burgundy Estate', primary: '#5C1A2B', accent: '#9F2B4E' },
  { name: 'Charcoal & Gold', primary: '#1F2937', accent: '#B8860B' },
  { name: 'Terracotta Coast', primary: '#7C2D12', accent: '#C2410C' },
  { name: 'Slate Violet', primary: '#312E5C', accent: '#6D28D9' },
  { name: 'Midnight Teal', primary: '#0F3D3E', accent: '#0D9488' },
  { name: 'Onyx', primary: '#111827', accent: '#374151' },
];

export function applyThemeColors(primary, accent) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (primary) root.style.setProperty('--brand-navy', primary);
  if (accent) root.style.setProperty('--brand-blue', accent);
}

export function resetThemeColors() {
  applyThemeColors(THEME_PRESETS[0].primary, THEME_PRESETS[0].accent);
}
