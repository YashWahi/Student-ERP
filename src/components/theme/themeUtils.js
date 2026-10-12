// src/components/theme/themeUtils.js

/**
 * Enterprise Design Tokens Specification
 */
export const DEFAULT_THEME = {
  version: 1,
  preset: 'royal-blue',
  mode: 'light',
  colors: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#EFF6FF',
    primaryBorder: '#BFDBFE',
    secondary: '#0F766E',
    secondaryLight: '#CCFBF1',
    accent: '#7C3AED',
    accentLight: '#F3E8FF',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0EA5E9',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    headingFont: "'Inter', system-ui, sans-serif",
    baseFontSize: 16,
    headingWeight: 800,
  },
  shape: {
    borderRadius: 10,
    buttonRadius: 8,
    cardRadius: 12,
    modalRadius: 16,
  },
  shadows: 'subtle', // none | subtle | medium | elevated
  density: 'comfortable', // compact | comfortable | spacious
  sidebarStyle: 'solid', // solid | light | dark | floating
  branding: {
    collegeName: '',
    shortName: '',
    tagline: 'Empowering Next-Gen Leaders',
    logoUrl: '',
    faviconUrl: '',
    welcomeMessage: 'Welcome to Smart Campus Portal',
  },
};

/**
 * 8 Enterprise Professional Theme Presets
 */
export const THEME_PRESETS = [
  {
    id: 'royal-blue',
    name: 'Royal Blue (Classic Academic)',
    desc: 'Premium sapphire & navy — trusted by global universities',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#EFF6FF',
    primaryBorder: '#BFDBFE',
    secondary: '#0F766E',
    secondaryLight: '#CCFBF1',
    accent: '#7C3AED',
    accentLight: '#F3E8FF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
  },
  {
    id: 'education-green',
    name: 'Education Green (Modern Campus)',
    desc: 'Vibrant emerald & forest teal — environmental & health science',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ECFDF5',
    primaryBorder: '#A7F3D0',
    secondary: '#0284C7',
    secondaryLight: '#E0F2FE',
    accent: '#D97706',
    accentLight: '#FEF3C7',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
  },
  {
    id: 'academic-purple',
    name: 'Academic Purple (Elite Institute)',
    desc: 'Deep royal violet & indigo — research institutions & arts',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryLight: '#F5F3FF',
    primaryBorder: '#DDD6FE',
    secondary: '#DB2777',
    secondaryLight: '#FCE7F3',
    accent: '#2563EB',
    accentLight: '#EFF6FF',
    background: '#FAF5FF',
    surface: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
  },
  {
    id: 'modern-orange',
    name: 'Modern Sunset (Tech & Innovation)',
    desc: 'Warm amber & navy — engineering colleges & coding institutes',
    primary: '#EA580C',
    primaryHover: '#C2410C',
    primaryLight: '#FFF7ED',
    primaryBorder: '#FED7AA',
    secondary: '#1E3A8A',
    secondaryLight: '#DBEAFE',
    accent: '#059669',
    accentLight: '#ECFDF5',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
  },
  {
    id: 'corporate-navy',
    name: 'Corporate Navy (Executive Business)',
    desc: 'Midnight navy & cobalt — management schools & colleges',
    primary: '#1E3A8A',
    primaryHover: '#1E40AF',
    primaryLight: '#EFF6FF',
    primaryBorder: '#BFDBFE',
    secondary: '#0284C7',
    secondaryLight: '#E0F2FE',
    accent: '#7C3AED',
    accentLight: '#F3E8FF',
    background: '#F1F5F9',
    surface: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
  },
  {
    id: 'emerald-premium',
    name: 'Emerald Slate (Luxury & Heritage)',
    desc: 'Forest emerald & slate — heritage boarding schools',
    primary: '#047857',
    primaryHover: '#065F46',
    primaryLight: '#ECFDF5',
    primaryBorder: '#A7F3D0',
    secondary: '#475569',
    secondaryLight: '#F1F5F9',
    accent: '#B45309',
    accentLight: '#FEF3C7',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
  },
  {
    id: 'minimal-white',
    name: 'Minimal Slate (Clean Monochrome)',
    desc: 'High contrast slate & pure white — modern international schools',
    primary: '#334155',
    primaryHover: '#1E293B',
    primaryLight: '#F8FAFC',
    primaryBorder: '#E2E8F0',
    secondary: '#2563EB',
    secondaryLight: '#EFF6FF',
    accent: '#059669',
    accentLight: '#ECFDF5',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
  },
  {
    id: 'sunset-gold',
    name: 'Crimson & Gold (Prestige Academy)',
    desc: 'Rich crimson & golden yellow — prestigious academies',
    primary: '#BE123C',
    primaryHover: '#9F1239',
    primaryLight: '#FFF1F2',
    primaryBorder: '#FECDD3',
    secondary: '#D97706',
    secondaryLight: '#FEF3C7',
    accent: '#4338CA',
    accentLight: '#EEF2FF',
    background: '#FFFDF9',
    surface: '#FFFFFF',
    sidebar: '#FFFFFF',
    header: '#FFFFFF',
  },
];

export const getThemePresetById = (presetId) => {
  return THEME_PRESETS.find(p => p.id === presetId) || THEME_PRESETS[0];
};

/**
 * Generate a tenant-default theme configuration dynamically linked to the tenant's actual metadata
 */
export const createTenantDefaultTheme = (tenant = {}) => {
  const collegeName = tenant.name || tenant.collegeName || 'Educational Institution';
  const shortName = tenant.code || tenant.collegeCode || 'COL';
  const preset = getThemePresetById('royal-blue');

  return {
    ...DEFAULT_THEME,
    preset: 'royal-blue',
    colors: {
      ...DEFAULT_THEME.colors,
      primary: preset.primary,
      primaryHover: preset.primaryHover,
      primaryLight: preset.primaryLight,
      primaryBorder: preset.primaryBorder,
      secondary: preset.secondary,
      secondaryLight: preset.secondaryLight,
      accent: preset.accent,
      accentLight: preset.accentLight,
    },
    branding: {
      ...DEFAULT_THEME.branding,
      collegeName,
      shortName,
      tagline: tenant.tagline || 'Empowering Next-Gen Leaders',
      logoUrl: tenant.logoUrl || '',
      faviconUrl: tenant.faviconUrl || '',
    },
  };
};

/**
 * Validate color hex format
 */
export const isValidHexColor = (color) => {
  return typeof color === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color.trim());
};

/**
 * Derive lighter tint for hex color
 */
export const hexToLightTint = (hex, opacity = 0.1) => {
  if (!isValidHexColor(hex)) return '#EFF6FF';
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Validate theme configuration
 */
export const validateThemeConfig = (config) => {
  const errors = [];
  if (!config) {
    return { valid: false, errors: ['Theme config is required'] };
  }

  const colors = config.colors || {};
  ['primary', 'secondary', 'accent'].forEach(key => {
    if (colors[key] && !isValidHexColor(colors[key])) {
      errors.push(`Invalid color format for ${key}: ${colors[key]}`);
    }
  });

  const radius = config.shape?.borderRadius;
  if (radius !== undefined && (typeof radius !== 'number' || radius < 0 || radius > 30)) {
    errors.push('Border radius must be a number between 0 and 30');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Apply dynamic CSS design tokens to document root
 */
export const applyThemeToDom = (themeConfig) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const config = themeConfig || DEFAULT_THEME;
  const colors = config.colors || DEFAULT_THEME.colors;
  const shape = config.shape || DEFAULT_THEME.shape;
  const typography = config.typography || DEFAULT_THEME.typography;

  const primary = colors.primary || '#2563EB';
  const primaryHover = colors.primaryHover || '#1D4ED8';
  const primaryLight = colors.primaryLight || hexToLightTint(primary, 0.1);
  const primaryBorder = colors.primaryBorder || hexToLightTint(primary, 0.25);
  const primaryGlow = hexToLightTint(primary, 0.18);

  const secondary = colors.secondary || '#0F766E';
  const secondaryLight = colors.secondaryLight || hexToLightTint(secondary, 0.12);
  const accent = colors.accent || '#7C3AED';
  const accentLight = colors.accentLight || hexToLightTint(accent, 0.12);

  const bgPrimary = colors.background || '#F8FAFC';
  const bgSurface = colors.surface || '#FFFFFF';
  const bgSurfaceSecondary = colors.surfaceSecondary || '#F1F5F9';
  const sidebarBg = colors.sidebar || '#FFFFFF';
  const headerBg = colors.header || '#FFFFFF';

  const textPrimary = colors.textPrimary || '#0F172A';
  const textSecondary = colors.textSecondary || '#475569';
  const textMuted = colors.textMuted || '#94A3B8';
  const textInverse = colors.textInverse || '#FFFFFF';
  const border = colors.border || '#E2E8F0';
  const borderStrong = colors.borderStrong || '#CBD5E1';

  // 1. Standard Design Tokens
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-hover', primaryHover);
  root.style.setProperty('--color-primary-light', primaryLight);
  root.style.setProperty('--color-primary-border', primaryBorder);
  root.style.setProperty('--color-primary-glow', primaryGlow);

  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-secondary-light', secondaryLight);
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-accent-light', accentLight);

  root.style.setProperty('--color-success', colors.success || '#16A34A');
  root.style.setProperty('--color-warning', colors.warning || '#D97706');
  root.style.setProperty('--color-danger', colors.danger || '#DC2626');
  root.style.setProperty('--color-info', colors.info || '#0EA5E9');

  root.style.setProperty('--color-bg-primary', bgPrimary);
  root.style.setProperty('--color-bg-surface', bgSurface);
  root.style.setProperty('--color-bg-surface-secondary', bgSurfaceSecondary);
  root.style.setProperty('--color-sidebar-bg', sidebarBg);
  root.style.setProperty('--color-header-bg', headerBg);

  root.style.setProperty('--color-text-primary', textPrimary);
  root.style.setProperty('--color-text-secondary', textSecondary);
  root.style.setProperty('--color-text-muted', textMuted);
  root.style.setProperty('--color-text-inverse', textInverse);
  root.style.setProperty('--color-border', border);
  root.style.setProperty('--color-border-strong', borderStrong);

  // 2. Explicit Tenant Scope Aliases (--tenant-*)
  root.style.setProperty('--tenant-primary', primary);
  root.style.setProperty('--tenant-primary-hover', primaryHover);
  root.style.setProperty('--tenant-primary-light', primaryLight);
  root.style.setProperty('--tenant-primary-border', primaryBorder);
  root.style.setProperty('--tenant-secondary', secondary);
  root.style.setProperty('--tenant-secondary-light', secondaryLight);
  root.style.setProperty('--tenant-accent', accent);
  root.style.setProperty('--tenant-accent-light', accentLight);
  root.style.setProperty('--tenant-background', bgPrimary);
  root.style.setProperty('--tenant-surface', bgSurface);
  root.style.setProperty('--tenant-sidebar', sidebarBg);
  root.style.setProperty('--tenant-header', headerBg);
  root.style.setProperty('--tenant-text-primary', textPrimary);
  root.style.setProperty('--tenant-text-secondary', textSecondary);
  root.style.setProperty('--tenant-text-muted', textMuted);
  root.style.setProperty('--tenant-border', border);

  // 3. Global CSS Aliases
  root.style.setProperty('--bg-primary', bgPrimary);
  root.style.setProperty('--bg-secondary', bgSurfaceSecondary);
  root.style.setProperty('--text-primary', textPrimary);
  root.style.setProperty('--text-secondary', textSecondary);
  root.style.setProperty('--text-muted', textMuted);
  root.style.setProperty('--border', border);

  // 4. Shapes & Radius
  const r = typeof shape.borderRadius === 'number' ? shape.borderRadius : 10;
  root.style.setProperty('--border-radius-sm', `${Math.max(2, r - 4)}px`);
  root.style.setProperty('--border-radius-md', `${r}px`);
  root.style.setProperty('--border-radius-lg', `${r + 4}px`);
  root.style.setProperty('--border-radius-xl', `${r + 8}px`);
  root.style.setProperty('--tenant-radius', `${r}px`);

  // 5. Typography
  if (typography.fontFamily) {
    root.style.setProperty('--font-family', typography.fontFamily);
  }
};

/**
 * Generate CSS variables object for scoped container styling (e.g. Theme Studio Preview Frame)
 */
export const getThemeCssVariables = (themeConfig) => {
  const config = themeConfig || DEFAULT_THEME;
  const colors = config.colors || DEFAULT_THEME.colors;
  const shape = config.shape || DEFAULT_THEME.shape;
  const typography = config.typography || DEFAULT_THEME.typography;

  const primary = colors.primary || '#2563EB';
  const primaryHover = colors.primaryHover || '#1D4ED8';
  const primaryLight = colors.primaryLight || hexToLightTint(primary, 0.1);
  const primaryBorder = colors.primaryBorder || hexToLightTint(primary, 0.25);
  const primaryGlow = hexToLightTint(primary, 0.18);

  const secondary = colors.secondary || '#0F766E';
  const secondaryLight = colors.secondaryLight || hexToLightTint(secondary, 0.12);
  const accent = colors.accent || '#7C3AED';
  const accentLight = colors.accentLight || hexToLightTint(accent, 0.12);

  const bgPrimary = colors.background || '#F8FAFC';
  const bgSurface = colors.surface || '#FFFFFF';
  const bgSurfaceSecondary = colors.surfaceSecondary || '#F1F5F9';
  const sidebarBg = colors.sidebar || '#FFFFFF';
  const headerBg = colors.header || '#FFFFFF';

  const textPrimary = colors.textPrimary || '#0F172A';
  const textSecondary = colors.textSecondary || '#475569';
  const textMuted = colors.textMuted || '#94A3B8';
  const textInverse = colors.textInverse || '#FFFFFF';
  const border = colors.border || '#E2E8F0';
  const borderStrong = colors.borderStrong || '#CBD5E1';
  const r = typeof shape.borderRadius === 'number' ? shape.borderRadius : 10;

  return {
    '--color-primary': primary,
    '--color-primary-hover': primaryHover,
    '--color-primary-light': primaryLight,
    '--color-primary-border': primaryBorder,
    '--color-primary-glow': primaryGlow,
    '--color-secondary': secondary,
    '--color-secondary-light': secondaryLight,
    '--color-accent': accent,
    '--color-accent-light': accentLight,
    '--color-success': colors.success || '#16A34A',
    '--color-warning': colors.warning || '#D97706',
    '--color-danger': colors.danger || '#DC2626',
    '--color-info': colors.info || '#0EA5E9',
    '--color-bg-primary': bgPrimary,
    '--color-bg-surface': bgSurface,
    '--color-bg-surface-secondary': bgSurfaceSecondary,
    '--color-sidebar-bg': sidebarBg,
    '--color-header-bg': headerBg,
    '--color-text-primary': textPrimary,
    '--color-text-secondary': textSecondary,
    '--color-text-muted': textMuted,
    '--color-text-inverse': textInverse,
    '--color-border': border,
    '--color-border-strong': borderStrong,
    '--tenant-primary': primary,
    '--tenant-primary-hover': primaryHover,
    '--tenant-primary-light': primaryLight,
    '--tenant-primary-border': primaryBorder,
    '--tenant-secondary': secondary,
    '--tenant-secondary-light': secondaryLight,
    '--tenant-accent': accent,
    '--tenant-accent-light': accentLight,
    '--tenant-background': bgPrimary,
    '--tenant-surface': bgSurface,
    '--tenant-sidebar': sidebarBg,
    '--tenant-header': headerBg,
    '--tenant-text-primary': textPrimary,
    '--tenant-text-secondary': textSecondary,
    '--tenant-text-muted': textMuted,
    '--tenant-border': border,
    '--bg-primary': bgPrimary,
    '--bg-secondary': bgSurfaceSecondary,
    '--text-primary': textPrimary,
    '--text-secondary': textSecondary,
    '--text-muted': textMuted,
    '--border': border,
    '--border-radius-sm': `${Math.max(2, r - 4)}px`,
    '--border-radius-md': `${r}px`,
    '--border-radius-lg': `${r + 4}px`,
    '--border-radius-xl': `${r + 8}px`,
    '--tenant-radius': `${r}px`,
    '--font-family': typography.fontFamily || "'Inter', system-ui, -apple-system, sans-serif",
  };
};

