# Fennel Dental — ana sayfa

Astro (statik) · vanilla TS · self-host fontlar · AVIF + WebP görseller.
Tasarım kaynağı: `../fennel-dental-ana-sayfa-paket/` (değişmez).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # dist/
npm run gorsel     # assets-src/ → public/img/ (AVIF + WebP, çoklu genişlik)
```

- Metinler ve veri: `src/data/*.ts` (yer tutucular `[MIN]`, `[MAX]`, `[FEE]`, `[DATE]`, `[N]`, `[STREET]`, `[NO]` bilinçli).
- Parallax şiddeti: `.hero { --parallax: 22 }` (`src/styles/site.css`), 0–50 px.
- Canlı müsaitlik şeridi: `data-live="free|earliest"` alanları, randevu motoru bağlanınca doldurulacak.
