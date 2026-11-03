"""Escena del túnel de carretera para renderizar el viaje del hero.
Uso:  blender -b -P tunnel_scene.py -- --out DIR --engine cycles|eevee [--frames a-b] [--test N] [--scale 100]
Convención: +Y = hacia delante (el túnel va de y=-30 a y=220), +Z = arriba, cámara a z=-2 (el eje del túnel es z=0)."""
import bpy, bmesh, math, json, sys, os, random
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def opt(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'assets')
OUT = opt('--out', os.path.join(HERE, 'frames'))
ENGINE = opt('--engine', 'cycles')
SCALE = int(opt('--scale', '100'))
os.makedirs(OUT, exist_ok=True)
random.seed(7)

R, TEND, ROAD, EYE, S, SEG = 7.0, 220.0, -3.6, -2.0, 46.0, 5
RW = 11.6
DTOT = 300.0            # distancia total recorrida por la cámara
RES = (1280, 720)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- utilidades de materiales ----------
def img(path, colorspace='sRGB'):
    im = bpy.data.images.load(path)
    im.colorspace_settings.name = colorspace
    return im

def pbr(name, prefix, scale_xy, tint=(1, 1, 1, 1), normal_strength=1.0, rough_mul=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    uv = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (scale_xy[0], scale_xy[1], 1)
    nt.links.new(uv.outputs['UV'], mp.inputs['Vector'])
    def tex(file, cs):
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img(os.path.join(ASSETS, file), cs)
        n.projection = 'FLAT'; n.extension = 'REPEAT'
        nt.links.new(mp.outputs['Vector'], n.inputs['Vector']); return n
    d = tex(prefix + '_diff.jpg', 'sRGB'); r = tex(prefix + '_rough.jpg', 'Non-Color'); n = tex(prefix + '_nor.jpg', 'Non-Color')
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1
    mix.inputs['B'].default_value = tint
    nt.links.new(d.outputs['Color'], mix.inputs['A']); nt.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    rm = nt.nodes.new('ShaderNodeMath'); rm.operation = 'MULTIPLY'; rm.inputs[1].default_value = rough_mul
    nt.links.new(r.outputs['Color'], rm.inputs[0]); nt.links.new(rm.outputs['Value'], bsdf.inputs['Roughness'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = normal_strength
    nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return m

def emit(name, color, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = color; e.inputs['Strength'].default_value = strength
    nt.links.new(e.outputs['Emission'], out.inputs['Surface']); return m

def solid(name, color, rough=.5, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    return m

def box(name, loc, size, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = size; o.data.materials.append(mat); return o

# ---------- mundo: cielo HDRI real + una neblina muy ligera ----------
w = bpy.data.worlds.new('Mundo'); scene.world = w; w.use_nodes = True
wn = w.node_tree; wn.nodes.clear()
wo = wn.nodes.new('ShaderNodeOutputWorld'); bg = wn.nodes.new('ShaderNodeBackground')
et = wn.nodes.new('ShaderNodeTexEnvironment'); et.image = bpy.data.images.load(os.path.join(ASSETS, 'sky.hdr'))
tc = wn.nodes.new('ShaderNodeTexCoord'); mp = wn.nodes.new('ShaderNodeMapping')
mp.inputs['Rotation'].default_value = (0, 0, math.radians(float(opt('--hdri-rot', '90'))))
wn.links.new(tc.outputs['Generated'], mp.inputs['Vector']); wn.links.new(mp.outputs['Vector'], et.inputs['Vector'])
wn.links.new(et.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.0
wn.links.new(bg.outputs['Background'], wo.inputs['Surface'])

# ---------- materiales ----------
concrete = pbr('Hormigon', 'concrete', (11, 62), tint=(.82, .84, .9, 1), normal_strength=1.2)
concrete_facade = pbr('HormigonFachada', 'concrete', (28, 12), tint=(1, 1, 1, 1))
asphalt = pbr('Asfalto', 'asphalt', (RW / 4, 700 / 4), tint=(.7, .72, .76, 1), rough_mul=.9)
grass = pbr('Hierba', 'grass', (240, 240), tint=(.85, .95, .8, 1))
white_paint = solid('PinturaBlanca', (.85, .86, .9, 1), .6)
yellow_paint = solid('PinturaAmarilla', (.9, .72, .15, 1), .6)
metal = solid('Metal', (.65, .68, .74, 1), .38, .9)
dark_metal = solid('MetalOscuro', (.06, .07, .09, 1), .5, .7)
lamp_em = emit('Lampara', (1, .95, .88, 1), 28.0)
board_em = emit('Cartel', (.03, .055, .11, 1), .5)
edge_em = emit('CartelBorde', (.45, .65, 1, 1), 6.0)
exit_em = emit('Salida', (.1, 1, .45, 1), 5.0)
amber_em = emit('Ambar', (1, .55, .1, 1), 8.0)
white_em = emit('BlancoCat', (1, 1, 1, 1), 8.0)

# ---------- túnel (tubo visto por dentro) ----------
LT = TEND + 30
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=R, depth=LT, end_fill_type='NOTHING', location=(0, (TEND - 30) / 2, 0), rotation=(math.pi / 2, 0, 0))
tube = bpy.context.active_object; tube.name = 'Tunel'
bm = bmesh.new(); bm.from_mesh(tube.data); bmesh.ops.reverse_faces(bm, faces=bm.faces)
bm.to_mesh(tube.data); bm.free(); bpy.ops.object.shade_smooth()
tube.data.materials.append(concrete)

# carretera
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 335, ROAD)); road = bpy.context.active_object; road.name = 'Carretera'
road.scale = (RW, 730, 1); road.data.materials.append(asphalt)
# líneas viales: bordes continuos y eje discontinuo
for sx in (-1, 1):
    box('Borde%d' % sx, (sx * (RW / 2 - .25), 335, ROAD + .01), (.16, 730, .004), white_paint)
for i in range(0, 120):
    y = -30 + i * 6.0
    box('Eje%d' % i, (0, y + 1.5, ROAD + .01), (.14, 2.4, .004), yellow_paint)

# lámparas: cuerpo emisivo y luz de área real
lamp_x = 2.5; lamp_z = math.sqrt(R * R - lamp_x * lamp_x) - .25
y = -6.0
n = 0
while y < TEND - 6:
    for sx in (-1, 1):
        box('Lamp', (sx * lamp_x, y, lamp_z), (.55, 3.4, .14), lamp_em)
    if n % 2 == 0:
        ld = bpy.data.lights.new('Area%d' % n, 'AREA'); ld.shape = 'RECTANGLE'; ld.size = 6.5; ld.size_y = 1.4
        ld.energy = float(opt('--lamp-energy', '3600')); ld.color = (1, .94, .86)
        lo = bpy.data.objects.new('Area%d' % n, ld); lo.location = (0, y + 6, lamp_z - .3); scene.collection.objects.link(lo)
    y += 12.0; n += 1

# ventiladores, salidas de emergencia y nichos
for yy in range(40, int(TEND) - 30, 70):
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.82, depth=3.4, location=(sx * 2.9, yy, 5.2), rotation=(math.pi / 2, 0, 0))
        f = bpy.context.active_object; f.data.materials.append(metal); bpy.ops.object.shade_smooth()
for k in range(0, SEG - 1):
    for dy in (22, 34):
        yy = k * S + dy
        box('Nicho', (6.82, yy, -.1), (.2, 2.4, 2.3), dark_metal)
        box('Salida', (6.7, yy - .2, .9), (.05, 1.7, 1.0), exit_em)

# catadióptricos
for i in range(0, 190):
    yy = -10 + i * 4.0
    box('CatW', (-(RW / 2 - .12), yy, ROAD + .03), (.14, .22, .05), white_em)
    box('CatA', ((RW / 2 - .12), yy, ROAD + .03), (.14, .22, .05), amber_em)

# ---------- fachada con la abertura y exterior ----------
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, TEND + 2, 6)); fac = bpy.context.active_object; fac.name = 'Fachada'
fac.scale = (150, 4, 60); fac.data.materials.append(concrete_facade)
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=R + .02, depth=10, location=(0, TEND + 2, 0), rotation=(math.pi / 2, 0, 0)); cut = bpy.context.active_object
bm = fac.modifiers.new('Hueco', 'BOOLEAN'); bm.operation = 'DIFFERENCE'; bm.object = cut; bm.solver = 'EXACT'
bpy.context.view_layer.objects.active = fac; bpy.ops.object.modifier_apply(modifier='Hueco'); bpy.data.objects.remove(cut)

bpy.ops.mesh.primitive_plane_add(size=1, location=(0, TEND + 1500, ROAD - .12)); gr = bpy.context.active_object; gr.name = 'Terreno'
gr.scale = (3200, 3000, 1); gr.data.materials.append(grass)
# quitamiedos
for sx in (-1, 1):
    box('Carril', (sx * (RW / 2 + 1.5), TEND + 350, ROAD + .75), (.12, 700, .3), metal)
for i in range(0, 170):
    yy = TEND + 6 + i * 4.0
    for sx in (-1, 1):
        box('Poste', (sx * (RW / 2 + 1.5), yy, ROAD + .38), (.14, .14, .9), metal)

# ---------- carteles de las etapas ----------
BW, BH, BCY = 12.4, 5.9, 1.6
boards = {}
for k in range(1, SEG + 1):
    yb = k * S + 12
    p = box('Cartel%d' % k, (0, yb, BCY), (BW, .22, BH), board_em)
    for (dx, dz, sx_, sz_) in [(0, BH / 2, BW, .1), (0, -BH / 2, BW, .1), (-BW / 2, 0, .1, BH), (BW / 2, 0, .1, BH)]:
        box('Borde', (dx, yb - .13, BCY + dz), (sx_, .06, sz_), edge_em)
    box('Marco%d' % k, (0, yb + .1, BCY), (BW + .5, .3, BH + .5), dark_metal)
    if k < SEG:
        top = BCY + BH / 2 + .25; ceil = math.sqrt(R * R - 25) - .1
        for sx in (-1, 1):
            box('Varilla', (sx * 4.9, yb, (top + ceil) / 2), (.14, .14, max(.4, ceil - top)), dark_metal)
    else:
        top = BCY + BH / 2 + .25
        for sx in (-1, 1):
            box('Poste', (sx * (BW / 2 + .45), yb, (top + ROAD) / 2), (.34, .34, top - ROAD), dark_metal)
    boards[k] = p
    # número pintado en el asfalto
    cv = bpy.data.curves.new('Num%d' % k, 'FONT'); cv.body = '0%d' % k; cv.size = 3.0; cv.align_x = 'CENTER'; cv.align_y = 'CENTER'
    to = bpy.data.objects.new('Num%d' % k, cv); to.location = (0, k * S + 7, ROAD + .02); to.data.materials.append(white_paint)
    scene.collection.objects.link(to)

# ---------- cámara ----------
cam_data = bpy.data.cameras.new('Camara'); cam_data.lens = 24; cam_data.sensor_width = 36
cam = bpy.data.objects.new('Camara', cam_data); scene.collection.objects.link(cam); scene.camera = cam
cam.rotation_euler = (math.radians(90.7), 0, 0)
cam_data.dof.use_dof = False

# distancias de los fotogramas: rejilla uniforme + paradas exactas
STEP = float(opt('--step', '1.6'))
dists = sorted(set([round(i * STEP, 3) for i in range(int(DTOT / STEP) + 1)] + [S * k for k in range(0, SEG + 1)]))
json.dump({'distances': dists, 'stops': [S * k for k in range(1, SEG + 1)], 'res': RES}, open(os.path.join(OUT, 'frames.json'), 'w'))

# ---------- render ----------
scene.render.resolution_x, scene.render.resolution_y = RES; scene.render.resolution_percentage = SCALE
scene.render.image_settings.file_format = 'PNG'
if ENGINE == 'eevee':
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 32
    try:
        scene.eevee.use_raytracing = True
    except Exception:
        pass
else:
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = int(opt('--samples', '48')); scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
    scene.cycles.max_bounces = 5
    scene.cycles.sample_clamp_indirect = 3.0; scene.cycles.sample_clamp_direct = 20.0
    scene.cycles.caustics_reflective = False; scene.cycles.caustics_refractive = False
    scene.cycles.use_adaptive_sampling = True; scene.cycles.adaptive_threshold = .02
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'None'
    scene.render.threads_mode = 'AUTO'
if ENGINE == 'eevee':
    scene.view_settings.view_transform = 'AgX'
scene.render.use_motion_blur = False

# resplandor cinematográfico (compositor): las zonas muy brillantes, como la salida, sangran luz
scene.use_nodes = True
cn = scene.node_tree; cn.nodes.clear()
rl = cn.nodes.new('CompositorNodeRLayers'); gl = cn.nodes.new('CompositorNodeGlare'); co = cn.nodes.new('CompositorNodeComposite')
gl.glare_type = 'FOG_GLOW'; gl.quality = 'MEDIUM'; gl.threshold = 1.2; gl.size = 7; gl.mix = -0.55
cn.links.new(rl.outputs['Image'], gl.inputs['Image']); cn.links.new(gl.outputs['Image'], co.inputs['Image'])

def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def pitch_for(d):
    # plano de cine: al acercarse a cada cartel la cámara se inclina hacia arriba para encuadrarlo entero (idéntico en tunnel.js)
    yb = None
    for k in range(1, SEG + 1):
        if k * S + 12 - d > 0:
            yb = k * S + 12 - d; break
    if yb is None: return 0.7
    return 0.7 + 10.0 * smooth(22, 12, yb) * (1 - smooth(6, 0, yb))
def exposure_for(d):
    # el ojo se adapta: oscuro dentro del túnel (más exposición) y luminoso fuera (menos)
    return 0.9 * (1 - smooth(150, 245, d)) - 0.35 * smooth(150, 245, d)

# rectángulo de cada cartel en pantalla, en la parada correspondiente (para alinear el texto HTML)
rects = {}
for k, p in boards.items():
    cam.location = (0, S * k, EYE); bpy.context.view_layer.update()
    xs, ys = [], []
    for sx in (-.5, .5):
        for sz in (-.5, .5):
            wp = p.matrix_world @ Vector((sx, -.5, sz))
            c = world_to_camera_view(scene, cam, wp); xs.append(c.x); ys.append(c.y)
    rects[k] = [min(xs), 1 - max(ys), max(xs), 1 - min(ys)]
meta = json.load(open(os.path.join(OUT, 'frames.json'))); meta['boards'] = rects
json.dump(meta, open(os.path.join(OUT, 'frames.json'), 'w'))

test = opt('--test')
frames = range(len(dists))
if test is not None:
    frames = [int(test)]
elif opt('--frames'):
    a, b = [int(v) for v in opt('--frames').split('-')]
    frames = range(a, b + 1)
import time
for i in frames:
    path = os.path.join(OUT, 'f_%04d.png' % i)
    if os.path.exists(path) and test is None:
        continue
    cam.location = (0, dists[i], EYE)
    cam.rotation_euler = (math.radians(90 + pitch_for(dists[i])), 0, 0)
    scene.view_settings.exposure = exposure_for(dists[i])
    scene.render.filepath = path
    t = time.time(); bpy.ops.render.render(write_still=True)
    print('FOTOGRAMA', i, 'dist', dists[i], 'seg', round(time.time() - t, 1), flush=True)
