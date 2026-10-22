/**
 * Konsept modalı: tek, yeniden kullanılabilir modül.
 * - Bağlantı tetikleyicileri (tel:, mailto:, harita, WhatsApp) belge düzeyinde olay delegasyonuyla yakalanır;
 *   script ile sonradan çizilen HTML'de de çalışır.
 * - Akış tetikleyicileri (son onay) showConcept('booking' | 'reschedule' | 'waitlist') çağırır; modal kapanınca promise çözülür.
 * Hiçbir veri gönderilmez.
 */
export type ConceptKind = 'booking' | 'reschedule' | 'waitlist' | 'phone' | 'whatsapp' | 'email' | 'address';

const BODY: Record<ConceptKind, string> = {
  booking: "In a live build, this booking would go straight into the clinic's calendar and the patient would get an SMS confirmation.",
  reschedule: "In a live build, the new time would replace the old one in the clinic's calendar and the patient would get an SMS confirmation.",
  waitlist: "In a live build, this note would join the clinic's waiting list and the front desk would call if a time opens up.",
  phone: "In a live build, this would ring the clinic's front desk.",
  whatsapp: "In a live build, this would open a WhatsApp chat with the clinic's front desk.",
  email: "In a live build, this would open a message to the clinic's reception.",
  address: 'In a live build, this would open directions to the clinic.',
};

let current: { resolve: () => void; from: HTMLElement | null } | null = null;
let pending: Promise<void> | null = null;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const root = () => document.querySelector<HTMLElement>('[data-concept-modal]');

export function showConcept(kind: ConceptKind): Promise<void> {
  const el = root();
  if (!el) return Promise.resolve();
  if (pending) return pending;
  const from = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  el.querySelector<HTMLElement>('[data-cm-body]')!.textContent = BODY[kind];
  el.hidden = false;
  document.documentElement.classList.add('cm-lock');
  void el.offsetWidth; // yeniden akış: geçiş başlangıç durumundan oynasın
  el.classList.add('is-open');
  el.querySelector<HTMLElement>('[role="dialog"]')!.focus({ preventScroll: true });
  pending = new Promise<void>((resolve) => { current = { resolve, from }; });
  return pending;
}

function close() {
  const el = root();
  if (!el || !current) return;
  const { resolve, from } = current;
  current = null; pending = null;
  el.classList.remove('is-open');
  el.hidden = true;
  document.documentElement.classList.remove('cm-lock');
  if (from && document.contains(from)) from.focus({ preventScroll: true });
  resolve();
}

function kindOf(a: HTMLAnchorElement): ConceptKind | null {
  const href = a.getAttribute('href') || '';
  if (href.startsWith('tel:')) return 'phone';
  if (href.startsWith('mailto:')) return 'email';
  if (href === '#whatsapp') return 'whatsapp';
  if (href === '#map' || a.classList.contains('maps') || a.classList.contains('maps-link') || /maps\.(google|apple)|goo\.gl\/maps/.test(href)) return 'address';
  return null;
}

let ready = false;
export function initConceptModal() {
  const el = root();
  if (!el || ready) return;
  ready = true;
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-cm-close]') && current) { e.preventDefault(); close(); return; }
    const a = t.closest<HTMLAnchorElement>('a[href]');
    if (!a || el.contains(a)) return;
    const k = kindOf(a);
    if (k) { e.preventDefault(); void showConcept(k); }
  });
  document.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    const dlg = el.querySelector<HTMLElement>('[role="dialog"]')!;
    const first = items[0], last = items[items.length - 1];
    if (!dlg.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && (document.activeElement === first || document.activeElement === dlg)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
