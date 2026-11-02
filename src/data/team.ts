export interface Doctor {
  slug: string;
  name: string;
  first: string; // "Dr. Kinsella"
  role: string;
  langs: string;
  earliest: string;
  img: string; // public/img/ekip/<img>-<w>
  alt: string;
  bio: string;
}

export const team: Doctor[] = [
  { slug: 'clodagh-kinsella', name: 'Dr. Clodagh Kinsella', first: 'Dr. Kinsella', role: 'General dentistry', langs: 'EN · GA', earliest: 'Tue 09:40', img: 'portre-clodagh', alt: 'Portrait of Dr. Clodagh Kinsella', bio: 'General dentist. Qualified at Trinity College Dublin. Looks after check-ups, fillings and root canals, and most of our nervous patients.' },
  { slug: 'conor-walsh', name: 'Dr. Conor Walsh', first: 'Dr. Walsh', role: 'Orthodontics', langs: 'EN', earliest: 'Tue 10:20', img: 'portre-conor', alt: 'Portrait of Dr. Conor Walsh', bio: 'Orthodontist. Works with clear aligners and fixed braces for adults and teenagers.' },
  { slug: 'blathnaid-byrne', name: 'Dr. Bláthnaid Byrne', first: 'Dr. Byrne', role: 'Cosmetic dentistry', langs: 'EN · GA', earliest: 'Wed 09:20', img: 'portre-blathnaid', alt: 'Portrait of Dr. Bláthnaid Byrne', bio: 'Cosmetic dentist. Whitening, veneers and crowns. Over twenty years in practice.' },
  { slug: 'daniel-oconnor', name: 'Dr. Daniel O’Connor', first: 'Dr. O’Connor', role: 'Oral surgery', langs: 'EN · PL', earliest: 'Thu 11:00', img: 'portre-daniel', alt: 'Portrait of Dr. Daniel O’Connor', bio: 'Oral surgeon. Implants, extractions and emergency care.' },
];
