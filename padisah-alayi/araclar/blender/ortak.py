# Ortak yardımcılar: Blender'da low-poly parça üretimi (oyun koordinatlarında) ve GLB dışa aktarma.
# Oyun (three.js) koordinatları: x sağ, y yukarı, -z ileri. Blender: x sağ, y ileri(-z oyun), z yukarı.
# Her parça tek mesh + köşe renkleri (Col) → az çizim çağrısı, doku dosyası yok.
import bpy, bmesh, math, os
from mathutils import Matrix, Vector, Euler

PI = math.pi
B4 = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # oyun → blender
B4i = B4.inverted()


def P(x, y, z):  # oyun noktası → blender
    return Vector((x, -z, y))


def gm(loc=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1)):
    """Oyun uzayında T·R·S matrisi → blender uzayına çevrilmiş hali."""
    Mg = Matrix.Translation(Vector(loc)) @ Euler(rot, 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((*scl, 1.0))
    return B4 @ Mg @ B4i


def grot(rot):  # oyun euler → blender euler (nesne dönüşü için)
    return (B4 @ Euler(rot, 'XYZ').to_matrix().to_4x4() @ B4i).to_euler('XYZ')


def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def renk(h):
    h = h.lstrip('#')
    return tuple(_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def koyu(h, k=0.75):
    h = h.lstrip('#')
    return '#' + ''.join('%02x' % int(int(h[i:i + 2], 16) * k) for i in (0, 2, 4))


class Parca:
    """Tek mesh nesne. Konumlar pivot'a göre (oyun koordinatı)."""

    def __init__(s, ad, pivot=(0, 0, 0), rot=(0, 0, 0)):
        s.ad, s.pivot, s.rot = ad, pivot, rot
        s.bm = bmesh.new()
        s.cl = s.bm.loops.layers.float_color.new('Col')
        s.maden = False

    def _boya(s, verts, h, maden=False):
        c = renk(h)
        for f in {f for v in verts for f in v.link_faces}:
            for l in f.loops:
                l[s.cl] = c
            f.material_index = 1 if maden else 0
        if maden:
            s.maden = True

    def kutu(s, h, loc, scl, rot=(0, 0, 0), maden=False):
        r = bmesh.ops.create_cube(s.bm, size=1.0, matrix=gm(loc, rot, scl))
        s._boya(r['verts'], h, maden)

    def sil(s, h, loc, boy, r1, r2=None, seg=10, rot=(0, 0, 0), scl=(1, 1, 1), maden=False):
        r2 = r1 if r2 is None else r2
        r = bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=seg,
                                  radius1=r1, radius2=max(r2, 0.0005), depth=boy, matrix=gm(loc, rot, scl))
        s._boya(r['verts'], h, maden)

    def koni(s, h, loc, boy, r, seg=8, rot=(0, 0, 0), scl=(1, 1, 1), maden=False):
        s.sil(h, loc, boy, r, 0.0005, seg, rot, scl, maden)

    def top(s, h, loc, scl, rot=(0, 0, 0), u=12, v=8, maden=False):
        if not isinstance(scl, (tuple, list)):
            scl = (scl, scl, scl)
        r = bmesh.ops.create_uvsphere(s.bm, u_segments=u, v_segments=v, radius=0.5, matrix=gm(loc, rot, scl))
        s._boya(r['verts'], h, maden)

    def cubuk(s, h, p1, p2, r1, r2=None, seg=6, maden=False):
        """p1→p2 arası silindir (oyun koordinatı)."""
        a, b = P(*p1), P(*p2)
        d = b - a
        q = d.to_track_quat('Z', 'Y')
        M = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
        r2 = r1 if r2 is None else r2
        r = bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=seg,
                                  radius1=r1, radius2=max(r2, 0.0005), depth=d.length, matrix=M)
        s._boya(r['verts'], h, maden)

    def yuz(s, h, pts, maden=False):
        """Oyun koordinatlı noktalardan tek çokgen (iki yüzlü malzeme ile görünür)."""
        vs = [s.bm.verts.new(P(*p)) for p in pts]
        f = s.bm.faces.new(vs)
        s._boya(vs, h, maden)
        return f

    def izgara(s, pts_fn, nu, nv, renk_fn, maden=False):
        """pts_fn(u,v)→oyun noktası; renk_fn(i,j)→hex. nu×nv dörtgen ızgara."""
        V = [[s.bm.verts.new(P(*pts_fn(i / nu, j / nv))) for j in range(nv + 1)] for i in range(nu + 1)]
        for i in range(nu):
            for j in range(nv):
                f = s.bm.faces.new((V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]))
                c = renk(renk_fn(i, j))
                for l in f.loops:
                    l[s.cl] = c
                f.material_index = 1 if maden else 0
        return V

    def nesne(s, parent=None):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts, dist=0.00001)
        me = bpy.data.meshes.new(s.ad)
        s.bm.to_mesh(me)
        s.bm.free()
        for p in me.polygons:
            p.use_smooth = False
        try:
            me.color_attributes.active_color = me.color_attributes['Col']
            me.color_attributes.render_color_index = me.color_attributes.active_color_index
        except Exception:
            pass
        me.materials.append(MAT()['boya'])
        if s.maden:
            me.materials.append(MAT()['maden'])
        ob = bpy.data.objects.new(s.ad, me)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = parent
        ob.location = P(*s.pivot)
        ob.rotation_euler = grot(s.rot)
        return ob


def bos(ad, parent=None, loc=(0, 0, 0)):
    ob = bpy.data.objects.new(ad, None)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    ob.location = P(*loc)
    return ob


_M = {}


def MAT():
    if 'boya' in _M and _M['boya'].name in bpy.data.materials:
        return _M
    for ad, metal, puruz in (('boya', 0.0, 0.8), ('maden', 0.75, 0.32)):
        m = bpy.data.materials.new(ad)
        try:
            m.use_nodes = True
        except Exception:
            pass
        nt = m.node_tree
        bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
        vc = nt.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Col'
        nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Metallic'].default_value = metal
        bsdf.inputs['Roughness'].default_value = puruz
        m.use_backface_culling = False
        _M[ad] = m
    return _M


def temizle():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _M.clear()


def disa_aktar(yol):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    kw = dict(filepath=yol, export_format='GLB', export_yup=True, export_apply=True,
              export_animations=False, export_materials='EXPORT', export_extras=False)
    try:
        bpy.ops.export_scene.gltf(**kw, export_vertex_color='MATERIAL')
    except TypeError:
        bpy.ops.export_scene.gltf(**kw)
    print('[glb]', yol, os.path.getsize(yol), 'bayt')


def onizle(yol, kamera_loc, hedef, boyut=(640, 640), ortho=None):
    """Workbench ile köşe renkli hızlı önizleme (oyun koordinatı kamera)."""
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading
    sh.light = 'STUDIO'
    sh.color_type = 'VERTEX'
    sh.show_shadows = True
    sh.show_cavity = False
    sc.render.resolution_x, sc.render.resolution_y = boyut
    sc.render.film_transparent = False
    sc.world = sc.world or bpy.data.worlds.new('dunya')
    cam_d = bpy.data.cameras.new('kam')
    if ortho:
        cam_d.type = 'ORTHO'
        cam_d.ortho_scale = ortho
    cam = bpy.data.objects.new('kam', cam_d)
    sc.collection.objects.link(cam)
    cam.location = P(*kamera_loc)
    d = P(*hedef) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    sc.render.filepath = yol
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)
