'use client';

import { useState } from 'react';
import { publishLive } from '@/components/live/liveChannel';
import {
  SITE_CONTENT,
  applySiteContent,
  notifySiteContentChanged,
  type FeatureIconName,
  type LayoutAlign,
  type LayoutDirection,
} from '@/components/home/siteContent';
import { TYPE_CHROME, applyTypeChrome } from '@/components/home/typeChrome';

const ICONS: FeatureIconName[] = ['rapid', 'selection', 'verified', 'outcomes'];
const SECTION_ROWS = [
  ['header', 'Header'],
  ['scene', '3D scene'],
  ['features', 'Competitive Items'],
  ['standards', 'Blog'],
  ['faq', 'Q&A'],
  ['cta', 'CTA'],
  ['footer', 'Footer'],
] as const;

function hex(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

function color(value: string): number {
  return Number.parseInt(value.replace('#', ''), 16) >>> 0;
}

function uploadedFile(file: File, apply: (dataUrl: string) => void) {
  if (file.size > 900_000) {
    window.alert('Please use an image smaller than 900 KB for a fast layout preview.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') apply(reader.result);
  };
  reader.readAsDataURL(file);
}

export function LayoutControlPanel() {
  const [revision, setRevision] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('Live changes are not saved until Apply & Save.');

  const refresh = () => {
    applySiteContent();
    applyTypeChrome();
    notifySiteContentChanged();
    publishLive({ siteContent: SITE_CONTENT, typeChrome: TYPE_CHROME });
    setRevision((value) => value + 1);
  };

  const change = (mutate: () => void) => {
    mutate();
    refresh();
  };

  const save = async () => {
    setSaving(true);
    setMessage('Saving…');
    try {
      const response = await fetch('/api/save-studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteContent: SITE_CONTENT, typeChrome: TYPE_CHROME }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Save failed');
      setMessage('Saved to code.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const direction = SITE_CONTENT.layout.headerDirection;
  const footerAlignments: LayoutAlign[] = ['start', 'center', 'end'];
  const links = SITE_CONTENT.links;
  void revision;

  return (
    <aside id="rastaak-layout-control" data-collapsed={collapsed ? 'true' : 'false'} dir="ltr">
      <button
        type="button"
        className="layout-control-edge"
        title={collapsed ? 'Show Layout Control' : 'Hide Layout Control'}
        aria-label={collapsed ? 'Show Layout Control' : 'Hide Layout Control'}
        onClick={() => setCollapsed((value) => !value)}
      >
        {collapsed ? '‹' : '›'}
      </button>
      <div className="layout-control-sheet">
        <div className="layout-control-head">
          <strong>Layout Control</strong>
          <button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Apply & Save'}
          </button>
        </div>
        <p className="layout-control-note">{message}</p>

        <details open>
          <summary>Section visibility</summary>
          <div className="layout-control-body layout-section-grid">
            {SECTION_ROWS.map(([key, label]) => (
              <label className="layout-toggle" key={key}>
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={SITE_CONTENT.sections[key] !== false}
                  onChange={(event) => change(() => {
                    SITE_CONTENT.sections[key] = event.target.checked;
                  })}
                />
              </label>
            ))}
          </div>
        </details>

        <details>
          <summary>Header</summary>
          <div className="layout-control-body">
            <label>
              <span>Layout direction</span>
              <select
                value={direction}
                onChange={(event) => change(() => {
                  SITE_CONTENT.layout.headerDirection = event.target.value as LayoutDirection;
                })}
              >
                <option value="rtl">RTL — فارسی</option>
                <option value="ltr">LTR</option>
              </select>
            </label>
            <label>
              <span>3D-scene text color</span>
              <input
                type="color"
                value={hex(SITE_CONTENT.header.sceneColor)}
                onChange={(event) => change(() => {
                  SITE_CONTENT.header.sceneColor = color(event.target.value);
                })}
              />
            </label>
            <label>
              <span>Layout text color</span>
              <input
                type="color"
                value={hex(SITE_CONTENT.header.layoutColor)}
                onChange={(event) => change(() => {
                  SITE_CONTENT.header.layoutColor = color(event.target.value);
                })}
              />
            </label>
            <p className="layout-hint">Website-name colors remain in 3D Studio → Hero. These two colors control the header links and CTA labels.</p>
            {(['industries', 'mission', 'apply', 'request'] as const).map((key) => (
              <fieldset key={key}>
                <legend>{key === 'industries' ? 'Our Industries' : key === 'mission' ? 'Our Mission' : key === 'apply' ? 'Apply' : 'Request Crews'}</legend>
                <label className="layout-toggle">
                  <span>Show in header</span>
                  <input type="checkbox" checked={links[key].visible !== false} onChange={(event) => change(() => { links[key].visible = event.target.checked; })} />
                </label>
                <label>
                  <span>Label</span>
                  <input value={links[key].label} onChange={(event) => change(() => { links[key].label = event.target.value; })} />
                </label>
                <label>
                  <span>Link</span>
                  <input value={links[key].href} onChange={(event) => change(() => { links[key].href = event.target.value; })} />
                </label>
              </fieldset>
            ))}
          </div>
        </details>

        <details>
          <summary>3D scene</summary>
          <div className="layout-control-body">
            <p className="layout-hint">Scene, hero, story, chapter panel, camera, and building controls remain in the left 3D Studio panel.</p>
          </div>
        </details>

        <details>
          <summary>Competitive Items</summary>
          <div className="layout-control-body">
            <label>
              <span>Direction</span>
              <select value={SITE_CONTENT.layout.featuresDirection} onChange={(event) => change(() => { SITE_CONTENT.layout.featuresDirection = event.target.value as LayoutDirection; })}>
                <option value="rtl">RTL</option><option value="ltr">LTR</option>
              </select>
            </label>
            <label>
              <span>Text alignment</span>
              <select value={SITE_CONTENT.layout.featuresAlign} onChange={(event) => change(() => { SITE_CONTENT.layout.featuresAlign = event.target.value as LayoutAlign; })}>
                {footerAlignments.map((align) => <option key={align} value={align}>{align}</option>)}
              </select>
            </label>
            <label>
              <span>Title line 1</span>
              <input value={SITE_CONTENT.features.titleLine1} onChange={(event) => change(() => { SITE_CONTENT.features.titleLine1 = event.target.value; })} />
            </label>
            <label>
              <span>Title line 2</span>
              <input value={SITE_CONTENT.features.titleLine2} onChange={(event) => change(() => { SITE_CONTENT.features.titleLine2 = event.target.value; })} />
            </label>
            {SITE_CONTENT.features.items.map((item, index) => (
              <fieldset key={`${index}-${item.title}`}>
                <legend>Item {index + 1}</legend>
                <label>
                  <span>Built-in icon</span>
                  <select value={item.icon} onChange={(event) => change(() => { item.icon = event.target.value as FeatureIconName; item.iconImage = undefined; })}>
                    {ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </label>
                <label>
                  <span>Upload icon</span>
                  <input type="file" accept="image/*" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadedFile(file, (dataUrl) => change(() => { item.iconImage = dataUrl; }));
                    event.currentTarget.value = '';
                  }} />
                </label>
                {item.iconImage ? <button type="button" onClick={() => change(() => { item.iconImage = undefined; })}>Use built-in icon</button> : null}
                <label>
                  <span>Item title</span>
                  <input value={item.title} onChange={(event) => change(() => { item.title = event.target.value; })} />
                </label>
                <label>
                  <span>Description</span>
                  <textarea rows={3} value={item.description} onChange={(event) => change(() => { item.description = event.target.value; })} />
                </label>
                <button type="button" className="layout-danger" disabled={SITE_CONTENT.features.items.length <= 1} onClick={() => change(() => { SITE_CONTENT.features.items.splice(index, 1); })}>Remove item</button>
              </fieldset>
            ))}
            <button type="button" onClick={() => change(() => {
              SITE_CONTENT.features.items.push({ icon: 'rapid', title: 'New competitive item', description: 'Describe this competitive advantage.' });
            })}>Add item</button>
          </div>
        </details>

        <details>
          <summary>Blog</summary>
          <div className="layout-control-body">
            <label>
              <span>Direction</span>
              <select value={SITE_CONTENT.layout.standardsDirection} onChange={(event) => change(() => { SITE_CONTENT.layout.standardsDirection = event.target.value as LayoutDirection; })}>
                <option value="rtl">RTL</option><option value="ltr">LTR</option>
              </select>
            </label>
            <label>
              <span>Text alignment</span>
              <select value={SITE_CONTENT.layout.standardsAlign} onChange={(event) => change(() => { SITE_CONTENT.layout.standardsAlign = event.target.value as LayoutAlign; })}>
                {footerAlignments.map((align) => <option key={align} value={align}>{align}</option>)}
              </select>
            </label>
            {(['titleLine1', 'titleLine2', 'titleLine3'] as const).map((key, index) => (
              <label key={key}>
                <span>Title line {index + 1}</span>
                <input value={SITE_CONTENT.standards[key]} onChange={(event) => change(() => { SITE_CONTENT.standards[key] = event.target.value; })} />
              </label>
            ))}
            <label>
              <span>Description</span>
              <textarea rows={4} value={SITE_CONTENT.standards.description} onChange={(event) => change(() => { SITE_CONTENT.standards.description = event.target.value; })} />
            </label>
            <label>
              <span>Button label</span>
              <input value={SITE_CONTENT.standards.cta} onChange={(event) => change(() => { SITE_CONTENT.standards.cta = event.target.value; })} />
            </label>
            <label>
              <span>Button link</span>
              <input value={SITE_CONTENT.standards.href} onChange={(event) => change(() => { SITE_CONTENT.standards.href = event.target.value; })} />
            </label>
            <label>
              <span>Image URL</span>
              <input value={SITE_CONTENT.standards.imageSrc ?? ''} onChange={(event) => change(() => { SITE_CONTENT.standards.imageSrc = event.target.value || undefined; })} />
            </label>
            <label>
              <span>Upload image</span>
              <input type="file" accept="image/*" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadedFile(file, (dataUrl) => change(() => { SITE_CONTENT.standards.imageSrc = dataUrl; }));
                event.currentTarget.value = '';
              }} />
            </label>
          </div>
        </details>

        <details>
          <summary>Q&amp;A</summary>
          <div className="layout-control-body">
            <label>
              <span>Direction</span>
              <select value={SITE_CONTENT.layout.faqDirection} onChange={(event) => change(() => { SITE_CONTENT.layout.faqDirection = event.target.value as LayoutDirection; })}>
                <option value="rtl">RTL</option><option value="ltr">LTR</option>
              </select>
            </label>
            <label>
              <span>Text alignment</span>
              <select value={SITE_CONTENT.layout.faqAlign} onChange={(event) => change(() => { SITE_CONTENT.layout.faqAlign = event.target.value as LayoutAlign; })}>
                {footerAlignments.map((align) => <option key={align} value={align}>{align}</option>)}
              </select>
            </label>
            <label>
              <span>Section title</span>
              <textarea rows={3} value={SITE_CONTENT.faq.title} onChange={(event) => change(() => { SITE_CONTENT.faq.title = event.target.value; })} />
            </label>
            {SITE_CONTENT.faq.items.map((item, index) => (
              <fieldset key={`${index}-${item.question}`}>
                <legend>Question {index + 1}</legend>
                <label>
                  <span>Question</span>
                  <textarea rows={2} value={item.question} onChange={(event) => change(() => { item.question = event.target.value; })} />
                </label>
                <label>
                  <span>Answer</span>
                  <textarea rows={4} value={item.answer} onChange={(event) => change(() => { item.answer = event.target.value; })} />
                </label>
                <button type="button" className="layout-danger" disabled={SITE_CONTENT.faq.items.length <= 1} onClick={() => change(() => { SITE_CONTENT.faq.items.splice(index, 1); })}>Remove question</button>
              </fieldset>
            ))}
            <button type="button" onClick={() => change(() => { SITE_CONTENT.faq.items.push({ question: 'New question', answer: 'New answer' }); })}>Add question</button>
          </div>
        </details>

        <details>
          <summary>CTA</summary>
          <div className="layout-control-body">
            <label>
              <span>Direction</span>
              <select value={SITE_CONTENT.layout.ctaDirection} onChange={(event) => change(() => { SITE_CONTENT.layout.ctaDirection = event.target.value as LayoutDirection; })}>
                <option value="rtl">RTL</option><option value="ltr">LTR</option>
              </select>
            </label>
            <label>
              <span>Text alignment</span>
              <select value={SITE_CONTENT.layout.ctaAlign} onChange={(event) => change(() => { SITE_CONTENT.layout.ctaAlign = event.target.value as LayoutAlign; })}>
                {footerAlignments.map((align) => <option key={align} value={align}>{align}</option>)}
              </select>
            </label>
            <label>
              <span>Title line 1</span>
              <input value={SITE_CONTENT.cta.titleLine1} onChange={(event) => change(() => { SITE_CONTENT.cta.titleLine1 = event.target.value; })} />
            </label>
            <label>
              <span>Title line 2</span>
              <input value={SITE_CONTENT.cta.titleLine2} onChange={(event) => change(() => { SITE_CONTENT.cta.titleLine2 = event.target.value; })} />
            </label>
            <label>
              <span>Button label</span>
              <input value={SITE_CONTENT.cta.button} onChange={(event) => change(() => { SITE_CONTENT.cta.button = event.target.value; })} />
            </label>
            <label>
              <span>Button link</span>
              <input value={SITE_CONTENT.cta.href} onChange={(event) => change(() => { SITE_CONTENT.cta.href = event.target.value; })} />
            </label>
          </div>
        </details>

        <details>
          <summary>Footer</summary>
          <div className="layout-control-body">
            <label>
              <span>Direction</span>
              <select value={SITE_CONTENT.layout.footerDirection} onChange={(event) => change(() => { SITE_CONTENT.layout.footerDirection = event.target.value as LayoutDirection; })}>
                <option value="rtl">RTL</option><option value="ltr">LTR</option>
              </select>
            </label>
            <label>
              <span>Copyright phrase</span>
              <input value={SITE_CONTENT.footer.copyright} onChange={(event) => change(() => { SITE_CONTENT.footer.copyright = event.target.value; })} />
            </label>
            <label>
              <span>Credit prefix</span>
              <input value={SITE_CONTENT.footer.creditPrefix} onChange={(event) => change(() => { SITE_CONTENT.footer.creditPrefix = event.target.value; })} />
            </label>
            <label>
              <span>Credit name</span>
              <input value={SITE_CONTENT.footer.creditName} onChange={(event) => change(() => { SITE_CONTENT.footer.creditName = event.target.value; })} />
            </label>
            <label>
              <span>Credit accent color</span>
              <input type="color" value={hex(SITE_CONTENT.footer.creditColor)} onChange={(event) => change(() => { SITE_CONTENT.footer.creditColor = color(event.target.value); })} />
            </label>
            <label>
              <span>Privacy label</span>
              <input value={SITE_CONTENT.footer.privacy} onChange={(event) => change(() => { SITE_CONTENT.footer.privacy = event.target.value; })} />
            </label>
            <label>
              <span>Privacy link</span>
              <input value={SITE_CONTENT.footer.privacyHref ?? '/privacy'} onChange={(event) => change(() => { SITE_CONTENT.footer.privacyHref = event.target.value; })} />
            </label>
            <label>
              <span>Terms label</span>
              <input value={SITE_CONTENT.footer.terms} onChange={(event) => change(() => { SITE_CONTENT.footer.terms = event.target.value; })} />
            </label>
            <label>
              <span>Terms link</span>
              <input value={SITE_CONTENT.footer.termsHref ?? '/terms'} onChange={(event) => change(() => { SITE_CONTENT.footer.termsHref = event.target.value; })} />
            </label>
            <label>
              <span>Logo alignment</span>
              <select value={SITE_CONTENT.layout.footerLogoAlign} onChange={(event) => change(() => { SITE_CONTENT.layout.footerLogoAlign = event.target.value as LayoutAlign; })}>
                {footerAlignments.map((align) => <option key={align} value={align}>{align}</option>)}
              </select>
            </label>
            <label>
              <span>Meta alignment</span>
              <select value={SITE_CONTENT.layout.footerMetaAlign} onChange={(event) => change(() => { SITE_CONTENT.layout.footerMetaAlign = event.target.value as LayoutAlign; })}>
                {footerAlignments.map((align) => <option key={align} value={align}>{align}</option>)}
              </select>
            </label>
            <label>
              <span>Logo scale</span>
              <input type="range" min="0.5" max="2" step="0.05" value={SITE_CONTENT.layout.footerLogoScale} onChange={(event) => change(() => { SITE_CONTENT.layout.footerLogoScale = Number(event.target.value); })} />
            </label>
            <label>
              <span>Footer padding</span>
              <input type="range" min="16" max="160" step="4" value={SITE_CONTENT.layout.footerBottomPadding} onChange={(event) => change(() => { SITE_CONTENT.layout.footerBottomPadding = Number(event.target.value); })} />
            </label>
          </div>
        </details>
      </div>
    </aside>
  );
}
