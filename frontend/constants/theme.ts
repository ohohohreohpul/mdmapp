// Modern Mydemy 2026 Design System - Duolingo Style
export const COLORS = {
  // Brand Colors - Mydemy Pink
  primary: '#ef5ea8',      // Mydemy Pink
  primaryDark: '#d94d94',  // Darker Pink
  primaryLight: '#f7a8cd', // Lighter Pink
  
  // Accent (for subtle backgrounds)
  accent: '#fdf2f8',       // Very light pink
  accentMedium: '#fce7f3', // Light pink bg
  
  // Gamification Colors
  xp: '#FFD700',           // XP Gold
  streak: '#FF6B35',       // Streak Orange/Fire
  level: '#8B5CF6',        // Level Purple
  
  // Neutrals
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceLight: '#FAFBFC',
  
  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  
  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.7)',
  glassDark: 'rgba(31, 41, 55, 0.7)',
};

// Career Paths
export const CAREER_PATHS = [
  { id: 'all', name: 'ทั้งหมด', icon: '📚', color: '#6B7280' },
  { id: 'UX Design', name: 'UX/UI Design', icon: '🎨', color: '#EC4899' },
  { id: 'Data Analysis', name: 'Data Analysis', icon: '📊', color: '#3B82F6' },
  { id: 'Digital Marketing', name: 'Digital Marketing', icon: '📱', color: '#F59E0B' },
  { id: 'Project Management', name: 'Project Management', icon: '📋', color: '#10B981' },
  { id: 'Learning Designer', name: 'Learning Designer', icon: '🎓', color: '#8B5CF6' },
  { id: 'QA Tester', name: 'QA Tester', icon: '🧪', color: '#D946EF' },
  { id: 'General', name: 'ทั่วไป', icon: '💡', color: '#6B7280' },
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
  // Headings
  h1: { fontSize: 32, fontWeight: 'bold' as const, lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: 'bold' as const, lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h5: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  
  // Body
  bodyLarge: { fontSize: 17, fontWeight: 'normal' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: 'normal' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: 'normal' as const, lineHeight: 18 },
  
  // Labels
  label: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};