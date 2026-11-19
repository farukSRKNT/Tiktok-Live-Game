# Padişah Alayı modelleri (Blender betikleri)

`modeller/` klasöründeki `.glb` dosyaları bu klasördeki Blender Python betikleriyle üretilir.
Hepsi bu proje için sıfırdan yapıldı; dışarıdan model, doku ya da çizim kullanılmadı.

## Yeniden üretmek

Blender 4.2 veya üstü (5.2 ile denendi). `padisah-alayi` klasöründe:

```
blender -b --factory-startup --python araclar/blender/modelle.py
blender -b --factory-startup --python araclar/blender/modelle.py -- kadirga ev --onizle
```

- Ad filtresi verilirse sadece o adla başlayan modeller üretilir (`yeniceri`, `kadirga`, `ev` …).
- `--onizle` her model için `araclar/blender/onizleme/` altına hızlı bir PNG çizer (depoya girmez).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `ortak.py` | Oyun koordinatında parça üretimi (kutu, silindir, koni, küre, çubuk, ızgara), köşe renkleri, GLB dışa aktarma, önizleme |
| `figurler.py` | Yaya figür (`insan`), at (`at`), atlı; padişah, İbrahim Paşa, yeniçeri (4 renk), mehter (davul/zurna/zil/nakkare/boru), sancaktar (kırmızı/yeşil), musahip, sipahi (3 at rengi) |
| `yapilar.py` | Kadırga (üç hilalli yeşil sancak), liman (rıhtım, iskele, ambarlar, fener kulesi) ve 4 çeşit Osmanlı evi |
| `modelle.py` | Hepsini üretip `modeller/` klasörüne yazar |

## Nasıl çalışıyor

- Her hareketli parça ayrı bir düğüm ve oyundaki kod iskeletiyle aynı adı taşır (`govde`, `kolL`, `kolR`, `bacakL`, `bacakR`, `bas`, `bayrak`, `at_govde`, `at_boyun`, `at_kuyruk`, `at_bacak0..3`). Düğümün merkezi eklem noktasıdır (omuz, kalça, boyun). Oyun bu adları bulunca yürüyüşü, selamı, "çok yaşa"yı ve bayrak dalgasını kendisi oynatır.
- Renkler doku yerine köşe rengi olarak saklanır; her parça tek ağ ve en fazla iki malzeme (boya, maden) → az çizim çağrısı.
- Ölçü oyun birimiyle aynıdır (yaya ~2 birim, atlı ~3.3 birim); oyun iskeletli modeli yeniden ölçeklemez.

## Hazır model araması

Osmanlı temalı, serbest lisanslı (CC0 / CC-BY) hazır model arandı (Sketchfab, Poly Haven, Quaternius, OpenGameArt, CGTrader).
Kadırga, yeniçeri, mehter ya da Osmanlı evi için serbest lisanslı uygun bir model bulunamadı: bulunanlar ücretli
ya da özel lisanslıydı, serbest olanlar ise ortaçağ Avrupa temalıydı (şövalye vb.) ve temayı bozuyordu.
Bu yüzden hepsi burada modellendi.
