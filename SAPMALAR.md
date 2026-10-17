# Sapmalar ve kararlar

Paket belgelerinden ayrılan ya da belgenin boş bıraktığı yerlerde verilen kararlar. Biçim: ne · neden · alternatif.

## Aşama 0
- **Tedavi sekmeleri kapatıldı, mobilde numaralı liste geri geldi.** Paket (Aşama 0) numaralı listeyi istiyor. Sekmeli sahne kodu (`.tscene`, `.ttabs`, Treatments.astro içinde) silinmedi, sadece `display:none`. Alternatif: sekmeler kalsın diye `.tscene{display:flex}` ve `.tlist{display:none}` mobil kuralları geri eklenir.
- **Trackpad ayrımı yapılmadı.** Yumuşak kaydırma (`smooth.ts`) trackpad'de de çalışıyor; kullanıcı bu hâli "harika" diye onayladı. Alternatif: `deltaY` 120'nin katı değilse yerel kaydırmaya bırakmak.
- **Hero'daki canlı şerit mobilde butonların altında geri geldi** (tek satır, 12px); paragraf şeridin altında.
