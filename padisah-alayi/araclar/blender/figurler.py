# Padişah Alayı figürleri: insan (yaya) ve atlı (binici + at).
# Parça adları oyundaki kod iskeletiyle aynı: govde, kolL, kolR, bacakL, bacakR, bas, bayrak,
# at_govde, at_boyun, at_kuyruk, at_bacak0..3 → oyun yürüyüş, selam, "çok yaşa" ve bayrak dalgasını kendisi oynatır.
# Yüz: -z (oyun). Ölçü: oyun birimi (yaya ~2.0, atlı ~3.3); oyun bu ölçüyü olduğu gibi kullanır.
import math
from ortak import Parca, bos, koyu, PI

TEN = '#d9a77c'
TEN_K = '#c08a62'
SIYAH = '#1a1410'
ALTIN = '#e0b84e'


# ---------------- insan ----------------
def insan(o, parent=None, loc=(0, 0, 0)):
    kf = o['kaftan']
    ic = o.get('ic', '#e8e0cc')
    ku = o.get('kusak', '#d8b04a')
    ciz = o.get('cizme', '#8a2a1a')
    atli = o.get('atli', False)

    g = Parca('govde', loc)
    # kaftan: altta geniş etek, üstte gövde
    g.sil(kf, (0, 0.98, 0), 1.0, 0.4, 0.26, seg=14)
    g.sil(koyu(kf, 0.82), (0, 0.5, 0), 0.05, 0.405, 0.4, seg=14)  # etek kenarı
    # önde açılan yaka şeridi + düğmeler
    g.kutu(ic, (0, 0.98, -0.336), (0.06, 1.0, 0.02), rot=(0.14, 0, 0))
    for i in range(5):
        y = 1.2 + i * 0.055
        g.top(ALTIN, (0, y, -(0.26 + (1.48 - y) * 0.14) - 0.012), 0.035, u=6, v=4, maden=True)
    g.sil(ku, (0, 1.12, 0), 0.11, 0.33, seg=14)  # kuşak
    g.kutu(ku, (0.12, 1.05, -0.315), (0.08, 0.16, 0.03), rot=(0.1, 0, 0))
    for s in (-1, 1):
        g.top(kf, (s * 0.26, 1.43, 0), (0.2, 0.16, 0.22))  # omuz
    g.sil(TEN, (0, 1.54, 0), 0.12, 0.075, seg=8)  # boyun
    g.sil(ic, (0, 1.49, 0), 0.05, 0.2, 0.16, seg=12)  # yaka
    if o.get('kurk'):  # kapaniçe: kürk yaka ve kenarlar
        k = o['kurk']
        g.top(k, (0, 1.46, 0.01), (0.56, 0.14, 0.46), u=14, v=6)
        g.sil(k, (0, 0.52, 0), 0.07, 0.415, seg=14)
        for s in (-1, 1):
            g.kutu(k, (s * 0.06, 0.98, -0.338), (0.06, 0.96, 0.03), rot=(0.14, 0, 0))
    if o.get('kilic'):  # sol kalçada kılıç
        g.cubuk('#3a2418', (-0.33, 0.78, 0.42), (-0.33, 1.12, -0.12), 0.032, seg=6)
        g.cubuk(ALTIN, (-0.33, 1.12, -0.12), (-0.33, 1.22, -0.27), 0.022, seg=6, maden=True)
        g.kutu(ALTIN, (-0.33, 1.13, -0.13), (0.03, 0.03, 0.14), maden=True)
    if o.get('tasi') == 'davul':
        g.sil('#c9a36b', (0, 1.02, -0.44), 0.34, 0.3, seg=16, rot=(0, 0, PI / 2))
        for s in (-1, 1):
            g.sil('#7a2a1a', (s * 0.175, 1.02, -0.44), 0.035, 0.31, seg=16, rot=(0, 0, PI / 2))
        g.kutu('#7a2a1a', (0, 1.25, -0.2), (0.06, 0.7, 0.04), rot=(0.6, 0, 0.6))  # askı
    g.ob = g.nesne(parent)

    # bacaklar
    for s, ad in ((-1, 'bacakL'), (1, 'bacakR')):
        rot = (-1.25, 0, 0.35 * s) if atli else (0, 0, 0)
        b = Parca(ad, (s * 0.12, 0.88, 0), rot)
        b.sil(ic, (0, -0.34, 0), 0.68, 0.08, 0.1, seg=8)
        b.sil(ciz, (0, -0.73, -0.005), 0.2, 0.085, 0.08, seg=8)
        b.kutu(ciz, (0, -0.83, -0.06), (0.15, 0.08, 0.27))
        b.koni(ciz, (0, -0.82, -0.22), 0.12, 0.05, seg=6, rot=(-PI / 2 + 0.35, 0, 0))
        b.nesne(g.ob)

    # kollar
    for s, ad in ((-1, 'kolL'), (1, 'kolR')):
        k = Parca(ad, (s * 0.34, 1.42, 0))
        k.sil(kf, (0, -0.15, 0), 0.3, 0.075, 0.088, seg=8)
        k.top(kf, (0, -0.31, 0), (0.15, 0.13, 0.15), u=8, v=6)
        k.sil(kf, (0, -0.44, 0), 0.26, 0.072, 0.075, seg=8)
        k.sil(ic, (0, -0.565, 0), 0.04, 0.078, seg=8)
        k.kutu(TEN, (0, -0.63, -0.01), (0.075, 0.11, 0.055))
        k.kutu(TEN, (0, -0.7, -0.015), (0.07, 0.05, 0.045))
        k.kutu(TEN, (-s * 0.045, -0.61, -0.035), (0.03, 0.065, 0.03), rot=(0, 0, s * 0.4))
        t = o.get('tasi')
        if t == 'zil':
            k.sil(ALTIN, (0, -0.7, -0.06), 0.03, 0.15, seg=14, rot=(PI / 2, 0, 0), maden=True)
            k.top(ALTIN, (0, -0.7, -0.08), 0.06, u=6, v=4, maden=True)
        if s > 0 and t == 'sancak':
            k.sil('#4a3020', (0, 0.7, 0), 3.4, 0.028, seg=6)
            k.top(ALTIN, (0, 2.42, 0), 0.12, u=8, v=6, maden=True)
            hilal(k, ALTIN, (0, 2.62, 0), 0.13, maden=True)
        if s > 0 and t == 'mizrak':
            k.sil('#5a3d24', (0, 0.2, 0), 3.2, 0.022, seg=6)
            k.koni('#c0c6cc', (0, 1.95, 0), 0.32, 0.045, seg=6, maden=True)
            k.kutu('#c1121f', (0, 1.6, 0.16), (0.012, 0.16, 0.3))
        if s > 0 and t == 'zurna':
            k.sil('#7a5734', (0, -0.62, -0.25), 0.5, 0.025, 0.07, seg=8, rot=(-1.2, 0, 0))
            k.sil(ALTIN, (0, -0.52, -0.02), 0.04, 0.03, seg=8, rot=(-1.2, 0, 0), maden=True)
        if s > 0 and t == 'davul':
            k.cubuk('#6a4a2a', (0, -0.66, -0.02), (0, -0.82, -0.36), 0.018, seg=5)
            k.top('#e8dcc0', (0, -0.84, -0.38), 0.06, u=6, v=4)
        ob = k.nesne(g.ob)
        if s > 0 and t == 'sancak':
            bayrak(ob, o.get('bayrak', '#c1121f'))
        if s > 0 and t == 'zurna':
            bos('zurna', ob)

    # baş
    b = Parca('bas', (0, 1.64, 0))
    b.top(TEN, (0, 0, 0), (0.32, 0.38, 0.33), u=14, v=10)
    b.top(TEN, (0, -0.08, -0.04), (0.26, 0.22, 0.26), u=10, v=6)  # çene
    b.koni(TEN_K, (0, -0.01, -0.18), 0.1, 0.035, seg=5, rot=(-PI / 2 + 0.25, 0, 0))  # burun
    for s in (-1, 1):
        b.top('#f4efe6', (s * 0.065, 0.04, -0.148), (0.05, 0.034, 0.02), u=6, v=4)
        b.top(SIYAH, (s * 0.065, 0.04, -0.158), 0.024, u=6, v=4)
        b.kutu(o.get('kas', '#2a1d15'), (s * 0.068, 0.088, -0.155), (0.075, 0.018, 0.02), rot=(0, 0, -s * 0.15))
        b.kutu(o.get('biyik', SIYAH), (s * 0.052, -0.068, -0.163), (0.095, 0.026, 0.03), rot=(0, 0, -s * 0.34))
        b.top(TEN, (s * 0.165, 0, 0), (0.05, 0.09, 0.06), u=6, v=4)
    b.kutu('#8a4a3a', (0, -0.105, -0.152), (0.06, 0.012, 0.01))
    if o.get('sakal'):
        sk = o['sakal']
        b.top(sk, (0, -0.12, -0.09), (0.22, 0.14, 0.16), u=8, v=5)
        b.koni(sk, (0, -0.2, -0.1), 0.2, 0.1, seg=7, rot=(PI + 0.25, 0, 0))
    bas_ortusu(b, o)
    b.nesne(g.ob)
    return g.ob


def bas_ortusu(b, o):
    t = o.get('bas')
    if t == 'kallavi':  # padişah kavuğu: iri beyaz sarık, kırmızı tepe, sorguç
        b.top('#f7f4ec', (0, 0.26, 0), (0.64, 0.52, 0.64), u=16, v=10)
        for i, y in enumerate((0.12, 0.2, 0.28, 0.36)):
            r = 0.32 * math.sqrt(max(0, 1 - ((y - 0.26) / 0.26) ** 2)) + 0.006
            b.sil('#e6e0d2', (0, y, 0), 0.028, r, seg=16, rot=(0.12 if i % 2 else -0.12, 0, 0))
        b.sil('#b3122e', (0, 0.5, 0), 0.12, 0.09, seg=10)
        b.kutu(ALTIN, (0, 0.27, -0.31), (0.07, 0.11, 0.04), maden=True)
        b.top('#2bb673', (0, 0.25, -0.335), (0.07, 0.07, 0.04), u=6, v=4)
        b.koni('#ffffff', (0.02, 0.44, -0.27), 0.3, 0.045, seg=6, rot=(0.3, 0, -0.1))
        b.koni('#f2ede0', (-0.04, 0.42, -0.28), 0.24, 0.035, seg=6, rot=(0.25, 0, 0.22))
    elif t == 'kavuk':  # vezir kavuğu
        b.sil('#f2eee4', (0, 0.3, 0), 0.36, 0.21, 0.225, seg=14)
        b.top('#f2eee4', (0, 0.48, 0), (0.45, 0.2, 0.45), u=14, v=6)
        b.sil(o.get('tepe', '#2f6b3a'), (0, 0.57, 0), 0.12, 0.08, seg=10)
        b.sil(ALTIN, (0, 0.33, 0), 0.025, 0.218, seg=14, rot=(0.3, 0, 0), maden=True)
    elif t == 'bork':  # yeniçeri börkü
        b.sil('#f3efe6', (0, 0.38, 0.02), 0.55, 0.168, 0.15, seg=12)
        b.top('#f3efe6', (0, 0.65, 0.02), (0.3, 0.08, 0.3), u=10, v=4)
        b.sil('#ddd5c2', (0, 0.13, 0.01), 0.06, 0.178, seg=12)
        b.kutu(ALTIN, (0, 0.24, -0.16), (0.1, 0.2, 0.03), maden=True)
        b.top(ALTIN, (0, 0.36, -0.165), (0.07, 0.05, 0.03), u=6, v=4, maden=True)
        b.kutu('#f3efe6', (0, 0.2, 0.215), (0.26, 0.82, 0.04), rot=(0.06, 0, 0))  # yatırtma
    elif t == 'mehter':
        b.koni('#b3202a', (0, 0.36, 0), 0.5, 0.19, seg=12)
        b.sil('#f3efe6', (0, 0.14, 0), 0.1, 0.195, seg=12)
        b.top(ALTIN, (0, 0.62, 0), 0.06, u=6, v=4, maden=True)
    elif t == 'migfer':  # sipahi: sarıklı sivri miğfer
        b.sil('#f2eee4', (0, 0.15, 0), 0.13, 0.2, seg=12)
        b.top('#b9c0c8', (0, 0.24, 0), (0.37, 0.32, 0.37), u=12, v=6, maden=True)
        b.koni('#b9c0c8', (0, 0.47, 0), 0.22, 0.035, seg=6, maden=True)
        b.kutu('#b9c0c8', (0, 0.05, -0.18), (0.025, 0.16, 0.02), maden=True)


def hilal(p, h, mrk, boyut, maden=False):
    """x-y düzleminde hilal (alem), mrk merkez."""
    cx, cy, cz = mrk
    n, R, r, d = 10, boyut, boyut * 0.8, boyut * 0.32
    a0, a1 = 0.75, 2 * PI - 0.75
    for i in range(n):
        ps = []
        for a in (a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n):
            ox, oy = math.cos(a) * R, math.sin(a) * R
            ix, iy = d + math.cos(a) * r, math.sin(a) * r
            k = min(1, min(a - a0, a1 - a) / 0.9)
            ix, iy = ox + (ix - ox) * k, oy + (iy - oy) * k
            ps.append(((cx - oy, cy + ox, cz), (cx - iy, cy + ix, cz)))  # 90° döndür: uçlar yukarı
        (o1, i1), (o2, i2) = ps
        for dz in (-0.012, 0.012):
            p.yuz(h, [(q[0], q[1], q[2] + dz) for q in (o1, o2, i2, i1)], maden)


def bayrak(kol, h):
    """Dalgalanan sancak: 1.1×0.75 düzlem, yerel x ∈ [-0.55,0.55] (oyun dalga kodu bunu bekler).
    Ortasında beyaz hilal (köşe renkleriyle)."""
    p = Parca('bayrak', (0, 1.95, 0.56), (0, -PI / 2, 0))
    nu, nv = 22, 14

    def nokta(u, v):
        return (-0.55 + 1.1 * u, -0.375 + 0.75 * v, 0)

    def rnk(i, j):
        x, y = -0.55 + 1.1 * (i + 0.5) / nu, -0.375 + 0.75 * (j + 0.5) / nv
        x0 = x + 0.05
        dis = math.hypot(x0, y) < 0.22
        ic_ = math.hypot(x0 - 0.07, y) < 0.18
        yildiz = math.hypot(x - 0.22, y) < 0.05
        return '#f7f2e8' if (dis and not ic_) or yildiz else h
    p.izgara(nokta, nu, nv, rnk)
    return p.nesne(kol)


# ---------------- at ----------------
def at(renk, cul='#9b1b30', sus=ALTIN, parent=None, ak=False, sorguc=False):
    yele = '#e6e0d4' if ak else '#2a1d15'
    g = Parca('at_govde')
    g.top(renk, (0, 1.35, 0.02), (0.7, 0.72, 1.6), u=16, v=10)
    g.top(renk, (0, 1.42, -0.58), (0.64, 0.68, 0.66), u=12, v=8)
    g.top(renk, (0, 1.45, 0.58), (0.68, 0.7, 0.7), u=12, v=8)
    # çul (eyer örtüsü) + saçaklar
    g.kutu(cul, (0, 1.71, 0.06), (0.76, 0.06, 1.0))
    for s in (-1, 1):
        g.kutu(cul, (s * 0.38, 1.48, 0.06), (0.03, 0.46, 1.0))
        g.kutu(sus, (s * 0.385, 1.26, 0.06), (0.03, 0.05, 1.02), maden=True)
        for i in range(6):
            g.koni(sus, (s * 0.385, 1.19, -0.38 + i * 0.176), 0.1, 0.03, seg=5, rot=(PI, 0, 0), maden=True)
        g.top(sus, (s * 0.395, 1.5, 0.06), (0.04, 0.16, 0.16), u=8, v=5, maden=True)  # madalyon
        # üzengi
        g.cubuk('#3a2a20', (s * 0.4, 1.72, -0.12), (s * 0.44, 1.08, -0.3), 0.015, seg=4)
        g.kutu(sus, (s * 0.44, 1.05, -0.3), (0.06, 0.04, 0.14), maden=True)
    g.kutu('#6a1420', (0, 1.78, 0.1), (0.36, 0.08, 0.52))  # eyer
    g.kutu(sus, (0, 1.86, -0.18), (0.24, 0.16, 0.07), maden=True)
    g.kutu(sus, (0, 1.85, 0.36), (0.32, 0.12, 0.07), maden=True)
    # göğüslük
    for s in (-1, 1):
        g.kutu('#3a2a20', (s * 0.2, 1.5, -0.8), (0.24, 0.05, 0.05), rot=(0, s * 0.55, 0))
    g.top(sus, (0, 1.46, -0.88), (0.14, 0.14, 0.05), u=8, v=5, maden=True)
    g.kutu('#3a2a20', (0, 1.55, 0.95), (0.5, 0.04, 0.05))  # kuskun
    g.ob = g.nesne(parent)

    # boyun + baş
    b = Parca('at_boyun', (0, 1.6, -0.62))
    b.sil(renk, (0, 0.3, -0.14), 0.8, 0.27, 0.17, seg=10, rot=(-0.5, 0, 0), scl=(0.7, 1, 1))
    b.sil(renk, (0, 0.66, -0.51), 0.6, 0.17, 0.12, seg=8, rot=(-PI / 2 - 0.45, 0, 0), scl=(0.8, 1, 1))
    b.top(koyu(renk, 0.85), (0, 0.5, -0.77), (0.21, 0.2, 0.2), u=8, v=6)
    for s in (-1, 1):
        b.top(SIYAH, (s * 0.055, 0.47, -0.84), 0.035, u=5, v=4)
        b.top(SIYAH, (s * 0.125, 0.75, -0.44), 0.055, u=6, v=4)
        b.koni(renk, (s * 0.075, 0.93, -0.3), 0.13, 0.036, seg=5, rot=(0.15, 0, s * 0.2))
        b.top(sus, (s * 0.12, 0.62, -0.58), 0.05, u=6, v=4, maden=True)  # yanak rozeti
    for i in range(7):  # yele
        t = 0.05 + i * 0.12
        b.kutu(yele, (0, -0.03 + 0.88 * t + 0.48 * 0.13, 0.07 - 0.48 * t + 0.88 * 0.13), (0.055, 0.17, 0.09), rot=(-0.5, 0, 0))
    b.kutu(yele, (0, 0.88, -0.34), (0.05, 0.08, 0.12), rot=(0.4, 0, 0))  # perçem
    b.kutu('#3a2a20', (0, 0.56, -0.68), (0.2, 0.04, 0.14), rot=(-0.45, 0, 0))  # yular
    b.kutu('#3a2a20', (0, 0.74, -0.36), (0.22, 0.04, 0.06))
    if sorguc:
        b.top(sus, (0, 0.9, -0.36), 0.07, u=6, v=4, maden=True)
        b.koni('#ffffff', (0, 1.12, -0.32), 0.35, 0.05, seg=6, rot=(0.25, 0, 0))
    b.nesne(g.ob)

    k = Parca('at_kuyruk', (0, 1.48, 0.86))
    k.sil(yele, (0, -0.34, 0.15), 0.75, 0.055, 0.12, seg=7, rot=(2.72, 0, 0))
    k.nesne(g.ob)

    for i, (x, z) in enumerate(((-0.2, -0.5), (0.2, -0.5), (-0.2, 0.5), (0.2, 0.5))):
        l = Parca('at_bacak%d' % i, (x, 1.15, z))
        on = z < 0
        if on:
            l.sil(renk, (0, -0.25, 0), 0.5, 0.085, 0.125, seg=8)
            l.top(renk, (0, -0.52, 0), (0.16, 0.15, 0.17), u=8, v=5)
            l.sil(renk, (0, -0.76, 0), 0.42, 0.064, seg=7)
        else:
            l.sil(renk, (0, -0.22, 0.03), 0.48, 0.095, 0.16, seg=8)
            l.top(renk, (0, -0.5, 0.08), (0.16, 0.16, 0.19), u=8, v=5)
            l.sil(renk, (0, -0.76, 0.04), 0.44, 0.064, seg=7, rot=(0.08, 0, 0))
        l.top('#f0ebe0' if ak else renk, (0, -0.98, -0.005), (0.14, 0.11, 0.15), u=7, v=5)
        l.sil('#2a2018', (0, -1.08, -0.015), 0.1, 0.09, 0.074, seg=8)
        l.nesne(g.ob)
    return g.ob


def atli(binici, at_args, parent):
    a = at(*at_args[0], parent=parent, **at_args[1])
    binici = dict(binici, atli=True)
    insan(binici, a, (0, 0.92, 0.05))
    return a


# ---------------- roller ----------------
YENICERI = ['#2d4f8a', '#7d2424', '#4a3f7a', '#2f6b5a']


def figur_listesi():
    """(dosya adı, kur fonksiyonu) listesi."""
    L = []
    L.append(('padisah', lambda r: atli(
        dict(kaftan='#d9b25a', ic='#f2e6c9', kusak='#b3122e', bas='kallavi', sakal='#3a2a1e', cizme='#c8a040', kurk='#efe2c4', kilic=True),
        (('#f4f1ea', '#b3122e', ALTIN), dict(ak=True, sorguc=True)), r)))
    L.append(('ibrahim', lambda r: atli(
        dict(kaftan='#2f6b3a', kusak=ALTIN, bas='kavuk', tepe='#b3122e', sakal='#2a1d15', kilic=True),
        (('#7a4a2a', '#1f4a2a', ALTIN), {}), r)))
    for i, c in enumerate(YENICERI):
        L.append(('yeniceri' + ('' if i == 0 else '-%d' % (i + 1)), lambda r, c=c, i=i: insan(
            dict(kaftan=c, bas='bork', sakal='#2a1d15' if i % 2 == 0 else None), r)))
    for i, t in enumerate(('davul', 'zurna', 'zil')):
        L.append(('mehter' + ('' if i == 0 else '-%d' % (i + 1)), lambda r, t=t, i=i: insan(
            dict(kaftan='#b3202a', ic='#e8c25a', kusak='#e8c25a', bas='mehter', sakal='#2a1d15' if i != 1 else None, tasi=t), r)))
    for i, b in enumerate(('#c1121f', '#1f6b3a')):
        L.append(('sancak' + ('' if i == 0 else '-%d' % (i + 1)), lambda r, b=b: insan(
            dict(kaftan='#7d2424', bas='bork', tasi='sancak', bayrak=b, sakal='#2a1d15'), r)))
    L.append(('musahip', lambda r: insan(dict(kaftan='#5a2d6e', kusak=ALTIN, bas='kavuk', tepe='#5a2d6e', sakal='#3a2a20', kilic=True), r)))
    for i, c in enumerate(('#5a3a24', '#2a1d15', '#7a4a2a')):
        L.append(('sipahi' + ('' if i == 0 else '-%d' % (i + 1)), lambda r, c=c: atli(
            dict(kaftan='#8f1d1d', bas='migfer', sakal='#2a1d15', tasi='mizrak'),
            ((c, '#2d4f8a', ALTIN), {}), r)))
    return L
