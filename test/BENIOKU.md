# Uçtan uca testler

Oyunları TikTok'a bağlanmadan baştan sona test eder: sunucuyu **boş bir yan portta** ve geçici klasörlerle açar
(canlı oyuna, `durum.json`'a, `loglar/`'a dokunmaz), sahne sayfasını görünmez bir Chrome'da açar, yorum / beğeni /
hediye olaylarını TikTok'tan gelmiş gibi gönderir ve sonucu oyunun **JSON loglarından** ve sayfadaki anlık durumdan kontrol eder.

```bash
cd test
npm install
npm test               # hepsi
npm run test:alay      # sadece Padişah Alayı (test:dugun, test:sira)
GORUNUR=1 npm test     # tarayıcıyı görerek
```

Windows'ta kurulu Chrome kullanılır. Başka bir tarayıcı için: `CHROME_YOLU=...`.
GitHub'da her PR'da otomatik çalışır (`.github/workflows/testler.yml`).

## Loglar

Oyunda olan her şey `<oyun>/loglar/YYYY-MM-DD.jsonl` dosyasına satır satır JSON olarak düşer (14 gün saklanır)
ve oyun açıkken `http://localhost:3200/api/log` adresinden okunur.

| tur | kaynak | ne |
|---|---|---|
| `basladi`, `baglanti`, `sse`, `sifirla` | sunucu | sunucu açıldı, TikTok bağlantı durumu, sayfa bağlandı, sıfırlandı |
| `tiktok` | tiktok | TikTok'tan gelen yorum / beğeni / hediye / takip / paylaşım |
| `enjekte` | test | test masası, kontrol paneli ya da testlerden gelen olay |
| `girdi` | sayfa | oyunun işlediği olay |
| `oyun` | sayfa | oyun olayı (`olay`: announce, banner, ruleHit, giftlog, rolDegisti, durak, varis…) |
| `katildi`, `rol`, `ayrildi` | sayfa | kişi geldi / rolü değişti (`eski` → `yeni`) / ayrıldı |
| `gecis` | sayfa | durum değişti (`alan`: seviye, durum, sefer, durak, ayakta) |
| `hata` | sayfa | sayfadaki JavaScript hatası |

Sayfa kayıtlarında `sayfa: "sahne"` (yayın penceresi, `?clean`) ya da `"panel"` yazar.

Süzme: `/api/log?tur=rol,katildi`, `/api/log?olay=gift`, `/api/log?since=120` (120. kayıttan sonrası), `&limit=50`.
