---
name: portfolio-3d-flujo
description: Flujo para mejorar el portfolio de Javi: túnel CSS 3D de fondo y un objeto 3D protagonista (pantalla de capas) hecho con Three.js que se transforma con el scroll. Úsala cuando pida mejorar animaciones, el hero, el rendimiento, el realismo o la creatividad del túnel o del objeto.
---

# Flujo: túnel CSS 3D + objeto protagonista en Three.js

Sigue los pasos EN ORDEN. No pases al siguiente sin confirmar el anterior.

## Estado y decisiones (ya tomadas, no reabrir)
- **Fondo:** túnel "Del diseño al producto" en CSS 3D puro (`perspective` + `preserve-3d`), scroll nativo con `position:sticky` y un bucle `requestAnimationFrame` que suaviza el progreso. Archivos: `js/tunnel.js`, `css/tunnel.css`, datos en `js/tunnel-stops.json` (trayectoria real; no reescribir sus textos).
- **Protagonista:** una pantalla de producto en capas, generada EN CÓDIGO con Three.js r169 (`js/tunnel-object.js`), en un canvas transparente entre el túnel y los paneles HTML. Transformación con el scroll: wireframe → UI con color → capas explosionadas con código → producto final (cristal, bisel de aluminio, reflejos y giro). El prototipo cubre wireframe, barrido de escáner (plano de recorte) y producto final; faltan UI con color y capas de código.
- **Three.js:** vendorizado en `assets/vendor/three.module.min.js` (671 KB, recuperado del historial de git), cargado en diferido (`import()` en reposo) SOLO en modo completo y sin ahorro de datos. Sin CDN ni npm.
- **Blender NO es la vía principal.** Solo plan B (GLB con las capas como nodos) si el realismo del objeto en código no convence. No hay GLB gratuito adecuado (Poly Haven solo tiene dispositivos vintage).
- **Sin Lenis.** Sin shaders de AnimatedWebs (Stream Convergence se probó y se revirtió).
- **Móvil / degradación:** móvil estrecho (<720 px), `prefers-reduced-motion`, ahorro de datos o conexión 2G → modo `calm`: lista estática + póster WebP del producto final, SIN Three.js. Sin WebGL o contexto perdido → el mismo póster; el túnel CSS sigue. Pestaña oculta o fuera de pantalla → sin render.
- **Identidad:** Space Grotesk + JetBrains Mono; azul noche `#060C19`, azul `#74AAFF`, cian `#4CE4ED`, azul claro `#B7D4FF`. No cambiarla. Sin cifras ni métricas inventadas en la UI del objeto.
- Etapas: Marketing, Diseño, Código, Product Engineering e IA (+ "Quién soy" y "El camino"). Sin SiOnline ni referencias a proyectos de la empresa.
- Enlace "Saltar animación" visible y accesible dentro de `.tn-scene`.
- Cámara estable: nada de balanceo, FOV dinámico ni aberración (provocan mareo). El cursor solo inclina el objeto unos grados con inercia.

## Paso 1 · Auditoría
Haz `git fetch` y compara con `origin/main` antes: Javi también trabaja desde otro equipo. Revisa el código ACTUAL y lista lag, animaciones que no usen transform/opacity y qué se conserva. Espera su OK.

## Paso 2 · Objeto: fases
Una fase cada vez y enseñar capturas/vídeo antes de seguir: (1) wireframe, (2) UI con color, (3) capas explosionadas con código, (4) producto final. Las paradas centrales (`El camino`, salida) atenúan el objeto para no tapar el texto. Fases ligadas a `tunnel-stops.json`.

## Paso 3 · Medir (mismo banco SIEMPRE)
- Chrome headless por CDP (`--headless=new`, GPU real con `--use-angle=d3d11`, ventana 1280×800), scroll programático sobre el rango donde actúa el objeto (≈0,40–0,95) y A/B intercalado con `window.tunnelScene.object.setEnabled(false|true)`. Rondas: 5–6; usar medianas.
- Tres escenarios: 60 Hz con CPU 1×; sin límite de vsync (`--disable-gpu-vsync --disable-frame-rate-limit`) con CPU 1×; 60 Hz con `Emulation.setCPUThrottlingRate` 4×.
- Cronometrar con un envoltorio de `requestAnimationFrame` el callback `frame` del túnel (el render del objeto va dentro) y registrar deltas entre frames.
- El panel Browser de la app puede limitarse a 30 fps o cargar a 0×0 (queda en `calm`): no fiarse de él para tiempos.
- Criterio: si el objeto empeora más de ~1 ms de media entre frames, simplificar o descartar. Informar con honestidad si hay frames largos extra.

## Paso 4 · Degradación
Póster WebP generado una vez desde la propia escena (canal alfa), mostrado en `calm`, sin WebGL, ahorro de datos y móvil. Comprobar `prefers-reduced-motion`, 390 px, teclado y que no haya scroll horizontal.

## Paso 5 · Resto de la web
Mismo lenguaje visual en Proyectos (mapa de nodos con física), Stack y Contacto.

## Paso 6 · Revisión final
Móvil, `prefers-reduced-motion`, enlace "Saltar animación", teclado, fallback sin 3D, `?v=` actualizado en `index.html` para CSS/JS cambiados, y que funcione en GitHub Pages.

## Reglas siempre
- Cambios pequeños y verificables; commits separados por mejora.
- No hacer push: lo hace Javi y avisa. Commitear solo cuando lo pida.
- Si falta un asset 3D, decir qué se necesita antes de inventarlo.
- Cambiar el `?v=` de los archivos modificados en `index.html` y en los `import()`.
- Respuestas cortas, sin explicaciones innecesarias.
