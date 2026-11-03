"""Codifica los fotogramas PNG de Blender a WebP y escribe assets/cine/manifest.json en el repositorio.
Uso: python build_cine.py <carpeta_frames> <carpeta_destino> [calidad]"""
import json, os, subprocess, sys

src, dst = sys.argv[1], sys.argv[2]
quality = sys.argv[3] if len(sys.argv) > 3 else '84'
meta = json.load(open(os.path.join(src, 'frames.json')))
dists = meta['distances']
os.makedirs(dst, exist_ok=True)
missing = [i for i in range(len(dists)) if not os.path.exists(os.path.join(src, 'f_%04d.png' % i))]
if missing:
    sys.exit('faltan %d fotogramas, p. ej. %s' % (len(missing), missing[:5]))
ff = os.environ.get('FFMPEG', 'ffmpeg')
total = 0
for i in range(len(dists)):
    out = os.path.join(dst, 'f_%04d.webp' % i)
    subprocess.run([ff, '-y', '-loglevel', 'error', '-i', os.path.join(src, 'f_%04d.png' % i),
                    '-c:v', 'libwebp', '-quality', quality, '-compression_level', '6', '-preset', 'photo', out], check=True)
    total += os.path.getsize(out)
w, h = meta['res'][0] * 75 // 100, meta['res'][1] * 75 // 100
manifest = {
    'n': len(dists), 'd': dists, 'w': w, 'h': h, 'S': 46, 'stops': meta['stops'], 'extra': 60,
    'boardY': 12, 'boardW': 12.4, 'boardH': 5.9, 'boardZ': 1.6, 'eye': -2, 'pitch': 0.7, 'tilt': 10.0,
    'dir': 'assets/cine', 'ext': 'webp',
}
json.dump(manifest, open(os.path.join(dst, 'manifest.json'), 'w'), separators=(',', ':'))
print('fotogramas', len(dists), 'peso total', round(total / 1e6, 2), 'MB', 'tamaño', w, 'x', h)
