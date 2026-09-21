
const TECH = {
  'PHP':'Backend','CodeIgniter':'Backend','MySQL':'Backend',
  'Angular':'Frontend','React':'Frontend','HTML y CSS':'Frontend',
  'Gemini API':'IA y automatización','Make.com':'IA y automatización','Remotion':'IA y automatización','Prompt engineering':'IA y automatización','YouTube Data API':'IA y automatización',
  'Docker':'Herramientas','Git':'Herramientas','ffmpeg':'Herramientas','Plesk':'Herramientas','Google Workspace':'Herramientas',
  'Diseño de marca':'Diseño','SVG':'Diseño'
};
const CATS = ['Backend','Frontend','IA y automatización','Diseño'];
const PROJECTS = [
  {
    slug:'canalformaciontv', title:'Canalformación TV', short:'Canalformación', type:'Plataforma web', context:'SiOnline Multiservicios',
    status:'En producción', ok:true, cats:['Backend','IA y automatización'],
    summary:'Plataforma de gestión de formación bonificada (FUNDAE y Tripartita), con un flujo para convertir sesiones grabadas en clips por temas.',
    highlights:[
      'Aplicación en PHP y MySQL con arquitectura MVC sobre CodeIgniter.',
      'Prompt de segmentación temática: a partir de transcripciones .vtt genera bloques completos con tiempos (HH:MM:SS.mmm) y un título por bloque.',
      'Corte de clips con ffmpeg y nombrado sistemático (AFO_fecha_número) según el orden de los bloques de cada sesión.'
    ],
    stack:['PHP','MySQL','CodeIgniter','ffmpeg','Prompt engineering']
  },
  {
    slug:'seguimientosoap', title:'Seguimiento SOAP', short:'Seguimiento SOAP', type:'Servicio web', context:'SiOnline Multiservicios',
    status:'En producción', ok:true, cats:['Backend','Diseño'],
    summary:'Servicio de URL de seguimiento SOAP orientado al cumplimiento con el SEPE, con sus páginas de aterrizaje responsive.',
    highlights:[
      'Landing pages responsive para el servicio, con la identidad corporativa de SiOnline.',
      'Depuración del login del panel de administración en CodeIgniter 4: conflictos de sesión y un error crítico de mayúsculas en getMethod().',
      'Corrección de CSS y de problemas de despliegue por FTP en sionline.es.',
      'Diseño de piezas de marca: portada de Facebook y maqueta de cabecera.'
    ],
    stack:['PHP','CodeIgniter','HTML y CSS','Diseño de marca']
  },
  {
    slug:'socios-aformae', title:'Socios AFORMAE', short:'Socios AFORMAE', type:'Módulo de gestión', context:'AFORMAE (socios.aformae.es)',
    status:'En producción', ok:true, cats:['Backend'],
    summary:'Módulo de gestión de socios para AFORMAE, construido sobre CodeIgniter 4.',
    highlights:[
      'Arquitectura MVC y rutas de la aplicación en CodeIgniter 4.',
      'Flujo de acceso al panel de administración.',
      'Creación de usuarios y permisos en la base de datos.',
      'Despliegue con Git y Plesk.'
    ],
    stack:['PHP','CodeIgniter','MySQL','Git','Plesk']
  },
  {
    slug:'templimail', title:'TempliMail', short:'TempliMail', type:'Plataforma de email marketing', context:'Proyecto personal',
    status:'En desarrollo', ok:false, cats:['Backend','Frontend'],
    summary:'Plataforma de email marketing con interfaz en Angular 19 y backend en PHP, en un entorno reproducible con Docker.',
    highlights:[
      'Frontend en Angular 19 y API en PHP con base de datos MySQL.',
      'Entorno de desarrollo completo con docker-compose: backend, MySQL y phpMyAdmin.',
      'Proyecto propio para practicar producto de principio a fin.'
    ],
    stack:['Angular','PHP','MySQL','Docker']
  },
  {
    slug:'cv-adapter', title:'Adaptador de CV para LinkedIn', short:'Adaptador de CV', type:'Automatización', context:'Proyecto personal',
    status:'En pruebas', ok:false, cats:['IA y automatización'],
    summary:'Automatización que adapta mi CV a cada oferta de LinkedIn usando IA.',
    highlights:[
      'Escenario en Make.com que conecta Google Sheets, Gemini y Google Docs.',
      'Gemini reescribe el CV según la oferta y el resultado queda en un documento listo para enviar.',
      'Ahora mismo afino los disparadores del flujo.'
    ],
    stack:['Make.com','Gemini API','Google Workspace']
  },
  {
    slug:'canal-ia', title:'Canal de YouTube sobre IA', short:'Canal de IA', type:'Producción automatizada', context:'Proyecto personal',
    status:'En construcción', ok:false, cats:['IA y automatización','Frontend'],
    summary:'Canal que explica tecnología e IA a un público general, con un proceso de producción de vídeo automatizado y sin coste recurrente.',
    highlights:[
      'Guion dividido en escenas, generado con la API de Gemini.',
      'Voz grabada por mí y animación programada con Remotion (React).',
      'Subida automática con la API de datos de YouTube.',
      'Todo el proceso funciona con herramientas gratuitas.'
    ],
    stack:['Gemini API','Remotion','React','YouTube Data API']
  },
  {
    slug:'marca-personal', title:'Marca personal Javi García', short:'Marca personal', type:'Identidad visual', context:'Proyecto personal',
    status:'Publicado', ok:true, cats:['Diseño'],
    summary:'Identidad visual completa: monograma, paleta, tipografía, banner de LinkedIn y manual de marca.',
    highlights:[
      'Monograma JG en trazo con un único nodo, en versiones para fondo claro, azul y una tinta.',
      'Paleta en azul y cian con tipografía Geist, definidas en un manual de identidad.',
      'Banner de LinkedIn y este portfolio, construidos con el mismo sistema.'
    ],
    stack:['Diseño de marca','SVG','HTML y CSS']
  }
];
