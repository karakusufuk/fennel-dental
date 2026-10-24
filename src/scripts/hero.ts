import { $, reducedMotion } from './util';

/** Katmanlı parallax — sadece masaüstü + fare. Yalnız transform, rAF + lerp. */
export function initHero() {
  const hero = $('[data-hero]');
  const front = $('.hero__front', hero ?? document);
  const back = $('.hero__back', hero ?? document);
  if (!hero || !front || !back) return;

  // ≤1100px'te hero katmansız (CSS); parallax yalnız masaüstünde
  const fine = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1101px)');
  // Şiddet tek değişkenden: .hero { --parallax: 22 }  (0–50 px)
  const amount = () => parseFloat(getComputedStyle(hero).getPropertyValue('--parallax')) || 22;

  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

  const apply = () => {
    const f = amount();
    const b = Math.round(f * 0.45);
    front.style.transform = `translate3d(${(cx * f).toFixed(2)}px,0,0)`; // ön: yalnız yatay
    back.style.transform = `translate3d(${(-cx * b).toFixed(2)}px,${(-cy * b).toFixed(2)}px,0)`; // arka: ters yön
  };
  const tick = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    apply();
    if (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) raf = requestAnimationFrame(tick);
    else { cx = tx; cy = ty; apply(); raf = 0; }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const reset = () => { tx = 0; ty = 0; kick(); };

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !fine.matches || reducedMotion()) return;
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    kick();
  });
  hero.addEventListener('pointerleave', reset);
  fine.addEventListener('change', () => { if (!fine.matches) { tx = ty = cx = cy = 0; front.style.transform = back.style.transform = ''; } });
}
