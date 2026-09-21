# Portfolio de Javi García

Portfolio interactivo con mapa de red de proyectos y tecnologías. HTML, CSS y JavaScript puros: sin build, sin dependencias y sin frameworks.

## Estructura

```
portfolio-javi-garcia/
├── index.html          Estructura de la página y textos fijos (hero, sobre mí, contacto)
├── css/styles.css      Estilos, colores (variables CSS) y modo claro/oscuro
├── js/
│   ├── data.js         DATOS: proyectos, tecnologías y categorías (aquí editas casi todo)
│   ├── app.js          Lógica: filtros, tarjetas, mapa de red, detalle, tema
│   └── theme-init.js   Aplica el tema guardado antes de pintar (evita parpadeos)
└── assets/favicon.svg  Icono con el monograma JG
```

## Cómo abrirlo

- **Rápido:** haz doble clic en `index.html`.
- **Recomendado para trabajar:** sirve la carpeta con un servidor local para que todo se comporte como en producción.
  - VS Code: extensión *Live Server*, clic derecho en `index.html` → *Open with Live Server*.
  - Con Python: `python3 -m http.server 8000` dentro de la carpeta y abre `http://localhost:8000`.

## Editar proyectos

Todo está en `js/data.js`. Cada proyecto es un objeto de la lista `PROJECTS`:

```js
{
  slug: 'mi-proyecto',            // identificador único, sin espacios ni tildes (va en la URL #p=mi-proyecto)
  title: 'Mi proyecto',           // título en tarjeta y detalle
  short: 'Mi proyecto',           // nombre corto para el mapa
  type: 'Plataforma web',         // tipo de proyecto
  context: 'Proyecto personal',   // dónde o para quién
  status: 'En desarrollo',        // texto del estado
  ok: false,                      // true = punto verde (terminado o en producción)
  cats: ['Backend','Frontend'],   // categorías para los filtros (deben estar en CATS)
  summary: 'Una o dos frases.',   // resumen de la tarjeta
  highlights: ['Qué hice 1', 'Qué hice 2'],
  stack: ['PHP','MySQL'],         // tecnologías: deben existir en TECH
  links: [{ label: 'Ver demo', url: 'https://…' }]   // opcional
}
```

- El **mapa de red** se genera solo a partir de `stack`: al añadir un proyecto aparece un nodo nuevo unido a sus tecnologías.
- Para **añadir una tecnología**, agrégala en `TECH` con su grupo: `'Vue':'Frontend'`.
- Para **añadir una categoría de filtro**, agrégala en `CATS` y úsala en `cats` de los proyectos.

## Cambiar el aspecto

- **Colores:** variables CSS al inicio de `css/styles.css` (`--blue`, `--ink`, `--cyan`, `--bg`…). Hay un bloque para el modo claro y otro para el oscuro.
- **Tipografía:** Geist, cargada desde Google Fonts en `index.html`. Si la cambias, actualiza también `--font` en el CSS.
- **Textos fijos** (titular, sobre mí, contacto, enlace de LinkedIn): directamente en `index.html`.

## Publicarlo

Es una web estática: sube la carpeta tal cual.

- **Netlify:** arrastra la carpeta a app.netlify.com/drop.
- **GitHub Pages:** sube la carpeta a un repositorio y activa Pages en *Settings → Pages*.
- **Plesk o FTP:** sube el contenido de la carpeta a la raíz del dominio.

## Antes de publicarlo

- Confirma que puedes mostrar públicamente los proyectos de clientes o de tu empresa y con qué nivel de detalle.
- Añade enlaces (`links`) y cifras reales de resultado cuando las tengas.
- Añade un correo o formulario de contacto si quieres otra vía además de LinkedIn.
