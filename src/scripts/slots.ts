import { nextSlots, dayLabel } from '../lib/booking';

document.querySelectorAll<HTMLElement>('[data-next-slots]').forEach((ul) => {
  const slots = nextSlots(ul.dataset.dentist!, 'examination', 3);
  ul.innerHTML = '';
  if (!slots.length) { ul.innerHTML = '<li class="mono">No free times in the next two weeks.</li>'; return; }
  for (const s of slots) {
    const li = document.createElement('li');
    li.className = 'mono slot-k';
    li.textContent = `${dayLabel(s.date)} ${s.time}`;
    ul.appendChild(li);
  }
});
