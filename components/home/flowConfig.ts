/**
 * RASTAAK FLOW STEPS CONTROLLER CONFIG
 * Saved automatically from 3D Studio
 */

export interface FlowStepConfig {
  num: string;
  title: string;
  subtitle: string;
  caption: string;
  progressRange: [number, number];
}

export interface FlowChromeConfig {
  align: 'left' | 'right';
  dir: 'ltr' | 'rtl';
  titleColor: number;
  numberColor: number;
  numberActiveColor: number;
  numberBg: number;
  descriptionColor: number;
  trackColor: number;
  trackFillColor: number;
}

export const FLOW_CONFIG: FlowStepConfig[] = [
  {
    num: "01",
    title: "Activation, simplified",
    subtitle: "One call triggers mobilization.",
    caption: "Your requirements: craft, count, and start date route directly to our verified crews. No hand-offs. No escalations. Just boots on the ground in minutes.",
    progressRange: [0, 0.22]
  },
  {
    num: "02",
    title: "Cleared to count",
    subtitle: "Our team handles all screening and verification before dispatch.",
    caption: "Compliance, background, certifications, and fitness-for-duty — we enforce a zero-fail model to guarantee every worker clears the gate on Day 1.",
    progressRange: [0.22, 0.55]
  },
  {
    num: "03",
    title: "Proven field match",
    subtitle: "We don't just provide available workers. We deploy proven crews.",
    caption: "By filtering for past performance, role fit, and reliability, we deliver teams engineered for endurance — ensuring your project stays fully manned from first break to completion.",
    progressRange: [0.55, 0.82]
  },
  {
    num: "04",
    title: "Seamless arrival",
    subtitle: "We manage the \"last mile\" of mobilization.",
    caption: "Every crew arrives site-ready with finalized reporting details. With real-time arrival monitoring and active coordination, we ensure your shift starts on time, even when field conditions shift.",
    progressRange: [0.82, 1]
  }
];

export const FLOW_CHROME: FlowChromeConfig = {
  align: "right",
  dir: "rtl",
  titleColor: 0xf5f5f2,
  numberColor: 0xf5f5f2,
  numberActiveColor: 0xffffff,
  numberBg: 0x2c2c2c,
  descriptionColor: 0xe8e8e4,
  trackColor: 0xffffff,
  trackFillColor: 0x585858
};

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

export function applyFlowChrome() {
  if (typeof document === 'undefined') return;
  const flow = document.querySelector<HTMLElement>('.flow');
  if (!flow) return;
  flow.dataset.align = FLOW_CHROME.align;
  flow.dataset.dir = FLOW_CHROME.dir;
  flow.removeAttribute('dir');
  flow.style.setProperty('--flow-title', hexCss(FLOW_CHROME.titleColor));
  flow.style.setProperty('--flow-number', hexCss(FLOW_CHROME.numberColor));
  flow.style.setProperty('--flow-number-active', hexCss(FLOW_CHROME.numberActiveColor));
  flow.style.setProperty('--flow-number-bg', hexCss(FLOW_CHROME.numberBg));
  flow.style.setProperty('--flow-description', hexCss(FLOW_CHROME.descriptionColor));
  flow.style.setProperty('--flow-track', hexCss(FLOW_CHROME.trackColor));
  flow.style.setProperty('--flow-track-fill', hexCss(FLOW_CHROME.trackFillColor));
}

export function syncFlowDom() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('.flow__step').forEach((el, index) => {
    const step = FLOW_CONFIG[index];
    if (!step) return;
    const title = el.querySelector('.flow__title');
    const description = el.querySelector('.flow__description');
    const number = el.querySelector('.flow__number span');
    if (number) number.textContent = step.num;
    if (title) title.textContent = step.title;
    if (description) {
      description.textContent = '';
      if (step.subtitle) {
        description.append(step.subtitle, document.createElement('br'));
      }
      description.append(step.caption);
    }
  });
  applyFlowChrome();
}
