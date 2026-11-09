/* Las apariciones al hacer scroll solo se activan si hay JavaScript: sin él, todo queda visible. */
document.documentElement.classList.add('js');

/* Entrada al túnel (se decide antes del primer pintado para que no haya parpadeos):
   - "in-tunnel": la cabecera se oculta mientras dura el túnel (tunnel.js la actualiza con el scroll).
   - "jg-splash": animación del logo solo en la primera visita de la sesión. Es HTML+CSS (no espera a ningún script),
     se salta con click, tecla, rueda o toque, y nunca se queda encima más de 3,2 s.
   Nada de esto ocurre con movimiento reducido, en pantallas estrechas, sin 3D o si se entra con un enlace a otra sección. */
(()=>{
  const d=document.documentElement;
  let full=false;
  try{full=innerWidth>=720&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&CSS.supports('transform-style','preserve-3d')}catch(e){}
  const deep=location.hash&&location.hash!=='#inicio';
  if(!full||deep)return;
  d.classList.add('in-tunnel');

  let first=false;
  try{first=!sessionStorage.getItem('jg-intro');if(first)sessionStorage.setItem('jg-intro','1')}catch(e){}
  if(!first)return;
  d.classList.add('jg-splash');

  const DRAW=1250;                       /* lo que tarda el logo en dibujarse y ensamblarse */
  const I=window.jgIntro={t0:performance.now(),state:'draw',cbs:[]};
  requestAnimationFrame(()=>{I.t0=performance.now()});   /* el dibujo empieza con el primer pintado */
  const ev=['pointerdown','keydown','wheel','touchstart'];
  const skip=()=>end(true);
  const end=fast=>{
    if(I.state!=='draw')return;
    I.state='out';
    ev.forEach(e=>removeEventListener(e,skip,true));
    d.classList.add(fast?'jg-splash-skip':'jg-splash-out');
    I.cbs.forEach(f=>{try{f(fast)}catch(e){}});
    setTimeout(()=>{
      I.state='done';
      d.classList.remove('jg-splash','jg-splash-out','jg-splash-skip');
      document.getElementById('jgSplash')?.remove();
    },fast?300:720);
  };
  I.onOut=f=>{if(I.state==='draw')I.cbs.push(f)};
  /* el túnel avisa cuando está listo: el logo termina de dibujarse y se funde hacia él */
  I.ready=()=>setTimeout(()=>end(false),Math.max(0,DRAW-(performance.now()-I.t0)));
  ev.forEach(e=>addEventListener(e,skip,{capture:true,passive:true}));
  setTimeout(()=>end(false),3200);       /* seguridad: si el túnel tarda o falla, la intro no se queda encima */
})();
