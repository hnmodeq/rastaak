import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const root = process.cwd();
const sourcePath = path.join(root, 'tokens/design-tokens.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports });
const { tokens } = module.exports;

const kebab = (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const colorVariable = (tokenName) => `--token-color-${kebab(tokenName)}`;

const aliases = {
  '--color-brand-primary': 'primary',
  '--color-brand-primary-hover': 'primaryHover',
  '--color-brand-light': 'primaryLight',
  '--color-brand-glow': 'primaryGlow',
  '--color-brand-hover-glow': 'primaryHoverGlow',

  '--color-surface-light': 'bgLight',
  '--color-surface-hero': 'bgHero',
  '--color-surface-alt': 'bgAlt',
  '--color-surface-muted': 'bgMuted',
  '--color-surface-dark': 'bgDark',
  '--color-surface-dark-elevated': 'bgDarkElevated',
  '--color-surface-card-dark': 'bgCardDark',
  '--color-surface-transition-home': 'bgTransitionHome',

  '--color-content-dark': 'textDark',
  '--color-content-muted': 'textMuted',
  '--color-content-disabled': 'textDisabled',
  '--color-content-subtle': 'textSubtle',
  '--color-content-light': 'textLight',
  '--color-content-glass': 'textGlass',
  '--color-content-semi-opaque': 'textSemiOpaque',

  '--color-edge-light': 'borderLight',
  '--color-edge-neutral': 'borderNeutral',
  '--color-edge-muted': 'borderMuted',
  '--color-edge-dark': 'borderDark',
  '--color-edge-dark-subtle': 'borderDarkSubtle',
  '--color-edge-decorative': 'borderDecorative',
  '--color-edge-inverse-strong': 'borderInverseStrong',

  '--color-state-success': 'success',
  '--color-state-error': 'error',
  '--color-state-error-surface': 'errorSurface',
  '--color-state-warning': 'warning',

  '--color-scene-wireframe-main': 'sceneWireframeMain',
  '--color-scene-wireframe-floor': 'sceneWireframeFloor',
  '--color-scene-laser-red': 'sceneLaserRed',
  '--color-scene-laser-blue': 'sceneLaserBlue',
  '--color-scene-pulse': 'scenePulse',
  '--color-scene-key-light': 'sceneKeyLight',
  '--color-scene-grid-secondary': 'sceneGridSecondary',

  '--color-overlay-dark-10': 'overlayDark10',
  '--color-overlay-dark-20': 'overlayDark20',
  '--color-overlay-dark-30': 'overlayDark30',
  '--color-overlay-brand-strong': 'overlayBrandStrong',
  '--color-overlay-glass-10': 'overlayGlass10',
  '--color-overlay-glass-15': 'overlayGlass15',
  '--color-overlay-glass-20': 'overlayGlass20',
  '--color-overlay-surface-70': 'overlaySurface70',
  '--color-overlay-scrim': 'overlayScrim',
  '--color-transparent': 'transparent',

  '--color-debug-trace': 'debugTrace',
  '--color-debug-alert': 'debugAlert',
  '--color-debug-alert-transparent': 'debugAlertTransparent',
  '--color-debug-warning': 'debugWarning',
  '--color-debug-highlight': 'debugHighlight',
  '--color-debug-meter-green': 'debugMeterGreen',
  '--color-debug-panel-bg': 'debugPanelBg',
  '--color-debug-inner-bg': 'debugInnerBg',
  '--color-debug-paused': 'debugPaused',

  // Compatibility names used by the existing, non-color CSS.
  '--color-bg': 'bgLight',
  '--color-bg-alt': 'bgAlt',
  '--color-bg-muted': 'bgMuted',
  '--color-highlight': 'primary',
  '--color-dark': 'bgDark',
  '--color-dark-alt': 'borderDark',
  '--color-text': 'textDark',
  '--color-text-light': 'textLight',
  '--color-text-muted': 'textMuted',
  '--color-text-disabled': 'textDisabled',
  '--color-text-subtle': 'textSubtle',
  '--color-border': 'borderLight',
  '--color-border-dark': 'borderDark',
};

const css = [
  '/* This file is generated from tokens/design-tokens.ts. Do not edit it directly. */',
  ':root {',
  ...Object.entries(tokens.colors).map(([name, value]) => `  ${colorVariable(name)}: ${value};`),
  '',
  ...Object.entries(aliases).map(([alias, tokenName]) => `  ${alias}: var(${colorVariable(tokenName)});`),
  '}',
  '',
].join('\n');

const sceneModule = [
  '// This file is generated from tokens/design-tokens.ts. Do not edit it directly.',
  `export const sceneTokens = Object.freeze(${JSON.stringify(tokens.scene, null, 2)});`,
  '',
].join('\n');

fs.mkdirSync(path.join(root, 'tokens'), { recursive: true });
fs.mkdirSync(path.join(root, 'public/_astro'), { recursive: true });
fs.writeFileSync(path.join(root, 'tokens/generated.css'), css);
fs.writeFileSync(path.join(root, 'public/_astro/scene-tokens.js'), sceneModule);
