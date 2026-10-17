import { getSettings, DEFAULT_TREATMENTS } from '../lib/booking';

/** Panelde (Settings) değiştirilen fiyat sitede görünür. Varsayılana eşit değerlere dokunulmaz. */
function apply() {
  const st = getSettings();
  const changed = (slug: string) => { const t = st.treatments[slug], d = DEFAULT_TREATMENTS[slug]; return !!t && !!d && (t.min !== d.min || t.max !== d.max); };
  document.querySelectorAll<HTMLElement>('tr[data-slug]').forEach((tr) => {
    const slug = tr.dataset.slug!;
    if (!changed(slug)) return;
    tr.querySelector<HTMLElement>('[data-min]')!.textContent = st.treatments[slug].min;
    tr.querySelector<HTMLElement>('[data-max]')!.textContent = st.treatments[slug].max;
  });
  document.querySelectorAll<HTMLElement>('[data-fee]').forEach((el) => {
    const slug = el.dataset.fee!;
    if (!changed(slug)) return;
    const t = st.treatments[slug];
    el.textContent = t.min === t.max ? t.min : `${t.min}–${t.max}`;
  });
}
apply();
