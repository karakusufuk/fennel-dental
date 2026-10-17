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

## Aşama 3
- **/start/ başlığı:** belge sayfa başlığı vermiyor; ana sayfa hero sloganı ve paragrafı kullanıldı (yeni metin icat edilmedi).
- **Akış mantığı `src/lib/startflow.ts`'e ayrıldı** ve 170 yolun hepsi Node ile sayıldı (sonuç, süre, notlar, N): tutarsızlık yok.
- **Bayraklar (`first-visit`, `anxious`, `smoker`, `urgent`) sağlık verisi sayıldı:** onay verilmezse hiçbiri /book/'a taşınmaz (belge "cevaplar taşınmaz, sadece tedavi + süre" diyor; bayraklar cevaplardan türediği için aynı kuralla). `urgent` da onaysız taşınmıyor; yani onaysız kullanıcıda en erken saat önceden seçilmez.
- **"A little" cevabı** yalnız not ekler, bayrak eklemez (belge: "sadece not").
- **Randevu butonu tedavi eşlemesi:** Pain/Gum/Repair → `examination` (anında onay), A1 → `whitening`, A2 → `braces-and-aligners`, A3 → `crowns-and-veneers`, Braces → `braces-and-aligners`, Missing → `implants`, Check-up → `check-up-and-clean`. Gerekçe: butonun anında/talep tipi tedavinin gerçek moduyla çelişmesin.
- **Onay kutusu köşesi 4px** (20px kutuda 10px daire olurdu).
- **Çocuk ortodonti sonucunda ikinci satır** "Clear aligners, if advised" / "Fixed braces, if advised" (belge: discreet/fine cevabı satır 2'yi değiştirir).
- **Geri tuşu:** her ileri adım `pushState`; `← Back` da yeni kayıt ekler (tarayıcı geri tuşu bir önceki adıma döner).
