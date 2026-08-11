/**
 * Rastaak design-token source of truth.
 *
 * SOURCE OF TRUTH: edit color values only in this file.
 *
 * - `colors` is for CSS, Tailwind, and React UI values.
 * - `scene` is for Three.js/WebGL numeric values.
 *
 * Run `npm run tokens:generate` after an edit to create the ignored runtime
 * artifacts used by CSS and the legacy WebGL bundle.
 */

export const tokens = {
  colors: {
    primary: 'oklch(30.52% 0.154 279.05)',
    primaryHover: 'oklch(25.3% 0.1219 279.99)',
    primaryLight: 'oklch(100.00% 0.0000 89.88)',
    primaryGlow: 'oklch(30.52% 0.154 279.05 / 0.35)',
    primaryHoverGlow: 'oklch(100.00% 0.0000 89.88 / 0.45)',

    bgLight: 'oklch(99.11% 0 89.88)',
    bgHero: 'oklch(99.11% 0 89.88)',
    bgAlt: 'oklch(92.24% 0.0202 233.86)',
    bgMuted: 'oklch(96.34% 0.0053 197.07)',
    bgDark: 'oklch(12.78% 0.0477 280.42)',
    bgDarkElevated: 'oklch(18.24% 0.0517 281.71)',
    bgCardDark: 'oklch(19.45% 0.0492 282.62)',
    bgTransitionHome: 'oklch(90% 0.0228 233.38)',

    textDark: 'oklch(12.78% 0.0477 280.42)',
    textMuted: 'oklch(46.28% 0.0225 288.76)',
    textDisabled: 'oklch(64.3% 0.0133 286.02)',
    textSubtle: 'oklch(76.33% 0.0099 292.73)',
    textLight: 'oklch(99.11% 0 89.88)',
    textGlass: 'oklch(99.11% 0 89.88 / 0.85)',
    textSemiOpaque: 'oklch(99.11% 0 89.88 / 0.7)',

    borderLight: 'oklch(92.55% 0.0027 286.35)',
    borderNeutral: 'oklch(88.53% 0 89.88)',
    borderMuted: 'oklch(85.91% 0.0068 286.25)',
    borderDark: 'oklch(34.11% 0.0296 287.41)',
    borderDarkSubtle: 'oklch(100% 0 89.88 / 0.12)',
    borderDecorative: 'oklch(88.53% 0 89.88)',
    borderInverseStrong: 'oklch(100% 0 89.88 / 0.6)',

    success: 'oklch(69.59% 0.1491 162.48)',
    error: 'oklch(63.68% 0.2078 25.33)',
    errorSurface: 'oklch(97.05% 0.0129 17.38)',
    warning: 'oklch(76.86% 0.1647 70.08)',

    overlayDark10: 'oklch(12.78% 0.0477 280.42 / 0.1)',
    overlayDark20: 'oklch(12.78% 0.0477 280.42 / 0.2)',
    overlayDark30: 'oklch(12.78% 0.0477 280.42 / 0.3)',
    overlayBrandStrong: 'oklch(30.52% 0.154 279.05 / 0.9)',
    overlayGlass10: 'oklch(99.11% 0 89.88 / 0.1)',
    overlayGlass15: 'oklch(99.11% 0 89.88 / 0.15)',
    overlayGlass20: 'oklch(99.11% 0 89.88 / 0.2)',
    overlaySurface70: 'oklch(99.11% 0 89.88 / 0.7)',
    overlayScrim: 'oklch(0% 0 0)',
    transparent: 'transparent',

    debugTrace: 'oklch(57.07% 0.2087 21.14)',
    debugAlert: 'oklch(65.42% 0.2321 28.66)',
    debugAlertTransparent: 'oklch(65.42% 0.2321 28.66 / 0)',
    debugWarning: 'oklch(78.24% 0.1711 67.22)',
    debugHighlight: 'oklch(93.45% 0.2017 108.22)',
    debugMeterGreen: 'oklch(88.15% 0.275 138.49 / 0.6)',
    debugPanelBg: 'oklch(23.5% 0 89.88 / 0.85)',
    debugInnerBg: 'oklch(19.13% 0 89.88 / 0.7)',
    debugPaused: 'oklch(14.85% 0 0)',
  },

  /**
   * Active homepage WebGL palette. Every item is bound to a visible legacy
   * renderer element and is editable in the Token Studio 3D scene tab.
   */
  scene: {
    modelBase: 0xffffff,
    floorBase: 0xffffff,
    groundGridGlow: 0xbbc9ff,
    groundPulseDots: 0xbbc9ff,
    groundPulseDotsGlow: 0xbbc9ff,
    activationSquare: 0xffffff,
    endSequenceSquares: 0xffffff,
    endSequenceSquaresGlow: 0xbbc9ff,
    endSequenceLogoFill: 0x261779,
    endSequenceLogoGlow: 0x000000,
    laserRed: 0xb70000,
    laserBlue: 0x1a1052,
  },

  /**
   * Not mounted on the homepage. These support the optional React Three.js
   * renderer and intentionally stay out of the Token Studio live palette.
   */
  experimentalScene: {
    canvasBackground: 0x261779,
    ambient: 0xffffff,
    hemisphereGround: 0x261779,
    keyLight: 0x261779,
    fillLight: 0x261779,
    gridPrimary: 0xffffff,
    gridSecondary: 0xffffff,
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
