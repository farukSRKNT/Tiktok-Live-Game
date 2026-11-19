// Şehzade Mustafa'nın naaşı: Konya Ereğlisi'ndeki Aktepe ordugâhından (Ekim 1553) Bursa'ya, Muradiye'ye.
// Eski kervan yolu: Ereğli → Konya → Ilgın → Akşehir → Afyonkarahisar → Kütahya → İnegöl → Bursa
// km: Ereğli'den yaklaşık yol mesafesi. lat/lon: haritadaki yeri.
// biyom: o duraktan bir sonrakine kadar yol kenarında görülecek doğa (dunya.js).
// yapi: durağa yaklaşınca yol kenarında beliren yapı (dunya.js → YAPILAR). Son durak: türbe ve defin.

export const DURAKLAR = [
  { ad: 'Aktepe', alt: 'Ereğli ordugâhı · Ekim 1553', km: 0, lat: 37.51, lon: 34.05, biyom: 'ordugah', yapi: 'otag', ikon: '⛺',
    bilgi: 'Nahçıvan seferi ordugâhı. Şehzade Mustafa babasının otağında boğduruldu. Ordu yasta.' },
  { ad: 'Konya', alt: 'Mevlânâ\'nın şehri', km: 150, lat: 37.87, lon: 32.49, biyom: 'bozkir', yapi: 'cami', ikon: '🕌',
    bilgi: 'Halk yollara döküldü. Şehzade için gıyabi cenaze namazları kılınıyor.' },
  { ad: 'Ilgın', alt: 'Kaplıca ve han', km: 235, lat: 38.28, lon: 31.91, biyom: 'ova', yapi: 'han', ikon: '🏞️',
    bilgi: 'Kervansarayda kısa mola. Askerler sessizce nöbet tutuyor.' },
  { ad: 'Akşehir', alt: 'Nasreddin Hoca\'nın şehri', km: 290, lat: 38.36, lon: 31.42, biyom: 'gol', yapi: null, ikon: '🌾',
    bilgi: 'Akşehir Gölü solumuzda. Köylüler yol kenarında dua ediyor.' },
  { ad: 'Afyonkarahisar', alt: 'Kara hisar', km: 390, lat: 38.76, lon: 30.54, biyom: 'kir', yapi: 'kale', ikon: '🏯',
    bilgi: 'Kayanın tepesindeki kale. Yol buradan batıya, Kütahya\'ya döner.' },
  { ad: 'Kütahya', alt: 'Germiyan diyarı', km: 490, lat: 39.42, lon: 29.98, biyom: 'orman', yapi: 'cami', ikon: '🌲',
    bilgi: 'Çam ormanları ve çini atölyeleri. Bursa\'ya birkaç konak kaldı.' },
  { ad: 'İnegöl', alt: 'Ovaya iniş', km: 590, lat: 40.08, lon: 29.51, biyom: 'bursa', yapi: 'han', ikon: '🏘️',
    bilgi: 'Karşıda karlı Keşiş Dağı (Uludağ). Bursa göründü.' },
  { ad: 'Bursa', alt: 'Muradiye Külliyesi', km: 635, lat: 40.19, lon: 29.04, biyom: 'bursa', yapi: 'turbe', ikon: '🕌',
    bilgi: 'Şehzade Mustafa, Muradiye\'de ecdadının yanına defnediliyor.' },
];

export const TOPLAM_KM = DURAKLAR[DURAKLAR.length - 1].km;

// Sahnedeki yol uzunluğu (birim): km ile orantılı ama sınırlı (bir tur yaklaşık 10-12 dk sürsün).
{
  let s = 0;
  DURAKLAR.forEach((d, i) => {
    if (i > 0) s += Math.min(240, Math.max(120, (d.km - DURAKLAR[i - 1].km) * 2.2));
    d.s = s;
  });
}
export const TOPLAM_S = DURAKLAR[DURAKLAR.length - 1].s;

// s (yol birimi) → [önceki durak, sonraki durak, oran]
export function aralik(s) {
  const D = DURAKLAR;
  if (s <= 0) return [0, 1, 0];
  for (let i = 0; i < D.length - 1; i++) if (s < D[i + 1].s) return [i, i + 1, (s - D[i].s) / (D[i + 1].s - D[i].s)];
  return [D.length - 2, D.length - 1, 1];
}
export function biyomAt(s) { return DURAKLAR[aralik(Math.min(TOPLAM_S - 0.01, Math.max(0, s)))[0]].biyom; }
export function kmAt(s) { const [a, b, t] = aralik(s); return DURAKLAR[a].km + (DURAKLAR[b].km - DURAKLAR[a].km) * t; }
export function konum(s) {
  const [a, b, t] = aralik(s), A = DURAKLAR[a], B = DURAKLAR[b];
  return { lat: A.lat + (B.lat - A.lat) * t, lon: A.lon + (B.lon - A.lon) * t };
}
