/* Las apariciones al hacer scroll solo se activan si hay JavaScript: sin él, todo queda visible. */
document.documentElement.classList.add('js');

/* Entrada al túnel (se decide antes del primer pintado para que no haya parpadeos):
   - "in-tunnel": la cabecera se oculta mientras dura el túnel (tunnel.js la actualiza con el scroll).
   Nada de esto ocurre con movimiento reducido, en pantallas estrechas, sin 3D o si se entra con un enlace a otra sección. */
(()=>{
  const d=document.documentElement;
  let full=false;
  try{full=innerWidth>=720&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&CSS.supports('transform-style','preserve-3d')}catch(e){}
  const deep=location.hash&&location.hash!=='#inicio';
  if(!full||deep)return;
  d.classList.add('in-tunnel');

})();
