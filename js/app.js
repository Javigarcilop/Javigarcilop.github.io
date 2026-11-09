/* Lógica del portfolio: filtros, tarjetas, mapa de red, detalle y navegación.
   Los datos (proyectos y tecnologías) están en data.js. */
/* ---------- utilidades ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const NS='http://www.w3.org/2000/svg';
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const arrowL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

/* ---------- estado y proyectos ---------- */
const state={tech:null};
function renderTechChip(){
  $('#techchip').classList.toggle('show',!!state.tech);
  $('#techname').textContent=state.tech||'';
}
function update(){renderTechChip();renderStack();markMap()}
function setTech(t,scroll){
  state.tech=(state.tech===t)?null:t;
  update();
  if(scroll&&state.tech) $('#mapa').scrollIntoView({behavior:'smooth',block:'start'});
}
$('#techclear').onclick=()=>{state.tech=null;update()};

/* ---------- stack ---------- */
const TIER_LABEL={pro:'Experiencia profesional',proj:'Proyectos propios'};
let stackSel=null;
function renderStack(focusT){
  const box=$('#stack-groups'); box.innerHTML='';
  ['Servidor','Frontend','IA y automatización','Herramientas'].forEach(g=>{
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
const MAP_HINT='Elige un proyecto para descubrir su historia. Usa los controles para acercarte y explorar la red.';
let MAP=null;
function buildMap(){
  const openSlug=!projectPanel.hidden?projectPanel.dataset.slug:null;
  const svg=$('#map'),W=Math.max(320,mapStage.clientWidth),H=Math.max(540,mapStage.clientHeight),mobile=W<=760;
  svg.replaceChildren();
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  $('#readout').hidden=true;
  $('#readout').removeAttribute('style');
  const techs=[...new Set(PROJECTS.flatMap(p=>p.stack))];
  const nodes=[...PROJECTS.map(p=>({id:p.slug,type:'p',label:p.short,p})),...techs.map(t=>({id:'t:'+t,type:'t',label:t,t}))];
  const idx=Object.fromEntries(nodes.map((n,i)=>[n.id,i]));
  const links=PROJECTS.flatMap(p=>p.stack.map(t=>[idx[p.slug],idx['t:'+t]]));
  PROJECTS.forEach((p,i)=>{
    const hub=nodes[idx[p.slug]];
    hub.x=mobile?W*.5:W*(.26+i*.48);hub.y=mobile?H*(.33+i*.31):H*.54;
    p.stack.forEach((t,k)=>{
      const n=nodes[idx['t:'+t]],angle=(-140+k*360/p.stack.length)*Math.PI/180;
      const radius=mobile?Math.min(118,W*.34):Math.min(W*.18,H*.31);
      if(n.x===undefined){n.x=hub.x+Math.cos(angle)*radius;n.y=hub.y+Math.sin(angle)*radius}
    });
  });
  const gE=document.createElementNS(NS,'g'),gN=document.createElementNS(NS,'g');svg.append(gE,gN);
  const edges=links.map(([i,j])=>{
    const a=nodes[i],b=nodes[j],el=document.createElementNS(NS,'line');
    el.setAttribute('class','edge');el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);el.setAttribute('x2',b.x);el.setAttribute('y2',b.y);gE.append(el);
    return {el,a:a.id,b:b.id,i,j};
  });
  nodes.forEach(n=>{
    const g=document.createElementNS(NS,'g'),isProject=n.type==='p';n.el=g;
    g.setAttribute('class','node '+n.type+(n.type==='t'&&TECH[n.t]==='IA y automatización'?' ia':''));
    g.style.transform=`translate(${n.x}px,${n.y}px)`;
    g.setAttribute('tabindex','0');g.setAttribute('role','button');
    g.setAttribute('aria-label',isProject?'Proyecto '+n.p.title+', abrir historia completa':'Tecnología '+n.t+', ver dónde la uso');
    if(isProject){g.setAttribute('aria-expanded','false');g.setAttribute('aria-controls','projectDetail')}
    g.innerHTML=isProject?`<rect class="hit" x="${mobile?-88:-120}" y="-42" width="${mobile?176:240}" height="110" rx="18"/><circle class="halo" r="40"/><circle class="core" r="28"/><text text-anchor="middle" y="${mobile?48:56}">${esc(n.label)}</text>`:`<rect class="hit" x="-48" y="-19" width="96" height="60" rx="12"/><circle class="dot" r="8"/><text text-anchor="middle" y="30">${esc(n.label)}</text>`;
    g.addEventListener('click',()=>{if(!MAP.justPanned)selectNode(n)});
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectNode(n)}});
    g.addEventListener('pointerenter',()=>highlight(MAP.selected||n.id));
    g.addEventListener('pointerleave',()=>MAP.selected?highlight(MAP.selected):markMap());
    g.addEventListener('focus',()=>highlight(MAP.selected||n.id));
    g.addEventListener('blur',()=>MAP.selected?highlight(MAP.selected):markMap());
    gN.append(g);
  });
  MAP={svg,nodes,edges,links,W,H,camera:{x:0,y:0,w:W,h:H},overview:null,selected:null,frame:0,justPanned:false};
  svg.classList.add('ready');svg.setAttribute('tabindex','0');
  let drag=null;
  svg.onpointerdown=e=>{
    const node=nodes.find(n=>n.el===e.target.closest('.node')),pan=mapStage.classList.contains('pan-enabled');
    if((node&&!pan)||e.button!==0||(e.pointerType!=='mouse'&&!pan))return;
    stopMapAnimation();MAP.justPanned=false;drag={x:e.clientX,y:e.clientY,camera:{...MAP.camera},node};
    svg.setPointerCapture(e.pointerId);svg.classList.add('is-panning');
  };
  svg.onpointermove=e=>{
    if(!drag)return;
    const rect=svg.getBoundingClientRect(),dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.hypot(dx,dy)>5)MAP.justPanned=true;
    applyMapCamera({...drag.camera,x:drag.camera.x-dx*drag.camera.w/rect.width,y:drag.camera.y-dy*drag.camera.h/rect.height});
  };
  svg.onpointerup=svg.onpointercancel=e=>{
    if(!drag)return;
    const clickedNode=!MAP.justPanned&&e.type==='pointerup'?drag.node:null;
    drag=null;svg.classList.remove('is-panning');if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
    if(clickedNode){MAP.justPanned=true;selectNode(clickedNode)}
    setTimeout(()=>{if(MAP)MAP.justPanned=false},0);
  };
  svg.onkeydown=e=>{
    const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
    if(d){e.preventDefault();moveMap(d[0],d[1])}
    if(e.key==='+'||e.key==='='){e.preventDefault();zoomMap(1.2)}
    if(e.key==='-'){e.preventDefault();zoomMap(1/1.2)}
    if(e.key==='Home'){e.preventDefault();resetMapView()}
  };
  if(openSlug)focusProjectNode(openSlug);else{applyMapCamera(MAP.camera);markMap()}
  syncProjectPicker();
}
function stopMapAnimation(){if(MAP?.frame){cancelAnimationFrame(MAP.frame);MAP.frame=0}}
function applyMapCamera(c){
  if(!MAP)return;
  MAP.camera={...c,x:Math.max(-MAP.W,Math.min(MAP.W*1.5,c.x)),y:Math.max(-MAP.H,Math.min(MAP.H*1.5,c.y))};
  const v=MAP.camera;MAP.svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.w} ${v.h}`);
  $('#mapZoomLevel').textContent=Math.round(MAP.W/v.w*100)+'%';
  $('#mapZoomIn').disabled=MAP.W/v.w>=2.59;$('#mapZoomOut').disabled=MAP.W/v.w<=.66;
  syncMapConnection();
  const selected=MAP.nodes.find(n=>n.id===MAP.selected);
  if(selected?.type==='t'&&!$('#readout').hidden)positionTechReadout(selected);
}
function animateMapCamera(target,travel=false){
  stopMapAnimation();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){applyMapCamera(target);return}
  const start={...MAP.camera},beg=performance.now();
  const frame=now=>{
    const t=Math.min(1,(now-beg)/(travel?720:480)),ease=1-Math.pow(1-t,3),c={};
    for(const key of ['x','y','w','h'])c[key]=start[key]+(target[key]-start[key])*ease;
    if(travel){const pull=Math.sin(Math.PI*t)*MAP.W*.1;c.x-=pull*.2;c.y-=pull*.5*MAP.H/MAP.W;c.w+=pull;c.h+=pull*MAP.H/MAP.W}
    applyMapCamera(c);MAP.frame=t<1?requestAnimationFrame(frame):0;
  };MAP.frame=requestAnimationFrame(frame);
}
function zoomMap(factor){
  if(!MAP)return;
  ensureMapVisible();
  const c=MAP.camera,z=Math.max(.65,Math.min(2.6,MAP.W/c.w*factor)),w=MAP.W/z,h=MAP.H/z;
  const mobile=mapStage.clientWidth<=760;
  const px=projectPanel.hidden ? .5 : mobile ? .5 : .23,py=projectPanel.hidden ? .5 : mobile ? 140/MAP.H : .5;
  animateMapCamera({x:c.x+(c.w-w)*px,y:c.y+(c.h-h)*py,w,h});
}
function ensureMapVisible(){
  const bounds=$('#mapa').getBoundingClientRect(),offset=$('header.top').offsetHeight+12;
  if(Math.abs(bounds.top-offset)>12)scrollTo({top:scrollY+bounds.top-offset,behavior:'auto'});
}
function moveMap(dx,dy){if(MAP){ensureMapVisible();const c=MAP.camera;animateMapCamera({...c,x:c.x+dx*c.w*.12,y:c.y+dy*c.h*.12})}}
function resetMapView(){
  if(!MAP)return;
  ensureMapVisible();
  closeProject(false,false);MAP.selected=null;MAP.nodes.forEach(n=>n.el.classList.remove('sel'));state.tech=null;renderTechChip();highlight(null);
  $('#readout').hidden=true;MAP.overview=null;animateMapCamera({x:0,y:0,w:MAP.W,h:MAP.H});syncProjectPicker();
}
function syncProjectPicker(){
  $$('#mapProjectPicker button').forEach(b=>b.setAttribute('aria-pressed',String(!projectPanel.hidden&&projectPanel.dataset.slug===b.dataset.project)));
}
function syncMapConnection(){
  if(!MAP||projectPanel.hidden)return;
  const n=MAP.nodes.find(n=>n.id===projectPanel.dataset.slug);if(!n)return;
  const pt=MAP.svg.createSVGPoint();pt.x=n.x;pt.y=n.y;
  const screen=pt.matrixTransform(MAP.svg.getScreenCTM()),bounds=mapStage.getBoundingClientRect(),panel=projectPanel.getBoundingClientRect(),mobile=bounds.width<=760;
  const x=screen.x-bounds.left,y=screen.y-bounds.top,tx=mobile?panel.left+panel.width/2-bounds.left:panel.left-bounds.left,ty=mobile?panel.top-bounds.top:Math.max(panel.top+55,Math.min(panel.bottom-35,screen.y))-bounds.top;
  $('#mapConnection').setAttribute('d',mobile?`M${x} ${y} L${tx} ${ty}`:`M${x} ${y} C${x+70} ${y},${tx-70} ${ty},${tx} ${ty}`);
}
function selectNode(n){
  ensureMapVisible();
  const box=$('#readout');
  if(n.type==='p'&&!projectPanel.hidden&&projectPanel.dataset.slug===n.id){closeProject();return}
  if(n.type==='t'){closeProject(false);box.hidden=false}
  if(MAP.selected===n.id&&n.type!=='p'){MAP.selected=null;MAP.nodes.forEach(x=>x.el.classList.remove('sel'));highlight(null);box.hidden=true;box.innerHTML='<p class="map-hint">'+MAP_HINT+'</p>';return}
  MAP.selected=n.id;
  MAP.nodes.forEach(x=>x.el.classList.toggle('sel',x===n));
  highlight(n.id);
  if(n.type==='p'){
    const p=n.p;
    box.hidden=true;
    box.innerHTML=`<span class="ro-kind">Proyecto · ${esc(p.status)}</span>
      <h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>
      <div class="ro-actions"><button type="button" class="btn primary sm" data-open="${esc(p.slug)}">Ver caso de estudio</button></div>`;
    openProject(p.slug,false,n.el);
  }else{
    const used=PROJECTS.filter(p=>p.stack.includes(n.t));
    box.innerHTML=`<button type="button" class="map-readout-close" aria-label="Cerrar detalle de tecnología">×</button><span class="ro-kind">${esc(TECH[n.t]||'Tecnología')}</span>
      <h3>${esc(n.t)}</h3><p>${esc(TECH_USE[n.t]||'')}</p>
      <div class="ro-actions">${used.map(p=>`<button type="button" class="btn ghost sm" data-open="${esc(p.slug)}">${esc(p.title)} →</button>`).join('')}</div>`;
    $('.map-readout-close',box).onclick=()=>{box.hidden=true;MAP.selected=null;MAP.nodes.forEach(x=>x.el.classList.remove('sel'));markMap()};
    positionTechReadout(n);
  }
  $$('[data-open]',box).forEach(b=>b.onclick=e=>openProject(b.dataset.open,false,e.currentTarget));
}
function positionTechReadout(n){
  const box=$('#readout');
  if(mapStage.clientWidth<=760){box.removeAttribute('style');return}
  const bounds=mapStage.getBoundingClientRect(),node=n.el.getBoundingClientRect(),width=Math.min(320,bounds.width-32);
  const x=node.left+node.width/2-bounds.left,y=node.top+node.height/2-bounds.top;
  box.style.width=width+'px';box.style.right='auto';box.style.bottom='auto';
  box.style.left=Math.max(16,Math.min(bounds.width-width-16,x+width+36<bounds.width?x+30:x-width-30))+'px';
  box.style.top=Math.max(95,Math.min(bounds.height-box.offsetHeight-78,y-box.offsetHeight/2))+'px';
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
const projectPanel=$('#projectDetail'),mapStage=$('#mapfull');
let caseObserver=null;
/* Cambia la URL sin recargar; algunos navegadores lo bloquean al abrir el archivo directamente (file://). */
function setHash(h){try{history.replaceState(null,'',h)}catch(e){}}
function openProject(slug,noHash,from){
  const i=PROJECTS.findIndex(p=>p.slug===slug); if(i<0)return;
  const p=PROJECTS[i],prev=PROJECTS[(i-1+PROJECTS.length)%PROJECTS.length],next=PROJECTS[(i+1)%PROJECTS.length];
  const switching=!projectPanel.hidden&&projectPanel.dataset.slug!==slug;
  caseObserver?.disconnect();
  const links=(p.links||[]).map(l=>`<a class="btn ${/demo/i.test(l.label)?'primary':'ghost'}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  const list=a=>`<ul>${(a||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  const diagram=(p.diagram||[]).map(([t,s],k)=>`${k?'<span class="arch-link"></span>':''}<span class="arch-node" style="--k:${k}"><b>${esc(t)}</b><small>${esc(s)}</small></span>`).join('');
  projectPanel.innerHTML=`
    <div class="map-project-bar"><button type="button" id="dclose" aria-label="Volver a la red">← Red</button><span class="map-project-count">${i+1} / ${PROJECTS.length}</span><button type="button" class="map-project-next" data-go="${esc(next.slug)}" aria-label="Ir al nodo ${esc(next.short)}">${esc(next.short)} →</button></div>
    <div class="d-body">
      <span class="status ${p.ok?'ok':''}"><i></i>${esc(p.status)}</span>
      <h2 id="d-title">${esc(p.title)}</h2>
      <div class="d-meta"><span>${esc(p.type)}</span><span>${esc(p.context)}</span></div>
      <p class="d-story-intro">Una idea por fuera. Todo un sistema por dentro.</p>
      <div class="case-grid">
        <section><span class="case-step" aria-hidden="true">01 / EL PUNTO DE PARTIDA</span><h3>Contexto</h3><p>${esc(p.context_long||p.context)}</p></section>
        <section><span class="case-step" aria-hidden="true">02 / LO QUE HABÍA QUE RESOLVER</span><h3>Problema</h3><p>${esc(p.problem||'')}</p></section>
        <section><span class="case-step" aria-hidden="true">03 / LO QUE CONSTRUÍ</span><h3>Solución</h3><p>${esc(p.solution||p.summary)}</p></section>
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
  projectPanel.hidden=false;
  projectPanel.dataset.slug=slug;
  mapStage.classList.add('project-open');
  focusProjectNode(slug,switching);
  projectPanel.scrollTop=0;
  ensureMapVisible();
  $('#d-title').tabIndex=-1;
  $('#d-title').focus({preventScroll:true});
  $('#dclose').onclick=()=>closeProject();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    caseObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('case-visible');caseObserver.unobserve(entry.target)}
    }),{root:projectPanel,threshold:.06});
    $$('.case-grid section, .arch, .decisions > div, .state-note',projectPanel).forEach((el,k)=>{
      el.classList.add('case-reveal');el.style.setProperty('--case-delay',(k%3)*65+'ms');caseObserver.observe(el);
    });
  }
  $$('[data-go]',projectPanel).forEach(b=>b.onclick=()=>openProject(b.dataset.go));
  $$('[data-t]',projectPanel).forEach(b=>b.onclick=()=>{closeProject(false);state.tech=b.dataset.t;update();$('#mapa').scrollIntoView({behavior:'smooth'})});
  if(!noHash) setHash('#p='+slug);
}
function focusProjectNode(slug,travel=false){
  if(!MAP)return;
  const n=MAP.nodes.find(n=>n.id===slug);if(!n)return;
  if(!MAP.overview)MAP.overview={...MAP.camera};
  MAP.selected=slug;
  MAP.nodes.forEach(x=>{x.el.classList.toggle('sel',x===n);if(x.type==='p')x.el.setAttribute('aria-expanded',String(x===n))});highlight(slug);
  const c=MAP.camera,mobile=mapStage.clientWidth<=760;
  animateMapCamera({...c,x:n.x-c.w*(mobile ? .5:.23),y:n.y-c.h*(mobile ? 140/MAP.H : .5)},travel);
  syncProjectPicker();syncMapConnection();
}
function closeProject(restoreFocus=true,restoreView=true){
  if(projectPanel.hidden)return;
  const slug=projectPanel.dataset.slug;
  caseObserver?.disconnect();projectPanel.hidden=true;mapStage.classList.remove('project-open');
  MAP?.nodes.forEach(n=>{if(n.type==='p')n.el.setAttribute('aria-expanded','false')});
  if(restoreView&&MAP?.overview)animateMapCamera(MAP.overview);
  if(MAP)MAP.overview=null;
  $('#readout').hidden=true;syncProjectPicker();
  if(location.hash.startsWith('#p='))setHash('#mapa');
  if(restoreFocus)MAP?.nodes.find(n=>n.id===slug)?.el.focus({preventScroll:true});
}

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!projectPanel.hidden){e.preventDefault();closeProject()}});

/* ---------- progreso y copiar ---------- */
const bar=$('#progress');
addEventListener('scroll',()=>{
  const h=document.documentElement;
  bar.style.width=Math.min(100,(h.scrollTop/(h.scrollHeight-h.clientHeight||1))*100)+'%';
},{passive:true});
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}
$('#copy').onclick=async()=>{
  const email='javigarcilop@gmail.com';
  try{await navigator.clipboard.writeText(email);toast('Email copiado')}catch(e){toast('No se pudo copiar. Escríbeme desde el botón azul.')}
};

/* La trayectoria (antes aquí, como tarjetas .ps) ahora vive en el túnel: ver js/tunnel.js y js/tunnel-stops.json */

/* ---------- experiencia: entrada, titulares, hilo del recorrido y profundidad ---------- */
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* El texto visible se parte en piezas animables; el accesible queda entero en aria-label. */
function splitText(el,unit){
  if(!el)return;
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
    const el=e.target.closest?.('.ps, .stack-detail');
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
  const y=id==='inicio'?0:el.getBoundingClientRect().top+scrollY-$('header.top').offsetHeight-12;
  const jump=a.hasAttribute('data-jump');
  scrollTo({top:Math.max(0,y),behavior:jump||matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  if(jump){el.setAttribute('tabindex','-1');el.focus({preventScroll:true})}
  try{history.replaceState(null,'','#'+id)}catch(err){}
});

/* ---------- controles del mapa y arranque ---------- */
$('#mapProjectPicker').innerHTML=PROJECTS.map(p=>`<button type="button" data-project="${esc(p.slug)}" aria-pressed="false"><i></i>${esc(p.short)}</button>`).join('');
$$('#mapProjectPicker button').forEach(b=>b.onclick=()=>openProject(b.dataset.project));
$('#mapZoomIn').onclick=()=>zoomMap(1.2);$('#mapZoomOut').onclick=()=>zoomMap(1/1.2);$('#mapFit').onclick=resetMapView;
$('#mapPan').onclick=()=>{ensureMapVisible();const on=mapStage.classList.toggle('pan-enabled');$('#mapPan').setAttribute('aria-pressed',String(on))};
document.addEventListener('tunnel:ready',()=>{
  if(location.hash==='#mapa'||location.hash.startsWith('#p='))requestAnimationFrame(()=>{ensureMapVisible();syncMapConnection()});
});
renderStack();buildMap();
let mapResizeTimer;
new ResizeObserver(()=>{
  clearTimeout(mapResizeTimer);mapResizeTimer=setTimeout(()=>{if(MAP&&(Math.abs(mapStage.clientWidth-MAP.W)>2||Math.abs(mapStage.clientHeight-MAP.H)>2)){stopMapAnimation();buildMap()}},150);
}).observe(mapStage);
if(location.hash.startsWith('#p='))openProject(location.hash.slice(3),true);
