import { esc } from './ui';

/**
 * "Can't find a time that works?" — saat bulamayan hasta için serbest not.
 * Durum modül düzeyinde: üst sayfa yeniden çizilse de yazılanlar kaybolmaz.
 * Demo: son gönderim (Send →) görünür ama pasif; not hiçbir yere yazılmaz.
 */
export const noteState = { open: false, name: '', phone: '+353 ', text: '', err: {} as Record<string, string> };

interface Ctx { treatment?: string; dentist?: string }
interface Opts { toggle: boolean }

export function mountNote(el: HTMLElement, ctx: () => Ctx, opts: Opts) {
  if (!opts.toggle) noteState.open = true;
  const draw = () => {
    const s = noteState;
    const toggle = opts.toggle
      ? `<button type="button" class="linkbtn2 link-k" data-note-toggle aria-expanded="${s.open}" aria-controls="note-box">Can't find a time that works?</button>` : '';
    let box = '';
    if (s.open) {
      const e = s.err;
      box = `<div class="notebox" id="note-box"><h3 class="sub-h">Can't find a time that works?</h3>
        <p>Tell us when suits you. If someone cancels, we'll call you.</p>
        <form class="form" data-note-form novalidate>
          <div class="fld"><label for="n-name">Full name</label><input id="n-name" name="name" type="text" autocomplete="name" value="${esc(s.name)}" ${e.name ? 'aria-invalid="true" aria-describedby="n-name-err"' : ''}>${e.name ? `<p class="err" id="n-name-err">${esc(e.name)}</p>` : ''}</div>
          <div class="fld"><label for="n-phone">Mobile number</label><input id="n-phone" name="phone" type="tel" autocomplete="tel" value="${esc(s.phone)}" ${e.phone ? 'aria-invalid="true" aria-describedby="n-phone-err"' : ''}>${e.phone ? `<p class="err" id="n-phone-err">${esc(e.phone)}</p>` : ''}</div>
          <div class="fld"><label for="n-text">When suits you</label><textarea id="n-text" name="text" rows="4">${esc(s.text)}</textarea></div>
          <div class="btnrow"><button type="submit" class="btn btn--kobalt" disabled>Send →</button></div>
        </form></div>`;
    }
    el.innerHTML = `<div class="notewrap">${toggle}${box}</div>`;
  };
  draw();
  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-note-toggle]')) {
      noteState.open = !noteState.open; draw();
      if (noteState.open) el.querySelector<HTMLElement>('#n-name')?.focus();
    }
  });
  el.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id === 'n-name') noteState.name = t.value;
    else if (t.id === 'n-phone') noteState.phone = t.value;
    else if (t.id === 'n-text') noteState.text = t.value;
  });
  // Son gönderim demo'da pasif: not kaydedilmez, teşekkür ekranı yok
  el.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation(); // üst sayfanın kendi form işleyicisi çalışmasın
  });
}
