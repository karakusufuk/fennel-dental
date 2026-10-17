import { $, $$ } from './util';

/** Tek yorum, yalnız oklar (otomatik akış yok). Ok tuşları da çalışır. */
export function initReviews() {
  const sec = $('[data-reviews]');
  if (!sec) return;
  const rvs = $$('[data-rv]', sec);
  const whos = $$('[data-who]', sec);
  const n = $('[data-rv-n]', sec)!;
  let cur = 0;

  const go = (to: number) => {
    cur = (to + rvs.length) % rvs.length;
    rvs.forEach((r, i) => { r.classList.toggle('is-on', i === cur); r.setAttribute('aria-hidden', String(i !== cur)); });
    whos.forEach((w, i) => { w.classList.toggle('is-on', i === cur); w.setAttribute('aria-hidden', String(i !== cur)); });
    n.textContent = `${cur + 1} / ${rvs.length}`;
  };
  $('[data-prev]', sec)!.addEventListener('click', () => go(cur - 1));
  $('[data-next]', sec)!.addEventListener('click', () => go(cur + 1));
  $('.rvfig', sec)!.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (k === 'ArrowLeft') go(cur - 1);
    if (k === 'ArrowRight') go(cur + 1);
  });
}
