// Kamera yönetmeni: yakın çekimler (padişah, İbrahim Paşa), yan takip, arkadan alay (izleyiciler kendini görsün),
// geniş manzara ve havadan yükselip canlı haritaya geçiş. Olaylarda kısa odak (hediye, durak yapısı, harita isteği).
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

// P: { son: alayın son sırasının z'si, yapiZ: yaklaşan yapının z'si, yapiX }
const SHOTS = {
  padisah: (u) => { const a = lerp(0.75, 1.15, u); return { pos: V(Math.sin(a) * 12, 3.2, -Math.cos(a) * 12), look: V(0, 2.2, 0), fov: 24 }; },
  ibrahim: (u) => ({ pos: V(12.5, 3.2, lerp(1.5, 4.5, u)), look: V(1.1, 2.1, 3.4), fov: 24 }),
  onden: (u) => ({ pos: V(lerp(-2.5, 2.5, u), 3.6, -15), look: V(0, 1.6, 3), fov: 50 }),
  mehter: (u) => ({ pos: V(lerp(5, 4, u), 2.6, lerp(3, 5, u)), look: V(0, 1.5, 9), fov: 44 }), // ilk sıralar (en cömertler)
  yan: (u, P) => ({ pos: V(12, 3.4, lerp(-6, Math.min(P.son, 20) * 0.6, u)), look: V(0, 1.1, lerp(-4, Math.min(P.son, 20) * 0.6 + 2, u)), fov: 50 }),
  sipahi: (u) => ({ pos: V(4.6, 2.8, lerp(4, 10, u)), look: V(0, 2.0, lerp(7, 12, u)), fov: 46 }),
  arka: (u, P) => ({ pos: V(lerp(-3, 3, u), 6.5 + P.son * 0.12, P.son + 9 + P.son * 0.15), look: V(0, 0.6, P.son * 0.45), fov: 50 }),
  yeniceri: (u, P) => ({ pos: V(4.6, 2.3, lerp(7, P.son + 2, u)), look: V(0, 1.5, lerp(5, P.son - 2, u)), fov: 48 }),
  genis: (u) => ({ pos: V(lerp(26, 18, u), lerp(14, 20, u), lerp(-26, -12, u)), look: V(0, 0, 4), fov: 55 }),
  harita: (u) => { const k = smooth(u / 0.45); return { pos: V(lerp(6, 4, k), lerp(9, 140, k), lerp(16, 70, k)), look: V(0, 0, lerp(0, -20, k)), fov: 55 }; },
  yapi: (u, P) => { const z = P.yapiZ ?? -30, x = P.yapiX ?? -24; return { pos: V(-x * 0.5, 9, z + 46 - u * 6), look: V(x * 0.8, 5, z), fov: 44 }; },
  mavna: (u) => ({ pos: V(lerp(18, 14, u), 5, lerp(-16, -6, u)), look: V(0, 1, 5), fov: 50 }),
  varis: (u) => { const a = u * 1.6 - 0.8; return { pos: V(Math.sin(a) * 9, 3.5, -Math.cos(a) * 9), look: V(0, 1.8, 2), fov: 50 }; },
};
// süreler (sn)
export const TOUR = [['padisah', 9], ['onden', 9], ['yan', 14], ['ibrahim', 7], ['arka', 16], ['mehter', 6], ['genis', 10], ['yeniceri', 14], ['sipahi', 7], ['harita', 16]];
const BLEND = 2.4;

export function createDirector(camera) {
  const D = { i: 0, t: 0, cur: TOUR[0][0], dur: TOUR[0][1], from: null, focus: false, look: V(0, 0, 0), dist: 5, harita: 0, P: { son: 20 } };

  function snapshot() { return { pos: camera.position.clone(), look: D.look.clone(), fov: camera.fov }; }
  function go(name, dur) { D.from = snapshot(); D.cur = name; D.dur = dur; D.t = 0; }

  D.focusOn = (name, dur = 6) => {
    if (!SHOTS[name]) return;
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
      let n = TOUR[D.i][0];
      if (P.denizde && (n === 'genis' || n === 'yeniceri')) n = 'mavna';
      if (P.varis) n = 'varis';
      go(n, TOUR[D.i][1]);
    }
    const p = SHOTS[D.cur](Math.min(1, D.t / D.dur), D.P);
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
