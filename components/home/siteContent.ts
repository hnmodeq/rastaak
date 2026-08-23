/**
 * Homepage section copy and visibility.
 * Saved automatically from the admin panel.
 */

export type FeatureIconName = 'rapid' | 'selection' | 'verified' | 'outcomes';

export interface SiteFeatureItem {
  icon: FeatureIconName;
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
}

export interface SiteContentConfig {
  sections: {
    scene: boolean;
    features: boolean;
    standards: boolean;
    faq: boolean;
    cta: boolean;
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
  links: {
    industries: SiteLinkItem;
    mission: SiteLinkItem;
    apply: SiteLinkItem;
    request: SiteLinkItem;
  };
  footer: {
    copyright: string;
    privacy: string;
    terms: string;
  };
}

export const SITE_CONTENT: SiteContentConfig = {
  sections: {
    scene: true,
    features: true,
    standards: true,
    faq: true,
    cta: true,
    links: true,
    footer: true,
  },
  features: {
    titleLine1: "Designed for today's operations,",
    titleLine2: 'beyond legacy staffing workflows.',
    items: [
      {
        icon: 'rapid',
        title: 'Rapid Activation',
        description:
          'We believe speed is a skill. Our platform uses machine learning to turn staffing into instant logistics, deploying a precisely matched workforce the moment demand strikes.',
      },
      {
        icon: 'selection',
        title: 'Rigorous Selection',
        description:
          'Geography is a core metric. Our engine uses AI to find and contact qualified talent within defined radii, securing top local contractors first, filtered for cost and skill.',
      },
      {
        icon: 'verified',
        title: '100% Verified Before Arrival',
        description:
          'We use a Zero-Trust verification model with secure API integrations to run automated background checks and drug testing, blocking dispatch access until fully cleared.',
      },
      {
        icon: 'outcomes',
        title: 'Controlled Outcomes',
        description:
          "We guarantee controlled outcomes by managing staffing's biggest variables—cost and compliance—prioritizing local mobilization and automating safety for every dispatch.",
      },
    ],
  },
  standards: {
    titleLine1: 'Nuclear-grade ',
    titleLine2: 'standards across ',
    titleLine3: 'every site.',
    description:
      'Modeled on nuclear-grade environments, our process enforces badge compliance, protected timelines and zero-error tolerance.',
    cta: 'Explore our industries',
    href: '/industries',
  },
  faq: {
    title: 'How we work and how we deliver industrial-grade staffing.',
    items: [
      {
        question: 'How fast can crews be mobilized?',
        answer:
          'We move at the speed of your schedule. Our platform maintains a deep network of verified industrial craft, eliminating the weeks wasted in traditional hiring cycles. One call activates our mobilization engine to source and deploy precision-matched crews in hours, not days, ensuring your most critical paths remain fully manned.',
      },
      {
        question: 'How do you handle compliance & background checks?',
        answer:
          "We use a Zero-Fail Compliance model. Before a worker is even cleared for dispatch, our system automates the verification of background checks, drug testing (FFD), and site-specific certifications including nuclear grade requirements. We block access to the gate for anyone who isn't 100% cleared, ensuring your badging office has zero headaches on Day 1.",
      },
      {
        question: 'What is the coverage during outages?',
        answer:
          'We provide 24/7 active coordination to match the 24/7 nature of an outage. Our coverage spans the full range of outage craft: from general laborers and painters to specialized repairs and schedulers. More importantly, we manage the "last mile" of arrival, monitoring deployments in real-time to ensure your night and day shifts remain fully manned, even when field conditions shift.',
      },
      {
        question: 'How does Rastaak differ from traditional staffing vendors?',
        answer:
          "Traditional vendors are reactive; Rastaak is an operational engine. While legacy agencies rely on manual resumes and 'available' warm bodies, we use intelligent workflows and expert curation to deliver field-validated precision. We don't just find people who are looking for work; we deploy proven crews that are engineered for the high-tempo grind of a critical path environment.",
      },
    ],
  },
  cta: {
    titleLine1: 'Staff your outage with fast response, ',
    titleLine2: 'and crews you can rely on.',
    button: 'Request Crews',
    href: '/request-crew',
  },
  links: {
    industries: { label: 'Our Industries', href: '/industries' },
    mission: { label: 'Our Mission', href: '/our-mission' },
    apply: { label: 'Apply', href: '/apply' },
    request: { label: 'Request Crews', href: '/request-crew' },
  },
  footer: {
    copyright: 'All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
  },
};

function setText(selector: string, value: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (el.textContent !== value) el.textContent = value;
  });
}

export function applySiteContent(config: SiteContentConfig = SITE_CONTENT) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const on = config.sections;
  root.dataset.secScene = on.scene ? 'on' : 'off';
  root.dataset.secFeatures = on.features ? 'on' : 'off';
  root.dataset.secStandards = on.standards ? 'on' : 'off';
  root.dataset.secFaq = on.faq ? 'on' : 'off';
  root.dataset.secCta = on.cta ? 'on' : 'off';
  root.dataset.secLinks = on.links ? 'on' : 'off';
  root.dataset.secFooter = on.footer ? 'on' : 'off';

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

  const year = new Date().getFullYear();
  setText('[data-footer="copyright"]', `© ${year} ${config.footer.copyright}`);
  setText('[data-footer="privacy"]', config.footer.privacy);
  setText('[data-footer="terms"]', config.footer.terms);
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
