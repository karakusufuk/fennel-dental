import { fadeSwap } from './util';
import { Q_, sequence, total, build, type Answers, type Q } from '../lib/startflow';

/**
 * /start/ — arayüz (akış mantığı: src/lib/startflow.ts).
 * Cevaplar yalnız bellekte. Onay verilirse sessionStorage'a yazılır (sekme kapanınca silinir).
 */
const STORE = 'fennel-start-result';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function init(root: HTMLElement) {
  const a: Answers = {};
  let cursor = 0;
  let consent = false;
  const url = new URL(location.href);
  const b = url.searchParams.get('branch');
  if (b && Q_.reason.opts.some((o) => o.v === b)) { a.reason = b; cursor = 1; }
  history.replaceState({ c: cursor }, '');

  root.innerHTML = `
    <button type="button" class="back-link back-btn" data-back>← Back</button>
    <div class="prog"><div class="prog__bar"><i data-prog style="width:0%"></i></div><span class="prog__n" data-n></span></div>
    <div class="gdyn" data-dyn aria-live="polite"></div>`;
  const dyn = root.querySelector<HTMLElement>('[data-dyn]')!;
  const backBtn = root.querySelector<HTMLButtonElement>('[data-back]')!;
  const bar = root.querySelector<HTMLElement>('[data-prog]')!;
  const nEl = root.querySelector<HTMLElement>('[data-n]')!;

  const view = () => {
    const { qs, key } = sequence(a);
    const done = key !== null;
    const idx = Math.min(cursor, qs.length - 1);
    return { qs, key, done, idx };
  };

  function questionHTML(q: Q) {
    const isReason = q.id === 'reason';
    const sel = a[q.id];
    const btns = q.opts.map((o) => `<button type="button" class="${isReason ? 'opt' : 'ans'}" data-v="${o.v}" aria-pressed="${sel === o.v}">${esc(o.label)}</button>`).join('');
    return `<h2 class="q-h" id="q-h" tabindex="-1">${esc(q.text)}</h2><div class="${isReason ? 'opts' : 'answers'}" role="group" aria-labelledby="q-h">${btns}</div>`;
  }

  function resultHTML(key: string) {
    if (key === 'CALL') {
      return `<div class="gcard gcard--call on-dark">
        <div class="etiket">Don't wait for a slot</div>
        <div class="gcard__t">Call us now. Swelling or fever needs to be seen today.</div>
        <a class="btn btn--beyaz" style="align-self:flex-start" href="tel:+35312345018">Call 01 234 5018 →</a>
        <p class="gcard__fixed">If swelling is affecting your breathing or swallowing, go to an Emergency Department or call 112.</p>
        <div class="gcard__act"><button type="button" class="linkbtn" data-restart>Start again</button></div></div>`;
    }
    const r = build(key, a);
    const rows = r.rows.map(([l, v]) => `<div><span>${esc(l)}</span>${v ? `<span class="v">${esc(v)}</span>` : ''}</div>`).join('');
    const notes = r.notes.map((n) => `<p class="gnote">${esc(n)}</p>`).join('');
    const cta = r.mode === 'instant' ? 'Book now →' : 'Send booking request →';
    return `<div class="gcard on-dark">
      <div class="gcard__top"><div class="gcard__t">${esc(r.title)}</div><div class="gcard__time">${r.minutes} min</div></div>
      <div class="grows">${rows}</div>
      ${notes}
      <p class="gcard__fixed">Exact price comes as a written treatment plan after your consultation.</p>
      <label class="chk"><input type="checkbox" data-consent ${consent ? 'checked' : ''}><span class="chk__box" aria-hidden="true"></span><span class="chk__t">Send my answers to my dentist<small>Your answers are health information. We only share them with your dentist for this appointment.</small></span></label>
      <div class="gcard__act"><button type="button" class="btn btn--beyaz" data-go>${cta}</button><a class="plain" href="/fees/">Full fee list</a><button type="button" class="linkbtn" data-restart>Start again</button></div></div>`;
  }

  function render(focus: boolean) {
    const v = view();
    const n = total(a);
    backBtn.hidden = cursor === 0;
    const showResult = v.done && cursor >= v.qs.length;
    if (showResult) {
      bar.style.width = '100%';
      nEl.textContent = `${n} / ${n}`;
      dyn.innerHTML = resultHTML(v.key!);
    } else {
      const q = v.qs[Math.min(cursor, v.qs.length - 1)];
      const pos = Math.min(cursor, v.qs.length - 1) + 1;
      bar.style.width = `${Math.min(100, (pos / n) * 100)}%`;
      nEl.textContent = `${Math.min(pos, n)} / ${n}`;
      dyn.innerHTML = questionHTML(q);
    }
    if (focus) (dyn.querySelector<HTMLElement>('#q-h') ?? dyn.querySelector<HTMLElement>('.gcard__t'))?.setAttribute('tabindex', '-1');
    if (focus) (dyn.querySelector<HTMLElement>('#q-h') ?? dyn.querySelector<HTMLElement>('.gcard__t'))?.focus({ preventScroll: true });
  }

  function go(c: number, push: boolean) {
    cursor = Math.max(0, c);
    if (push) history.pushState({ c: cursor }, '');
    fadeSwap(dyn, () => render(true));
  }

  dyn.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const btn = t.closest<HTMLButtonElement>('[data-v]');
    if (btn) {
      const q = view().qs[Math.min(cursor, view().qs.length - 1)];
      if (q.id === 'reason' && a.reason !== btn.dataset.v) { for (const k of Object.keys(a)) delete a[k]; }
      a[q.id] = btn.dataset.v!;
      go(cursor + 1, true);
      return;
    }
    if (t.closest('[data-restart]')) { for (const k of Object.keys(a)) delete a[k]; consent = false; go(0, true); return; }
    if (t.closest('[data-go]')) { finish(); }
  });
  dyn.addEventListener('change', (e) => { const el = e.target as HTMLInputElement; if (el.matches('[data-consent]')) consent = el.checked; });
  backBtn.addEventListener('click', () => go(cursor - 1, true));
  window.addEventListener('popstate', (e) => { cursor = (e.state && typeof e.state.c === 'number') ? e.state.c : 0; fadeSwap(dyn, () => render(true)); });

  function finish() {
    const v = view();
    if (!v.key || v.key === 'CALL') return;
    const r = build(v.key, a);
    const payload: Record<string, unknown> = { treatment: r.treatment, duration: r.minutes, mode: r.mode, title: r.title, consent };
    if (consent) {
      payload.flags = r.flags;
      payload.answers = v.qs.map((q) => ({ q: q.text, a: q.opts.find((o) => o.v === a[q.id])?.label ?? '' }));
    }
    try { sessionStorage.setItem(STORE, JSON.stringify(payload)); } catch { /* bellek yok: sadece URL */ }
    location.href = `/book/?treatment=${r.treatment}&from=start`;
  }

  render(false);
}

const root = document.querySelector<HTMLElement>('[data-start]');
if (root) init(root);
