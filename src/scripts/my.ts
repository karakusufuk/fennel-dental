import { listBookings, sendCode, verifyCode, cancelBooking, phoneOk, maskPhone, dayLabel, TREATMENT_NAMES, onChange, type Booking } from '../lib/booking';
import { team } from '../data/team';
import { esc, q, field } from './ui';
import { mountNote, noteState } from './waitnote';

const root = q('[data-my]')!;
const S = { phone: '+353 ', code: '', demo: '', sent: false, verified: false, list: [] as Booking[], confirm: '' as string, err: {} as Record<string, string>, busy: false, joined: false, loading: false };

function login() {
  return `<form class="form" data-form novalidate>
    <h2 class="q-h" id="my-h" tabindex="-1">Mobile number</h2>
    ${field('m-phone', 'Mobile number', { type: 'tel', value: S.phone, autocomplete: 'tel', error: S.err.phone })}
    <div class="fld"><button type="button" class="btn btn--yuzey" data-send ${S.busy ? 'disabled' : ''}>${S.sent ? 'Resend code' : 'Send code'}</button>
      ${S.demo ? `<p class="mono demo-code">Demo code: ${esc(S.demo)}</p>` : ''}</div>
    ${S.sent ? field('m-code', '6-digit code', { value: S.code, autocomplete: 'one-time-code', inputmode: 'numeric', maxlength: 6, error: S.err.code }) : ''}
    ${S.sent ? '<div class="btnrow"><button type="submit" class="btn btn--kobalt">Show my appointments →</button></div>' : ''}
  </form>`;
}

function row(b: Booking) {
  const gone = b.status === 'cancelled';
  const d = team.find((x) => x.slug === b.dentist);
  const label = gone ? 'CANCELLED' : b.status === 'requested' ? 'REQUESTED' : b.status === 'confirmed' ? 'CONFIRMED' : b.status.toUpperCase();
  const actions = gone ? '' : S.confirm === b.id
    ? `<div class="rowact"><span>Cancel this appointment?</span><button type="button" class="btn btn--kobalt btn--sm" data-yes="${b.id}">Yes, cancel</button><button type="button" class="btn btn--yuzey btn--sm" data-keep>Keep it</button></div>`
    : `<div class="rowact"><a class="btn btn--yuzey btn--sm" href="/book/?reschedule=${b.id}">Reschedule</a><button type="button" class="btn btn--yuzey btn--sm" data-cancel="${b.id}">Cancel</button></div>`;
  return `<li class="apr${gone ? ' is-gone' : ''}"><div class="apr__main">
    <span class="mono apr__when">${esc(dayLabel(b.date))} ${b.time}</span>
    <span class="apr__t">${esc(TREATMENT_NAMES[b.treatment])}</span>
    <span class="apr__d">${esc(d?.name ?? '')}</span>
    <span class="mono apr__s">${label}</span></div>${actions}</li>`;
}

function list() {
  const up = S.list;
  const rows = up.length
    ? `<ul class="aprs">${up.map(row).join('')}</ul>`
    : '<p>No upcoming appointments.</p><div class="btnrow"><a class="btn btn--kobalt" href="/book/">Book a visit →</a></div>';
  return `<h2 class="q-h" id="my-h" tabindex="-1">${esc(maskPhone(S.phone))}</h2>${rows}
    <div class="wait" data-note-slot></div>`;
}

function render(focus = false) {
  root.innerHTML = S.verified ? list() : login();
  const slot = q('[data-note-slot]', root);
  if (slot) { if (noteState.phone.trim() === '+353') noteState.phone = S.phone; mountNote(slot, () => ({}), { toggle: false }); }
  if (focus) q('#my-h', root)?.focus();
}

async function refresh() { S.list = await listBookings(S.phone); render(); }

root.addEventListener('click', async (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-send]')) {
    S.phone = q<HTMLInputElement>('#m-phone', root)?.value ?? S.phone;
    S.err = {};
    if (!phoneOk(S.phone)) { S.err.phone = 'Check the mobile number.'; render(); q('#m-phone', root)?.focus(); return; }
    S.busy = true; render();
    S.demo = await sendCode(S.phone); S.sent = true; S.busy = false; render(); q('#m-code', root)?.focus(); return;
  }
  const c = t.closest<HTMLElement>('[data-cancel]');
  if (c) { S.confirm = c.dataset.cancel!; render(); return; }
  if (t.closest('[data-keep]')) { S.confirm = ''; render(); return; }
  const y = t.closest<HTMLElement>('[data-yes]');
  if (y) { await cancelBooking(y.dataset.yes!); S.confirm = ''; await refresh(); return; }
});
root.addEventListener('submit', async (e) => {
  e.preventDefault();
  S.phone = q<HTMLInputElement>('#m-phone', root)?.value ?? S.phone;
  S.code = q<HTMLInputElement>('#m-code', root)?.value ?? '';
  S.err = {};
  if (!phoneOk(S.phone)) { S.err.phone = 'Check the mobile number.'; render(); return; }
  if (!(await verifyCode(S.phone, S.code))) { S.err.code = "That code doesn't match. Try again or resend."; render(); q('#m-code', root)?.focus(); return; }
  S.verified = true;
  S.list = await listBookings(S.phone);
  render(true);
});
onChange(() => { if (S.verified) listBookings(S.phone).then((l) => { S.list = l; render(); }); });
render();
