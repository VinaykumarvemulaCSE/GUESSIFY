// Guessify Gaming System - Royal White & Cream Theme with Royal Brown & Gold Accents
export const COLORS = {
  // Surface System (Royal Cream & Pristine White)
  background: '#F5F2EB', // Warm Royal Cream Canvas
  surface: '#FAF7F2',    // Rich Soft Cream Surface
  surfaceDim: '#EDE6DC', // Warm Parchment
  surfaceBright: '#FFFFFF', // Pure Crisp White
  surfaceContainerLowest: '#FFFFFF', // Pure Crisp White Cards
  surfaceContainerLow: '#FDFBF7',    // Soft Light Cream
  surfaceContainer: '#F5EFE6',       // Rich Sand Cream
  surfaceContainerHigh: '#EFE6D8',   // Classic Biscuit Cream
  surfaceContainerHighest: '#E5D9C7', // Warm Muted Taupe
  
  // On-surface (Typography)
  onSurface: '#2B1D14',        // Deep Royal Chocolate Brown
  onSurfaceVariant: '#6D5849', // Warm Caramel Mocha
  inverseSurface: '#2B1D14',
  inverseOnSurface: '#FAF7F2',
  
  // Outlines & Borders
  outline: '#CDBAA2',          // Royal Biscuit Border
  outlineVariant: '#E6DBD0',   // Subtle Cream Border
  surfaceTint: '#8B5E3C',      // Royal Brown Leather Tint
  
  // Primary (Royal Brown & Antique Saddle)
  primary: '#5C3A21',          // Royal Deep Chocolate Brown
  primaryContainer: '#8B5E3C', // Royal Saddle Brown Leather
  primaryFixed: '#B8860B',     // Burnished Royal Gold
  primaryFixedDim: '#A06535',
  onPrimary: '#FFFFFF',        // Pure White text
  onPrimaryContainer: '#FFFFFF',
  inversePrimary: '#C5A059',
  
  // Secondary (Royal Gold & Imperial Amber)
  secondary: '#B8860B',        // Royal Amber Gold
  secondaryContainer: '#D4AF37', // Imperial Gold
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#2B1D14',
  
  // Tertiary (Warm Caramel Wood)
  tertiary: '#6D4C33',         // Warm Wood
  tertiaryContainer: '#8D6544',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#FAF7F2',
  
  // Status & Feedback
  success: '#2E7D32', // Rich Emerald Green
  successContainer: '#E8F5E9',
  error: '#C62828',   // Royal Ruby Crimson
  errorContainer: '#FFEBEE',
  onError: '#FFFFFF',
  onErrorContainer: '#C62828',
  warning: '#D97706', // Amber Gold
  
  // Transparent overlays & Accents
  glowCyan: 'rgba(184, 134, 11, 0.22)',
  glowAmber: 'rgba(212, 175, 55, 0.25)',
  glowViolet: 'rgba(139, 94, 60, 0.20)',
  cardBorder: 'rgba(139, 94, 60, 0.18)',

  // High-Contrast Light Charcoal & Input System (matching warm cream aesthetic)
  charcoal: '#1E232A',          // Rich deep charcoal for input text & high-contrast titles
  charcoalMuted: '#3A414E',     // Structured medium charcoal for input labels & active icons
  charcoalLight: '#626A79',     // Light charcoal for placeholders & hints (crisp and readable)
  inputBg: '#FFFFFF',           // Crisp white input card background
  inputBorder: 'rgba(30, 35, 42, 0.18)', // Balanced charcoal border
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  gutter: 16,
  margin: 20,
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  code: 'Courier',
};

export const SHADOWS = {
  glowPrimary: {
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  amberGlow: {
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glowSecondary: {
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  glowTertiary: {
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: '#5C3A21',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
};
