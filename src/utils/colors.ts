export const COLORS = {
  // Background layers
  bg0: '#0F172A',       // deepest
  bg1: '#1E293B',       // card bg
  bg2: '#334155',       // elevated card
  bg3: '#475569',       // border / divider

  // Accent palette
  indigo: '#6366F1',
  indigoLight: '#818CF8',
  violet: '#8B5CF6',
  sky: '#38BDF8',
  emerald: '#34D399',
  amber: '#FBBF24',
  rose: '#F87171',
  pink: '#F472B6',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Transparent
  overlay: 'rgba(15,23,42,0.85)',
  cardBorder: 'rgba(99,102,241,0.15)',
};

export const COURSE_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
];

export const getCourseColor = (index: number) =>
  COURSE_COLORS[index % COURSE_COLORS.length];
