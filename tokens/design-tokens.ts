/**
 * Rastaak Design Token System
 * Centralized design tokens for colors, typography, spacing, shadows, and animation curves.
 * Color tokens use the modern OKLCH color space for superior perceptual uniformity and contrast.
 */

export const tokens = {
  colors: {
    // 🎨 Brand & Highlights (Single unified primary blue: #261779)
    primary: 'oklch(30.52% 0.154 279.05)',
    primaryHover: 'oklch(30.52% 0.154 279.05)',
    primaryGlow: 'oklch(30.52% 0.154 279.05 / 0.35)',

    // 🖼️ Backgrounds
    bgLight: 'oklch(99.11% 0.0 89.88)',              // #FCFCFC / #FFFFFF
    bgHero: 'oklch(90.0% 0.0228 233.38)',            // #D0E1EB
    bgAlt: 'oklch(92.24% 0.0202 233.86)',            // #D9E8F1
    bgMuted: 'oklch(96.34% 0.0053 197.07)',          // #EFF4F4
    bgDark: 'oklch(12.78% 0.0477 280.42)',           // #050419
    bgDarkElevated: 'oklch(18.24% 0.0517 281.71)',   // #0F0E28
    bgCardDark: 'oklch(18.24% 0.0517 281.71)',       // #12112A (consolidated with bgDarkElevated)

    // ✍️ Text colors
    textDark: 'oklch(12.78% 0.0477 280.42)',         // #050419 / #333333
    textMuted: 'oklch(46.28% 0.0225 288.76)',        // #585765
    textDisabled: 'oklch(64.3% 0.0133 286.02)',      // #8C8C95
    textSubtle: 'oklch(76.33% 0.0099 292.73)',       // #B2B1B8
    textLight: 'oklch(99.11% 0.0 89.88)',            // #FCFCFC
    textGlass: 'oklch(99.11% 0.0 89.88 / 0.85)',

    // 🔲 Borders & Dividers
    borderLight: 'oklch(92.55% 0.0027 286.35)',      // #E6E6E8 / #D9D9D9
    borderMuted: 'oklch(85.91% 0.0068 286.25)',      // #D0D0D5
    borderDark: 'oklch(34.11% 0.0296 287.41)',       // #373647
    borderDarkSubtle: 'oklch(99.11% 0.0 89.88 / 0.12)',

    // 🚦 UI States
    success: 'oklch(69.59% 0.1491 162.48)',          // #10B981
    error: 'oklch(63.68% 0.2078 25.33)',             // #EF4444
    warning: 'oklch(76.86% 0.1647 70.08)',           // #F59E0B
  },

  fonts: {
    ui: 'var(--font-roboto), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: 'var(--font-roboto), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'var(--font-roboto), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
    glow: '0 0 25px oklch(30.52% 0.154 279.05 / 0.45)',
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
