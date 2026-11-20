// Canlı harita: eski kâğıt görünümlü İç Anadolu–Marmara haritası, güzergâh, duraklar ve alayın şu anki yeri.
// Kıyılar elle sadeleştirilmiş yaklaşık çizgiler (sadece havayı versin diye).
import { DURAKLAR, konum } from './rota.js';

const W = 1080, H = 1920;
const FONT = 'Nunito, "Segoe UI", "Segoe UI Emoji", system-ui, sans-serif';

// [lat, lon] halkaları
const MARMARA = [[41.01, 28.98], [40.96, 28.82], [40.98, 28.6], [41.07, 28.25], [40.97, 27.95], [40.97, 27.51], [40.8, 27.3], [40.61, 27.11], [40.5, 26.85], [40.41, 26.67],
  [40.28, 26.5], [40.18, 26.36], [40.05, 26.19], [40.0, 26.22], [40.08, 26.36], [40.15, 26.4], [40.25, 26.55], [40.34, 26.68], [40.4, 26.95], [40.41, 27.3], [40.38, 27.6], [40.4, 27.79],
  [40.47, 27.7], [40.54, 27.82], [40.47, 28.0], [40.35, 27.97], [40.38, 28.4], [40.38, 28.88], [40.36, 29.02], [40.43, 29.15], [40.5, 28.96], [40.53, 28.82], [40.6, 28.98], [40.64, 29.12],
  [40.66, 29.27], [40.72, 29.52], [40.69, 29.61], [40.71, 29.82], [40.76, 29.94], [40.77, 29.8], [40.78, 29.53], [40.76, 29.38], [40.82, 29.3], [40.89, 29.19], [40.98, 29.03]];
const KARADENIZ = [[41.6, 27.4], [41.25, 28.0], [41.2, 28.6], [41.22, 29.08], [41.2, 29.4], [41.15, 29.9], [41.12, 30.6], [41.8, 30.6]];
const BOGAZ = [[41.0, 29.0], [41.06, 29.03], [41.1, 29.06], [41.17, 29.08], [41.22, 29.1]];
const EGE = [[41.6, 25.0], [40.85, 25.0], [40.72, 26.05], [40.62, 26.83], [40.45, 26.45], [40.25, 26.25], [40.05, 26.19], [40.0, 26.22], [39.83, 26.07], [39.48, 26.07], [39.49, 26.34],
  [39.55, 26.6], [39.58, 26.92], [39.5, 26.97], [39.32, 26.69], [39.07, 26.88], [38.93, 26.94], [38.8, 26.97], [38.67, 26.75], [38.55, 26.95], [38.46, 27.11], [38.42, 27.14],
  [38.37, 26.89], [38.37, 26.77], [38.55, 26.6], [38.68, 26.52], [38.45, 26.4], [38.32, 26.3], [37.6, 26.3], [37.6, 25.0]];
const ADALAR = [[39.22, 26.25, 0.36, 0.2], [40.17, 25.85, 0.17, 0.08], [39.83, 26.03, 0.05, 0.04], [40.62, 27.6, 0.12, 0.05]];
const GOLLER = [[40.44, 29.52, 0.17, 0.07, 'İznik Gölü'], [40.17, 28.58, 0.14, 0.05, 'Ulubat'], [38.75, 33.38, 0.32, 0.38, 'Tuz Gölü'], [38.53, 31.45, 0.12, 0.08, 'Akşehir Gölü'],
  [38.63, 31.18, 0.08, 0.05, 'Eber'], [37.75, 31.52, 0.16, 0.22, 'Beyşehir Gölü']];
const DAGLAR = [[40.07, 29.22, 'Keşiş Dağı'], [38.3, 31.7, 'Sultan Dağları'], [38.13, 34.17, 'Hasan Dağı'], [37.4, 33.15, 'Karadağ'], [38.9, 29.7, 'Murat Dağı'], [39.6, 30.9, ''], [37.3, 32.3, ''], [39.9, 30.3, '']];
const DENIZ_AD = [[40.62, 28.9, 'Marmara Denizi']];

// harita sınırları (tüm güzergâh)
const B = { lat0: 37.0, lat1: 40.75, lon0: 28.6, lon1: 34.6 };
const COS = Math.cos((39 * Math.PI) / 180);

export function createMap(canvas) {
  const ctx = canvas.getContext('2d');
  let q = 1;
  const M = {};
  M.resize = (qq) => { q = qq; canvas.width = W * q; canvas.height = H * q; };

  // kâğıt dokusu (bir kez)
  const paper = document.createElement('canvas'); paper.width = 540; paper.height = 960;
  {
    const p = paper.getContext('2d');
    const gr = p.createRadialGradient(270, 480, 120, 270, 480, 620); gr.addColorStop(0, '#f1e2bd'); gr.addColorStop(1, '#cfb27a');
    p.fillStyle = gr; p.fillRect(0, 0, 540, 960);
    for (let i = 0; i < 5000; i++) { p.fillStyle = `rgba(90,60,20,${Math.random() * 0.06})`; p.fillRect(Math.random() * 540, Math.random() * 960, 1 + Math.random() * 3, 1 + Math.random() * 3); }
  }

  M.draw = (alpha, zoom, s, dir) => {
    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (alpha <= 0.01) return;
    ctx.globalAlpha = alpha;
    // çerçeve alanı
    const fx = 40, fy = 330, fw = W - 80, fh = 1240;
    const here = konum(s);
    // ölçek: tüm rota çerçeveye sığar; zoom=0 iken alayın etrafına 3.2x yakın
    const spanX = (B.lon1 - B.lon0) * COS, spanY = B.lat1 - B.lat0;
    const base = Math.min(fw / spanX, fh / spanY) * 0.92;
    const sc = base * (1 + (1 - zoom) * 2.4);
    const cLat = (B.lat0 + B.lat1) / 2, cLon = (B.lon0 + B.lon1) / 2;
    const ctrLat = here.lat + (cLat - here.lat) * zoom, ctrLon = here.lon + (cLon - here.lon) * zoom;
    const P = (lat, lon) => [fx + fw / 2 + (lon - ctrLon) * COS * sc, fy + fh / 2 - (lat - ctrLat) * sc];

    ctx.save();
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(fx, fy, fw, fh, 30) : ctx.rect(fx, fy, fw, fh); ctx.clip();
    ctx.drawImage(paper, fx, fy, fw, fh);
    // denizler
    const poly = (pts) => { ctx.beginPath(); pts.forEach(([la, lo], i) => { const [x, y] = P(la, lo); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
    ctx.fillStyle = 'rgba(80,130,150,.55)'; ctx.strokeStyle = 'rgba(60,70,60,.6)'; ctx.lineWidth = 2;
    for (const p of [MARMARA, KARADENIZ, EGE]) { poly(p); ctx.fill(); ctx.stroke(); }
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(80,130,150,.8)'; ctx.beginPath(); BOGAZ.forEach(([la, lo], i) => { const [x, y] = P(la, lo); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    const ellipse = (la, lo, rLon, rLat) => { const [x, y] = P(la, lo); ctx.beginPath(); ctx.ellipse(x, y, rLon * COS * sc, rLat * sc, 0, 0, Math.PI * 2); };
    ctx.fillStyle = '#e8d6aa'; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(60,70,60,.6)';
    for (const [la, lo, a, b] of ADALAR) { ellipse(la, lo, a, b); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(80,130,150,.6)';
    for (const [la, lo, a, b] of GOLLER) { ellipse(la, lo, a, b); ctx.fill(); ctx.stroke(); }
    // dağlar
    for (const [la, lo, ad] of DAGLAR) {
      const [x, y] = P(la, lo), s2 = 26;
      ctx.fillStyle = 'rgba(110,85,50,.55)'; ctx.beginPath(); ctx.moveTo(x - s2, y + s2 * 0.5); ctx.lineTo(x, y - s2 * 0.8); ctx.lineTo(x + s2, y + s2 * 0.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(x - s2 * 0.3, y - s2 * 0.3); ctx.lineTo(x, y - s2 * 0.8); ctx.lineTo(x + s2 * 0.3, y - s2 * 0.3); ctx.fill();
      if (ad) { ctx.font = `italic 700 20px ${FONT}`; ctx.fillStyle = 'rgba(80,55,25,.8)'; ctx.textAlign = 'center'; ctx.fillText(ad, x, y + s2 + 6); }
    }
    ctx.font = `italic 800 30px ${FONT}`; ctx.fillStyle = 'rgba(30,60,80,.55)'; ctx.textAlign = 'center';
    for (const [la, lo, ad] of DENIZ_AD) { const [x, y] = P(la, lo); ctx.fillText(ad, x, y); }

    // güzergâh: kesik çizgi tümü, geçilen kısım kırmızı
    const pts = DURAKLAR.map((d) => P(d.lat, d.lon));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.setLineDash([14, 12]); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(90,50,20,.75)';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 9; ctx.strokeStyle = '#b3122e';
    ctx.beginPath();
    const [hx, hy] = P(here.lat, here.lon);
    if (dir > 0) { let first = true; for (const d of DURAKLAR) { if (d.s > s) break; const [x, y] = P(d.lat, d.lon); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; } ctx.lineTo(hx, hy); }
    else { ctx.moveTo(hx, hy); for (const d of DURAKLAR) if (d.s > s) { const [x, y] = P(d.lat, d.lon); ctx.lineTo(x, y); } }
    ctx.stroke();
    // duraklar
    DURAKLAR.forEach((d, i) => {
      if (d.biyom === 'deniz' && i < 2) return;
      const [x, y] = P(d.lat, d.lon), big = i === 0 || i === DURAKLAR.length - 1;
      ctx.fillStyle = '#fff6dc'; ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, big ? 13 : 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = `800 ${big ? 34 : 25}px ${FONT}`; ctx.textAlign = i % 2 ? 'right' : 'left';
      const tx = x + (i % 2 ? -18 : 18);
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(245,232,200,.9)'; ctx.strokeText(d.ad, tx, y + 9);
      ctx.fillStyle = '#3a2410'; ctx.fillText(d.ad, tx, y + 9);
    });
    // alay burada
    const t = performance.now() / 1000, pulse = 1 + Math.sin(t * 4) * 0.12;
    ctx.fillStyle = 'rgba(179,18,46,.25)'; ctx.beginPath(); ctx.arc(hx, hy, 44 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b3122e'; ctx.strokeStyle = '#ffd56a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hx, hy, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = `34px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚰️', hx, hy + 2); ctx.textBaseline = 'alphabetic';
    ctx.restore();

    // çerçeve süsü + başlık
    ctx.lineWidth = 10; ctx.strokeStyle = '#7a4a1e';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(fx, fy, fw, fh, 30) : ctx.rect(fx, fy, fw, fh); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#e8c25a';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(fx + 12, fy + 12, fw - 24, fh - 24, 22) : ctx.rect(fx + 12, fy + 12, fw - 24, fh - 24); ctx.stroke();
    ctx.globalAlpha = 1;
  };
  return M;
}
