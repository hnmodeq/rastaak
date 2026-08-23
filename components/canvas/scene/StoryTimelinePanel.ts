import { SCENE_CONFIG } from './sceneConfig';
import { STORY_CONFIG, STORY_FRAME_EVENT, type StoryFrame } from './storyConfig';
import { FLOW_CONFIG } from '@/components/home/flowConfig';
import { TYPE_CHROME } from '@/components/home/typeChrome';

const MIN_FLIGHT = 0.02;
const MIN_SPAN = 0.01;
const LABEL_W = 118;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function clampOrdered(value: number, min: number, max: number): number {
  if (max < min) return clamp01(value);
  return Math.min(max, Math.max(min, value));
}

function pct(t: number): string {
  return `${(clamp01(t) * 100).toFixed(3)}%`;
}

type DragKind = 'playhead' | 'cam' | 'step-start' | 'step-end' | 'need' | 'launch' | 'arrive' | 'cap-start' | 'cap-end';

type DragState = {
  kind: DragKind;
  index: number;
  lane: HTMLElement;
};

type TimingSnapshot = {
  stops: number[];
  steps: Array<[number, number]>;
  clients: Array<{ appear: number; dispatch: number; arrive: number }>;
  captions: Array<[number, number]>;
  chipHoldAfterArrive: number;
};

export class StoryTimelinePanel {
  private root: HTMLDivElement | null = null;
  private lanes: HTMLDivElement | null = null;
  private needle: HTMLDivElement | null = null;
  private readout: HTMLSpanElement | null = null;
  private undoBtn: HTMLButtonElement | null = null;
  private redoBtn: HTMLButtonElement | null = null;
  private playhead = 0;
  private dragging: DragState | null = null;
  private undoStack: TimingSnapshot[] = [];
  private redoStack: TimingSnapshot[] = [];
  private dragSnapshot: TimingSnapshot | null = null;
  private onFrame = (event: Event) => {
    const detail = (event as CustomEvent<StoryFrame>).detail;
    if (!detail || this.dragging) return;
    this.setPlayhead(detail.t);
  };
  private onPointerMove = (event: PointerEvent) => this.handleMove(event);
  private onPointerUp = () => {
    if (this.dragging && this.dragging.kind !== 'playhead' && this.dragSnapshot) {
      if (JSON.stringify(this.dragSnapshot) !== JSON.stringify(this.capture())) {
        this.undoStack.push(this.dragSnapshot);
        if (this.undoStack.length > 80) this.undoStack.shift();
        this.redoStack = [];
      }
    }
    this.dragSnapshot = null;
    this.dragging = null;
    this.paint();
    this.syncUndoButtons();
  };
  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.root || this.root.style.display === 'none') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select')) return;
    const key = event.key.toLowerCase();
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;
    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      this.redo();
    } else if (key === 'z') {
      event.preventDefault();
      this.undo();
    } else if (key === 'y') {
      event.preventDefault();
      this.redo();
    }
  };

  constructor(private onSeek: (t: number) => void) {}

  mount(host?: HTMLElement | null) {
    if (typeof document === 'undefined' || this.root) return;
    document.querySelectorAll('[id="rastaak-story-timeline"]').forEach((el) => el.remove());
    const root = document.createElement('div');
    root.id = 'rastaak-story-timeline';
    if (host) root.dataset.docked = 'true';
    root.innerHTML = `
      <div class="stl-head">
        <strong>Story Timeline</strong>
        <div class="stl-actions">
          <button type="button" data-undo>Undo</button>
          <button type="button" data-redo>Redo</button>
          <span data-readout>t 0.00</span>
        </div>
      </div>
      <div class="stl-legend">
        <i class="stl-swatch" style="background:#6f0000"></i>red
        <i class="stl-swatch" style="background:#1c6bff"></i>logo
        <i class="stl-swatch" style="background:#7a5cff"></i>page
        <i class="stl-swatch" style="background:#c9a227"></i>camera
      </div>
      <div class="stl-lanes"></div>
    `;
    this.injectCss();
    (host ?? document.body).appendChild(root);
    this.root = root;
    this.lanes = root.querySelector('.stl-lanes');
    this.readout = root.querySelector('[data-readout]');
    this.undoBtn = root.querySelector('[data-undo]');
    this.redoBtn = root.querySelector('[data-redo]');
    this.undoBtn?.addEventListener('click', () => this.undo());
    this.redoBtn?.addEventListener('click', () => this.redo());
    this.layout();
    this.paint();
    this.syncUndoButtons();
    window.addEventListener(STORY_FRAME_EVENT, this.onFrame);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    root.addEventListener(
      'wheel',
      (event) => {
        event.stopPropagation();
      },
      { capture: true, passive: true },
    );
  }

  setVisible(visible: boolean) {
    if (!this.root) return;
    this.root.style.display = visible ? 'flex' : 'none';
    if (visible) {
      this.layout();
      this.paint();
    }
  }

  layout() {
    if (!this.root) return;
    const studioLeft = TYPE_CHROME.studioCorner.endsWith('left');
    this.root.style.left = '16px';
    this.root.style.right = studioLeft ? '16px' : '168px';
  }

  destroy() {
    window.removeEventListener(STORY_FRAME_EVENT, this.onFrame);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    this.root?.remove();
    this.root = null;
    this.lanes = null;
    this.needle = null;
    this.readout = null;
  }

  private needleLeft(t: number): string {
    return `calc(${LABEL_W}px + 8px + ${clamp01(t)} * (100% - ${LABEL_W}px - 8px))`;
  }

  private setPlayhead(t: number) {
    this.playhead = clamp01(t);
    if (this.needle) this.needle.style.left = this.needleLeft(this.playhead);
    if (this.readout) this.readout.textContent = `t ${this.playhead.toFixed(2)}`;
  }

  private tFromEvent(event: PointerEvent, lane: HTMLElement): number {
    const rect = lane.getBoundingClientRect();
    return clamp01((event.clientX - rect.left) / Math.max(1, rect.width));
  }

  private capture(): TimingSnapshot {
    return {
      stops: SCENE_CONFIG.stops.map((stop) => stop.progress),
      steps: FLOW_CONFIG.map((step) => [step.progressRange[0], step.progressRange[1]]),
      clients: STORY_CONFIG.clients.map((client) => ({
        appear: client.appear,
        dispatch: client.dispatch,
        arrive: client.arrive,
      })),
      captions: STORY_CONFIG.captions.map((caption) => [caption.range[0], caption.range[1]]),
      chipHoldAfterArrive: STORY_CONFIG.chipHoldAfterArrive,
    };
  }

  private applySnapshot(snapshot: TimingSnapshot) {
    snapshot.stops.forEach((progress, index) => {
      if (SCENE_CONFIG.stops[index]) SCENE_CONFIG.stops[index].progress = progress;
    });
    snapshot.steps.forEach((range, index) => {
      if (FLOW_CONFIG[index]) FLOW_CONFIG[index].progressRange = [range[0], range[1]];
    });
    snapshot.clients.forEach((times, index) => {
      const client = STORY_CONFIG.clients[index];
      if (!client) return;
      client.appear = times.appear;
      client.dispatch = times.dispatch;
      client.arrive = times.arrive;
    });
    snapshot.captions.forEach((range, index) => {
      if (STORY_CONFIG.captions[index]) STORY_CONFIG.captions[index].range = [range[0], range[1]];
    });
    STORY_CONFIG.chipHoldAfterArrive = snapshot.chipHoldAfterArrive;
    this.paint();
  }

  private undo() {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(this.capture());
    this.applySnapshot(prev);
    this.syncUndoButtons();
  }

  private redo() {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(this.capture());
    this.applySnapshot(next);
    this.syncUndoButtons();
  }

  private syncUndoButtons() {
    if (this.undoBtn) this.undoBtn.disabled = this.undoStack.length === 0;
    if (this.redoBtn) this.redoBtn.disabled = this.redoStack.length === 0;
  }

  private startDrag(kind: DragKind, index: number, lane: HTMLElement, event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (kind !== 'playhead') this.dragSnapshot = this.capture();
    this.dragging = { kind, index, lane };
    this.handleMove(event);
  }

  private handleMove(event: PointerEvent) {
    if (!this.dragging) return;
    const t = this.tFromEvent(event, this.dragging.lane);
    const { kind, index } = this.dragging;

    if (kind === 'playhead') {
      this.setPlayhead(t);
      this.onSeek(t);
      return;
    }

    if (kind === 'cam') {
      const prev = index > 0 ? SCENE_CONFIG.stops[index - 1].progress : 0;
      const next = index < SCENE_CONFIG.stops.length - 1 ? SCENE_CONFIG.stops[index + 1].progress : 1;
      SCENE_CONFIG.stops[index].progress = clampOrdered(t, prev, next);
      this.setPlayhead(SCENE_CONFIG.stops[index].progress);
      this.onSeek(SCENE_CONFIG.stops[index].progress);
      this.paint();
      return;
    }

    if (kind === 'step-start' || kind === 'step-end') {
      const step = FLOW_CONFIG[index];
      if (!step) return;
      if (kind === 'step-start') {
        const prevStart = index > 0 ? FLOW_CONFIG[index - 1].progressRange[0] + MIN_SPAN : 0;
        const next = clampOrdered(t, prevStart, step.progressRange[1] - MIN_SPAN);
        step.progressRange[0] = next;
        if (index > 0) FLOW_CONFIG[index - 1].progressRange[1] = next;
      } else {
        const nextLimit = index < FLOW_CONFIG.length - 1 ? FLOW_CONFIG[index + 1].progressRange[1] - MIN_SPAN : 1;
        const next = clampOrdered(t, step.progressRange[0] + MIN_SPAN, nextLimit);
        step.progressRange[1] = next;
        if (index < FLOW_CONFIG.length - 1) FLOW_CONFIG[index + 1].progressRange[0] = next;
      }
      this.setPlayhead(t);
      this.onSeek(t);
      this.paint();
      return;
    }

    if (kind === 'need' || kind === 'launch' || kind === 'arrive') {
      const client = STORY_CONFIG.clients[index];
      if (!client) return;
      if (kind === 'need') {
        client.appear = clampOrdered(t, 0, client.arrive - MIN_FLIGHT);
        if (client.dispatch < client.appear) client.dispatch = client.appear;
      } else if (kind === 'launch') {
        client.dispatch = clampOrdered(t, client.appear, client.arrive - MIN_FLIGHT);
      } else {
        client.arrive = clampOrdered(t, client.dispatch + MIN_FLIGHT, 1);
      }
      this.setPlayhead(t);
      this.onSeek(t);
      this.paint();
      return;
    }

    const caption = STORY_CONFIG.captions[index];
    if (!caption) return;
    if (kind === 'cap-start') {
      caption.range[0] = clampOrdered(t, 0, caption.range[1] - MIN_SPAN);
    } else {
      caption.range[1] = clampOrdered(t, caption.range[0] + MIN_SPAN, 1.01);
    }
    this.setPlayhead(t);
    this.onSeek(t);
    this.paint();
  }

  private paint() {
    if (!this.lanes) return;
    this.lanes.innerHTML = '';

    const ruler = this.makeTrack('Time');
    const rulerLane = ruler.querySelector('.stl-lane') as HTMLDivElement;
    ;[0, 0.25, 0.5, 0.75, 1].forEach((mark) => {
      const tick = document.createElement('span');
      tick.className = 'stl-tick';
      tick.style.left = pct(mark);
      tick.textContent = mark.toFixed(2);
      rulerLane.appendChild(tick);
    });
    this.bindSeek(rulerLane);
    this.lanes.appendChild(ruler);

    const cam = this.makeTrack('Camera');
    const camLane = cam.querySelector('.stl-lane') as HTMLDivElement;
    SCENE_CONFIG.stops.forEach((stop, index) => {
      const mark = document.createElement('button');
      mark.type = 'button';
      mark.className = 'stl-cam';
      mark.style.left = pct(stop.progress);
      mark.title = `${stop.id} @ ${stop.progress.toFixed(2)}`;
      mark.textContent = String(index + 1);
      mark.addEventListener('pointerdown', (event) => this.startDrag('cam', index, camLane, event));
      camLane.appendChild(mark);
    });
    this.bindSeek(camLane);
    this.lanes.appendChild(cam);

    const page = this.makeTrack('Page steps');
    const pageLane = page.querySelector('.stl-lane') as HTMLDivElement;
    FLOW_CONFIG.forEach((step, index) => {
      pageLane.appendChild(
        this.makeClip({
          left: step.progressRange[0],
          right: step.progressRange[1],
          label: step.num,
          color: '#7a5cff',
          title: `${step.num} ${step.title}`,
          lane: pageLane,
          onStart: (event) => this.startDrag('step-start', index, pageLane, event),
          onEnd: (event) => this.startDrag('step-end', index, pageLane, event),
        }),
      );
    });
    this.bindSeek(pageLane);
    this.lanes.appendChild(page);

    STORY_CONFIG.clients.forEach((client, index) => {
      const row = this.makeTrack(client.building.replace(' Building', ''));
      const lane = row.querySelector('.stl-lane') as HTMLDivElement;
      const holdEnd = Math.min(1, client.arrive + (STORY_CONFIG.chipHoldAfterArrive || 0));
      lane.appendChild(
        this.makeClip({
          left: client.appear,
          right: client.dispatch,
          label: 'red',
          color: '#6f0000',
          title: `${client.building} turns red`,
          lane,
          onStart: (event) => this.startDrag('need', index, lane, event),
          onEnd: (event) => this.startDrag('launch', index, lane, event),
        }),
      );
      lane.appendChild(
        this.makeClip({
          left: client.dispatch,
          right: client.arrive,
          label: 'logo',
          color: '#1c6bff',
          title: `${client.building} logo flight`,
          lane,
          onStart: (event) => this.startDrag('launch', index, lane, event),
          onEnd: (event) => this.startDrag('arrive', index, lane, event),
        }),
      );
      if (holdEnd > client.arrive + 0.005) {
        lane.appendChild(
          this.makeClip({
            left: client.arrive,
            right: holdEnd,
            label: 'hold',
            color: '#2f9e6b',
            title: `${client.building} chip hold`,
            lane,
          }),
        );
      }
      this.bindSeek(lane);
      this.lanes!.appendChild(row);
    });

    const caps = this.makeTrack('Captions');
    const capLane = caps.querySelector('.stl-lane') as HTMLDivElement;
    STORY_CONFIG.captions.forEach((caption, index) => {
      capLane.appendChild(
        this.makeClip({
          left: caption.range[0],
          right: Math.min(1, caption.range[1]),
          label: caption.text,
          color: '#b07020',
          title: caption.text,
          lane: capLane,
          onStart: (event) => this.startDrag('cap-start', index, capLane, event),
          onEnd: (event) => this.startDrag('cap-end', index, capLane, event),
        }),
      );
    });
    this.bindSeek(capLane);
    this.lanes.appendChild(caps);

    const needle = document.createElement('div');
    needle.className = 'stl-needle';
    needle.style.left = this.needleLeft(this.playhead);
    this.lanes.appendChild(needle);
    this.needle = needle;
    if (this.readout) this.readout.textContent = `t ${this.playhead.toFixed(2)}`;
  }

  private bindSeek(lane: HTMLElement) {
    lane.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement).closest('.stl-clip, .stl-cam, .stl-handle')) return;
      this.startDrag('playhead', -1, lane, event);
    });
  }

  private makeTrack(label: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'stl-track';
    row.innerHTML = `<div class="stl-label">${label}</div><div class="stl-lane"></div>`;
    return row;
  }

  private makeClip(input: {
    left: number;
    right: number;
    label: string;
    color: string;
    title: string;
    lane: HTMLElement;
    onStart?: (event: PointerEvent) => void;
    onEnd?: (event: PointerEvent) => void;
  }): HTMLDivElement {
    const clip = document.createElement('div');
    clip.className = 'stl-clip';
    clip.title = input.title;
    clip.style.left = pct(input.left);
    clip.style.width = pct(Math.max(0, input.right - input.left));
    clip.style.background = input.color;
    clip.textContent = input.label;
    if (input.onStart) {
      const handle = document.createElement('span');
      handle.className = 'stl-handle stl-handle-start';
      handle.addEventListener('pointerdown', (event) => input.onStart?.(event));
      clip.appendChild(handle);
    }
    if (input.onEnd) {
      const handle = document.createElement('span');
      handle.className = 'stl-handle stl-handle-end';
      handle.addEventListener('pointerdown', (event) => input.onEnd?.(event));
      clip.appendChild(handle);
    }
    clip.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement).classList.contains('stl-handle')) return;
      this.startDrag('playhead', -1, input.lane, event);
    });
    return clip;
  }

  private injectCss() {
    if (document.getElementById('rastaak-story-timeline-css')) return;
    const style = document.createElement('style');
    style.id = 'rastaak-story-timeline-css';
    style.textContent = `
      #rastaak-story-timeline {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 16px;
        top: auto;
        height: min(268px, 34vh);
        width: auto;
        z-index: 999998;
        display: none;
        flex-direction: column;
        gap: 8px;
        padding: 10px 12px 12px;
        border-radius: 14px;
        background: rgba(12, 13, 18, 0.92);
        color: #f3f3f0;
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 16px 40px rgba(0,0,0,0.28);
        backdrop-filter: blur(14px);
        pointer-events: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      #rastaak-story-timeline .stl-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      #rastaak-story-timeline .stl-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #rastaak-story-timeline .stl-actions button {
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(255,255,255,0.08);
        color: #f3f3f0;
        border-radius: 999px;
        padding: 3px 10px;
        font: inherit;
        font-size: 10px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: pointer;
      }
      #rastaak-story-timeline .stl-actions button:disabled {
        opacity: 0.35;
        cursor: default;
      }
      #rastaak-story-timeline .stl-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 10px;
        font-size: 10px;
        opacity: 0.8;
      }
      #rastaak-story-timeline .stl-swatch {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        margin-right: 4px;
      }
      #rastaak-story-timeline .stl-lanes {
        position: relative;
        flex: 1;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      #rastaak-story-timeline .stl-track {
        display: grid;
        grid-template-columns: ${LABEL_W}px 1fr;
        gap: 8px;
        align-items: center;
        min-height: 28px;
      }
      #rastaak-story-timeline .stl-label {
        font-size: 10px;
        opacity: 0.78;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #rastaak-story-timeline .stl-lane {
        position: relative;
        height: 22px;
        border-radius: 6px;
        background: rgba(255,255,255,0.06);
        overflow: hidden;
      }
      #rastaak-story-timeline .stl-clip {
        position: absolute;
        top: 3px;
        bottom: 3px;
        border-radius: 4px;
        color: #fff;
        font-size: 9px;
        line-height: 16px;
        padding: 0 8px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        user-select: none;
      }
      #rastaak-story-timeline .stl-handle {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 8px;
        cursor: ew-resize;
      }
      #rastaak-story-timeline .stl-handle-start { left: 0; }
      #rastaak-story-timeline .stl-handle-end { right: 0; }
      #rastaak-story-timeline .stl-cam {
        position: absolute;
        top: 2px;
        width: 16px;
        height: 16px;
        margin-left: -8px;
        border: 0;
        border-radius: 3px;
        background: #c9a227;
        color: #1a1404;
        font-size: 9px;
        font-weight: 700;
        cursor: grab;
      }
      #rastaak-story-timeline .stl-tick {
        position: absolute;
        top: 4px;
        transform: translateX(-50%);
        font-size: 9px;
        opacity: 0.55;
      }
      #rastaak-story-timeline .stl-needle {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: #ff4d4d;
        pointer-events: none;
        z-index: 4;
      }
      #rastaak-story-timeline[data-docked='true'] {
        position: relative;
        left: auto;
        right: auto;
        bottom: auto;
        top: auto;
        width: 100%;
        height: 100%;
        max-height: none;
        z-index: 1;
        border-radius: 18px;
      }
    `;
    document.head.appendChild(style);
  }
}
