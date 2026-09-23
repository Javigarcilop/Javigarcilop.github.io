
const TECH = {
  'PHP':'Backend','MySQL':'Backend',
  'Angular':'Frontend','JavaScript':'Frontend',
  'Gemini API':'IA y automatización',
  'Docker':'Herramientas','Vercel':'Herramientas'
};
const CATS = ['Backend','Frontend','IA y automatización'];
const PROJECTS = [
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
    slug:'generador-especificaciones', title:'Generador de especificaciones de producto', short:'Generador de specs', type:'Herramienta con IA', context:'Proyecto personal',
    status:'En producción', ok:true, cats:['IA y automatización'],
    summary:'A partir de una idea de producto en una frase, genera historias de usuario, criterios de aceptación y un mini roadmap usando Gemini.',
    highlights:[
      'Frontend en HTML/CSS/JS puro.',
      'Función serverless en Vercel que esconde la clave de la API de Gemini.',
      'Prompt diseñado para devolver un formato estructurado y consistente.'
    ],
    stack:['JavaScript','Vercel','Gemini API'],
    links:[
      { label:'Ver demo', url:'https://generador-especificaciones.vercel.app' },
      { label:'Ver código en GitHub', url:'https://github.com/Javigarcilop/generador-especificaciones' }
    ]
  }
];
