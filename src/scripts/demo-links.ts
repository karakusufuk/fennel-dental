/**
 * Demo eylemleri sessizdir: telefon, e-posta, WhatsApp ve harita bağlantıları hiçbir şey yapmaz
 * (arama başlatmaz, mesaj göstermez). Belge düzeyinde olay delegasyonu; script ile çizilen HTML'de de çalışır.
 */
function inert(a: HTMLAnchorElement) {
  const href = a.getAttribute('href') || '';
  return href.startsWith('tel:') || href.startsWith('mailto:') || href === '#whatsapp' || href === '#map'
    || a.classList.contains('maps') || a.classList.contains('maps-link') || /maps\.(google|apple)|goo\.gl\/maps/.test(href);
}

let ready = false;
export function initDemoLinks() {
  if (ready) return;
  ready = true;
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (a && inert(a)) e.preventDefault();
  });
}
