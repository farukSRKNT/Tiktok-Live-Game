# Kadırga (alayın deniz geçişinde üstünde yürüdüğü gemi) ve Osmanlı evleri.
# Oyun koordinatı: güverte üstü y=0.05, burun -z, kıç +z. Alay x ∈ [-2.6, 2.6] şeridinde, z ∈ [-2, 46] arasında durur;
# direkler ve yelkenler alayın önünde (burun tarafında) kalır.
import math
from ortak import Parca, koyu, PI

KIRMIZI = '#b3202a'
BEYAZ = '#f2ede0'
ALTIN = '#e0b84e'
AHSAP = '#7a5734'
AHSAP_K = '#4a3020'
YESIL = '#1f6b3a'


def _sstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


# ---------------- kadırga ----------------
Z_BURUN, Z_KIC = -26.0, 50.0


def gen(z):  # yarım genişlik
    return 4.6 * (0.08 + 0.92 * _sstep(Z_BURUN, -12, z)) * (1 - 0.5 * _sstep(38, Z_KIC, z))


def sirt(z):  # baş ve kıçta güverte kenarı yükselir
    return 0.9 * _sstep(-14, Z_BURUN, z) + 1.3 * _sstep(36, Z_KIC, z)


# kesit: (genişlik çarpanı, yükseklik, renk)  — üstten alta
KESIT = [(1.03, 0.75, ALTIN), (1.03, 0.62, KIRMIZI), (1.0, 0.25, KIRMIZI), (0.98, -0.12, KIRMIZI),
         (0.95, -0.5, BEYAZ), (0.86, -0.9, '#3a2418'), (0.55, -1.4, '#3a2418'), (0.0, -1.65, '#3a2418')]


def gemi_govdesi(p):
    zs = [Z_BURUN + (Z_KIC - Z_BURUN) * i / 60 for i in range(61)]
    for sag in (-1, 1):
        for a in range(len(zs) - 1):
            z0, z1 = zs[a], zs[a + 1]
            for k in range(len(KESIT) - 1):
                (w0, y0, c), (w1, y1, _) = KESIT[k], KESIT[k + 1]
                def nk(z, w, y, ust):
                    return (sag * gen(z) * w, y + (sirt(z) if ust else sirt(z) * 0.3), z)
                q = [nk(z0, w0, y0, k <= 2), nk(z1, w0, y0, k <= 2), nk(z1, w1, y1, k + 1 <= 2), nk(z0, w1, y1, k + 1 <= 2)]
                if sag < 0:
                    q.reverse()
                p.yuz(c, q)
    # kıç aynası (kapalı arka)
    z = Z_KIC
    for k in range(len(KESIT) - 1):
        (w0, y0, c), (w1, y1, _) = KESIT[k], KESIT[k + 1]
        h0, h1 = sirt(z) if k <= 2 else sirt(z) * 0.3, sirt(z) if k + 1 <= 2 else sirt(z) * 0.3
        p.yuz(c, [(-gen(z) * w0, y0 + h0, z), (gen(z) * w0, y0 + h0, z), (gen(z) * w1, y1 + h1, z), (-gen(z) * w1, y1 + h1, z)])


def guverte(p):
    # tahta güverte: boyuna şeritler
    zs = [Z_BURUN + 1.2 + (Z_KIC - 0.6 - Z_BURUN - 1.2) * i / 40 for i in range(41)]
    nx = 14
    for a in range(len(zs) - 1):
        z0, z1 = zs[a], zs[a + 1]
        for i in range(nx):
            u0, u1 = -1 + 2 * i / nx, -1 + 2 * (i + 1) / nx
            c = '#b48c5e' if i % 2 else '#a8804f'
            y0, y1 = 0.05 + sirt(z0) * 0.55, 0.05 + sirt(z1) * 0.55
            p.yuz(c, [(u0 * gen(z0), y0, z0), (u1 * gen(z0), y0, z0), (u1 * gen(z1), y1, z1), (u0 * gen(z1), y1, z1)])
    # iç bordalar (küpeşte içi)
    for s in (-1, 1):
        for a in range(len(zs) - 1):
            z0, z1 = zs[a], zs[a + 1]
            q = [(s * gen(z0) * 0.99, 0.05 + sirt(z0) * 0.55, z0), (s * gen(z1) * 0.99, 0.05 + sirt(z1) * 0.55, z1),
                 (s * gen(z1) * 1.02, 0.7 + sirt(z1), z1), (s * gen(z0) * 1.02, 0.7 + sirt(z0), z0)]
            p.yuz('#8a2a22', q if s > 0 else q[::-1])


def kurek_takimi(p):
    # kürekçi sıraları, apostis (kürek kirişi) ve kırmızı kürekler
    for s in (-1, 1):
        p.kutu(AHSAP_K, (s * 4.95, 0.9, 13), (0.22, 0.2, 48))  # apostis
        for z in range(-9, 37, 6):
            p.kutu(AHSAP_K, (s * 4.75, 0.75, z), (0.6, 0.12, 0.14))
        n = 22
        for i in range(n):
            z = -9 + i * (46 / (n - 1))
            on = (s * 4.95, 1.0, z)
            ic = (s * 3.75, 1.2, z - 0.15)
            dis = (s * 10.6, -0.4, z + 0.9)
            p.cubuk(KIRMIZI, ic, dis, 0.05, 0.045, seg=5)
            # kürek palası
            bx, by, bz = dis
            p.kutu(KIRMIZI, (bx - s * 0.5, by + 0.06, bz + 0.05), (1.3, 0.04, 0.3), rot=(0, 0, -s * 0.24))
        for z in range(-8, 38, 2):  # sıralar
            if -2 < z < 46:
                p.kutu('#6a4a2a', (s * 3.4, 0.32, z), (1.6, 0.12, 0.38))


def direk(p, z, boy, kalin, yard1, yard2, iskota):
    p.sil(AHSAP_K, (0, boy / 2, z), boy, kalin, kalin * 0.6, seg=8)
    p.sil(AHSAP, (0, boy * 0.86, z), 0.5, 0.55, 0.42, seg=10)  # gabya (çanaklık)
    p.top(ALTIN, (0, boy + 0.15, z), 0.3, u=8, v=6, maden=True)
    alem(p, (0, boy + 0.7, z), 0.45)
    # lateen seren (çapraz)
    p.cubuk(AHSAP, yard1, yard2, 0.14, 0.08, seg=6)
    # üçgen yelken (hafif şişkin)
    a, b, c = yard1, yard2, iskota

    def nok(u, v):
        # u: seren boyunca, v: serenden iskotaya doğru
        x = a[0] + (b[0] - a[0]) * u
        y = a[1] + (b[1] - a[1]) * u - 0.25
        zz = a[2] + (b[2] - a[2]) * u
        x2 = x + (c[0] - x) * v
        y2 = y + (c[1] - y) * v
        z2 = zz + (c[2] - zz) * v * (1 - u * 0.0)
        # iskota noktasına doğru daralt
        k = v
        x2 = x + (c[0] - x) * k
        bulge = math.sin(PI * u) * math.sin(PI * min(1, v * 1.1)) * 1.1
        return (x2 + bulge + 0.25, y2, zz + (c[2] - zz) * k)
    p.izgara(nok, 12, 8, lambda i, j: BEYAZ if (i % 3) else '#e4ddcc')


def alem(p, mrk, boy):
    cx, cy, cz = mrk
    n, R, r, d = 10, boy, boy * 0.8, boy * 0.32
    a0, a1 = 0.75, 2 * PI - 0.75
    for i in range(n):
        ps = []
        for aa in (a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n):
            ox, oy = math.cos(aa) * R, math.sin(aa) * R
            ix, iy = d + math.cos(aa) * r, math.sin(aa) * r
            k = min(1, min(aa - a0, a1 - aa) / 0.9)
            ix, iy = ox + (ix - ox) * k, oy + (iy - oy) * k
            ps.append(((cx, cy + ox, cz - oy), (cx, cy + ix, cz - iy)))
        (o1, i1), (o2, i2) = ps
        p.yuz(ALTIN, [o1, o2, i2, i1], maden=True)


def flama(p, bas, boy, gen_, renk=KIRMIZI, dalga=0.0):
    """Direk tepesinden kıça doğru uzanan uzun, sivri flama; dibinde beyaz hilal."""
    x0, y0, z0 = bas

    def nok(u, v):
        w = gen_ * (1 - u) * 0.5
        return (x0 + math.sin(u * 7 + dalga) * 0.25 * u, y0 - u * boy * 0.12 + (v - 0.5) * 2 * w, z0 + u * boy)

    def rnk(i, j):
        u = (i + 0.5) / 16
        v = (j + 0.5) / 4
        if 0.04 < u < 0.14 and 0.15 < v < 0.85:
            return BEYAZ
        return renk
    p.izgara(nok, 16, 4, rnk)


def kic_kosku(p):
    z0 = 41.5
    yk = 0.05 + sirt(44) * 0.55
    p.kutu('#8a5a34', (0, yk + 0.5, 44.3), (4.6, 1.0, 5.8))  # kasara (yükseltilmiş kıç güvertesi)
    p.kutu(ALTIN, (0, yk + 1.02, 44.3), (4.7, 0.06, 5.9), maden=True)
    y = yk + 1.05
    for x in (-1.9, 1.9):
        for z in (42.0, 44.3, 46.6):
            p.sil(ALTIN if z == 44.3 else KIRMIZI, (x, y + 1.2, z), 2.4, 0.09, seg=8)
    p.kutu(KIRMIZI, (0, y + 2.45, 44.3), (4.4, 0.18, 5.6))  # çatı saçağı
    p.kutu(ALTIN, (0, y + 2.33, 44.3), (4.5, 0.06, 5.7), maden=True)
    p.top(KIRMIZI, (0, y + 2.55, 44.3), (3.8, 1.6, 5.0), u=16, v=8)  # kubbe benzeri tente
    p.top(ALTIN, (0, y + 3.4, 44.3), 0.3, u=8, v=6, maden=True)
    alem(p, (0, y + 4.0, 44.3), 0.4)
    # perdeler / korkuluk
    for s in (-1, 1):
        p.kutu('#e8d8a8', (s * 1.9, y + 0.45, 44.3), (0.05, 0.9, 4.6))
    # kıç fenerleri
    for x in (-1.6, 0, 1.6):
        hy = y + (3.2 if x == 0 else 2.4)
        p.sil(AHSAP_K, (x, hy - 0.9, 47.6), 1.8, 0.05, seg=6)
        p.sil(ALTIN, (x, hy + 0.3, 47.6), 0.7, 0.28, 0.2, seg=8, maden=True)
        p.top(ALTIN, (x, hy + 0.75, 47.6), 0.25, u=8, v=5, maden=True)
    # yeşil sancak
    p.sil(AHSAP_K, (0, y + 3.0, 48.8), 6.0, 0.07, seg=6)
    p.top(ALTIN, (0, y + 6.05, 48.8), 0.18, u=8, v=5, maden=True)

    def nok(u, v):
        return (math.sin(u * 4) * 0.25 * u, y + 5.8 - v * 2.0, 48.85 + u * 3.0)

    def rnk(i, j):  # yeşil zemin üzerinde üç beyaz hilal (ikisi üstte, biri altta)
        u, v = (i + 0.5) / 36, (j + 0.5) / 24
        x0, yy = u * 3.0 - 1.5, (v - 0.5) * 2.0
        for cx, cy in ((-0.62, -0.42), (0.42, -0.42), (-0.1, 0.48)):  # v=0 üst kenar
            if math.hypot(x0 - cx, yy - cy) < 0.36 and math.hypot(x0 - cx - 0.13, yy - cy) > 0.29:
                return BEYAZ
        return YESIL
    p.izgara(nok, 36, 24, rnk)


def kadirga(kok):
    p = Parca('kadirga')
    gemi_govdesi(p)
    guverte(p)
    kurek_takimi(p)
    # mahmuz (baştaki uzun burun)
    p.cubuk(KIRMIZI, (0, 1.0 + sirt(Z_BURUN), Z_BURUN + 1), (0, 1.5, Z_BURUN - 7), 0.35, 0.08, seg=8)
    p.koni(ALTIN, (0, 1.55, Z_BURUN - 7.3), 0.6, 0.12, seg=6, rot=(-PI / 2 + 0.07, 0, 0), maden=True)
    p.kutu(ALTIN, (0, 0.78 + sirt(Z_BURUN + 2), Z_BURUN + 2.2), (1.4, 0.25, 0.3), maden=True)
    # burun platformu (rambade)
    p.kutu('#8a5a34', (0, 0.05 + sirt(-20) * 0.55 + 0.4, -20.5), (6.0, 0.8, 4.0))
    p.kutu(ALTIN, (0, 0.05 + sirt(-20) * 0.55 + 0.82, -20.5), (6.1, 0.06, 4.1), maden=True)
    # direkler: alayın önünde (baş tarafta)
    direk(p, -15.5, 12.5, 0.28, (0.35, 3.2, -24.5), (0.35, 15.5, -3.5), (0.35, 2.4, -9.0))
    direk(p, -6.5, 15.0, 0.34, (0.35, 3.6, -15.5), (0.35, 19.0, 7.5), (0.35, 2.6, -1.8))
    flama(p, (0, 12.4, -15.5), 9.0, 0.7)
    flama(p, (0, 14.9, -6.5), 11.0, 0.8, dalga=1.0)
    flama(p, (0.35, 15.5, -3.5), 7.0, 0.5, dalga=2.0)
    flama(p, (0.35, 19.0, 7.5), 8.0, 0.55, dalga=0.5)
    # halatlar (direkten borda)
    for z, boy in ((-15.5, 12.5), (-6.5, 15.0)):
        for s in (-1, 1):
            for dz in (-1.5, 1.5):
                p.cubuk('#3a2a20', (0, boy * 0.85, z), (s * gen(z + dz) * 1.0, 0.75, z + dz), 0.025, seg=4)
    kic_kosku(p)
    ob = p.nesne(kok)
    return ob


# ---------------- liman ----------------
# Kıyı çizgisi z=0; kara +z tarafında, deniz -z tarafında. Yol x≈0'dan rıhtıma iner, gemi rıhtımın ucuna yanaşır.
TAS = '#a49c8c'
TAS_K = '#857d70'


def liman(kok):
    p = Parca('liman')
    # rıhtım: taş kaplı kenar, denize inen duvar, taş sıraları
    p.kutu(TAS, (0, -0.2, 3.0), (90, 0.5, 6.0))
    p.kutu(TAS_K, (0, -0.95, -0.05), (90, 1.6, 0.4))
    for i in range(-22, 23):
        p.kutu(koyu(TAS, 0.9) if i % 2 else TAS, (i * 2.0, 0.06, 0.4), (1.9, 0.04, 0.7))
    # babalar (gemi bağlama direkleri), yolun önü boş
    for x in (-36, -28, -20, -12, -7, 7, 12, 20, 28, 36):
        p.sil('#2a2420', (x, 0.35, 0.8), 0.6, 0.16, 0.13, seg=8)
        p.top('#2a2420', (x, 0.68, 0.8), 0.3, u=8, v=5)
    # ahşap iskele (sağda, denize uzanır)
    for z in range(0, 30, 2):
        p.kutu('#8a6a46' if z % 4 else '#7a5a3a', (13, 0.05, -1 - z), (4.0, 0.16, 1.9))
    for z in range(0, 31, 6):
        for x in (11.2, 14.8):
            p.sil('#4a3424', (x, -0.6, -1 - z), 1.6, 0.16, seg=6)
    # iskelede halat yığını, fıçılar, sandıklar, çuvallar
    for i, (x, z) in enumerate(((-9, 4), (-10.2, 4.6), (-9.6, 5.6), (9, 4.2), (10.4, 5.2), (13, -6), (12.4, -14))):
        if i % 3 == 0:
            p.sil('#7a5230', (x, 0.5, z), 0.95, 0.38, 0.42, seg=10)
            for y in (0.2, 0.8):
                p.sil('#3a3028', (x, y, z), 0.05, 0.43, seg=10)
        elif i % 3 == 1:
            p.kutu('#8a6a40', (x, 0.4, z), (0.9, 0.8, 0.9), rot=(0, 0.3 * i, 0))
            p.kutu('#5a4428', (x, 0.81, z), (0.95, 0.04, 0.95), rot=(0, 0.3 * i, 0))
        else:
            p.top('#d8c8a0', (x, 0.3, z), (0.9, 0.55, 0.7), u=8, v=5)
    # yük vinci (ahşap)
    p.cubuk('#5a4028', (16, 0.1, -4), (16, 6.0, -4), 0.18, seg=6)
    p.cubuk('#5a4028', (16, 5.6, -4), (16, 6.2, -9.5), 0.12, seg=6)
    p.cubuk('#d8c8a0', (16, 6.1, -9.2), (16, 2.0, -9.2), 0.025, seg=4)
    p.kutu('#8a6a40', (16, 1.6, -9.2), (0.8, 0.7, 0.8))
    # iki taş ambar (kiremit çatılı)
    for cx, cz, w, d in ((-22, 11, 10, 6), (24, 12, 9, 6)):
        p.kutu('#c8b89a', (cx, 2.0, cz), (w, 4.0, d))
        p.kutu(TAS_K, (cx, 0.25, cz), (w + 0.2, 0.5, d + 0.2))
        for k_ in range(3):
            x = cx - w / 2 + w * (k_ + 0.5) / 3
            p.kutu('#3a2a1a', (x, 1.5, cz - d / 2 - 0.02), (1.6, 2.6, 0.06))  # kemerli kapılar
            p.top('#3a2a1a', (x, 2.8, cz - d / 2 - 0.02), (1.6, 1.0, 0.06), u=10, v=6)
            p.top('#c8b89a', (x, 2.8, cz - d / 2 - 0.05), (1.9, 1.2, 0.02), u=10, v=6)
        A, B, C, D = (cx - w / 2 - 0.5, 4.0, cz - d / 2 - 0.5), (cx + w / 2 + 0.5, 4.0, cz - d / 2 - 0.5), (cx + w / 2 + 0.5, 4.0, cz + d / 2 + 0.5), (cx - w / 2 - 0.5, 4.0, cz + d / 2 + 0.5)
        R1, R2 = (cx - w / 2 + d / 2, 5.6, cz), (cx + w / 2 - d / 2, 5.6, cz)
        p.yuz(KIREMIT, [A, B, R2, R1]); p.yuz(KIREMIT, [C, D, R1, R2])
        p.yuz(koyu(KIREMIT, 0.9), [B, C, R2]); p.yuz(koyu(KIREMIT, 0.9), [D, A, R1])
    # fener kulesi (solda taş mendirek ucunda)
    for z in range(0, 22, 2):
        p.kutu(TAS if z % 4 else TAS_K, (-30, -0.1, -1 - z), (5.0, 0.7, 2.0))
    p.sil('#ece4d4', (-30, 5.0, -22), 10.0, 1.5, 1.1, seg=12)
    for y in (2.5, 5.0, 7.5):
        p.sil(KIRMIZI, (-30, y, -22), 0.5, 1.5 - (y / 10) * 0.42 + 0.03, seg=12)
    p.sil('#4a3a30', (-30, 10.1, -22), 0.25, 1.4, seg=12)
    p.sil('#ffd27a', (-30, 10.9, -22), 1.3, 0.75, seg=10)
    p.koni('#4a3a30', (-30, 12.0, -22), 1.0, 1.0, seg=10)
    p.top(ALTIN, (-30, 12.6, -22), 0.25, u=6, v=4, maden=True)
    alem(p, (-30, 13.2, -22), 0.35)
    # bağlı kayıklar
    for i, (x, z) in enumerate(((10.2, -8), (10.2, -18), (15.8, -12), (15.8, -24), (-26.5, -10))):
        p.kutu('#6a4426', (x, -0.1, z), (1.4, 0.45, 4.2))
        p.kutu('#8a5a34', (x, 0.14, z), (1.5, 0.06, 4.3))
        if i % 2 == 0:
            p.sil('#4a3020', (x, 1.8, z), 3.6, 0.05, seg=5)
    ob = p.nesne(kok)
    return ob


# ---------------- Osmanlı evleri ----------------
SIVA = '#efe8da'
KIRIS = '#4a3222'
KIREMIT = '#b4532f'


def kalas(p, a, b, kal=0.12, renk=KIRIS):
    p.cubuk(renk, a, b, kal * 0.6, seg=4)


def pencere(p, x, y, z, w, h, yon, kafes=False):
    """yon: 'on' (-z yüz), 'yan' (+x yüz). Koyu cam + ahşap çerçeve (+ kafes)."""
    if yon == 'on':
        p.kutu('#2a3440', (x, y, z - 0.02), (w, h, 0.04))
        p.kutu(KIRIS, (x, y + h / 2 + 0.05, z - 0.05), (w + 0.2, 0.1, 0.1))
        p.kutu(KIRIS, (x, y - h / 2 - 0.05, z - 0.06), (w + 0.25, 0.1, 0.14))
        for s in (-1, 1):
            p.kutu(KIRIS, (x + s * (w / 2 + 0.04), y, z - 0.05), (0.08, h, 0.1))
        p.kutu(KIRIS, (x, y, z - 0.05), (0.05, h, 0.06))
        if kafes:
            for i in range(1, 6):
                p.kutu('#5a3d28', (x, y - h / 2 + h * i / 6, z - 0.07), (w, 0.03, 0.03))
            for i in range(1, 4):
                p.kutu('#5a3d28', (x - w / 2 + w * i / 4, y, z - 0.07), (0.03, h, 0.03))
    else:  # yan yüz: x>0 ise +x, x<0 ise -x yüzü
        sx = 1 if x >= 0 else -1
        p.kutu('#2a3440', (x + sx * 0.02, y, z), (0.04, h, w))
        p.kutu(KIRIS, (x + sx * 0.05, y + h / 2 + 0.05, z), (0.1, 0.1, w + 0.2))
        p.kutu(KIRIS, (x + sx * 0.06, y - h / 2 - 0.05, z), (0.14, 0.1, w + 0.25))
        for s in (-1, 1):
            p.kutu(KIRIS, (x + sx * 0.05, y, z + s * (w / 2 + 0.04)), (0.1, h, 0.08))
        p.kutu(KIRIS, (x + sx * 0.05, y, z), (0.06, h, 0.05))
        if kafes:
            for i in range(1, 6):
                p.kutu('#5a3d28', (x + sx * 0.07, y - h / 2 + h * i / 6, z), (0.03, 0.03, w))


def kalcali_cati(p, cx, cz, W, D, y, h, sacak=0.8):
    """Kırma (kalçalı) kiremit çatı + saçak tahtası + kiremit sıraları."""
    w, d = W / 2 + sacak, D / 2 + sacak
    r = max(0.0, w - d)
    A, B_, C, Dd = (cx - w, y, cz - d), (cx + w, y, cz - d), (cx + w, y, cz + d), (cx - w, y, cz + d)
    R1, R2 = (cx - r, y + h, cz), (cx + r, y + h, cz)
    p.yuz(KIREMIT, [A, B_, R2, R1])
    p.yuz(KIREMIT, [C, Dd, R1, R2])
    p.yuz(koyu(KIREMIT, 0.9), [B_, C, R2])
    p.yuz(koyu(KIREMIT, 0.9), [Dd, A, R1])
    # alt yüz (saçak altı)
    p.yuz('#6a4a32', [A, Dd, C, B_])
    # kiremit sıraları (ön/arka eğimde)
    for t in (0.18, 0.36, 0.54, 0.72, 0.88):
        for s in (-1, 1):
            zz = cz + s * d * (1 - t)
            hw = w - (w - r) * t
            p.kutu(koyu(KIREMIT, 0.8), (cx, y + h * t + 0.03, zz), (hw * 2, 0.06, 0.08))
    p.cubuk('#8a3a22', R1, R2, 0.12, seg=6) if r > 0.05 else None
    # saçak tahtası
    for (a, b) in ((A, B_), (B_, C), (C, Dd), (Dd, A)):
        p.cubuk(KIRIS, (a[0], a[1] - 0.08, a[2]), (b[0], b[1] - 0.08, b[2]), 0.09, seg=4)


def osmanli_evi(kok, W=6.0, D=5.0, cikma=0.8, cumba=True, siva=SIVA, balkon=False, tek=False):
    p = Parca('ev')
    h1, h2 = 2.7, 2.6
    # taş temel
    p.kutu('#9a9284', (0, 0.25, 0), (W + 0.1, 0.5, D + 0.1))
    # zemin kat
    p.kutu(siva, (0, 0.5 + (h1 - 0.5) / 2, 0), (W, h1 - 0.5, D))
    for x in (-W / 2, W / 2):
        for z in (-D / 2, D / 2):
            p.kutu(KIRIS, (x, h1 / 2 + 0.25, z), (0.18, h1 - 0.5, 0.18))
    p.kutu(KIRIS, (0, h1, 0), (W + 0.15, 0.2, D + 0.15))  # kat kirişi
    # kapı (önde, kemerli üst)
    p.kutu('#6a4228', (-W * 0.18, 1.55, -D / 2 - 0.03), (1.1, 2.1, 0.06))
    p.kutu(KIRIS, (-W * 0.18, 2.65, -D / 2 - 0.06), (1.4, 0.18, 0.12))
    for s in (-1, 1):
        p.kutu(KIRIS, (-W * 0.18 + s * 0.62, 1.55, -D / 2 - 0.06), (0.14, 2.1, 0.12))
    p.kutu('#4a2a18', (-W * 0.18, 1.55, -D / 2 - 0.07), (0.04, 2.0, 0.02))
    p.top(ALTIN, (-W * 0.18 + 0.3, 1.5, -D / 2 - 0.08), 0.08, u=6, v=4, maden=True)
    pencere(p, W * 0.25, 1.75, -D / 2, 0.7, 0.9, 'on', kafes=True)
    pencere(p, W / 2, 1.75, 0.0, 0.7, 0.9, 'yan', kafes=True)
    pencere(p, -W / 2, 1.75, 0.6, 0.7, 0.9, 'yan', kafes=True)
    if tek:
        kalcali_cati(p, 0, 0, W, D, h1 + 0.1, 1.5, 0.7)
        p.nesne(kok)
        return
    # üst kat: önden çıkma
    z0, z1 = -D / 2 - cikma, D / 2
    ust_y = h1 + 0.1
    p.kutu(siva, (0, ust_y + h2 / 2, (z0 + z1) / 2), (W, h2, z1 - z0))
    # payandalar (çıkma altı eğik destekler)
    for x in [(-W / 2 + 0.15) + i * (W - 0.3) / 4 for i in range(5)]:
        if abs(x + W * 0.18) < 0.75:  # kapının önüne gelmesin
            x = -W * 0.18 + (0.75 if x > -W * 0.18 else -0.75)
        kalas(p, (x, h1 - 0.9, -D / 2 - 0.02), (x, ust_y, z0 + 0.12), 0.16)
        p.kutu(KIRIS, (x, ust_y - 0.05, (z0 - D / 2) / 2), (0.14, 0.12, cikma + 0.1))
    # ahşap çatkı: köşe dikmeleri, alt/üst kuşak, çaprazlar
    for x in (-W / 2, W / 2):
        for z in (z0, z1):
            p.kutu(KIRIS, (x, ust_y + h2 / 2, z), (0.16, h2, 0.16))
    for yy in (ust_y + 0.05, ust_y + h2 - 0.05):
        p.kutu(KIRIS, (0, yy, z0 - 0.02), (W + 0.12, 0.14, 0.08))
        p.kutu(KIRIS, (W / 2 + 0.02, yy, (z0 + z1) / 2), (0.08, 0.14, z1 - z0))
        p.kutu(KIRIS, (-W / 2 - 0.02, yy, (z0 + z1) / 2), (0.08, 0.14, z1 - z0))
    # üst kat pencereleri: önde sık, uzun pencereler
    n = 4
    for i in range(n):
        x = -W / 2 + W * (i + 0.5) / n
        if cumba and i == n - 1:
            continue
        pencere(p, x, ust_y + h2 * 0.5, z0, 0.62, 1.25, 'on', kafes=(i % 2 == 0))
    for z in ((z0 + z1) / 2 - 1.0, (z0 + z1) / 2 + 1.0):
        pencere(p, W / 2, ust_y + h2 * 0.5, z, 0.62, 1.25, 'yan')
        pencere(p, -W / 2, ust_y + h2 * 0.5, z, 0.62, 1.25, 'yan', kafes=True)
    # çaprazlar (pencere aralarında)
    for x in (-W / 2 + 0.05, W / 2 - 0.05):
        pass
    if cumba:  # köşede kafesli cumba
        cx, cz, cw, cd, ch = W / 2 - 0.85, z0 - 0.55, 1.7, 1.1, 2.2
        cy = ust_y + 0.25 + ch / 2
        p.kutu('#7a5236', (cx, cy, cz), (cw, ch, cd))
        p.kutu(KIRIS, (cx, cy - ch / 2 - 0.08, cz), (cw + 0.2, 0.16, cd + 0.2))
        p.kutu(KIRIS, (cx, cy + ch / 2 + 0.06, cz), (cw + 0.3, 0.12, cd + 0.3))
        # kafes yüzleri
        p.kutu('#2a2018', (cx, cy + 0.1, cz - cd / 2 - 0.01), (cw - 0.2, ch - 0.6, 0.03))
        for i in range(1, 9):
            p.kutu('#9a7048', (cx - (cw - 0.2) / 2 + (cw - 0.2) * i / 9, cy + 0.1, cz - cd / 2 - 0.03), (0.035, ch - 0.6, 0.03))
        for j in range(1, 7):
            p.kutu('#9a7048', (cx, cy + 0.1 - (ch - 0.6) / 2 + (ch - 0.6) * j / 7, cz - cd / 2 - 0.03), (cw - 0.2, 0.035, 0.03))
        p.kutu('#2a2018', (cx + cw / 2 + 0.01, cy + 0.1, cz), (0.03, ch - 0.6, cd - 0.2))
        for i in range(1, 6):
            p.kutu('#9a7048', (cx + cw / 2 + 0.03, cy + 0.1, cz - (cd - 0.2) / 2 + (cd - 0.2) * i / 6), (0.03, ch - 0.6, 0.035))
        for j in range(1, 7):
            p.kutu('#9a7048', (cx + cw / 2 + 0.03, cy + 0.1 - (ch - 0.6) / 2 + (ch - 0.6) * j / 7, cz), (0.03, 0.035, cd - 0.2))
        # cumba payandaları ve küçük çatısı
        for x in (cx - cw / 2 + 0.1, cx + cw / 2 - 0.1):
            kalas(p, (x, ust_y - 0.6, z0 + 0.05), (x, ust_y + 0.2, cz - cd / 2 + 0.05), 0.14)
        p.yuz(KIREMIT, [(cx - cw / 2 - 0.25, cy + ch / 2 + 0.12, cz - cd / 2 - 0.3), (cx + cw / 2 + 0.25, cy + ch / 2 + 0.12, cz - cd / 2 - 0.3),
                        (cx + cw / 2 + 0.25, cy + ch / 2 + 0.6, z0 + 0.05), (cx - cw / 2 - 0.25, cy + ch / 2 + 0.6, z0 + 0.05)])
    if balkon:  # yan tarafta ahşap balkon
        bx = W / 2 + 0.6
        p.kutu(KIRIS, (bx, ust_y + 0.05, 0), (1.2, 0.12, 2.6))
        for z in [-1.2 + i * 0.3 for i in range(9)]:
            p.kutu('#8a6040', (bx + 0.55, ust_y + 0.5, z), (0.05, 0.8, 0.05))
        p.kutu(KIRIS, (bx + 0.55, ust_y + 0.92, 0), (0.08, 0.08, 2.6))
        for z in (-1.25, 1.25):
            p.kutu(KIRIS, (bx, ust_y + 0.5, z), (1.2, 0.8, 0.05))
            kalas(p, (W / 2, ust_y - 0.9, z), (bx + 0.5, ust_y, z), 0.14)
    # baca
    p.kutu('#d8d0c0', (-W * 0.3, ust_y + h2 + 1.3, 0.8), (0.5, 1.6, 0.5))
    p.kutu('#9a9284', (-W * 0.3, ust_y + h2 + 2.15, 0.8), (0.7, 0.1, 0.7))
    kalcali_cati(p, 0, (z0 + z1) / 2, W, z1 - z0, ust_y + h2 + 0.05, 1.7, 0.85)
    p.nesne(kok)


def yapi_listesi():
    """(ad, kur, (kamera, hedef))"""
    return [
        ('kadirga', kadirga, [((-38, 22, -40), (0, 2, 8)), ((-42, 2.5, 4), (0, 1.5, 6)), ((-16, 6, 58), (0, 3, 40))]),
        ('liman', liman, ((-40, 18, -40), (0, 0, 0))),
        ('ev-1', lambda r: osmanli_evi(r), ((-9, 6, -12), (0, 3, 0))),
        ('ev-2', lambda r: osmanli_evi(r, W=7.5, D=5.5, cikma=1.0, cumba=False, siva='#eadcb8', balkon=True), ((-10, 6, -13), (0, 3, 0))),
        ('ev-3', lambda r: osmanli_evi(r, W=5.0, D=4.4, cikma=0.7, cumba=True, siva='#f0e2d8'), ((-8, 6, -11), (0, 3, 0))),
        ('ev-4', lambda r: osmanli_evi(r, W=5.0, D=4.0, tek=True, siva='#e8dfcc'), ((-8, 5, -10), (0, 2, 0))),
    ]
