# Konsept modalı

Girişte uyarı yok. Modal yalnız bir eylemde açılır: "Concept site by Ufuk Karakuş" + eyleme özel tek cümle + `See how it works →` ve `Close`.
Kapanış: Close, Esc, arka plan. Zamanlayıcı yok. Hiçbir veri gönderilmez.

Dosyalar: `src/components/ConceptModal.astro` (kabuk, Base.astro'da bir kez), `src/scripts/concept-modal.ts` (mantık + metinler), `src/config.ts` (`CASE_STUDY_URL`), stiller `src/styles/site.css` sonu (`.cm*`, `.sig`).
Bağlantı tetikleyicileri belge düzeyinde olay delegasyonuyla yakalanır (script ile çizilen HTML dahil). Akış tetikleyicileri `showConcept(kind)` çağırır ve modal kapanınca mevcut mantık devam eder.

## Tetikleyiciler
Akış (son onay, modal kapanınca devam):
- `src/scripts/book.ts` `onSubmit()` ("Confirm booking →" / "Send booking request →"), doğrulamadan sonra, `createBooking` öncesi: booking
- `src/scripts/book.ts` `onResched()` ("Save new time →"): reschedule
- `src/scripts/waitnote.ts` submit ("Send →", "Can't find a time that works?" notu; book ve my-appointments): waitlist

Bağlantılar (preventDefault + modal):
- tel: Header.astro:19,29 · MobileBar.astro:2 · Footer.astro:27 · GuidedStart.astro:33 · scripts/start.ts:48 · pages/clinic/index.astro:10 · pages/emergency/index.astro:12
- mailto: Footer.astro:29 · pages/clinic/index.astro:12
- Harita (`a.maps`, `a.maps-link`, `#map`): Footer.astro:43 · pages/clinic/index.astro:21
- WhatsApp (`#whatsapp`, gerçek bağlantı değildi): Footer.astro:28 · pages/clinic/index.astro:11

## Gövde metinleri
- booking: In a live build, this booking would go straight into the clinic's calendar and the patient would get an SMS confirmation.
- reschedule: In a live build, the new time would replace the old one in the clinic's calendar and the patient would get an SMS confirmation.
- waitlist: In a live build, this note would join the clinic's waiting list and the front desk would call if a time opens up.
- phone: In a live build, this would ring the clinic's front desk.
- whatsapp: In a live build, this would open a WhatsApp chat with the clinic's front desk.
- email: In a live build, this would open a message to the clinic's reception.
- address: In a live build, this would open directions to the clinic.

## Telefon
`01 555 0182` / `+353 1 555 0182` her yerde `01 234 5018` / `+353 1 234 5018` yapıldı (Header, MobileBar, Footer, GuidedStart, start.ts, book.ts, clinic, emergency, accessibility, noscript metinleri). Eski numaranın gerçek olup olmadığı doğrulanamadı, önlem olarak değiştirildi. İrlanda'da resmi bir "kurgusal aralık" bilmiyorum; yeni numaranın gerçek bir hatta denk gelmediğini kontrol etmedim.

## Footer
Base.astro sonundaki koyu şerit kaldırıldı; yerine footer renginde sade `.sig`: "Portfolio demo, not a real business." ve "Designed by Ufuk Karakuş". Başka "not a real business" notu yoktu.

## robots
`public/robots.txt` (Disallow: /). Base.astro'daki `noindex, nofollow` duruyor.

## Belirsiz / yapılmadı
- `Page.astro` `demo` bayrağıyla /book/, /start/, /my-appointments/ üstünde "DEMO — no real appointments are made..." bandı hâlâ var (girişte değil, ama istenen "uyarı yok" ilkesiyle çelişebilir). Dokunulmadı.
- my-appointments'ta "Yes, cancel" ve SMS kodu gönderme (login) tetikleyici sayılmadı (son onay değil / istenmedi).
- Adres hâlâ `[STREET], Dublin 4` yer tutucusu; e-posta `hello@fennel.dental` gerçek bir alan adı olabilir, değiştirilmedi.
- Waitlist ve reschedule modalı kodla eklendi, tarayıcıda uçtan uca denenmedi (booking, tel, mailto, harita, WhatsApp, mobil sheet denendi).
