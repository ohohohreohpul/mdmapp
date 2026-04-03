// Mydemy 2026 — iOS Clean Clarity Design System
// Light mode only · Brand Pink · Glassmorphism

export const COLORS = {
  // Brand
  primary: '#ef5ea8',
  primaryDark: '#d94d94',
  primaryLight: '#f7a8cd',
  primarySurface: 'rgba(239, 94, 168, 0.10)',
  primaryMuted: 'rgba(239, 94, 168, 0.08)',

  // Gamification
  xp: '#FF9500',
  streak: '#FF3B30',
  level: '#AF52DE',

  // iOS-standard background palette (light mode)
  background: '#F2F2F7',        // System background (iOS gray)
  surface: '#FFFFFF',           // Card / sheet surface
  surfaceSecondary: '#F2F2F7',  // Secondary grouped background
  surfaceElevated: '#FFFFFF',   // Elevated sheet

  // Text — iOS semantic
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  textTertiary: '#AEAEB2',
  textQuaternary: '#C7C7CC',
  textInverse: '#FFFFFF',

  // Semantic (iOS HIG)
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // Glass
  glass: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.45)',
  glassDark: 'rgba(28, 28, 30, 0.65)',

  // Aliases for backward compatibility
  text: '#1C1C1E',
  borderLight: 'rgba(0, 0, 0, 0.04)',
  separator: '#E5E5EA',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.45)',
  overlayLight: 'rgba(0, 0, 0, 0.12)',
};

// Career Paths
export const CAREER_PATHS = [
  { id: 'all', name: 'ทั้งหมด', icon: '📚', color: '#636366' },
  { id: 'UX Design', name: 'UX/UI Design', icon: '🎨', color: '#ef5ea8' },
  { id: 'Data Analysis', name: 'Data Analysis', icon: '📊', color: '#007AFF' },
  { id: 'Digital Marketing', name: 'Digital Marketing', icon: '📱', color: '#FF9500' },
  { id: 'Project Management', name: 'Project Management', icon: '📋', color: '#34C759' },
  { id: 'Learning Designer', name: 'Learning Designer', icon: '🎓', color: '#AF52DE' },
  { id: 'QA Tester', name: 'QA Tester', icon: '🧪', color: '#FF2D55' },
  { id: 'General', name: 'ทั่วไป', icon: '💡', color: '#636366' },
];

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 34, fontWeight: '800' as const, lineHeight: 40, letterSpacing: -0.5 },
  h2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.3 },
  h3: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.2 },
  h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  h5: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  bodyLarge: { fontSize: 17, fontWeight: 'normal' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: 'normal' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: 'normal' as const, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2 },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8 },
};

export const SHADOWS = {
  none: {},
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 6,
  },
  pink: {
    shadowColor: '#ef5ea8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 7,
  },
  tab: {
    shadowColor: '#ef5ea8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 12,
  },
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const ANIMATION = {
  fast: 120,
  normal: 250,
  slow: 450,
  spring: {
    damping: 18,
    stiffness: 200,
  },
};
