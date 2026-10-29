
const TECH = {
  'PHP':'Backend','MySQL':'Backend','CodeIgniter':'Backend',
  'Angular':'Frontend','JavaScript':'Frontend','HTML y CSS':'Frontend',
  'Gemini API':'IA y automatización',
  'Docker':'Herramientas','Vercel':'Herramientas','Git':'Herramientas'
};
/* Dónde tengo experiencia con cada tecnología: solo lo verificable */
const TECH_TIERS = {
  'PHP':['pro','proj'],'MySQL':['pro','proj'],'CodeIgniter':['pro'],
  'Angular':['proj'],'JavaScript':['proj'],'HTML y CSS':['pro','proj'],
  'Gemini API':['proj'],
  'Docker':['proj'],'Vercel':['proj'],'Git':['pro','proj']
};
const CATS = ['Backend','Frontend','IA y automatización'];
/* Para qué uso cada tecnología, según los proyectos reales */
const TECH_USE = {
  'PHP':'API REST y lógica de negocio de TempliMail, sin framework: autenticación JWT, cola de envíos y validaciones.',
  'MySQL':'Modelo de datos de TempliMail: usuarios, contactos, grupos, plantillas, campañas y entregas.',
  'Angular':'Interfaz de TempliMail con componentes standalone, formularios y vista previa de correos.',
  'JavaScript':'Frontend del Generador de especificaciones, sin frameworks.',
  'Gemini API':'Generar historias de usuario, criterios de aceptación y roadmap a partir de una idea.',
  'Docker':'Entorno reproducible de TempliMail: backend, base de datos y worker de envíos.',
  'Vercel':'Función serverless que llama a Gemini sin exponer la clave en el navegador.',
  'CodeIgniter':'Framework PHP de aplicaciones web de empresa en producción.',
  'HTML y CSS':'Maquetación semántica, accesible y responsive. Este portfolio está hecho a mano, sin frameworks.',
  'Git':'Control de versiones en el trabajo diario y en todos mis proyectos públicos.'
};
/* Cómo pienso: cada fase lleva una evidencia comprobable en un proyecto real */
const THINKING = [
  {
    step:'Entender', node:'Necesidad', title:'Primero, el problema.',
    text:'Antes de escribir código defino para quién es, qué tiene que conseguir y qué no. Del marketing y el diseño me traje el hábito de empezar por el usuario y el negocio.',
    inputs:['Usuario','Negocio','Requisitos'],
    evidence:'El Generador de especificaciones automatiza justo este paso: convierte una idea de producto en historias de usuario y criterios de aceptación.',
    project:'generador-especificaciones'
  },
  {
    step:'Diseñar', node:'Diseño', title:'Datos, contrato e interfaz. En ese orden.',
    text:'Modelo los datos, defino la API que los expone y después la interfaz que los usa. Así cada decisión tiene un porqué y el resto del sistema no depende de un detalle visual.',
    inputs:['Modelo de datos','API','UX'],
    evidence:'En TempliMail cada campaña guarda una copia de su contenido: si después editas la plantilla, el historial sigue mostrando lo que se envió de verdad.',
    project:'templimail'
  },
  {
    step:'Construir', node:'Ingeniería', title:'Código que otra persona pueda mantener.',
    text:'Separo responsabilidades por capas, valido en el servidor y trato los errores de forma explícita. Prefiero una solución clara a una ingeniosa.',
    inputs:['Backend','Frontend','Seguridad'],
    evidence:'TempliMail: API en PHP sin framework organizada en controladores, servicios y modelos, con autenticación JWT y frontend en Angular.',
    project:'templimail'
  },
  {
    step:'Integrar', node:'Integración', title:'Conectar servicios sin exponer nada.',
    text:'Integro APIs externas e IA donde aportan algo real, y automatizo lo repetitivo. Las claves y la lógica sensible se quedan en el servidor.',
    inputs:['APIs','IA','Automatización'],
    evidence:'El Generador llama a Gemini desde una función serverless en Vercel, así la clave nunca llega al navegador. TempliMail envía sus campañas con un worker y reintentos.',
    project:'generador-especificaciones'
  },
  {
    step:'Mejorar', node:'Valor', title:'Probar, aprender y volver a empezar.',
    text:'Un producto no se termina al desplegarlo. Pruebo los flujos críticos, corrijo con lo que enseña el uso real y priorizo lo que más valor aporta.',
    inputs:['Pruebas','Feedback','Iteración'],
    evidence:'El backend de TempliMail tiene pruebas end-to-end que recorren autenticación, permisos entre usuarios, envíos y reintentos contra un entorno Docker.',
    project:'templimail'
  }
];
/* Trayectoria: cada etapa se suma a la anterior (formación solo donde está confirmada) */
const PATH = {
  steps:[
    {
      name:'Marketing', ask:'¿Para qué sirve y qué valor aporta?',
      training:[],
      origin:'Experiencia previa',
      today:'Empiezo por el valor y el objetivo de negocio, no por la tecnología.',
      evidence:'TempliMail, mi proyecto principal, nace en ese terreno: el email marketing.'
    },
    {
      name:'Diseño', ask:'¿Quién lo va a usar?',
      training:[],
      origin:'Diseño gráfico · Experiencia previa',
      today:'Pienso primero en la persona que lo usará y cuido jerarquía, claridad y coherencia.',
      evidence:'Mientras diseñaba webs y apps me preguntaba qué había detrás. Esa pregunta me llevó al código.'
    },
    {
      name:'Código', ask:'¿Cómo lo convierto en algo que funciona?',
      training:[
        {title:'Técnico Superior en Desarrollo de Aplicaciones Web',place:'Campus Cámara Sevilla'},
        {title:'Formación en RPA',place:'Fundación Generation Spain'}
      ],
      origin:'Desarrollador Full Stack en SiOnline',
      today:'Aplicaciones reales en producción: formación bonificada, integraciones con FUNDAE y SEPE y automatización de procesos.',
      evidence:'TempliMail empezó como mi proyecto final del ciclo y sigue evolucionando.'
    },
    {
      name:'Product Engineering e IA', ask:'La pieza que faltaba: IA aplicada al desarrollo.',
      training:[
        {title:'Máster en Product Engineering con IA',place:'Evolve · en curso'}
      ],
      origin:'Formación actual',
      today:'Uso la IA como una pieza más del sistema, con sus límites, al servicio del producto.',
      evidence:'El Generador de especificaciones integra Gemini de forma segura mediante una función serverless.'
    }
  ],
  result:'Soluciones digitales que resuelven problemas reales'
};
const PROJECTS = [
  {
    slug:'templimail', title:'TempliMail', short:'TempliMail', type:'Plataforma de email marketing', context:'Proyecto personal',
    status:'En desarrollo', ok:false, cats:['Backend','Frontend'],
    summary:'Plataforma de email marketing con interfaz en Angular 19 y backend en PHP, en un entorno reproducible con Docker.',
    context_long:'Proyecto propio que nace como proyecto final del ciclo de Desarrollo de Aplicaciones Web y que sigo evolucionando para practicar producto de principio a fin.',
    problem:'Enviar comunicaciones personalizadas a una lista de contactos obliga a gestionar contactos, plantillas, envíos programados y bajas, y a saber exactamente qué recibió cada persona.',
    solution:'Una aplicación web en la que cada usuario gestiona sus contactos y grupos, diseña plantillas con variables como {{nombre}}, lanza campañas inmediatas o programadas y consulta el estado de cada entrega.',
    highlights:[
      'Modelo de datos, API, interfaz y entorno: todo el producto de principio a fin.',
      'API REST en PHP con autenticación JWT y datos aislados por usuario.',
      'Frontend en Angular 19 con componentes standalone.',
      'Entorno reproducible con Docker: backend, MySQL, worker de envíos y servidor de correo de pruebas.'
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
    statusNote:'En desarrollo. La demo online usa un backend simulado en el navegador: los datos son de ejemplo y no se envía ningún correo real.',
    diagram:[['Angular','Interfaz'],['API PHP','JWT · validación'],['MySQL','Datos por usuario'],['Worker','Cola y reintentos']],
    stack:['Angular','PHP','MySQL','Docker'],
    links:[
      { label:'Ver demo', url:'https://javigarcilop.github.io/TempliMail/' },
      { label:'Ver código en GitHub', url:'https://github.com/Javigarcilop/TempliMail' }
    ]
  },
  {
    slug:'generador-especificaciones', title:'Generador de especificaciones de producto', short:'Generador de specs', type:'Herramienta con IA', context:'Proyecto personal',
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
  }
];
