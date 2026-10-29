/* Lógica del portfolio: filtros, tarjetas, mapa de red, detalle, tema y navegación.
   Los datos (proyectos y tecnologías) están en data.js. */
/* ---------- utilidades ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const NS='http://www.w3.org/2000/svg';
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const arrowL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

/* ---------- ilustración generativa por proyecto ---------- */
function cover(p,w,h){
  const r=rng(p.slug), pts=[];
  const n=10;
  for(let i=0;i<n;i++)pts.push([16+r()*(w-32),14+r()*(h-28)]);
  let lines='';
  pts.forEach((a,i)=>{
    const near=pts.map((b,j)=>[j,Math.hypot(a[0]-b[0],a[1]-b[1])]).filter(x=>x[0]!==i).sort((x,y)=>x[1]-y[1]).slice(0,2);
    near.forEach(([j])=>{if(j>i||!near.some(()=>false))lines+=`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}"/>`});
  });
  const gx=(r()*w).toFixed(0), gy=(r()*h).toFixed(0);
  const hero=Math.floor(r()*n);
  const dots=pts.map((q,i)=> i===hero
    ? `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="9" fill="var(--cyan)"/>`
    : `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(3.5+r()*2.5).toFixed(1)}" fill="var(--surface)" stroke="var(--blue)" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs><radialGradient id="g-${p.slug}-${w}" cx="${gx}" cy="${gy}" r="${w*0.7}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--cyan)" stop-opacity=".45"/><stop offset="1" stop-color="var(--cyan)" stop-opacity="0"/></radialGradient></defs>
    <rect width="${w}" height="${h}" fill="var(--sky)"/><rect width="${w}" height="${h}" fill="url(#g-${p.slug}-${w})"/>
    <g stroke="var(--blue)" stroke-opacity=".5" stroke-width="1.6">${lines}</g>${dots}</svg>`;
}

/* ---------- estado y filtros ---------- */
const state={q:'',cat:'Todos',tech:null};
function matches(p){
  if(state.cat!=='Todos' && !p.cats.includes(state.cat)) return false;
  if(state.tech && !p.stack.includes(state.tech)) return false;
  const q=state.q.trim().toLowerCase();
  if(q){
    const hay=[p.title,p.type,p.context,p.summary,p.problem,p.solution,p.stack.join(' '),p.cats.join(' ')].join(' ').toLowerCase();
    if(!q.split(/\s+/).every(w=>hay.includes(w))) return false;
  }
  return true;
}
function renderCats(){
  const box=$('#cats'); box.innerHTML='';
  ['Todos',...CATS].forEach(c=>{
    const b=document.createElement('button');
    b.type='button'; b.className='chip'; b.textContent=c; b.setAttribute('aria-pressed',String(state.cat===c));
    b.onclick=()=>{state.cat=c;update()};
    box.appendChild(b);
  });
}
function renderGrid(){
  const list=PROJECTS.filter(matches);
  const grid=$('#grid'); grid.innerHTML='';
  list.forEach(p=>{
    const b=document.createElement('button');
    b.type='button'; b.className='card'; b.setAttribute('aria-label','Abrir proyecto '+p.title);
    const tags=p.stack.slice(0,4).map(t=>`<span class="tag">${esc(t)}</span>`).join('')+(p.stack.length>4?`<span class="tag">+${p.stack.length-4}</span>`:'');
    b.innerHTML=`<span class="art">${cover(p,320,150)}</span>
      <span class="body">
        <span class="status ${p.ok?'ok':''}"><i></i>${esc(p.status)}${(p.links||[]).some(l=>/demo/i.test(l.label))?'<span class="demo-pill">Demo disponible</span>':''}</span>
        <h3>${esc(p.title)}</h3>
        <span class="meta">${esc(p.type)} · ${esc(p.context)}</span>
        <p class="sum">${esc(p.summary)}</p>
        <span class="tags">${tags}</span>
        <span class="more-link">Ver caso de estudio ${arrow}</span>
      </span>`.replace(' · ',' – ');
    b.onclick=()=>openProject(p.slug,false,b);
    grid.appendChild(b);
  });
  $('#count').textContent=`Mostrando ${list.length} de ${PROJECTS.length} proyectos`;
  $('#empty').classList.toggle('show',list.length===0);
  grid.style.display=list.length?'grid':'none';
}
function renderTechChip(){
  $('#techchip').classList.toggle('show',!!state.tech);
  $('#techname').textContent=state.tech||'';
}
function update(){renderCats();renderTechChip();renderGrid();renderStack();markMap()}
function setTech(t,scroll){
  state.tech=(state.tech===t)?null:t;
  update();
  if(scroll&&state.tech) $('#proyectos').scrollIntoView({behavior:'smooth',block:'start'});
}
$('#q').addEventListener('input',e=>{state.q=e.target.value;renderGrid()});
$('#techclear').onclick=()=>{state.tech=null;update()};
$('#reset').onclick=()=>{state.q='';state.cat='Todos';state.tech=null;$('#q').value='';update()};
document.addEventListener('keydown',e=>{
  if(e.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)&&!$('#dlg').open){e.preventDefault();$('#q').focus()}
});

/* ---------- stack ---------- */
const TIER_LABEL={pro:'Experiencia profesional',proj:'Proyectos propios'};
let stackSel=null;
function renderStack(focusT){
  const box=$('#stack-groups'); box.innerHTML='';
  ['Backend','Frontend','IA y automatización','Herramientas'].forEach(g=>{
    const techs=Object.keys(TECH).filter(t=>TECH[t]===g&&TECH_TIERS[t]);
    if(!techs.length) return;
    const d=document.createElement('div');
    d.className='stack-col';
    d.innerHTML=`<h3>${g}</h3><div class="stack-list"></div>`;
    techs.forEach(t=>{
      const tiers=TECH_TIERS[t];
      const b=document.createElement('button');
      b.type='button'; b.className='tech'; b.dataset.t=t;
      b.setAttribute('aria-pressed',String(stackSel===t));
      b.setAttribute('aria-label',`${t}: ${tiers.map(x=>TIER_LABEL[x]).join(' y ')}`);
      b.innerHTML=`<span>${esc(t)}</span><span class="tiers" aria-hidden="true">${tiers.map(x=>`<i class="tier ${x}"></i>`).join('')}</span>`;
      b.onclick=()=>{stackSel=stackSel===t?null:t;renderStack(t)};
      $('.stack-list',d).appendChild(b);
    });
    box.appendChild(d);
  });
  const det=$('#stackDetail');
  if(!stackSel){det.innerHTML='<p class="map-hint">Selecciona una tecnología para ver para qué la uso y en qué proyectos.</p>';}
  else{
    const t=stackSel,used=PROJECTS.filter(p=>p.stack.includes(t));
    det.innerHTML=`<span class="ro-kind">${esc(TECH[t])}</span><h3>${esc(t)}</h3>
      <p>${esc(TECH_USE[t]||'')}</p>
      <ul class="tier-list">${TECH_TIERS[t].map(x=>`<li><i class="tier ${x}" aria-hidden="true"></i>${TIER_LABEL[x]}</li>`).join('')}</ul>
      ${used.length?`<div class="ro-actions">${used.map(p=>`<button type="button" class="btn ghost sm" data-open="${esc(p.slug)}">${esc(p.title)} →</button>`).join('')}<button type="button" class="btn primary sm" data-filter>Filtrar proyectos con ${esc(t)}</button></div>`:'<p class="j-where">Sin proyecto público todavía: es experiencia profesional.</p>'}`;
    $$('[data-open]',det).forEach(b=>b.onclick=()=>openProject(b.dataset.open));
    const f=$('[data-filter]',det); if(f) f.onclick=()=>setTech(t,true);
  }
  if(focusT) $(`.tech[data-t="${CSS.escape(focusT)}"]`,box)?.focus();
}

/* ---------- mapa interactivo ---------- */
let MAP=null;
function buildMap(){
  if(MAP&&MAP.raf)cancelAnimationFrame(MAP.raf);
  MAP=null;
  /* svg nuevo y limpio: sin listeners ni nodos de la versión anterior */
  const old=$('#map'),svg=old.cloneNode(false);
  old.replaceWith(svg);
  const mbox=svg.parentElement,cw=Math.max(300,mbox.clientWidth),ch=Math.max(300,mbox.clientHeight);
  const kz=cw<600?1:cw<1000?1.25:1.5;
  const W=Math.round(cw/kz),H=Math.round(ch/kz);
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  $('#readout').innerHTML='<p class="map-hint">Selecciona un nodo para ver qué es y dónde lo uso. Puedes arrastrarlos.</p>';
  const techs=[...new Set(PROJECTS.flatMap(p=>p.stack))];
  const nodes=[...PROJECTS.map(p=>({id:p.slug,type:'p',label:p.short,r:15,p})),...techs.map(t=>({id:'t:'+t,type:'t',label:t,r:6,t}))];
  const idx=Object.fromEntries(nodes.map((n,i)=>[n.id,i]));
  const links=PROJECTS.flatMap(p=>p.stack.map(t=>[idx[p.slug],idx['t:'+t]]));
  const rnd=rng('mapa-javi');
  nodes.forEach(n=>{n.x=(rnd()-.5)*320;n.y=(rnd()-.5)*280;n.vx=0;n.vy=0});
  for(let it=0;it<600;it++){
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j];let dx=a.x-b.x,dy=a.y-b.y;const d2=dx*dx+dy*dy+.5,d=Math.sqrt(d2);
      const k=(a.type==='p'&&b.type==='p')?16000:(a.type==='t'&&b.type==='t')?6200:7500;
      const f=k/d2;dx/=d;dy/=d;a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;
    }
    links.forEach(([i,j])=>{const a=nodes[i],b=nodes[j];const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;const f=(d-108)*.022;a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f});
    nodes.forEach(n=>{n.vx-=n.x*.005;n.vy-=n.y*.005;n.x+=n.vx*.4;n.y+=n.vy*.4;n.vx*=.55;n.vy*=.55});
  }
  const padX=Math.round(Math.min(110,W*.1)),padT=Math.round(Math.min(165,H*.34)),padB=Math.round(Math.min(100,H*.2));
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
  const minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys);
  const sx=(W-2*padX)/(maxx-minx||1),sy=(H-padT-padB)/(maxy-miny||1);
  const cx=(minx+maxx)/2,cy=(miny+maxy)/2,mid=padT+(H-padT-padB)/2;
  nodes.forEach(n=>{n.X=W/2+(n.x-cx)*sx;n.Y=mid+(n.y-cy)*sy});
  const bx=n=>n.type==='p'?{w:n.label.length*4.7+24,t:-28,b:46}:{w:n.label.length*3.4+8,t:-10,b:28};
  for(let it=0;it<200;it++){
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],A=bx(a),B=bx(b);
      const ox=(A.w+B.w)-Math.abs(a.X-b.X);
      const top=Math.max(a.Y+A.t,b.Y+B.t),bot=Math.min(a.Y+A.b,b.Y+B.b),oy=bot-top;
      if(ox>0&&oy>0){
        if(ox<oy){const d=(a.X<b.X?-1:1)*(ox/2+.5);a.X+=d;b.X-=d}
        else{const d=(a.Y<b.Y?-1:1)*(oy/2+.5);a.Y+=d;b.Y-=d}
      }
    }
    nodes.forEach(n=>{n.X=Math.max(44,Math.min(W-44,n.X));n.Y=Math.max(30,Math.min(H-52,n.Y))});
  }

  const gPulse=document.createElementNS(NS,'g'),gE=document.createElementNS(NS,'g'),gN=document.createElementNS(NS,'g');
  svg.append(gPulse,gE,gN);
  const edges=links.map(([i,j])=>{
    const a=nodes[i],b=nodes[j];
    const l=document.createElementNS(NS,'line');
    l.setAttribute('class','edge');l.setAttribute('x1',a.X);l.setAttribute('y1',a.Y);l.setAttribute('x2',b.X);l.setAttribute('y2',b.Y);
    gE.appendChild(l);return {el:l,a:a.id,b:b.id,i,j};
  });
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  nodes.forEach((n,k)=>{
    n.x=n.X;n.y=n.Y;n.vx=0;n.vy=0;
    n.freq1=.6+rnd()*.5;n.freq2=.5+rnd()*.6;n.phase1=rnd()*6.28;n.phase2=rnd()*6.28;
    const g=document.createElementNS(NS,'g');
    const isIA=n.type==='t'&&TECH[n.t]==='IA y automatización';
    g.setAttribute('class','node '+n.type+(isIA?' ia':''));
    g.setAttribute('tabindex','0');g.setAttribute('role','button');
    g.setAttribute('aria-label',n.type==='p'?'Proyecto '+n.p.title+', ver detalle':'Tecnología '+n.t+', ver dónde la uso');
    g.style.transitionDelay=reduce?'0s':(k*25)+'ms';
    g.style.transform=reduce?`translate(${n.X}px,${n.Y}px)`:`translate(${W/2}px,${H/2}px)`;
    if(n.type==='p'){
      g.innerHTML=`<rect class="hit" x="-56" y="-28" width="112" height="70" rx="14"/><circle class="halo" r="26"/><circle class="core" r="15"/><text text-anchor="middle" y="34">${esc(n.label)}</text>`;
    }else{
      g.innerHTML=`<rect class="hit" x="-34" y="-16" width="68" height="44" rx="12"/><circle class="dot" r="6"/><text text-anchor="middle" y="21">${esc(n.label)}</text>`;
    }
    gN.appendChild(g);n.el=g;
    const on=()=>{n.hover=true;highlight(n.id)},off=()=>{n.hover=false;highlight(MAP.selected||null)};
    g.addEventListener('pointerenter',on);g.addEventListener('pointerleave',off);
    g.addEventListener('focus',on);g.addEventListener('blur',off);
    const act=()=>{pulseFrom(n);selectNode(n)};
    if(reduce){
      g.addEventListener('click',act);
    }else{
      g.style.cursor='grab';
      let downX=0,downY=0,dragging=false,moved=false,inv=null,lastT=0;
      g.addEventListener('pointerdown',e=>{
        downX=e.clientX;downY=e.clientY;dragging=true;moved=false;n.dragging=true;
        inv=svg.getScreenCTM().inverse();lastT=e.timeStamp;n.vx=0;n.vy=0;
        g.setPointerCapture(e.pointerId);g.style.cursor='grabbing';g.classList.add('dragging');
      });
      g.addEventListener('pointermove',e=>{
        if(!dragging)return;
        if(Math.hypot(e.clientX-downX,e.clientY-downY)>4)moved=true;
        const x=inv.a*e.clientX+inv.c*e.clientY+inv.e,y=inv.b*e.clientX+inv.d*e.clientY+inv.f;
        /* Velocidad suavizada en px por fotograma, para lanzar el nodo al soltarlo */
        const k=16/Math.max(8,e.timeStamp-lastT);lastT=e.timeStamp;
        n.vx=n.vx*.6+(x-n.x)*k*.4;n.vy=n.vy*.6+(y-n.y)*k*.4;
        n.x=x;n.y=y;
      });
      const release=e=>{
        if(!dragging)return;
        dragging=false;n.dragging=false;g.style.cursor='grab';g.classList.remove('dragging');
        if(!moved){n.vx=0;n.vy=0;act();return}
        if(e.timeStamp-lastT>80){n.vx=0;n.vy=0}
        const v=Math.hypot(n.vx,n.vy),max=22;
        if(v>max){n.vx*=max/v;n.vy*=max/v}
        n.elastic=1;
        window.motion?.enabled&&motion.release(g);
      };
      g.addEventListener('pointerup',release);
      g.addEventListener('pointercancel',release);
    }
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act()}});
  });
  MAP={svg,nodes,edges,links};
  if(reduce){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      nodes.forEach(n=>{n.el.style.transform=`translate(${n.X}px,${n.Y}px)`});
      svg.classList.add('ready');
    }));
    return;
  }
  const mouse={x:null,y:null,active:false};
  svg.addEventListener('pointermove',e=>{const p=toSvgPoint(svg,e.clientX,e.clientY);mouse.x=p.x;mouse.y=p.y;mouse.active=true});
  svg.addEventListener('pointerleave',()=>mouse.active=false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    nodes.forEach(n=>{n.el.style.transform=`translate(${n.X}px,${n.Y}px)`});
    setTimeout(()=>{svg.classList.add('ready');runPhysics()},750);
  }));
  let mapVisible=true;
  new IntersectionObserver(es=>{mapVisible=es[0].isIntersecting},{threshold:0}).observe(mbox);
  function runPhysics(){
    let t=0;
    (function tick(){
      if(!mapVisible){MAP.raf=requestAnimationFrame(tick);return}
      t+=.016;
      nodes.forEach(n=>{
        if(n.dragging)return;
        const dxh=n.X-n.x,dyh=n.Y-n.y;
        /* Recién soltado: muelle más vivo que se apaga poco a poco, para un rebote elástico contenido */
        const el=n.elastic||0;
        n.vx+=dxh*(.012+.008*el);n.vy+=dyh*(.012+.008*el);
        if(el){n.elastic=el>.02?el*.95:0}
        n.vx+=Math.sin(t*n.freq1+n.phase1)*.0035;
        n.vy+=Math.cos(t*n.freq2+n.phase2)*.0035;
        if(mouse.active&&!n.hover){
          const dx=mouse.x-n.x,dy=mouse.y-n.y,d=Math.hypot(dx,dy)||1,radius=140;
          if(d>18&&d<radius){const f=Math.sin(Math.PI*d/radius)*.09;n.vx+=dx/d*f;n.vy+=dy/d*f}
        }
        if(n.hover&&!el){n.vx*=.6;n.vy*=.6}
        n.vx*=.9;n.vy*=.9;n.x+=n.vx;n.y+=n.vy;
      });
      nodes.forEach(n=>{n.el.style.transform=`translate(${n.x}px,${n.y}px)`});
      edges.forEach(e=>{const a=nodes[e.i],b=nodes[e.j];e.el.setAttribute('x1',a.x);e.el.setAttribute('y1',a.y);e.el.setAttribute('x2',b.x);e.el.setAttribute('y2',b.y)});
      MAP.raf=requestAnimationFrame(tick);
    })();
  }
  function pulseFrom(n){
    edges.forEach(e=>{
      if(e.a!==n.id&&e.b!==n.id)return;
      const other=nodes[e.a===n.id?e.j:e.i];
      const dot=document.createElementNS(NS,'circle');
      dot.setAttribute('class','pulse-dot');dot.setAttribute('r','4');
      const path=document.createElementNS(NS,'path');
      path.setAttribute('d',`M${n.x} ${n.y} L${other.x} ${other.y}`);
      const anim=document.createElementNS(NS,'animateMotion');
      anim.setAttribute('dur','.7s');anim.setAttribute('fill','freeze');anim.setAttribute('path',path.getAttribute('d'));
      dot.appendChild(anim);gPulse.appendChild(dot);
      anim.beginElement?.();
      setTimeout(()=>dot.remove(),750);
    });
  }
}
function toSvgPoint(svg,clientX,clientY){
  const pt=svg.createSVGPoint();pt.x=clientX;pt.y=clientY;
  const m=svg.getScreenCTM();
  return m?pt.matrixTransform(m.inverse()):{x:0,y:0};
}
function selectNode(n){
  const box=$('#readout');
  if(MAP.selected===n.id){MAP.selected=null;MAP.nodes.forEach(x=>x.el.classList.remove('sel'));highlight(null);box.innerHTML='<p class="map-hint">Selecciona un nodo para ver qué es y dónde lo uso. Puedes arrastrarlos.</p>';return}
  MAP.selected=n.id;
  MAP.nodes.forEach(x=>x.el.classList.toggle('sel',x===n));
  highlight(n.id);
  if(n.type==='p'){
    const p=n.p;
    box.innerHTML=`<span class="ro-kind">Proyecto · ${esc(p.status)}</span>
      <h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>
      <div class="ro-actions"><button type="button" class="btn primary sm" data-open="${esc(p.slug)}">Ver caso de estudio</button></div>`;
  }else{
    const used=PROJECTS.filter(p=>p.stack.includes(n.t));
    box.innerHTML=`<span class="ro-kind">${esc(TECH[n.t]||'Tecnología')}</span>
      <h3>${esc(n.t)}</h3><p>${esc(TECH_USE[n.t]||'')}</p>
      <div class="ro-actions">${used.map(p=>`<button type="button" class="btn ghost sm" data-open="${esc(p.slug)}">${esc(p.title)} →</button>`).join('')}</div>`;
  }
  $$('[data-open]',box).forEach(b=>b.onclick=()=>openProject(b.dataset.open));
}
function highlight(id){
  if(!MAP)return;
  const {svg,nodes,edges}=MAP;
  if(!id){svg.classList.remove('has-active');nodes.forEach(n=>n.el.classList.remove('on'));edges.forEach(e=>e.el.classList.remove('on'));markMap();return}
  svg.classList.add('has-active');
  const rel=new Set([id]);
  edges.forEach(e=>{if(e.a===id)rel.add(e.b);if(e.b===id)rel.add(e.a)});
  nodes.forEach(n=>n.el.classList.toggle('on',rel.has(n.id)));
  edges.forEach(e=>e.el.classList.toggle('on',e.a===id||e.b===id));
}
function markMap(){
  if(!MAP)return;
  const {svg,nodes,edges}=MAP;
  if(!state.tech){
    if(MAP.selected){highlight(MAP.selected);return}
    svg.classList.remove('has-active');nodes.forEach(n=>n.el.classList.remove('on'));edges.forEach(e=>e.el.classList.remove('on'));return}
  highlight('t:'+state.tech);
}

/* ---------- detalle de proyecto ---------- */
const dlg=$('#dlg');
/* Cambia la URL sin recargar; algunos navegadores lo bloquean al abrir el archivo directamente (file://). */
function setHash(h){try{history.replaceState(null,'',h)}catch(e){}}
function openProject(slug,noHash,from){
  const i=PROJECTS.findIndex(p=>p.slug===slug); if(i<0)return;
  const p=PROJECTS[i],prev=PROJECTS[(i-1+PROJECTS.length)%PROJECTS.length],next=PROJECTS[(i+1)%PROJECTS.length];
  const links=(p.links||[]).map(l=>`<a class="btn ${/demo/i.test(l.label)?'primary':'ghost'}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  const list=a=>`<ul>${(a||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  const diagram=(p.diagram||[]).map(([t,s],k)=>`${k?'<span class="arch-link"></span>':''}<span class="arch-node" style="--k:${k}"><b>${esc(t)}</b><small>${esc(s)}</small></span>`).join('');
  dlg.innerHTML=`
    <div class="d-art">${cover(p,640,190)}<button class="icon-btn d-close" type="button" aria-label="Cerrar" id="dclose"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="d-body">
      <span class="status ${p.ok?'ok':''}"><i></i>${esc(p.status)}</span>
      <h2 id="d-title">${esc(p.title)}</h2>
      <div class="d-meta"><span>${esc(p.type)}</span><span>${esc(p.context)}</span></div>
      <div class="case-grid">
        <section><h3>Contexto</h3><p>${esc(p.context_long||p.context)}</p></section>
        <section><h3>Problema</h3><p>${esc(p.problem||'')}</p></section>
        <section><h3>Solución</h3><p>${esc(p.solution||p.summary)}</p></section>
      </div>
      ${diagram?`<h3>Arquitectura</h3><div class="arch" role="img" aria-label="Flujo: ${esc(p.diagram.map(d=>d[0]).join(', '))}">${diagram}</div>`:''}
      <h3>Mi aportación</h3>${list(p.highlights)}
      ${p.decisions?`<h3>Decisiones de arquitectura</h3><dl class="decisions">${p.decisions.map(([t,d])=>`<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`:''}
      <div class="case-grid two">
        ${p.challenges?`<section><h3>Retos</h3>${list(p.challenges)}</section>`:''}
        ${p.learnings?`<section><h3>Aprendizajes</h3>${list(p.learnings)}</section>`:''}
      </div>
      <div class="state-note"><span class="status ${p.ok?'ok':''}"><i></i>Estado real</span><p>${esc(p.statusNote||p.status)}</p></div>
      <h3>Tecnologías</h3>
      <div class="d-tags">${p.stack.map(t=>`<button type="button" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      ${links?`<div class="cta" style="margin-top:22px">${links}</div>`:''}
      ${PROJECTS.length>1?`<div class="d-nav">
        ${PROJECTS.length>2?`<button type="button" data-go="${prev.slug}">${arrowL}<span><small>Anterior</small>${esc(prev.title)}</span></button>`:'<span></span>'}
        <button type="button" data-go="${next.slug}"><span style="text-align:right"><small>Siguiente caso</small>${esc(next.title)}</span>${arrow}</button>
      </div>`:''}
    </div>`;
  const wasOpen=dlg.open;
  if(!wasOpen) dlg.showModal();
  dlg.scrollTop=0;
  if(from&&!wasOpen&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&dlg.animate){
    const a=from.getBoundingClientRect(),b=dlg.getBoundingClientRect();
    const c=(v,max)=>Math.min(Math.max(0,v),max);
    const t=c(a.top-b.top,b.height-40),bo=c(b.bottom-a.bottom,b.height-t-40),l=c(a.left-b.left,b.width-40),r=c(b.right-a.right,b.width-l-40);
    dlg.animate([
      {clipPath:`inset(${t}px ${r}px ${bo}px ${l}px round 18px)`,opacity:.7},
      {clipPath:'inset(0 0 0 0 round 24px)',opacity:1}
    ],{duration:440,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
  $('#dclose').onclick=()=>dlg.close();
  $$('[data-go]',dlg).forEach(b=>b.onclick=()=>openProject(b.dataset.go));
  $$('[data-t]',dlg).forEach(b=>b.onclick=()=>{dlg.close();state.tech=b.dataset.t;update();$('#proyectos').scrollIntoView({behavior:'smooth'})});
  if(!noHash) setHash('#p='+slug);
}
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
dlg.addEventListener('close',()=>{if(location.hash.startsWith('#p='))setHash(location.pathname+location.search)});
dlg.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    const cur=location.hash.slice(3),i=PROJECTS.findIndex(p=>p.slug===cur);
    if(i>=0)openProject(PROJECTS[(i+(e.key==='ArrowRight'?1:PROJECTS.length-1))%PROJECTS.length].slug);
  }
});

/* ---------- tema, progreso, navegación, copiar ---------- */
$('#theme').onclick=()=>{
  const root=document.documentElement;
  const dark=root.getAttribute('data-theme')==='dark'||(!root.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches);
  const nt=dark?'light':'dark';
  root.setAttribute('data-theme',nt);
  try{localStorage.setItem('jg-theme',nt)}catch(e){}
};
const bar=$('#progress');
addEventListener('scroll',()=>{
  const h=document.documentElement;
  bar.style.width=Math.min(100,(h.scrollTop/(h.scrollHeight-h.clientHeight||1))*100)+'%';
},{passive:true});
const secs=$$('main section[id]'),links=$$('nav.main a'),navCursor=$('#navCursor');
function moveNavCursor(){
  const active=links.find(a=>a.getAttribute('aria-current')==='true');
  if(!active){navCursor.classList.remove('show');return}
  const navBox=active.parentElement.getBoundingClientRect(),box=active.getBoundingClientRect();
  navCursor.style.width=box.width+'px';
  navCursor.style.transform=`translateX(${box.left-navBox.left}px)`;
  navCursor.classList.add('show');
}
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.setAttribute('aria-current',String(a.getAttribute('href')==='#'+e.target.id)))}});moveNavCursor()},{rootMargin:'-45% 0px -50% 0px'});
secs.forEach(s=>io.observe(s));
addEventListener('resize',moveNavCursor,{passive:true});
const menuBtn=$('#menuBtn'),mainNav=$('#mainnav');
function setMenu(open){
  mainNav.classList.toggle('open',open);
  menuBtn.setAttribute('aria-expanded',String(open));
  menuBtn.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
}
menuBtn.onclick=()=>setMenu(!mainNav.classList.contains('open'));
links.forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mainNav.classList.contains('open')){setMenu(false);menuBtn.focus()}});
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}
$('#copy').onclick=async()=>{
  const email='javigarcilop@gmail.com';
  try{await navigator.clipboard.writeText(email);toast('Email copiado')}catch(e){toast('No se pudo copiar. Escríbeme desde el botón azul.')}
};

/* ---------- trayectoria: cuatro etapas ---------- */
const pathEl=$('#path'),pathSum=$('#pathSum');
pathEl.innerHTML=PATH.steps.map((s,i)=>{
  const train=s.training.length
    ?`<div class="ps-block"><span class="ro-kind">Formación</span><ul class="ps-train">${s.training.map(t=>`<li><b>${esc(t.title)}</b><span>${esc(t.place)}</span><em>${esc(t.years)}</em></li>`).join('')}</ul></div>`
    :'';
  return `<li class="ps" style="--i:${i}">
    <span class="ps-num" aria-hidden="true">0${i+1}</span>
    <h3>${esc(s.name)}</h3>
    <p class="ps-ask">${esc(s.ask)}</p>
    ${train}
    <div class="ps-block"><span class="ro-kind">Cómo lo implemento</span><p>${esc(s.implement)}</p></div>
  </li>`;
}).join('');
pathSum.innerHTML=PATH.steps.map((x,j)=>`${j?'<span class="op" aria-hidden="true">+</span>':''}<span class="term">${esc(x.name)}</span>`).join('')
  +`<span class="op" aria-hidden="true">=</span><span class="total">${esc(PATH.result)}</span>`;

/* ---------- experiencia: entrada, titulares, hilo del recorrido y profundidad ---------- */
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* El texto visible se parte en piezas animables; el accesible queda entero en aria-label. */
function splitText(el,unit){
  const text=el.textContent.trim();
  el.setAttribute('aria-label',text);
  let k=0;
  el.innerHTML=text.split(' ').map(w=>{
    const inner=unit==='char'?[...w].map(c=>`<span class="ch" style="--i:${k++}">${esc(c)}</span>`).join(''):`<span class="wd-in" style="--i:${k++}">${esc(w)}</span>`;
    return `<span class="wd" aria-hidden="true">${inner}</span>`;
  }).join(' ');
}
splitText($('h1.title'),'char');
$$('h2.h, .path-title, .contact h2').forEach(h=>splitText(h,'word'));
document.documentElement.classList.add('intro');

$$('.reveal').forEach(s=>{
  $$(':scope :is(.sec-head > div > *, .wrap > :not(.sec-head, .path-head, .contact), .contact > *, .path-head > *)',s)
    .filter(el=>!el.hasAttribute('aria-label')||!el.querySelector('.wd'))
    .forEach((el,i)=>{
      el.classList.add('rv');el.style.setProperty('--rv',i);
      el.addEventListener('transitionend',function done(e){
        if(e.target!==el||e.propertyName!=='opacity')return;
        el.classList.remove('rv');el.style.removeProperty('--rv');el.removeEventListener('transitionend',done);
      });
    });
});
const revealIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');revealIO.unobserve(e.target)}}),{threshold:.12});
$$('.reveal').forEach(el=>revealIO.observe(el));


/* Foco de luz que sigue al puntero sobre las superficies interactivas */
if(!calm&&matchMedia('(hover: hover)').matches){
  document.addEventListener('pointermove',e=>{
    const el=e.target.closest?.('.card, .ps, .stack-detail');
    if(!el)return;
    const r=el.getBoundingClientRect();
    el.style.setProperty('--mx',(e.clientX-r.left)+'px');
    el.style.setProperty('--my',(e.clientY-r.top)+'px');
  },{passive:true});
}

/* ---------- desplazamiento suave a las secciones (no con CSS: ScrollTrigger lo necesita instantáneo al recalcular) ---------- */
document.addEventListener('click',e=>{
  const a=e.target.closest?.('a[href^="#"]');
  if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey)return;
  const id=a.getAttribute('href').slice(1);
  if(!id||id.startsWith('p='))return;
  const el=document.getElementById(id);
  if(!el)return;
  e.preventDefault();
  const y=id==='inicio'?0:el.getBoundingClientRect().top+scrollY-76;
  scrollTo({top:Math.max(0,y),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  try{history.replaceState(null,'','#'+id)}catch(err){}
});

/* ---------- arranque ---------- */
renderCats();renderGrid();renderStack();buildMap();
{
  let lw=$('#mapfull').clientWidth,lh=$('#mapfull').clientHeight,tm=null;
  new ResizeObserver(()=>{
    clearTimeout(tm);
    tm=setTimeout(()=>{
      const w=$('#mapfull').clientWidth,h=$('#mapfull').clientHeight;
      if(Math.abs(w-lw)>40||Math.abs(h-lh)>60){lw=w;lh=h;buildMap()}
    },250);
  }).observe($('#mapfull'));
}
if(location.hash.startsWith('#p='))openProject(location.hash.slice(3),true);
