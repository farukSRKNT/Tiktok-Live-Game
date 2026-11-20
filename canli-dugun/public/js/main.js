// Ana döngü
(function () {
  const CD = window.CD;
  const cv = document.getElementById('cv');
  CD.render.init(cv.getContext('2d'));
  CD.demo.init();
  CD.ui.init();
  // olay kaydı (loglar/ + /api/log): girdiler, oyun olayları, katılan/ayrılan, rol değişimi, hız seviyesi
  if (window.OyunKayit) {
    const G = CD.game;
    window.OyunKayit.bagla(G, {
      uyeler: () => G.line,
      rol: (g) => {
        for (const k in G.roles) if (G.roles[k] && G.roles[k].id === g.id) return k; // gelin, damat, davulcu
        return g.id === G.sagdic ? 'sagdic' : g.id === G.halaybasi ? 'halaybasi' : 'halay';
      },
      durum: () => ({ seviye: G.level }),
      ozet: () => ({ begeni: G.likes, elmas: G.diamonds, enerji: Math.round(G.energy), takilar: { ...G.takiCount } }),
    });
  }
  CD.live.start();
  CD.audio.loadTracks().then(() => CD.ui.refreshSoundBtn());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => CD.render.rebuild());

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    CD.demo.tick(dt);
    CD.game.update(dt);
    CD.render.frame();
    CD.ui.tick(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
