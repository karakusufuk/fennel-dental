export interface Treatment {
  n: string;
  name: string;
  desc: string;
  length: string;
  visits: string;
  feels: string;
  img: string; // public/img/tedavi/<img>-once|sonra-<w>
  altBefore: string;
  altAfter: string;
  fade?: boolean; // 05-tel: yatay kenar solması
}

export const treatments: Treatment[] = [
  { n: '01', name: 'Check-up and clean', desc: 'We remove tartar, check your gums and take X-rays if they are due.', length: '45 min', visits: '1', feels: 'Scraping, no pain', img: '01-temizlik', altBefore: 'Before: molar with tartar', altAfter: 'After: clean molar' },
  { n: '02', name: 'Fillings', desc: 'Decay is removed and the tooth is sealed with a tooth-coloured filling.', length: '30–60 min', visits: '1', feels: 'Numb, then light pressure', img: '02-dolgu', altBefore: 'Before: molar with decay', altAfter: 'After: molar with a tooth-coloured filling' },
  { n: '03', name: 'Root canal', desc: 'The infected nerve is cleaned out and sealed, so you keep the tooth.', length: '60–90 min', visits: '1–2', feels: 'Like a long filling', img: '03-kanal', altBefore: 'Before: cross-section with inflamed nerve', altAfter: 'After: cross-section after root canal' },
  { n: '04', name: 'Implants', desc: 'A titanium post replaces the root; a crown goes on top once it has healed.', length: '3–6 months', visits: '3–4', feels: 'Pressure, sore for a few days', img: '04-implant', altBefore: 'Before: cracked molar', altAfter: 'After: implant with crown' },
  { n: '05', name: 'Braces and clear aligners', desc: 'Clear trays or discreet braces move your teeth step by step.', length: '6–18 months', visits: 'Every 6–8 wks', feels: 'Tight for a day each set', img: '05-tel', altBefore: 'Before: crowded front teeth', altAfter: 'After: aligned teeth with clear aligner', fade: true },
];
