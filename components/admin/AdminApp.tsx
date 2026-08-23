'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { tokens } from '@/tokens/design-tokens';
import { SITE_CONTENT, applySiteContent, type SiteContentConfig } from '@/components/home/siteContent';
import { TYPE_CHROME, applyTypeChrome } from '@/components/home/typeChrome';
import { HERO_COPY, applyHeroCopy } from '@/components/home/heroCopy';
import { FLOW_CONFIG, FLOW_CHROME, applyFlowChrome, syncFlowDom } from '@/components/home/flowConfig';
import { SCENE_CONFIG } from '@/components/canvas/scene/sceneConfig';
import { LIGHTS_CONFIG } from '@/components/canvas/scene/lightingConfig';
import { publishLive } from '@/components/live/liveChannel';
import './admin.css';

const HeroCanvas3D = dynamic(() => import('@/components/canvas/HeroCanvas3D').then((mod) => mod.HeroCanvas3D), {
  ssr: false,
});

type Tab = 'scene' | 'features' | 'standards' | 'faq' | 'cta' | 'links' | 'footer';

const TABS: Array<{ id: Tab; label: string; hint: string }> = [
  { id: 'scene', label: '1. 3D scene', hint: 'Lights, camera, story, hero title' },
  { id: 'features', label: '2. Four options', hint: 'Rapid activation and the three beside it' },
  { id: 'standards', label: '3. Blog / standards', hint: 'Nuclear-grade standards' },
  { id: 'faq', label: '4. Q&A', hint: 'Questions and answers' },
  { id: 'cta', label: '5. Request Crews', hint: 'Bottom call to action' },
  { id: 'links', label: '6. Three options', hint: 'Industries, mission, apply' },
  { id: 'footer', label: '7. Footer', hint: 'Copyright and legal' },
];

function liveSite() {
  applySiteContent(SITE_CONTENT);
  publishLive({ siteContent: SITE_CONTENT });
}

function liveType() {
  applyTypeChrome();
  publishLive({ typeChrome: { ...TYPE_CHROME } });
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

export function AdminApp() {
  const [tab, setTab] = useState<Tab>('scene');
  const [saving, setSaving] = useState(false);
  const [studioOpen, setStudioOpen] = useState(true);
  const [note, setNote] = useState('Live. Homepage in another window updates as you type.');
  const [, bump] = useState(0);
  const refresh = () => bump((value) => value + 1);

  const toggleStudio = () => {
    window.dispatchEvent(new CustomEvent('rastaak-studio-toggle'));
  };

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.admin = 'true';
  }

  useEffect(() => {
    document.documentElement.dataset.admin = 'true';
    document.body.style.overflow = 'hidden';
    const onStudioOpen = (event: Event) => {
      const open = (event as CustomEvent<{ open?: boolean }>).detail?.open;
      if (typeof open === 'boolean') setStudioOpen(open);
    };
    window.addEventListener('rastaak-studio-open', onStudioOpen);
    return () => {
      delete document.documentElement.dataset.admin;
      document.body.style.overflow = '';
      window.removeEventListener('rastaak-studio-open', onStudioOpen);
    };
  }, []);

  const sections = SITE_CONTENT.sections;

  const toggle = (key: keyof SiteContentConfig['sections']) => {
    sections[key] = !sections[key];
    liveSite();
    refresh();
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        cameraStops: SCENE_CONFIG.stops,
        lights: LIGHTS_CONFIG,
        environment: SCENE_CONFIG.environment,
        renderer: SCENE_CONFIG.renderer,
        scroll: SCENE_CONFIG.scroll,
        camera: SCENE_CONFIG.camera,
        materials: SCENE_CONFIG.materials,
        heroCopy: HERO_COPY,
        flowSteps: FLOW_CONFIG,
        flowChrome: FLOW_CHROME,
        typeChrome: TYPE_CHROME,
        siteContent: SITE_CONTENT,
      };
      const res = await fetch('/api/save-studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setNote(res.ok ? 'Saved to project files. Refresh still keeps this.' : data.error || 'Save failed');
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.reload();
  };

  const chrome = useMemo(
    () => ({
      bg: tokens.colors.bgDark,
      panel: tokens.colors.bgDarkElevated,
      text: tokens.colors.textLight,
      muted: tokens.colors.textSubtle,
      line: tokens.colors.borderDarkSubtle,
    }),
    [],
  );

  return (
    <div className="admin-shell" style={{ background: chrome.bg, color: chrome.text }}>
      <aside className="admin-nav" style={{ background: chrome.panel, borderColor: chrome.line }}>
        <div className="admin-brand">
          <strong>Rastaak Admin</strong>
          <span style={{ color: chrome.muted }}>Live website control</span>
        </div>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'is-on' : ''}
            onClick={() => setTab(item.id)}
          >
            <b>{item.label}</b>
            <small>{item.hint}</small>
          </button>
        ))}
        <div className="admin-nav-actions">
          <button type="button" className="admin-save" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save to project'}
          </button>
          <a href="/" target="_blank" rel="noreferrer">
            Open homepage
          </a>
          <button type="button" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <p className="admin-note">{note}</p>

        <section className="admin-grid admin-grid--scene" hidden={tab !== 'scene'}>
            <div className="admin-card">
              <h2>Section on/off</h2>
              <label className="admin-toggle">
                <input type="checkbox" checked={sections.scene} onChange={() => toggle('scene')} />
                Show 3D scene + process timeline
              </label>
              <Field
                label="Website title (هونامیک ارتباط رستاک)"
                value={TYPE_CHROME.siteName}
                onChange={(value) => {
                  TYPE_CHROME.siteName = value;
                  liveType();
                  refresh();
                }}
              />
              <Field
                label="Title padding top (px)"
                value={String(TYPE_CHROME.siteNamePaddingTop ?? 0)}
                onChange={(value) => {
                  TYPE_CHROME.siteNamePaddingTop = Number(value) || 0;
                  liveType();
                  refresh();
                }}
              />
              <Field
                label="Hero title line 1"
                value={HERO_COPY.titleLine1}
                onChange={(value) => {
                  HERO_COPY.titleLine1 = value;
                  applyHeroCopy();
                  publishLive({ heroCopy: { ...HERO_COPY } });
                  refresh();
                }}
              />
              <Field
                label="Hero title line 2"
                value={HERO_COPY.titleLine2}
                onChange={(value) => {
                  HERO_COPY.titleLine2 = value;
                  applyHeroCopy();
                  publishLive({ heroCopy: { ...HERO_COPY } });
                  refresh();
                }}
              />
              <button
                type="button"
                className={`admin-studio-launch ${studioOpen ? 'is-on' : ''}`}
                onClick={toggleStudio}
              >
                {studioOpen ? 'Hide 3D Studio panel' : 'Show 3D Studio panel'}
              </button>
              <p className="admin-help">
                Use Show 3D Studio panel for lights, camera, materials, and gizmos. Wheel zooms the city. Drag orbits. Changes go to the homepage window instantly. Use Save to write them into the project.
              </p>
            </div>
            <div className={`admin-stage ${studioOpen ? 'has-studio' : ''}`}>
              <div className="admin-preview">
                <button
                  type="button"
                  className={`admin-preview-studio ${studioOpen ? 'is-on' : ''}`}
                  onClick={toggleStudio}
                >
                  {studioOpen ? 'Hide studio' : 'Show studio'}
                </button>
                <HeroCanvas3D mode="admin" />
              </div>
              <aside className="admin-studio-dock" id="admin-studio-dock">
                <div className="admin-studio-dock__label">3D Studio</div>
              </aside>
              <div className="admin-timeline-dock" id="admin-timeline-dock" />
            </div>
        </section>

        {tab === 'features' && (
          <section className="admin-card">
            <label className="admin-toggle">
              <input type="checkbox" checked={sections.features} onChange={() => toggle('features')} />
              Show this section
            </label>
            <Field
              label="Title line 1"
              value={SITE_CONTENT.features.titleLine1}
              onChange={(value) => {
                SITE_CONTENT.features.titleLine1 = value;
                liveSite();
                refresh();
              }}
            />
            <Field
              label="Title line 2"
              value={SITE_CONTENT.features.titleLine2}
              onChange={(value) => {
                SITE_CONTENT.features.titleLine2 = value;
                liveSite();
                refresh();
              }}
            />
            {SITE_CONTENT.features.items.map((item, index) => (
              <div key={item.icon} className="admin-sub">
                <h3>Option {index + 1}</h3>
                <Field
                  label="Title"
                  value={item.title}
                  onChange={(value) => {
                    item.title = value;
                    liveSite();
                    refresh();
                  }}
                />
                <Field
                  label="Text"
                  multiline
                  value={item.description}
                  onChange={(value) => {
                    item.description = value;
                    liveSite();
                    refresh();
                  }}
                />
              </div>
            ))}
          </section>
        )}

        {tab === 'standards' && (
          <section className="admin-card">
            <label className="admin-toggle">
              <input type="checkbox" checked={sections.standards} onChange={() => toggle('standards')} />
              Show this section
            </label>
            <Field label="Title line 1" value={SITE_CONTENT.standards.titleLine1} onChange={(value) => { SITE_CONTENT.standards.titleLine1 = value; liveSite(); refresh(); }} />
            <Field label="Title line 2" value={SITE_CONTENT.standards.titleLine2} onChange={(value) => { SITE_CONTENT.standards.titleLine2 = value; liveSite(); refresh(); }} />
            <Field label="Title line 3" value={SITE_CONTENT.standards.titleLine3} onChange={(value) => { SITE_CONTENT.standards.titleLine3 = value; liveSite(); refresh(); }} />
            <Field label="Description" multiline value={SITE_CONTENT.standards.description} onChange={(value) => { SITE_CONTENT.standards.description = value; liveSite(); refresh(); }} />
            <Field label="Button" value={SITE_CONTENT.standards.cta} onChange={(value) => { SITE_CONTENT.standards.cta = value; liveSite(); refresh(); }} />
            <Field label="Button link" value={SITE_CONTENT.standards.href} onChange={(value) => { SITE_CONTENT.standards.href = value; liveSite(); refresh(); }} />
          </section>
        )}

        {tab === 'faq' && (
          <section className="admin-card">
            <label className="admin-toggle">
              <input type="checkbox" checked={sections.faq} onChange={() => toggle('faq')} />
              Show this section
            </label>
            <Field label="Title" value={SITE_CONTENT.faq.title} onChange={(value) => { SITE_CONTENT.faq.title = value; liveSite(); refresh(); }} />
            {SITE_CONTENT.faq.items.map((item, index) => (
              <div key={index} className="admin-sub">
                <h3>Question {index + 1}</h3>
                <Field label="Question" value={item.question} onChange={(value) => { item.question = value; liveSite(); refresh(); }} />
                <Field label="Answer" multiline value={item.answer} onChange={(value) => { item.answer = value; liveSite(); refresh(); }} />
              </div>
            ))}
          </section>
        )}

        {tab === 'cta' && (
          <section className="admin-card">
            <label className="admin-toggle">
              <input type="checkbox" checked={sections.cta} onChange={() => toggle('cta')} />
              Show this section
            </label>
            <Field label="Title line 1" value={SITE_CONTENT.cta.titleLine1} onChange={(value) => { SITE_CONTENT.cta.titleLine1 = value; liveSite(); refresh(); }} />
            <Field label="Title line 2" value={SITE_CONTENT.cta.titleLine2} onChange={(value) => { SITE_CONTENT.cta.titleLine2 = value; liveSite(); refresh(); }} />
            <Field label="Button" value={SITE_CONTENT.cta.button} onChange={(value) => { SITE_CONTENT.cta.button = value; liveSite(); refresh(); }} />
            <Field label="Button link" value={SITE_CONTENT.cta.href} onChange={(value) => { SITE_CONTENT.cta.href = value; liveSite(); refresh(); }} />
          </section>
        )}

        {tab === 'links' && (
          <section className="admin-card">
            <label className="admin-toggle">
              <input type="checkbox" checked={sections.links} onChange={() => toggle('links')} />
              Show header / footer three options
            </label>
            {(['industries', 'mission', 'apply', 'request'] as const).map((key) => (
              <div key={key} className="admin-sub">
                <h3>{key}</h3>
                <Field label="Label" value={SITE_CONTENT.links[key].label} onChange={(value) => { SITE_CONTENT.links[key].label = value; liveSite(); refresh(); }} />
                <Field label="Link" value={SITE_CONTENT.links[key].href} onChange={(value) => { SITE_CONTENT.links[key].href = value; liveSite(); refresh(); }} />
              </div>
            ))}
          </section>
        )}

        {tab === 'footer' && (
          <section className="admin-card">
            <label className="admin-toggle">
              <input type="checkbox" checked={sections.footer} onChange={() => toggle('footer')} />
              Show footer
            </label>
            <Field label="Copyright after the year" value={SITE_CONTENT.footer.copyright} onChange={(value) => { SITE_CONTENT.footer.copyright = value; liveSite(); refresh(); }} />
            <Field label="Privacy label" value={SITE_CONTENT.footer.privacy} onChange={(value) => { SITE_CONTENT.footer.privacy = value; liveSite(); refresh(); }} />
            <Field label="Terms label" value={SITE_CONTENT.footer.terms} onChange={(value) => { SITE_CONTENT.footer.terms = value; liveSite(); refresh(); }} />
          </section>
        )}
      </main>
    </div>
  );
}
