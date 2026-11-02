import { $, $$, fadeSwap } from './util';

interface Data { key: string; q: string; answers: [string, string] }

/** Cevaplar hiçbir yere gönderilmez/saklanmaz: yalnız bellekte, sayfa yenilenince sıfırlanır. */
export function initGuided() {
  const sec = $('[data-guided]');
  if (!sec) return;
  const data: Data[] = JSON.parse($('[data-branches]', sec)!.textContent || '[]');
  const branchBtns = $$<HTMLButtonElement>('[data-branch]', sec);
  const qs = $$('[data-q]', sec);
  const ansWrap = $('[data-answers]', sec)!;
  const ansBtns = $$<HTMLButtonElement>('[data-ans]', sec);
  const dyn = $('[data-dyn]', sec)!;
  const call = $('[data-call]', sec)!;
  const results = $$('[data-result]', sec);

  const prog = $('[data-gprog]', sec)!;
  const progN = $('[data-gprog-n]', sec)!;

  // Yüklemede seçim yok: dal ve cevap yalnız kullanıcı dokununca seçilir
  let branch = '';
  let ans = -1;

  const cardKey = () => (!branch || ans < 0 ? '' : branch === 'pain' && ans === 0 ? 'call' : branch);

  const paint = () => {
    const d = data.find((x) => x.key === branch);
    branchBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.branch === branch)));
    qs.forEach((q) => { q.hidden = q.dataset.q !== branch; });
    ansWrap.hidden = !d;
    prog.style.width = d ? '50%' : '25%';
    progN.textContent = d ? '2 / 4' : '1 / 4';
    if (!d) return;
    ansWrap.setAttribute('aria-labelledby', `q-${branch}`);
    ansBtns.forEach((b, i) => {
      b.textContent = d.answers[i];
      b.setAttribute('aria-pressed', String(i === ans));
    });
  };
  const paintCard = () => {
    const k = cardKey();
    call.hidden = k !== 'call';
    results.forEach((r) => { r.hidden = r.dataset.result !== k; });
  };

  branchBtns.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.branch === branch) return;
    branch = b.dataset.branch!;
    ans = -1; // dal değişince cevap seçimi sıfırlanır
    paint();
    fadeSwap(dyn, paintCard);
  }));
  ansBtns.forEach((b, i) => b.addEventListener('click', () => {
    if (i === ans) return;
    const before = cardKey();
    ans = i;
    paint();
    if (cardKey() !== before) fadeSwap(dyn, paintCard);
  }));

  paint();
  paintCard();
}
