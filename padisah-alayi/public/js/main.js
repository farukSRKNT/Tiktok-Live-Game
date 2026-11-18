// Padişah Alayı — ana döngü: dünya, alay, oyun, kamera, harita, arayüz, canlı bağlantı.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './dunya.js';
import { createAlay } from './alay.js';
import { createGame } from './oyun.js';
import { createDirector } from './kamera.js';
import { createMap } from './harita.js';
import { createUI } from './arayuz.js';
import { createDemo } from './demo.js';
import { DURAKLAR } from './rota.js';

const W = 1080, H = 1920;
const qs = new URLSearchParams(location.search);
const LOW = qs.get('kalite') === 'dusuk';

// ---------- render ----------
const canvas = document.getElementById('cv');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d2f0');
scene.fog = new THREE.Fog('#a9d2f0', 70, 280);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 600);

const world = buildWorld(scene);
const alay = createAlay(scene);
const G = createGame(alay);
window.CD = window.CD || {}; window.CD.game = G;
const director = createDirector(camera);
window.CD.director = director; window.CD.alay = alay; window.CD.world = world;
const map = createMap(document.getElementById('map'));

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.25, 0.5, 0.9);
if (!LOW) composer.addPass(bloom);
composer.addPass(new OutputPass());

function setQuality(q) {
  const s = LOW ? Math.min(q, 0.6) : q;
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(W * s), Math.round(H * s), false);
  composer.setSize(Math.round(W * s), Math.round(H * s));
  map.resize(q);
}

// ---------- demo + canlı ----------
const demo = createDemo(G, alay);
const live = { status: { state: 'idle' } };
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }).catch(() => {});
live.connect = (u) => post('/api/connect', { username: u });
live.disconnect = () => post('/api/disconnect');

const SSE = location.protocol !== 'file:' && !!window.EventSource;
// test masası / demo olayları sunucu üzerinden gider: panel ve sahne penceresi aynı şeyi görür
G.yolla = (ev) => (SSE ? post('/api/test', ev) : G.handle(ev));
function kontrol(ev) {
  if (ev.k === 'harita') director.toggleHarita();
  else if (ev.k === 'kamera') director.focusOn(ev.shot, 10);
  else demo.act(ev.k); // ileri, varis
}
function sifirlaYerel() { G.reset(); document.getElementById('feed').innerHTML = ''; G.emit('durak', DURAKLAR[0]); }

const UI = createUI(G, camera, alay, {
  kontrol: (ev) => (SSE ? post('/api/test', { type: 'kontrol', ...ev }) : kontrol(ev)),
  sifirla: () => (SSE ? post('/api/sifirla') : sifirlaYerel()),
  onQuality: setQuality, demo, live,
  onFocus: (name) => director.focusOn(name, name === 'harita' ? 16 : 6),
  onNext: () => director.next(),
  onMap: () => director.toggleHarita(),
  onShot: (n) => director.focusOn(n, n === 'harita' ? 16 : 10),
  director,
});
G.on('yapi', (d) => { yapiDurak = d; director.focusOn(d.yapi === 'kopru' ? 'yan' : 'yapi', 8); });
let yapiDurak = null;

fetch('/api/rules').then((r) => r.json()).then((j) => { if (Array.isArray(j.kurallar) && j.kurallar.length) G.rules = j.kurallar; UI.renderRuleButtons(); }).catch(() => UI.renderRuleButtons());
UI.renderRuleButtons();
alay.loadModels();
world.loadModels();

// kaldığı yerden devam: sunucudaki son durumu yükle, sonra birkaç saniyede bir kaydet
let kayitHazir = !SSE;
if (SSE) {
  fetch('/api/durum').then((r) => r.json()).then((d) => { if (G.yukle(d)) console.log('[durum] kaldığı yerden devam:', d.uyeler.length, 'kişi'); })
    .catch(() => {}).finally(() => { kayitHazir = true; });
  // Tek otorite: yayına verilen sahne penceresi (?clean) durumu kaydeder; kontrol paneli ona uyar.
  // Sahne penceresi açık değilse (son kayıt 10 sn'den eskiyse) panel kaydeder.
  const SAHNE = qs.has('clean');
  setInterval(async () => {
    if (!kayitHazir) return;
    if (SAHNE) return post('/api/durum', G.kaydet());
    try {
      const d = await (await fetch('/api/durum')).json();
      if (d && d.v === 1 && Date.now() - d.t < 10000) G.senkron(d);
      else post('/api/durum', G.kaydet());
    } catch {}
  }, 2000);
  if (SAHNE) addEventListener('pagehide', () => { if (kayitHazir) navigator.sendBeacon('/api/durum', new Blob([JSON.stringify(G.kaydet())], { type: 'application/json' })); });

  demo.paused = true;
  setTimeout(() => { demo.paused = false; }, 3000);
  const es = new EventSource('/api/events');
  es.onmessage = (e) => {
    let ev; try { ev = JSON.parse(e.data); } catch { return; }
    if (ev.type === 'status') { live.status = ev.status; UI.setLive(ev.status); demo.paused = false; return; }
    if (ev.type === 'kontrol') return kontrol(ev);
    if (ev.type === 'sifirla') return sifirlaYerel();
    if (!kayitHazir) return; // durum yüklenmeden gelen olay kaydı bozmasın
    G.handle(ev);
  };
}
const A = window.CD.audio;
A.loadTracks().then(() => UI.refreshSoundBtn());
setTimeout(() => G.emit('durak', DURAKLAR[0]), 1500); // başlangıç kartı

// ---------- döngü ----------
const clock = new THREE.Clock();
const DAY = 14 * 60; // gün döngüsü (sn)
let frames = 0;
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  demo.tick(dt);
  G.update(dt);
  G.beat += dt * G.bpm / 60;
  A.bpm = 84 + G.level * 10;
  if (A.tick) A.tick(G.level, dt);
  const t = G.time;
  world.update(G.s, G.dir, dt, t);
  world.setDay(((t / DAY) + 0.08) % 1);
  const denizde = world.biyom === 'deniz';
  alay.update(dt, G.hiz, t, denizde);
  // son sıranın z'si (arka çekimler için) ve yaklaşan yapının yeri
  let son = 8; for (const u of alay.uyeler) if (u.hedef && u.hedef.z > son) son = u.hedef.z;
  const P = { son, denizde, varis: G.durum === 'varis' };
  if (yapiDurak) { P.yapiZ = -(yapiDurak.s - G.s) * G.dir; P.yapiX = -24; if (P.yapiZ > 30) yapiDurak = null; }
  director.update(dt, P);
  composer.render();
  map.draw(director.harita, director.haritaZoom, G.s, G.dir);
  UI.draw(dt, director.harita);
  UI.tick(dt, director.harita);
  if (++frames === 30) window.__ready = true;
  requestAnimationFrame(loop);
}
loop();
