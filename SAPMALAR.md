# Sapmalar ve kararlar

Paket belgelerinden ayrılan ya da belgenin boş bıraktığı yerlerde verilen kararlar. Biçim: ne · neden · alternatif.

## Aşama 0
- **Tedavi sekmeleri kapatıldı, mobilde numaralı liste geri geldi.** Paket (Aşama 0) numaralı listeyi istiyor. Sekmeli sahne kodu (`.tscene`, `.ttabs`, Treatments.astro içinde) silinmedi, sadece `display:none`. Alternatif: sekmeler kalsın diye `.tscene{display:flex}` ve `.tlist{display:none}` mobil kuralları geri eklenir.
- **Trackpad ayrımı yapılmadı.** Yumuşak kaydırma (`smooth.ts`) trackpad'de de çalışıyor; kullanıcı bu hâli "harika" diye onayladı. Alternatif: `deltaY` 120'nin katı değilse yerel kaydırmaya bırakmak.
- **Hero'daki canlı şerit mobilde butonların altında geri geldi** (tek satır, 12px); paragraf şeridin altında.

## Aşama 1–2
- **Tedavi listesinde 08 Emergency care'in süresi `30 min`** (belge boş bırakmış; 05-tedavi-icerikleri'ndeki randevu süresi). Ücret `€[FEE]`.
- **Önceki/Sonraki gezinmesi halka şeklinde** (01'in "Previous" linki 08 Emergency care'e, 07'nin "Next" linki 08'e gider); belge uçlar için bir şey demiyor.
- **Tek görselli tedavi sahnelerinde ilerleme çubuğu yok** (`n / 5` yalnız ana sayfadaki 5'li seçici içindi); BEFORE/AFTER, 3 sn silme, Play again birebir.
- **Whitening kaydırıcısında "önce" katmanının sepia filtresi görselin zemin rengini de sarartıyor** (panel zemini `--sahne`, görselin zemini filtreyle değişiyor). Belge filtreyi aynen verdiği için olduğu gibi bırakıldı. Alternatif: yalnız dişe maske uygulamak.
- **Whitening, Crowns and veneers tedavi sahneleri/hekimler:** `05-tedavi-icerikleri.md` eşleşmesi aynen; Emergency care → Aoife Murphy ve Daniel O'Connor profilinde "Emergency care" linki.
- **Hekim profilinde "Next free slots"** randevu katmanından gecikmesiz okunur (`nextSlots`); liste `Examination` süresine göre.
- **Hero preload'ları yalnız ana sayfada** (alt sayfalarda gereksiz yük olmasın diye `head` slot'una taşındı).
- **Yasal sayfalar:** bölüm başlıkları ben seçtim (Who we are, What we collect …); gövde `[LEGAL TEXT — to be supplied by the clinic]`.
- **Header'daki `My appointments` linki 1100px altında gizli** (sığmıyor); footer'da her zaman var, mobilde menüde.
