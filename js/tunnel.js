/* Túnel "Del diseño al producto": CSS 3D (perspective + preserve-3d), sin WebGL ni librerías.
   Dos cámaras, como en la maqueta aprobada: `.tn-cam` (el tubo de fondo, con anillos y pantallas
   decorativas que van de wireframe a dashboard) y `.tn-cam.front` (por encima de la niebla, con las
   paradas reales de la trayectoria en HTML). El scroll es nativo: no hay scroll-jacking, solo
   `position:sticky` + un bucle que suaviza el progreso por interpolación.

   Datos: js/tunnel-stops.json (trayectoria real, sin proyectos, sin reescribir los textos).
   Fallback (móvil <720px, prefers-reduced-motion o sin soporte 3D): lista vertical estática,
   siempre en el DOM, que es también la versión accesible/legible-sin-animación del túnel. */

const section=document.querySelector('.tn-section');
if(section)start();

async function start(){
  const scene=document.getElementById('tnScene');
  const cam=document.getElementById('tnCam'),world=document.getElementById('tnWorld');
  const cam2=document.getElementById('tnCam2'),world2=document.getElementById('tnWorld2');
  const glow=document.getElementById('tnGlow'),hint=document.getElementById('tnHint'),coords=document.getElementById('tnCoords');
  const timeline=document.getElementById('tnTimeline'),head=document.getElementById('tnHead');
  const cursor=document.getElementById('tnCursor'),fallbackEl=document.getElementById('tunnelFallback');
  const heroLite=document.getElementById('tnHeroLite');
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow=innerWidth<720;
  const supports3d=CSS?.supports?.('(transform-style: preserve-3d)')&&CSS?.supports?.('(perspective: 1px)');
  const full=!!supports3d&&!calm&&!narrow;
  if(!full){section.classList.add('calm');document.documentElement.classList.remove('in-tunnel')}

  /* Si el túnel quedó estático solo por el ancho (página cargada con la ventana estrecha o aún a 0 px, p. ej. un panel
     que se abre después), al ampliar la ventana se recarga una vez para activar la versión completa. */
  if(narrow&&!calm&&supports3d){
    const onGrow=()=>{
      if(innerWidth<720)return;
      removeEventListener('resize',onGrow);
      try{
        const last=+sessionStorage.getItem('tn-reflow')||0;
        if(Date.now()-last<8000)return;
        sessionStorage.setItem('tn-reflow',String(Date.now()));
      }catch(e){}
      location.reload();
    };
    addEventListener('resize',onGrow,{passive:true});
  }

  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let STOPS=[];
  try{STOPS=(await fetch('js/tunnel-stops.json').then(r=>r.json())).stops||[]}catch(e){STOPS=[]}
  if(!STOPS.length){document.documentElement.classList.remove('in-tunnel');return}

  /* ---------- contenido compartido de una parada (panel 3D y fallback accesible).
     `kicker` se omite dentro de una ventana con chrome: la barra ya muestra el nombre de la fase. */
  const stopBody=(s,kicker,lead)=>{
    let h=kicker===false?'':'<p class="tn-kicker tf-kicker">'+esc(s.fase)+'</p>';
    if(s.badge)h+='<p class="tn-badge"><i aria-hidden="true"></i>'+esc(s.badge)+'</p>';
    const tag=lead?'h1':'h3';
    const title=esc(s.titulo||s.fase);
    h+='<'+tag+'>'+(lead?title.replace('mi camino.','<span>mi camino.</span>'):title)+'</'+tag+'>';
    if(s.ask)h+='<p class="tn-ask tf-ask">'+esc(s.ask)+'</p>';
    (s.texto||[]).forEach(p=>h+='<p>'+esc(p)+'</p>');
    if(s.formacion&&s.formacion.length){
      h+='<ul class="tn-formacion tf-formacion">'+s.formacion.map(f=>
        '<li><b>'+esc(f.titulo)+'</b><span>'+esc(f.lugar)+' · '+esc(f.fechas)+'</span></li>'
      ).join('')+'</ul>';
    }
    if(s.chips&&s.chips.length)h+='<ul class="tn-chips tf-chips">'+s.chips.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul>';
    if(s.enlaces&&s.enlaces.length){
      h+='<div class="tn-links">'+s.enlaces.map((l,i)=>
        '<a href="'+esc(l.href)+'"'+(i===0?'':' target="_blank" rel="noopener"')+'>'+esc(l.texto)+'</a>'
      ).join('')+'</div>';
    }
    if(lead){
      return '<div class="tn-intro">'
        +'<div class="tn-intro-title"><p class="tn-kicker">Desarrollo con visión de producto</p>'
        +'<h1>'+title.replace('no la aprendí programando.','<span>no la aprendí programando.</span>')+'</h1>'
        +'<p class="tn-intro-promise">Entender a las personas.<br>Dar forma a las ideas.<br>Hacer que funcionen.</p>'
        +'<div class="tn-cta cta"><a class="btn primary" href="#mapa">Explorar proyectos ↗</a><a class="btn ghost" href="assets/cv-javi-garcia.pdf" download>Ver CV</a></div></div>'
        +'<div class="tn-intro-bio"><p class="tn-badge"><i aria-hidden="true"></i>'+esc(s.badge)+'</p>'
        +'<p class="tn-intro-label">Quién soy / Full Stack &amp; IA</p>'
        +(s.texto||[]).map(p=>'<p class="tn-intro-paragraph">'+esc(p)+'</p>').join('')
        +'<div class="tn-intro-signature" aria-hidden="true"><span>mirada</span><i>+</i><span>lógica</span><i>→</i><strong>producto</strong></div>'
        +'<ul class="tn-chips">'+s.chips.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul></div></div>';
    }
    return h;
  };

  const journey=s=>'<div class="tn-journey"><div class="tn-journey-gate" aria-hidden="true"></div>'
    +'<p class="tn-journey-kicker">Todo lo anterior tiene un porqué</p>'
    +'<h2>'+esc(s.titulo)+'</h2><p class="tn-journey-story">'+esc(s.texto[0])+'</p>'
    +'<ol class="tn-journey-route"><li><b>01</b><strong>Marketing</strong><span>Entender el valor</span></li>'
    +'<li><b>02</b><strong>Diseño</strong><span>Pensar la experiencia</span></li>'
    +'<li><b>03</b><strong>Código</strong><span>Hacerlo funcionar</span></li>'
    +'<li><b>04</b><strong>Producto + IA</strong><span>Conectar y potenciar</span></li></ol>'
    +'<p class="tn-journey-scroll">Sigue avanzando. Las piezas van a encajar. ↓</p></div>';

  const finale=s=>'<div class="tn-finale">'
    +'<p class="tn-finale-eyebrow">El recorrido se convierte en producto</p>'
    +'<h2>Product Engineering <span>+ IA</span></h2>'
    +'<p class="tn-finale-idea">Diseño, código e inteligencia. Todo conectado.</p>'
    +'<div class="tn-product" aria-label="Un producto que conecta experiencia, servidor e inteligencia artificial">'
    +'<div class="tn-product-top"><span><i></i> Producto completo</span><b>De la idea a la realidad ↗</b></div>'
    +'<div class="tn-product-modules"><div><span class="tn-module-icon">◈</span><b>Experiencia</b><small>Clara. Útil. Humana.</small><div class="tn-product-ui"><i></i><i></i><i></i></div></div>'
    +'<span class="tn-product-plus" aria-hidden="true">+</span><div><span class="tn-module-icon">&lt;/&gt;</span><b>Ingeniería</b><small>La lógica que lo hace real.</small><div class="tn-product-code" aria-hidden="true"><i></i><i></i><i></i></div></div>'
    +'<span class="tn-product-plus" aria-hidden="true">+</span><div><span class="tn-module-icon">✳</span><b>IA aplicada</b><small>Automatizar. Mejorar. Crear.</small><div class="tn-product-ai" aria-hidden="true"><i></i><i></i><i></i></div></div></div>'
    +'<div class="tn-product-bottom"><span>Una visión de principio a fin</span><span>● Sistemas conectados</span></div></div>'
    +'<p class="tn-finale-description">'+esc(s.texto[0])+'</p>'
    +'<p class="tn-finale-study">'+esc(s.formacion[0].titulo)+' · '+esc(s.formacion[0].lugar)+' · '+esc(s.formacion[0].fechas)+'</p>'
    +'</div>';

  /* cabecera + lista accesibles: siempre en el DOM; visibles solo cuando no hay túnel animado (es el fallback) */
  if(heroLite)heroLite.hidden=true;
  if(fallbackEl){
    fallbackEl.innerHTML=STOPS.map((s,i)=>'<li class="tf-item'+(i===0?' tf-intro':s.id==='product-ia'?' tf-finale':s.id==='el-camino'?' tf-journey':'')+'">'+(s.id==='product-ia'?finale(s):s.id==='el-camino'?journey(s):stopBody(s,true,i===0))+'</li>').join('');
    if(!full)fallbackEl.classList.remove('sr');
  }
  document.dispatchEvent(new Event('tunnel:ready'));

  if(!full)return;

  /* ---------- paradas en la cámara delantera: el nombre vive dentro de "Quién soy",
     con el mismo contenido compartido que la versión ligera ---------- */
  const S=420,SLOTS=20,ZMAX=6720;
  const stations=STOPS.map((s,i)=>({at:s.at,x:s.lado==='left'?-300:300,data:s,lead:i===0,exit:i===STOPS.length-1}));
  world2.innerHTML=stations.map(st=>{
    if(st.lead){
      return '<div class="tn-slot" data-at="'+st.at+'" data-x="0"><div class="tn-panel tn-hero">'
        +'<div class="tn-lead-section">'+stopBody(st.data,true,true)+'</div>'
        +'</div></div>';
    }
    if(st.data.id==='el-camino'){
      return '<div class="tn-slot tn-slot-journey" data-at="'+st.at+'" data-x="0"><div class="tn-panel">'+journey(st.data)+'</div></div>';
    }
    if(st.exit){
      return '<div class="tn-slot tn-slot-exit" data-at="'+st.at+'" data-x="0"><div class="tn-panel tn-hero tn-exit">'
        +'<div class="tn-exit-section">'+finale(st.data)+'</div>'
        +'</div></div>';
    }
    return '<div class="tn-slot" data-at="'+st.at+'" data-x="'+st.x+'"><article class="tn-panel tn-win">'
      +'<div class="tn-chrome"><i></i><i></i><i></i><span>'+esc(st.data.fase)+'</span></div>'
      +'<div class="tn-body">'+stopBody(st.data,false)+'</div></article></div>';
  }).join('');
  const panels=[...world2.querySelectorAll('.tn-slot')].map(slot=>({
    slot,panel:slot.querySelector('.tn-panel'),
    at:parseFloat(slot.dataset.at),x:parseFloat(slot.dataset.x),exit:slot.classList.contains('tn-slot-exit')
  }));
  panels.forEach(q=>{q.slot.style.transform='translate3d('+q.x+'px,0,'+(-q.at*ZMAX)+'px) translate(-50%,-50%)'});

  /* ---------- tubo de fondo: anillos (estructura) + paredes con contenido real de cada etapa ----------
     Las paredes enseñan cómo se aplicó cada etapa en los proyectos reales (datos de js/data.js): el problema
     (Marketing), la interfaz real (Diseño), cómo funciona (Código) y el resultado (Product Engineering e IA).
     Van en el lado contrario al panel de la parada para no taparlo. Sin datos, solo quedan los anillos. */
  const groups=[];
  const frag=document.createDocumentFragment();
  for(let i=1;i<=SLOTS;i++){
    const g=document.createElement('div');g.className='tn-ringgroup';g.style.transform='translateZ('+(-i*S)+'px)';
    g.innerHTML='<div class="tn-ring'+(i%3===0?' c':'')+'"></div>';
    frag.appendChild(g);groups.push({el:g,z:-i*S,off:false});
  }
  const PR=typeof PROJECTS!=='undefined'?PROJECTS.slice(0,2):[];
  const SHOT={'templimail':'assets/tunnel/templimail.webp','generador-especificaciones':'assets/tunnel/generador.webp'};
  const name=p=>esc(p.short||p.title);
  const WALL={
    marketing:p=>'<p class="tw-k">El problema · '+name(p)+'</p><p class="tw-t">'+esc(p.problem)+'</p>',
    diseno:p=>SHOT[p.slug]?'<p class="tw-k">Interfaz real · '+name(p)+'</p><img src="'+SHOT[p.slug]+'" alt="" loading="lazy" decoding="async">':'',
    codigo:p=>'<p class="tw-k">Cómo funciona · '+name(p)+'</p><ol class="tw-flow">'+(p.diagram||[]).map(d=>'<li><b>'+esc(d[0])+'</b><span>'+esc(d[1])+'</span></li>').join('')+'</ol>',
    'product-ia':p=>'<p class="tw-k">Resultado · '+esc(p.status)+'</p><p class="tw-h">'+esc(p.title)+'</p><p class="tw-t">'+esc(p.solution)+'</p>'
  };
  const addWall=(html,side,z)=>{
    if(!html)return;
    const g=document.createElement('div');g.className='tn-ringgroup';g.style.transform='translateZ('+z+'px)';
    g.innerHTML='<div class="tn-wall '+side+'">'+html+'</div>';
    frag.appendChild(g);groups.push({el:g,z,off:false});
  };
  for(const st of STOPS){
    const fill=WALL[st.id];
    if(!fill||!PR.length)continue;
    if(st.lado==='left'||st.lado==='right'){
      /* las dos paredes en el lado libre, una detrás de otra */
      const side=st.lado==='left'?'r':'l',base=-st.at*ZMAX;
      PR.forEach((p,i)=>addWall(fill(p),side,base-260-i*420));
    }else{
      /* parada central (salida): una pared a cada lado, antes de llegar al panel final */
      const base=-(st.at-.1)*ZMAX;
      PR.forEach((p,i)=>addWall(fill(p),i?'r':'l',base-420));
    }
  }
  world.appendChild(frag);

  /* ---------- timeline: fases con ancho proporcional, derivadas de las paradas reales ---------- */
  const phases=STOPS.map((s,i)=>{
    const prevAt=i===0?0:(STOPS[i-1].at+s.at)/2;
    const nextAt=i===STOPS.length-1?1:(s.at+STOPS[i+1].at)/2;
    return {name:s.fase,at:s.at,a:prevAt,b:nextAt};
  });
  phases.forEach(ph=>{
    const b=document.createElement('button');b.type='button';b.textContent=ph.name;
    b.addEventListener('click',()=>scrollTo({top:ph.at*maxScroll,behavior:calm?'auto':'smooth'}));
    timeline.insertBefore(b,head);ph.el=b;
  });

  /* ---------- cursor "tú": inercia propia, solo puntero fino ---------- */
  const fine=matchMedia('(pointer: fine)').matches;
  let cx=-100,cy=-100,ox=-100,oy=-100,cRaf=0;
  const cursorLoop=()=>{
    ox+=(cx-ox)*.22;oy+=(cy-oy)*.22;
    cursor.style.transform='translate3d('+ox.toFixed(1)+'px,'+oy.toFixed(1)+'px,0)';
    cRaf=(Math.abs(cx-ox)>.3||Math.abs(cy-oy)>.3)?requestAnimationFrame(cursorLoop):0;
  };
  if(fine){
    addEventListener('pointermove',e=>{cx=e.clientX;cy=e.clientY;if(!cRaf)cRaf=requestAnimationFrame(cursorLoop)},{passive:true});
  }

  /* ---------- medidas del scroll ---------- */
  let maxScroll=1,secTop=0;
  const measure=()=>{maxScroll=Math.max(1,section.offsetHeight-innerHeight);secTop=section.getBoundingClientRect().top+scrollY};
  let resizeTimer=0;
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measure();dirty=true},150)},{passive:true});
  measure();

  /* ---------- bucle único: progreso con inercia, pinta solo si cambia, pausado fuera de pantalla ---------- */
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  let tp=0,p=0,tmx=0,tmy=0,mx=0,my=0,dirty=true,lastPhase=-1,lastTimelineWidth=0,running=false,rafId=null;

  /* La cabecera se oculta mientras la escena está fijada (solo en modo completo) y vuelve al salir del túnel */
  let inT=null;
  const setInT=v=>{if(v!==inT){inT=v;document.documentElement.classList.toggle('in-tunnel',v)}};
  const onScroll=()=>{tp=clamp(scrollY/maxScroll,0,1);if(full)setInT(scrollY<secTop+maxScroll-4)};
  addEventListener('scroll',onScroll,{passive:true});
  onScroll();
  addEventListener('pointermove',e=>{
    tmx=(e.clientX/innerWidth-.5)*2;tmy=-(e.clientY/innerHeight-.5)*2;
  },{passive:true});

  /* Geometría de la timeline en caché: el bucle no lee offsetLeft/offsetWidth/clientWidth (evita layout forzado por frame) */
  const geo=[];let tlW=0;
  const measureTl=()=>{
    tlW=timeline.clientWidth;
    phases.forEach((x,i)=>{geo[i]={l:x.el.offsetLeft,w:x.el.offsetWidth}});
    dirty=true;
  };
  measureTl();
  if('ResizeObserver' in window){
    const tro=new ResizeObserver(measureTl);
    tro.observe(timeline);phases.forEach(x=>tro.observe(x.el));
  }

  const updateUI=()=>{
    const cz=p*ZMAX;
    for(const grp of groups){
      const d=grp.z+cz,off=(d<-3800||d>700);
      if(off!==grp.off){grp.off=off;grp.el.classList.toggle('off',off)}
    }
    for(const q of panels){
      const z=((q.exit?Math.min(p,q.at):p)-q.at)*ZMAX;
      if(q.exit)q.slot.style.transform='translate3d(0,0,'+(-Math.max(p,q.at)*ZMAX)+'px) translate(-50%,-50%)';
      let o=z<=0?1+z/950:1-z/260;o=clamp(o,0,1);
      q.panel.style.opacity=o.toFixed(3);
      if(o<.5)q.slot.setAttribute('inert','');else q.slot.removeAttribute('inert');
    }
    let ph=0;for(let k=0;k<phases.length;k++)if(p>=phases[k].a)ph=k;
    if(ph!==lastPhase||tlW!==lastTimelineWidth){
      lastPhase=ph;
      lastTimelineWidth=tlW;
      phases.forEach((x,n)=>x.el.setAttribute('aria-current',n===ph?'true':'false'));
      const g=geo[ph];
      timeline.scrollTo({left:Math.max(0,g.l-(tlW-g.w)/2),behavior:'smooth'});
    }
    const phase=phases[ph],local=clamp((p-phase.a)/(phase.b-phase.a),0,1);
    head.style.transform='scaleX('+(geo[ph].l+geo[ph].w*local).toFixed(2)+')';
    const exit=clamp((p-.62)/.38,0,1);
    glow.style.transform='scale('+(.18+exit*2.6).toFixed(3)+')';
    glow.style.opacity=(.12+exit*exit*.88).toFixed(3);
    if(hint)hint.style.opacity=p>.03?'0':'1';
    if(coords)coords.textContent='z '+Math.round(cz);
  };

  /* Entrada: con la intro del logo, el túnel arranca algo más atrás y avanza hasta su sitio mientras el logo se funde */
  let glideOff=0,glideT0=0,glideDur=1700;
  const intro=window.jgIntro;
  if(full&&intro&&intro.state==='draw'){
    glideOff=1400;
    intro.onOut(fast=>{glideT0=performance.now();glideDur=fast?420:1700;dirty=true});
  }

  const frame=()=>{
    if(!running)return;
    rafId=requestAnimationFrame(frame);
    const np=p+(tp-p)*.08,nmx=mx+(tmx-mx)*.06,nmy=my+(tmy-my)*.06;
    let gz=0;
    if(glideOff){
      if(glideT0){const t=Math.min(1,(performance.now()-glideT0)/glideDur);gz=glideOff*(1-t)*(1-t)*(1-t);if(t>=1){glideOff=0;gz=0}}
      else gz=glideOff;
    }
    const moving=Math.abs(np-p)>.00004||Math.abs(nmx-mx)>.0005||Math.abs(nmy-my)>.0005||(glideOff>0&&glideT0>0);
    p=np;mx=nmx;my=nmy;
    if(!moving&&!dirty)return;
    dirty=false;
    const wt='translate3d(0,0,'+(p*ZMAX-gz).toFixed(1)+'px)';
    const ct='rotateX('+(-my*2.2).toFixed(2)+'deg) rotateY('+(mx*3).toFixed(2)+'deg)';
    world.style.transform=wt;world2.style.transform=wt;
    cam.style.transform=ct;cam2.style.transform=ct;
    updateUI();
  };
  const play=()=>{if(running)return;running=true;dirty=true;cam.classList.add('animating');cam2.classList.add('animating');rafId=requestAnimationFrame(frame)};
  const pause=()=>{running=false;cam.classList.remove('animating');cam2.classList.remove('animating');if(rafId)cancelAnimationFrame(rafId);rafId=null};

  const io=new IntersectionObserver(es=>{es[0].isIntersecting&&!document.hidden?play():pause()},{threshold:0});
  io.observe(section);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else io.unobserve(section),io.observe(section)});
  updateUI();
  if(full)window.jgIntro?.ready?.();

  const destroy=()=>{pause();io.disconnect()};
  addEventListener('pagehide',destroy,{once:true});
  window.tunnelScene={destroy};
}
