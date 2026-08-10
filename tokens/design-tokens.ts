/**
 * Rastaak Design Token System
 * Centralized design tokens for colors, typography, spacing, shadows, and animation curves.
 */

export const tokens = {
  colors: {
    // Brand & Highlights
    primary: '#3932DC',
    primaryHover: '#2A24B8',
    primaryGlow: 'rgba(57, 50, 220, 0.35)',

    // Backgrounds
    bgLight: '#FCFCFC',
    bgHero: '#D0E1EB',
    bgAlt: '#D9E8F1',
    bgMuted: '#EFF4F4',
    bgDark: '#050419',
    bgDarkElevated: '#0F0E28',
    bgCardDark: '#12112A',

    // Text colors
    textDark: '#050419',
    textMuted: '#585765',
    textDisabled: '#8C8C95',
    textSubtle: '#B2B1B8',
    textLight: '#FCFCFC',
    textGlass: 'rgba(252, 252, 252, 0.85)',

    // Borders & Dividers
    borderLight: '#E6E6E8',
    borderMuted: '#D0D0D5',
    borderDark: '#373647',
    borderDarkSubtle: 'rgba(255, 255, 255, 0.12)',

    // UI States
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },

  fonts: {
    ui: 'var(--font-ui), "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'var(--font-body), "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: 'var(--font-display), "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    kalameh: 'var(--font-kalameh), "Kalameh", -apple-system, sans-serif',
    mono: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  fontSizes: {
    xs: ['12px', { lineHeight: '16px', letterSpacing: '0.02em' }],
    sm: ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }],
    base: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
    lg: ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
    xl: ['36px', { lineHeight: '44px', letterSpacing: '-0.03em' }],
    '2xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.04em' }],
    '3xl': ['64px', { lineHeight: '72px', letterSpacing: '-0.04em' }],
    '4xl': ['80px', { lineHeight: '88px', letterSpacing: '-0.05em' }],
    hero: ['96px', { lineHeight: '96px', letterSpacing: '-0.06em' }],
  },

  radii: {
    none: '0px',
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
    pill: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glass: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
    glow: '0 0 25px rgba(57, 50, 220, 0.45)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    base: '280ms cubic-bezier(0.16, 1, 0.3, 1)',
    smooth: '500ms cubic-bezier(0.25, 1, 0.5, 1)',
    spring: '600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  breakpoints: {
    sm: '480px',
    md: '820px',
    lg: '1200px',
    xl: '1440px',
  },
} as const;

export type DesignTokens = typeof tokens;
