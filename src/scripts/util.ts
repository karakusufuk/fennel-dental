export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 200ms opaklık geçişiyle içerik değiştirir (reduced-motion'da doğrudan). */
export function fadeSwap(el: HTMLElement, change: () => void) {
  if (reducedMotion()) { change(); return; }
  el.classList.add('is-out');
  window.setTimeout(() => {
    change();
    // yeni içerik bir kare boyunca gizli kalsın, sonra açılsın
    requestAnimationFrame(() => el.classList.remove('is-out'));
  }, 200);
}

export const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
