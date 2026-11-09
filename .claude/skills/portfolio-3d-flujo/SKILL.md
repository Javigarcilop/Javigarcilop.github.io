---
name: portfolio-3d-flujo
description: Flujo para mejorar el portfolio de Javi, cuyo hero es un túnel 3D por scroll hecho en CSS 3D. Úsala cuando pida mejorar animaciones, el hero, el rendimiento o el realismo/creatividad del túnel.
---

# Flujo: portfolio con túnel CSS 3D

Sigue los pasos EN ORDEN. No pases al siguiente sin confirmar el anterior.

## Estado actual (decidido, no reabrir)
- El túnel "Del diseño al producto" es CSS 3D puro (`perspective` + `preserve-3d`), scroll nativo con `position:sticky` y un bucle `requestAnimationFrame` que suaviza el progreso. Archivos: `js/tunnel.js`, `css/tunnel.css`, datos en `js/tunnel-stops.json` (trayectoria real).
- Dos cámaras: `.tn-cam` (tubo de fondo con anillos y pantallas decorativas) y `.tn-cam.front` (paradas reales en HTML, sobre la niebla).
- Fallback sin 3D / `prefers-reduced-motion` / móvil <720px: lista vertical estática (`.tn-section.calm`, `#tunnelFallback`).
- SIN Blender ni fotogramas, SIN Three.js (eliminados), SIN Lenis. Three.js solo podría volver como un salto futuro de realismo, y únicamente si Javi lo pide y se mide antes.
- Tipografía: Space Grotesk (texto) + JetBrains Mono (etiquetas y datos). Identidad azul noche con acento cian; no cambiarla.
- Etapas: Marketing, Diseño, Código, Product Engineering e IA (+ "Quién soy" y "El camino"). Sin hito de SiOnline ni referencias a proyectos de la empresa.
- Enlace "Saltar animación": botón visible (ratón y táctil) dentro de `.tn-scene`, primer enfocable de la sección, salta a `#mapa` sin animación (`data-jump`) y mueve el foco.
- Cámara estable: nada de balanceo, FOV dinámico ni aberración (provocan mareo).

## Paso 1 · Auditoría
Revisa el código ACTUAL (haz `git fetch` y compara con `origin/main` antes: Javi también trabaja desde otro equipo). Lista lag, animaciones que no usen transform/opacity y qué se conserva. Muéstramelo y espera mi OK.

## Paso 2 · Estilo
Usa la skill de estilo (animatedwebs-style) solo para proponer la paleta; no cambiar la identidad. Tipografía ya fijada.

## Paso 3 · Rendimiento del túnel
Una mejora cada vez, midiendo ANTES y DESPUÉS con el mismo protocolo:
- Panel Browser visible (`mcp__ccd_view__show_pane` con `preview`); oculto mide 0×0 y se cierra. Scripts de menos de ~10 s por llamada.
- Instalar un envoltorio de `requestAnimationFrame` que cronometre el callback `frame` del túnel y un bucle que registre los deltas de frame mientras se hace scroll programático (p. ej. de 5 % a 55 % del recorrido). Mínimo 2 pasadas; la primera suele salir mejor.
- Comparar A/B intercalado en la misma sesión cuando el cambio sea CSS (inyectar/quitar un `<style>`).
- Informar con honestidad si no se aprecia diferencia.
Reglas: solo `transform` y `opacity` en el bucle; sin leer geometría (`offsetLeft`, `clientWidth`…) dentro del bucle; sin `backdrop-filter` sobre el túnel; pausar fuera de pantalla.

## Paso 4 · Etapas
Cada etapa: su panel real en HTML, luz propia y texto que se revela al llegar, sin reescribir los textos de `tunnel-stops.json`.

## Paso 5 · Realismo y creatividad (sin perder rendimiento)
Capas baratas primero: profundidad con niebla y viñeta, parallax mínimo del puntero con inercia, luz que reacciona al progreso. Cualquier salto caro (Three.js, vídeo, shaders) se propone, se mide y espera OK.

## Paso 6 · Resto de la web
Mismo lenguaje visual en Proyectos (mapa de nodos con física), Stack y Contacto.

## Paso 7 · Revisión final
Móvil, `prefers-reduced-motion`, enlace "Saltar animación", teclado, fallback sin 3D y que funcione en GitHub Pages.

## Reglas siempre
- Cambios pequeños y verificables; commits separados por mejora.
- No hacer push: lo hace Javi y avisa. Commitear solo cuando lo pida.
- Si falta un asset, decir qué se necesita antes de inventarlo.
- Respuestas cortas, sin explicaciones innecesarias.
