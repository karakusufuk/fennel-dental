import { nextSlots, dayLabel } from '../lib/booking';

/** Hekim profili: "Next free slots". Saatler demo takviminden; tıklayınca /book/ hekim + saat seçili açılır. */
document.querySelectorAll<HTMLElement>('[data-next-slots]').forEach((ul) => {
  const dentist = ul.dataset.dentist!;
  const slots = nextSlots(dentist, 'examination', 3);
  ul.innerHTML = '';
  if (!slots.length) {
    ul.innerHTML = `<li class="mono">No free times in the next 14 days.</li><li><a class="link-k" href="/book/?dentist=${dentist}&note=1">Join the waiting list</a></li>`;
    return;
  }
  for (const s of slots) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'slot-link mono';
    a.href = `/book/?dentist=${dentist}&date=${s.date}&time=${s.time}`;
    a.textContent = `${dayLabel(s.date)} ${s.time}`;
    li.appendChild(a);
    ul.appendChild(li);
  }
});
