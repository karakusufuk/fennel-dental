import { $, $$ } from './util';

/** Bugünün çalışma saati: klinik saatiyle (Europe/Dublin), ziyaretçinin saatiyle değil. */
export function initHours() {
  const wrap = $('[data-hours]');
  if (!wrap) return;
  const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Dublin' }).format(new Date());
  const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(short);
  $$('[data-days]', wrap).forEach((row) => {
    if (!row.dataset.days!.split(',').map(Number).includes(today)) return;
    row.classList.add('is-today');
    row.append(' · today');
  });
}

/** Mobil alt çubuk, footer görününce gizlenir. */
export function initMobileBar() {
  const bar = $('[data-mbar]');
  const foot = $('[data-footer]');
  if (!bar || !foot || !('IntersectionObserver' in window)) return;
  new IntersectionObserver((es) => bar.classList.toggle('is-hidden', es[0].isIntersecting)).observe(foot);
}
