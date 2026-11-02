/**
 * Sitenin kendi açılır listesi: yerel (işletim sistemi) <select> açılır menüsü hiç görünmez.
 * Yerel select DOM'da gizli kalır; değer, FormData ve `change` olayı onun üzerinden aynen çalışır.
 * Kök sonradan innerHTML ile yeniden çizilse de (admin) yeni select'ler kendiliğinden dönüştürülür.
 */
let uid = 0;
let open: { wrap: HTMLElement; close: () => void } | null = null;

const ARROW = '<svg class="combo__arrow" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function labelOf(sel: HTMLSelectElement) {
  if (sel.getAttribute('aria-label')) return sel.getAttribute('aria-label')!;
  const l = sel.closest('label') ?? (sel.id ? document.querySelector(`label[for="${sel.id}"]`) : null);
  if (!l) return '';
  return Array.from(l.childNodes).filter((n) => !n.contains(sel)).map((n) => n.textContent).join(' ').trim();
}

function build(sel: HTMLSelectElement) {
  sel.dataset.combo = '1';
  const id = `combo-${++uid}`;
  const wrap = document.createElement('span');
  wrap.className = 'combo';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'combo__btn';
  btn.id = `${id}-btn`;
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', `${id}-list`);
  const name = labelOf(sel);
  if (name) btn.setAttribute('aria-label', name);
  btn.disabled = sel.disabled;
  btn.innerHTML = `<span class="combo__v"></span>${ARROW}`;
  const list = document.createElement('ul');
  list.className = 'combo__list';
  list.id = `${id}-list`;
  list.setAttribute('role', 'listbox');
  list.tabIndex = -1;
  list.hidden = true;
  if (name) list.setAttribute('aria-label', name);
  const opts = Array.from(sel.options);
  list.innerHTML = opts.map((o, i) => `<li role="option" id="${id}-o${i}" data-i="${i}">${o.textContent}</li>`).join('');
  const items = Array.from(list.children) as HTMLElement[];
  let active = -1;

  const sync = () => {
    btn.querySelector('.combo__v')!.textContent = sel.selectedOptions[0]?.textContent ?? '';
    items.forEach((li, i) => li.setAttribute('aria-selected', String(i === sel.selectedIndex)));
  };
  const setActive = (i: number) => {
    active = Math.max(0, Math.min(items.length - 1, i));
    items.forEach((li, k) => li.classList.toggle('is-active', k === active));
    list.setAttribute('aria-activedescendant', items[active].id);
    items[active].scrollIntoView({ block: 'nearest' });
  };
  const close = (focus = false) => {
    if (list.hidden) return;
    list.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    items.forEach((li) => li.classList.remove('is-active'));
    if (open?.wrap === wrap) open = null;
    if (focus) btn.focus({ preventScroll: true });
  };
  const show = () => {
    if (btn.disabled) return;
    open?.close();
    list.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    // aşağıda yer yoksa liste düğmenin üstünde açılır
    const r = btn.getBoundingClientRect();
    wrap.classList.toggle('combo--up', innerHeight - r.bottom < Math.min(list.scrollHeight, 264) + 12 && r.top > innerHeight - r.bottom);
    setActive(Math.max(0, sel.selectedIndex));
    list.focus({ preventScroll: true });
    open = { wrap, close: () => close() };
  };
  const choose = (i: number) => {
    const changed = i !== sel.selectedIndex;
    sel.selectedIndex = i;
    sync();
    close(true);
    if (changed) {
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  btn.addEventListener('click', () => (list.hidden ? show() : close()));
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); show(); }
  });
  list.addEventListener('click', (e) => {
    e.preventDefault(); // <label> içindeyse etiket, tıklamayı düğmeye yeniden göndermesin
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (li) choose(Number(li.dataset.i));
  });
  list.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (k === 'Home') { e.preventDefault(); setActive(0); }
    else if (k === 'End') { e.preventDefault(); setActive(items.length - 1); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
    else if (k === 'Escape') { e.preventDefault(); close(true); }
    else if (k === 'Tab') close();
  });
  list.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget as Node)) close(); });

  sel.classList.add('combo__native');
  sel.tabIndex = -1;
  sel.setAttribute('aria-hidden', 'true');
  sel.addEventListener('change', sync); // değer koddan değişirse
  sel.before(wrap);
  wrap.append(btn, list, sel);
  sync();
}

export function initCombos(root: HTMLElement) {
  const run = () => root.querySelectorAll<HTMLSelectElement>('select:not([data-combo])').forEach(build);
  run();
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
  document.addEventListener('pointerdown', (e) => { if (open && !open.wrap.contains(e.target as Node)) open.close(); });
}
