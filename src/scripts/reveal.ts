import { $$ } from './util';

export function initReveal() {
  const els = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}
