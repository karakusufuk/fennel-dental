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

  const tmore = $<HTMLAnchorElement>('[data-tmore]', sec)!;
  const HDR = 60; // kaydırılmış header yüksekliği
  const barH = () => $('[data-mbar]')?.offsetHeight ?? 0;

  // Telefon: seçili satır (başlık + kısa metin + görsel) header ile alt çubuk arasına sığar.
  // Görsel dışındaki yükseklik ölçülür; CSS görseli kalan alana göre küçültür (--trest).
  const fit = () => {
    if (!phone.matches) { sec.style.removeProperty('--trest'); return; }
    const li = items[cur];
    const body = $('.tdet__body', li)!;
    const pad = parseFloat(getComputedStyle(li).paddingBottom) || 0;
    const rest = btns[cur].offsetHeight + body.offsetHeight + panel.offsetHeight - stage.offsetHeight + pad;
    sec.style.setProperty('--trest', `${Math.ceil(rest)}px`);
  };

  const select = (i: number) => {
    // Telefon: dokunulan başlık ekranda yerinde kalır. Üstte kapanan satır anında kapanır ve
    // kayan yükseklik kaydırmayla dengelenir; böylece kullanıcı sayfada aşağı fırlamaz.
    const anchor = phone.matches ? btns[i].getBoundingClientRect().top : null;
    if (anchor !== null) items.forEach((li, k) => { if (k < i) li.classList.add('is-snap'); });
    cur = i;
    btns.forEach((b, k) => {
      const on = k === i;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-expanded', String(on));
      dets[k].classList.toggle('is-open', on);
      items[k].classList.toggle('is-sel', on);
    });
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    descs.forEach((d, k) => d.classList.toggle('is-on', k === i));
    pairs.forEach((p, k) => p.classList.toggle('is-on', k === i));
    prog.style.width = `${((i + 1) / total) * 100}%`;
    progN.textContent = `${i + 1} / ${total}`;
    tmore.href = `/treatments/${items[i].dataset.slug}/`;
    place();
    fit();
    if (anchor !== null) {
      const d = btns[i].getBoundingClientRect().top - anchor;
      if (Math.abs(d) > 0.5) window.scrollBy(0, d);
      requestAnimationFrame(() => requestAnimationFrame(() => items.forEach((li) => li.classList.remove('is-snap'))));
    }
    reveal();
  };

  // Dar ekranda (görsel listenin içinde): görsel ekranda değilse önce oraya kay, sonra geçişi oynat.
  let token = 0;
  const reveal = async () => {
    const my = ++token;
    if (!narrow.matches) { play(); return; }
    await new Promise((r) => setTimeout(r, 340)); // satır açılma geçişi (300ms) bitsin
    if (my !== token) return;
    if (phone.matches) {
      fit(); // başlık büyüme geçişi bitti: iki satıra inen başlık (Braces…) artık doğru ölçülür
      // Telefon: satırın tamamı header ile alt çubuk arasında görünsün; en az kaydırma, başlık hep ekranda
      const r = items[cur].getBoundingClientRect();
      const top = HDR + 12;
      const bottom = innerHeight - barH() - 12;
      let dy = r.bottom > bottom ? r.bottom - bottom : 0;
      if (r.top - dy < top) dy = r.top - top;
      if (Math.abs(dy) > 1) {
        await scrollToY(scrollY + dy);
        if (my !== token) return;
      }
      play();
      return;
    }
    const r = panel.getBoundingClientRect();
    const top = 60 + 12;
    const bottom = innerHeight - 12;
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
  phone.addEventListener('change', fit);
  addEventListener('resize', fit);
  document.fonts?.ready.then(fit);
  place();
  fit();

  // Görselleri bölüme yaklaşınca yükle (lazy → eager), geçişte boş kare olmasın
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      near.disconnect();
      $$<HTMLImageElement>('img[loading="lazy"]', stage).forEach((img) => { img.loading = 'eager'; });
    }, { rootMargin: '900px 0px' });
    near.observe(sec);

    // İlk görünüşte 01 geçişi bir kez kendiliğinden oynar
    // (telefonda görselin çoğu header ile alt çubuk arasında görünür olunca)
    const seen = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      seen.disconnect();
      play();
    }, phone.matches ? { threshold: 0.6, rootMargin: `-${HDR}px 0px -${barH()}px 0px` } : { threshold: 0.35 });
    seen.observe(panel);
  } else {
    play();
  }
}
