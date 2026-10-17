export interface Branch {
  key: string;
  slug: string; // /book/?treatment=
  label: string;
  q: string;
  answers: [string, string];
  title: string;
  time: string;
  rows: [string, string][];
  cta: string;
}

export const branches: Branch[] = [
  { key: 'pain', slug: 'examination', label: 'Pain', q: 'Is there swelling, fever or pain spreading to your face?', answers: ['Yes', 'No, just the tooth'], title: 'Pain assessment', time: '30 min', rows: [['Examination', '€65'], ['Treatment, if needed', '€110–€1,100']], cta: 'Book today →' },
  { key: 'appearance', slug: 'whitening', label: 'Appearance', q: 'What would you like to change?', answers: ['The colour', 'The shape or gaps'], title: 'Cosmetic consultation', time: '30 min', rows: [['Consultation', '€65'], ['Whitening or veneers, if advised', '€350–€1,150']], cta: 'Book consultation →' },
  { key: 'braces', slug: 'braces-and-aligners', label: 'Braces', q: 'Would visible braces bother you?', answers: ["Yes, I'd prefer something discreet", "No, that's fine"], title: 'Orthodontic consultation', time: '45 min', rows: [['Consultation', '€80'], ['Clear aligners, if advised', '€3,200–€5,200']], cta: 'Send booking request →' },
  { key: 'missing', slug: 'implants', label: 'Missing tooth', q: 'Do you smoke?', answers: ['Yes', 'No'], title: 'Implant consultation', time: '45 min', rows: [['Consultation and 3D scan', '€120'], ['Implant with crown, if advised', '€2,400–€3,400']], cta: 'Send booking request →' },
  { key: 'checkup', slug: 'check-up-and-clean', label: 'Check-up', q: 'When was your last visit?', answers: ['Within a year', 'Over a year ago'], title: 'Check-up and clean', time: '45 min', rows: [['Check-up and clean', '€95–€140']], cta: 'Book now →' },
];

export const defaultBranch = 'braces';
export const defaultAnswer = 1;
