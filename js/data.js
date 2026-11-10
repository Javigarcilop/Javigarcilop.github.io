
const TECH = {
  'PHP':'Servidor','MySQL':'Servidor','CodeIgniter':'Servidor','Python':'Servidor','FastAPI':'Servidor',
  'Angular':'Frontend','JavaScript':'Frontend','HTML y CSS':'Frontend',
  'Gemini API':'IA y automatización','Claude API':'IA y automatización',
  'Docker':'Herramientas','Vercel':'Herramientas','Git':'Herramientas'
};
/* Dónde tengo experiencia con cada tecnología: solo lo verificable */
const TECH_TIERS = {
  'PHP':['pro','proj'],'MySQL':['pro','proj'],'CodeIgniter':['pro'],
  'Angular':['proj'],'JavaScript':['proj'],'HTML y CSS':['pro','proj'],
  'Gemini API':['proj'],'Claude API':['proj'],'Python':['proj'],'FastAPI':['proj'],
  'Docker':['proj'],'Vercel':['proj'],'Git':['pro','proj']
};
const CATS = ['Servidor','Frontend','IA y automatización'];
/* Para qué uso cada tecnología, según los proyectos reales */
const TECH_USE = {
  'PHP':'API REST y lógica de negocio de TempliMail, sin framework: autenticación JWT, cola de envíos y validaciones.',
  'MySQL':'Modelo de datos de TempliMail: usuarios, contactos, grupos, plantillas, campañas y entregas.',
  'Angular':'Interfaz de TempliMail con componentes standalone, formularios y vista previa de correos.',
  'JavaScript':'Frontends sin frameworks de Pauta y de Cribo.',
  'Gemini API':'Generar historias de usuario, criterios de aceptación y roadmap a partir de una idea.',
  'Docker':'Entorno reproducible de TempliMail (servidor, base de datos y worker de envíos) e imagen de despliegue de Cribo.',
  'Python':'Servidor de Cribo: lógica de triaje, límites de uso, tests con pytest y evaluación.',
  'FastAPI':'API de Cribo con validación Pydantic de entrada y salida.',
  'Claude API':'Triaje de emails con salida estructurada por herramienta forzada (tool use) y defensa ante prompt injection.',
  'Vercel':'Función serverless que llama a Gemini sin exponer la clave en el navegador.',
  'CodeIgniter':'Framework PHP de aplicaciones web de empresa en producción.',
  'HTML y CSS':'Maquetación semántica, accesible y responsive. Este portfolio está hecho a mano, sin frameworks.',
  'Git':'Control de versiones en el trabajo diario y en todos mis proyectos públicos.'
};
/* La trayectoria (antes PATH aquí) ahora vive en js/tunnel-stops.json, que carga js/tunnel.js */
const PROJECTS = [
  {
    slug:'templimail', title:'TempliMail', short:'TempliMail', type:'Plataforma de email marketing', context:'Proyecto personal',
    status:'En desarrollo', ok:false, cats:['Servidor','Frontend'],
    summary:'Plataforma de email marketing con interfaz en Angular 19 y servidor en PHP, en un entorno reproducible con Docker.',
    context_long:'Proyecto propio que nace como proyecto final del ciclo de Desarrollo de Aplicaciones Web y que sigo evolucionando para practicar producto de principio a fin.',
    problem:'Enviar comunicaciones personalizadas a una lista de contactos obliga a gestionar contactos, plantillas, envíos programados y bajas, y a saber exactamente qué recibió cada persona.',
    solution:'Una aplicación web en la que cada usuario gestiona sus contactos y grupos, diseña plantillas con variables como {{nombre}}, lanza campañas inmediatas o programadas y consulta el estado de cada entrega.',
    highlights:[
      'Modelo de datos, API, interfaz y entorno: todo el producto de principio a fin.',
      'API REST en PHP con autenticación JWT y datos aislados por usuario.',
      'Frontend en Angular 19 con componentes standalone.',
      'Entorno reproducible con Docker: PHP, MySQL, worker de envíos y servidor de correo de pruebas.'
    ],
    decisions:[
      ['PHP sin framework','Router por tabla y capas controlador, servicio y modelo: control directo sobre HTTP, autenticación y validación, sin depender de un framework.'],
      ['Envíos en cola','El navegador solo encola la campaña. Un worker la procesa en segundo plano con reintentos, y reclama cada campaña de forma atómica para no enviarla dos veces.'],
      ['Contenido congelado','Cada campaña guarda una copia del contenido enviado, así el historial no cambia si después se edita la plantilla.'],
      ['Sesiones revocables','El token lleva una versión: cerrar sesión o cambiar la contraseña invalida todas las sesiones abiertas.'],
      ['Bajas firmadas','Los enlaces de baja van firmados con HMAC y el correo incluye la cabecera estándar List-Unsubscribe.']
    ],
    challenges:[
      'Evitar envíos duplicados si dos procesos del worker coinciden en el tiempo.',
      'Impedir que un usuario acceda a datos de otro cambiando un identificador en la petición.',
      'Programar envíos sin errores de zona horaria: todo se guarda en UTC y se convierte en el navegador.'
    ],
    learnings:[
      'Lo difícil de un producto que parece sencillo está en los casos límite: reintentos, bajas, permisos y zonas horarias.',
      'Tener pruebas automáticas de los flujos críticos me da confianza para cambiar código sin miedo a romper algo.'
    ],
    statusNote:'En desarrollo. La demo online usa un servidor simulado en el navegador: los datos son de ejemplo y no se envía ningún correo real.',
    diagram:[['Angular','Interfaz'],['API PHP','JWT · validación'],['MySQL','Datos por usuario'],['Worker','Cola y reintentos']],
    stack:['Angular','PHP','MySQL','Docker'],
    links:[
      { label:'Ver demo', url:'https://javigarcilop.github.io/TempliMail/' },
      { label:'Ver código en GitHub', url:'https://github.com/Javigarcilop/TempliMail' }
    ]
  },
  {
    slug:'generador-especificaciones', title:'Pauta', short:'Pauta', type:'Generador de especificaciones con IA', context:'Proyecto personal',
    status:'En producción', ok:true, cats:['IA y automatización'],
    summary:'A partir de una idea de producto en una frase, genera historias de usuario, criterios de aceptación y un mini roadmap usando Gemini.',
    context_long:'Herramienta propia pensada para el primer paso de definición de producto, antes de que un equipo empiece a programar.',
    problem:'Pasar de una idea a requisitos con los que un equipo pueda trabajar lleva tiempo, y es fácil dejar huecos: para quién es, qué tiene que cumplir y por dónde empezar.',
    solution:'Escribes la idea en una frase y la herramienta devuelve historias de usuario, criterios de aceptación verificables y un roadmap de tres pasos.',
    highlights:[
      'Diseño y desarrollo completos de la herramienta, de la interfaz al despliegue.',
      'Frontend en HTML, CSS y JavaScript sin frameworks.',
      'Función serverless en Vercel como intermediaria con Gemini.',
      'Prompt diseñado para devolver siempre el mismo formato.'
    ],
    decisions:[
      ['Sin framework en el frontend','Es una herramienta de una sola pantalla: HTML, CSS y JavaScript bastan, y la página carga al instante.'],
      ['Clave fuera del navegador','La llamada a Gemini pasa por una función serverless. La clave vive como variable de entorno en Vercel; en el frontend la vería cualquiera.'],
      ['Formato fijo en el prompt','El prompt define rol, secciones y formato exacto de cada historia, para que la salida sea consistente en cada petición.'],
      ['Errores controlados','La función valida el método y que llegue una idea, y si la IA falla responde con un error genérico sin exponer detalles internos.']
    ],
    challenges:[
      'Conseguir que un modelo de lenguaje devuelva siempre la misma estructura.',
      'Llamar a una API de IA con clave privada desde un proyecto con el código público.'
    ],
    learnings:[
      'Con IA, la calidad del resultado depende tanto del prompt como del código: definir bien el formato es parte del diseño del producto.',
      'Una función serverless es la forma más sencilla de proteger una clave sin montar un servidor completo.'
    ],
    statusNote:'Publicada y operativa en Vercel, con el código abierto en GitHub.',
    diagram:[['Navegador','Idea en una frase'],['Función Vercel','Valida y protege la clave'],['Gemini API','Genera el texto'],['Resultado','Historias, criterios y roadmap']],
    stack:['JavaScript','Vercel','Gemini API'],
    links:[
      { label:'Ver demo', url:'https://generador-especificaciones.vercel.app' },
      { label:'Ver código en GitHub', url:'https://github.com/Javigarcilop/generador-especificaciones' }
    ]
  },
  {
    slug:'cribo', title:'Cribo', short:'Cribo', type:'Triaje de correo con IA', context:'Proyecto personal',
    status:'Demo online', ok:true, cats:['Servidor','Frontend','IA y automatización'],
    summary:'Pegas el correo de una empresa y Cribo los ordena por prioridad, extrae importes y fechas, y te deja una respuesta lista para revisar. Nada se envía sin tu aprobación.',
    context_long:'Proyecto propio para practicar IA aplicada a un problema real de negocio, con foco en salida fiable, seguridad y control humano.',
    problem:'Los equipos pequeños pierden horas decidiendo qué email atender primero y escribiendo respuestas repetitivas.',
    solution:'Claude lee cada email y devuelve un resultado estructurado: categoría, prioridad con motivo, datos clave y un borrador de respuesta. Lo dudoso se marca para revisión humana y solo lo que una persona aprueba pasa a la bandeja de salida.',
    highlights:[
      'Salida estructurada y validada con Pydantic, no texto libre.',
      'Detección de intentos de prompt injection dentro de los emails.',
      'Human-in-the-loop real: la IA solo redacta, no tiene forma de enviar.',
      'Modo demo sin IA para probar la interfaz sin gastar crédito.'
    ],
    decisions:[
      ['Herramienta forzada','El modelo está obligado a llamar a una herramienta con un esquema fijo (tool_choice), así que no puede devolver texto suelto. La respuesta se valida antes de llegar a la interfaz.'],
      ['El email es dato no fiable','El contenido va delimitado y el prompt prohíbe obedecer órdenes que vengan dentro. Si un email intenta manipular a la IA, se marca con una alerta de seguridad.'],
      ['Sin inventar datos','Solo se extrae lo que aparece literalmente en el email, y los borradores usan marcadores como [indicar fecha] en vez de prometer precios o plazos.'],
      ['Coste y abuso acotados','Límites de emails por petición, de tamaño, de peticiones por minuto y de llamadas al modelo por hora, con un modelo pequeño por defecto.']
    ],
    challenges:[
      'Que un modelo de lenguaje devuelva siempre un resultado válido y que un fallo en un email no tumbe el lote.',
      'Defenderse de instrucciones maliciosas escondidas en el propio contenido que se analiza.'
    ],
    learnings:[
      'Con IA en producción, lo importante está alrededor del modelo: validación, límites, evaluación y quién decide al final.',
      'Una evaluación con casos etiquetados, aunque sea pequeña, obliga a medir en lugar de suponer.'
    ],
    statusNote:'Demo online en modo demo (reglas locales, sin IA ni coste) con emails ficticios; la primera carga puede tardar un minuto si el servidor estaba dormido. Código público con tests y evaluación con casos etiquetados.',
    diagram:[['Interfaz','Entrada, lectura y respuesta'],['FastAPI','Límites y validación'],['Claude API','Tool use forzado'],['Persona','Revisa y aprueba']],
    stack:['Python','FastAPI','Claude API','JavaScript','Docker'],
    links:[
      { label:'Ver demo', url:'https://cribo.onrender.com' },
      { label:'Ver código en GitHub', url:'https://github.com/Javigarcilop/cribo' }
    ]
  }
];
