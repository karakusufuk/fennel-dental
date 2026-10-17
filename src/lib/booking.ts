/**
 * Demo randevu katmanı. Sitenin geri kalanı randevuyla ilgili HER ŞEYİ sadece buradan yapar.
 * Gerçek sunucu bağlanınca yalnız bu dosya değişir. Gerçek SMS / e-posta / veritabanı yok.
 *
 * - Async API (site): getTreatments, getDentists, getAvailability, sendCode, verifyCode,
 *   createBooking, listBookings, cancelBooking, rescheduleBooking, joinWaitlist
 * - Senkron `admin` nesnesi: panelin kullandığı okuma/yazma işlemleri
 */
import { team } from '../data/team';
import { TREATMENT_PRICE, eur } from '../data/prices';

export type Status = 'confirmed' | 'requested' | 'cancelled' | 'arrived' | 'no-show';
export type Mode = 'instant' | 'request';

export interface Booking {
  id: string;
  treatment: string;
  dentist: string;
  chair: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  status: Status;
  patient: { name: string; phone: string; email?: string };
  flags: string[]; // first-visit anxious smoker urgent
  reason?: string;
  answers?: { q: string; a: string }[];
  consent?: boolean;
  notes?: string;
  note?: string; // sistem notu (ör. önerilen saat)
  createdAt: number;
  source: 'seed' | 'site' | 'admin';
}

export interface Settings {
  hours: Record<string, { open: string; close: string } | null>; // 0=Sun..6=Sat
  dentists: Record<string, { days: number[]; start: string; end: string; treatments: string[] }>;
  treatments: Record<string, { duration: number; mode: Mode; min: string; max: string }>;
}

export interface WaitEntry {
  id: string;
  name: string;
  phone: string;
  treatment: string;
  pref: string;
  createdAt: number;
  status: 'waiting' | 'offered' | 'accepted' | 'declined';
  offer?: { date: string; time: string; dentist: string; treatment: string };
  /** Serbest metin notu ('Can't find a time that works?'): otomatik SMS eşleşmesi yok, resepsiyon arar */
  kind?: 'note';
  dentist?: string;
  note?: string;
  called?: boolean;
}

export const CHAIRS = [1, 2, 3];
export const KEYS = {
  bookings: 'fennel-demo-bookings',
  settings: 'fennel-demo-settings',
  waitlist: 'fennel-demo-waitlist',
  log: 'fennel-demo-log',
  seeded: 'fennel-demo-seeded',
};

/* ───────── Tedaviler ───────── */
export const TREATMENT_NAMES: Record<string, string> = {
  examination: 'Not sure — book an examination',
  'check-up-and-clean': 'Check-up and clean',
  fillings: 'Fillings',
  'root-canal': 'Root canal',
  implants: 'Implants',
  'braces-and-aligners': 'Braces and clear aligners',
  whitening: 'Whitening',
  'crowns-and-veneers': 'Crowns and veneers',
  emergency: 'Emergency care',
};
export const TREATMENT_ORDER = ['check-up-and-clean', 'fillings', 'root-canal', 'implants', 'braces-and-aligners', 'whitening', 'crowns-and-veneers', 'emergency'];

const DUR: Record<string, [number, Mode]> = {
  examination: [30, 'instant'], 'check-up-and-clean': [45, 'instant'], fillings: [45, 'instant'], 'root-canal': [75, 'instant'],
  implants: [45, 'request'], 'braces-and-aligners': [45, 'request'], whitening: [30, 'instant'], 'crowns-and-veneers': [30, 'request'], emergency: [30, 'instant'],
};
export const DEFAULT_TREATMENTS: Settings['treatments'] = Object.fromEntries(
  Object.entries(DUR).map(([k, [duration, mode]]) => [k, { duration, mode, min: eur(TREATMENT_PRICE[k][0]), max: eur(TREATMENT_PRICE[k][1]) }]),
);

const DENTIST_TREATMENTS: Record<string, string[]> = {
  'aoife-murphy': ['examination', 'check-up-and-clean', 'fillings', 'root-canal', 'emergency'],
  'conor-walsh': ['examination', 'braces-and-aligners'],
  'siobhan-byrne': ['examination', 'check-up-and-clean', 'fillings', 'whitening', 'crowns-and-veneers'],
  'daniel-oconnor': ['examination', 'root-canal', 'implants', 'crowns-and-veneers', 'emergency'],
};

export function defaultSettings(): Settings {
  const hours: Settings['hours'] = {};
  for (let d = 0; d < 7; d++) hours[d] = d === 0 ? null : d === 6 ? { open: '09:00', close: '13:00' } : { open: '08:30', close: '17:30' };
  const dentists: Settings['dentists'] = {};
  for (const t of team) dentists[t.slug] = { days: [1, 2, 3, 4, 5, 6], start: '08:30', end: '17:30', treatments: [...DENTIST_TREATMENTS[t.slug]] };
  return { hours, dentists, treatments: JSON.parse(JSON.stringify(DEFAULT_TREATMENTS)) };
}

/* ───────── Depolama (localStorage; yoksa bellek) ───────── */
const mem: Record<string, string> = {};
function load<T>(key: string, def: () => T): T {
  try {
    const v = localStorage.getItem(key);
    if (v) return JSON.parse(v) as T;
  } catch { /* kullanılamıyor */ }
  if (key in mem) { try { return JSON.parse(mem[key]) as T; } catch { /* boz */ } }
  return def();
}
function save(key: string, value: unknown) {
  const s = JSON.stringify(value);
  mem[key] = s;
  try { localStorage.setItem(key, s); } catch { /* bellekte kalır */ }
  listeners.forEach((f) => f());
}
const listeners = new Set<() => void>();
export function onChange(cb: () => void) {
  listeners.add(cb);
  try { window.addEventListener('storage', cb); } catch { /* yok */ }
  return () => { listeners.delete(cb); try { window.removeEventListener('storage', cb); } catch { /* yok */ } };
}

/* ───────── Tarih yardımcıları ───────── */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
export const dow = (s: string) => parseISO(s).getDay();
export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const fromMin = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
export const today = () => iso(new Date());
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const dayLabel = (s: string) => `${DAY_SHORT[dow(s)]} ${parseISO(s).getDate()} ${MONTH_SHORT[parseISO(s).getMonth()]}`;

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/* ───────── Ayarlar, kayıtlar, günlük ───────── */
export function getSettings(): Settings {
  const st = load(KEYS.settings, defaultSettings);
  // eski demo verisindeki [MIN]/[MAX]/[FEE] yer tutucuları gerçek fiyata çevrilir
  for (const [k, t] of Object.entries(st.treatments)) {
    if (/\[/.test(t.min) || /\[/.test(t.max)) { t.min = DEFAULT_TREATMENTS[k].min; t.max = DEFAULT_TREATMENTS[k].max; }
  }
  return st;
}
export function saveSettings(s: Settings) { save(KEYS.settings, s); logEvent('Settings saved'); }
const FIRST = ['Niamh', 'Cian', 'Aoibhinn', 'Sean', 'Roisin', 'Eoin', 'Grainne', 'Darragh', 'Ciara', 'Padraig', 'Saoirse', 'Fionn', 'Maeve', 'Oisin', 'Aisling', 'Tadhg'];
const LAST = ['Doyle', 'Kelly', 'Brennan', 'Quinn', 'Nolan', 'Gallagher', 'Burke', 'Daly', 'Kavanagh', 'Fitzgerald', 'Moran', 'Hickey'];

function allRaw(): Booking[] { return load<Booking[]>(KEYS.bookings, () => []); }
function saveBookings(b: Booking[]) { save(KEYS.bookings, b); }

export function logEvent(text: string) {
  const log = load<{ t: number; text: string }[]>(KEYS.log, () => []);
  log.unshift({ t: Date.now(), text });
  save(KEYS.log, log.slice(0, 100));
}
export function getLog() { return load<{ t: number; text: string }[]>(KEYS.log, () => []); }

/** Bir günün sahte takvimi: tohum = tarih, her yüklemede aynı. */
function seedDay(date: string, st: Settings): Booking[] {
  const out: Booking[] = [];
  const h = st.hours[dow(date)];
  if (!h) return out;
  const chairBusy: Record<number, [number, number][]> = { 1: [], 2: [], 3: [] };
  for (const d of team) {
    const cfg = st.dentists[d.slug];
    if (!cfg.days.includes(dow(date))) continue;
    const r = rng(date + d.slug);
    const start = Math.max(toMin(h.open), toMin(cfg.start));
    const end = Math.min(toMin(h.close), toMin(cfg.end));
    let c = start;
    let i = 0;
    while (c < end - 30) {
      if (r() < 0.52) {
        const tr = cfg.treatments.filter((t) => t !== 'examination');
        const slug = tr[Math.floor(r() * tr.length)];
        const dur = st.treatments[slug].duration;
        if (c + dur <= end) {
          const chair = CHAIRS.find((k) => chairBusy[k].every(([a, b]) => c >= b || c + dur <= a));
          if (chair) {
            chairBusy[chair].push([c, c + dur]);
            const flags: string[] = [];
            if (r() < 0.2) flags.push('first-visit');
            if (r() < 0.15) flags.push('anxious');
            if (r() < 0.1) flags.push('smoker');
            const requested = st.treatments[slug].mode === 'request' && r() < 0.12 && date > today();
            out.push({
              id: `seed-${date}-${d.slug}-${i++}`,
              treatment: slug, dentist: d.slug, chair, date, time: fromMin(c), duration: dur,
              status: requested ? 'requested' : 'confirmed',
              patient: { name: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`, phone: '+353 8X XXX XXXX' },
              flags, reason: TREATMENT_NAMES[slug], createdAt: 0, source: 'seed',
            });
            c += Math.ceil(dur / 15) * 15;
            continue;
          }
        }
      }
      c += 15 * (1 + Math.floor(r() * 3));
    }
  }
  return out;
}

export function ensureSeed() {
  const done = new Set(load<string[]>(KEYS.seeded, () => []));
  const st = getSettings();
  const add: Booking[] = [];
  const t = today();
  for (let i = 0; i <= 21; i++) {
    const d = addDays(t, i);
    if (done.has(d)) continue;
    add.push(...seedDay(d, st));
    done.add(d);
  }
  if (!add.length) return;
  const existing = allRaw();
  const have = new Set(existing.map((b) => b.id));
  const all = existing.concat(add.filter((b) => !have.has(b.id)));
  mem[KEYS.seeded] = JSON.stringify([...done]);
  try { localStorage.setItem(KEYS.seeded, JSON.stringify([...done])); } catch { /* bellek */ }
  mem[KEYS.bookings] = JSON.stringify(all);
  try { localStorage.setItem(KEYS.bookings, JSON.stringify(all)); } catch { /* bellek */ }
}

function bookings(): Booking[] { ensureSeed(); return allRaw(); }
const live = (b: Booking) => b.status !== 'cancelled';

export function resetDemo() {
  for (const k of Object.values(KEYS)) { delete mem[k]; try { localStorage.removeItem(k); } catch { /* yok */ } }
  listeners.forEach((f) => f());
}

/* ───────── Müsaitlik ───────── */
export function overlaps(b: { time: string; duration: number }, start: number, dur: number) {
  const s = toMin(b.time);
  return start < s + b.duration && start + dur > s;
}

export function isDentistFree(date: string, start: number, dur: number, dentist: string, exceptId?: string) {
  return !bookings().some((b) => live(b) && b.id !== exceptId && b.date === date && b.dentist === dentist && overlaps(b, start, dur));
}
export function freeChair(date: string, start: number, dur: number, exceptId?: string, prefer?: number): number | null {
  const bs = bookings().filter((b) => live(b) && b.id !== exceptId && b.date === date && overlaps(b, start, dur));
  const order = prefer ? [prefer, ...CHAIRS.filter((c) => c !== prefer)] : CHAIRS;
  return order.find((c) => !bs.some((b) => b.chair === c)) ?? null;
}
export function dentistRange(date: string, dentist: string): [number, number] | null {
  const st = getSettings();
  const h = st.hours[dow(date)];
  const cfg = st.dentists[dentist];
  if (!h || !cfg || !cfg.days.includes(dow(date))) return null;
  const a = Math.max(toMin(h.open), toMin(cfg.start));
  const b = Math.min(toMin(h.close), toMin(cfg.end));
  return a < b ? [a, b] : null;
}

export interface DaySlots { date: string; open: boolean; slots: { time: string; dentists: string[] }[] }

export function availabilitySync(opts: { treatment: string; dentist: string; from: string; days: number; duration?: number; exceptId?: string }): DaySlots[] {
  const st = getSettings();
  const dur = opts.duration ?? st.treatments[opts.treatment]?.duration ?? 30;
  const cands = opts.dentist === 'any'
    ? team.filter((d) => st.dentists[d.slug].treatments.includes(opts.treatment)).map((d) => d.slug)
    : [opts.dentist];
  const out: DaySlots[] = [];
  const t = today();
  for (let i = 0; i < opts.days; i++) {
    const date = addDays(opts.from, i);
    const map = new Map<string, string[]>();
    if (date >= t) {
      for (const dn of cands) {
        const rg = dentistRange(date, dn);
        if (!rg) continue;
        for (let m = rg[0]; m + dur <= rg[1]; m += 15) {
          if (date === t && m <= nowMin()) continue;
          if (!isDentistFree(date, m, dur, dn, opts.exceptId)) continue;
          if (freeChair(date, m, dur, opts.exceptId) === null) continue;
          const k = fromMin(m);
          map.set(k, [...(map.get(k) ?? []), dn]);
        }
      }
    }
    const slots = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([time, dentists]) => ({ time, dentists }));
    out.push({ date, open: !!st.hours[dow(date)], slots });
  }
  return out;
}

/* ───────── Site API (async, 300–600 ms) ───────── */
const wait = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 300));

export interface TreatmentInfo { slug: string; name: string; duration: number; mode: Mode; dentists: string[]; min: string; max: string }
export async function getTreatments(): Promise<TreatmentInfo[]> {
  await wait();
  return treatmentsSync();
}
export function treatmentsSync(): TreatmentInfo[] {
  const st = getSettings();
  return ['examination', ...TREATMENT_ORDER].map((slug) => ({
    slug, name: TREATMENT_NAMES[slug], duration: st.treatments[slug].duration, mode: st.treatments[slug].mode,
    min: st.treatments[slug].min, max: st.treatments[slug].max,
    dentists: team.filter((d) => st.dentists[d.slug].treatments.includes(slug)).map((d) => d.slug),
  }));
}
export async function getDentists(treatment?: string) {
  await wait();
  return dentistsSync(treatment);
}
export function dentistsSync(treatment?: string) {
  const st = getSettings();
  return team.filter((d) => !treatment || st.dentists[d.slug].treatments.includes(treatment));
}
export async function getAvailability(opts: { treatment: string; dentist: string; from: string; days: number; duration?: number; exceptId?: string }) {
  await wait();
  return availabilitySync(opts);
}
/** Ağ gecikmesi olmadan: sayfa içi küçük okumalar (ör. hekim profili "Next free slots"). */
export function nextSlots(dentist: string, treatment = 'examination', n = 3, duration?: number) {
  const out: { date: string; time: string }[] = [];
  for (const d of availabilitySync({ treatment, dentist, from: today(), days: 14, duration })) {
    for (const s of d.slots) { out.push({ date: d.date, time: s.time }); if (out.length >= n) return out; }
  }
  return out;
}
export function earliest(dentist: string, treatment: string, duration?: number) {
  return nextSlots(dentist, treatment, 1, duration)[0] ?? null;
}

const codes: Record<string, string> = {};
export const normPhone = (p: string) => p.replace(/\D/g, '').replace(/^353/, '').replace(/^0/, '');
export const phoneOk = (p: string) => /^\d{8,10}$/.test(normPhone(p));
export async function sendCode(phone: string): Promise<string> {
  await wait();
  const n = normPhone(phone);
  let h = 7;
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 900000;
  const code = String(100000 + h);
  codes[n] = code;
  logEvent(`Code sent to ${maskPhone(phone)} (demo)`);
  return code;
}
export async function verifyCode(phone: string, code: string) {
  await wait();
  return codes[normPhone(phone)] === code.trim();
}
export function maskPhone(p: string) {
  const n = normPhone(p);
  return n.length >= 8 ? `0${n.slice(0, 2)} XXX XXXX` : p;
}

export interface NewBooking {
  treatment: string; dentist: string; date: string; time: string;
  name: string; phone: string; email?: string; flags?: string[]; reason?: string;
  answers?: { q: string; a: string }[]; consent?: boolean; source?: 'site' | 'admin'; duration?: number; chair?: number;
}

export function createBookingSync(n: NewBooking): Booking {
  const st = getSettings();
  const dur = n.duration ?? st.treatments[n.treatment]?.duration ?? 30;
  const start = toMin(n.time);
  const cands = n.dentist === 'any'
    ? team.filter((d) => st.dentists[d.slug].treatments.includes(n.treatment)).map((d) => d.slug)
    : [n.dentist];
  const dentist = cands.find((d) => {
    const rg = dentistRange(n.date, d);
    return rg && start >= rg[0] && start + dur <= rg[1] && isDentistFree(n.date, start, dur, d);
  });
  if (!dentist) throw new Error('slot-taken');
  const chair = freeChair(n.date, start, dur, undefined, n.chair);
  if (chair === null) throw new Error('slot-taken');
  const mode = st.treatments[n.treatment]?.mode ?? 'instant';
  const b: Booking = {
    id: `b-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
    treatment: n.treatment, dentist, chair, date: n.date, time: n.time, duration: dur,
    status: n.source === 'admin' ? 'confirmed' : mode === 'request' ? 'requested' : 'confirmed',
    patient: { name: n.name, phone: n.phone, email: n.email },
    flags: n.flags ?? [], reason: n.reason ?? TREATMENT_NAMES[n.treatment],
    answers: n.consent ? n.answers : undefined, consent: !!n.consent,
    createdAt: Date.now(), source: n.source ?? 'site',
  };
  saveBookings(bookings().concat([b]));
  logEvent(`${b.status === 'requested' ? 'Request' : 'Booking'} created: ${b.patient.name}, ${TREATMENT_NAMES[b.treatment]}, ${dayLabel(b.date)} ${b.time}`);
  return b;
}
export async function createBooking(n: NewBooking) {
  await wait();
  const b = createBookingSync(n);
  return { id: b.id, status: b.status as 'confirmed' | 'requested', booking: b };
}

export async function listBookings(phone: string) {
  await wait();
  const p = normPhone(phone);
  return bookings().filter((b) => b.source !== 'seed' && normPhone(b.patient.phone) === p)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
export function getBooking(id: string) { return bookings().find((b) => b.id === id); }

function patch(id: string, fn: (b: Booking) => void) {
  const all = bookings();
  const b = all.find((x) => x.id === id);
  if (!b) throw new Error('not-found');
  fn(b);
  saveBookings(all);
  return b;
}

export function cancelSync(id: string, reason?: string) {
  const b = patch(id, (x) => { x.status = 'cancelled'; if (reason) x.note = reason; });
  logEvent(`Cancelled: ${b.patient.name}, ${dayLabel(b.date)} ${b.time}${reason ? ` (${reason})` : ''}`);
  offerSlot(b);
  return b;
}
export async function cancelBooking(id: string) { await wait(); return cancelSync(id); }

export function moveSync(id: string, to: { date: string; time: string; dentist?: string; chair?: number }) {
  const cur = getBooking(id);
  if (!cur) throw new Error('not-found');
  const dentist = to.dentist ?? cur.dentist;
  const start = toMin(to.time);
  const rg = dentistRange(to.date, dentist);
  if (!rg || start < rg[0] || start + cur.duration > rg[1]) throw new Error('busy');
  if (!isDentistFree(to.date, start, cur.duration, dentist, id)) throw new Error('busy');
  const chair = freeChair(to.date, start, cur.duration, id, to.chair ?? cur.chair);
  if (chair === null || (to.chair && chair !== to.chair)) throw new Error('busy');
  const old = { ...cur };
  const b = patch(id, (x) => { x.date = to.date; x.time = to.time; x.dentist = dentist; x.chair = chair; });
  logEvent(`Moved: ${b.patient.name}, ${dayLabel(old.date)} ${old.time} → ${dayLabel(b.date)} ${b.time}`);
  if (old.date !== b.date || old.time !== b.time) offerSlot(old);
  return { booking: b, previous: old };
}
/** Taşıma mümkün mü? (panelde sürüklerken; kaydetmez) */
export function canMove(id: string, to: { date: string; time: string; dentist?: string; chair?: number }) {
  const cur = getBooking(id);
  if (!cur) return false;
  const dentist = to.dentist ?? cur.dentist;
  const start = toMin(to.time);
  const rg = dentistRange(to.date, dentist);
  if (!rg || start < rg[0] || start + cur.duration > rg[1]) return false;
  if (!isDentistFree(to.date, start, cur.duration, dentist, id)) return false;
  const chair = freeChair(to.date, start, cur.duration, id, to.chair ?? cur.chair);
  return !(chair === null || (to.chair && chair !== to.chair));
}
export async function rescheduleBooking(id: string, slot: { date: string; time: string; dentist?: string }) {
  await wait();
  return moveSync(id, slot).booking;
}

/* ───────── Bekleme listesi ───────── */
function defaultWait(): WaitEntry[] {
  return [
    { id: 'w-1', name: 'Eimear Collins', phone: '+353 8X XXX XXXX', treatment: 'check-up-and-clean', pref: 'Mornings', createdAt: Date.now() - 86400000 * 3, status: 'waiting' },
    { id: 'w-2', name: 'Barry Lynch', phone: '+353 8X XXX XXXX', treatment: 'fillings', pref: 'Any weekday', createdAt: Date.now() - 86400000 * 2, status: 'waiting' },
    { id: 'w-3', name: 'Orla Mahony', phone: '+353 8X XXX XXXX', treatment: 'any', pref: 'Afternoons', createdAt: Date.now() - 86400000, status: 'waiting' },
    { id: 'w-4', kind: 'note', name: 'Fiona Healy', phone: '+353 8X XXX XXXX', treatment: 'fillings', dentist: 'aoife-murphy', pref: '', note: 'Weekday mornings before 10 work best.\nI can come at short notice.', createdAt: Date.now() - 3600000 * 5, status: 'waiting' },
  ];
}
export function getWaitlist(): WaitEntry[] { return load(KEYS.waitlist, defaultWait); }
function saveWait(w: WaitEntry[]) { save(KEYS.waitlist, w); }
export async function joinWaitlist(e: { name?: string; phone: string; treatment?: string; pref?: string }) {
  await wait();
  const w = getWaitlist();
  w.push({ id: `w-${Date.now().toString(36)}`, name: e.name || 'Patient', phone: e.phone, treatment: e.treatment || 'any', pref: e.pref || 'Any time', createdAt: Date.now(), status: 'waiting' });
  saveWait(w);
  logEvent(`Waiting list: ${e.name || 'Patient'} joined`);
}
/** "Can't find a time that works?" notu: bekleme listesine yazılır (SMS kodu yok, otomatik eşleşme yok). */
export async function addWaitingNote(e: { name: string; phone: string; treatment?: string; dentist?: string; note: string }) {
  await wait();
  const w = getWaitlist();
  w.push({ id: `w-${Date.now().toString(36)}`, kind: 'note', name: e.name, phone: e.phone, treatment: e.treatment || 'any', dentist: e.dentist && e.dentist !== 'any' ? e.dentist : undefined, pref: '', note: e.note, createdAt: Date.now(), status: 'waiting' });
  saveWait(w);
  logEvent(`Waiting note: ${e.name}`);
}
export function setNoteCalled(id: string, called: boolean) {
  const w = getWaitlist();
  const e = w.find((x) => x.id === id);
  if (!e) return;
  e.called = called;
  saveWait(w);
  logEvent(`${e.name}: ${called ? 'called' : 'call mark removed'}`);
}
function offerSlot(b: { date: string; time: string; dentist: string; treatment: string }) {
  if (b.date < today() || (b.date === today() && toMin(b.time) <= nowMin())) return;
  const w = getWaitlist();
  const e = w.find((x) => x.kind !== 'note' && x.status === 'waiting' && (x.treatment === 'any' || x.treatment === b.treatment));
  if (!e) return;
  e.status = 'offered';
  e.offer = { date: b.date, time: b.time, dentist: b.dentist, treatment: b.treatment };
  saveWait(w);
  logEvent(`SMS sent (demo) to ${e.name}: free slot ${dayLabel(b.date)} ${b.time}`);
}
export function simulateReply(id: string, accept: boolean) {
  const w = getWaitlist();
  const e = w.find((x) => x.id === id);
  if (!e || !e.offer) return;
  const offer = e.offer;
  if (accept) {
    try {
      createBookingSync({ treatment: offer.treatment, dentist: offer.dentist, date: offer.date, time: offer.time, name: e.name, phone: e.phone, source: 'admin' });
      e.status = 'accepted';
      logEvent(`${e.name} accepted ${dayLabel(offer.date)} ${offer.time} (waiting list)`);
    } catch {
      e.status = 'waiting'; e.offer = undefined;
      logEvent(`${e.name}: slot was taken before reply`);
    }
    saveWait(w);
  } else {
    e.status = 'declined';
    saveWait(w);
    logEvent(`${e.name} declined ${dayLabel(offer.date)} ${offer.time}`);
    offerSlot({ ...offer });
  }
}

/* ───────── .ics ───────── */
export function toIcs(b: Booking) {
  const d = b.date.replace(/-/g, '');
  const st = toMin(b.time);
  const f = (m: number) => `${d}T${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}00`;
  const dn = team.find((t) => t.slug === b.dentist)?.name ?? '';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fennel Dental//Demo//EN', 'BEGIN:VEVENT',
    `UID:${b.id}@fennel.demo`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${f(st)}`, `DTEND:${f(st + b.duration)}`,
    `SUMMARY:${TREATMENT_NAMES[b.treatment]} at Fennel Dental`, `DESCRIPTION:${dn}`, 'LOCATION:[STREET]\\, Dublin 4', 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

/* ───────── Panel (senkron) ───────── */
export const admin = {
  day(date: string) { return bookings().filter((b) => b.date === date && b.status !== 'cancelled'); },
  all() { return bookings(); },
  requests() { return bookings().filter((b) => b.status === 'requested').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); },
  create(n: NewBooking) { return createBookingSync({ ...n, source: 'admin' }); },
  move: moveSync,
  canMove,
  cancel: cancelSync,
  setStatus(id: string, status: Status) { const b = patch(id, (x) => { x.status = status; }); logEvent(`${b.patient.name}: ${status}`); return b; },
  setNotes(id: string, notes: string) { patch(id, (x) => { x.notes = notes; }); },
  approve(id: string) { const b = patch(id, (x) => { x.status = 'confirmed'; }); logEvent(`Approved: ${b.patient.name}, ${dayLabel(b.date)} ${b.time}. SMS sent (demo)`); return b; },
  suggest(id: string, to: { date: string; time: string }) {
    const r = moveSync(id, to);
    patch(id, (x) => { x.note = 'Alternative time suggested'; });
    logEvent(`Suggested ${dayLabel(to.date)} ${to.time} to ${r.booking.patient.name}. SMS sent (demo)`);
  },
  decline(id: string, reason: string) { return cancelSync(id, `Declined: ${reason}`); },
  week(start: string) {
    const st = getSettings();
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const cells: Record<string, Record<string, { pct: number; booked: number; avail: number }>> = {};
    let count = 0, freeMin = 0, cancelled = 0;
    for (const date of days) {
      cells[date] = {};
      for (const d of team) {
        const rg = dentistRange(date, d.slug);
        const avail = rg ? rg[1] - rg[0] : 0;
        const bs = bookings().filter((b) => b.date === date && b.dentist === d.slug);
        const booked = bs.filter(live).reduce((a, b) => a + b.duration, 0);
        cancelled += bs.filter((b) => b.status === 'cancelled').length;
        count += bs.filter(live).length;
        freeMin += Math.max(0, avail - booked);
        cells[date][d.slug] = { pct: avail ? Math.min(100, Math.round((booked / avail) * 100)) : 0, booked, avail };
      }
    }
    return { days, cells, count, freeHours: Math.round(freeMin / 6) / 10, cancelled, hours: st.hours };
  },
};
