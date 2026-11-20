// Stadyum Kavgası — ana döngü: stadyum, taraftarlar, kavga, kamera, arayüz, canlı bağlantı.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildStadium } from './stadyum.js';
import { createFx } from './efekt.js';
import { createGame } from './oyun.js';
import { createDirector } from './kamera.js';
import { createUI } from './arayuz.js';
import { createDemo } from './demo.js';
import { createSes } from './ses.js';

const W = 1080, H = 1920;
const qs = new URLSearchParams(location.search);
const LOW = qs.get('kalite') === 'dusuk';

// ---------- render ----------
const canvas = document.getElementById('cv');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#0b1026', 90, 260);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 900);

const stadyum = buildStadium(scene, LOW);
const FX = createFx(scene);
const G = createGame(scene, stadyum, FX);
const director = createDirector(camera, G);
const ses = createSes();
window.CD = Object.assign(window.CD || {}, { game: G, director, stadyum, ses });

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.55, 0.82);
if (!LOW) composer.addPass(bloom);
composer.addPass(new OutputPass());

function setQuality(q) {
  const s = LOW ? Math.min(q, 0.6) : q;
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(W * s), Math.round(H * s), false);
  composer.setSize(Math.round(W * s), Math.round(H * s));
}

// ---------- demo + canlı ----------
const demo = createDemo(G);
const live = { status: { state: 'idle' } };
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }).catch(() => {});
live.connect = (u) => post('/api/connect', { username: u });
live.disconnect = () => post('/api/disconnect');

const SSE = location.protocol !== 'file:' && !!window.EventSource;
// test masası / demo olayları sunucu üzerinden gider: panel ve sahne penceresi aynı şeyi görür
G.yolla = (ev) => (SSE ? post('/api/test', ev) : G.handle(ev));
function kontrol(ev) { if (ev.k === 'kamera') director.focusOn(ev.shot, 12); }
function sifirlaYerel() { G.reset(); document.getElementById('feed').innerHTML = ''; }

const UI = createUI(G, camera, {
  kontrol: (ev) => (SSE ? post('/api/test', { type: 'kontrol', ...ev }) : kontrol(ev)),
  sifirla: () => (SSE ? post('/api/sifirla') : sifirlaYerel()),
  onQuality: setQuality, demo, live, director, ses,
});

// ---------- kamera olayları ----------
// Yeni gelen: sıra kısaysa kamera ona yaklaşır (panodan atlayıp sahaya inişi görünür). Etiketi bir süre parlar.
const girisSira = [];
G.on('giris', ({ f }) => {
  f.vurgu = G.time + 4;
  if (!f.bot) girisSira.push(f);
});
let girisT = -99;
function girisKamera() {
  while (girisSira.length > 4) girisSira.shift(); // çok kalabalıksa eskiler atlanır
  if (!girisSira.length || G.time - girisT < 3.2) return;
  const f = girisSira.shift();
  if (!f.ch.parent || f.durum === 'ko') return;
  if (director.odakla(f, 3.4, 'yakin')) girisT = G.time;
}
let koT = -99;
G.on('ko', ({ o, f }) => {
  ses.ko();
  // yıldız oyuncunun nakavtı ya da uzun süredir nakavt çekimi yoksa: yakın çekim
  if (G.time - koT > 9 && (!o.bot || Math.random() < 0.3)) { if (director.odakla(o, 3.2, 'ko')) koT = G.time; }
  if (f && f.kill >= 3) f.vurgu = G.time + 2;
});
G.on('vurus', ({ f, o, guc }) => {
  ses.vurus(guc);
  const odak = director.odak && director.odak.f;
  if (odak === f || odak === o) director.sarsinti(0.08 * guc);
});

fetch('/api/rules').then((r) => r.json()).then((j) => { if (Array.isArray(j.kurallar) && j.kurallar.length) G.rules = j.kurallar; UI.renderRuleButtons(); }).catch(() => UI.renderRuleButtons());
UI.renderRuleButtons();

// ---------- kaldığı yerden devam ----------
let kayitHazir = !SSE;
if (SSE) {
  fetch('/api/durum').then((r) => r.json()).then((d) => { if (G.yukle(d)) console.log('[durum] kaldığı yerden devam:', d.savascilar.length, 'kişi'); })
    .catch(() => {}).finally(() => { kayitHazir = true; esitle(); });
  // Tek otorite: aynı anda tek pencere oyunu yönetir (canları, ölümleri o belirler ve durumu kaydeder), diğerleri ona uyar.
  // Öncelik yayına verilen sahne penceresinde (?clean). İki sahne penceresi açık kalırsa (BASLAT iki kez çalıştı)
  // ilk açılan yönetir, ikincisi ona uyar: eskiden ikisi de kaydediyordu, panel iki farklı oyun arasında gidip
  // gelip her şeyi sürekli baştan kuruyordu. Yöneten pencere kapanınca (12 sn ses gelmezse) sıradaki devralır.
  const SAHNE = qs.has('clean');
  const BENIM = Math.random().toString(36).slice(2, 10);
  const kaydet = () => ({ ...G.kaydet(), sahne: SAHNE, pencere: BENIM });
  G.yetkili = false; // sunucu söyleyene kadar can/ölüm işlemez (iki pencere farklı oyun kurmasın)
  let oncekiYetki = null;
  async function esitle() {
    if (!kayitHazir) return;
    let r;
    try { r = await (await fetch('/api/durum', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kaydet()) })).json(); } catch { return; }
    if (!r || !r.ok) return;
    G.yetkili = r.yonetici !== false;
    if (oncekiYetki !== G.yetkili) console.log(G.yetkili ? '[durum] bu pencere oyunu yönetiyor' : '[durum] bu pencere yöneten pencereye uyuyor');
    oncekiYetki = G.yetkili;
    if (!G.yetkili && r.durum) G.senkron(r.durum);
  }
  setInterval(esitle, 2000);
  addEventListener('pagehide', () => { if (kayitHazir && G.yetkili) navigator.sendBeacon('/api/durum', new Blob([JSON.stringify(kaydet())], { type: 'application/json' })); });

  demo.paused = true;
  setTimeout(() => { demo.paused = false; }, 3000);
  const es = new EventSource('/api/events');
  es.onmessage = (e) => {
    let ev; try { ev = JSON.parse(e.data); } catch { return; }
    if (ev.type === 'status') { live.status = ev.status; UI.setLive(ev.status); demo.paused = false; return; }
    if (ev.type === 'kontrol') return kontrol(ev);
    if (ev.type === 'sifirla') return sifirlaYerel();
    if (!kayitHazir) return;
    G.handle(ev);
  };
}

// ---------- döngü ----------
const clock = new THREE.Clock();
let frames = 0;
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  demo.tick(dt);
  G.update(dt);
  FX.update(dt);
  stadyum.update(G.time, dt);
  ses.tick(dt, stadyum.cosku);
  girisKamera();
  director.update(dt);
  composer.render();
  UI.draw(dt);
  UI.tick(dt);
  if (++frames === 30) window.__ready = true;
  requestAnimationFrame(loop);
}
loop();
