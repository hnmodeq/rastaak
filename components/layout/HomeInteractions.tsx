'use client';

import { useEffect } from 'react';
import { FLOW_CONFIG } from '@/components/home/flowConfig';

/**
 * Homepage interactions that used to live in the Astro/Three vendor bundle.
 * Keeping that bundle off `/` avoids a second Three.js instance and the
 * 12s legacy loader timeout.
 */
export function HomeInteractions() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('preload', 'lenis-stopped');
    document.body.style.overflow = '';
    document.getElementById('loader')?.setAttribute('hidden', '');
    document.querySelector('header')?.classList.add('show');

    const root = document.querySelector('main[data-taxi] [data-taxi-view]') ?? document;
    root.querySelectorAll('.hero').forEach((el) => el.classList.add('show'));

    const faqHeaders = Array.from(document.querySelectorAll<HTMLElement>('.faq-item__header'));
    const onFaqClick = (event: Event) => {
      const item = (event.currentTarget as HTMLElement).closest('.faq-item');
      if (!item) return;
      const content = item.querySelector<HTMLElement>('.faq-item__content');
      const isOpen = item.classList.contains('faq-item--open');
      document.querySelectorAll('.faq-item--open').forEach((openItem) => {
        if (openItem === item) return;
        const openContent = openItem.querySelector<HTMLElement>('.faq-item__content');
        if (openContent) openContent.style.maxHeight = '0px';
        openItem.classList.remove('faq-item--open');
        openItem.querySelector('.faq-item__header')?.setAttribute('aria-expanded', 'false');
      });
      if (isOpen) {
        if (content) content.style.maxHeight = '0px';
        item.classList.remove('faq-item--open');
        item.querySelector('.faq-item__header')?.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('faq-item--open');
        item.querySelector('.faq-item__header')?.setAttribute('aria-expanded', 'true');
        if (content) content.style.maxHeight = `${content.scrollHeight}px`;
      }
    };
    faqHeaders.forEach((header) => header.addEventListener('click', onFaqClick));
    document.querySelectorAll('.faq-item--open .faq-item__content').forEach((content) => {
      (content as HTMLElement).style.maxHeight = `${content.scrollHeight}px`;
    });

    const flow = document.querySelector<HTMLElement>('.flow');
    const flowWrapper = flow?.querySelector<HTMLElement>('.flow__wrapper');
    const steps = Array.from(document.querySelectorAll<HTMLElement>('.flow__step'));
    const hero = document.querySelector<HTMLElement>('.hero');

    const updateScrollUi = () => {
      if (hero) {
        hero.classList.toggle('hide', window.scrollY > window.innerHeight * 0.15);
      }

      if (flow && flowWrapper && steps.length) {
        const travel = Math.max(flow.offsetHeight - flowWrapper.offsetHeight, 1);
        const start = flow.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.15;
        const progress = Math.max(0, Math.min(1, (window.scrollY - start) / travel));
        steps.forEach((step, index) => {
          const range = FLOW_CONFIG[index]?.progressRange ?? [index / steps.length, (index + 1) / steps.length];
          const active = progress >= range[0] && (index === steps.length - 1 || progress < range[1]);
          step.classList.toggle('flow__step--active', active);
          const fill = step.querySelector<HTMLElement>('.flow__track-fill');
          if (fill) {
            const span = Math.max(range[1] - range[0], 0.0001);
            const local = Math.max(0, Math.min(1, (progress - range[0]) / span));
            fill.style.transform = `scaleY(${local})`;
          }
        });
      }

      const header = document.querySelector('header');
      const darkSections = [document.querySelector('.cta-section'), document.querySelector('.footer')].filter(
        Boolean,
      ) as HTMLElement[];
      if (header) {
        const headerHeight = header.offsetHeight;
        const overDark = darkSections.some((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top < headerHeight && rect.bottom > 0;
        });
        header.classList.toggle('header--white', overDark);
      }
    };

    updateScrollUi();
    window.addEventListener('scroll', updateScrollUi, { passive: true });
    window.addEventListener('resize', updateScrollUi);

    const menuBtn = document.querySelector<HTMLButtonElement>('.menu-btn');
    const mobileNav = document.querySelector<HTMLElement>('.mobile-nav');
    const overlay = document.querySelector<HTMLElement>('.mobile-nav__overlay');
    const closeBtn = document.querySelector<HTMLButtonElement>('.mobile-nav__close');

    const closeMenu = () => {
      menuBtn?.setAttribute('aria-expanded', 'false');
      mobileNav?.classList.remove('is-open');
      overlay?.classList.remove('show');
      document.querySelector('header')?.classList.remove('menu-open');
      document.body.style.overflow = '';
    };
    const openMenu = () => {
      menuBtn?.setAttribute('aria-expanded', 'true');
      mobileNav?.classList.add('is-open');
      overlay?.classList.add('show');
      document.querySelector('header')?.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
    };
    const toggleMenu = () => {
      if (mobileNav?.classList.contains('is-open')) closeMenu();
      else openMenu();
    };

    menuBtn?.addEventListener('click', toggleMenu);
    overlay?.addEventListener('click', closeMenu);
    closeBtn?.addEventListener('click', closeMenu);
    mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    const footerBottom = document.querySelector('.footer__bottom');
    const footerObserver = footerBottom
      ? new IntersectionObserver(
          ([entry]) => footerBottom.classList.toggle('is-visible', entry.isIntersecting),
          { threshold: 0.2 },
        )
      : null;
    if (footerBottom && footerObserver) footerObserver.observe(footerBottom);

    return () => {
      faqHeaders.forEach((header) => header.removeEventListener('click', onFaqClick));
      window.removeEventListener('scroll', updateScrollUi);
      window.removeEventListener('resize', updateScrollUi);
      menuBtn?.removeEventListener('click', toggleMenu);
      overlay?.removeEventListener('click', closeMenu);
      closeBtn?.removeEventListener('click', closeMenu);
      footerObserver?.disconnect();
    };
  }, []);

  return null;
}
