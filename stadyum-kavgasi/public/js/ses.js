// Ses (kodla üretilir, dosya gerekmez): tribün uğultusu, yumruk sesi, nakavtta tribün "oooh"u.
// Varsayılan KAPALI (yayında Spotify çalıyor). Panelden ya da adrese ?ses=1 ekleyerek açılır.
export function createSes() {
  const A = { on: false, ctx: null, cosku: 0.4 };
  let ana, ugultu, ugultuFiltre;
  function kur() {
    const c = A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    ana = c.createGain(); ana.gain.value = 0.8; ana.connect(c.destination);
    // kahverengi gürültü: kalabalık uğultusu
    const n = c.sampleRate * 3, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    let son = 0; for (let i = 0; i < n; i++) { son = (son + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = son * 3.2; }
    A.gurultu = buf;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    ugultuFiltre = c.createBiquadFilter(); ugultuFiltre.type = 'bandpass'; ugultuFiltre.frequency.value = 500; ugultuFiltre.Q.value = 0.6;
    ugultu = c.createGain(); ugultu.gain.value = 0;
    src.connect(ugultuFiltre).connect(ugultu).connect(ana); src.start();
  }
  A.toggle = () => {
    if (!A.ctx) kur();
    A.on = !A.on;
    if (A.on) A.ctx.resume(); else A.ctx.suspend();
  };
  A.tick = (dt, cosku) => {
    if (!A.on) return;
    const hedef = 0.25 + cosku * 0.55;
    ugultu.gain.value += (hedef - ugultu.gain.value) * Math.min(1, dt * 2);
    ugultuFiltre.frequency.value = 400 + cosku * 500 + Math.sin(performance.now() / 900) * 60;
  };
  let sonVurus = 0;
  A.vurus = (guc = 1) => {
    if (!A.on) return;
    const c = A.ctx, t = c.currentTime;
    if (t - sonVurus < 0.05) return; sonVurus = t; // çok sık olmasın
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150 + Math.random() * 40, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5 * Math.min(1.5, guc), t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g).connect(ana); o.start(t); o.stop(t + 0.18);
    const s = c.createBufferSource(); s.buffer = A.gurultu; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    const g2 = c.createGain(); g2.gain.setValueAtTime(0.35 * Math.min(1.5, guc), t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    s.connect(f).connect(g2).connect(ana); s.start(t, Math.random() * 2, 0.1);
  };
  A.ko = () => {
    if (!A.on) return;
    const c = A.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = A.gurultu;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(350, t); f.frequency.linearRampToValueAtTime(700, t + 0.6); f.frequency.linearRampToValueAtTime(420, t + 1.6);
    const g = c.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.4); g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    s.connect(f).connect(g).connect(ana); s.start(t, Math.random(), 2);
  };
  return A;
}
