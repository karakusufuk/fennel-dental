export interface Doctor {
  name: string;
  role: string;
  langs: string;
  earliest: string;
  img: string; // public/img/ekip/<img>-<w>
  alt: string;
}

export const team: Doctor[] = [
  { name: 'Dr. Aoife Murphy', role: 'General dentistry', langs: 'EN · GA', earliest: 'Tue 09:40', img: 'portre-aoife', alt: 'Portrait of Dr. Aoife Murphy' },
  { name: 'Dr. Conor Walsh', role: 'Orthodontics', langs: 'EN', earliest: 'Tue 10:20', img: 'portre-conor', alt: 'Portrait of Dr. Conor Walsh' },
  { name: 'Dr. Siobhán Byrne', role: 'Cosmetic dentistry', langs: 'EN · GA', earliest: 'Wed 09:20', img: 'portre-siobhan', alt: 'Portrait of Dr. Siobhán Byrne' },
  { name: 'Dr. Daniel O’Connor', role: 'Oral surgery', langs: 'EN · PL', earliest: 'Thu 11:00', img: 'portre-daniel', alt: 'Portrait of Dr. Daniel O’Connor' },
];
