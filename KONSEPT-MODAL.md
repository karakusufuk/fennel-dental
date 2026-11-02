# Demo eylemleri (eski "Konsept modalı")

2026-11-02: "Concept site by Ufuk Karakuş" modalı kaldırıldı. Demo eylemleri artık hiçbir mesaj göstermez.

- Bağlantılar (`tel:`, `mailto:`, `#whatsapp`, `#map`, `a.maps`, `a.maps-link`, harita adresleri): `src/scripts/demo-links.ts` belge düzeyinde yakalar ve hiçbir şey yapmaz (arama yok, mesaj yok). Base.astro'da bir kez başlatılır.
- Akışların son onay düğmeleri görünür kalır (etiketiyle), soluk ve pasiftir (`disabled`, `.btn:disabled` %40 opaklık). Başarı ekranı yok:
  - `src/scripts/book.ts`: "Confirm booking →" / "Send booking request →", yeniden planlamada "Save new time →"
  - `src/scripts/waitnote.ts`: "Send →" (Can't find a time that works?)
  - `src/scripts/my.ts`: "Yes, cancel"
- Footer altındaki "Portfolio demo, not a real business. · Designed by Ufuk Karakuş" imzası duruyor.
