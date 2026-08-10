'use client';

import { useMemo, useState } from 'react';
import styles from './TokenStudio.module.css';

type ColorTokens = Record<string, string>;

type Oklch = {
  lightness: number;
  chroma: number;
  hue: number;
  alpha: number;
};

interface TokenStudioProps {
  colorTokens: ColorTokens;
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

export function TokenStudio({ colorTokens }: TokenStudioProps) {
  const editableTokens = useMemo(
    () => Object.entries(colorTokens).filter(([name]) => name !== 'transparent'),
    [colorTokens],
  );
  const sourceValues = useMemo(() => Object.fromEntries(editableTokens), [editableTokens]);
  const [draft, setDraft] = useState<ColorTokens>(sourceValues);
  const [selectedName, setSelectedName] = useState(editableTokens[0]?.[0] ?? '');
  const [copied, setCopied] = useState(false);

  const selectedValue = draft[selectedName];
  const selectedColor = parseOklch(selectedValue);
  const selectedHex = selectedColor ? oklchToHex(selectedColor) : undefined;
  const groupedTokens = editableTokens.reduce<Record<string, string[]>>((groups, [name]) => {
    const group = tokenGroup(name);
    groups[group] ??= [];
    groups[group].push(name);
    return groups;
  }, {});

  const updateSelected = (nextColor: Oklch) => {
    setDraft((current) => ({ ...current, [selectedName]: formatOklch(nextColor) }));
  };

  const copySelected = async () => {
    await navigator.clipboard.writeText(`    ${selectedName}: '${selectedValue}',`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Local development tool</p>
        <h1>Color Token Studio</h1>
        <p className={styles.intro}>
          Tune an OKLCH token visually, preview it in context, then copy the resulting line into{' '}
          <code>tokens/design-tokens.ts</code>. Changes remain reviewable in Git.
        </p>
      </header>

      <section className={styles.workspace} aria-label="Color token editor">
        <aside className={styles.tokenList}>
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
                  <span className={styles.swatch} style={{ backgroundColor: draft[name] }} />
                  <span>{name}</span>
                </button>
              ))}
            </section>
          ))}
        </aside>

        {selectedColor && selectedHex && (
          <section className={styles.editor}>
            <div className={styles.editorHeading}>
              <div>
                <p className={styles.eyebrow}>Editing token</p>
                <h2>{selectedName}</h2>
              </div>
              <button type="button" className={styles.reset} onClick={() => setDraft(sourceValues)}>
                Reset all drafts
              </button>
            </div>

            <div className={styles.colorPreview} style={{ backgroundColor: selectedValue }}>
              <span>Live preview</span>
            </div>

            <label className={styles.nativePicker}>
              <span>Native color picker</span>
              <input
                type="color"
                value={selectedHex}
                onChange={(event) => updateSelected(hexToOklch(event.target.value, selectedColor.alpha))}
              />
              <code>{selectedHex.toUpperCase()}</code>
            </label>

            <div className={styles.controls}>
              <RangeControl
                label="Lightness"
                value={selectedColor.lightness}
                min={0}
                max={100}
                step={0.01}
                unit="%"
                onChange={(lightness) => updateSelected({ ...selectedColor, lightness })}
              />
              <RangeControl
                label="Chroma"
                value={selectedColor.chroma}
                min={0}
                max={0.4}
                step={0.0001}
                onChange={(chroma) => updateSelected({ ...selectedColor, chroma })}
              />
              <RangeControl
                label="Hue"
                value={selectedColor.hue % 360}
                min={0}
                max={360}
                step={0.01}
                unit="°"
                onChange={(hue) => updateSelected({ ...selectedColor, hue })}
              />
              <RangeControl
                label="Opacity"
                value={selectedColor.alpha}
                min={0}
                max={1}
                step={0.01}
                onChange={(alpha) => updateSelected({ ...selectedColor, alpha })}
              />
            </div>

            <div className={styles.output}>
              <p>Token source line</p>
              <code>{`    ${selectedName}: '${selectedValue}',`}</code>
              <button type="button" className={styles.copy} onClick={copySelected}>
                {copied ? 'Copied' : 'Copy token line'}
              </button>
            </div>
          </section>
        )}

        {selectedColor && (
          <aside className={styles.context}>
            <p className={styles.eyebrow}>Context preview</p>
            <div className={styles.contextCard}>
              <span className={styles.contextMark} style={{ backgroundColor: selectedValue }} />
              <div>
                <strong>Rastaak token</strong>
                <p>Token-driven colors keep components and CSS aligned.</p>
              </div>
            </div>
            <div className={styles.contextPanel} style={{ backgroundColor: selectedValue }}>
              <span>Surface sample</span>
              <button type="button">Button sample</button>
            </div>
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
