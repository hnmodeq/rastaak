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
          light: tokens.colors.primaryLight,
          glow: tokens.colors.primaryGlow,
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
          'semi-opaque': tokens.colors.textSemiOpaque,
        },
        edge: {
          light: tokens.colors.borderLight,
          neutral: tokens.colors.borderNeutral,
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
          keyLight: tokens.colors.sceneKeyLight,
          gridSecondary: tokens.colors.sceneGridSecondary,
        },
      },
      fontFamily: {
        ui: ['var(--font-roboto)', 'sans-serif'],
        body: ['var(--font-roboto)', 'sans-serif'],
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
