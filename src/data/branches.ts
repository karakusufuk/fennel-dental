export interface Branch {
  key: string;
  label: string;
  q: string;
  answers: [string, string];
  title: string;
  time: string;
  rows: [string, string][];
  cta: string;
}

export const branches: Branch[] = [
  { key: 'pain', label: 'Pain', q: 'Is there swelling, fever or pain spreading to your face?', answers: ['Yes', 'No, just the tooth'], title: 'Pain assessment', time: '30 min', rows: [['Examination', '€[FEE]'], ['Treatment, if needed', '€[MIN]–€[MAX]']], cta: 'Book today →' },
  { key: 'appearance', label: 'Appearance', q: 'What would you like to change?', answers: ['The colour', 'The shape or gaps'], title: 'Cosmetic consultation', time: '30 min', rows: [['Consultation', '€[FEE]'], ['Whitening or veneers, if advised', '€[MIN]–€[MAX]']], cta: 'Book consultation →' },
  { key: 'braces', label: 'Braces', q: 'Would visible braces bother you?', answers: ["Yes, I'd prefer something discreet", "No, that's fine"], title: 'Orthodontic consultation', time: '45 min', rows: [['Consultation', '€[FEE]'], ['Clear aligners, if advised', '€[MIN]–€[MAX]']], cta: 'Send booking request →' },
  { key: 'missing', label: 'Missing tooth', q: 'Do you smoke?', answers: ['Yes', 'No'], title: 'Implant consultation', time: '45 min', rows: [['Consultation and 3D scan', '€[FEE]'], ['Implant with crown, if advised', '€[MIN]–€[MAX]']], cta: 'Send booking request →' },
  { key: 'checkup', label: 'Check-up', q: 'When was your last visit?', answers: ['Within a year', 'Over a year ago'], title: 'Check-up and clean', time: '45 min', rows: [['Check-up and clean', '€[FEE]']], cta: 'Book now →' },
];

export const defaultBranch = 'braces';
export const defaultAnswer = 1;
