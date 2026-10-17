import {
  treatmentsSync, getTreatments, dentistsSync, getAvailability, availabilitySync, earliest, createBooking, rescheduleBooking,
  sendCode, verifyCode, phoneOk, phoneHint, maskPhone, toIcs, getBooking, getSettings, TREATMENT_NAMES, dayLabel, dow, DAY_LONG, DAY_SHORT, parseISO, addDays, today,
  type DaySlots, type Booking,
} from '../lib/booking';
import { team } from '../data/team';
import { esc, q, qa, download, field } from './ui';
import { mountNote, noteState } from './waitnote';

interface StartResult { treatment: string; duration: number; mode: 'instant' | 'request'; title: string; consent: boolean; flags?: string[]; answers?: { q: string; a: string }[] }

interface State {
  step: 1 | 2 | 3 | 4 | 5;
  treatment: string;
  duration?: number;
  dentist: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  code: string;
  sent: boolean;
  resendAt: number;
  resent: boolean;
  days: DaySlots[] | null;
  page: number;
  start: StartResult | null;
  resched: string | null;
  errors: Record<string, string>;
  done: { booking: Booking; status: string; moved?: boolean } | null;
  busy: boolean;
  sumOpen: boolean;
}

const root = q('[data-book]')!;
const params = new URLSearchParams(location.search);
const S: State = {
  step: 1, treatment: 'examination', dentist: 'any', date: '', time: '', name: '', phone: '+353 ', email: '', code: '',
  sent: false, resendAt: 0, resent: false, days: null, page: 0, start: null, resched: null, errors: {}, done: null, busy: false, sumOpen: false,
};
let skipTo: 1 | 2 | 3 | 4 = 1;
let preset: { dentist: string; date: string; time: string } | null = null;

/* ───────── Başlangıç: URL ve /start/ sonucu ───────── */
(function boot() {
  const known = new Set(treatmentsSync().map((t) => t.slug));
  const t = params.get('treatment');
  const d = params.get('dentist');
  const r = params.get('reschedule');
  if (params.get('from') === 'start') {
    try {
      const raw = sessionStorage.getItem('fennel-start-result');
      if (raw) {
        S.start = JSON.parse(raw) as StartResult;
        S.treatment = S.start.treatment;
        S.duration = S.start.duration;
        skipTo = 2;
      }
    } catch { /* sessionStorage yok */ }
  }
  if (t && known.has(t) && !S.start) { S.treatment = t; skipTo = 2; }
  if (d && team.some((x) => x.slug === d)) { S.dentist = d; if (skipTo === 2) skipTo = 3; }
  const pd = params.get('date'), pt = params.get('time');
  if (d && pd && pt && /^\d{4}-\d{2}-\d{2}$/.test(pd) && /^\d{2}:\d{2}$/.test(pt)) { preset = { dentist: d, date: pd, time: pt }; S.date = pd; S.time = pt; }
  if (params.get('note') === '1') { noteState.open = true; skipTo = 3; }
  if (r) {
    const b = getBooking(r);
    if (b && b.status !== 'cancelled') {
      S.resched = r; S.treatment = b.treatment; S.dentist = b.dentist; S.duration = b.duration;
      S.name = b.patient.name; S.phone = b.patient.phone; S.email = b.patient.email ?? '';
      skipTo = 3;
    }
  }
  S.step = skipTo;
})();

const dur = () => S.duration ?? getSettings().treatments[S.treatment]?.duration ?? 30;
const tInfo = () => treatmentsSync().find((t) => t.slug === S.treatment)!;
const dentistName = (slug: string) => team.find((d) => d.slug === slug)?.name ?? '';
const fmtSlot = (date: string, time: string) => `${dayLabel(date)} ${time}`;
const STEPS = ['What for', 'With whom', 'When', 'You'];

/* ───────── Üst: adım göstergesi ───────── */
function stepper() {
  const items = STEPS.map((l, i) => {
    const n = i + 1;
    const state = S.step === n ? 'current' : n < S.step ? 'done' : 'todo';
    const dis = state === 'todo' || (S.resched && n !== 3) ? 'disabled' : '';
    return `<li><button type="button" class="stp stp--${state}" data-goto="${n}" ${state === 'current' ? 'aria-current="step"' : ''} ${dis}><span class="mono">${n}</span> ${l}</button></li>`;
  }).join('');
  const shown = Math.min(S.step, 4);
  return `<ol class="stepper" aria-label="Steps">${items}</ol>
    <div class="prog"><div class="prog__bar"><i style="width:${(shown / 4) * 100}%"></i></div><span class="prog__n">${shown} / 4</span></div>`;
}

/* ───────── Özet kartı ───────── */
function summaryRows() {
  const t = tInfo();
  const rows: [string, string][] = [];
  rows.push(['Treatment', `${esc(S.start?.title ?? t.name)} · ${dur()} min`]);
  rows.push(['Dentist', S.dentist === 'any' ? 'First available' : esc(dentistName(S.dentist))]);
  rows.push(['When', S.date && S.time ? esc(fmtSlot(S.date, S.time)) : '—']);
  rows.push(['Fee', `<span class="mono">${esc(t.min === t.max ? t.min : `${t.min}–${t.max}`)}</span>`]);
  return rows;
}
function summaryLine() {
  const t = S.start?.title ?? tInfo().name;
  const d = S.dentist === 'any' ? '' : ` · ${team.find((x) => x.slug === S.dentist)?.first ?? ''}`;
  const w = S.date && S.time ? ` · ${fmtSlot(S.date, S.time)}` : '';
  return `${t}${d}${w}`;
}
function summaryCard() {
  const mode = tInfo().mode;
  return `<aside class="sumcard" aria-label="Summary">
    ${S.start ? '<div class="etiket">From your answers</div>' : '<div class="etiket">Your visit</div>'}
    <dl>${summaryRows().map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <p class="sumcard__mode">${mode === 'instant' ? 'Confirmed instantly.' : 'The clinic confirms within one working day.'}</p>
  </aside>`;
}

/* ───────── Adımlar ───────── */
function step1() {
  const list = treatmentsSync().map((t) => {
    const label = t.slug === 'examination' ? 'Not sure — book an examination' : t.name;
    return `<button type="button" class="opt opt--row" data-treatment="${t.slug}" aria-pressed="${S.treatment === t.slug}"><span>${esc(label)}</span><span class="mono">${S.treatment === t.slug && S.duration ? S.duration : t.duration} min</span></button>`;
  }).join('');
  return `<h2 class="q-h" id="step-h" tabindex="-1">What for?</h2>
    <div class="opts opts--col" role="group" aria-labelledby="step-h">${list}</div>
    <a class="link-k back-link" href="/start/">Answer 4 questions instead →</a>
    <div class="btnrow"><button type="button" class="btn btn--kobalt" data-next>Continue →</button></div>`;
}

function step2() {
  const ds = dentistsSync(S.treatment);
  const eAny = earliest('any', S.treatment, dur());
  const any = `<button type="button" class="opt opt--row opt--dentist" data-dentist="any" aria-pressed="${S.dentist === 'any'}"><span><strong>First available dentist</strong></span><span class="mono">${eAny ? `earliest ${esc(fmtSlot(eAny.date, eAny.time))}` : 'no times soon'}</span></button>`;
  const list = ds.map((d) => {
    const e = earliest(d.slug, S.treatment, dur());
    return `<button type="button" class="opt opt--row opt--dentist" data-dentist="${d.slug}" aria-pressed="${S.dentist === d.slug}">
      <span class="dwho"><picture><source type="image/avif" srcset="/img/ekip/${d.img}-320.avif"><img src="/img/ekip/${d.img}-320.webp" alt="" width="56" height="70"></picture><span><strong>${esc(d.name)}</strong><br><span class="role-sm">${esc(d.role)}</span></span></span>
      <span class="mono">${e ? `earliest ${esc(fmtSlot(e.date, e.time))}` : 'no times soon'}</span></button>`;
  }).join('');
  return `<h2 class="q-h" id="step-h" tabindex="-1">With whom?</h2>
    <div class="opts opts--col" role="group" aria-labelledby="step-h">${any}${list}</div>
    <div class="btnrow"><button type="button" class="btn btn--kobalt" data-next>Continue →</button></div>`;
}

function step3() {
  if (!S.days) return `<h2 class="q-h" id="step-h" tabindex="-1">When?</h2><p class="loading" aria-busy="true">Loading times…</p>`;
  const days = S.days;
  const open = days.filter((d) => d.slots.length);
  const pageStart = S.page * 7;
  const strip = days.map((d, i) => {
    const dis = d.slots.length === 0;
    const sel = S.date === d.date;
    const off = i < pageStart || i >= pageStart + 7;
    return `<button type="button" class="day${sel ? ' is-sel' : ''}${off ? ' is-off' : ''}" data-day="${d.date}" aria-pressed="${sel}" ${dis ? 'disabled' : ''}><span class="mono">${DAY_SHORT[dow(d.date)]}</span><span class="mono day__n">${parseISO(d.date).getDate()}</span></button>`;
  }).join('');
  const cur = days.find((d) => d.date === S.date);
  let times = '';
  if (!open.length) times = '<p>No free times in the next two weeks. Call 01 555 0182 and we\'ll book you by phone.</p>';
  else if (!cur) times = '<p class="fixed-line">Pick a day to see the free times.</p>';
  else if (!cur.slots.length) {
    const next = days.find((d) => d.date > S.date && d.slots.length);
    times = `<p>No free times this day.</p>${next ? '<button type="button" class="link-k linkbtn2" data-nextday>Next free day →</button>' : ''}`;
  } else {
    times = `<div class="times" role="group" aria-label="Free times">${cur.slots.map((s, i) => `<div class="tm">${i === 0 ? '<span class="earliest">EARLIEST</span>' : '<span class="earliest earliest--ph" aria-hidden="true">&nbsp;</span>'}<button type="button" class="opt mono" data-time="${s.time}" aria-pressed="${S.time === s.time}">${s.time}</button></div>`).join('')}</div>`;
  }
  const arrows = `<div class="daynav"><button type="button" class="arrow" data-page="-1" aria-label="Earlier days" ${S.page === 0 ? 'disabled' : ''}>←</button><button type="button" class="arrow" data-page="1" aria-label="Later days" ${S.page === 1 ? 'disabled' : ''}>→</button></div>`;
  const last = S.resched
    ? `<button type="button" class="btn btn--kobalt" data-resched ${S.time ? '' : 'disabled'}>Save new time →</button>`
    : `<button type="button" class="btn btn--kobalt" data-next ${S.time ? '' : 'disabled'}>Continue →</button>`;
  return `<h2 class="q-h" id="step-h" tabindex="-1">${S.resched ? 'Pick a new time.' : 'When?'}</h2>
    <div class="dayrow"><div class="days" role="group" aria-label="Days" data-days>${strip}</div>${arrows}</div>
    ${times}
    <div data-note-slot></div>
    <div class="btnrow">${last}</div>
    ${S.errors.slot ? `<p class="err">${esc(S.errors.slot)}</p>` : ''}`;
}

function step4() {
  const e = S.errors;
  const t = tInfo();
  const consent = S.start?.consent;
  return `<h2 class="q-h" id="step-h" tabindex="-1">You.</h2>
    <form class="form" data-form novalidate>
      ${field('f-name', 'Full name', { value: S.name, autocomplete: 'name', error: e.name })}
      ${field('f-phone', 'Mobile number', { type: 'tel', value: S.phone, autocomplete: 'tel', error: e.phone })}
      ${field('f-email', 'Email (optional)', { type: 'email', value: S.email, autocomplete: 'email', hint: 'For a calendar invite and reminder.' })}
      ${consent ? `<p class="note-ro" data-consent-note>Your answers will be sent to your dentist. <button type="button" class="linkbtn2" data-remove-consent>Remove</button></p>` : ''}
      ${S.sent ? `<div class="fld"><p data-sent>We've sent a 6-digit code to ${esc(phoneHint(S.phone))}.</p>
        <p class="resend"><button type="button" class="linkbtn2 link-k" data-resend ${Date.now() < S.resendAt ? 'disabled' : ''}>Resend code</button>${S.resent ? ' <span class="fixed-line" role="status">Code sent again.</span>' : ''}</p></div>`
        : `<div class="fld"><button type="button" class="btn btn--yuzey" data-send ${S.busy ? 'disabled' : ''}>Send code</button></div>`}
      ${S.sent ? field('f-code', '6-digit code', { value: S.code, autocomplete: 'one-time-code', inputmode: 'numeric', maxlength: 6, error: e.code }) : e.code ? `<p class="err">${esc(e.code)}</p>` : ''}
      <div class="btnrow"><button type="submit" class="btn btn--kobalt" ${S.busy ? 'disabled' : ''}>${t.mode === 'instant' ? 'Confirm booking →' : 'Send booking request →'}</button></div>
    </form>`;
}

function flagBox(f: string) { return `<span class="flagbox mono">${esc(f.replace('-', ' ').toUpperCase())}</span>`; }

function done() {
  const { booking: b, status, moved } = S.done!;
  const when = `${DAY_LONG[dow(b.date)]} at ${b.time}`;
  const t = tInfo();
  const instant = status === 'confirmed';
  const head = moved
    ? `<div class="etiket">[ MOVED ]</div><h2 class="h-bolum" id="step-h" tabindex="-1">See you ${esc(when)}.</h2>`
    : instant
      ? `<div class="etiket">[ CONFIRMED ]</div><h2 class="h-bolum" id="step-h" tabindex="-1">See you ${esc(when)}.</h2>`
      : `<div class="etiket">[ REQUEST SENT ]</div><h2 class="h-bolum" id="step-h" tabindex="-1">We'll confirm within one working day.</h2>`;
  const flags = b.flags.length ? b.flags.map(flagBox).join(' ') : '<span class="mono">none</span>';
  const answers = b.consent && b.answers?.length
    ? `<ul class="ans-list">${b.answers.map((a) => `<li><span>${esc(a.q)}</span><strong>${esc(a.a)}</strong></li>`).join('')}</ul>`
    : '<p class="fixed-line">Answers not shared</p>';
  return `<div class="done stack">
    ${head}
    <dl class="sumcard sumcard--flat"><div><dt>Treatment</dt><dd>${esc(TREATMENT_NAMES[b.treatment])} · ${b.duration} min</dd></div>
      <div><dt>Dentist</dt><dd>${esc(dentistName(b.dentist))}</dd></div>
      <div><dt>When</dt><dd>${esc(fmtSlot(b.date, b.time))}</dd></div>
      <div><dt>Where</dt><dd>[STREET], Dublin 4</dd></div>
      <div><dt>Fee</dt><dd class="mono">${esc(t.min === t.max ? t.min : `${t.min}–${t.max}`)}</dd></div></dl>
    ${moved ? '' : instant
      ? `<p>We've sent a text to ${esc(maskPhone(b.patient.phone))}. We'll remind you 24 hours before.</p>`
      : `<p>Your slot is held until we call you.</p>`}
    <div class="btnrow"><button type="button" class="btn btn--kobalt" data-ics>Add to calendar</button><a class="btn btn--yuzey" href="/my-appointments/">Manage my appointment →</a></div>
    <div class="preview">
      <div class="etiket">[ WHAT YOUR DENTIST SEES ]</div>
      <div class="sumcard sumcard--flat">
        <div><dt>Reason</dt><dd>${esc(b.reason ?? TREATMENT_NAMES[b.treatment])}</dd></div>
        <div><dt>Suggested time</dt><dd class="mono">${b.duration} min</dd></div>
        <div><dt>Flags</dt><dd>${flags}</dd></div>
        <div class="col"><dt>Answers</dt><dd>${answers}</dd></div>
      </div>
      <p class="fixed-line">Shown here for the demo. Patients don't see this.</p>
    </div></div>`;
}

/* ───────── Çizim ───────── */
function render(focus = true) {
  const sticky = S.step < 5;
  const body = S.step === 1 ? step1() : S.step === 2 ? step2() : S.step === 3 ? step3() : S.step === 4 ? step4() : done();
  root.innerHTML = `<div class="book__main" data-main>${sticky ? stepper() : ''}<div class="book__body" aria-live="polite">${body}</div></div>
    ${sticky ? `<div class="book__side">${summaryCard()}</div>` : ''}`;
  mountSumbar(sticky);
  const slot = q('[data-note-slot]', root);
  if (slot && S.step === 3 && S.days) {
    if (!noteState.name) noteState.name = S.name;
    if (noteState.phone.trim() === '+353' && S.phone.trim() !== '+353') noteState.phone = S.phone;
    mountNote(slot, () => ({ treatment: S.treatment, dentist: S.dentist }), { toggle: true });
  }
  if (focus) q('#step-h')?.focus({ preventScroll: false });
}

let sumbar: HTMLElement | null = null;
function mountSumbar(on: boolean) {
  sumbar?.remove();
  sumbar = null;
  document.body.classList.toggle('has-sumbar', on);
  if (!on) return;
  sumbar = document.createElement('div');
  sumbar.className = `sumbar${S.sumOpen ? ' is-open' : ''}`;
  sumbar.innerHTML = `<div class="sumbar__panel">${summaryCard()}</div><button type="button" class="sumbar__btn" aria-expanded="${S.sumOpen}" data-sum-toggle><span>${esc(summaryLine())}</span><span aria-hidden="true">${S.sumOpen ? '↓' : '→'}</span></button>`;
  document.body.appendChild(sumbar);
  sumbar.querySelector('[data-sum-toggle]')!.addEventListener('click', () => { S.sumOpen = !S.sumOpen; mountSumbar(true); });
}

function setStep(n: State['step'], push = true) {
  S.step = n;
  S.errors = {};
  if (push) history.pushState({ s: n }, '');
  if (n === 3) loadDays();
  render();
}

async function loadDays() {
  S.days = null;
  render(false);
  const days = await getAvailability({ treatment: S.treatment, dentist: S.dentist, from: today(), days: 14, duration: dur(), exceptId: S.resched ?? undefined });
  S.days = days;
  // /start/'tan acil geldiyse en erken saat önceden seçili
  if (!S.date && S.start?.consent && S.start.flags?.includes('urgent')) {
    const d = days.find((x) => x.slots.length);
    if (d) { S.date = d.date; S.time = d.slots[0].time; S.page = days.indexOf(d) >= 7 ? 1 : 0; }
  }
  if (S.date && !days.find((d) => d.date === S.date)?.slots.some((s) => s.time === S.time)) S.time = '';
  if (S.date) S.page = days.findIndex((d) => d.date === S.date) >= 7 ? 1 : 0;
  render(S.step === 3 && false);
  const h = q('#step-h');
  if (h && document.activeElement === document.body) h.focus({ preventScroll: true });
}

/* ───────── Olaylar ───────── */
root.addEventListener('click', async (e) => {
  const t = e.target as HTMLElement;
  const go = t.closest<HTMLElement>('[data-goto]');
  if (go && !(go as HTMLButtonElement).disabled) { setStep(Number(go.dataset.goto) as State['step']); return; }
  const tr = t.closest<HTMLElement>('[data-treatment]');
  if (tr) {
    S.treatment = tr.dataset.treatment!;
    S.duration = S.start && S.start.treatment === S.treatment ? S.start.duration : undefined;
    // hekim profilinden gelindiyse hekim ve saat korunur (hekim bu tedaviyi yapıyorsa)
    const keep = !!preset && dentistsSync(S.treatment).some((x) => x.slug === preset!.dentist);
    S.dentist = keep ? preset!.dentist : 'any'; S.date = keep ? preset!.date : ''; S.time = keep ? preset!.time : '';
    setStep(keep ? 3 : 2); return;
  }
  const de = t.closest<HTMLElement>('[data-dentist]');
  if (de) { S.dentist = de.dataset.dentist!; S.date = ''; S.time = ''; setStep(3); return; }
  if (t.closest('[data-next]')) {
    if (S.step === 3 && !S.time) return;
    if (S.step === 1) { S.dentist = 'any'; S.date = ''; S.time = ''; }
    setStep((S.step + 1) as State['step']); return;
  }
  const day = t.closest<HTMLElement>('[data-day]');
  if (day) { S.date = day.dataset.day!; S.time = ''; render(false); q<HTMLElement>(`[data-day="${S.date}"]`)?.focus(); return; }
  const tm = t.closest<HTMLElement>('[data-time]');
  if (tm) { S.time = tm.dataset.time!; render(false); q<HTMLElement>(`[data-time="${S.time}"]`)?.focus(); return; }
  const pg = t.closest<HTMLElement>('[data-page]');
  if (pg) { S.page = Math.max(0, Math.min(1, S.page + Number(pg.dataset.page))); render(false); return; }
  if (t.closest('[data-nextday]') && S.days) {
    const nd = S.days.find((d) => d.date > S.date && d.slots.length);
    if (nd) { S.date = nd.date; S.time = ''; S.page = S.days.indexOf(nd) >= 7 ? 1 : 0; render(false); }
    return;
  }
  if (t.closest('[data-remove-consent]') && S.start) {
    S.start.consent = false; S.start.flags = undefined; S.start.answers = undefined;
    try { sessionStorage.setItem('fennel-start-result', JSON.stringify(S.start)); } catch { /* yok */ }
    readForm(); render(false); return;
  }
  if (t.closest('[data-send]')) { await onSend(); return; }
  if (t.closest('[data-resend]') && Date.now() >= S.resendAt) { await onSend(true); return; }
  if (t.closest('[data-resched]')) { await onResched(); return; }
  if (t.closest('[data-ics]') && S.done) { download('fennel-dental-appointment.ics', toIcs(S.done.booking)); }
});

root.addEventListener('submit', async (e) => { e.preventDefault(); await onSubmit(); });

// Gün şeridi: ok tuşları
root.addEventListener('keydown', (e) => {
  const ev = e as KeyboardEvent;
  const t = ev.target as HTMLElement;
  if (!t.matches('[data-day]') || (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight')) return;
  ev.preventDefault();
  const all = qa<HTMLButtonElement>('[data-day]', root).filter((b) => !b.disabled);
  const wide = matchMedia('(min-width: 761px)').matches;
  const idx = all.indexOf(t as HTMLButtonElement);
  const next = all[idx + (ev.key === 'ArrowRight' ? 1 : -1)];
  if (!next) return;
  if (wide && S.days) {
    const i = S.days.findIndex((d) => d.date === next.dataset.day);
    S.page = i >= 7 ? 1 : 0;
    render(false);
  }
  q<HTMLElement>(`[data-day="${next.dataset.day}"]`, root)?.focus();
});

function readForm() {
  const g = (id: string) => (q<HTMLInputElement>(`#${id}`, root)?.value ?? '');
  if (q('#f-name', root)) { S.name = g('f-name'); S.phone = g('f-phone'); S.email = g('f-email'); S.code = g('f-code'); }
}

function startCooldown() {
  S.resendAt = Date.now() + 30000;
  setTimeout(() => { if (S.step === 4) render(false); }, 30100);
}
async function onSend(resend = false) {
  readForm();
  S.errors = {};
  if (!phoneOk(S.phone)) { S.errors.phone = 'Check the mobile number.'; render(false); q('#f-phone')?.focus(); return; }
  S.busy = true; render(false);
  await sendCode(S.phone);
  S.sent = true; S.busy = false; S.resent = resend;
  startCooldown();
  render(false);
  q('#f-code')?.focus();
}

async function onSubmit() {
  readForm();
  const e: Record<string, string> = {};
  if (!S.name.trim()) e.name = 'Enter your name.';
  if (!phoneOk(S.phone)) e.phone = 'Check the mobile number.';
  if (!e.phone) {
    if (!S.sent) e.code = 'Send the code to your phone first.';
    else if (!(await verifyCode(S.phone, S.code))) e.code = 'Enter the 6-digit code.';
  }
  S.errors = e;
  if (Object.keys(e).length) { render(false); q(`#f-${Object.keys(e)[0]}`)?.focus(); return; }
  S.busy = true; render(false);
  try {
    const consent = !!S.start?.consent;
    const res = await createBooking({
      treatment: S.treatment, dentist: S.dentist, date: S.date, time: S.time, duration: dur(),
      name: S.name.trim(), phone: S.phone, email: S.email.trim() || undefined,
      flags: consent ? S.start?.flags : undefined, answers: consent ? S.start?.answers : undefined, consent,
      reason: S.start?.title,
    });
    try { sessionStorage.removeItem('fennel-start-result'); } catch { /* yok */ }
    S.done = { booking: res.booking, status: res.status };
    S.busy = false;
    S.step = 5;
    history.pushState({ s: 5 }, '');
    render();
  } catch {
    S.busy = false;
    S.errors = { slot: 'That time was just taken. Pick another.' };
    S.date = ''; S.time = '';
    S.step = 3; loadDays();
  }
}

async function onResched() {
  if (!S.resched || !S.date || !S.time) return;
  try {
    const b = await rescheduleBooking(S.resched, { date: S.date, time: S.time, dentist: S.dentist === 'any' ? undefined : S.dentist });
    S.done = { booking: b, status: b.status, moved: true };
    S.step = 5; history.pushState({ s: 5 }, ''); render();
  } catch {
    S.errors = { slot: 'That time was just taken. Pick another.' };
    S.time = ''; await loadDays();
  }
}

window.addEventListener('popstate', (e) => {
  const s = (e.state && e.state.s) || skipTo;
  if (S.done && s < 5) { location.reload(); return; }
  S.step = Math.min(s, 4) as State['step'];
  if (S.step === 3) loadDays(); else render();
});

history.replaceState({ s: S.step }, '');
if (S.step === 3) { loadDays(); } else render(false);
void getTreatments;
void availabilitySync;
void addDays;
