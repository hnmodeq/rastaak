/**
 * Homepage section copy and visibility.
 * Saved automatically from the admin panel.
 */

export type FeatureIconName = 'rapid' | 'selection' | 'verified' | 'outcomes';

export interface SiteFeatureItem {
  icon: FeatureIconName;
  /** Optional uploaded icon data URL; falls back to the selected built-in icon. */
  iconImage?: string;
  title: string;
  description: string;
}

export interface SiteFaqItem {
  question: string;
  answer: string;
}

export interface SiteLinkItem {
  label: string;
  href: string;
  /** Header visibility only; footer navigation can remain independently visible. */
  visible?: boolean;
  /** Physical desktop header side selected in Layout Control. */
  side?: 'left' | 'right';
}

export type LayoutDirection = 'ltr' | 'rtl';
export type LayoutAlign = 'start' | 'center' | 'end';

export interface SiteContentConfig {
  sections: {
    header: boolean;
    scene: boolean;
    features: boolean;
    standards: boolean;
    faq: boolean;
    cta: boolean;
    /** Legacy sub-toggle for link rows; retained for saved configurations. */
    links: boolean;
    footer: boolean;
  };
  features: {
    titleLine1: string;
    titleLine2: string;
    items: SiteFeatureItem[];
  };
  standards: {
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    description: string;
    cta: string;
    href: string;
    imageSrc?: string;
  };
  faq: {
    title: string;
    items: SiteFaqItem[];
  };
  cta: {
    titleLine1: string;
    titleLine2: string;
    button: string;
    href: string;
  };
  header: {
    sceneColor: number;
    layoutColor: number;
  };
  layout: {
    /** Legacy global default; individual section controls override it. */
    direction: LayoutDirection;
    headerDirection: LayoutDirection;
    featuresDirection: LayoutDirection;
    standardsDirection: LayoutDirection;
    faqDirection: LayoutDirection;
    ctaDirection: LayoutDirection;
    footerDirection: LayoutDirection;
    featuresAlign: LayoutAlign;
    featuresItemAlign: LayoutAlign;
    standardsAlign: LayoutAlign;
    faqAlign: LayoutAlign;
    faqItemAlign: LayoutAlign;
    faqAnswerAlign: LayoutAlign;
    ctaAlign: LayoutAlign;
    ctaButtonAlign: LayoutAlign;
    footerLogoAlign: LayoutAlign;
    footerMetaAlign: LayoutAlign;
    footerCreditAlign: LayoutAlign;
    footerLogoScale: number;
    footerBottomPadding: number;
  };
  links: {
    industries: SiteLinkItem;
    mission: SiteLinkItem;
    apply: SiteLinkItem;
    request: SiteLinkItem;
  };
  footer: {
    copyright: string;
    privacy: string;
    privacyHref?: string;
    terms: string;
    termsHref?: string;
    creditPrefix: string;
    creditName: string;
    creditHref?: string;
    creditColor: number;
    showLogo: boolean;
    showCopyright: boolean;
    showPrivacy: boolean;
    showTerms: boolean;
    showCredit: boolean;
  };
}

export const SITE_CONTENT: SiteContentConfig = {
  sections: {
    header: true,
    scene: true,
    features: true,
    standards: false,
    faq: true,
    cta: true,
    links: true,
    footer: true
  },
  features: {
    titleLine1: "چرا هونامیک رو برای سازمان‌تون انتخاب میکنید؟",
    titleLine2: "",
    items: [
      {
        icon: "rapid",
        title: "خدمات پس از فروش",
        description: "هونامیک ارتباط رستاک در از مشاوره تا نصب در کنار شما خواهد بود و در این مسیر با پشتیبانی فنی شما رو همراهی میکند."
      },
      {
        icon: "selection",
        title: "ارائه راه‌کارهای هوشمندانه و منحصر به فرد",
        description: "با توجه به پیشرفت در دنیای تکنولوژی هونامیک ارتباط رستاک با دانش فنی به روز خود مناسب‌ترین و به روزترین راه‌کار رو به شما پیشنهاد میکنه."
      },
      {
        icon: "verified",
        title: "گارانتی اصالت محصول",
        description: "هونامیک ارتباط رستاک تمامی خدمات و اصلات و سلامت محصولات خودش رو تا 24 ماه  ضمانت میکنه."
      },
      {
        icon: "outcomes",
        title: "مشاوره",
        description: "قبل از اینکه اقدام به هزینه و خرید کنید هونامیک ارتباط رستاک متناسب با احساس نیاز سازمان شما مشاوره تخصصی و فنی ارائه میکنه."
      },
      {
        icon: "rapid",
        title: "واردات  مستقل",
        description: "هونامیک ارتباط رستاک با تامین کالاهای زیرساختی از برندهای معتبر به افزایش کیفیت ذخیره‌ اطلاعات کشور سعی میکنه تا گامی رو  برداشته باشه."
      }
    ]
  },
  standards: {
    titleLine1: "Nuclear-grade ",
    titleLine2: "standards across ",
    titleLine3: "every site.",
    description: "Modeled on nuclear-grade environments, our process enforces badge compliance, protected timelines and zero-error tolerance.",
    cta: "Explore our industries",
    href: "/industries"
  },
  faq: {
    title: "هونامیک ارتباط رستاک چطور میتونه همراه سازمان شما باشه؟",
    items: [
      {
        question: "How fast can crews be mobilized?",
        answer: "We move at the speed of your schedule. Our platform maintains a deep network of verified industrial craft, eliminating the weeks wasted in traditional hiring cycles. One call activates our mobilization engine to source and deploy precision-matched crews in hours, not days, ensuring your most critical paths remain fully manned."
      },
      {
        question: "How do you handle compliance & background checks?",
        answer: "We use a Zero-Fail Compliance model. Before a worker is even cleared for dispatch, our system automates the verification of background checks, drug testing (FFD), and site-specific certifications including nuclear grade requirements. We block access to the gate for anyone who isn't 100% cleared, ensuring your badging office has zero headaches on Day 1."
      },
      {
        question: "What is the coverage during outages?",
        answer: "We provide 24/7 active coordination to match the 24/7 nature of an outage. Our coverage spans the full range of outage craft: from general laborers and painters to specialized repairs and schedulers. More importantly, we manage the \"last mile\" of arrival, monitoring deployments in real-time to ensure your night and day shifts remain fully manned, even when field conditions shift."
      },
      {
        question: "How does Rastaak differ from traditional staffing vendors?",
        answer: "Traditional vendors are reactive; Rastaak is an operational engine. While legacy agencies rely on manual resumes and 'available' warm bodies, we use intelligent workflows and expert curation to deliver field-validated precision. We don't just find people who are looking for work; we deploy proven crews that are engineered for the high-tempo grind of a critical path environment."
      }
    ]
  },
  cta: {
    titleLine1: "ذخیره‌سازی داده‌های خودتون رو به ما بسپرید.",
    titleLine2: "",
    button: "مشاوره سازمانی",
    href: "#"
  },
  header: {
    sceneColor: 14803425,
    layoutColor: 1710882
  },
  layout: {
    direction: "rtl",
    headerDirection: "rtl",
    featuresDirection: "rtl",
    standardsDirection: "rtl",
    faqDirection: "rtl",
    ctaDirection: "rtl",
    footerDirection: "rtl",
    featuresAlign: "start",
    featuresItemAlign: "start",
    standardsAlign: "end",
    faqAlign: "start",
    faqItemAlign: "start",
    faqAnswerAlign: "start",
    ctaAlign: "end",
    ctaButtonAlign: "end",
    footerLogoAlign: "end",
    footerMetaAlign: "end",
    footerCreditAlign: "end",
    footerLogoScale: 1,
    footerBottomPadding: 48
  },
  links: {
    industries: {
      label: "چرا هونامیک ارتباط رستاک؟",
      href: "#",
      visible: true,
      side: "left"
    },
    mission: {
      label: "مشاوره سازمانی",
      href: "#",
      visible: true,
      side: "left"
    },
    apply: {
      label: "مشاوره سازمانی",
      href: "#",
      visible: false,
      side: "left"
    },
    request: {
      label: "همکاری با ما",
      href: "#",
      visible: false,
      side: "left"
    }
  },
  footer: {
    copyright: "تمامی حقوق برای هونامیک محفوظ است.",
    privacy: "Privacy",
    privacyHref: "#",
    terms: "Terms",
    termsHref: "#",
    creditPrefix: "طراحی شده توسط",
    creditName: "بومیم",
    creditHref: "http://www.bumims.ir",
    creditColor: 16102145,
    showLogo: false,
    showCopyright: true,
    showPrivacy: false,
    showTerms: false,
    showCredit: true
  }
};

export const SITE_CONTENT_EVENT = 'rastaak-site-content-changed';

function hexCss(value: number): string {
  return '#' + (value >>> 0).toString(16).padStart(6, '0');
}

function setText(selector: string, value: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (el.textContent !== value) el.textContent = value;
  });
}

function setHref(selector: string, value: string) {
  document.querySelectorAll<HTMLAnchorElement>(selector).forEach((el) => {
    if (el.getAttribute('href') !== value) el.setAttribute('href', value);
  });
}

export function notifySiteContentChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SITE_CONTENT_EVENT));
}

export function applySiteContent(config: SiteContentConfig = SITE_CONTENT) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const on = config.sections;
  root.dataset.secHeader = on.header !== false ? 'on' : 'off';
  root.dataset.secScene = on.scene ? 'on' : 'off';
  root.dataset.secFeatures = on.features ? 'on' : 'off';
  root.dataset.secStandards = on.standards ? 'on' : 'off';
  root.dataset.secFaq = on.faq ? 'on' : 'off';
  root.dataset.secCta = on.cta ? 'on' : 'off';
  root.dataset.secLinks = on.links ? 'on' : 'off';
  root.dataset.secFooter = on.footer ? 'on' : 'off';
  const layout = config.layout;
  const fallbackDirection = layout.direction ?? 'rtl';
  root.dataset.layoutDir = fallbackDirection;
  root.dataset.dirHeader = layout.headerDirection ?? fallbackDirection;
  root.dataset.dirFeatures = layout.featuresDirection ?? fallbackDirection;
  root.dataset.dirStandards = layout.standardsDirection ?? fallbackDirection;
  root.dataset.dirFaq = layout.faqDirection ?? fallbackDirection;
  root.dataset.dirCta = layout.ctaDirection ?? fallbackDirection;
  root.dataset.dirFooter = layout.footerDirection ?? fallbackDirection;
  root.style.setProperty('--features-align', layout.featuresAlign ?? 'end');
  root.style.setProperty('--features-item-align', layout.featuresItemAlign ?? layout.featuresAlign ?? 'end');
  root.style.setProperty('--standards-align', layout.standardsAlign ?? 'end');
  root.style.setProperty('--faq-align', layout.faqAlign ?? 'end');
  root.style.setProperty('--faq-item-align', layout.faqItemAlign ?? layout.faqAlign ?? 'end');
  root.style.setProperty('--faq-answer-align', layout.faqAnswerAlign ?? layout.faqAlign ?? 'end');
  root.style.setProperty('--cta-align', layout.ctaAlign ?? 'end');
  root.style.setProperty('--cta-button-align', layout.ctaButtonAlign ?? layout.ctaAlign ?? 'end');
  root.style.setProperty('--header-scene-color', hexCss(config.header.sceneColor));
  root.style.setProperty('--header-layout-color', hexCss(config.header.layoutColor));
  root.dataset.headerIndustries = config.links.industries.visible !== false ? 'on' : 'off';
  root.dataset.headerMission = config.links.mission.visible !== false ? 'on' : 'off';
  root.dataset.headerApply = config.links.apply.visible !== false ? 'on' : 'off';
  root.dataset.headerRequest = config.links.request.visible !== false ? 'on' : 'off';
  root.dataset.footerLogo = config.footer.showLogo !== false ? 'on' : 'off';
  root.dataset.footerCopyright = config.footer.showCopyright !== false ? 'on' : 'off';
  root.dataset.footerPrivacy = config.footer.showPrivacy !== false ? 'on' : 'off';
  root.dataset.footerTerms = config.footer.showTerms !== false ? 'on' : 'off';
  root.dataset.footerCredit = config.footer.showCredit !== false ? 'on' : 'off';
  root.style.setProperty('--footer-logo-align', layout.footerLogoAlign ?? 'end');
  root.style.setProperty('--footer-meta-align', layout.footerMetaAlign ?? 'end');
  root.style.setProperty('--footer-credit-align', layout.footerCreditAlign ?? layout.footerMetaAlign ?? 'end');
  root.style.setProperty('--footer-logo-scale', String(Math.max(0.4, Math.min(2.5, layout.footerLogoScale ?? 1))));
  root.style.setProperty('--footer-bottom-padding', `${Math.max(16, Math.min(160, layout.footerBottomPadding ?? 48))}px`);
  root.style.setProperty('--footer-credit-color', hexCss(config.footer.creditColor ?? 0xf5b301));

  setText('[data-features-title="1"]', config.features.titleLine1);
  setText('[data-features-title="2"]', config.features.titleLine2);
  document.querySelectorAll<HTMLElement>('.feature-item').forEach((item, index) => {
    const row = config.features.items[index];
    if (!row) return;
    const name = item.querySelector('.feature-item__title');
    const desc = item.querySelector('.feature-item__description');
    if (name) name.textContent = row.title;
    if (desc) desc.textContent = row.description;
  });

  const stdTitle = document.querySelectorAll('.standards__title span');
  if (stdTitle[0]) stdTitle[0].textContent = config.standards.titleLine1;
  if (stdTitle[1]) stdTitle[1].textContent = config.standards.titleLine2;
  if (stdTitle[2]) stdTitle[2].textContent = config.standards.titleLine3;
  setText('.standards__description', config.standards.description);
  const stdCta = document.querySelector<HTMLAnchorElement>('.standards .pill-btn-span');
  if (stdCta) stdCta.textContent = config.standards.cta;
  const stdLink = document.querySelector<HTMLAnchorElement>('.standards a.pill-btn');
  if (stdLink) stdLink.href = config.standards.href;

  setText('.faq__title', config.faq.title);
  document.querySelectorAll<HTMLElement>('.faq-item').forEach((item, index) => {
    const row = config.faq.items[index];
    if (!row) return;
    const q = item.querySelector('.faq-item__question');
    const a = item.querySelector('.faq-item__answer');
    if (q) q.textContent = row.question;
    if (a) a.textContent = row.answer;
  });

  const ctaSpans = document.querySelectorAll('.cta-section__title span');
  if (ctaSpans[0]) ctaSpans[0].textContent = config.cta.titleLine1;
  if (ctaSpans[1]) ctaSpans[1].textContent = config.cta.titleLine2;
  const ctaBtn = document.querySelector<HTMLElement>('.cta-section .pill-btn-span');
  if (ctaBtn) ctaBtn.textContent = config.cta.button;
  const ctaLink = document.querySelector<HTMLAnchorElement>('.cta-section a.pill-btn');
  if (ctaLink) ctaLink.href = config.cta.href;

  setText('[data-link="industries"]', config.links.industries.label);
  setText('[data-link="mission"]', config.links.mission.label);
  setText('[data-link="apply"]', config.links.apply.label);
  setText('[data-link="request"]', config.links.request.label);
  setHref('[data-link="industries"]', config.links.industries.href);
  setHref('[data-link="mission"]', config.links.mission.href);
  setHref('[data-link="apply"]', config.links.apply.href);
  setHref('[data-link="request"]', config.links.request.href);

  const year = new Date().getFullYear();
  setText('[data-footer="copyright"]', `© ${year} ${config.footer.copyright}`);
  setText('[data-footer="privacy"]', config.footer.privacy);
  setText('[data-footer="terms"]', config.footer.terms);
  setText('[data-footer="credit-prefix"]', config.footer.creditPrefix ?? 'طراحی شده توسط');
  setText('[data-footer="credit-name"]', config.footer.creditName ?? 'بومیم');
  setHref('[data-footer="credit-name"]', config.footer.creditHref ?? 'http://www.bumims.ir');
  setHref('[data-footer="privacy"]', config.footer.privacyHref ?? '/privacy');
  setHref('[data-footer="terms"]', config.footer.termsHref ?? '/terms');
}

export function mergeSiteContent(raw: unknown): SiteContentConfig {
  const next = structuredClone(SITE_CONTENT);
  if (!raw || typeof raw !== 'object') return next;
  const value = raw as Partial<SiteContentConfig>;
  if (value.sections) next.sections = { ...next.sections, ...value.sections };
  if (value.features) {
    next.features = {
      ...next.features,
      ...value.features,
      items: Array.isArray(value.features.items) ? value.features.items.map((item, index) => ({
        ...next.features.items[index],
        ...item,
      })) : next.features.items,
    };
  }
  if (value.standards) next.standards = { ...next.standards, ...value.standards };
  if (value.faq) {
    next.faq = {
      ...next.faq,
      ...value.faq,
      items: Array.isArray(value.faq.items) ? value.faq.items.map((item, index) => ({
        ...next.faq.items[index],
        ...item,
      })) : next.faq.items,
    };
  }
  if (value.cta) next.cta = { ...next.cta, ...value.cta };
  if (value.header) next.header = { ...next.header, ...value.header };
  if (value.layout) next.layout = { ...next.layout, ...value.layout };
  if (value.links) {
    next.links = {
      industries: { ...next.links.industries, ...value.links.industries },
      mission: { ...next.links.mission, ...value.links.mission },
      apply: { ...next.links.apply, ...value.links.apply },
      request: { ...next.links.request, ...value.links.request },
    };
  }
  if (value.footer) next.footer = { ...next.footer, ...value.footer };
  return next;
}
