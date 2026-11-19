// 2026-27 Trendyol Süper Lig takımları (18 takım) ve iç saha formaları.
// desen: duz | cubuk (dikey çubuklar) | yarim (sol a, sağ b) | dortlu (dört parça) | cember (yatay çemberler)
//        | kusak (göğüste yatay şerit) | omuz (omuz/yaka bölgesi b)
// Renkler 2026-27 iç saha formalarından (footyheadlines, footballkitarchive, spor basını) yaklaşık alındı.
// a/b: forma renkleri, kolL/kolR: kollar, sort: şort, corap: çorap, yazi: forma üstü yazı/numara rengi
// alias: yorumda geçerse o takım seçilir (küçük harf, Türkçe karaktersiz; kısa olanlar tam kelime eşleşir)
export const TAKIMLAR = [
  { id: 'gs', ad: 'Galatasaray', kisa: 'GS', alias: ['galatasaray', 'galata', 'gs', 'cimbom', 'cim bom', 'aslan'],
    desen: 'yarim', a: '#FDB912', b: '#A90432', kolL: '#FDB912', kolR: '#A90432', sort: '#A90432', corap: '#A90432', yazi: '#ffffff' },
  { id: 'fb', ad: 'Fenerbahçe', kisa: 'FB', alias: ['fenerbahce', 'fener', 'fb', 'kanarya', 'fenerbah'],
    desen: 'cubuk', n: 7, a: '#002D72', b: '#FFED00', kolL: '#002D72', kolR: '#002D72', sort: '#002D72', corap: '#002D72', yazi: '#ffffff' },
  { id: 'bjk', ad: 'Beşiktaş', kisa: 'BJK', alias: ['besiktas', 'bjk', 'kartal', 'carsi', 'kara kartal', 'besik'],
    desen: 'duz', a: '#F7F7F7', b: '#111111', kolL: '#F7F7F7', kolR: '#F7F7F7', sort: '#F7F7F7', corap: '#F7F7F7', yazi: '#111111', trim: '#111111' },
  { id: 'ts', ad: 'Trabzonspor', kisa: 'TS', alias: ['trabzonspor', 'trabzon', 'ts', 'bordo mavi', 'karadeniz firtinasi', 'trabzo'],
    desen: 'cubuk', n: 5, a: '#8A1E41', b: '#6CADDF', kolL: '#8A1E41', kolR: '#8A1E41', sort: '#8A1E41', corap: '#8A1E41', yazi: '#ffffff' },
  { id: 'ibfk', ad: 'Başakşehir', kisa: 'İBFK', alias: ['basaksehir', 'ibfk', 'basak', 'istanbul basaksehir'],
    desen: 'duz', a: '#F26B21', b: '#14284B', kolL: '#F26B21', kolR: '#F26B21', sort: '#14284B', corap: '#F26B21', yazi: '#14284B', trim: '#14284B' },
  { id: 'samsun', ad: 'Samsunspor', kisa: 'SAM', alias: ['samsunspor', 'samsun'],
    desen: 'cubuk', n: 7, a: '#E30613', b: '#ffffff', kolL: '#ffffff', kolR: '#ffffff', sort: '#E30613', corap: '#E30613', yazi: '#ffffff' },
  { id: 'goztepe', ad: 'Göztepe', kisa: 'GÖZ', alias: ['goztepe', 'goz goz', 'gozgoz', 'goztep'],
    desen: 'dortlu', a: '#E30613', b: '#FFD700', kolL: '#FFD700', kolR: '#E30613', sort: '#111111', corap: '#E30613', yazi: '#111111' },
  { id: 'eyup', ad: 'Eyüpspor', kisa: 'EYÜP', alias: ['eyupspor', 'eyup'],
    desen: 'cubuk', n: 5, a: '#5B2C83', b: '#FFD100', kolL: '#5B2C83', kolR: '#5B2C83', sort: '#5B2C83', corap: '#5B2C83', yazi: '#ffffff' },
  { id: 'kasimpasa', ad: 'Kasımpaşa', kisa: 'KAS', alias: ['kasimpasa', 'kasim pasa', 'kasimp'],
    desen: 'cubuk', n: 7, a: '#1B2A4A', b: '#ffffff', kolL: '#ffffff', kolR: '#ffffff', sort: '#1B2A4A', corap: '#1B2A4A', yazi: '#ffffff' },
  { id: 'konya', ad: 'Konyaspor', kisa: 'KON', alias: ['konyaspor', 'konya', 'anadolu kartali'],
    desen: 'cubuk', n: 5, a: '#00843D', b: '#ffffff', kolL: '#00843D', kolR: '#00843D', sort: '#00843D', corap: '#00843D', yazi: '#ffffff' },
  { id: 'alanya', ad: 'Alanyaspor', kisa: 'ALA', alias: ['alanyaspor', 'alanya'],
    desen: 'cember', n: 4, a: '#F58220', b: '#00843D', kolL: '#F58220', kolR: '#F58220', sort: '#00843D', corap: '#F58220', yazi: '#ffffff' },
  { id: 'rize', ad: 'Rizespor', kisa: 'RİZE', alias: ['rizespor', 'rize', 'caykur', 'caykur rizespor'],
    desen: 'yarim', a: '#00A651', b: '#0072CE', kolL: '#00A651', kolR: '#0072CE', sort: '#0072CE', corap: '#00A651', yazi: '#ffffff' },
  { id: 'gaziantep', ad: 'Gaziantep FK', kisa: 'GFK', alias: ['gaziantep', 'antep', 'gfk', 'gaziantepspor'],
    desen: 'cubuk', n: 5, a: '#D71920', b: '#111111', kolL: '#111111', kolR: '#111111', sort: '#111111', corap: '#D71920', yazi: '#ffffff' },
  { id: 'kocaeli', ad: 'Kocaelispor', kisa: 'KOC', alias: ['kocaelispor', 'kocaeli', 'izmit'],
    desen: 'cubuk', n: 5, a: '#009A44', b: '#111111', kolL: '#111111', kolR: '#111111', sort: '#111111', corap: '#009A44', yazi: '#ffffff' },
  { id: 'genclerbirligi', ad: 'Gençlerbirliği', kisa: 'GB', alias: ['genclerbirligi', 'gencler', 'genclerbirlik', 'gb'],
    desen: 'yarim', a: '#D0101E', b: '#111111', kolL: '#D0101E', kolR: '#111111', sort: '#111111', corap: '#111111', yazi: '#ffffff' },
  { id: 'amed', ad: 'Amedspor', kisa: 'AMED', alias: ['amedspor', 'amed', 'diyarbakir', 'diyarbakirspor'],
    desen: 'cubuk', n: 5, a: '#00843D', b: '#D2232A', kolL: '#00843D', kolR: '#00843D', sort: '#00843D', corap: '#00843D', yazi: '#C9A227' },
  { id: 'corum', ad: 'Çorum FK', kisa: 'ÇOR', alias: ['corum', 'corumspor', 'corum fk'],
    desen: 'cubuk', n: 5, a: '#E30613', b: '#111111', kolL: '#E30613', kolR: '#E30613', sort: '#111111', corap: '#E30613', yazi: '#ffffff', trim: '#111111' },
  { id: 'erzurum', ad: 'Erzurumspor', kisa: 'ERZ', alias: ['erzurumspor', 'erzurum', 'dadas', 'bb erzurum'],
    desen: 'duz', a: '#0057A8', b: '#ffffff', kolL: '#0057A8', kolR: '#0057A8', sort: '#ffffff', corap: '#0057A8', yazi: '#ffffff', trim: '#ffffff' },
];
export const TAKIM = Object.fromEntries(TAKIMLAR.map((t) => [t.id, t]));

// yorumlar gevşek eşleşir: büyük/küçük harf, tırnak, noktalama ve Türkçe harf farkı önemsiz
export const norm = (s) => String(s || '').toLocaleLowerCase('tr')
  .replace(/[ıîİ]/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/[üû]/g, 'u').replace(/â/g, 'a')
  .replace(/[^a-z0-9]+/g, ' ').trim();

// Yorumdaki takımı bul. Uzun takma adlar kelimenin başında geçmesi yeterli ("galatasarayyy", "fenerbahceliyim"),
// kısa olanlar (gs, fb, ts, bjk) tek başına kelime olmalı. Birden çok takım geçerse ilk yazılan seçilir.
export function takimBul(text) {
  const t = norm(text);
  if (!t) return null;
  const s = ` ${t} `, kel = t.split(' ');
  let en = null, enYer = 1e9;
  for (const T of TAKIMLAR) {
    for (const a of T.alias) {
      let yer = -1;
      if (a.includes(' ')) yer = s.indexOf(` ${a}`);
      else if (a.length <= 3) { const i = kel.indexOf(a); if (i >= 0) yer = s.indexOf(` ${a} `); }
      else { const i = kel.findIndex((k) => k.startsWith(a)); if (i >= 0) yer = s.indexOf(` ${kel[i]}`); }
      if (yer >= 0 && yer < enYer) { en = T; enYer = yer; }
    }
  }
  return en;
}

// forma dokusu (kanvas): göğüs ve sırt aynı deseni kullanır
const DOKU = new Map();
export function formaCiz(T, w = 128, h = 128, numara) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = T.a; x.fillRect(0, 0, w, h);
  if (T.desen === 'cubuk') {
    const n = T.n || 5, sw = w / n;
    x.fillStyle = T.b;
    for (let i = 1; i < n; i += 2) x.fillRect(i * sw, 0, sw, h);
  } else if (T.desen === 'yarim') {
    x.fillStyle = T.b; x.fillRect(w / 2, 0, w / 2, h);
  } else if (T.desen === 'dortlu') {
    x.fillStyle = T.b; x.fillRect(w / 2, 0, w / 2, h / 2); x.fillRect(0, h / 2, w / 2, h / 2);
  } else if (T.desen === 'cember') {
    const n = T.n || 4, sh = h / (n * 2);
    x.fillStyle = T.b; for (let i = 0; i < n; i++) x.fillRect(0, sh * (i * 2 + 1), w, sh);
  } else if (T.desen === 'kusak') {
    x.fillStyle = T.b; x.fillRect(0, h * 0.3, w, h * 0.2);
  } else if (T.desen === 'omuz') {
    x.fillStyle = T.b; x.fillRect(0, 0, w, h * 0.16);
    x.beginPath(); x.moveTo(w * 0.32, h * 0.16); x.lineTo(w * 0.5, h * 0.34); x.lineTo(w * 0.68, h * 0.16); x.fill();
  }
  if (T.trim) { // yaka ve yan şeritler
    x.fillStyle = T.trim;
    x.fillRect(0, 0, w * 0.07, h); x.fillRect(w * 0.93, 0, w * 0.07, h);
    x.beginPath(); x.moveTo(w * 0.36, 0); x.lineTo(w * 0.5, h * 0.14); x.lineTo(w * 0.64, 0); x.lineTo(w * 0.58, 0); x.lineTo(w * 0.5, h * 0.08); x.lineTo(w * 0.42, 0); x.fill();
  }
  // hafif kumaş gölgesi (alt kısım koyu)
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  if (numara != null) {
    x.font = `900 ${h * 0.42}px Nunito, Arial Black, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = h * 0.05; x.strokeStyle = 'rgba(0,0,0,.35)'; x.strokeText(String(numara), w / 2, h * 0.56);
    x.fillStyle = T.yazi || '#fff'; x.fillText(String(numara), w / 2, h * 0.56);
  } else { // göğüste küçük arma
    x.fillStyle = T.yazi || '#fff'; x.globalAlpha = 0.9;
    x.beginPath(); x.arc(w * 0.68, h * 0.3, w * 0.07, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
  }
  return c;
}
export function formaDokusu(THREE, T, numara) {
  const k = T.id + ':' + (numara ?? '');
  let tx = DOKU.get(k);
  if (!tx) {
    tx = new THREE.CanvasTexture(formaCiz(T, 128, 128, numara));
    tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
    DOKU.set(k, tx);
  }
  return tx;
}
// arayüzdeki küçük forma simgesi (data URL)
const IKON = new Map();
export function formaIkon(T) {
  let u = IKON.get(T.id);
  if (u) return u;
  const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d');
  const desen = formaCiz(T, 64, 64);
  // tişört silueti
  x.beginPath();
  x.moveTo(20, 6); x.lineTo(26, 4); x.quadraticCurveTo(32, 12, 38, 4); x.lineTo(44, 6); x.lineTo(60, 16); x.lineTo(53, 28); x.lineTo(47, 24);
  x.lineTo(47, 60); x.lineTo(17, 60); x.lineTo(17, 24); x.lineTo(11, 28); x.lineTo(4, 16); x.closePath();
  x.save(); x.clip(); x.drawImage(desen, 0, 0, s, s);
  x.fillStyle = T.kolL; x.beginPath(); x.moveTo(20, 6); x.lineTo(4, 16); x.lineTo(11, 28); x.lineTo(17, 24); x.closePath(); x.fill();
  x.fillStyle = T.kolR; x.beginPath(); x.moveTo(44, 6); x.lineTo(60, 16); x.lineTo(53, 28); x.lineTo(47, 24); x.closePath(); x.fill();
  x.restore();
  x.lineWidth = 2.5; x.strokeStyle = 'rgba(0,0,0,.55)';
  x.beginPath();
  x.moveTo(20, 6); x.lineTo(26, 4); x.quadraticCurveTo(32, 12, 38, 4); x.lineTo(44, 6); x.lineTo(60, 16); x.lineTo(53, 28); x.lineTo(47, 24);
  x.lineTo(47, 60); x.lineTo(17, 60); x.lineTo(17, 24); x.lineTo(11, 28); x.lineTo(4, 16); x.closePath(); x.stroke();
  u = c.toDataURL(); IKON.set(T.id, u);
  return u;
}
