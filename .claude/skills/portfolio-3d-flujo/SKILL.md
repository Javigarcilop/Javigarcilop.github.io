---
name: portfolio-3d-flujo
description: Flujo para llevar el portfolio de Javi a una experiencia inmersiva de nivel award con el túnel "Del diseño al producto" en CSS 3D como primera pantalla. Úsala cuando pida mejorar animaciones, la entrada, la navegación, el cursor, el rendimiento o el realismo del túnel.
---

# Flujo: portfolio inmersivo con túnel CSS 3D

Trabaja por fases, EN ORDEN. Al final de cada fase para y enseña capturas o vídeo y números antes de seguir.

## Identidad y decisiones (no reabrir)
- Primera pantalla: SOLO el túnel "Del diseño al producto" en CSS 3D (`js/tunnel.js`, `css/tunnel.css`, datos en `js/tunnel-stops.json`; no reescribir sus textos). Sin header ni nav típico dentro del túnel.
- Identidad: fondo `#060C19`, azul `#74AAFF`, cian `#4CE4ED`, azul claro `#B7D4FF`; Space Grotesk + JetBrains Mono. Logo: `assets/logo-javigarcilop-symbol.svg` (no quitarlo del túnel).
- Etapas: Marketing, Diseño, Código, Product Engineering e IA. Sin referencias a proyectos de la empresa (SiOnline). Sin cifras inventadas.
- La UX manda: si un efecto estorba al texto o al acceso al contenido, se descarta. Cámara estable (sin balanceo, FOV dinámico ni aberración).
- Descartados ya: fotogramas de Blender como vía principal, shaders de AnimatedWebs, Lenis.

## Fase 1 · Fluidez — HECHA
Barra de la timeline con `scaleX` y geometría en caché; sin `backdrop-filter` sobre el túnel ni la cabecera (fondo 97 % opaco); GSAP/ScrollTrigger sin uso fuera de la carga; `tunnel-stops.json` precargado.

## Fase 2 · Entrada y control
1. HECHO: sin cabecera en el túnel (`html.in-tunnel`, vuelve al salir). Esquinas: logo (arriba izq.), CV / Contacto (arriba dcha.), "Saltar animación" (abajo dcha., lleva a `#mapa` sin animación y mueve el foco).
2. HECHO: intro del logo (HTML+CSS en el documento, `html.jg-splash`, capa `.jg-splash-layer`): se ensambla en ~1,25 s y se funde hacia el túnel, que avanza hasta su sitio. Una vez por sesión (`sessionStorage` `jg-intro`), saltable con click/tecla/rueda/toque, máx. 3,2 s. OJO: `app.js` ya usa la clase `intro` en `<html>` para el titular; no reutilizarla.
3. Indicador de progreso de las 4 etapas integrado en la escena, clicable, con la actual resaltada. "Desliza" desaparece al empezar el scroll.
4. Al salir del túnel, nav mínimo con transición: Proyectos, Stack, Hablemos, CV.
5. Flechas/espacio, orden de tabulación lógico, foco visible, nunca bloquear el scroll nativo.

## Fase 3 · Cursor creativo (solo escritorio con puntero fino)
Punto + anillo con inercia; en el túnel, retícula cian con lectura mínima en JetBrains Mono (etapa); sobre enlaces/botones el anillo se expande con etiqueta ("saltar", "ver", "CV"); en el mapa, "arrastrar". Estela muy sutil, botones magnéticos. Solo transform/opacity y un único rAF; cursor nativo de respaldo; desactivado en táctil, `prefers-reduced-motion` y calm.

## Fase 4 · Ritmo y respuesta
Ajuste suave que centre cada parada sin forzar; textos con entrada escalonada; parallax del ratón con inercia.

## Fase 5 · Objeto protagonista (solo si lo anterior está bien)
Pantalla de capas con Three.js SOLO para el objeto (wireframe → UI con color → capas explosionadas con código → producto final con cristal y giro), vendorizado y en diferido. Primero prototipo de wireframe y fase final; enseñarlo. Plan B: GLB de Blender. Un primer intento se revirtió porque estorbaba al texto: nunca debe solaparse con paneles ni texto. Móvil estrecho, ahorro de datos, calm, reduced-motion o sin WebGL: póster WebP estático.

## Medir (mismo banco SIEMPRE)
- Chrome headless por CDP (`--headless=new`, GPU real `--use-angle=d3d11`, 1280×800). A/B de dos URLs (antes en un worktree de git servido en otro puerto) o con un interruptor en la página, rondas intercaladas, medianas.
- Escenarios: 60 Hz CPU 1×; sin vsync (`--disable-gpu-vsync --disable-frame-rate-limit`); 60 Hz con `Emulation.setCPUThrottlingRate` 4×. Carga: red 4G lenta + CPU 4× (FCP, LCP, DCL, tareas largas).
- Envoltorio de `requestAnimationFrame` que cronometra el callback `frame` del túnel; deltas entre frames.
- El panel Browser de la app puede ir a 30 fps o cargar a 0×0: no usarlo para tiempos.
- Criterio: si algo empeora más de ~1 ms de media entre frames, simplificar o descartar.

## Reglas siempre
- Cambios pequeños, commits separados, sin push (lo hace Javi).
- Actualizar el `?v=` de los CSS/JS cambiados en `index.html`.
- Se apaga todo con `prefers-reduced-motion`, calm, móvil estrecho y sin WebGL.
- Si falta un asset o una decisión de Javi, preguntar antes de inventar.
- Respuestas cortas.
