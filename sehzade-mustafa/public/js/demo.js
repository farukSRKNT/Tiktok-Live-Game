// Demo: yayın açmadan sahte izleyicilerle test (gerçek TikTok olaylarıyla aynı format).
import { DURAKLAR } from './rota.js';

const F = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Emine', 'Hatice', 'Merve', 'Büşra', 'Esra', 'Derya', 'Ebru', 'Tuba', 'Gizem', 'Sevgi', 'Gül', 'Selin', 'Hazal', 'Kübra', 'Nur', 'Melike', 'Yasemin', 'Cansu', 'Leyla'];
const M = ['Mehmet', 'Ahmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'Murat', 'Emre', 'Yusuf', 'Ömer', 'Burak', 'Serkan', 'Oğuz', 'Ramazan', 'Furkan', 'Kemal', 'Cem', 'Barış', 'Volkan', 'Halil', 'Recep', 'Şahin', 'Eren', 'Baran', 'Sinan', 'Osman', 'Orhan', 'Selim'];
const CH = ['Allah rahmet eylesin', 'Mekânı cennet olsun', 'amin', 'El Fatiha 🤲', 'Ruhu şad olsun', 'Yazık oldu Şehzademe 💧', 'Mustafa\'m', 'Bursa\'ya kaç km kaldı?', 'Konya\'dan selamlar', 'Afyon burada', 'tabut', 'Omuz verelim', 'Sancak yere düşmez', 'Ne kadar hüzünlü', 'Rüstem Paşa nerede 😡', 'Hürrem yaptı bunu', 'Yeniçeriler ayakta', 'Kütahya\'dan dua', 'Allah\'ım', 'İnna lillah', 'yeniçeri'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);

export function createDemo(G, alay) {
  const H = (ev) => (G.yolla || G.handle)(ev); // sunucu üzerinden: sahne penceresi de görür
  const D = { on: false, paused: false, pool: [], t: 0, next: 0.3, vt: 0 };
  const used = new Set();
  for (let i = 0; i < 90; i++) {
    let nm = pick(Math.random() < 0.5 ? F : M);
    if (used.has(nm)) nm += pick([' K.', ' Y.', ' D.', ' A.', '_' + Math.floor(rand(10, 99))]);
    if (used.has(nm)) continue;
    used.add(nm); D.pool.push({ id: 'demo_' + i, nick: nm });
  }
  const absent = () => { const a = D.pool.filter((u) => !G.users.has(u.id)); return a.length ? pick(a) : pick(D.pool); };
  const present = () => { const a = alay.uyeler; if (!a.length) return absent(); const u = pick(a); return { id: u.id, nick: u.nick }; };

  D.ruleGift = (i, user) => {
    const r = G.rules[i]; if (!r) return;
    const dia = r.jeton != null ? r.jeton : r.minJeton;
    H({ type: 'gift', user: user || present(), gift: { name: (r.ad && r.ad[0]) || r.etiket, id: (r.id && r.id[0]) || '', diamonds: dia, count: 1, icon: r.ikon || '🎁' } });
  };
  D.absent = absent;
  D.act = (k) => {
    if (k === 'join') for (let i = 0; i < 5; i++) setTimeout(() => H({ type: 'chat', user: absent(), text: pick(CH) }), i * 250);
    else if (k === 'dua') for (let i = 0; i < 3; i++) setTimeout(() => H({ type: 'chat', user: present(), text: 'Allah rahmet eylesin' }), i * 300);
    else if (k === 'harita') { G.haritaT = -99; H({ type: 'chat', user: present(), text: 'nerdeyiz' }); }
    else if (k === 'likes') for (let i = 0; i < 10; i++) setTimeout(() => H({ type: 'like', user: present(), count: 6 }), i * 90);
    else if (k === 'ileri') { // test: bir sonraki durağın hemen öncesine atla
      if (G.durum !== 'yol') { G.varisT -= 10; return; } // definde: 10 sn ileri
      const d = G.dir > 0 ? DURAKLAR.find((x) => x.s > G.s + 16) : [...DURAKLAR].reverse().find((x) => x.s < G.s - 16);
      if (d) G.s = d.s - G.dir * 15;
    }
    else if (k === 'varis') { if (G.durum === 'yol') G.s = DURAKLAR[DURAKLAR.length - 1].s - 6; }
    else if (k === 'reset') { G.reset(); document.getElementById('feed').innerHTML = ''; }
  };
  D.tick = (dt) => {
    if (!D.on || D.paused) return;
    D.vt -= dt;
    if (D.vt <= 0) { D.vt = 3; G.handle({ type: 'viewers', count: Math.round(alay.uyeler.length * 4 + rand(10, 40)) }); }
    D.t += dt; if (D.t < D.next) return; D.t = 0;
    const n = alay.uyeler.length;
    D.next = n < 25 ? rand(0.25, 0.6) : rand(0.6, 1.6);
    const r = Math.random();
    if (n < 25 || (r < 0.1 && n < 55)) return H({ type: 'chat', user: absent(), text: pick(CH) });
    if (r < 0.45) return H({ type: 'chat', user: present(), text: pick(CH) });
    if (r < 0.75) return H({ type: 'like', user: present(), count: Math.ceil(rand(1, 12)) });
    if (r < 0.88) return D.ruleGift(0);
    if (r < 0.985) return D.ruleGift(Math.floor(rand(1, G.rules.length - 1)));
    D.ruleGift(G.rules.length - 1);
  };
  return D;
}
