import { reducedMotion } from './util';

/** Tek görselli sahneler (tedavi sayfaları): sayfaya girince bir kez oynar, Play again. */
document.querySelectorAll<HTMLElement>('[data-solo]').forEach((root) => {
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const play = () => { stage.classList.remove('is-playing'); void stage.offsetWidth; stage.classList.add('is-playing'); };
  root.querySelector('[data-replay]')!.addEventListener('click', play);
  if (!('IntersectionObserver' in window)) { play(); return; }
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.35 });
  io.observe(root);
});

/** Whitening: elle sürüklenen önce/sonra kaydırıcı. Klavye: ← → %5 adım. */
document.querySelectorAll<HTMLElement>('[data-compare]').forEach((root) => {
  const box = root.querySelector<HTMLElement>('[data-cmp-box]')!;
  const after = root.querySelector<HTMLElement>('[data-cmp-after]')!;
  const line = root.querySelector<HTMLElement>('[data-cmp-line]')!;
  const handle = root.querySelector<HTMLElement>('[data-cmp-handle]')!;
  let v = 50;
  const set = (n: number) => {
    v = Math.max(0, Math.min(100, n));
    after.style.clipPath = `inset(0 0 0 ${v}%)`;
    line.style.left = `${v}%`;
    handle.style.left = `${v}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(v)));
  };
  const fromEvent = (e: PointerEvent) => { const r = box.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
  let drag = false;
  box.addEventListener('pointerdown', (e) => { drag = true; box.setPointerCapture(e.pointerId); fromEvent(e); handle.focus({ preventScroll: true }); });
  box.addEventListener('pointermove', (e) => { if (drag) fromEvent(e); });
  box.addEventListener('pointerup', () => { drag = false; });
  box.addEventListener('pointercancel', () => { drag = false; });
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); set(v - 5); }
    if (e.key === 'ArrowRight') { e.preventDefault(); set(v + 5); }
    if (e.key === 'Home') { e.preventDefault(); set(0); }
    if (e.key === 'End') { e.preventDefault(); set(100); }
  });
  void reducedMotion;
  set(50);
});
