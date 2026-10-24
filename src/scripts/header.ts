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
  const backdrop = $('[data-menu-backdrop]');
  const focusables = () => [btn, ...Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))];
  const setOpen = (open: boolean, returnFocus = false) => {
    menu.hidden = !open;
    if (backdrop) backdrop.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close ×' : 'Menu';
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    // açık menüde başlık opak olsun; sayfa arkada kaymasın
    hdr.classList.toggle('is-menu', open);
    document.documentElement.classList.toggle('menu-lock', open);
    if (open) menu.querySelector<HTMLElement>('a[href]')?.focus({ preventScroll: true });
    else if (returnFocus) btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => setOpen(menu.hidden, !menu.hidden));
  menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); });
  backdrop?.addEventListener('click', () => setOpen(false, true));
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { setOpen(false, true); return; }
    if (e.key !== 'Tab') return;
    // odak menüde (başlık düğmesi + panel) döner
    const items = focusables();
    const first = items[0], last = items[items.length - 1];
    const a = document.activeElement as HTMLElement | null;
    if (!a || !items.includes(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('click', (e) => { if (!menu.hidden && !hdr.contains(e.target as Node) && e.target !== backdrop) setOpen(false); });
  matchMedia('(min-width: 1101px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}
