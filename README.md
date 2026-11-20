# TikTok canlı yayın halay oyunları

TikTok LIVE için beş etkileşimli oyun. İzleyiciler yorum yazarak, beğeni ve hediye atarak oyuna katılır.

- **canli-dugun**: düğün oyunu (2B). Halay halkası, gelin, damat, takı.
- **sira-gecesi**: sıra gecesi (3B, hamam böcekleri). Sahnede orkestra, ortada çiğ köfte, etrafında halay, yanlarda masalar.
- **padisah-alayi**: padişah alayı (3B). Kanuni Sultan Süleyman atında, İbrahim Paşa arkasında, izleyiciler yeniçeri olarak İstanbul'dan Manisa'ya yürür. Yakın çekim, havadan görüntü, canlı harita ve durak kartları (Üsküdar, İznik, Bursa, Balıkesir, Akhisar…).
- **sehzade-mustafa**: Şehzade Mustafa'nın cenazesi (3B). Şehzade beyaz kaftanıyla, kırmızı örtülü sedyede; öndeki izleyiciler tabutu omuzlar, arkada yeniçeriler. Ereğli'deki Aktepe ordugâhından Bursa'ya yürünür, Muradiye'de defnedilir.
- **stadyum-kavgasi**: stadyum taraftar kavgası (3B). Takımının adını yazan (Galatasaray, Fener, Trabzon…) o takımın formasıyla sahaya iner; az olan taraftarlar kalabalık olana saldırır.

Oyun bilgisayarında bir web sayfası olarak çalışır. Küçük bir sunucu, yayındaki yorum, beğeni ve hediyeleri [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector) ile okur ve oyuna iletir. Sayfayı TikTok LIVE Studio'da pencere yakalamayla yayına verirsin.

## Hızlı kurulum

1. [Node.js](https://nodejs.org) (LTS) kur.
2. [Euler Stream](https://www.eulerstream.com)'den ücretsiz API anahtarı al.
3. Oyun klasöründeki `ayarlar.json`'a TikTok kullanıcı adını ve anahtarı yaz.
4. `hediyeler.json`'da hediyeleri kendine göre ayarla.
5. `BASLAT.bat`'a çift tıkla.
6. TikTok LIVE Studio'da **Pencere yakalama** ile sahne penceresini seç, yayını aç.

Adım adım anlatım ve sorun çözme: **[KURULUM.md](KURULUM.md)**

Kendi müziklerini her oyunun `müzik` klasörüne atabilirsin.

## Loglar ve testler

Oyunda olan her şey (yorum, hediye, rol değişimi, durak…) `loglar/` klasörüne JSON olarak düşer. Oyunları TikTok'suz uçtan uca test etmek için: **[test/BENIOKU.md](test/BENIOKU.md)**
