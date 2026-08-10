import type { Config } from 'tailwindcss';
import { tokens } from './tokens/design-tokens';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './tokens/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: tokens.colors.primary,
          'primary-hover': tokens.colors.primaryHover,
          glow: tokens.colors.primaryGlow,
          light: tokens.colors.primaryLight,
        },
        surface: {
          light: tokens.colors.bgLight,
          hero: tokens.colors.bgHero,
          alt: tokens.colors.bgAlt,
          muted: tokens.colors.bgMuted,
          dark: tokens.colors.bgDark,
          'dark-elevated': tokens.colors.bgDarkElevated,
          'card-dark': tokens.colors.bgCardDark,
        },
        content: {
          dark: tokens.colors.textDark,
          muted: tokens.colors.textMuted,
          disabled: tokens.colors.textDisabled,
          subtle: tokens.colors.textSubtle,
          light: tokens.colors.textLight,
          glass: tokens.colors.textGlass,
        },
        edge: {
          light: tokens.colors.borderLight,
          muted: tokens.colors.borderMuted,
          dark: tokens.colors.borderDark,
          'dark-subtle': tokens.colors.borderDarkSubtle,
        },
        state: {
          success: tokens.colors.success,
          error: tokens.colors.error,
          warning: tokens.colors.warning,
        },
        scene: {
          main: tokens.colors.sceneWireframeMain,
          floor: tokens.colors.sceneWireframeFloor,
          laserRed: tokens.colors.sceneLaserRed,
          laserBlue: tokens.colors.sceneLaserBlue,
          pulse: tokens.colors.scenePulse,
        },
      },
      fontFamily: {
        ui: ['var(--font-ui)', 'Roboto', 'sans-serif'],
        body: ['var(--font-body)', 'Roboto', 'sans-serif'],
        display: ['var(--font-display)', 'Roboto', 'sans-serif'],
        kalameh: ['var(--font-kalameh)', 'Kalameh', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontWeight: {
        thin: tokens.fontWeights.thin,
        extralight: tokens.fontWeights.extralight,
        light: tokens.fontWeights.light,
        normal: tokens.fontWeights.normal,
        medium: tokens.fontWeights.medium,
        semibold: tokens.fontWeights.semibold,
        bold: tokens.fontWeights.bold,
        extrabold: tokens.fontWeights.extrabold,
        black: tokens.fontWeights.black,
      },
      borderRadius: {
        pill: tokens.radii.pill,
        '2xl': tokens.radii['2xl'],
        '3xl': tokens.radii['3xl'],
      },
      screens: {
        sm: tokens.breakpoints.sm,
        md: tokens.breakpoints.md,
        lg: tokens.breakpoints.lg,
        xl: tokens.breakpoints.xl,
      },
      boxShadow: {
        glass: tokens.shadows.glass,
        glow: tokens.shadows.glow,
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
