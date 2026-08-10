/**
 * Rastaak Design Token System (Exhaustive OKLCH Edition)
 * Centralized design tokens for colors, typography, spacing, shadows, and animation curves.
 * Every single color across the entire codebase is mapped to the perceptual OKLCH color space.
 */

export const tokens = {
  colors: {
    // 🎨 Brand & Highlights (Single canonical primary blue: #261779)
    primary: 'oklch(30.52% 0.154 279.05)',
    primaryHover: 'oklch(25.3% 0.1219 279.99)',
    primaryLight: 'oklch(80.11% 0.1264 229.37)',
    primaryGlow: 'oklch(30.52% 0.154 279.05 / 0.35)',
    primaryHoverGlow: 'oklch(30.52% 0.154 279.05 / 0.45)',

    // 🖼️ Backgrounds
    bgLight: 'oklch(99.11% 0.0 89.88)',              // #FCFCFC / #FFFFFF
    bgHero: 'oklch(90.0% 0.0228 233.38)',            // #D0E1EB
    bgAlt: 'oklch(92.24% 0.0202 233.86)',            // #D9E8F1
    bgMuted: 'oklch(96.34% 0.0053 197.07)',          // #EFF4F4
    bgDark: 'oklch(12.78% 0.0477 280.42)',           // #050419
    bgDarkElevated: 'oklch(18.24% 0.0517 281.71)',   // #0F0E28
    bgCardDark: 'oklch(19.45% 0.0492 282.62)',       // #12112A

    // ✍️ Text & Content Colors
    textDark: 'oklch(12.78% 0.0477 280.42)',         // #050419 / #333333
    textMuted: 'oklch(46.28% 0.0225 288.76)',        // #585765
    textDisabled: 'oklch(64.3% 0.0133 286.02)',      // #8C8C95
    textSubtle: 'oklch(76.33% 0.0099 292.73)',       // #B2B1B8
    textLight: 'oklch(99.11% 0.0 89.88)',            // #FCFCFC / #FFFFFF
    textGlass: 'oklch(99.11% 0.0 89.88 / 0.85)',
    textSemiOpaque: 'oklch(99.11% 0.0 89.88 / 0.70)',// #FCFCFCB3

    // 🔲 Borders & Dividers
    borderLight: 'oklch(92.55% 0.0027 286.35)',      // #E6E6E8
    borderNeutral: 'oklch(88.53% 0.0 89.88)',        // #D9D9D9
    borderMuted: 'oklch(85.91% 0.0068 286.25)',      // #D0D0D5
    borderDark: 'oklch(34.11% 0.0296 287.41)',       // #373647
    borderDarkSubtle: 'oklch(100.0% 0.0 89.88 / 0.12)',

    // 🚦 UI States
    success: 'oklch(69.59% 0.1491 162.48)',          // #10B981
    error: 'oklch(63.68% 0.2078 25.33)',             // #EF4444
    warning: 'oklch(76.86% 0.1647 70.08)',           // #F59E0B

    // 🌐 3D WebGL Scene & Shader Engine Palette
    sceneWireframeMain: 'oklch(84.32% 0.0745 249.94)',   // #A7D0FB
    sceneWireframeFloor: 'oklch(77.88% 0.0735 250.65)',  // #94BBE5
    sceneLaserRed: 'oklch(67.73% 0.2129 16.81)',         // #FF4D67
    sceneLaserBlue: 'oklch(65.64% 0.183 250.17)',        // #0E94FB
    scenePulse: 'oklch(80.11% 0.1264 229.37)',           // #57CDFF
    sceneKeyLight: 'oklch(64.48% 0.1893 263.59)',        // #4F86FF (0x4f86ff)
    sceneGridSecondary: 'oklch(20.92% 0.0769 278.5)',    // #12113A (0x12113a)

    // 🌫️ Transparency & Overlays
    overlayDark10: 'oklch(12.78% 0.0477 280.42 / 0.10)', // #0504191A
    overlayDark20: 'oklch(12.78% 0.0477 280.42 / 0.20)', // #05041933
    overlayDark30: 'oklch(12.78% 0.0477 280.42 / 0.30)', // #0504194D
    overlayGlass15: 'oklch(99.11% 0.0 89.88 / 0.15)',    // #FCFCFC26
    overlayGlass10: 'oklch(99.11% 0.0 89.88 / 0.10)',    // rgba(252,252,252,0.1)

    // 🛠️ Debug / Performance Dashboard Palette
    debugTrace: 'oklch(57.07% 0.2087 21.14)',            // #D7263D
    debugAlert: 'oklch(65.42% 0.2321 28.66)',            // #FF3B30
    debugWarning: 'oklch(78.24% 0.1711 67.22)',          // #FF9F0A
    debugHighlight: 'oklch(93.45% 0.2017 108.22)',       // #F7F200
    debugMeterGreen: 'oklch(88.15% 0.275 138.49 / 0.60)',// rgba(102, 255, 0, 0.6)
    debugPanelBg: 'oklch(23.5% 0.0 89.88 / 0.85)',       // rgba(30, 30, 30, 0.85)
    debugInnerBg: 'oklch(19.13% 0.0 89.88 / 0.70)',      // rgba(20, 20, 20, 0.70)
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
