/* Túnel "Del diseño al producto": CSS 3D (perspective + preserve-3d), sin WebGL ni librerías externas.
   Scroll nativo (nada de scroll-jacking): la sección es alta, `.tn-scene` queda fijada con
   `position:sticky` y un único bucle requestAnimationFrame lee `scrollY` (sin leer layout por frame)
   para suavizar el avance por interpolación. Pinta solo cuando cambia, pausado con IntersectionObserver
   fuera de pantalla, con will-change limitado a la cámara/el mundo mientras anima.

   Datos: js/tunnel-stops.json (trayectoria real, sin proyectos, sin reescribir los textos).
   Fallback (móvil <720px, prefers-reduced-motion o sin soporte 3D): lista vertical estática,
   siempre en el DOM, que es también la versión accesible/legible-sin-animación del túnel. */

const section=document.querySelector('.tn-section');
if(section)start();

async function start(){
  const scene=document.getElementById('tnScene'),world=document.getElementById('tnWorld');
  const stopsLayer=document.getElementById('tnStops'),timeline=document.getElementById('tnTimeline');
  const cursor=document.getElementById('tnCursor'),fallbackEl=document.getElementById('tunnelFallback');
  const heroEl=scene.querySelector('.tn-hero');
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow=innerWidth<720;
  const supports3d=CSS?.supports?.('(transform-style: preserve-3d)')&&CSS?.supports?.('(perspective: 1px)');
  const full=!!supports3d&&!calm&&!narrow;
  if(!full)section.classList.add('calm');

  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let STOPS=[];
  try{STOPS=(await fetch('js/tunnel-stops.json').then(r=>r.json())).stops||[]}catch(e){STOPS=[]}
  if(!STOPS.length)return;

  /* ---------- contenido compartido de una parada (usado en el panel 3D y en el fallback) ---------- */
  const stopBody=s=>{
    let h='<p class="tn-kicker tf-kicker">'+esc(s.fase)+'</p>';
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

  /* lista accesible: siempre en el DOM; visible solo cuando no hay túnel animado (es también el fallback) */
  if(fallbackEl){
    fallbackEl.innerHTML=STOPS.map(s=>'<li class="tf-item">'+stopBody(s)+'</li>').join('');
    if(!full)fallbackEl.classList.remove('sr');
  }

  if(!full)return;

  /* ---------- panel 3D de cada parada ---------- */
  stopsLayer.innerHTML=STOPS.map(s=>
    '<div class="tn-stop" data-at="'+s.at+'" data-lado="'+s.lado+'" inert>'+stopBody(s)+'</div>'
  ).join('');
  const stopEls=[...stopsLayer.children];

  /* ---------- pantallas decorativas de pared: puramente visuales, aria-hidden ---------- */
  const DEPTH=6000;
  const STAGES=['wireframe','ui','code','dashboard','ui'];
  const codeLines=['const build = () =>','  render(state)','function App(){','  return <UI/>','}','export default App'];
  const frag=document.createDocumentFragment();
  const GROUPS=26;
  for(let i=0;i<GROUPS;i++){
    const t=i/(GROUPS-1),z=-t*DEPTH-40;
    const stage=STAGES[Math.min(STAGES.length-1,Math.floor(t*STAGES.length))];
    const side=i%2===0?-1:1,x=side*(220+Math.random()*160),y=(Math.random()-.5)*160;
    const el=document.createElement('div');
    el.className='tn-screen '+stage;
    el.setAttribute('aria-hidden','true');
    el.dataset.z=z;
    el.style.transform='translate3d('+x+'px,'+y+'px,'+z+'px) rotateY('+(-side*18)+'deg)';
    if(stage==='code'){
      el.innerHTML=codeLines.slice(0,4+((i*7)%3)).map(l=>'<i>'+esc(l)+'</i>').join('');
    }else{
      const n=3+((i*5)%3);
      el.innerHTML=Array.from({length:n}).map(()=>'<i></i>').join('');
    }
    frag.appendChild(el);
  }
  world.appendChild(frag);
  const screens=[...world.querySelectorAll('.tn-screen')];

  /* ---------- medidas del scroll: una sola lectura de layout, recalculada solo al cambiar tamaño ---------- */
  let top=0,span=1;
  const measure=()=>{
    const r=section.getBoundingClientRect();
    top=r.top+scrollY;span=Math.max(1,section.offsetHeight-innerHeight);
  };
  let resizeTimer=0;
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,150)},{passive:true});
  measure();

  /* ---------- timeline tipo Figma ---------- */
  const track=timeline.querySelector('.tn-track'),fill=timeline.querySelector('.tn-fill');
  const head=timeline.querySelector('.tn-head'),ticksEl=timeline.querySelector('.tn-ticks');
  ticksEl.innerHTML=STOPS.map(s=>'<button type="button" data-at="'+s.at+'"><b aria-hidden="true"></b>'+esc(s.fase)+'</button>').join('');
  const ticks=[...ticksEl.querySelectorAll('button')];
  ticks.forEach(btn=>btn.addEventListener('click',()=>{
    const at=parseFloat(btn.dataset.at);
    scrollTo({top:top+at*span,behavior:calm?'auto':'smooth'});
  }));

  /* ---------- cursor "tú": solo con puntero fino, con inercia ---------- */
  const fine=matchMedia('(pointer: fine)').matches;
  const pc={x:0,y:0},pt={x:0,y:0};let pointerIn=false;
  if(fine){
    scene.addEventListener('pointermove',e=>{pt.x=e.clientX;pt.y=e.clientY;pointerIn=true},{passive:true});
    scene.addEventListener('pointerleave',()=>{pointerIn=false},{passive:true});
  }

  /* ---------- bucle único: progreso con inercia, pinta solo si cambia, pausado fuera de pantalla ---------- */
  let p=0,lastWorldZ=null,lastHeadLeft=null,lastHeroT=null,activeIdx=-1,animTimer=0;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const setActive=i=>{
    if(i===activeIdx)return;
    if(activeIdx>=0){const prev=stopEls[activeIdx];prev.classList.add('animating');prev.classList.remove('on');prev.setAttribute('inert','')}
    activeIdx=i;
    clearTimeout(animTimer);
    stopEls.forEach(el=>el.classList.add('animating'));
    if(i>=0){const el=stopEls[i];el.removeAttribute('inert');requestAnimationFrame(()=>el.classList.add('on'))}
    ticks.forEach((b,bi)=>b.setAttribute('aria-current',bi===i?'true':'false'));
    animTimer=setTimeout(()=>stopEls.forEach(el=>el.classList.remove('animating')),420);
  };

  const render=()=>{
    const target=clamp((scrollY-top)/span,0,1);
    p+=(target-p)*.12;
    const z=p*DEPTH;
    if(lastWorldZ===null||Math.abs(z-lastWorldZ)>.4){
      world.style.transform='translateZ('+(-z)+'px)';
      lastWorldZ=z;
      /* oculta los grupos de pantallas fuera del rango visible: menos trabajo de pintado/compuesto */
      for(const s of screens){
        const dz=Math.abs(parseFloat(s.dataset.z)+z);
        s.style.display=dz<900?'':'none';
      }
    }
    const heroT=clamp(p/.1,0,1);
    if(heroEl&&(lastHeroT===null||Math.abs(heroT-lastHeroT)>.01)){
      heroEl.style.opacity=String(1-heroT);
      heroEl.style.transform='scale('+(1+heroT*.15)+')';
      heroEl.style.pointerEvents=heroT>.6?'none':'';
      lastHeroT=heroT;
    }
    const headLeft=p*100;
    if(lastHeadLeft===null||Math.abs(headLeft-lastHeadLeft)>.15){
      head.style.left=headLeft+'%';fill.style.width=headLeft+'%';lastHeadLeft=headLeft;
    }
    let idx=-1;
    for(let i=0;i<STOPS.length;i++)if(Math.abs(p-STOPS[i].at)<.07){idx=i;break}
    setActive(idx);
    if(fine){
      pc.x+=(pointerIn?pt.x-pc.x:0)*.14;pc.y+=(pointerIn?pt.y-pc.y:0)*.14;
      cursor.style.transform='translate3d('+pc.x+'px,'+pc.y+'px,0) translate(-50%,-140%)';
      cursor.classList.toggle('show',pointerIn);
    }
  };

  let rafId=null,running=false;
  const frame=()=>{if(!running)return;render();rafId=requestAnimationFrame(frame)};
  const play=()=>{if(running)return;running=true;world.classList.add('animating');rafId=requestAnimationFrame(frame)};
  const pause=()=>{running=false;world.classList.remove('animating');if(rafId)cancelAnimationFrame(rafId);rafId=null};
  const io=new IntersectionObserver(es=>{es[0].isIntersecting?play():pause()},{threshold:0});
  io.observe(section);
  render();

  addEventListener('pagehide',()=>{pause();io.disconnect()},{once:true});
}
