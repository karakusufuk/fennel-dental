import { reducedMotion } from './util';

/**
 * Ağır (yumuşatılmış) fare tekerleği kaydırması.
 * Sadece fare + masaüstü; dokunmatik, klavye ve reduced-motion yerel kalır.
 *  - AGIRLIK: 0–1, küçüldükçe kaydırma daha ağır/yavaş oturur (0.2 ≈ hafif, 0.07 ≈ çok ağır)
 *  - ADIM: tekerlek hareketinin çarpanı
 */
const AGIRLIK = 0.12;
const ADIM = 0.75;

let ctl: { go: (y: number) => Promise<void> } | null = null;

/** Programatik kaydırma: ağır kaydırma açıksa onunla, değilse yerel yumuşak; reduced-motion'da anında. */
export function scrollToY(y: number): Promise<void> {
  const max = document.documentElement.scrollHeight - innerHeight;
  y = Math.max(0, Math.min(max, y));
  if (reducedMotion()) { window.scrollTo(0, y); return Promise.resolve(); }
  if (ctl) return ctl.go(y);
  // Dokunmatik: kendi rAF geçişimiz (yerel smooth'a güvenme; süre ve bitiş belli olsun)
  return new Promise((res) => {
    const from = scrollY, dist = y - from, t0 = performance.now();
    const dur = Math.min(700, 250 + Math.abs(dist) * 0.25);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, from + dist * e);
      if (k < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}

export function initSmoothScroll() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches || reducedMotion()) return;

  const max = () => document.documentElement.scrollHeight - innerHeight;
  const clamp = (v: number) => Math.max(0, Math.min(max(), v));
  let target = scrollY;
  let current = scrollY;
  let raf = 0;
  const waiters: (() => void)[] = [];

  const tick = () => {
    current += (target - current) * AGIRLIK;
    if (Math.abs(target - current) < 0.4) current = target;
    window.scrollTo(0, current);
    raf = current === target ? 0 : requestAnimationFrame(tick);
    if (!raf) waiters.splice(0).forEach((f) => f());
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  ctl = { go: (y) => new Promise((res) => { target = clamp(y); waiters.push(res); kick(); }) };

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.defaultPrevented) return; // yakınlaştırma
    // içinde kendi kaydırması olan öğede yerel davranış
    let el = e.target as HTMLElement | null;
    while (el && el !== document.body) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) return;
      el = el.parentElement;
    }
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
    target = clamp(target + e.deltaY * unit * ADIM);
    kick();
  }, { passive: false });

  // Başka yolla kaydırma (klavye, scrollbar, odak): hedefi gerçek konuma çek
  window.addEventListener('scroll', () => {
    // scroll olayı asenkron gelir: bizim yazdığımız konuma yakınsa yok say
    if (Math.abs(scrollY - current) < 2) return;
    target = current = scrollY;
  }, { passive: true });

  // #bağlantılar da aynı ağırlıkla kayar
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#' || e.defaultPrevented) return;
    const dest = a.hash === '#top' ? document.body : document.querySelector(a.hash);
    if (!dest) return;
    e.preventDefault();
    const pad = a.hash === '#top' ? 0 : 72;
    target = clamp(dest.getBoundingClientRect().top + scrollY - pad);
    history.pushState(null, '', a.hash);
    kick();
  });
}
