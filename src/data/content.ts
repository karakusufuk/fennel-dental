// Tedavi sayfası içeriği — 05-tedavi-icerikleri.md ile kelimesi kelimesine.
export interface TreatmentPage {
  slug: string;
  n: string;
  name: string;
  intro: string;
  length: string;
  visits: string;
  feels: string;
  img?: string; // public/img/tedavi/<img>-once|sonra
  altBefore?: string;
  altAfter?: string;
  fade?: boolean;
  compare?: boolean; // whitening kaydırıcısı
  branch: string;
  dentists: string[];
  steps: { t: string; d: string }[];
}

export const SAME_PRICE = 'Exact price comes as a written treatment plan after your consultation.';

export const treatmentPages: TreatmentPage[] = [
  {
    slug: 'check-up-and-clean', n: '01', name: 'Check-up and clean', intro: 'A full check of your teeth and gums, then a clean to remove tartar.',
    length: '45 min', visits: '1', feels: 'Scraping, no pain', img: '01-temizlik', altBefore: 'Before: molar with tartar', altAfter: 'After: clean molar', branch: 'checkup', dentists: ['aoife-murphy', 'siobhan-byrne'],
    steps: [
      { t: 'We ask how things are.', d: 'Any pain, bleeding or changes since your last visit.' },
      { t: 'We check every tooth and your gums.', d: 'X-rays only if they\'re due.' },
      { t: 'We clean.', d: 'Tartar is scraped off, then teeth are polished.' },
      { t: 'We tell you what we found.', d: 'If anything needs treatment, you get a written plan with prices before you decide.' },
    ],
  },
  {
    slug: 'fillings', n: '02', name: 'Fillings', intro: 'Decay is removed and the tooth is sealed with a tooth-coloured filling.',
    length: '30–60 min', visits: '1', feels: 'Numb, then light pressure', img: '02-dolgu', altBefore: 'Before: molar with decay', altAfter: 'After: molar with a tooth-coloured filling', branch: 'pain', dentists: ['aoife-murphy', 'siobhan-byrne'],
    steps: [
      { t: 'We numb the area.', d: 'A small injection; you\'ll feel pressure, not pain.' },
      { t: 'We remove the decay.', d: 'Only the damaged part of the tooth.' },
      { t: 'We fill and shape.', d: 'The filling is matched to your tooth colour and hardened with a light.' },
      { t: 'We check your bite.', d: 'You can eat normally once the numbness wears off.' },
    ],
  },
  {
    slug: 'root-canal', n: '03', name: 'Root canal', intro: 'The infected nerve is cleaned out and sealed, so you keep the tooth.',
    length: '60–90 min', visits: '1–2', feels: 'Like a long filling', img: '03-kanal', altBefore: 'Before: cross-section with inflamed nerve', altAfter: 'After: cross-section after root canal', branch: 'pain', dentists: ['aoife-murphy', 'daniel-oconnor'],
    steps: [
      { t: 'X-ray and numbing.', d: 'We see the shape of the roots first.' },
      { t: 'We clean inside the tooth.', d: 'The infected nerve is removed and the canals are cleaned.' },
      { t: 'We seal it.', d: 'The canals are filled and the tooth is closed.' },
      { t: 'Often, a crown later.', d: 'A back tooth usually needs a crown to protect it. We\'ll tell you if yours does.' },
    ],
  },
  {
    slug: 'implants', n: '04', name: 'Implants', intro: 'A titanium post replaces the root; a crown goes on top once it has healed.',
    length: '3–6 months', visits: '3–4', feels: 'Pressure, sore for a few days', img: '04-implant', altBefore: 'Before: cracked molar', altAfter: 'After: implant with crown', branch: 'missing', dentists: ['daniel-oconnor'],
    steps: [
      { t: 'Consultation and 3D scan.', d: 'We check the bone and plan the position.' },
      { t: 'The implant is placed.', d: 'Under local anaesthetic. Most people go back to work the next day.' },
      { t: 'It heals.', d: 'Usually 3 to 4 months, while the bone grows around it.' },
      { t: 'The crown goes on.', d: 'Made to match your other teeth.' },
    ],
  },
  {
    slug: 'braces-and-aligners', n: '05', name: 'Braces and clear aligners', intro: 'Clear trays or discreet braces move your teeth step by step.',
    length: '6–18 months', visits: 'Every 6–8 wks', feels: 'Tight for a day each set', img: '05-tel', altBefore: 'Before: crowded front teeth', altAfter: 'After: aligned teeth with clear aligner', fade: true, branch: 'braces', dentists: ['conor-walsh'],
    steps: [
      { t: 'Consultation and scan.', d: 'We show you how your teeth could move and how long it would take.' },
      { t: 'You choose.', d: 'Clear aligners or fixed braces — we\'ll tell you honestly which suits your teeth.' },
      { t: 'Treatment.', d: 'Aligners: a new set every 1–2 weeks. Braces: adjustments every 6–8 weeks.' },
      { t: 'Retainers.', d: 'Worn at night afterwards so teeth stay in place.' },
    ],
  },
  {
    slug: 'whitening', n: '06', name: 'Whitening', intro: 'Your teeth lightened by a few shades, safely, under a dentist\'s care.',
    length: '2–3 weeks', visits: '2', feels: 'Mild sensitivity for a few days', img: '01-temizlik', compare: true, branch: 'appearance', dentists: ['siobhan-byrne'],
    steps: [
      { t: 'Check-up first.', d: 'Whitening is only done on healthy teeth and gums.' },
      { t: 'Trays made for you.', d: 'We scan your teeth and make thin custom trays.' },
      { t: 'At home.', d: 'You wear the trays with gel for about an hour a day for 2–3 weeks.' },
      { t: 'Review.', d: 'We check the result. Fillings and crowns don\'t whiten — we\'ll tell you beforehand if that matters for you.' },
    ],
  },
  {
    slug: 'crowns-and-veneers', n: '07', name: 'Crowns and veneers', intro: 'A crown covers and protects a damaged tooth; a veneer changes how a front tooth looks.',
    length: '2–3 weeks', visits: '2', feels: 'Numb, then nothing', branch: 'appearance', dentists: ['siobhan-byrne', 'daniel-oconnor'],
    steps: [
      { t: 'Consultation.', d: 'We look at the tooth and agree what you want it to look like.' },
      { t: 'Preparation.', d: 'The tooth is shaped and scanned. You leave with a temporary.' },
      { t: 'Made in the lab.', d: 'Matched to the colour of your other teeth.' },
      { t: 'Fitted.', d: 'The crown or veneer is bonded in place and your bite is checked.' },
    ],
  },
];

// /treatments/ listesinde 8. satır
export const emergencyRow = { n: '08', name: 'Emergency care', href: '/emergency/', length: 'Same day' };

export interface FeeRow { name: string; fee?: boolean; slug?: string }
export const feeGroups: { title: string; rows: FeeRow[] }[] = [
  { title: 'Consultations', rows: [{ name: 'Examination', fee: true }, { name: 'New patient examination', fee: true }, { name: 'Emergency appointment', fee: true }, { name: 'Orthodontic consultation', fee: true }, { name: 'Implant consultation', fee: true }, { name: 'Cosmetic consultation', fee: true }] },
  { title: 'General', rows: [{ name: 'Check-up and clean', slug: 'check-up-and-clean' }, { name: 'Hygiene appointment', fee: true }, { name: 'X-ray (small)', fee: true }, { name: 'X-ray (panoramic)', fee: true }, { name: 'Filling (tooth-coloured)', slug: 'fillings' }] },
  { title: 'Root canal', rows: [{ name: 'Front tooth' }, { name: 'Premolar' }, { name: 'Molar', slug: 'root-canal' }] },
  { title: 'Implants', rows: [{ name: 'Single implant with crown', slug: 'implants' }, { name: '3D scan', fee: true }] },
  { title: 'Orthodontics', rows: [{ name: 'Clear aligners', slug: 'braces-and-aligners' }, { name: 'Fixed braces' }] },
  { title: 'Cosmetic', rows: [{ name: 'Whitening (home kit)', slug: 'whitening' }, { name: 'Whitening (in clinic)' }, { name: 'Veneer (per tooth)', slug: 'crowns-and-veneers' }, { name: 'Crown (per tooth)' }] },
];

export const emergencySituations = [
  { t: 'Severe toothache', d: 'Take the painkiller you normally use, following the label. Don\'t put aspirin on the gum. Call us for a same-day slot.' },
  { t: 'Knocked-out adult tooth', d: 'Hold it by the crown, not the root. If it\'s dirty, rinse briefly in milk. Keep it in milk and come in straight away — the first hour matters most.' },
  { t: 'Chipped or broken tooth', d: 'Keep any pieces. Rinse with warm water and call us.' },
  { t: 'Swelling in the gum or face', d: 'Call us today. Swelling can mean infection and shouldn\'t wait.' },
  { t: 'Lost filling or crown', d: 'Keep the crown. Avoid chewing on that side and call us for an appointment.' },
];
