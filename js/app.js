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
    const hay=(p.title+' '+p.type+' '+p.context+' '+p.summary+' '+p.stack.join(' ')+' '+p.cats.join(' ')).toLowerCase();
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
        <span class="status ${p.ok?'ok':''}"><i></i>${esc(p.status)}</span>
        <h3>${esc(p.title)}</h3>
        <span class="meta">${esc(p.type)} · ${esc(p.context)}</span>
        <p class="sum">${esc(p.summary)}</p>
        <span class="tags">${tags}</span>
        <span class="more-link">Ver proyecto ${arrow}</span>
      </span>`.replace(' · ',' – ');
    b.onclick=()=>openProject(p.slug);
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
function renderStack(){
  const groups={};
  Object.entries(TECH).forEach(([t,g])=>{
    const n=PROJECTS.filter(p=>p.stack.includes(t)).length;
    if(n) (groups[g]=groups[g]||[]).push([t,n]);
  });
  const box=$('#stack-groups'); box.innerHTML='';
  ['Backend','Frontend','IA y automatización','Herramientas','Diseño'].forEach(g=>{
    if(!groups[g]) return;
    const d=document.createElement('div');
    d.innerHTML=`<h3>${g}</h3><div class="stack-list"></div>`;
    groups[g].sort((a,b)=>b[1]-a[1]).forEach(([t,n])=>{
      const b=document.createElement('button');
      b.type='button'; b.className='tech'; b.setAttribute('aria-pressed',String(state.tech===t));
      b.innerHTML=`${esc(t)} <b>${n}</b>`;
      if(state.tech===t) b.style.borderColor='var(--blue)';
      b.onclick=()=>setTech(t,true);
      $('.stack-list',d).appendChild(b);
    });
    box.appendChild(d);
  });
}

/* ---------- mapa interactivo ---------- */
let MAP=null;
function buildMap(){
  const svg=$('#map'); svg.innerHTML='';
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
  const W=640,H=540,padX=78,padY=50;
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
  const minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys);
  const s=Math.min((W-2*padX)/(maxx-minx||1),(H-2*padY)/(maxy-miny||1));
  const cx=(minx+maxx)/2,cy=(miny+maxy)/2;
  nodes.forEach(n=>{n.X=W/2+(n.x-cx)*s;n.Y=H/2+(n.y-cy)*s});
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

  const gE=document.createElementNS(NS,'g'),gN=document.createElementNS(NS,'g');
  svg.append(gE,gN);
  const edges=links.map(([i,j])=>{
    const a=nodes[i],b=nodes[j];
    const l=document.createElementNS(NS,'line');
    l.setAttribute('class','edge');l.setAttribute('x1',a.X);l.setAttribute('y1',a.Y);l.setAttribute('x2',b.X);l.setAttribute('y2',b.Y);
    gE.appendChild(l);return {el:l,a:a.id,b:b.id};
  });
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  nodes.forEach((n,k)=>{
    const g=document.createElementNS(NS,'g');
    const isIA=n.type==='t'&&TECH[n.t]==='IA y automatización';
    g.setAttribute('class','node '+n.type+(isIA?' ia':''));
    g.setAttribute('tabindex','0');g.setAttribute('role','button');
    g.setAttribute('aria-label',n.type==='p'?'Proyecto '+n.p.title:'Tecnología '+n.t+', filtrar proyectos');
    g.style.transitionDelay=reduce?'0s':(k*25)+'ms';
    g.style.transform=reduce?`translate(${n.X}px,${n.Y}px)`:`translate(${W/2}px,${H/2}px)`;
    if(n.type==='p'){
      g.innerHTML=`<circle class="halo" r="26"/><circle class="core" r="15"/><text text-anchor="middle" y="34">${esc(n.label)}</text>`;
    }else{
      g.innerHTML=`<circle r="6"/><text text-anchor="middle" y="21">${esc(n.label)}</text>`;
    }
    gN.appendChild(g);n.el=g;
    const on=()=>highlight(n.id),off=()=>highlight(null);
    g.addEventListener('pointerenter',on);g.addEventListener('pointerleave',off);
    g.addEventListener('focus',on);g.addEventListener('blur',off);
    const act=()=>{n.type==='p'?openProject(n.p.slug):setTech(n.t,true)};
    g.addEventListener('click',act);
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act()}});
  });
  MAP={svg,nodes,edges,links};
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    nodes.forEach(n=>{n.el.style.transform=`translate(${n.X}px,${n.Y}px)`});
    setTimeout(()=>svg.classList.add('ready'),reduce?0:750);
  }));
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
  if(!state.tech){svg.classList.remove('has-active');nodes.forEach(n=>n.el.classList.remove('on'));edges.forEach(e=>e.el.classList.remove('on'));return}
  highlight('t:'+state.tech);
}

/* ---------- detalle de proyecto ---------- */
const dlg=$('#dlg');
/* Cambia la URL sin recargar; algunos navegadores lo bloquean al abrir el archivo directamente (file://). */
function setHash(h){try{history.replaceState(null,'',h)}catch(e){}}
function openProject(slug,noHash){
  const i=PROJECTS.findIndex(p=>p.slug===slug); if(i<0)return;
  const p=PROJECTS[i],prev=PROJECTS[(i-1+PROJECTS.length)%PROJECTS.length],next=PROJECTS[(i+1)%PROJECTS.length];
  const links=(p.links||[]).map(l=>`<a class="btn ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  dlg.innerHTML=`
    <div class="d-art">${cover(p,640,190)}<button class="icon-btn d-close" type="button" aria-label="Cerrar" id="dclose"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="d-body">
      <span class="status ${p.ok?'ok':''}"><i></i>${esc(p.status)}</span>
      <h2 id="d-title">${esc(p.title)}</h2>
      <div class="d-meta"><span>${esc(p.type)}</span><span>${esc(p.context)}</span></div>
      <p>${esc(p.summary)}</p>
      <h3>Qué hice</h3>
      <ul>${p.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>
      <h3>Tecnologías</h3>
      <div class="d-tags">${p.stack.map(t=>`<button type="button" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      ${links?`<div class="cta" style="margin-top:22px">${links}</div>`:''}
      <div class="d-nav">
        <button type="button" data-go="${prev.slug}">${arrowL}<span><small>Anterior</small>${esc(prev.title)}</span></button>
        <button type="button" data-go="${next.slug}"><span style="text-align:right"><small>Siguiente</small>${esc(next.title)}</span>${arrow}</button>
      </div>
    </div>`;
  if(!dlg.open) dlg.showModal();
  dlg.scrollTop=0;
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
const secs=$$('main section[id]'),links=$$('nav.main a');
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.setAttribute('aria-current',String(a.getAttribute('href')==='#'+e.target.id)))}})},{rootMargin:'-45% 0px -50% 0px'});
secs.forEach(s=>io.observe(s));
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}
$('#copy').onclick=async()=>{
  const url='https://www.linkedin.com/in/francisco-javier-garcia-lopez';
  try{await navigator.clipboard.writeText(url);toast('Enlace copiado')}catch(e){toast('No se pudo copiar. Abre el perfil desde el botón azul.')}
};

/* ---------- arranque ---------- */
renderCats();renderGrid();renderStack();buildMap();
if(location.hash.startsWith('#p='))openProject(location.hash.slice(3),true);
