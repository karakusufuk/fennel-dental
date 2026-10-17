import { getSettings } from '../lib/booking';

/** Panelde (Settings) değiştirilen fiyat aralığı sitede görünür. Varsayılan yer tutucular değişmez. */
function apply() {
  const st = getSettings();
  document.querySelectorAll<HTMLElement>('tr[data-slug]').forEach((tr) => {
    const t = st.treatments[tr.dataset.slug!];
    if (!t) return;
    tr.querySelector<HTMLElement>('[data-min]')!.textContent = t.min;
    tr.querySelector<HTMLElement>('[data-max]')!.textContent = t.max;
  });
  document.querySelectorAll<HTMLElement>('[data-fee]').forEach((el) => {
    const t = st.treatments[el.dataset.fee!];
    if (t) el.textContent = t.min === t.max ? t.min : `${t.min}–${t.max}`;
  });
}
apply();
