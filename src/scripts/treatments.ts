import { $, $$ } from './util';
import { scrollToY } from './smooth';

export function initTreatments() {
  const sec = $('[data-treat]');
  if (!sec) return;
  const treat = $('.treat', sec)!;
  const items = $$('.tlist > li', sec);
  const btns = items.map((li) => $<HTMLButtonElement>('.tbtn', li)!);
  const dets = items.map((li) => $('.tdet', li)!);
  const slots = items.map((li) => $('[data-slot]', li)!);
  const panel = $('[data-panel]', sec)!;
  const stage = $('[data-stage]', sec)!;
  const pairs = $$('[data-pair]', sec);
  const prog = $('[data-prog]', sec)!;
  const progN = $('[data-prog-n]', sec)!;
  const total = items.length;
  const narrow = matchMedia('(max-width: 900px)');
  const phone = matchMedia('(max-width: 760px)');
  const tabs = $$<HTMLButtonElement>('.ttab', sec);
  const descs = $$('.tdesc', sec);
  const mslot = $('[data-mslot]', sec)!;
  let cur = 0;

  // Geçiş: 360ms bekleme + 3 sn feather silme + %4 büyüme / 12px yukarı (CSS keyframes)
  const play = () => {
    stage.classList.remove('is-playing');
    void stage.offsetWidth; // animasyonu baştan başlat (art arda tıklamada da güvenli)
    stage.classList.add('is-playing');
  };

  // Dar ekranda panel, aktif satırın açıklamasının altına taşınır
  const place = () => {
    if (narrow.matches) {
      slots[cur].appendChild(panel);
      panel.classList.add('panel--moved');
    } else {
      treat.appendChild(panel);
      panel.classList.remove('panel--moved');
    }
  };

  const select = (i: number) => {
    cur = i;
    btns.forEach((b, k) => {
      const on = k === i;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-expanded', String(on));
      dets[k].classList.toggle('is-open', on);
    });
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    descs.forEach((d, k) => d.classList.toggle('is-on', k === i));
    pairs.forEach((p, k) => p.classList.toggle('is-on', k === i));
    prog.style.width = `${((i + 1) / total) * 100}%`;
    progN.textContent = `${i + 1} / ${total}`;
    place();
    reveal();
  };

  // Dar ekranda (görsel listenin içinde): görsel ekranda değilse önce oraya kay, sonra geçişi oynat.
  let token = 0;
  const reveal = async () => {
    const my = ++token;
    if (!narrow.matches) { play(); return; }
    await new Promise((r) => setTimeout(r, 340)); // satır açılma geçişi (300ms) bitsin
    if (my !== token) return;
    const r = panel.getBoundingClientRect();
    const top = 60 + 12;
    const bottom = innerHeight - (phone.matches ? 77 : 0) - 12;
    if (r.top < top || r.bottom > bottom) {
      await scrollToY(r.top + scrollY - (60 + 16));
      if (my !== token) return;
    }
    play();
  };

  btns.forEach((b, i) => b.addEventListener('click', () => select(i)));
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k !== 'ArrowRight' && k !== 'ArrowLeft') return;
      e.preventDefault();
      const n = (i + (k === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      select(n);
      tabs[n].focus();
    });
  });
  $('[data-replay]', sec)!.addEventListener('click', play);
  narrow.addEventListener('change', () => { place(); play(); });
  place();

  // Görselleri bölüme yaklaşınca yükle (lazy → eager), geçişte boş kare olmasın
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      near.disconnect();
      $$<HTMLImageElement>('img[loading="lazy"]', stage).forEach((img) => { img.loading = 'eager'; });
    }, { rootMargin: '900px 0px' });
    near.observe(sec);

    // İlk görünüşte 01 geçişi bir kez kendiliğinden oynar
    const seen = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      seen.disconnect();
      play();
    }, { threshold: 0.35 });
    seen.observe(panel);
  } else {
    play();
  }
}
