// İstanbul → Manisa güzergâhı (Şehzade Süleyman'ın sancağı Saruhan/Manisa).
// Eski Anadolu yolu: Üsküdar → Gebze → Dil İskelesi'nden körfez geçişi → Hersek → İznik → Gemlik → Bursa
// → Ulubat → Mihaliç → Susurluk → Balıkesir → Savaştepe → Soma → Kırkağaç → Akhisar → Manisa
// km: İstanbul'dan yaklaşık yol mesafesi. lat/lon: haritadaki yeri.
// biyom: o duraktan bir sonrakine kadar yol kenarında görülecek doğa (dunya.js).
// yapi: durağa yaklaşınca yol kenarında beliren yapı (dunya.js → YAPILAR).

export const DURAKLAR = [
  { ad: 'İstanbul', alt: 'Topkapı Sarayı', km: 0, lat: 41.011, lon: 28.983, biyom: 'sehir', yapi: 'saray', ikon: '🕌',
    bilgi: 'Alay Bâb-ı Hümâyun\'dan çıkıyor. Yol uzun, sancak Manisa\'da!' },
  { ad: 'Boğaziçi', alt: 'Saltanat kayıklarıyla geçiş', km: 1.2, lat: 41.018, lon: 29.0, biyom: 'deniz', yapi: null, ikon: '⛵',
    bilgi: 'Atlar ve askerler mavnalarla Anadolu yakasına geçiriliyor.' },
  { ad: 'Üsküdar', alt: 'Anadolu\'nun kapısı', km: 3.6, lat: 41.023, lon: 29.015, biyom: 'sehir', yapi: 'cami', ikon: '🕌',
    bilgi: 'Anadolu yollarının başlangıcı. Kervanlar ve ordular buradan yola çıkar.' },
  { ad: 'Kartal', alt: 'Marmara kıyısı', km: 18, lat: 40.89, lon: 29.19, biyom: 'sahil', yapi: null, ikon: '🌊',
    bilgi: 'Yol deniz kıyısından ilerliyor. Sağda Marmara, karşıda Adalar.' },
  { ad: 'Gebze', alt: 'Menzil konağı', km: 46, lat: 40.80, lon: 29.43, biyom: 'kir', yapi: 'cami', ikon: '🏘️',
    bilgi: 'Rivayete göre Hannibal\'in mezarı bu topraklarda. Atlar burada dinlenir.' },
  { ad: 'Dil İskelesi', alt: 'İzmit Körfezi geçişi', km: 56, lat: 40.765, lon: 29.45, biyom: 'deniz', yapi: 'iskele', ikon: '⛵',
    bilgi: 'Körfezin en dar yeri. Alay kayıklarla Hersek\'e geçiyor.' },
  { ad: 'Hersek', alt: 'Hersekzâde\'nin hanı', km: 62, lat: 40.72, lon: 29.52, biyom: 'sahil', yapi: 'han', ikon: '🏰',
    bilgi: 'Hersekzâde Ahmed Paşa\'nın yaptırdığı han ve cami. Yolcular burada konaklar.' },
  { ad: 'İznik', alt: 'Surlar ve çiniler', km: 118, lat: 40.43, lon: 29.72, biyom: 'gol', yapi: 'kale', ikon: '🏯',
    bilgi: 'Roma surları, Yeşil Cami ve dünyaca ünlü İznik çinileri. Solda İznik Gölü.' },
  { ad: 'Gemlik', alt: 'Zeytin ve deniz', km: 166, lat: 40.43, lon: 29.15, biyom: 'zeytinlik', yapi: null, ikon: '🫒',
    bilgi: 'Körfez kıyısında zeytin bahçeleri. Bursa\'ya az kaldı.' },
  { ad: 'Bursa', alt: 'Osmanlı\'nın ilk başkenti', km: 196, lat: 40.18, lon: 29.06, biyom: 'bursa', yapi: 'ulucami', ikon: '🕌',
    bilgi: 'Ulu Cami, Yeşil Türbe ve ardında karlı Keşiş Dağı (Uludağ). Ecdat burada yatıyor.' },
  { ad: 'Ulubat Gölü', alt: 'Apolyont', km: 232, lat: 40.17, lon: 28.62, biyom: 'gol', yapi: null, ikon: '🦢',
    bilgi: 'Sazlıklar, leylekler ve balıkçı köyleri. Göl solumuzda.' },
  { ad: 'Mihaliç', alt: 'Bugünkü Karacabey', km: 248, lat: 40.21, lon: 28.36, biyom: 'ova', yapi: 'kopru', ikon: '🌉',
    bilgi: 'Susurluk Çayı taş köprüden geçiliyor. Ovada at sürüleri otluyor.' },
  { ad: 'Susurluk', alt: 'Çay boyu', km: 282, lat: 39.91, lon: 28.16, biyom: 'ova', yapi: null, ikon: '🌾',
    bilgi: 'Bereketli ovalar, buğday tarlaları ve kavaklar.' },
  { ad: 'Balıkesir', alt: 'Karesi diyarı', km: 322, lat: 39.65, lon: 27.88, biyom: 'kir', yapi: 'cami', ikon: '🕌',
    bilgi: 'Eski Karesi Beyliği\'nin merkezi. Zağanos Paşa Camii burada.' },
  { ad: 'Savaştepe', alt: 'Çam ormanları', km: 352, lat: 39.38, lon: 27.66, biyom: 'orman', yapi: null, ikon: '🌲',
    bilgi: 'Yol çam ormanlarının arasından geçiyor. Serin ve gölgelik.' },
  { ad: 'Soma', alt: 'Bakırçay vadisi', km: 384, lat: 39.19, lon: 27.61, biyom: 'ova', yapi: 'han', ikon: '🏞️',
    bilgi: 'Bakırçay boyunca verimli topraklar. Menzilde atlar değiştiriliyor.' },
  { ad: 'Kırkağaç', alt: 'Kavunuyla meşhur', km: 396, lat: 39.10, lon: 27.67, biyom: 'ova', yapi: null, ikon: '🍈',
    bilgi: 'Meşhur Kırkağaç kavunu! Köylüler alaya kavun ikram ediyor.' },
  { ad: 'Akhisar', alt: 'Antik Thyateira', km: 418, lat: 38.92, lon: 27.84, biyom: 'zeytinlik', yapi: 'antik', ikon: '🏛️',
    bilgi: 'Antik Thyateira kalıntıları ve uçsuz bucaksız zeytinlikler.' },
  { ad: 'Manisa', alt: 'Şehzadeler şehri', km: 462, lat: 38.61, lon: 27.43, biyom: 'manisa', yapi: 'saray', ikon: '🏰',
    bilgi: 'Saruhan sancağı. Şehzade Süleyman burada sancakbeyi. Arkada Spil Dağı.' },
];

export const TOPLAM_KM = DURAKLAR[DURAKLAR.length - 1].km;

// Sahnedeki yol uzunluğu (birim): kısa duraklar (Boğaz geçişi, şehirler) da ekranda yeterince kalsın,
// uzun aralar fazla sürmesin diye km ile orantılı ama sınırlandırılmış.
{
  let s = 0;
  DURAKLAR.forEach((d, i) => {
    if (i > 0) s += Math.min(260, Math.max(100, (d.km - DURAKLAR[i - 1].km) * 5));
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
