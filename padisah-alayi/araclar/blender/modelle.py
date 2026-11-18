# Kullanım (Blender 4.2+):
#   blender -b --factory-startup --python araclar/blender/modelle.py -- [ad_filtresi] [--onizle]
# Çıktı: padisah-alayi/modeller/*.glb  (önizlemeler: araclar/blender/onizleme/*.png)
import sys, os
BURA = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BURA)
import importlib
import ortak, figurler, yapilar
for m in (ortak, figurler, yapilar):
    importlib.reload(m)
from ortak import temizle, bos, disa_aktar, onizle

arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ONIZLE = '--onizle' in arg
FILTRE = [a for a in arg if not a.startswith('--')]
CIKTI = os.path.normpath(os.path.join(BURA, '..', '..', 'modeller'))
ONIZ = os.path.join(BURA, 'onizleme')

isler = figurler.figur_listesi() + yapilar.yapi_listesi()
for ad, kur, *kam in isler:
    if FILTRE and not any(ad.startswith(f) for f in FILTRE):
        continue
    temizle()
    kok = bos(ad)
    kur(kok)
    disa_aktar(os.path.join(CIKTI, ad + '.glb'))
    if ONIZLE:
        k = kam[0] if kam else None
        if k is None:
            atli = ad.startswith(('padisah', 'ibrahim', 'sipahi'))
            k = ((-3.4, 2.8, -4.8), (0, 1.7, 0)) if atli else ((-2.6, 2.6, -4.4), (0, 1.5, 0))
        onizle(os.path.join(ONIZ, ad + '.png'), k[0], k[1])
