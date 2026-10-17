// /start/ akış mantığı (DOM'suz): sorular, dizi, sonuç. Test edilebilir.
export interface Opt { v: string; label: string }
export interface Q { id: string; text: string; opts: Opt[] }
export type Answers = Record<string, string>;
const YN = (): Opt[] => [{ v: 'yes', label: 'Yes' }, { v: 'no', label: 'No' }];
const RANGE = '€[MIN]–€[MAX]';
const FEE = '€[FEE]';

export const Q_: Record<string, Q> = {
  reason: { id: 'reason', text: 'What brings you in?', opts: [{ v: 'pain', label: 'Pain' }, { v: 'appearance', label: 'Appearance' }, { v: 'braces', label: 'Braces' }, { v: 'missing', label: 'Missing tooth' }, { v: 'checkup', label: 'Check-up' }] },
  p_swell: { id: 'p_swell', text: 'Is there swelling, fever or pain spreading to your face?', opts: YN() },
  p_feel: { id: 'p_feel', text: 'What does it feel like?', opts: [{ v: 'bite', label: 'Sharp, when I bite or drink something cold' }, { v: 'throb', label: 'A constant, throbbing ache' }, { v: 'gum', label: 'My gum hurts or bleeds' }] },
  p_dur: { id: 'p_dur', text: 'How long has it hurt?', opts: [{ v: 'short', label: 'Less than 2 days' }, { v: 'long', label: 'Longer' }] },
  p_smoke: { id: 'p_smoke', text: 'Do you smoke?', opts: YN() },
  a_what: { id: 'a_what', text: 'What would you like to change?', opts: [{ v: 'colour', label: 'The colour' }, { v: 'shape', label: 'The shape or gaps' }, { v: 'chip', label: 'A chipped or broken tooth' }] },
  a_check: { id: 'a_check', text: 'Have you had a check-up in the last 12 months?', opts: YN() },
  a_aligner: { id: 'a_aligner', text: 'Would you consider clear aligners?', opts: YN() },
  a_hurt: { id: 'a_hurt', text: 'Does it hurt?', opts: YN() },
  b_who: { id: 'b_who', text: 'Who is the treatment for?', opts: [{ v: 'me', label: 'Me' }, { v: 'child', label: 'My child (under 18)' }] },
  b_visible: { id: 'b_visible', text: 'Would visible braces bother you?', opts: [{ v: 'yes', label: "Yes, I'd prefer something discreet" }, { v: 'no', label: "No, that's fine" }] },
  m_count: { id: 'm_count', text: 'How many teeth are missing?', opts: [{ v: 'one', label: 'One' }, { v: 'several', label: 'Several, or all in one jaw' }] },
  m_smoke: { id: 'm_smoke', text: 'Do you smoke?', opts: YN() },
  m_when: { id: 'm_when', text: 'When was the tooth lost?', opts: [{ v: 'recent', label: 'In the last 3 months' }, { v: 'long', label: 'Longer ago' }] },
  c_last: { id: 'c_last', text: 'When was your last visit?', opts: [{ v: 'within', label: 'Within a year' }, { v: 'over', label: "Over a year ago, or I can't remember" }] },
  c_bleed: { id: 'c_bleed', text: 'Do your gums bleed when you brush?', opts: YN() },
  first: { id: 'first', text: 'Is this your first visit to Fennel?', opts: YN() },
  anx: { id: 'anx', text: 'Do you get anxious in the dental chair?', opts: [{ v: 'yes', label: 'Yes' }, { v: 'little', label: 'A little' }, { v: 'no', label: 'No' }] },
};

class Stop extends Error {}

/** Cevaplara göre soru dizisini çıkarır. Bekleyen (cevapsız) ilk soruda durur. */
export function sequence(a: Answers): { qs: Q[]; key: string | null } {
  const qs: Q[] = [];
  const need = (q: Q) => { qs.push(q); const v = a[q.id]; if (v === undefined) throw new Stop(); return v; };
  let key: string | null = null;
  const pain = (fromChip: boolean): string => {
    if (need(Q_.p_swell) === 'yes') return 'CALL';
    if (fromChip) return 'P1';
    const f = need(Q_.p_feel);
    if (f === 'gum') { need(Q_.p_smoke); return 'P3'; }
    need(Q_.p_dur);
    return f === 'bite' ? 'P1' : 'P2';
  };
  try {
    const r = need(Q_.reason);
    if (r === 'pain') key = pain(false);
    else if (r === 'appearance') {
      const w = need(Q_.a_what);
      if (w === 'colour') { need(Q_.a_check); key = 'A1'; }
      else if (w === 'shape') key = need(Q_.a_aligner) === 'yes' ? 'A2' : 'A3';
      else key = need(Q_.a_hurt) === 'yes' ? pain(true) : 'A4';
    } else if (r === 'braces') { need(Q_.b_who); need(Q_.b_visible); key = 'B'; }
    else if (r === 'missing') { need(Q_.m_count); need(Q_.m_smoke); need(Q_.m_when); key = 'M'; }
    else { need(Q_.c_last); need(Q_.c_bleed); key = 'C'; }
    if (key !== 'CALL') { need(Q_.first); need(Q_.anx); }
  } catch (e) {
    if (!(e instanceof Stop)) throw e;
    return { qs, key: null };
  }
  return { qs, key };
}

/** Bir dalda toplam soru sayısı (1. soru + dal soruları + 2 ortak). */
export function total(a: Answers) {
  const r = a.reason;
  const branch = r === 'pain' ? 3 : r === 'missing' ? 3 : r === 'appearance' && a.a_what === 'chip' && a.a_hurt === 'yes' ? 3 : 2;
  return 1 + branch + 2;
}

export interface Result { title: string; minutes: number; rows: [string, string][]; notes: string[]; mode: 'instant' | 'request'; treatment: string; flags: string[] }

export function build(key: string, a: Answers): Result {
  let r: Result;
  const flags: string[] = [];
  const notes: string[] = [];
  switch (key) {
    case 'P1': r = { title: 'Pain assessment', minutes: 30, rows: [['Examination', FEE], ['Filling, if needed', RANGE]], notes, mode: 'instant', treatment: 'examination', flags }; break;
    case 'P2': r = { title: 'Pain assessment', minutes: 45, rows: [['Examination and X-ray', FEE], ['Root canal, if needed', RANGE]], notes, mode: 'instant', treatment: 'examination', flags }; break;
    case 'P3': r = { title: 'Gum assessment', minutes: 45, rows: [['Examination', FEE], ['Gum treatment, if needed', RANGE]], notes, mode: 'instant', treatment: 'examination', flags }; break;
    case 'A1': r = { title: 'Whitening consultation', minutes: 30, rows: [['Consultation', FEE], ['Whitening', RANGE]], notes, mode: 'instant', treatment: 'whitening', flags }; break;
    case 'A2': r = { title: 'Orthodontic consultation', minutes: 45, rows: [['Consultation', FEE], ['Clear aligners, if advised', RANGE]], notes, mode: 'request', treatment: 'braces-and-aligners', flags }; break;
    case 'A3': r = { title: 'Cosmetic consultation', minutes: 30, rows: [['Consultation', FEE], ['Veneers or bonding, if advised', RANGE]], notes, mode: 'request', treatment: 'crowns-and-veneers', flags }; break;
    case 'A4': r = { title: 'Repair consultation', minutes: 30, rows: [['Examination', FEE], ['Bonding or crown, if needed', RANGE]], notes, mode: 'instant', treatment: 'examination', flags }; break;
    case 'B': {
      const child = a.b_who === 'child';
      const second = a.b_visible === 'yes' ? 'Clear aligners, if advised' : 'Fixed braces, if advised';
      r = child
        ? { title: 'Orthodontic assessment for a child', minutes: 30, rows: [['Assessment', FEE], [second, RANGE]], notes, mode: 'request', treatment: 'braces-and-aligners', flags }
        : { title: 'Orthodontic consultation', minutes: 45, rows: [['Consultation', FEE], [second, RANGE]], notes, mode: 'request', treatment: 'braces-and-aligners', flags };
      if (child) notes.push('A parent or guardian needs to come to the first visit.');
      break;
    }
    case 'M': {
      const one = a.m_count === 'one';
      r = { title: 'Implant consultation', minutes: one ? 45 : 60, rows: [['Consultation', FEE], [one ? 'Implant with crown, if advised' : 'Implants or dentures, if advised', RANGE]], notes, mode: 'request', treatment: 'implants', flags };
      if (a.m_when === 'long') r.rows.push(['3D scan, if needed', FEE]);
      break;
    }
    default: { // C
      const over = a.c_last === 'over';
      r = { title: over ? 'Check-up, clean and X-rays' : 'Check-up and clean', minutes: over ? 60 : 45, rows: [['Check-up and clean', FEE]], notes, mode: 'instant', treatment: 'check-up-and-clean', flags };
      if (over) r.rows.push(['X-rays', FEE]);
    }
  }
  // dala özel eklemeler
  if (key === 'A1' && a.a_check === 'no') { r.minutes += 30; r.rows.push(['Check-up and clean', FEE]); }
  if (key === 'C' && a.c_bleed === 'yes') { r.title = 'Check-up and gum care'; r.minutes += 15; r.rows.push(['Hygiene appointment', FEE]); }
  if ((key === 'P1' || key === 'P2') && a.p_dur === 'long') { notes.push("We'll offer you the earliest slot today or tomorrow."); flags.push('urgent'); }
  if (key === 'P3' && a.p_smoke === 'yes') { notes.push("Smoking affects gum healing — we'll talk it through."); flags.push('smoker'); }
  if (key === 'M' && a.m_smoke === 'yes') { notes.push("Smoking affects how implants heal — we'll talk it through."); flags.push('smoker'); }
  // ortak sorular
  if (a.first === 'yes') { r.minutes += 15; r.rows.push(['New patient forms — 15 min, no charge', '']); flags.push('first-visit'); }
  if (a.anx === 'yes') { r.minutes += 15; notes.push("We'll book extra time and go at your pace."); flags.push('anxious'); }
  else if (a.anx === 'little') notes.push("We'll book extra time and go at your pace.");
  return r;
}

