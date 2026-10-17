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

## Aşama 4
- **`?treatment=` ile gelindiğinde 1. adım atlanır** (2. adımdan başlar); adım göstergesinden geri dönülebilir. `?dentist=` ile birlikte gelirse 3. adımdan başlar. Belge yalnız /start/ için atlamayı söylüyor; ana sayfa/profil linkleri de aynı mantıkla.
- **Seçenek tıklayınca otomatik ilerleme** 1. ve 2. adımda; ayrıca klavye için `Continue →` düğmesi var. "Not sure — book an examination" varsayılan seçili gelir.
- **Gün şeridi:** masaüstünde 7'şerli sayfalar + ok düğmeleri, mobilde 14 gün yatay kayar. Dolu/kapalı günler pasif.
- **Telefon doğrulama:** 8–10 haneli (başındaki +353/0 atılır). Kod, telefondan türetilen 6 haneli demo kodu; /book/ ve /my-appointments/ sayfaları arasında değişmez.
- **Kod hatası ve "kod hiç gönderilmedi" durumu** aynı metni gösterir (*That code doesn't match…*). Belge ayrı metin vermiyor.
- **Yer doldurma hatası:** seçilen saat başkası tarafından alındıysa *That time was just taken. Pick another.* ve 3. adıma dönüş.
- **Mobil özet çubuğu 1100px altında** (belge "mobil" diyor; tablet de aynı). `.mbar` bu sayfada gizlenir, yerine özet satırı gelir.
- **Erteleme:** `/book/?reschedule=<id>` yalnız 3. adımı gösterir, `Save new time →` ile kaydeder; eski saat serbest kalır; onay ekranı `[ MOVED ]`.
- **Bekleme listesi:** /my-appointments/ katılımı adı olmadan `Patient` olarak ekler (hesap yok, ad sorulmuyor).
- **İptal edilen satır:** gri ve üstü çizili + `CANCELLED`.

## Aşama 5
- **Alt rotalar `#hash` ile** (`/admin/#today`, `#week`, `#requests`, `#waiting`, `#settings`, `#activity`): sayfa tek ve statik; belge "alt rotalar" diyor, ayrı dosya şart koşmuyor.
- **Dentist rolü:** varsayılan yalnız kendi sütunu; `All dentists` kutusuyla tüm sütunlar. Week/Requests/Waiting/Settings/Activity yalnız Reception ve Owner (Reception'a Settings/Activity yok). Owner cevapları hekimlerle aynı kuralla görür (hasta onay verdiyse).
- **Tohumlu takvim:** her hekim için tohum = tarih + hekim; talep (request) olanların oranı %12 ve yalnız bugünden sonraki günlerde, yoksa Requests listesi yüzlerce kayıt olurdu. Sahte hasta adları/telefonlar tamamen uydurma (`+353 8X XXX XXXX`).
- **Sürükle-bırak çakışması:** hedef çakışıyorsa çizgili gri "busy" desen; bırakılırsa hiçbir şey değişmez. `repeating-linear-gradient` sadece bu çizgili desen için (belge bunu açıkça istiyor; yüzey gradient'i değil).
- **Koltuk (chair) görünümünde taşıma** hekimi korur, koltuğu değiştirir; hekim görünümünde koltuk, boşsa korunur yoksa otomatik atanır.
- **Mobil Today:** hekim sekmeleriyle seçili hekimin gün listesi + `New appointment`; taşıma `Move…` ile (çekmece formu).
- **Decline nedenleri** (belgede yok): *No availability*, *Not suitable — please call us*, *Duplicate request*.
- **Bekleme listesi simülasyonu:** iptal edilen randevu için ilk uygun bekleyene "SMS" gider (günlüğe yazılır); `Accept` randevu oluşturur, `Decline` sıradakine geçer.
- **Roles tablosu salt-okunur** (belge öyle istiyor); içerik tahminim.
- **Çekmece Escape ile kapanır;** kaydedilmemiş Settings değişikliğinde sekme/hash değişince onay sorulur, sayfadan çıkarken tarayıcı uyarısı.

## Aşama 6
- **Ana sayfada yalnız bağlantılar değişti:** header/footer/mobil çubuk, hero butonları, tedavi `Details →` / `Book this consultation →`, ekip satırları, "What brings you in?" sonuç butonları (`/book/?treatment=<slug>` + `Full fee list` → `/fees/`). Tasarım aynı. `WhatsApp` ve `Open in Maps →` hâlâ `#whatsapp` / `#map` (gerçek adres/numara yok, uydurulmadı).
- **Ana sayfadaki sonuç butonlarının tedavi eşlemesi:** Pain → examination, Appearance → whitening, Braces → braces-and-aligners, Missing tooth → implants, Check-up → check-up-and-clean.
- **Skip link** artık her sayfada `#main`'e gider (önceden yalnız ana sayfadaki `#treatments`'a gidiyordu; alt sayfalarda kırıktı, Lighthouse yakaladı).
- **`/book/`, `/my-appointments/`, `/start/` için yer tutucu min-yükseklik:** betik yüklenirken içerik kaymasın (CLS 0.25 → 0).

## Bilinen eksikler
- `/my-appointments/` mobil LCP ~2,7 sn (içerik betikle çiziliyor); performans 96.
- Admin sürükle-bırak yalnız fareyle (dokunmatikte `Move…`); gerçek parmakla denenmedi.
- Admin `Today` kapalı günlerde (Pazar) ızgara yerine "closed" mesajı gösterir.
- Admin Settings değişiklikleri yeni "tohumlu" günleri etkiler; zaten oluşmuş tohum randevular yeniden üretilmez (`Reset demo data` ile yenilenir).
- Gerçek e-posta/SMS/sunucu yok; tüm veri tarayıcıda (`localStorage`).
- Dış bağlantı `https://www.dentalcouncil.ie/` canlı kontrol edilmedi.

## Ek istekler
- **"All 8 treatments →"** ana sayfada listenin hemen altında, ink renkli düz link (hover'da kobalt), 44px; "Full fee list" ile aynı ölçüde (15px). Aynı yerde mobilde de.
- **Contact:** header (masaüstü + mobil menü) "Clinic" → "Contact", `/clinic/`'e gider. **Footer'da önceden Clinic linki yoktu;** alt satıra `Contact` eklendi. `/clinic/` başlığı *Get in touch.*, etiket `[ CONTACT ]`, `<title>` "Contact". Üç buton açık zemine uyarlandı: `Call` koyu (ink) dolgu, `WhatsApp` ve e-posta 1px ink kenarlı (kobalt yok). WhatsApp linki hâlâ `#whatsapp` (numara yok). Form yok.
- **Smooth scroll:** `smooth.ts`'e dokunulmadı; trackpad ayrımı hiç eklenmemişti (Aşama 0 notu), yani geri alınacak bir şey yok.
- **"Can't find a time that works?":** `/book/` 3. adımda saat ızgarasının altında düz link; açılan alan belgedeki metinlerle, textarea 4 satır, `maxlength` yok, placeholder yok. SMS kodu istemez; tedavi ve hekim (`any` ise hekim yok) otomatik kayda eklenir. Yazılanlar sayfa yeniden çizilse de korunur. Gönderince alanın yerine *Thanks — we'll be in touch if a time opens up.*
- **`addWaitingNote`** (booking.ts) bekleme listesine `kind: 'note'` kaydı yazar; otomatik SMS eşleşmesine (`offerSlot`) girmez.
- **/my-appointments/** "Join waiting list" düğmesi kaldırıldı, aynı form (toggle'sız, açık) kullanılıyor. Eski `joinWaitlist` fonksiyonu booking.ts'te duruyor ama artık çağrılmıyor.
- **Admin → Waiting list:** notlar ad, telefon, tedavi, hekim, tam not (satır sonları korunur), gönderilme zamanı ile; `Called` (aç/kapa) ve `Book…` (yeni randevu çekmecesi, ad/telefon/tedavi/hekim dolu; kaydedince not otomatik `Called` olur). Demo için tohumlu bir örnek not eklendi (uydurma ad). Reception bu notları görür (aramak için).
- **Hata düzeltmesi:** not formu `submit` olayı üst sayfanın form işleyicisine sızıyordu (`stopPropagation` eklendi).

## İnceleme düzeltmeleri
1. **Ana sayfa tedavi görseli (sticky):** ≥901px'te panel `position: sticky; top: 84px` (header 60 + 24), yüksekliği `min(760px, 100vh − 108px)`; görsel 3:4 oranını koruyarak panele sığar. Kaydırmaya bağlı animasyon yok. **761–900px'te sticky yok:** o genişlikte tek kolon ve görsel listenin içine taşındığı için takılmanın anlamı yok (belge ">760" diyor; tek kolon eşiğim 900). Sol liste kısa olduğu için takılma payı küçük (panel neredeyse bölüm boyunda); mekanizma çalışıyor, ama içerik uzamadıkça görsel fark az.
   **Mobilde:** tedaviye basınca görsel ekranda değilse (header ve alt çubuk payıyla) sayfa görsele kayar, kayma bitince geçiş başlar. `smooth.ts`'e `scrollToY()` eklendi: fareli masaüstünde ağır kaydırma, dokunmatikte kendi rAF geçişi (yerel `smooth` bu test ortamında hiç ilerlemediği için ona güvenmedim), `prefers-reduced-motion`'da anında.
2. **Hekim profili:** portre ≥901px'te sticky (`top: 84px`, ekrana sığar, içerik bitince yukarı çıkar). "Next free slots" tıklanabilir: `/book/?dentist=&date=&time=`; tedavi seçilmemişse 1. adımdan başlar, tedavi seçilince hekim ve saat korunur (hekim o tedaviyi yapmıyorsa 2. adıma düşer, saat sıfırlanır; süre uzunsa saat boş değilse otomatik temizlenir). Boş saat yoksa *No free times in the next 14 days.* + `Join the waiting list` → `/book/?dentist=…&note=1` (3. adım, not formu açık).
3. **Footer:** `.page` seviyesinde `padding-bottom: var(--bolum-arasi)` (120 / mobil 72), ana sayfa hariç tüm alt sayfalar. Yapışkan öğeler kendi kapsayıcılarının içinde kaldığı için boşluğa girmez. `/clinic/` sade footer: `© Fennel Dental · Privacy · Cookies · Accessibility`, koyu bant.
4. **SMS doğrulama:** demo kod hiçbir yerde gösterilmez. Mesaj *We've sent a 6-digit code to +353 •• ••• 4821.*; `Resend code` linki 30 sn kapalı, basılınca *Code sent again.*. Kod: 6 haneli rakam kabul edilir (`booking.ts`'te gerçek API için yorum). Hata metinleri: biçim bozuksa *Enter the 6-digit code.*; kod hiç istenmediyse (belgede yok) *Send the code to your phone first.*
5. **Fiyatlar:** tek kaynak `src/data/prices.ts`. Belgede olmayan eşlemeler: **Examination (Not sure…) için `€65–€85`** (rutin–yeni hasta); **Pain/Gum sonucu "Examination and X-ray" `€90`** (65 + küçük röntgen 25); **Gum treatment `€90`** (deep clean, çeyrek başına); **cosmetic/whitening/repair konsültasyonu `€65`** (rutin muayene); **Orthodontic assessment for a child `€80`** (ortodonti konsültasyonu); **Veneers or bonding / Bonding or crown `€250–€1,150`** (bonding alt, veneer/crown üst uç); **Implants or dentures `€2,400–€3,400`** (denture fiyatı listede yok); **3D scan `€160`** (3D CT); **X-rays (check-up, uzun ara) `€25–€80`** (küçük–panoramik). /fees/ tek fiyatlı satırlarda From ve To aynı rakam. Eski demo verisindeki yer tutucular `getSettings()` içinde gerçek fiyata çevrilir. `/fees/` ve tedavi sayfaları yalnız Settings'te varsayılandan **değişmiş** fiyatları ezer.
