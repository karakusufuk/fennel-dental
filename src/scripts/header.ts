import { $ } from './util';

export function initHeader() {
  const hdr = $('[data-hdr]');
  const btn = $<HTMLButtonElement>('[data-menu-btn]');
  const menu = $('[data-menu]');
  if (!hdr) return;

  // 80px kaydırılınca opak + 60px
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      hdr.classList.toggle('is-scrolled', window.scrollY > 80);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!btn || !menu) return;
  const setOpen = (open: boolean, returnFocus = false) => {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
    // açık menüde başlık opak olsun
    hdr.classList.toggle('is-menu', open);
    if (!open && returnFocus) btn.focus();
  };
  btn.addEventListener('click', () => setOpen(menu.hidden));
  menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setOpen(false, true); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !hdr.contains(e.target as Node)) setOpen(false); });
  matchMedia('(min-width: 761px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}
