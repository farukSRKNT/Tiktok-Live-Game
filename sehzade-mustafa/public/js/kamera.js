// Kamera yönetmeni: Şehzade'ye yakın çekim (yukarıdan, sedyede), tabutçular, yan takip, arkadan alay (izleyiciler kendini görsün),
// geniş manzara ve havadan yükselip canlı haritaya geçiş. Bursa'da defin çekimleri. Olaylarda kısa odak.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

// P: { son: alayın son sırasının z'si, yapiZ: yaklaşan yapının z'si, yapiX }
const SHOTS = {
  tabut: (u, P) => { const x = P.tx || 0, a = lerp(0.5, 1.3, u); return { pos: V(x + Math.sin(a) * 4.6, 5.4, -Math.cos(a) * 4.6 + 0.4), look: V(x, 1.9, -0.2), fov: 36 }; },
  yuz: (u, P) => { const x = P.tx || 0; return { pos: V(x + 2.6, 4.9, lerp(-1.6, -0.6, u)), look: V(x, 2.0, -0.7), fov: 30 }; }, // resimdeki gibi yandan-yukarıdan
  tasiyicilar: (u) => ({ pos: V(6, 2.5, lerp(-3.5, 3.5, u)), look: V(0, 1.7, lerp(-1, 1, u)), fov: 40 }),
  onden: (u) => ({ pos: V(lerp(-2.5, 2.5, u), 3.4, -14), look: V(0, 1.7, 2), fov: 46 }),
  ilk: (u) => ({ pos: V(lerp(5, 4, u), 2.6, lerp(5, 7, u)), look: V(0, 1.5, 10), fov: 44 }), // ilk sıralar (en cömertler)
  yan: (u, P) => ({ pos: V(12, 3.4, lerp(-6, Math.min(P.son, 20) * 0.6, u)), look: V(0, 1.2, lerp(-4, Math.min(P.son, 20) * 0.6 + 2, u)), fov: 50 }),
  sipahi: (u) => ({ pos: V(4.6, 2.8, lerp(7, 13, u)), look: V(0, 2.0, lerp(10, 15, u)), fov: 46 }),
  arka: (u, P) => ({ pos: V(lerp(-3, 3, u), 6.5 + P.son * 0.12, P.son + 9 + P.son * 0.15), look: V(0, 0.8, P.son * 0.4), fov: 50 }),
  yeniceri: (u, P) => ({ pos: V(4.6, 2.3, lerp(8, P.son + 2, u)), look: V(0, 1.5, lerp(6, P.son - 2, u)), fov: 48 }),
  genis: (u) => ({ pos: V(lerp(26, 18, u), lerp(14, 20, u), lerp(-26, -12, u)), look: V(0, 0, 4), fov: 55 }),
  harita: (u) => { const k = smooth(u / 0.45); return { pos: V(lerp(6, 4, k), lerp(9, 140, k), lerp(16, 70, k)), look: V(0, 0, lerp(0, -20, k)), fov: 55 }; },
  yapi: (u, P) => { const z = P.yapiZ ?? -30, x = P.yapiX ?? -24; return { pos: V(-x * 0.5, 9, z + 46 - u * 6), look: V(x * 0.8, 5, z), fov: 44 }; },
  // defin: türbe arkada, kabir önde (yol tarafından)
  defin: (u, P) => { const k = P.kabirX ?? -12; return { pos: V(k + lerp(15, 12, u), 9.5, lerp(-4, -1, u)), look: V(k - 5, 1.6, 0.8), fov: 46 }; }, // yol tarafından: kabir önde, türbe arkada
  defin2: (u, P) => { const k = P.kabirX ?? -12; return { pos: V(k + lerp(4, 2.5, u), lerp(6.5, 5.5, u), -6.5), look: V(k, 1.4, 0.8), fov: 40 }; },
};
// süreler (sn)
export const TOUR = [['tabut', 9], ['onden', 9], ['yan', 14], ['tasiyicilar', 8], ['yuz', 6], ['arka', 16], ['ilk', 6], ['genis', 10], ['yeniceri', 14], ['sipahi', 7], ['harita', 16]];
const BLEND = 2.4;

export function createDirector(camera) {
  const D = { i: 0, t: 0, cur: TOUR[0][0], dur: TOUR[0][1], from: null, focus: false, look: V(0, 0, 0), dist: 5, harita: 0, P: { son: 20, tx: 0 } };

  function snapshot() { return { pos: camera.position.clone(), look: D.look.clone(), fov: camera.fov }; }
  function go(name, dur) { D.from = snapshot(); D.cur = name; D.dur = dur; D.t = 0; }

  // Kişiye yakın çekim. mod 'rol': rol değiştiren yeni yerine geçerken (öncelikli, başka odak bölemez),
  // mod 'yorum': yorum yapana yaklaşıp geri uzaklaşır. hedef(): figürün o anki nesnesi (yeniden kurulsa da izlenir).
  const tmpP = V(0, 0, 0);
  D.oncelikli = () => D.cur === 'kisi' && D.kisi && D.kisi.mod === 'rol' && D.t < D.dur;
  D.kisiyeOdakla = (hedef, dur, mod) => {
    if (D.oncelikli() && mod !== 'rol') return false;
    D.kisi = { hedef, mod };
    D.focus = true; go('kisi', dur);
    return true;
  };
  function kisiCekim(u) {
    const o = D.kisi && D.kisi.hedef();
    if (!o) return null;
    o.getWorldPosition(tmpP);
    const atli = !!(o.userData && o.userData.at);
    const boy = atli ? 3.2 : 2.0;
    const yan = tmpP.x >= 0 ? 1 : -1; // alayın dış tarafından bak
    let d;
    if (D.kisi.mod === 'rol') d = lerp(atli ? 10 : 8.5, atli ? 8 : 6.5, smooth(u)); // yavaşça yaklaş
    else d = lerp(atli ? 8 : 6, atli ? 14 : 12, smooth((u - 0.3) / 0.7)); // önce yakın, sonra uzaklaş
    // yanlardan ve yukarıdan bakar: kalabalığın içindeki kişi, önündekilerin üstünden görünsün
    const dir = V(yan * 0.8, 0, -0.6).normalize();
    return { pos: V(tmpP.x + dir.x * d, boy * 0.9 + d * 0.55, tmpP.z + dir.z * d), look: V(tmpP.x, boy * 0.7, tmpP.z), fov: 32 };
  }

  D.focusOn = (name, dur = 6) => {
    if (!SHOTS[name]) return;
    if (D.oncelikli()) return; // rol değişimi gösterilirken başka odak araya girmez
    if (D.cur === 'harita' && name !== 'harita' && D.t < D.dur - 2) return; // harita bölünmesin
    if (D.focus && D.cur === name) { D.dur = Math.max(D.dur, D.t + dur); return; }
    D.focus = true; go(name, dur);
  };
  D.jump = (name) => { const k = TOUR.findIndex((s) => s[0] === name); if (k >= 0) { D.i = k; D.focus = false; go(name, TOUR[k][1]); } };
  D.toggleHarita = () => { if (D.cur === 'harita') D.next(); else D.focusOn('harita', 16); };
  D.next = () => { D.focus = false; D.i = (D.i + 1) % TOUR.length; go(TOUR[D.i][0], TOUR[D.i][1]); };

  D.update = (dt, P) => {
    Object.assign(D.P, P);
    D.t += dt;
    if (D.t >= D.dur) {
      if (D.focus) D.focus = false; else D.i = (D.i + 1) % TOUR.length;
      let n = TOUR[D.i][0], dur = TOUR[D.i][1];
      if (P.varis) { n = D.i % 2 ? 'defin2' : 'defin'; dur = 12; }
      go(n, dur);
    }
    let p = D.cur === 'kisi' ? kisiCekim(Math.min(1, D.t / D.dur)) : SHOTS[D.cur](Math.min(1, D.t / D.dur), D.P);
    if (!p) { D.cur = 'genis'; p = SHOTS.genis(Math.min(1, D.t / D.dur), D.P); } // kişi alaydan çıktıysa
    if (D.from && D.t < BLEND) {
      const k = smooth(D.t / BLEND);
      p.pos.lerpVectors(D.from.pos, p.pos, k); p.look.lerpVectors(D.from.look, p.look, k); p.fov = lerp(D.from.fov, p.fov, k);
    }
    camera.position.copy(p.pos); D.look.copy(p.look); camera.lookAt(p.look);
    if (Math.abs(camera.fov - p.fov) > 0.01) { camera.fov = p.fov; camera.updateProjectionMatrix(); }
    D.dist = p.pos.distanceTo(p.look);
    // harita görünürlüğü (0..1): yükselişin ortasında belirir, sonunda kaybolur
    const u = D.t / D.dur;
    D.harita = D.cur === 'harita' ? smooth((u - 0.28) / 0.1) * (1 - smooth((u - 0.9) / 0.08)) : 0;
    D.haritaZoom = D.cur === 'harita' ? smooth((u - 0.32) / 0.3) : 1;
    return D;
  };
  return D;
}
