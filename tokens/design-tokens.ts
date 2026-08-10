/**
 * Rastaak Design Token System (OKLCH Edition)
 * Centralized design tokens for colors, typography, spacing, shadows, and animation curves.
 * All color tokens use the perceptual OKLCH color space for superior contrast and consistency.
 */

export const tokens = {
  colors: {
    // 🎨 Brand & Highlights (Single unified primary blue: #261779)
    primary: 'oklch(30.52% 0.154 279.05)',
    primaryHover: 'oklch(25.3% 0.1219 279.99)',
    primaryGlow: 'oklch(30.52% 0.154 279.05 / 0.35)',
    primaryLight: 'oklch(80.11% 0.1264 229.37)',

    // 🖼️ Backgrounds (Consolidated)
    bgDark: 'oklch(12.78% 0.0477 280.42)',           // #050419
    bgDarkElevated: 'oklch(18.24% 0.0517 281.71)',   // #0F0E28 / #12112A
    bgCardDark: 'oklch(18.24% 0.0517 281.71)',       // Consolidated with bgDarkElevated
    bgHero: 'oklch(90.0% 0.0228 233.38)',            // #D0E1EB
    bgLight: 'oklch(99.11% 0.0 89.88)',              // #FCFCFC / #FFFFFF
    bgAlt: 'oklch(92.24% 0.0202 233.86)',            // #D9E8F1
    bgMuted: 'oklch(96.34% 0.0053 197.07)',          // #EFF4F4

    // ✍️ Text Colors
    textDark: 'oklch(12.78% 0.0477 280.42)',         // #050419
    textMuted: 'oklch(46.28% 0.0225 288.76)',        // #585765
    textDisabled: 'oklch(64.3% 0.0133 286.02)',      // #8C8C95
    textSubtle: 'oklch(76.33% 0.0099 292.73)',       // #B2B1B8
    textLight: 'oklch(99.11% 0.0 89.88)',            // #FCFCFC / #FFFFFF
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

    // 🌐 3D WebGL Scene & Shader Engine Palette
    sceneWireframeMain: 'oklch(84.32% 0.0745 249.94)', // #A7D0FB
    sceneWireframeFloor: 'oklch(77.88% 0.0735 250.65)',// #94BBE5
    sceneLaserRed: 'oklch(67.73% 0.2129 16.81)',       // #FF4D67
    sceneLaserBlue: 'oklch(65.64% 0.183 250.17)',      // #0E94FB
    scenePulse: 'oklch(80.11% 0.1264 229.37)',         // #57CDFF
  },

  fonts: {
    ui: 'var(--font-ui), "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'var(--font-body), "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: 'var(--font-display), "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    kalameh: "'Kalameh', var(--font-roboto), -apple-system, sans-serif",
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
    sm: '0 1px 2px 0 oklch(0% 0 0 / 0.05)',
    md: '0 4px 6px -1px oklch(0% 0 0 / 0.1), 0 2px 4px -1px oklch(0% 0 0 / 0.06)',
    lg: '0 10px 15px -3px oklch(0% 0 0 / 0.1), 0 4px 6px -2px oklch(0% 0 0 / 0.05)',
    xl: '0 20px 25px -5px oklch(0% 0 0 / 0.1), 0 10px 10px -5px oklch(0% 0 0 / 0.04)',
    glass: '0 8px 32px 0 oklch(0% 0 0 / 0.08)',
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
