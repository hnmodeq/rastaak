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
  titleBg?: number;
  titleBgOpacity?: number;
  numberColor: number;
  numberActiveColor: number;
  numberBg: number;
  descriptionColor: number;
  descriptionBg?: number;
  descriptionBgOpacity?: number;
  trackColor: number;
  trackFillColor: number;
}

export const FLOW_CONFIG: FlowStepConfig[] = [
  {
    num: "01",
    title: "راهکار متناسب با نیاز سازمان",
    subtitle: "",
    caption: "ما به‌جای ارائه یک محصول ثابت، زیرساختی متناسب با حجم داده، نوع کاربری و نیاز عملیاتی هر سازمان پیشنهاد می‌دهیم؛ تا سرمایه‌گذاری شما دقیق، بهینه و آینده‌نگر باشد.",
    progressRange: [0, 0.104637]
  },
  {
    num: "02",
    title: "امنیت و حفاظت از داده‌ها",
    subtitle: "",
    caption: "داده‌های حیاتی سازمان نیازمند زیرساختی فراتر از یک فضای ذخیره‌سازی هستند. راهکارهای ما با تمرکز بر امنیت، پشتیبان‌گیری و جلوگیری از از دست رفتن اطلاعات طراحی می‌شوند.",
    progressRange: [0.104637, 0.19606]
  },
  {
    num: "03",
    title: "عملکرد و پایداری بالا",
    subtitle: "",
    caption: "زیرساخت سازمان نباید نقطه توقف کسب‌وکار باشد. تجهیزات و راهکارهای ما برای ارائه عملکرد پایدار، دسترس‌پذیری بالا و پاسخ‌گویی به بارهای کاری سنگین انتخاب و پیاده‌سازی می‌شوند.",
    progressRange: [0.19606, 0.82]
  },
  {
    num: "04",
    title: "تخصص و مشاوره فنی",
    subtitle: "",
    caption: "انتخاب Storage یا Server مناسب، صرفاً مقایسه مشخصات سخت‌افزاری نیست. تیم متخصص ما با شناخت نیاز واقعی سازمان، در انتخاب، طراحی و پیاده‌سازی بهترین راهکار همراه شماست.",
    progressRange: [0.82, 1]
  }
];

export const FLOW_CHROME: FlowChromeConfig = {
  align: "right",
  dir: "rtl",
  titleColor: 0xffffff,
  titleBg: 0x0c0d12,
  titleBgOpacity: 0,
  numberColor: 0xffffff,
  numberActiveColor: 0x3b3b3b,
  numberBg: 0xffffff,
  descriptionColor: 0x648eff,
  descriptionBg: 0x0c0d12,
  descriptionBgOpacity: 0,
  trackColor: 0xcecece,
  trackFillColor: 0x353aff
};

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

function hexToRgba(value: number, alpha: number): string {
  const hex = value >>> 0;
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  const a = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
}

export function applyFlowChrome() {
  if (typeof document === 'undefined') return;
  const flow = document.querySelector<HTMLElement>('.flow');
  if (!flow) return;
  flow.dataset.align = FLOW_CHROME.aligROME.align;
  flow.dataset.dir = FLOW_CHROME.dir;
  flow.removeAttribute('dir');
  flow.style.setProperty('--flow-title', hexCss(FLOW_CHROME.titleColor));
  flow.style.setProperty('--flow-number', hexCss(FLOW_CHROME.numberColor));
  flow.style.setProperty('--flow-number-active', hexCss(FLOW_CHROME.numberActiveColor));
  flow.style.setProperty('--flow-number-bg', hexCss(FLOW_CHROME.numberBg));
  flow.style.setProperty('--flow-description', hexCss(FLOW_CHROME.descriptionColor));
  flow.style.setProperty('--flow-track', hexCss(FLOW_CHROME.trackColor));
  flow.style.setProperty('--flow-track-fill', hexCss(FLOW_CHROME.trackFillColor));
  const titleBgA = FLOW_CHROME.titleBgOpacity ?? 0;
  const descBgA = FLOW_CHROME.descriptionBgOpacity ?? 0;
  flow.style.setProperty('--flow-title-bg', hexToRgba(FLOW_CHROME.titleBg ?? 0x0c0d12, titleBgA));
  flow.style.setProperty('--flow-description-bg', hexToRgba(FLOW_CHROME.descriptionBg ?? 0x0c0d12, descBgA));
  flow.style.setProperty('--flow-title-pad', titleBgA > 0.01 ? '6px 12px' : '0px');
  flow.style.setProperty('--flow-description-pad', descBgA > 0.01 ? '8px 12px' : '0px');
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
      const kicker = description.querySelector<HTMLElement>('.flow__description-kicker');
      const copy = description.querySelector<HTMLElement>('.flow__description-copy');
      const br = description.querySelector<HTMLElement>('.flow__description-break');
      if (kicker) kicker.textContent = step.subtitle;
      if (copy) copy.textContent = step.caption;
      if (br) br.hidden = !step.subtitle;
    }
  });
  applyFlowChrome();
}
