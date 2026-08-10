'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './TokenStudio.module.css';

type ColorTokens = Readonly<Record<string, string>>;
type SceneTokens = Readonly<Record<string, number>>;
type StudioMode = 'ui' | 'scene';

type Oklch = {
  lightness: number;
  chroma: number;
  hue: number;
  alpha: number;
};

interface TokenStudioProps {
  colorTokens: ColorTokens;
  sceneTokens: SceneTokens;
}

const tokenGroup = (name: string) => {
  if (name.startsWith('primary')) return 'Brand';
  if (name.startsWith('bg')) return 'Surface';
  if (name.startsWith('text')) return 'Content';
  if (name.startsWith('border')) return 'Edge';
  if (name.startsWith('overlay')) return 'Overlay';
  if (name.startsWith('debug')) return 'Debug';
  if (['success', 'error', 'errorSurface', 'warning'].includes(name)) return 'State';
  return 'Other';
};

const sceneGroup = (name: string) => {
  if (['canvasBackground', 'hemisphereGround'].includes(name)) return 'Environment';
  if (['ambient', 'keyLight', 'fillLight'].includes(name)) return 'Lighting and glow';
  if (name.startsWith('grid') || name.startsWith('wireframe')) return 'Grid and lines';
  if (name.startsWith('laser') || name === 'pulse') return 'Lasers and effects';
  if (name === 'buildingLogo') return 'Branding';
  return 'Other';
};

const sceneLabel = (name: string) => {
  const labels: Record<string, string> = {
    canvasBackground: 'Canvas background',
    ambient: 'Ambient light',
    hemisphereGround: 'Hemisphere ground',
    keyLight: 'Key light',
    fillLight: 'Fill light',
    gridPrimary: 'Grid primary line',
    gridSecondary: 'Grid secondary line',
    wireframeMain: 'Wireframe main',
    wireframeFloor: 'Wireframe floor',
    laserRed: 'Red laser',
    laserBlue: 'Blue laser',
    pulse: 'Pulse / glow',
    buildingLogo: 'Building logo',
  };
  return labels[name] ?? name;
};

const parseOklch = (value: string): Oklch | null => {
  const match = value.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);
  if (!match) return null;

  return {
    lightness: Number(match[1]),
    chroma: Number(match[2]),
    hue: Number(match[3]),
    alpha: Number(match[4] ?? 1),
  };
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const linearToSrgb = (value: number) =>
  value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

const oklchToHex = ({ lightness, chroma, hue }: Oklch) => {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness / 100 + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness / 100 - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness / 100 - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return `#${channels
    .map((channel) => Math.round(clamp(linearToSrgb(channel)) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
};

const srgbToLinear = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const hexToOklch = (hex: string, alpha: number): Oklch => {
  const rgb = [0, 2, 4].map((start) => srgbToLinear(Number.parseInt(hex.slice(start + 1, start + 3), 16) / 255));
  const l = Math.cbrt(0.4122214708 * rgb[0] + 0.5363325363 * rgb[1] + 0.0514459929 * rgb[2]);
  const m = Math.cbrt(0.2119034982 * rgb[0] + 0.6806995451 * rgb[1] + 0.1073969566 * rgb[2]);
  const s = Math.cbrt(0.0883024619 * rgb[0] + 0.2817188376 * rgb[1] + 0.6299787005 * rgb[2]);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    lightness: (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s) * 100,
    chroma: Math.hypot(a, b),
    hue: (Math.atan2(b, a) * 180) / Math.PI + 360,
    alpha,
  };
};

const formatOklch = ({ lightness, chroma, hue, alpha }: Oklch) => {
  const base = 'oklch' + '(' + `${lightness.toFixed(2)}% ${chroma.toFixed(4)} ${(hue % 360).toFixed(2)}`;
  return alpha < 1 ? `${base} / ${alpha.toFixed(2)})` : `${base})`;
};

const sceneNumberToHex = (value: number) => `#${value.toString(16).padStart(6, '0')}`;
const hexToSceneNumber = (value: string) => Number.parseInt(value.slice(1), 16);
const sceneSourceValue = (value: number) => `0x${value.toString(16).padStart(6, '0')}`;

export function TokenStudio({ colorTokens, sceneTokens }: TokenStudioProps) {
  const uiEntries = useMemo(
    () => Object.entries(colorTokens).filter(([name]) => name !== 'transparent'),
    [colorTokens],
  );
  const sceneEntries = useMemo(() => Object.entries(sceneTokens), [sceneTokens]);
  const sourceUiValues = useMemo(() => Object.fromEntries(uiEntries), [uiEntries]);
  const sourceSceneValues = useMemo(() => Object.fromEntries(sceneEntries), [sceneEntries]);
  const [uiDraft, setUiDraft] = useState<Record<string, string>>(sourceUiValues);
  const [sceneDraft, setSceneDraft] = useState<Record<string, number>>(sourceSceneValues);
  const [mode, setMode] = useState<StudioMode>('ui');
  const [selectedName, setSelectedName] = useState(uiEntries[0]?.[0] ?? '');
  const [copied, setCopied] = useState(false);

  const activeEntries = mode === 'ui' ? uiEntries : sceneEntries;
  const selectedUiValue = uiDraft[selectedName];
  const selectedSceneValue = sceneDraft[selectedName];
  const selectedValue = mode === 'ui' ? selectedUiValue : sceneNumberToHex(selectedSceneValue);
  const selectedColor = mode === 'ui' ? parseOklch(selectedUiValue) : null;
  const selectedHex = selectedColor ? oklchToHex(selectedColor) : selectedValue;
  const sourceLine = mode === 'ui'
    ? `    ${selectedName}: '${selectedUiValue}',`
    : `    ${selectedName}: ${sceneSourceValue(selectedSceneValue)},`;

  const groupedTokens = activeEntries.reduce<Record<string, string[]>>((groups, [name]) => {
    const group = mode === 'ui' ? tokenGroup(name) : sceneGroup(name);
    groups[group] ??= [];
    groups[group].push(name);
    return groups;
  }, {});

  useEffect(() => {
    setSelectedName((mode === 'ui' ? uiEntries : sceneEntries)[0]?.[0] ?? '');
    setCopied(false);
  }, [mode, sceneEntries, uiEntries]);

  const updateUiToken = (nextColor: Oklch) => {
    setUiDraft((current) => ({ ...current, [selectedName]: formatOklch(nextColor) }));
  };

  const updateSceneToken = (hex: string) => {
    setSceneDraft((current) => ({ ...current, [selectedName]: hexToSceneNumber(hex) }));
  };

  const resetDrafts = () => {
    setUiDraft(sourceUiValues);
    setSceneDraft(sourceSceneValues);
    setCopied(false);
  };

  const copySelected = async () => {
    await navigator.clipboard.writeText(sourceLine);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Local development tool</p>
        <h1>Color Token Studio</h1>
        <p className={styles.intro}>
          Tune UI or WebGL scene tokens visually, preview the result, then copy the resulting line into{' '}
          <code>tokens/design-tokens.ts</code>. Changes remain reviewable in Git.
        </p>
      </header>

      <section className={styles.workspace} aria-label="Color token editor">
        <aside className={styles.tokenList}>
          <div className={styles.modeTabs} role="tablist" aria-label="Token collection">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'ui'}
              className={mode === 'ui' ? styles.activeTab : ''}
              onClick={() => setMode('ui')}
            >
              UI colors
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'scene'}
              className={mode === 'scene' ? styles.activeTab : ''}
              onClick={() => setMode('scene')}
            >
              3D scene
            </button>
          </div>

          {Object.entries(groupedTokens).map(([group, names]) => (
            <section key={group} className={styles.group}>
              <h2>{group}</h2>
              {names.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={`${styles.tokenButton} ${name === selectedName ? styles.isSelected : ''}`}
                  onClick={() => setSelectedName(name)}
                >
                  <span className={styles.swatch} style={{ backgroundColor: mode === 'ui' ? uiDraft[name] : sceneNumberToHex(sceneDraft[name]) }} />
                  <span>{mode === 'ui' ? name : sceneLabel(name)}</span>
                </button>
              ))}
            </section>
          ))}
        </aside>

        {selectedHex && (
          <section className={styles.editor}>
            <div className={styles.editorHeading}>
              <div>
                <p className={styles.eyebrow}>{mode === 'ui' ? 'Editing UI token' : 'Editing 3D scene token'}</p>
                <h2>{mode === 'ui' ? selectedName : sceneLabel(selectedName)}</h2>
              </div>
              <button type="button" className={styles.reset} onClick={resetDrafts}>
                Reset all drafts
              </button>
            </div>

            <div className={styles.colorPreview} style={{ backgroundColor: selectedValue }}>
              <span>{mode === 'ui' ? 'Live UI preview' : 'Live 3D color preview'}</span>
            </div>

            <label className={styles.nativePicker}>
              <span>{mode === 'ui' ? 'Native color picker' : '3D numeric color picker'}</span>
              <input
                type="color"
                value={selectedHex}
                onChange={(event) => {
                  if (mode === 'ui' && selectedColor) {
                    updateUiToken(hexToOklch(event.target.value, selectedColor.alpha));
                  }
                  if (mode === 'scene') updateSceneToken(event.target.value);
                }}
              />
              <code>{selectedHex.toUpperCase()}</code>
            </label>

            {selectedColor ? (
              <div className={styles.controls}>
                <RangeControl
                  label="Lightness"
                  value={selectedColor.lightness}
                  min={0}
                  max={100}
                  step={0.01}
                  unit="%"
                  onChange={(lightness) => updateUiToken({ ...selectedColor, lightness })}
                />
                <RangeControl
                  label="Chroma"
                  value={selectedColor.chroma}
                  min={0}
                  max={0.4}
                  step={0.0001}
                  onChange={(chroma) => updateUiToken({ ...selectedColor, chroma })}
                />
                <RangeControl
                  label="Hue"
                  value={selectedColor.hue % 360}
                  min={0}
                  max={360}
                  step={0.01}
                  unit="°"
                  onChange={(hue) => updateUiToken({ ...selectedColor, hue })}
                />
                <RangeControl
                  label="Opacity"
                  value={selectedColor.alpha}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(alpha) => updateUiToken({ ...selectedColor, alpha })}
                />
              </div>
            ) : (
              <p className={styles.sceneHelp}>
                Three.js consumes numeric RGB values. The picker writes a numeric scene token while preserving the required format.
              </p>
            )}

            <div className={styles.output}>
              <p>{mode === 'ui' ? 'UI token source line' : '3D scene source line'}</p>
              <code>{sourceLine}</code>
              <button type="button" className={styles.copy} onClick={copySelected}>
                {copied ? 'Copied' : 'Copy token line'}
              </button>
            </div>
          </section>
        )}

        {selectedHex && (
          <aside className={styles.context}>
            <p className={styles.eyebrow}>{mode === 'ui' ? 'Context preview' : '3D context preview'}</p>
            <div className={styles.contextCard}>
              <span className={styles.contextMark} style={{ backgroundColor: selectedValue }} />
              <div>
                <strong>{mode === 'ui' ? 'Rastaak UI token' : sceneLabel(selectedName)}</strong>
                <p>
                  {mode === 'ui'
                    ? 'Token-driven colors keep components and CSS aligned.'
                    : 'This source value is shared by the Three.js scene and legacy WebGL worker.'}
                </p>
              </div>
            </div>
            {mode === 'ui' ? (
              <div className={styles.contextPanel} style={{ backgroundColor: selectedValue }}>
                <span>Surface sample</span>
                <button type="button">Button sample</button>
              </div>
            ) : (
              <div className={styles.scenePreview}>
                <svg viewBox="0 0 320 180" aria-hidden="true">
                  <path d="M0 135 160 38 320 135M0 152 160 55 320 152M40 180V95M100 180V59M160 180V24M220 180V59M280 180V95" stroke={selectedValue} strokeWidth="2" />
                  <path d="M24 28h164l-38 24H24z" fill={selectedValue} opacity="0.85" />
                  <path d="M24 52h126l-36 92H24z" fill={selectedValue} opacity="0.35" />
                  <path d="M210 45 306 136" stroke={selectedValue} strokeWidth="4" />
                  <circle cx="252" cy="86" r="22" fill={selectedValue} opacity="0.3" />
                </svg>
                <span>Grid · architecture · laser · pulse</span>
              </div>
            )}
            <ol className={styles.steps}>
              <li>Copy the source line.</li>
              <li>Replace the matching value in the canonical token file.</li>
              <li>Run <code>npm run tokens:generate</code>.</li>
              <li>Run <code>npm run build</code> before committing.</li>
            </ol>
          </aside>
        )}
      </section>
    </main>
  );
}

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function RangeControl({ label, value, min, max, step, unit = '', onChange }: RangeControlProps) {
  return (
    <label className={styles.rangeControl}>
      <span>
        {label}
        <output>{value.toFixed(step < 0.01 ? 4 : 2)}{unit}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
