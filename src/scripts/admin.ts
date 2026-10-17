import {
  admin, getSettings, saveSettings, getWaitlist, simulateReply, getLog, resetDemo, onChange, availabilitySync, defaultSettings,
  today, addDays, parseISO, dow, toMin, fromMin, dayLabel, dentistRange, DAY_LONG, DAY_SHORT, TREATMENT_NAMES, TREATMENT_ORDER, CHAIRS,
  type Booking, type Settings,
} from '../lib/booking';
import { team } from '../data/team';
import { esc, q, qa } from './ui';

type Role = 'reception' | 'dentist' | 'owner';
type View = 'today' | 'week' | 'requests' | 'waiting' | 'settings' | 'activity';
interface Auth { role: Role; dentist?: string }

const ROW = 24; // 15 dk = 24px
const root = q('[data-admin]')!;
const KEY = 'fennel-admin-role';
const REASONS = ['No availability', 'Not suitable — please call us', 'Duplicate request'];

const A = {
  auth: null as Auth | null,
  view: 'today' as View,
  date: today(),
  mode: 'dentist' as 'dentist' | 'chair',
  weekStart: mondayOf(today()),
  selected: null as string | null,
  drawer: null as null | { type: 'booking' | 'move' | 'new' | 'suggest'; id?: string; date?: string; time?: string; dentist?: string; chair?: number; err?: string; confirmCancel?: boolean },
  undo: null as null | { id: string; prev: { date: string; time: string; dentist: string; chair: number }; text: string },
  undoTimer: 0,
  allDentists: false,
  mDentist: '',
  draft: null as Settings | null,
  dirty: false,
  toast: '',
  declining: '' as string,
  resetAsk: false,
};

function mondayOf(d: string) { const n = dow(d); return addDays(d, n === 0 ? -6 : 1 - n); }
const dentistName = (s: string) => team.find((d) => d.slug === s)?.name ?? s;
const dShort = (s: string) => team.find((d) => d.slug === s)?.first ?? s;

try { const r = sessionStorage.getItem(KEY); if (r) A.auth = JSON.parse(r); } catch { /* yok */ }

/* ───────── Yetkiler ───────── */
const can = {
  view(v: View) {
    const r = A.auth!.role;
    if (v === 'today') return true;
    if (r === 'owner') return true;
    if (r === 'reception') return v === 'week' || v === 'requests' || v === 'waiting';
    return false;
  },
  answers: () => A.auth!.role !== 'reception',
};
const NAV: [View, string][] = [['today', 'Today'], ['week', 'Week'], ['requests', 'Requests'], ['waiting', 'Waiting list'], ['settings', 'Settings'], ['activity', 'Activity']];

/* ───────── Kabuk ───────── */
function shell(body: string) {
  const a = A.auth!;
  const roleLabel = a.role === 'dentist' ? `Dentist · ${dentistName(a.dentist!)}` : a.role === 'owner' ? 'Owner' : 'Reception';
  const reqN = admin.requests().length;
  const nav = NAV.filter(([v]) => can.view(v)).map(([v, l]) => `<li><a href="#${v}" class="adm__l${A.view === v ? ' is-on' : ''}" ${A.view === v ? 'aria-current="page"' : ''}>${l}${v === 'requests' && reqN ? `<span class="badge mono">${reqN}</span>` : ''}</a></li>`).join('');
  return `<div class="adm__top"><a class="logo" href="/">fennel<span>/</span>dental</a><span class="mono adm__role">${esc(roleLabel)}</span><button type="button" class="linkbtn2" data-switch>Switch role</button></div>
    <div class="adm__body"><nav class="adm__nav" aria-label="Admin"><ul>${nav}</ul></nav><main class="adm__main" id="adm-main">${body}</main></div>
    ${drawerHTML()}${A.undo ? `<div class="undo" role="status"><span>${esc(A.undo.text)}</span><button type="button" class="btn btn--beyaz btn--sm" data-undo>Undo</button></div>` : ''}${A.toast ? `<div class="undo" role="status"><span>${esc(A.toast)}</span></div>` : ''}`;
}

function roleScreen() {
  const dens = team.map((d) => `<button type="button" class="btn btn--yuzey" data-role="dentist" data-d="${d.slug}">${esc(d.name)}</button>`).join('');
  return `<div class="rolepick"><div class="etiket">[ ADMIN ]</div><h1 class="h-bolum">Who is using the panel?</h1>
    <div class="rolebtns"><button type="button" class="btn btn--kobalt big" data-role="reception">Reception</button><button type="button" class="btn btn--kobalt big" data-pick-dentist>Dentist</button><button type="button" class="btn btn--kobalt big" data-role="owner">Owner</button></div>
    <div class="dentpick" data-dentpick hidden><p class="fixed-line">Which dentist?</p><div class="btnrow">${dens}</div></div></div>`;
}

/* ───────── Today ───────── */
function bookingsFor(date: string) { return admin.day(date); }
function visibleDentists() {
  if (A.auth!.role === 'dentist' && !A.allDentists) return team.filter((d) => d.slug === A.auth!.dentist);
  return team;
}
function dayBounds(date: string): [number, number] | null {
  const h = getSettings().hours[dow(date)];
  return h ? [toMin(h.open), toMin(h.close)] : null;
}
const FLAG_ABBR: Record<string, string> = { 'first-visit': 'NEW', anxious: 'ANX', smoker: 'SMK', urgent: 'URG' };

function blockHTML(b: Booking, gs: number) {
  const top = ((toMin(b.time) - gs) / 15) * ROW;
  const h = (b.duration / 15) * ROW;
  const fl = b.flags.map((f) => FLAG_ABBR[f]).filter(Boolean).join(' ');
  const req = b.status === 'requested';
  return `<button type="button" class="blk${req ? ' is-req' : ''}${A.selected === b.id ? ' is-sel' : ''}${b.status === 'arrived' ? ' is-arr' : ''}${b.status === 'no-show' ? ' is-ns' : ''}" role="gridcell" data-blk="${b.id}" style="top:${top}px;height:${h - 2}px" aria-label="${esc(`${b.time} ${b.patient.name}, ${TREATMENT_NAMES[b.treatment]}, ${b.duration} minutes${req ? ', request' : ''}`)}">
    <span class="blk__n">${esc(b.patient.name)}</span><span class="blk__t">${esc(TREATMENT_NAMES[b.treatment])}</span>
    <span class="blk__m mono">${b.duration} min${fl ? ` · ${fl}` : ''}${req ? ' · REQUEST' : ''}${b.status === 'arrived' ? ' · ARRIVED' : b.status === 'no-show' ? ' · NO-SHOW' : ''}</span></button>`;
}

function todayView() {
  const date = A.date;
  const bd = dayBounds(date);
  const isToday = date === today();
  const head = `<div class="adm__bar"><div class="dnav"><button type="button" class="arrow" data-day="-1" aria-label="Previous day">←</button><h1 class="adm__h">${esc(DAY_LONG[dow(date)])} ${parseISO(date).getDate()} ${esc(dayLabel(date).split(' ')[2])}</h1><button type="button" class="arrow" data-day="1" aria-label="Next day">→</button><button type="button" class="btn btn--yuzey btn--sm" data-today>Today</button></div>
    <div class="seg" role="group" aria-label="View"><button type="button" class="seg__b" data-mode="dentist" aria-pressed="${A.mode === 'dentist'}">By dentist</button><button type="button" class="seg__b" data-mode="chair" aria-pressed="${A.mode === 'chair'}">By chair</button></div>
    ${A.auth!.role === 'dentist' ? `<label class="chkl"><input type="checkbox" data-alld ${A.allDentists ? 'checked' : ''}> All dentists</label>` : ''}</div>`;
  if (!bd) return head + '<p>The clinic is closed on this day.</p>';
  const [gs, ge] = bd;
  const rows = (ge - gs) / 15;
  const bs = bookingsFor(date);
  const cols = A.mode === 'dentist'
    ? visibleDentists().map((d) => ({ key: d.slug, label: d.name, sub: d.role, img: d.img, items: bs.filter((b) => b.dentist === d.slug), off: offRanges(date, d.slug, gs, ge) }))
    : CHAIRS.map((c) => ({ key: String(c), label: `Chair ${c}`, sub: '', img: '', items: bs.filter((b) => b.chair === c && (A.auth!.role !== 'dentist' || A.allDentists || b.dentist === A.auth!.dentist)), off: [] as [number, number][] }));
  const times = Array.from({ length: rows }, (_, i) => { const m = gs + i * 15; return `<div class="gt${m % 60 === 0 ? ' gt--h' : ''}" style="height:${ROW}px">${m % 60 === 0 ? fromMin(m) : ''}</div>`; }).join('');
  const lines = Array.from({ length: rows }, (_, i) => `<div class="gl${(gs + i * 15) % 60 === 0 ? ' gl--h' : ''}" style="height:${ROW}px"></div>`).join('');
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const colsHTML = cols.map((c) => `<div class="gcol" role="row" aria-label="${esc(c.label)}" data-col="${c.key}">
      <div class="gcol__h">${c.img ? `<img src="/img/ekip/${c.img}-320.webp" alt="" width="28" height="35">` : ''}<span><strong>${esc(c.label)}</strong>${c.sub ? `<br><span class="role-sm">${esc(c.sub)}</span>` : ''}</span></div>
      <div class="gcol__b" data-body style="height:${rows * ROW}px">${lines}
        ${c.off.map(([a, b]) => `<div class="goff" style="top:${((a - gs) / 15) * ROW}px;height:${((b - a) / 15) * ROW}px"></div>`).join('')}
        ${c.items.map((b) => blockHTML(b, gs)).join('')}
        ${isToday && nowM >= gs && nowM <= ge ? `<div class="gnow" style="top:${((nowM - gs) / 15) * ROW}px"></div>` : ''}
      </div></div>`).join('');
  const grid = `<div class="grid" role="grid" aria-label="Appointments" data-grid data-gs="${gs}"><div class="gtimes"><div class="gcol__h"></div><div>${times}</div></div><div class="gcols" style="grid-template-columns:repeat(${cols.length},minmax(150px,1fr))">${colsHTML}</div></div>`;
  return head + grid + mobileList(date, bs) + '<p class="fixed-line adm__hint">Drag a block to move it, or select it and use Move…</p>';
}

function offRanges(date: string, d: string, gs: number, ge: number): [number, number][] {
  const r = dentistRange(date, d);
  if (!r) return [[gs, ge]];
  const out: [number, number][] = [];
  if (r[0] > gs) out.push([gs, r[0]]);
  if (r[1] < ge) out.push([r[1], ge]);
  return out;
}

function mobileList(date: string, bs: Booking[]) {
  const dens = visibleDentists();
  const cur = A.mDentist && dens.some((d) => d.slug === A.mDentist) ? A.mDentist : dens[0].slug;
  const tabs = dens.length > 1 ? `<div class="mtabs" role="tablist">${dens.map((d) => `<button type="button" role="tab" class="ttab" data-mtab="${d.slug}" aria-selected="${d.slug === cur}">${esc(d.first)}</button>`).join('')}</div>` : '';
  const items = bs.filter((b) => b.dentist === cur).sort((a, b) => a.time.localeCompare(b.time));
  return `<div class="mlist">${tabs}${items.length ? `<ul>${items.map((b) => `<li><button type="button" class="mrow" data-blk="${b.id}"><span class="mono">${b.time}</span><span><strong>${esc(b.patient.name)}</strong><br>${esc(TREATMENT_NAMES[b.treatment])} · ${b.duration} min${b.status === 'requested' ? ' · REQUEST' : ''}</span></button></li>`).join('')}</ul>` : '<p>No appointments.</p>'}<button type="button" class="btn btn--yuzey" data-new>New appointment</button></div>`;
}

/* ───────── Çekmece (sağ panel) ───────── */
function timeOptions(sel: string, from = 8 * 60, to = 18 * 60) {
  let o = '';
  for (let m = from; m < to; m += 15) o += `<option value="${fromMin(m)}" ${fromMin(m) === sel ? 'selected' : ''}>${fromMin(m)}</option>`;
  return o;
}
function drawerHTML() {
  const d = A.drawer;
  if (!d) return '';
  let inner = '';
  if (d.type === 'booking') {
    const b = admin.all().find((x) => x.id === d.id);
    if (!b) return '';
    const fl = b.flags.length ? b.flags.map((f) => `<span class="flagbox mono">${esc(f.replace('-', ' ').toUpperCase())}</span>`).join(' ') : '<span class="mono">none</span>';
    const answers = !can.answers()
      ? '<p class="fixed-line">Visible to dentists only</p>'
      : b.consent && b.answers?.length
        ? `<ul class="ans-list">${b.answers.map((a) => `<li><span>${esc(a.q)}</span><strong>${esc(a.a)}</strong></li>`).join('')}</ul>`
        : '<p class="fixed-line">Answers not shared by patient</p>';
    inner = `<div class="etiket">[ ${b.status === 'requested' ? 'REQUEST' : b.status.toUpperCase()} ]</div>
      <h2 class="sub-h" id="dr-h" tabindex="-1">${esc(b.patient.name)}</h2>
      <dl class="sumcard sumcard--flat"><div><dt>When</dt><dd>${esc(dayLabel(b.date))} ${b.time}</dd></div><div><dt>Dentist</dt><dd>${esc(dentistName(b.dentist))} · Chair ${b.chair}</dd></div>
        <div><dt>Reason</dt><dd>${esc(b.reason ?? TREATMENT_NAMES[b.treatment])}</dd></div><div><dt>Suggested time</dt><dd class="mono">${b.duration} min</dd></div>
        <div><dt>Phone</dt><dd class="mono">${esc(b.patient.phone)}</dd></div><div><dt>Flags</dt><dd>${fl}</dd></div>
        <div class="col"><dt>Answers</dt><dd>${answers}</dd></div></dl>
      <label class="fld"><span>Notes</span><textarea data-notes rows="3">${esc(b.notes ?? '')}</textarea></label>
      ${b.note ? `<p class="fixed-line">${esc(b.note)}</p>` : ''}
      ${d.err ? `<p class="err">${esc(d.err)}</p>` : ''}
      ${d.confirmCancel ? `<div class="rowact"><span>Cancel this appointment?</span><button type="button" class="btn btn--kobalt btn--sm" data-cancel-yes>Yes, cancel</button><button type="button" class="btn btn--yuzey btn--sm" data-cancel-no>Keep it</button></div>`
        : `<div class="rowact"><button type="button" class="btn btn--yuzey btn--sm" data-move-open>Move…</button><button type="button" class="btn btn--yuzey btn--sm" data-cancel-ask>Cancel</button><button type="button" class="btn btn--yuzey btn--sm" data-status="arrived">Mark as arrived</button><button type="button" class="btn btn--yuzey btn--sm" data-status="no-show">No-show</button></div>`}`;
  } else if (d.type === 'move' || d.type === 'suggest') {
    const b = admin.all().find((x) => x.id === d.id)!;
    const dateV = d.date ?? b.date;
    inner = `<div class="etiket">[ ${d.type === 'move' ? 'MOVE' : 'SUGGEST ANOTHER TIME'} ]</div><h2 class="sub-h" id="dr-h" tabindex="-1">${esc(b.patient.name)}</h2>
      <form class="form" data-move-form novalidate>
        <label class="fld"><span>Day</span><input type="date" name="date" value="${dateV}" min="${today()}"></label>
        <label class="fld"><span>Time</span><select name="time">${timeOptions(d.time ?? b.time)}</select></label>
        ${d.type === 'move' ? `<label class="fld"><span>Dentist</span><select name="dentist">${team.map((t) => `<option value="${t.slug}" ${(d.dentist ?? b.dentist) === t.slug ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>` : ''}
        ${d.err ? `<p class="err">${esc(d.err)}</p>` : ''}
        <div class="rowact"><button type="submit" class="btn btn--kobalt btn--sm">${d.type === 'move' ? 'Move' : 'Send suggestion'}</button><button type="button" class="btn btn--yuzey btn--sm" data-back-b>Back</button></div></form>`;
  } else {
    const dentV = d.dentist ?? team[0].slug;
    inner = `<div class="etiket">[ NEW APPOINTMENT ]</div><h2 class="sub-h" id="dr-h" tabindex="-1">${esc(dayLabel(d.date ?? A.date))}</h2>
      <form class="form" data-new-form novalidate>
        <label class="fld"><span>Patient name</span><input name="name" required></label>
        <label class="fld"><span>Phone</span><input name="phone" type="tel" value="+353 "></label>
        <label class="fld"><span>Treatment</span><select name="treatment">${['examination', ...TREATMENT_ORDER].map((s) => `<option value="${s}">${esc(TREATMENT_NAMES[s])} (${getSettings().treatments[s].duration} min)</option>`).join('')}</select></label>
        <label class="fld"><span>Dentist</span><select name="dentist">${team.map((t) => `<option value="${t.slug}" ${dentV === t.slug ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
        <label class="fld"><span>Time</span><select name="time">${timeOptions(d.time ?? '09:00')}</select></label>
        ${d.err ? `<p class="err">${esc(d.err)}</p>` : ''}
        <div class="rowact"><button type="submit" class="btn btn--kobalt btn--sm">Save</button><button type="button" class="btn btn--yuzey btn--sm" data-close>Close</button></div></form>`;
  }
  return `<aside class="drawer" role="dialog" aria-label="Details"><button type="button" class="drawer__x" data-close aria-label="Close">×</button>${inner}</aside>`;
}

/* ───────── Week ───────── */
function weekView() {
  const w = admin.week(A.weekStart);
  const head = `<div class="adm__bar"><div class="dnav"><button type="button" class="arrow" data-wk="-7" aria-label="Previous week">←</button><h1 class="adm__h">Week of ${esc(dayLabel(A.weekStart))}</h1><button type="button" class="arrow" data-wk="7" aria-label="Next week">→</button></div></div>`;
  const rows = team.map((d) => `<tr><th scope="row">${esc(d.name)}</th>${w.days.map((day) => {
    const c = w.cells[day][d.slug];
    return `<td><button type="button" class="wcell" data-wd="${day}" ${c.avail ? '' : 'disabled'}><span class="mono">${c.avail ? `${c.pct}%` : '—'}</span><span class="wbar"><i style="width:${c.pct}%"></i></span></button></td>`;
  }).join('')}</tr>`).join('');
  return head + `<div class="feewrap"><table class="feetable wtable"><caption class="sr-only">Occupancy by dentist and day</caption><thead><tr><th scope="col">Dentist</th>${w.days.map((d) => `<th scope="col" class="num">${DAY_SHORT[dow(d)]} ${parseISO(d).getDate()}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    <dl class="totals"><div><dt>Appointments</dt><dd class="mono">${w.count}</dd></div><div><dt>Free hours</dt><dd class="mono">${w.freeHours}</dd></div><div><dt>Cancelled</dt><dd class="mono">${w.cancelled}</dd></div></dl>`;
}

/* ───────── Requests ───────── */
function sentAgo(b: Booking) {
  if (b.createdAt) { const h = Math.max(1, Math.round((Date.now() - b.createdAt) / 3600000)); return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`; }
  let h = 0; for (const c of b.id) h = (h * 31 + c.charCodeAt(0)) % 20; return `${h + 2} h ago`;
}
function requestsView() {
  const rs = admin.requests();
  const rows = rs.map((b) => {
    const decl = A.declining === b.id;
    return `<li class="apr"><div class="apr__main req__main"><span class="mono apr__when">${esc(dayLabel(b.date))} ${b.time}</span><span><strong>${esc(b.patient.name)}</strong><br>${esc(TREATMENT_NAMES[b.treatment])}</span><span>${esc(dentistName(b.dentist))}</span><span class="mono apr__s">${sentAgo(b)}</span></div>
      ${decl ? `<form class="rowact" data-decl-form="${b.id}"><label>Reason <select name="r">${REASONS.map((r) => `<option>${esc(r)}</option>`).join('')}</select></label><button type="submit" class="btn btn--kobalt btn--sm">Decline</button><button type="button" class="btn btn--yuzey btn--sm" data-decl-no>Back</button></form>`
        : `<div class="rowact"><button type="button" class="btn btn--kobalt btn--sm" data-approve="${b.id}">Approve</button><button type="button" class="btn btn--yuzey btn--sm" data-suggest="${b.id}">Suggest another time</button><button type="button" class="btn btn--yuzey btn--sm" data-decline="${b.id}">Decline</button></div>`}</li>`;
  }).join('');
  return `<div class="adm__bar"><h1 class="adm__h">Requests</h1></div>${rs.length ? `<ul class="aprs">${rows}</ul>` : '<p>No requests waiting.</p>'}`;
}

/* ───────── Waiting list ───────── */
function waitingView() {
  const w = getWaitlist();
  const rows = w.map((e) => {
    const state = e.status === 'offered' && e.offer ? `Offered ${e.offer.time} ${DAY_SHORT[dow(e.offer.date)]} — waiting for reply` : e.status === 'waiting' ? 'Waiting' : e.status === 'accepted' ? 'Accepted' : 'Declined';
    return `<li class="apr"><div class="apr__main req__main"><span><strong>${esc(e.name)}</strong><br><span class="mono">${esc(e.phone)}</span></span><span>${esc(e.treatment === 'any' ? 'Any treatment' : TREATMENT_NAMES[e.treatment] ?? e.treatment)}<br><span class="role-sm">${esc(e.pref)}</span></span><span class="mono">${esc(new Date(e.createdAt).toISOString().slice(0, 10))}</span><span class="mono apr__s">${esc(state)}</span></div>
      ${e.status === 'offered' ? `<div class="rowact"><span class="fixed-line">Simulate reply:</span><button type="button" class="btn btn--kobalt btn--sm" data-reply="${e.id}" data-acc="1">Accept</button><button type="button" class="btn btn--yuzey btn--sm" data-reply="${e.id}" data-acc="0">Decline</button></div>` : ''}</li>`;
  }).join('');
  return `<div class="adm__bar"><h1 class="adm__h">Waiting list</h1></div>${w.length ? `<ul class="aprs">${rows}</ul>` : '<p>Nobody is waiting.</p>'}<p class="fixed-line">When an appointment is cancelled, the first matching patient gets a text (demo).</p>`;
}

/* ───────── Settings ───────── */
function stepOpts(sel: string, from = 6 * 60, to = 21 * 60) { let o = ''; for (let m = from; m <= to; m += 15) o += `<option value="${fromMin(m)}" ${fromMin(m) === sel ? 'selected' : ''}>${fromMin(m)}</option>`; return o; }
function settingsView() {
  if (!A.draft) A.draft = JSON.parse(JSON.stringify(getSettings()));
  const s = A.draft!;
  const hours = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = s.hours[d];
    return `<tr><th scope="row">${DAY_LONG[d]}</th><td><label class="chkl"><input type="checkbox" data-hclosed="${d}" ${h ? '' : 'checked'}> Closed</label></td><td><select data-hopen="${d}" ${h ? '' : 'disabled'} aria-label="${DAY_LONG[d]} opens">${stepOpts(h?.open ?? '09:00')}</select></td><td><select data-hclose="${d}" ${h ? '' : 'disabled'} aria-label="${DAY_LONG[d]} closes">${stepOpts(h?.close ?? '17:00')}</select></td></tr>`;
  }).join('');
  const dens = team.map((t) => {
    const c = s.dentists[t.slug];
    return `<fieldset class="set-d"><legend>${esc(t.name)}</legend>
      <div class="chkrow">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label class="chkl"><input type="checkbox" data-dday="${t.slug}:${d}" ${c.days.includes(d) ? 'checked' : ''}> ${DAY_SHORT[d]}</label>`).join('')}</div>
      <div class="chkrow"><label>From <select data-dstart="${t.slug}">${stepOpts(c.start)}</select></label><label>To <select data-dend="${t.slug}">${stepOpts(c.end)}</select></label></div>
      <div class="chkrow">${['examination', ...TREATMENT_ORDER].map((tr) => `<label class="chkl"><input type="checkbox" data-dtr="${t.slug}:${tr}" ${c.treatments.includes(tr) ? 'checked' : ''}> ${esc(TREATMENT_NAMES[tr])}</label>`).join('')}</div></fieldset>`;
  }).join('');
  const trs = ['examination', ...TREATMENT_ORDER].map((sl) => {
    const t = s.treatments[sl];
    let durs = ''; for (let m = 15; m <= 150; m += 15) durs += `<option value="${m}" ${m === t.duration ? 'selected' : ''}>${m} min</option>`;
    return `<tr><th scope="row">${esc(TREATMENT_NAMES[sl])}</th><td><select data-tdur="${sl}" aria-label="Duration">${durs}</select></td>
      <td><label class="chkl"><input type="checkbox" role="switch" data-tmode="${sl}" ${t.mode === 'instant' ? 'checked' : ''}> ${t.mode === 'instant' ? 'Instant' : 'Request'}</label></td>
      <td><input class="fee-in mono" data-tmin="${sl}" value="${esc(t.min)}" aria-label="Lowest fee"></td><td><input class="fee-in mono" data-tmax="${sl}" value="${esc(t.max)}" aria-label="Highest fee"></td></tr>`;
  }).join('');
  const roles = '<table class="feetable"><thead><tr><th>Role</th><th>Can do</th></tr></thead><tbody><tr><th scope="row">Reception</th><td>Calendar, create/move/cancel, requests, waiting list. Cannot see patient answers.</td></tr><tr><th scope="row">Dentist</th><td>Own column, own patients’ summary and answers (if the patient agreed).</td></tr><tr><th scope="row">Owner</th><td>Everything, settings, week view, activity.</td></tr></tbody></table>';
  return `<div class="adm__bar"><h1 class="adm__h">Settings</h1></div>
    <section class="set"><h2 class="sub-h">Opening hours</h2><div class="feewrap"><table class="feetable"><tbody>${hours}</tbody></table></div></section>
    <section class="set"><h2 class="sub-h">Dentists</h2>${dens}</section>
    <section class="set"><h2 class="sub-h">Treatments</h2><div class="feewrap"><table class="feetable"><thead><tr><th>Treatment</th><th>Duration</th><th>Mode</th><th>Lowest fee</th><th>Highest fee</th></tr></thead><tbody>${trs}</tbody></table></div></section>
    <section class="set"><h2 class="sub-h">Roles</h2>${roles}</section>
    <div class="savebar"><span class="fixed-line">${A.dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span><button type="button" class="btn btn--yuzey btn--sm" data-discard ${A.dirty ? '' : 'disabled'}>Discard</button><button type="button" class="btn btn--kobalt btn--sm" data-save ${A.dirty ? '' : 'disabled'}>Save changes</button></div>`;
}

function activityView() {
  const log = getLog();
  return `<div class="adm__bar"><h1 class="adm__h">Activity</h1></div>${log.length ? `<ul class="log">${log.map((e) => `<li><span class="mono">${esc(new Date(e.t).toISOString().replace('T', ' ').slice(0, 19))}</span><span>${esc(e.text)}</span></li>`).join('')}</ul>` : '<p>No activity yet.</p>'}`;
}

/* ───────── Çizim ───────── */
let lastFocusSel = '';
function render() {
  if (!A.auth) { root.innerHTML = roleScreen(); return; }
  if (!can.view(A.view)) A.view = 'today';
  const body = A.view === 'today' ? todayView() : A.view === 'week' ? weekView() : A.view === 'requests' ? requestsView() : A.view === 'waiting' ? waitingView() : A.view === 'settings' ? settingsView() : activityView();
  const focused = document.activeElement as HTMLElement | null;
  lastFocusSel = focused?.dataset?.blk ? `[data-blk="${focused.dataset.blk}"]` : '';
  root.innerHTML = shell(body);
  if (lastFocusSel) q<HTMLElement>(lastFocusSel, root)?.focus();
  const reset = q('[data-reset-slot]');
  if (reset) reset.innerHTML = A.resetAsk ? '<span class="mono">Reset demo data? <button type="button" class="linkbtn2 mono" data-reset-yes>Yes</button> · <button type="button" class="linkbtn2 mono" data-reset-no>No</button></span>' : '<button type="button" class="linkbtn2 mono" data-reset>Reset demo data</button>';
}

function toast(t: string) { A.toast = t; render(); setTimeout(() => { A.toast = ''; render(); }, 3000); }
function setUndo(id: string, prev: { date: string; time: string; dentist: string; chair: number }, text: string) {
  A.undo = { id, prev, text };
  clearTimeout(A.undoTimer);
  A.undoTimer = window.setTimeout(() => { A.undo = null; render(); }, 5000);
}
function doMove(id: string, to: { date: string; time: string; dentist?: string; chair?: number }) {
  const r = admin.move(id, to);
  const b = r.booking;
  setUndo(id, { date: r.previous.date, time: r.previous.time, dentist: r.previous.dentist, chair: r.previous.chair }, `Moved to ${b.time} · ${dShort(b.dentist)}`);
  return r;
}

/* ───────── Sürükle-bırak ───────── */
let drag: null | { id: string; el: HTMLElement; ghost: HTMLElement; sx: number; sy: number; offY: number; active: boolean; target: null | { date: string; time: string; dentist?: string; chair?: number; ok: boolean; colEl: HTMLElement; top: number } } = null;

root.addEventListener('pointerdown', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('.blk');
  if (!el || e.button !== 0) return;
  const r = el.getBoundingClientRect();
  drag = { id: el.dataset.blk!, el, ghost: el, sx: e.clientX, sy: e.clientY, offY: e.clientY - r.top, active: false, target: null };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
});
function onMove(e: PointerEvent) {
  if (!drag) return;
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
    drag.active = true;
    const g = drag.el.cloneNode(true) as HTMLElement;
    g.classList.add('ghost');
    g.style.width = `${drag.el.offsetWidth}px`; g.style.height = `${drag.el.offsetHeight}px`;
    document.body.appendChild(g);
    drag.ghost = g;
    drag.el.classList.add('is-drag');
  }
  const g = drag.ghost;
  g.style.left = `${e.clientX - drag.el.offsetWidth / 2}px`;
  g.style.top = `${e.clientY - drag.offY}px`;
  // hedef sütun ve saat
  qa('.drop', root).forEach((d) => d.remove());
  drag.target = null;
  const cols = qa<HTMLElement>('.gcol', root);
  const col = cols.find((c) => { const r = c.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right; });
  const grid = q<HTMLElement>('[data-grid]', root);
  if (!col || !grid) return;
  const body = q<HTMLElement>('[data-body]', col)!;
  const br = body.getBoundingClientRect();
  const gs = Number(grid.dataset.gs);
  const rowIdx = Math.round((e.clientY - drag.offY - br.top) / ROW);
  const b = admin.all().find((x) => x.id === drag!.id)!;
  const min = gs + Math.max(0, rowIdx) * 15;
  const time = fromMin(min);
  const to: { date: string; time: string; dentist?: string; chair?: number } = A.mode === 'dentist' ? { date: A.date, time, dentist: col.dataset.col } : { date: A.date, time, chair: Number(col.dataset.col) };
  const ok = admin.canMove(b.id, to);
  const top = Math.max(0, rowIdx) * ROW;
  const dz = document.createElement('div');
  dz.className = `drop ${ok ? 'drop--ok' : 'drop--busy'}`;
  dz.style.top = `${top}px`; dz.style.height = `${(b.duration / 15) * ROW - 2}px`;
  dz.textContent = ok ? time : 'busy';
  body.appendChild(dz);
  drag.target = { ...to, ok, colEl: col, top };
}
function onUp() {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  const d = drag; drag = null;
  if (!d) return;
  if (!d.active) { openBooking(d.id); return; }
  d.ghost.remove();
  qa('.drop', root).forEach((x) => x.remove());
  d.el.classList.remove('is-drag');
  const cur = admin.all().find((x) => x.id === d.id);
  const same = !!cur && d.target && cur.time === d.target.time && (d.target.dentist ? cur.dentist === d.target.dentist : true) && (d.target.chair ? cur.chair === d.target.chair : true);
  if (d.target?.ok && !same) { try { doMove(d.id, d.target); } catch { /* busy */ } }
  render();
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
}
let suppressClick = false;

function openBooking(id: string) {
  A.selected = id;
  A.drawer = { type: 'booking', id };
  render();
  q('#dr-h', root)?.focus();
}

/* ───────── Olaylar ───────── */
root.addEventListener('click', (e) => {
  if (suppressClick) return;
  const t = e.target as HTMLElement;
  const role = t.closest<HTMLElement>('[data-role]');
  if (role) {
    A.auth = { role: role.dataset.role as Role, dentist: role.dataset.d };
    if (A.auth.role === 'dentist') A.mDentist = A.auth.dentist!;
    try { sessionStorage.setItem(KEY, JSON.stringify(A.auth)); } catch { /* yok */ }
    A.view = 'today';
    location.hash = 'today';
    render(); q('#adm-main', root)?.focus(); return;
  }
  if (t.closest('[data-pick-dentist]')) { q('[data-dentpick]', root)!.hidden = false; return; }
  if (t.closest('[data-switch]')) { A.auth = null; A.drawer = null; try { sessionStorage.removeItem(KEY); } catch { /* yok */ } render(); return; }
  if (t.closest('[data-close]')) { A.drawer = null; A.selected = null; render(); return; }
  if (t.closest('[data-undo]') && A.undo) {
    try { admin.move(A.undo.id, A.undo.prev); } catch { /* artık mümkün değil */ }
    A.undo = null; clearTimeout(A.undoTimer); render(); return;
  }
  const day = t.closest<HTMLElement>('[data-day]');
  if (day) { A.date = addDays(A.date, Number(day.dataset.day)); A.drawer = null; render(); return; }
  if (t.closest('[data-today]')) { A.date = today(); render(); return; }
  const mode = t.closest<HTMLElement>('[data-mode]');
  if (mode) { A.mode = mode.dataset.mode as 'dentist' | 'chair'; render(); return; }
  const mt = t.closest<HTMLElement>('[data-mtab]');
  if (mt) { A.mDentist = mt.dataset.mtab!; render(); return; }
  const blk = t.closest<HTMLElement>('[data-blk]');
  if (blk && !blk.classList.contains('blk')) { openBooking(blk.dataset.blk!); return; }
  if (blk && blk.classList.contains('blk') && e.detail === 0) { openBooking(blk.dataset.blk!); return; } // klavye (Enter)
  // boş dilime tıklama → yeni randevu
  const body = t.closest<HTMLElement>('[data-body]');
  if (body && !t.closest('.blk')) {
    const col = body.closest<HTMLElement>('.gcol')!;
    const grid = q<HTMLElement>('[data-grid]', root)!;
    const row = Math.floor((e.clientY - body.getBoundingClientRect().top) / ROW);
    const time = fromMin(Number(grid.dataset.gs) + row * 15);
    A.drawer = { type: 'new', date: A.date, time, dentist: A.mode === 'dentist' ? col.dataset.col : undefined, chair: A.mode === 'chair' ? Number(col.dataset.col) : undefined };
    render(); q('#dr-h', root)?.focus(); return;
  }
  if (t.closest('[data-new]')) { A.drawer = { type: 'new', date: A.date, time: '09:00', dentist: A.mDentist || undefined }; render(); q('#dr-h', root)?.focus(); return; }
  if (t.closest('[data-move-open]')) { A.drawer = { type: 'move', id: A.drawer!.id }; render(); q('#dr-h', root)?.focus(); return; }
  if (t.closest('[data-back-b]')) { A.drawer = { type: 'booking', id: A.drawer!.id }; render(); return; }
  if (t.closest('[data-cancel-ask]')) { A.drawer!.confirmCancel = true; render(); return; }
  if (t.closest('[data-cancel-no]')) { A.drawer!.confirmCancel = false; render(); return; }
  if (t.closest('[data-cancel-yes]')) { admin.cancel(A.drawer!.id!); A.drawer = null; A.selected = null; render(); return; }
  const st = t.closest<HTMLElement>('[data-status]');
  if (st) { admin.setStatus(A.drawer!.id!, st.dataset.status as Booking['status']); render(); return; }
  const wk = t.closest<HTMLElement>('[data-wk]');
  if (wk) { A.weekStart = addDays(A.weekStart, Number(wk.dataset.wk)); render(); return; }
  const wd = t.closest<HTMLElement>('[data-wd]');
  if (wd) { A.date = wd.dataset.wd!; location.hash = 'today'; return; }
  const ap = t.closest<HTMLElement>('[data-approve]');
  if (ap) { admin.approve(ap.dataset.approve!); toast('Approved. SMS sent (demo).'); return; }
  const su = t.closest<HTMLElement>('[data-suggest]');
  if (su) { const b = admin.all().find((x) => x.id === su.dataset.suggest)!; A.drawer = { type: 'suggest', id: b.id, date: b.date, time: b.time }; render(); q('#dr-h', root)?.focus(); return; }
  const de = t.closest<HTMLElement>('[data-decline]');
  if (de) { A.declining = de.dataset.decline!; render(); return; }
  if (t.closest('[data-decl-no]')) { A.declining = ''; render(); return; }
  const rp = t.closest<HTMLElement>('[data-reply]');
  if (rp) { simulateReply(rp.dataset.reply!, rp.dataset.acc === '1'); render(); return; }
  if (t.closest('[data-save]') && A.draft) { saveSettings(A.draft); A.dirty = false; A.draft = null; toast('Settings saved.'); return; }
  if (t.closest('[data-discard]')) { A.draft = null; A.dirty = false; render(); return; }
});

root.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement | HTMLSelectElement;
  if (t.matches('[data-alld]')) { A.allDentists = (t as HTMLInputElement).checked; render(); return; }
  if (!A.draft) return;
  const s = A.draft;
  const ds = t.dataset;
  const mark = () => { A.dirty = true; render(); };
  if (ds.hclosed) { const d = ds.hclosed; s.hours[d] = (t as HTMLInputElement).checked ? null : { open: '09:00', close: '17:00' }; mark(); }
  else if (ds.hopen) { s.hours[ds.hopen]!.open = t.value; mark(); }
  else if (ds.hclose) { s.hours[ds.hclose]!.close = t.value; mark(); }
  else if (ds.dday) { const [d, n] = ds.dday.split(':'); const c = s.dentists[d]; const day = Number(n); c.days = (t as HTMLInputElement).checked ? [...new Set([...c.days, day])] : c.days.filter((x) => x !== day); mark(); }
  else if (ds.dstart) { s.dentists[ds.dstart].start = t.value; mark(); }
  else if (ds.dend) { s.dentists[ds.dend].end = t.value; mark(); }
  else if (ds.dtr) { const [d, tr] = ds.dtr.split(':'); const c = s.dentists[d]; c.treatments = (t as HTMLInputElement).checked ? [...new Set([...c.treatments, tr])] : c.treatments.filter((x) => x !== tr); mark(); }
  else if (ds.tdur) { s.treatments[ds.tdur].duration = Number(t.value); mark(); }
  else if (ds.tmode) { s.treatments[ds.tmode].mode = (t as HTMLInputElement).checked ? 'instant' : 'request'; mark(); }
  else if (ds.tmin) { s.treatments[ds.tmin].min = t.value; mark(); }
  else if (ds.tmax) { s.treatments[ds.tmax].max = t.value; mark(); }
});
root.addEventListener('focusout', (e) => {
  const t = e.target as HTMLElement;
  if (t.matches('[data-notes]') && A.drawer?.id) admin.setNotes(A.drawer.id, (t as HTMLTextAreaElement).value);
});

root.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target as HTMLFormElement;
  const fd = new FormData(f);
  if (f.matches('[data-new-form]')) {
    const name = String(fd.get('name') || '').trim();
    if (!name) { A.drawer!.err = 'Enter a name.'; render(); return; }
    try {
      const b = admin.create({ treatment: String(fd.get('treatment')), dentist: String(fd.get('dentist')), date: A.drawer!.date ?? A.date, time: String(fd.get('time')), name, phone: String(fd.get('phone')), chair: A.drawer!.chair });
      A.drawer = { type: 'booking', id: b.id }; A.selected = b.id; render();
    } catch { A.drawer!.err = 'That time is taken or outside working hours.'; render(); }
    return;
  }
  if (f.matches('[data-move-form]')) {
    const id = A.drawer!.id!;
    const to = { date: String(fd.get('date')), time: String(fd.get('time')), dentist: fd.get('dentist') ? String(fd.get('dentist')) : undefined };
    try {
      if (A.drawer!.type === 'suggest') { admin.suggest(id, to); A.drawer = null; toast('Suggestion sent (demo SMS).'); }
      else { doMove(id, to); A.date = to.date; A.drawer = { type: 'booking', id }; render(); }
    } catch { A.drawer!.err = 'That time is taken or outside working hours.'; A.drawer!.date = to.date; A.drawer!.time = to.time; render(); }
    return;
  }
  const dec = (f.dataset.declForm);
  if (dec) { admin.decline(dec, String(fd.get('r'))); A.declining = ''; toast('Declined.'); }
});

// Klavye: bloklar arası gezinme
root.addEventListener('keydown', (e) => {
  const ev = e as KeyboardEvent;
  const t = ev.target as HTMLElement;
  if (ev.key === 'Escape' && A.drawer) { A.drawer = null; render(); return; }
  if (!t.matches('.blk')) return;
  const col = t.closest<HTMLElement>('.gcol')!;
  const same = qa<HTMLElement>('.blk', col);
  const cols = qa<HTMLElement>('.gcol', root);
  let next: HTMLElement | undefined;
  if (ev.key === 'ArrowDown') next = same[same.indexOf(t) + 1];
  else if (ev.key === 'ArrowUp') next = same[same.indexOf(t) - 1];
  else if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
    const other = cols[cols.indexOf(col) + (ev.key === 'ArrowRight' ? 1 : -1)];
    if (other) { const top = t.offsetTop; next = qa<HTMLElement>('.blk', other).sort((a, b) => Math.abs(a.offsetTop - top) - Math.abs(b.offsetTop - top))[0]; }
  }
  if (next) { ev.preventDefault(); next.focus(); }
});

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-reset]')) { A.resetAsk = true; render(); return; }
  if (t.closest('[data-reset-no]')) { A.resetAsk = false; render(); return; }
  if (t.closest('[data-reset-yes]')) { resetDemo(); A.resetAsk = false; A.draft = null; A.dirty = false; A.drawer = null; render(); }
});

window.addEventListener('beforeunload', (e) => { if (A.dirty) { e.preventDefault(); } });
window.addEventListener('hashchange', route);
function route() {
  const h = location.hash.replace('#', '') as View;
  if (A.dirty && A.view === 'settings' && h !== 'settings' && !confirm('Discard unsaved changes?')) { location.hash = 'settings'; return; }
  if (['today', 'week', 'requests', 'waiting', 'settings', 'activity'].includes(h)) { if (h !== A.view) { A.dirty = false; A.draft = null; } A.view = h; A.drawer = null; }
  render();
}
onChange(() => { if (!drag && !(document.activeElement as HTMLElement | null)?.matches('input,textarea,select')) render(); });
setInterval(() => { if (A.auth && A.view === 'today' && A.date === today() && !drag) render(); }, 60000);
void availabilitySync; void defaultSettings; void TREATMENT_ORDER;
route();
