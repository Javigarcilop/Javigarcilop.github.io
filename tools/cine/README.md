# Túnel cine (fotogramas de Blender)

Los fotogramas de `assets/cine/` se generan con Blender 4.5 (Cycles, CPU) y se reproducen con el scroll desde `js/tunnel.js`.

1. Descarga texturas PBR (hormigón, asfalto, hierba) y un HDRI de cielo, todos CC0 de [Poly Haven](https://polyhaven.com), a una carpeta `assets/` junto a `tunnel_scene.py`.
2. Renderiza (reanudable, salta los fotogramas que ya existen):

```bash
blender -b -P tunnel_scene.py -- --out <carpeta_frames> --engine cycles --scale 75 --samples 20 --step 2.5
```

3. Codifica a WebP y genera el manifiesto en el sitio:

```bash
python build_cine.py <carpeta_frames> ../../assets/cine 92
```

`tunnel_scene.py` y `js/tunnel.js` comparten la inclinación de cámara (`pitch_for` / `pitchAt`) y las medidas de los carteles; si cambias una, cambia la otra y el manifiesto.
