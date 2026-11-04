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
  if(!full)section.classList.add('calm');

  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let STOPS=[];
  try{STOPS=(await fetch('js/tunnel-stops.json').then(r=>r.json())).stops||[]}catch(e){STOPS=[]}
  if(!STOPS.length)return;

  /* ---------- contenido compartido de una parada (panel 3D y fallback accesible).
     `kicker` se omite dentro de una ventana con chrome: la barra ya muestra el nombre de la fase. */
  const stopBody=(s,kicker)=>{
    let h=kicker===false?'':'<p class="tn-kicker tf-kicker">'+esc(s.fase)+'</p>';
    if(s.badge)h+='<p class="tn-badge"><i aria-hidden="true"></i>'+esc(s.badge)+'</p>';
    h+='<h3>'+esc(s.titulo||s.fase)+'</h3>';
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
    return h;
  };

  /* cabecera + lista accesibles: siempre en el DOM; visibles solo cuando no hay túnel animado (es el fallback) */
  if(heroLite&&!full)heroLite.classList.remove('sr');
  if(fallbackEl){
    fallbackEl.innerHTML=STOPS.map(s=>'<li class="tf-item">'+stopBody(s)+'</li>').join('');
    if(!full)fallbackEl.classList.remove('sr');
  }

  if(!full)return;

  /* ---------- paradas en la cámara delantera: la primera ("Quién soy") abre con el nombre, sin
     ventana aparte de cabecera — todo en un único panel, mismo sistema de opacidad ---------- */
  const S=420,SLOTS=20,ZMAX=6720;
  const stations=STOPS.map((s,i)=>({at:s.at,x:s.lado==='left'?-300:300,data:s,lead:i===0}));
  world2.innerHTML=stations.map(st=>{
    if(st.lead){
      return '<div class="tn-slot" data-at="'+st.at+'" data-x="0"><div class="tn-panel tn-hero">'
        +'<h1 class="title">Francisco Javier García López</h1>'
        +'<p class="tn-sub">Full Stack &amp; IA<code aria-hidden="true">_</code></p>'
        +'<div class="tn-win tn-win-lead"><div class="tn-chrome"><i></i><i></i><i></i><span>'+esc(st.data.fase)+'</span></div>'
        +'<div class="tn-body">'+stopBody(st.data,false)+'</div></div>'
        +'<div class="tn-cta cta"><a class="btn primary" href="#proyectos">Explorar proyectos</a>'
        +'<a class="btn ghost" href="assets/cv-javi-garcia.pdf" download>Ver CV</a></div>'
        +'</div></div>';
    }
    return '<div class="tn-slot" data-at="'+st.at+'" data-x="'+st.x+'"><article class="tn-panel tn-win">'
      +'<div class="tn-chrome"><i></i><i></i><i></i><span>'+esc(st.data.fase)+'</span></div>'
      +'<div class="tn-body">'+stopBody(st.data,false)+'</div></article></div>';
  }).join('');
  const panels=[...world2.querySelectorAll('.tn-slot')].map(slot=>({
    slot,panel:slot.querySelector('.tn-panel'),
    at:parseFloat(slot.dataset.at),x:parseFloat(slot.dataset.x)
  }));
  panels.forEach(q=>{q.slot.style.transform='translate3d('+q.x+'px,0,'+(-q.at*ZMAX)+'px) translate(-50%,-50%)'});

  /* ---------- tubo de fondo: anillos + 4 pantallas por anillo, de wireframe a dashboard ---------- */
  const BAR='<div class="tn-bar"><i></i><i></i><i></i><span class="tn-pill"></span></div>';
  const T={
    wire:[
      BAR+'<div class="tn-img"></div><div class="tn-ln a"></div><div class="tn-ln b"></div><div class="tn-row"><div class="tn-bx"></div><div class="tn-bx"></div><div class="tn-bx"></div></div>',
      BAR+'<div class="tn-row"><div class="tn-bx" style="height:90px"></div><div class="tn-bx" style="height:90px"></div></div><div class="tn-ln a"></div><div class="tn-ln c2"></div><div class="tn-ln b"></div>',
      BAR+'<div class="tn-ln b"></div><div class="tn-img"></div><div class="tn-row"><div class="tn-bx"></div><div class="tn-bx"></div></div><div class="tn-ln a"></div>'
    ],
    ui:[
      BAR+'<div class="tn-av"></div><div class="tn-ttl"></div><div class="tn-ln a"></div><div class="tn-ln b"></div><div class="tn-btnx"></div>',
      BAR+'<div class="tn-grid2"><div class="tn-card2"><div class="tn-ico"></div><div class="tn-ln a"></div><div class="tn-ln b"></div></div><div class="tn-card2"><div class="tn-ico"></div><div class="tn-ln a"></div><div class="tn-ln b"></div></div></div>',
      BAR+'<div class="tn-ttl"></div><div class="tn-inp"></div><div class="tn-inp"></div><div class="tn-tog"></div><div class="tn-btnx cy"></div>'
    ],
    code:[
      '<pre><span class="cm">// modelo</span>\n<span class="k">class</span> Item <span class="k">extends</span> Model {\n  <span class="k">public function</span> activos() {\n    <span class="k">return</span> $this-&gt;where(<span class="s">\'estado\'</span>, 1);\n  }\n}</pre>',
      '<pre>@Component({\n  selector: <span class="s">\'app-panel\'</span>\n})\n<span class="k">export class</span> Panel {\n  datos$ = <span class="k">this</span>.api.get(<span class="s">\'/datos\'</span>);\n}</pre>',
      '<pre><span class="k">SELECT</span> id, nombre\n<span class="k">FROM</span> registros\n<span class="k">WHERE</span> activo = 1\n<span class="k">ORDER BY</span> fecha <span class="k">DESC</span>;</pre>'
    ],
    prod:[
      '<div class="tn-kpis"><div></div><div></div><div></div></div><div class="tn-bars"><i style="height:38%"></i><i style="height:62%"></i><i style="height:48%"></i><i style="height:80%"></i><i style="height:58%"></i><i style="height:92%"></i><i style="height:70%"></i></div>',
      BAR+'<div class="tn-trow"><b></b><span></span><em></em></div><div class="tn-trow"><b></b><span></span><em></em></div><div class="tn-trow"><b></b><span></span><em></em></div><div class="tn-trow"><b></b><span></span><em></em></div>',
      '<div class="tn-msg a"></div><div class="tn-msg b"></div><div class="tn-msg a s"></div><div class="tn-kpis"><div></div><div></div><div></div></div>'
    ]
  };
  const kindAt=pf=>pf<.14?'wire':pf<.28?'ui':pf<.5?'code':pf<.88?'prod':'ui';

  const groups=[];
  const frag=document.createDocumentFragment();
  for(let i=1;i<=SLOTS;i++){
    const g=document.createElement('div');g.className='tn-ringgroup';g.style.transform='translateZ('+(-i*S)+'px)';
    const k=kindAt(i*S/ZMAX),sides=['l','r','f','c'];
    let h='<div class="tn-ring'+(i%3===0?' c':'')+'"></div>';
    for(let s=0;s<4;s++)h+='<div class="tn-tile k-'+k+' '+sides[s]+'">'+T[k][(i+s)%3]+'</div>';
    g.innerHTML=h;frag.appendChild(g);groups.push({el:g,z:-i*S,off:false});
  }
  world.appendChild(frag);

  /* ---------- timeline: fases con ancho proporcional, derivadas de las paradas reales ---------- */
  const phases=STOPS.map((s,i)=>{
    const prevAt=i===0?0:(STOPS[i-1].at+s.at)/2;
    const nextAt=i===STOPS.length-1?1:(s.at+STOPS[i+1].at)/2;
    return {name:s.fase,a:prevAt,b:nextAt};
  });
  phases.forEach(ph=>{
    const b=document.createElement('button');b.type='button';b.textContent=ph.name;
    b.style.flex='0 0 '+((ph.b-ph.a)*100)+'%';
    b.addEventListener('click',()=>scrollTo({top:(ph.a+.01)*maxScroll,behavior:calm?'auto':'smooth'}));
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
  let maxScroll=1;
  const measure=()=>{maxScroll=Math.max(1,section.offsetHeight-innerHeight)};
  let resizeTimer=0;
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measure();dirty=true},150)},{passive:true});
  measure();

  /* ---------- bucle único: progreso con inercia, pinta solo si cambia, pausado fuera de pantalla ---------- */
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  let tp=0,p=0,tmx=0,tmy=0,mx=0,my=0,dirty=true,lastPhase=-1,running=false,rafId=null;

  const onScroll=()=>{tp=clamp(scrollY/maxScroll,0,1)};
  addEventListener('scroll',onScroll,{passive:true});
  onScroll();
  addEventListener('pointermove',e=>{
    tmx=(e.clientX/innerWidth-.5)*2;tmy=-(e.clientY/innerHeight-.5)*2;
  },{passive:true});

  const updateUI=()=>{
    const cz=p*ZMAX;
    for(const grp of groups){
      const d=grp.z+cz,off=(d<-3800||d>700);
      if(off!==grp.off){grp.off=off;grp.el.classList.toggle('off',off)}
    }
    for(const q of panels){
      const z=(p-q.at)*ZMAX;
      let o=z<=0?1+z/950:1-z/260;o=clamp(o,0,1);
      q.panel.style.opacity=o.toFixed(3);
      if(o<.5)q.slot.setAttribute('inert','');else q.slot.removeAttribute('inert');
    }
    let ph=0;for(let k=0;k<phases.length;k++)if(p>=phases[k].a)ph=k;
    if(ph!==lastPhase){
      lastPhase=ph;
      phases.forEach((x,n)=>x.el.setAttribute('aria-current',n===ph?'true':'false'));
    }
    head.style.left=(p*100)+'%';
    glow.style.transform='scale('+(.25+p*2.2).toFixed(3)+')';
    glow.style.opacity=(.4+p*.6).toFixed(3);
    if(hint)hint.style.opacity=p>.03?'0':'1';
    if(coords)coords.textContent='z '+Math.round(cz);
  };

  const frame=()=>{
    if(!running)return;
    rafId=requestAnimationFrame(frame);
    const np=p+(tp-p)*.08,nmx=mx+(tmx-mx)*.06,nmy=my+(tmy-my)*.06;
    const moving=Math.abs(np-p)>.00004||Math.abs(nmx-mx)>.0005||Math.abs(nmy-my)>.0005;
    p=np;mx=nmx;my=nmy;
    if(!moving&&!dirty)return;
    dirty=false;
    const wt='translate3d(0,0,'+(p*ZMAX).toFixed(1)+'px)';
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

  const destroy=()=>{pause();io.disconnect()};
  addEventListener('pagehide',destroy,{once:true});
  window.tunnelScene={destroy};
}
