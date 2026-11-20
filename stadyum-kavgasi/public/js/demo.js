// Demo: yayın açmadan sahte izleyicilerle test (gerçek TikTok olaylarıyla aynı format).
import { TAKIMLAR } from './takimlar.js';

const F = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Büşra', 'Esra', 'Derya', 'Ebru', 'Gizem', 'Selin', 'Hazal', 'Kübra', 'Melike', 'Yasemin', 'Cansu'];
const M = ['Mehmet', 'Ahmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'Murat', 'Emre', 'Yusuf', 'Ömer', 'Burak', 'Serkan', 'Oğuz', 'Ramazan', 'Furkan', 'Kemal', 'Cem', 'Barış', 'Volkan', 'Halil', 'Recep', 'Şahin', 'Eren', 'Baran', 'Sinan', 'Osman', 'Orhan', 'Selim', 'Tolga', 'Onur', 'Kaan', 'Arda'];
const CH = ['vur vur', 'hadi be', 'yıkılın', 'şampiyon biziz', 'kaçmayın', 'abi ne oluyor 😂', 'polis yok mu', 'bitirin şunları', 'tribün yanıyor 🔥', 'sahaya iniyorum'];
// büyük takımlar daha sık seçilsin
const AGIRLIK = { gs: 9, fb: 9, bjk: 6, ts: 5 };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);
function takimSec() {
  const top = TAKIMLAR.reduce((s, t) => s + (AGIRLIK[t.id] || 1), 0);
  let r = Math.random() * top;
  for (const t of TAKIMLAR) { r -= AGIRLIK[t.id] || 1; if (r <= 0) return t; }
  return TAKIMLAR[0];
}

export function createDemo(G) {
  const H = (ev) => (G.yolla || G.handle)(ev); // sunucu üzerinden: sahne penceresi de görür
  const D = { on: false, paused: false, pool: [], t: 0, next: 0.3, vt: 0 };
  const used = new Set();
  for (let i = 0; i < 160; i++) {
    let nm = pick(Math.random() < 0.3 ? F : M);
    if (used.has(nm)) nm += pick([' K.', ' Y.', ' D.', ' A.', '_' + Math.floor(rand(10, 99))]);
    if (used.has(nm)) continue;
    used.add(nm); D.pool.push({ id: 'demo_' + i, nick: nm });
  }
  // sahada olmayan biri
  const absent = () => { const a = D.pool.filter((u) => { const f = G.savascilar.get(u.id); return !f || f.durum === 'ko'; }); return a.length ? pick(a) : pick(D.pool); };
  const present = () => { const a = G.canli().filter((f) => !f.bot); if (!a.length) return absent(); const f = pick(a); return { id: f.u.id, nick: f.u.nick }; };
  // gerçek izleyici gibi farklı yazımlar (tırnaksız, büyük/küçük harf, Türkçe karaktersiz)
  D.yaz = (T) => {
    const a = pick(T.alias.filter((x) => x.length > 2) || [T.ad]);
    return pick([T.ad, T.ad.toLocaleUpperCase('tr') + '!!!', a, `${a} geliyor`, `hadi ${a}`, `${T.ad.toLocaleLowerCase('tr')} 💪`]);
  };
  D.ruleGift = (i, user) => {
    const r = G.rules[i]; if (!r) return;
    const dia = r.jeton != null ? r.jeton : r.minJeton;
    H({ type: 'gift', user: user || present(), gift: { name: (r.ad && r.ad[0]) || r.etiket, id: (r.id && r.id[0]) || '', diamonds: dia, count: 1, icon: r.ikon || '🎁' } });
  };
  D.absent = absent;
  D.tick = (dt) => {
    if (!D.on || D.paused) return;
    D.vt -= dt;
    if (D.vt <= 0) { D.vt = 3; G.handle({ type: 'viewers', count: Math.round(G.canli().length * 3 + rand(10, 40)) }); }
    D.t += dt; if (D.t < D.next) return; D.t = 0;
    const n = G.canli().length;
    D.next = n < 20 ? rand(0.3, 0.7) : rand(0.7, 1.6);
    const r = Math.random();
    if (n < 20 || (r < 0.3 && n < 70)) return H({ type: 'chat', user: absent(), text: D.yaz(takimSec()) });
    if (r < 0.5) return H({ type: 'chat', user: present(), text: pick(CH) });
    if (r < 0.8) return H({ type: 'like', user: present(), count: Math.ceil(rand(1, 12)) });
    if (r < 0.9) return D.ruleGift(0);
    if (r < 0.99) return D.ruleGift(Math.floor(rand(1, G.rules.length - 1)));
    D.ruleGift(G.rules.length - 1);
  };
  return D;
}
