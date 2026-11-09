---
name: portfolio-3d-flujo
description: Flujo para mejorar la experiencia de usuario del portfolio de Javi, cuyo hero es un túnel "Del diseño al producto" en CSS 3D con scroll. Úsala cuando pida mejorar animaciones, el hero, el rendimiento, la legibilidad o la experiencia del túnel.
---

# Flujo: portfolio con túnel CSS 3D (la experiencia de usuario manda)

Sigue los pasos EN ORDEN. No pases al siguiente sin confirmar el anterior.

## Principio
La animación está al servicio del contenido, no al revés. Javi buscaba mejor experiencia de usuario, no más espectáculo: si un efecto se interpone con el texto, con los paneles o con el acceso al contenido, se descarta (ya pasó con un objeto 3D en Three.js y con shaders de AnimatedWebs).

## Estado actual (decidido, no reabrir)
- Túnel "Del diseño al producto" en CSS 3D puro (`perspective` + `preserve-3d`), scroll nativo con `position:sticky` y un bucle `requestAnimationFrame` que suaviza el progreso. Archivos: `js/tunnel.js`, `css/tunnel.css`, datos en `js/tunnel-stops.json` (trayectoria real; no reescribir sus textos).
- Descartado: Blender/fotogramas, Three.js (objeto protagonista probado y revertido: estorbaba), shaders de AnimatedWebs (Stream Convergence probado y revertido), Lenis. No proponerlos de nuevo sin que Javi lo pida.
- Identidad: Space Grotesk + JetBrains Mono; azul noche `#060C19`, azul `#74AAFF`, cian `#4CE4ED`, azul claro `#B7D4FF`. No cambiarla.
- Etapas: Marketing, Diseño, Código, Product Engineering e IA (+ "Quién soy" y "El camino"). Sin SiOnline ni referencias a proyectos de la empresa. Sin cifras ni métricas inventadas.
- "Saltar animación": botón visible y accesible dentro de `.tn-scene`, salta a `#mapa` sin animación y mueve el foco.
- Modo `calm` (móvil <720 px, `prefers-reduced-motion`, sin 3D): lista estática. Si la ventana se ensancha tras cargar estrecha, se recarga una vez.
- CV: `assets/cv-javi-garcia.pdf` (todos los "Descargar CV" apuntan ahí).
- Cámara estable: nada de balanceo, FOV dinámico ni aberración (provocan mareo).

## Paso 1 · Auditoría de UX
Haz `git fetch` y compara con `origin/main` antes: Javi también trabaja desde otro equipo. Revisa el código y la página REAL (capturas a ancho de escritorio y 390 px). Lista problemas de legibilidad, orientación, tiempo hasta el contenido, accesibilidad, lag y animaciones que no usen transform/opacity. Espera su OK.

## Paso 2 · Mejoras, una por una
Cambios pequeños y verificables; cada uno en su commit. Prioridad: legibilidad del texto > orientación (dónde estoy, cuánto falta) > rapidez para llegar al contenido > estética.

## Paso 3 · Medir (mismo banco SIEMPRE)
- Chrome headless por CDP (`--headless=new`, GPU real con `--use-angle=d3d11`, ventana 1280×800), scroll programático sobre el túnel y A/B intercalado. Rondas: 5–6; usar medianas.
- Tres escenarios: 60 Hz con CPU 1×; sin límite de vsync (`--disable-gpu-vsync --disable-frame-rate-limit`) con CPU 1×; 60 Hz con `Emulation.setCPUThrottlingRate` 4×.
- Cronometrar con un envoltorio de `requestAnimationFrame` el callback `frame` del túnel y registrar deltas entre frames.
- El panel Browser de la app puede limitarse a 30 fps o cargar a 0×0 (queda en `calm`): no fiarse de él para tiempos; mostrarlo con `mcp__ccd_view__show_pane`.
- Criterio: si algo empeora más de ~1 ms de media entre frames, simplificar o descartar. Informar con honestidad si no se aprecia diferencia.

## Paso 4 · Revisión final
Móvil, `prefers-reduced-motion`, enlace "Saltar animación", teclado, fallback sin 3D, `?v=` actualizado en `index.html` para CSS/JS cambiados, y que funcione en GitHub Pages.

## Reglas siempre
- Commits separados por mejora. No hacer push: lo hace Javi y avisa.
- Si falta un asset, decir qué se necesita antes de inventarlo.
- Cambiar el `?v=` de los archivos modificados en `index.html`.
- Respuestas cortas, sin explicaciones innecesarias.
