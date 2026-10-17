export const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const q = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const qa = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

export function download(name: string, text: string, type = 'text/calendar') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function field(id: string, label: string, opts: { type?: string; value?: string; autocomplete?: string; hint?: string; inputmode?: string; required?: boolean; error?: string; maxlength?: number } = {}) {
  const err = opts.error ? `<p class="err" id="${id}-err">${esc(opts.error)}</p>` : '';
  return `<div class="fld"><label for="${id}">${esc(label)}</label>
    <input id="${id}" name="${id}" type="${opts.type ?? 'text'}" value="${esc(opts.value ?? '')}" ${opts.autocomplete ? `autocomplete="${opts.autocomplete}"` : ''} ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''} ${opts.maxlength ? `maxlength="${opts.maxlength}"` : ''} ${opts.error ? `aria-invalid="true" aria-describedby="${id}-err"` : opts.hint ? `aria-describedby="${id}-hint"` : ''}>
    ${opts.hint ? `<p class="hint" id="${id}-hint">${esc(opts.hint)}</p>` : ''}${err}</div>`;
}
