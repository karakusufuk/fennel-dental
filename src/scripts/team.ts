import { $, $$ } from './util';

/** Masaüstünde hover/odakta portre kutusu satırın hizasına kayar. */
export function initTeam() {
  const sec = $('[data-team]');
  if (!sec) return;
  const rowsEl = $('[data-rows]', sec)!;
  const rows = $$('.trow', sec);
  const side = $('[data-side]', sec)!;
  const portrait = $('[data-portrait]', sec)!;
  const imgs = $$('img', portrait);
  const wide = matchMedia('(min-width: 1101px)');

  const show = (i: number) => {
    if (!wide.matches) return;
    const sideTop = side.getBoundingClientRect().top;
    const rr = rows[i].getBoundingClientRect();
    const h = portrait.offsetHeight;
    // kutu satırın ortasına oturur; listenin altından en fazla 120px (bölüm boşluğu) taşabilir
    const maxY = rowsEl.getBoundingClientRect().bottom - sideTop + 120 - h;
    const y = Math.max(0, Math.min(rr.top - sideTop + rr.height / 2 - h / 2, maxY));
    portrait.style.transform = `translateY(${y}px)`;
    portrait.style.opacity = '1';
    imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
  };
  const hide = () => { portrait.style.opacity = '0'; };

  rows.forEach((r, i) => {
    r.addEventListener('mouseenter', () => show(i));
    r.addEventListener('focus', () => show(i));
  });
  // satırdan satıra geçerken kaybolmaz; listeden çıkınca kaybolur
  rowsEl.addEventListener('mouseleave', hide);
  rowsEl.addEventListener('focusout', (e) => { if (!rowsEl.contains((e.relatedTarget as Node) || null)) hide(); });
  wide.addEventListener('change', hide);

  // Portreler önceden yüklensin
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      imgs.forEach((im) => { im.loading = 'eager'; });
    }, { rootMargin: '900px 0px' });
    io.observe(sec);
  }
}
