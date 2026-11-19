# Stadyum Kavgası (port 3400)

TikTok LIVE için 3B stadyum taraftar kavgası. `BASLAT.bat` ile açılır (sunucu + 608×1080 sahne penceresi + kontrol paneli).

## Nasıl oynanır
- Yorumda **takım adı** yazan o takımın formasıyla sahaya iner: `galatasaray`, `GS`, `cimbom`, `Fener`, `fb`, `bjk`, `kartal`, `trabzon`, `ts`, `konya`, `göz göz`, `çaykur`… Tırnak, büyük/küçük harf ve Türkçe harf (ş/s, ğ/g…) önemsiz.
- Kişi başı **en fazla bir** taraftar. **Ölmeden tekrar gelemez**, takım da değiştiremez. Düşünce yine takım yazıp gelir.
- Sadece `katıl` / `kavga` yazan, son takımıyla (yoksa sahada en az kişisi olan takımla) iner.
- Rastgele bir yerden, reklam panolarının üstünden atlayıp sahaya iner. Başının üstünde profil resmi, nick ve can çubuğu.
- **Beğeni** can doldurur. Hediyeler `hediyeler.json`'da: Can doldur, Öfke (çift hasar), Meşale (takıma +30 can), Dev ol, 5 kişilik takviye, Ultras akını.

## Kim kime saldırır
- En kalabalık takımla arasında **15 veya daha fazla** fark olan takımlar **hep en kalabalık takıma** saldırır (ör. 50 GS, 10 FB, 15 TS → FB ve TS, GS'ye vurur).
- Fark 15'in altına inince herkes **en yakınındaki** rakibe vurur; aynı kişiye yığılmamaya çalışırlar.
- Eşik: `public/js/oyun.js` → `FARK = 15`.

## Takımlar ve formalar
2026-27 Süper Lig'in 18 takımı `public/js/takimlar.js`'te. Formalar iç saha formalarına benzetildi (renk, çubuk/parçalı/dörtlü/çember deseni, kol, şort, çorap). Bir rengi beğenmezsen oradan değiştir.

## Ayarlar
- `ayarlar.json` yoksa diğer oyunların ayarlarını (kullanıcı adı, Euler anahtarı) kullanır. Bu dosya git'e eklenmez.
- F5'te durum kaybolmaz (`durum.json`); **Sıfırla** düğmesi her şeyi siler.
- Ses varsayılan kapalı (tribün uğultusu + yumruk sesi). Açmak için panelde düğme ya da adrese `&ses=1`.
- Yavaş bilgisayarda: adrese `&kalite=dusuk` (gölge ve parlama kapanır).
