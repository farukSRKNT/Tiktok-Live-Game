// 3B efektler: darbe kıvılcımı, yıldızlar, toz bulutu, meşale (kırmızı duman + ışık), öfke alevi.
import * as THREE from 'three';

function doku(ciz, s = 64) {
  const c = document.createElement('canvas'); c.width = c.height = s;
  ciz(c.getContext('2d'), s);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const yumusak = doku((x, s) => { const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, s, s); });
const yildiz = doku((x, s) => {
  x.translate(s / 2, s / 2); x.fillStyle = '#fff';
  x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.18 : s * 0.48, a = (i / 10) * Math.PI * 2 - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill();
});
const patlama = doku((x, s) => {
  x.translate(s / 2, s / 2); x.fillStyle = '#fff';
  x.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? s * 0.2 : s * (0.38 + Math.random() * 0.12), a = (i / 16) * Math.PI * 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill();
}, 128);
const duman = doku((x, s) => {
  for (let i = 0; i < 9; i++) {
    const cx = s * (0.3 + Math.random() * 0.4), cy = s * (0.3 + Math.random() * 0.4), r = s * (0.18 + Math.random() * 0.15);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
  }
}, 128);

export function createFx(scene) {
  const FX = {};
  const aktif = [];
  const havuz = [];
  function sprite(tex, renk, add) {
    let s = havuz.find((p) => !p.visible && p.userData.tex === tex && p.userData.add === add);
    if (!s) {
      s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: renk, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }));
      s.userData.tex = tex; s.userData.add = add; havuz.push(s); scene.add(s);
    }
    s.material.color.set(renk); s.material.opacity = 1; s.material.rotation = Math.random() * 6.28; s.visible = true;
    return s;
  }
  function ekle(s, o) { Object.assign(s.userData, { t: 0, ...o }); aktif.push(s); }

  // darbe: beyaz-sarı patlama + yıldızlar (güçlüyse daha büyük)
  FX.darbe = (p, guc = 1, renk = '#ffe066') => {
    const s = sprite(patlama, '#ffffff', true); s.position.copy(p);
    ekle(s, { omur: 0.18, b0: 0.3 * guc, b1: 0.9 * guc, v: null });
    const s2 = sprite(yumusak, renk, true); s2.position.copy(p);
    ekle(s2, { omur: 0.25, b0: 0.5 * guc, b1: 1.3 * guc, v: null });
    const n = Math.round(1 + guc * 3);
    for (let i = 0; i < n; i++) {
      const y = sprite(yildiz, i % 2 ? '#ffd23f' : '#ffffff', true); y.position.copy(p);
      const v = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 1, (Math.random() - 0.5) * 6).multiplyScalar(0.6 + guc * 0.3);
      ekle(y, { omur: 0.35 + Math.random() * 0.2, b0: 0.13, b1: 0.03, v, yer: 9 });
    }
  };
  // yere düşünce toz
  FX.toz = (p, n = 7) => {
    for (let i = 0; i < n; i++) {
      const s = sprite(duman, '#c8b89a', false); s.position.set(p.x + (Math.random() - 0.5) * 1.2, 0.2, p.z + (Math.random() - 0.5) * 1.2);
      const v = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 0.8, (Math.random() - 0.5) * 2);
      ekle(s, { omur: 0.9 + Math.random() * 0.5, b0: 0.5, b1: 1.6, v, a0: 0.5 });
    }
  };
  // nakavt yıldızları: başın üstünde dönen
  FX.sersem = (hedefNesne, sure = 2.5) => {
    for (let i = 0; i < 3; i++) {
      const s = sprite(yildiz, '#ffd23f', true);
      ekle(s, { omur: sure, b0: 0.22, b1: 0.22, bagli: hedefNesne, aci: (i / 3) * Math.PI * 2 });
    }
  };
  // tribünde meşale: kırmızı parlak ışık + yükselen duman
  // ışık sayısı değişince tüm gölgelendiriciler yeniden derlenir (takılma): 4 ışık baştan kurulur, sırayla kullanılır
  const isiklar = [];
  for (let i = 0; i < 4; i++) { const L = new THREE.PointLight('#ff3b1f', 0, 26, 1.6); scene.add(L); isiklar.push({ L, t: 0, sure: 0 }); }
  let isikSira = 0;
  FX.mesale = (p, renk = '#ff3b1f', sure = 9) => {
    const l = isiklar[isikSira++ % isiklar.length];
    l.L.color.set(renk); l.L.position.copy(p); l.t = 0; l.sure = sure;
    const s = sprite(yumusak, renk, true); s.position.copy(p);
    ekle(s, { omur: sure, b0: 1.6, b1: 1.6, titre: true });
    for (let i = 0; i < 14; i++) {
      const d = sprite(duman, i % 3 ? '#b23a2e' : '#d8c8c0', false);
      d.position.set(p.x + (Math.random() - 0.5), p.y + 0.5, p.z + (Math.random() - 0.5));
      const v = new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.2 + Math.random() * 1.2, (Math.random() - 0.5) * 0.6);
      ekle(d, { omur: 4 + Math.random() * 4, b0: 1.2, b1: 7, v, a0: 0.55, gecikme: Math.random() * (sure - 4) });
    }
  };
  // öfke / dev aurası: figürün etrafında yükselen kıvılcımlar
  FX.aura = (nesne, renk) => {
    const s = sprite(yumusak, renk, true);
    const v = new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.5 + Math.random(), (Math.random() - 0.5) * 0.4);
    s.position.copy(nesne.position); s.position.x += (Math.random() - 0.5) * 0.6; s.position.z += (Math.random() - 0.5) * 0.6; s.position.y += Math.random() * 1.2 * nesne.scale.y;
    ekle(s, { omur: 0.7, b0: 0.25 * nesne.scale.y, b1: 0.05, v });
  };
  // can doldu: yeşil artılar
  FX.can = (nesne) => {
    for (let i = 0; i < 8; i++) {
      const s = sprite(yumusak, '#5dff8a', true);
      s.position.copy(nesne.position); s.position.x += (Math.random() - 0.5) * 0.9; s.position.z += (Math.random() - 0.5) * 0.9; s.position.y += Math.random() * 1.6;
      ekle(s, { omur: 1 + Math.random() * 0.5, b0: 0.3, b1: 0.05, v: new THREE.Vector3(0, 1.4, 0) });
    }
  };

  FX.update = (dt) => {
    for (let i = aktif.length - 1; i >= 0; i--) {
      const s = aktif[i], d = s.userData;
      if (d.gecikme > 0) { d.gecikme -= dt; s.material.opacity = 0; continue; }
      d.t += dt;
      const u = d.t / d.omur;
      if (u >= 1) { s.visible = false; aktif.splice(i, 1); continue; }
      const b = d.b0 + (d.b1 - d.b0) * u; s.scale.set(b, b, b);
      if (d.v) { s.position.addScaledVector(d.v, dt); if (d.yer) d.v.y -= d.yer * dt; d.v.multiplyScalar(1 - dt * 0.8); }
      if (d.bagli) {
        const o = d.bagli; d.aci += dt * 5;
        s.position.set(o.position.x + Math.cos(d.aci) * 0.35, o.position.y + 0.55, o.position.z + Math.sin(d.aci) * 0.35);
      }
      const a0 = d.a0 ?? 1;
      s.material.opacity = d.titre ? (0.7 + Math.random() * 0.3) * Math.min(1, (1 - u) * 4) : a0 * (u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85);
    }
    for (const l of isiklar) {
      if (!l.sure) continue;
      l.t += dt;
      const u = l.t / l.sure;
      if (u >= 1) { l.L.intensity = 0; l.sure = 0; continue; }
      l.L.intensity = (40 + Math.random() * 25) * Math.min(1, u * 8, (1 - u) * 5);
    }
  };
  return FX;
}
