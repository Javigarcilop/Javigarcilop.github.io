/* Cursor creativo (solo escritorio con puntero fino).
   - Punto que sigue al ratón al instante y anillo con inercia.
   - En el túnel: retícula cian con la etapa actual en JetBrains Mono.
   - Sobre enlaces y botones: el anillo se expande y muestra una etiqueta ("saltar", "CV", "contacto", "ver", "ir"…).
   - En el mapa de proyectos: "arrastrar" (y "ver" sobre un nodo).
   - Estela cian muy sutil y botones con efecto magnético.
   Solo transform/opacity y un único requestAnimationFrame, que se detiene cuando todo está quieto.
   El cursor nativo se oculta solo cuando este está activo; en táctil, con movimiento reducido o en pantallas estrechas
   (modo calm del túnel) no se activa y se queda el nativo. */
(()=>{
  const fine=matchMedia('(pointer: fine)').matches&&matchMedia('(hover: hover)').matches;
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches||innerWidth<720;
  if(!fine||calm)return;

  const d=document.documentElement;
  let off=false;
  const root=document.createElement('div');root.className='jc';root.setAttribute('aria-hidden','true');
  root.innerHTML='<div class="jc-trail"></div><div class="jc-ring"><i class="jc-tick t"></i><i class="jc-tick r"></i><i class="jc-tick b"></i><i class="jc-tick l"></i><div class="jc-label"></div></div><div class="jc-dot"></div>';
  const trailBox=root.querySelector('.jc-trail'),ring=root.querySelector('.jc-ring'),dot=root.querySelector('.jc-dot'),label=root.querySelector('.jc-label');
  const TRAIL=3,trail=[];
  for(let i=0;i<TRAIL;i++){const t=document.createElement('i');t.style.opacity=(.26*(1-i/TRAIL)).toFixed(3);trailBox.appendChild(t);trail.push({el:t,x:-100,y:-100})}
  document.body.appendChild(root);
  d.classList.add('has-jc');

  /* ---------- etiqueta según el contexto ---------- */
  const stageName=()=>{
    const b=document.querySelector('#tnTimeline button[aria-current="true"]');
    return b?b.textContent.trim():'';
  };
  const labelFor=el=>{
    if(!el)return '';
    if(el.dataset.cursor)return el.dataset.cursor;
    if(el.classList.contains('skip-tunnel'))return 'saltar';
    const href=el.getAttribute('href')||'';
    if(/\.pdf$/i.test(href))return 'CV';
    if(href==='#contacto'||href.startsWith('mailto:'))return 'contacto';
    if(el.closest('#tnTimeline'))return 'ir';
    if(href.startsWith('http'))return 'abrir';
    return 'ver';
  };
  let mode='',text='';
  const setState=(m,t)=>{
    if(m!==mode){root.classList.remove('is-'+mode);mode=m;if(m)root.classList.add('is-'+m)}
    if(t!==text){text=t;label.textContent=t;root.classList.toggle('has-label',!!t)}
  };
  let hoverEl=null,overMap=false,overNode=false,pressed=false;
  const refresh=()=>{
    if(hoverEl)setState('link',labelFor(hoverEl));
    else if(overMap)setState(overNode?'link':'map',overNode?'ver':(pressed?'':'arrastrar'));
    else if(d.classList.contains('in-tunnel'))setState('tunnel',stageName());
    else setState('','');
  };

  /* ---------- puntero ---------- */
  let x=-100,y=-100,rx=-100,ry=-100,raf=0,visible=false;
  const INTERACTIVE='a[href],button,[role="button"],input[type="submit"],summary,label[for]';
  addEventListener('pointermove',e=>{
    if(off||(e.pointerType&&e.pointerType!=='mouse'))return;
    x=e.clientX;y=e.clientY;
    if(!visible){visible=true;root.classList.add('on');rx=x;ry=y;trail.forEach(t=>{t.x=x;t.y=y})}
    const t=e.target instanceof Element?e.target:null;
    const h=t?t.closest(INTERACTIVE):null;
    const map=t?t.closest('#map'):null;
    const node=map&&t.closest('.node');
    if(h!==hoverEl||!!map!==overMap||!!node!==overNode){hoverEl=h;overMap=!!map;overNode=!!node;refresh()}
    magnet(h,e);
    if(!raf)raf=requestAnimationFrame(loop);
  },{passive:true});
  addEventListener('pointerdown',()=>{pressed=true;root.classList.add('down');refresh()},{passive:true});
  addEventListener('pointerup',()=>{pressed=false;root.classList.remove('down');refresh()},{passive:true});
  d.addEventListener('pointerleave',()=>{visible=false;root.classList.remove('on')});
  addEventListener('blur',()=>{visible=false;root.classList.remove('on')});
  /* la etapa del túnel y el paso dentro/fuera del túnel cambian sin mover el ratón */
  const mo=new MutationObserver(()=>{if(!hoverEl&&!overMap)refresh()});
  mo.observe(d,{attributes:true,attributeFilter:['class']});
  const tl=document.getElementById('tnTimeline');
  if(tl)mo.observe(tl,{attributes:true,subtree:true,attributeFilter:['aria-current']});

  /* ---------- botones magnéticos (propiedad translate: no pisa los transform de cada botón) ---------- */
  const MAG='.btn,.skip-tunnel,.tn-corner a';
  let magEl=null,magR=null;
  function magnet(h,e){
    const el=h&&h.matches(MAG)?h:null;
    if(magEl&&magEl!==el){magEl.style.translate='';magEl.classList.remove('jc-mag');magEl=null}
    if(!el)return;
    if(el!==magEl)magR=el.getBoundingClientRect();     /* se mide una vez al entrar, no en cada movimiento */
    const r=magR;
    const dx=(e.clientX-(r.left+r.width/2))*.22,dy=(e.clientY-(r.top+r.height/2))*.3;
    el.classList.add('jc-mag');el.style.translate=Math.max(-8,Math.min(8,dx)).toFixed(1)+'px '+Math.max(-6,Math.min(6,dy)).toFixed(1)+'px';
    magEl=el;
  }

  /* ---------- bucle único ---------- */
  function loop(){
    raf=0;
    rx+=(x-rx)*.2;ry+=(y-ry)*.2;
    dot.style.transform='translate3d('+x+'px,'+y+'px,0)';
    ring.style.transform='translate3d('+rx.toFixed(1)+'px,'+ry.toFixed(1)+'px,0)';
    let px=x,py=y,moving=Math.abs(x-rx)>.2||Math.abs(y-ry)>.2;
    for(const t of trail){
      t.x+=(px-t.x)*.35;t.y+=(py-t.y)*.35;
      t.el.style.transform='translate3d('+t.x.toFixed(1)+'px,'+t.y.toFixed(1)+'px,0)';
      if(Math.abs(px-t.x)>.2||Math.abs(py-t.y)>.2)moving=true;
      px=t.x;py=t.y;
    }
    if(moving)raf=requestAnimationFrame(loop);
  }

  window.jgCursor={
    disable(){off=true;root.remove();d.classList.remove('has-jc');if(raf)cancelAnimationFrame(raf);mo.disconnect()}
  };
})();
