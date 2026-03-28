import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const scale = Math.min(Math.max(width / 390, 0.86), 1.18);

const ms = (value: number) => Math.round(value * scale);

export const theme = {
  colors: {
    background: '#F4F7FC',
    surface: '#FFFFFF',
    text: '#0F172A',
    mutedText: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    success: '#059669',
    danger: '#DC2626',
    warning: '#D97706',
    dark: '#0B1220',
  },
  spacing: {
    xs: ms(6),
    sm: ms(10),
    md: ms(14),
    lg: ms(18),
    xl: ms(24),
  },
  radius: {
    sm: ms(10),
    md: ms(14),
    lg: ms(18),
    xl: ms(22),
    pill: 999,
  },
  text: {
    xs: ms(12),
    sm: ms(14),
    md: ms(16),
    lg: ms(18),
    xl: ms(22),
    xxl: ms(28),
  },
  shadow: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  ms,
};

export type AppTheme = typeof theme;
