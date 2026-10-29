---
name: creative-header
description: Experta en animaciones fluidas a 60 fps para el hero de un portfolio. Usar al crear o modificar fondos animados con GSAP y Canvas 2D/WebGL, efectos de escáner láser, paralaje magnético y la transformación de formas de diseño en flujos de datos y código backend. Cubre aceleración por hardware, rendimiento móvil, reduced-motion y accesibilidad.
---

# creative-header

Skill para diseñar e implementar la animación de fondo del hero del portfolio de Javier García (perfil híbrido: diseño gráfico y marketing → desarrollo web full stack → IA aplicada).

## Concepto: el decodificador

Una línea de escáner láser barre el hero. Delante de ella hay formas de diseño gráfico (círculos, cuadrados, triángulos, anillos, curvas bézier con sus tiradores, muestras de color). Al pasar la línea, cada forma **muta** en un token de código backend (`{ }`, `</>`, `200`, `JWT`, `SQL`, `POST`…) y detrás de la línea aparecen flujos de datos abstractos (hex, 0/1) que fluyen en carriles. La pasada de vuelta revierte el proceso: código → diseño.
Mensaje: *lo que diseñé sigue ahí, convertido en lo que construyo ahora*. Es una metáfora sutil: fondo, no protagonista.

## Stack y dependencias

- GSAP 3 (+ ScrollTrigger si hace falta) **alojado en el repo** (`assets/vendor/`), con `defer`. No usar CDN: el sitio no tiene build, ya hay versión fijada y se evita una dependencia de terceros en tiempo de carga.
- Canvas 2D por defecto. WebGL solo si el efecto lo exige de verdad (shaders, miles de partículas); 2D basta para decenas de elementos.
- Sin frameworks, sin build. Código en un archivo propio (`js/creative-hero.js`) cargado con `defer`.

## Reglas de rendimiento (obligatorias)

1. **Solo `transform` y `opacity`** en CSS animado. Nada de animar `top/left/width/height/box-shadow/filter` a 60 fps.
2. **Un único bucle de render**: `gsap.ticker.add(fn)`. Prohibido crear `requestAnimationFrame` paralelos. GSAP interpola el estado (`scan`, `px`, `py`); el ticker solo dibuja.
3. **Aceleración por hardware**: el `<canvas>` va en su propia capa con `will-change: transform` y `transform: translate3d(0,0,0)`. Poner `will-change` **solo** en elementos que se animan de verdad y retirarlo si dejan de hacerlo; nunca en decenas de elementos.
4. **Cero lecturas de layout en el bucle** (`getBoundingClientRect`, `offsetWidth`…). Medir en `ResizeObserver`/scroll pasivo y guardar en variables.
5. **Canvas**: tamaño del buffer = tamaño CSS × `devicePixelRatio` **limitado** (máx. 2 en escritorio, 1.5 en móvil). Redimensionar solo desde `ResizeObserver`, nunca en cada fotograma. Evitar `shadowBlur` y `filter` en el contexto (muy caros): simular brillos con degradados y alfa.
6. **Evitar asignaciones en el bucle**: sin crear arrays/objetos/strings por fotograma. Precalcular posiciones normalizadas (0–1) y reutilizarlas.
7. **Pausar lo invisible**: `IntersectionObserver` sobre el hero; si no se ve, pausar timeline y dejar de dibujar. Al cambiar de pestaña, el ticker de GSAP ya se detiene.
8. `gsap.quickTo` para seguir el ratón (suavizado sin crear tweens nuevos por evento).

## Móvil

- Detectar con `matchMedia('(pointer: coarse)')`. En táctil: menos elementos (≈ 20), menos carriles de datos, **sin** paralaje de ratón, DPR ≤ 1.5 y dibujo a ~30 fps (saltar fotogramas alternos).
- El fondo nunca puede restar legibilidad: bajar la opacidad global en pantallas estrechas (el texto ocupa todo el ancho).
- Ningún `touchmove`/`pointermove` que bloquee el scroll; listeners siempre `{passive:true}`.

## Accesibilidad y SEO

- El `<h1>` conserva su texto real (puede dividirse en `<span>` para animar, pero con `aria-label` con el nombre completo). La animación nunca sustituye ni oculta texto.
- El canvas es decorativo: `aria-hidden="true"`, `pointer-events: none`, sin foco. No debe interceptar clics de botones, navegación ni redes.
- `prefers-reduced-motion: reduce` → **sin** timeline, sin parallax y sin bucle: se pinta un único fotograma estático (escaneo a mitad) y se redibuja solo en resize o cambio de tema.
- Contraste: el cian solo en formas, brillos y la línea de escaneo; **nunca en texto**. El texto de código usa el azul de texto del tema, con opacidad baja. Respetar tema claro/oscuro leyendo las variables CSS (`--blue`, `--cyan`, `--blue-text`) y releyéndolas al cambiar `data-theme` o `prefers-color-scheme`.
- Sin fondos negros: el canvas se dibuja sobre el fondo del tema, nunca lo sustituye.

## Receta del escáner

```
const state = { scan: -0.04, px: 0, py: 0 };         // todo normalizado
gsap.timeline({ delay: 1.1, repeat: -1, repeatDelay: 5, yoyo: true,
                defaults: { ease: 'power2.inOut' } })
    .to(state, { scan: 1.04, duration: 3.4 });       // ida: diseño → código; vuelta: código → diseño
// mutación de cada elemento i:  m = smoothstep(scan - x_i, 0, banda)
```

- La mutación depende solo de la posición del escáner respecto a la `x` del elemento: ida y vuelta son simétricas sin código extra.
- Dibujo: forma con alfa `(1 − m)` (escala y giro leves) + token con alfa `m`. Dentro de la banda del escáner, pequeño destello/jitter.
- Estela: degradado horizontal detrás de la línea (según el sentido del movimiento).

## Paralaje magnético

- Cada elemento tiene una profundidad `d ∈ [0.2, 1]`. Desplazamiento = `(ratón − centro) × k × d`, con `k` ≈ 24–30 px.
- Magnetismo: dentro de un radio (~150 px) del cursor, el elemento se acerca hasta ~14 px con caída cuadrática; interpolar (`lerp` ≈ 0.12) para que se sienta con inercia.
- Solo con puntero fino y sin reduced-motion.

## Checklist de verificación

- [ ] `<h1>` con texto real y `aria-label` completo; el DOM contiene el nombre.
- [ ] Canvas con `aria-hidden`, `pointer-events:none`; los botones del hero y del header responden.
- [ ] Sin scroll horizontal a 320 px; sin errores en consola.
- [ ] Reduced-motion: un solo fotograma, sin bucle.
- [ ] Móvil: menos elementos, sin parallax, ~30 fps.
- [ ] Pausa al salir del hero (el ticker deja de dibujar).
- [ ] Tema claro y oscuro legibles; cian solo en formas.

## Variante implementada: viaje por la trayectoria (Three.js + ScrollTrigger)

Versión actual del hero (`js/tunnel.js`, escena en `.tunnel`). Sustituye al fondo Canvas 2D del escáner y a una primera versión de glifos de colores que cansaba la vista.

- **Idea**: un pasillo de marcos que recorre las etapas de `PATH` (Marketing → Diseño → Código → Product Engineering e IA → resultado). Cada etapa es un portal con su nombre y su pregunta; los marcos pasan de gris azulado a azul y a cian.
- **Información útil sin tapar el túnel**: cada portal lleva el título arriba y dos tarjetas de cristal (formación y trabajo / se nota hoy) a los lados; el centro queda libre para ver la profundidad. En vertical se apilan. Las tarjetas se dibujan en texturas 2D (texto nítido, 1024 px de ancho) y se reconstruyen si cambia la orientación.
- **Scroll**: no usar `scroll-behavior: smooth` en CSS junto a ScrollTrigger (rompe el recálculo cuando la página está desplazada); el desplazamiento suave de los enlaces se hace con `scrollTo({behavior:'smooth'})` desde JavaScript.
- **Paleta contenida**: un fondo #0d0f12, líneas finas con alfa bajo y mezcla aditiva suave; un solo tono para el polvo de glifos, sin parpadeo ni colores saturados superpuestos. Evitar verdes/índigos de relleno, destellos y brillo aditivo alto: dañan la lectura y fatigan.
- **Pocas draw calls**: un `LineSegments` (marcos y guías), un `Points` (≈1000 glifos tenues) y un plano por etiqueta (texto en `CanvasTexture`).
- **Cámara por paradas**: avanza con un ease suave y se detiene a 14 unidades de cada portal, de modo que cada etiqueta se lee. La opacidad de cada etiqueta depende de la distancia.
- **Carga diferida**: Three.js (`assets/vendor/three.module.min.js`) se importa con `import()` tras `load` + `requestIdleCallback`.
- **Guion del scroll**: `.tunnel` mide 520 svh con un hijo `position: sticky`; un timeline con `scrollTrigger` (`scrub`) mueve la cámara, acerca y desvanece el título y funde el fondo hacia la web. `ST.config({ignoreMobileResize:true})` evita recálculos por la barra del navegador.
- **Degradado**: sin WebGL, sin GSAP, con `prefers-reduced-motion` o `saveData` queda `.tunnel.calm` (100 svh, texto legible sobre #0d0f12); con reduced-motion se pinta un único fotograma.
- **Cabecera**: mientras `body.on-tunnel`, la cabecera usa colores claros sobre el fondo oscuro.
- **Limpieza**: `window.tunnelScene.destroy()` (también en `pagehide` y al perder el contexto): para el ticker, desconecta observadores, mata el ScrollTrigger y hace `dispose()` de geometrías, materiales, texturas y renderer.
- **Móvil**: menos polvo, DPR ≤ 1.5, ~30 fps, FOV mayor en vertical, etiquetas escaladas al ancho visible y sin giro de cámara por ratón.
