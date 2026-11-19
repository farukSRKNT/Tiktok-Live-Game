// Kamera yönetmeni: kavganın ortasını çerçeveleyen genel çekim (kalabalığa göre yaklaşır/uzaklaşır, yavaşça döner),
// yeni gelenlere ve nakavtlara kısa yakın çekim, tribün çekimi, tepeden çekim. Sert vuruşlarda hafif sarsıntı.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
export const TUR = [['genel', 18], ['yildiz', 6], ['genel', 14], ['tribun', 7], ['genel', 14], ['tepe', 8]];

export function createDirector(camera, G) {
  const D = { i: 0, t: 0, cur: 'genel', dur: 18, pos: V(0, 22, 40), look: V(0, 0, 0), fov: 50, sars: 0, odak: null, manuel: 0 };
  camera.position.copy(D.pos); camera.lookAt(D.look);
  const merkez = V(0, 0, 0), mHedef = V(0, 0, 0);
  let yaricap = 10, aci = 0;

  // canlı figürlerin merkezi ve yayılımı (uçtakiler hariç: %80'lik dilim)
  function kalabalik() {
    const l = G.canli().filter((f) => f.durum !== 'giris');
    if (!l.length) { mHedef.set(0, 0, 0); return 8; }
    let x = 0, z = 0; for (const f of l) { x += f.x; z += f.z; }
    x /= l.length; z /= l.length; mHedef.set(x, 0, z);
    const yx = l.map((f) => Math.abs(f.x - x)).sort((a, b) => a - b), yz = l.map((f) => Math.abs(f.z - z)).sort((a, b) => a - b);
    const p = (a) => a[Math.floor((a.length - 1) * 0.85)] || 0;
    // dikey ekran: yatay yayılım çok daha fazla mesafe ister
    return Math.max(4, p(yx) * 1.75, p(yz) * 0.8);
  }
  D.odakla = (f, sure = 4, mod = 'yakin') => {
    if (D.odak && D.odak.oncelik && D.t < D.dur && mod !== 'zorla') return false;
    D.odak = { f, mod, oncelik: mod === 'ko' || mod === 'zorla' };
    D.cur = 'kisi'; D.dur = sure; D.t = 0;
    return true;
  };
  D.focusOn = (name, sure = 10) => { D.odak = null; D.cur = name; D.dur = sure; D.t = 0; D.manuel = sure; };
  D.sarsinti = (k) => { D.sars = Math.min(0.6, D.sars + k); };

  function cekim(dt) {
    const u = D.t / D.dur;
    switch (D.cur) {
      case 'kisi': {
        const f = D.odak && D.odak.f;
        if (!f || !f.ch.parent) return null;
        const p = f.ch.position, s = f.olcek;
        const yan = D.odak.yan ?? (D.odak.yan = Math.atan2(camera.position.x - p.x, camera.position.z - p.z));
        const d = (D.odak.mod === 'ko' ? 5.5 : 6.5) * s * (1 + u * 0.15), a = yan + u * 0.5;
        return { pos: V(p.x + Math.sin(a) * d, 2.6 * s + d * 0.28, p.z + Math.cos(a) * d), look: V(p.x, 1.1 * s, p.z), fov: 38 };
      }
      case 'yildiz': { // en çok yere sereni izle
        const top = G.top[0], f = top && G.savascilar.get(top.id);
        if (!f || f.durum === 'ko') return null;
        const p = f.ch.position, a = aci + u * 1.2, d = 7 * f.olcek;
        return { pos: V(p.x + Math.sin(a) * d, 3.2 * f.olcek, p.z + Math.cos(a) * d), look: V(p.x, 1.1 * f.olcek, p.z), fov: 40 };
      }
      case 'tribun': { // sahadan tribüne doğru, alçak açı
        const a = -0.6 + u * 1.2;
        return { pos: V(Math.sin(a) * 6, 3, 8 + Math.cos(a) * 4), look: V(Math.sin(a) * 30, 9, 75), fov: 55 };
      }
      case 'tepe': {
        const d = Math.max(20, yaricap * 2.4 + 6);
        return { pos: V(merkez.x + Math.sin(u * 1.5) * 4, d * 1.45, merkez.z + d * 0.35), look: merkez.clone(), fov: 50 };
      }
      case 'yakin': {
        const d = Math.max(9, yaricap * 1.1 + 5), a = aci;
        return { pos: V(merkez.x + Math.sin(a) * d, d * 0.5, merkez.z + Math.cos(a) * d), look: V(merkez.x, 0.8, merkez.z), fov: 48 };
      }
      default: { // genel: dikey ekranda kalabalığın tamamı görünsün (yukarıdan, boyuna)
        const d = Math.min(60, Math.max(13, yaricap * 2.1 + 7)), a = aci * 0.45;
        return { pos: V(merkez.x + Math.sin(a) * d * 0.62, d * 0.78, merkez.z + Math.cos(a) * d * 0.62), look: V(merkez.x, 0.6, merkez.z - d * 0.04), fov: 50 };
      }
    }
  }

  D.update = (dt) => {
    yaricap += (kalabalik() - yaricap) * Math.min(1, dt * 0.8);
    merkez.lerp(mHedef, Math.min(1, dt * 1.2));
    aci = Math.sin(G.time * 0.045) * 0.75; // ±43° yavaş salınım
    D.t += dt;
    if (D.manuel > 0) D.manuel -= dt;
    if (D.t >= D.dur) {
      if (D.cur === 'kisi') D.odak = null;
      if (D.manuel <= 0 || D.cur === 'kisi') { D.i = (D.i + 1) % TUR.length; D.cur = TUR[D.i][0]; D.dur = TUR[D.i][1]; }
      D.t = 0;
    }
    let s = cekim(dt);
    if (!s) { D.cur = 'genel'; D.odak = null; s = cekim(dt); }
    const k = 1 - Math.exp(-dt * (D.cur === 'kisi' ? 3.2 : 1.8));
    D.pos.lerp(s.pos, k); D.look.lerp(s.look, k); D.fov += (s.fov - D.fov) * k;
    camera.position.copy(D.pos);
    if (D.sars > 0.002) {
      camera.position.x += (Math.random() - 0.5) * D.sars; camera.position.y += (Math.random() - 0.5) * D.sars;
      D.sars *= Math.exp(-dt * 7);
    }
    camera.lookAt(D.look);
    if (Math.abs(camera.fov - D.fov) > 0.01) { camera.fov = D.fov; camera.updateProjectionMatrix(); }
  };
  void smooth;
  return D;
}
