/* Viaje por la trayectoria: un túnel de carretera que termina en la luz del día (GSAP ScrollTrigger).
   MODO CINE (principal): si existe assets/cine/manifest.json, el scroll recorre una secuencia de fotogramas renderizada con
   Blender (Cycles, hormigón y asfalto PBR, cielo HDRI; ver tools/cine). El texto de cada cartel es HTML real proyectado sobre
   el cartel renderizado. Si no hay fotogramas, se usa la escena Three.js en tiempo real que describe el resto de este bloque.
   Marketing → Diseño → Código → Product Engineering e IA dentro del túnel; el resultado, en un cartel ya fuera, a plena luz.
   - Túnel: tubo de hormigón, carretera con marcas viales, lámparas de techo con charcos de luz, catadióptricos, salidas de
     emergencia, ventiladores y niebla. Cada etapa es un pórtico sobre la carretera con el número pintado en el asfalto.
   - Salida: la boca del túnel enmarca el exterior; la exposición se adapta, crece el resplandor y se pasa al día: cielo con
     sol, colinas, montañas, árboles y quitamiedos.
   - Cámara recta a la altura de los ojos; el ratón solo la inclina de forma sutil (lerp .05). Al final acelera hacia delante.
   - Texto de los pórticos en una escena aparte, sin niebla ni brillo encima, y panel HTML accesible (visible en móvil vertical).
   - Postprocesado suave en escritorio (bloom). En móvil, render directo más ligero.
   - Three.js y los addons se cargan diferidos cuando la página ya es interactiva.
   - Sin WebGL, sin GSAP, con movimiento reducido o ahorro de datos: hero estático y legible. */

const tunnel=document.querySelector('.tunnel');
if(tunnel)start();

function start(){
  const pin=document.getElementById('tunnelPin'),canvas=document.getElementById('tunnelCanvas');
  const copy=document.getElementById('tunnelCopy'),hint=document.getElementById('tunnelHint'),stageEl=document.getElementById('tunnelStage');
  const G=window.gsap,ST=window.ScrollTrigger;
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer: coarse)').matches;
  const saveData=!!navigator.connection?.saveData;

  const webgl=(()=>{
    try{
      const c=document.createElement('canvas'),gl=c.getContext('webgl2')||c.getContext('webgl');
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return !!gl;
    }catch(e){return false}
  })();
  const full=webgl&&!!G&&!!ST&&!calm&&!saveData;
  if(!full)tunnel.classList.add('calm');

  /* Cabecera clara mientras el fondo es oscuro (sin lecturas de layout dentro del scroll) */
  let span=1;
  const headerState=()=>document.body.classList.toggle('on-tunnel',scrollY<span*.78);
  const measure=()=>{span=full?Math.max(1,tunnel.offsetHeight-innerHeight):innerHeight;headerState()};
  addEventListener('scroll',headerState,{passive:true});
  addEventListener('resize',measure,{passive:true});
  measure();

  const P={p:full?0:.05,out:0};

  /* Guion del scroll: el título se acerca y se desvanece, la cámara recorre las etapas y todo se funde hacia la web */
  let tl=null;
  if(full){
    G.registerPlugin(ST);
    ST.config({ignoreMobileResize:true});
    tl=G.timeline({
      defaults:{ease:'none'},
      scrollTrigger:{
        trigger:tunnel,start:'top top',end:'bottom bottom',scrub:.9,
        onUpdate:self=>{copy.style.pointerEvents=self.progress>.03?'none':''}
      }
    });
    tl.to(P,{p:1,duration:.76},0)
      .fromTo(copy,{scale:1,opacity:1},{scale:1.35,opacity:0,ease:'power2.in',duration:.06,force3D:true},0)
      .to(hint,{opacity:0,duration:.02},0)
      .to(P,{out:1,ease:'power2.inOut',duration:.15},.78)
      .to(pin,{opacity:0,ease:'power1.inOut',duration:.08},.91)
      .to({},{duration:.01},.99);
  }

  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  /* Panel de cada etapa: texto real en HTML */
  const stageHTML=k=>{
    if(typeof PATH==='undefined')return '';
    if(k>PATH.steps.length)return '<div class="ts-main"><p class="ts-kicker">El resultado</p><h2 class="ts-title">'+esc(PATH.result)+'</h2><p class="ts-ask">Javier García · Desarrollo Full Stack</p></div>';
    const s=PATH.steps[k-1];
    const train=s.training.length?'<div class="ts-card"><h3>Formación</h3><ul>'+s.training.map(t=>'<li><b>'+esc(t.title)+'</b><span>'+esc(t.place)+' · '+esc(t.years)+'</span></li>').join('')+'</ul></div>':'';
    return '<div class="ts-main"><p class="ts-kicker">Etapa 0'+k+' de 0'+PATH.steps.length+'</p><h2 class="ts-title">'+esc(s.name)+'</h2><p class="ts-ask">'+esc(s.ask)+'</p></div>'
      +'<div class="ts-cards">'+train+'<div class="ts-card"><h3>Cómo lo implemento</h3><p>'+esc(s.implement)+'</p></div></div>';
  };
  let stage=0,swapTimer=0;
  const setStage=k=>{
    if(!stageEl||k===stage)return;
    stage=k;
    clearTimeout(swapTimer);
    stageEl.classList.remove('on');
    if(k===0){stageEl.setAttribute('aria-hidden','true');return}
    swapTimer=setTimeout(()=>{stageEl.innerHTML=stageHTML(k);stageEl.setAttribute('aria-hidden','false');stageEl.classList.add('on')},stageEl.innerHTML?200:0);
  };


  if(saveData)return;

  /* Carga diferida de Three.js: no compite con el primer pintado ni con la interactividad */
  const idle=cb=>('requestIdleCallback' in window)?requestIdleCallback(cb,{timeout:1800}):setTimeout(cb,400);
  const boot=()=>idle(async()=>{
    try{
      let THREE,post=null;
      try{THREE=await import('three')}catch(e){THREE=await import('../assets/vendor/three.module.min.js')}
      if(!coarse){
        try{
          const base='../assets/vendor/three-addons/';
          const [a,b,c,d]=await Promise.all([
            import(base+'postprocessing/EffectComposer.js'),import(base+'postprocessing/RenderPass.js'),
            import(base+'postprocessing/UnrealBloomPass.js'),import(base+'postprocessing/OutputPass.js')
          ]);
          post={EffectComposer:a.EffectComposer,RenderPass:b.RenderPass,UnrealBloomPass:c.UnrealBloomPass,OutputPass:d.OutputPass};
        }catch(e){post=null}
      }
      await build(THREE,post);
    }catch(e){tunnel.classList.add('nogl')}
  });
  const goThree=()=>{if(!webgl)return;if(document.readyState==='complete')boot();else addEventListener('load',boot,{once:true})};
  if(!full){goThree();return}
  /* Modo cine: secuencia de fotogramas renderizada con Blender (Cycles) y reproducida con el scroll */
  fetch('assets/cine/manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
    .then(m=>{if(!(m&&startCine(m)))goThree()});

  /* ---------- Modo cine ----------
     Los fotogramas se renderizaron con Blender (Cycles, hormigón y asfalto PBR, cielo HDRI): el scroll los recorre con una
     interpolación suave. El texto de cada cartel es HTML real, proyectado sobre el cartel renderizado. */
  function startCine(m){
    if(!m||!m.n||!m.d||m.d.length!==m.n)return false;
    const SEG=m.stops.length,S=m.S,EXTRA=m.extra,CAMY=m.boardY,BWM=m.boardW,BHM=m.boardH,BCZ=m.boardZ-m.eye;
    const clamp=(v,a,b)=>v<a?a:v>b?b:v;
    const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
    const ease=t=>{t=clamp((t-.14)/.72,0,1);return t*t*(3-2*t)};
    const dist=()=>{
      const u=clamp(P.p,0,1)*SEG,k=Math.min(SEG-1,Math.floor(u));
      return S*k+S*ease(u-k)+EXTRA*P.out;
    };

    const wrap=document.createElement('div');wrap.className='tunnel-canvas cine';wrap.setAttribute('aria-hidden','true');
    const cv=document.createElement('canvas');wrap.appendChild(cv);
    const boardsEl=document.createElement('div');boardsEl.className='cine-boards';
    const boardEls=[];
    for(let k=1;k<=SEG;k++){
      const el=document.createElement('div');el.className='cine-board';el.innerHTML=cineBoardHTML(k);
      boardsEl.appendChild(el);boardEls.push(el);
    }
    wrap.appendChild(boardsEl);
    pin.insertBefore(wrap,canvas);canvas.hidden=true;
    const ctx=cv.getContext('2d',{alpha:false});

    /* Carga progresiva: primero el inicio y las paradas, después de menos a más densidad */
    const imgs=new Array(m.n),have=new Uint8Array(m.n);
    const url=i=>m.dir+'/f_'+String(i).padStart(4,'0')+'.'+m.ext;
    const order=[],seen=new Set();
    const push=i=>{if(i>=0&&i<m.n&&!seen.has(i)){seen.add(i);order.push(i)}};
    push(0);
    m.stops.forEach(sd=>{let b=0;m.d.forEach((v,i)=>{if(Math.abs(v-sd)<Math.abs(m.d[b]-sd))b=i});push(b)});
    for(const st of [8,4,2,1])for(let i=0;i<m.n;i+=st)push(i);
    let dirty=true,qi=0,live=0,firstShown=false;
    const pump=()=>{
      while(live<4&&qi<order.length){
        const i=order[qi++],im=new Image();live++;
        im.decoding='async';
        im.onload=()=>{live--;imgs[i]=im;have[i]=1;dirty=true;if(i===0&&!firstShown){firstShown=true;tunnel.classList.add('ready')}pump()};
        im.onerror=()=>{live--;pump()};
        im.src=url(i);
      }
    };

    const nearest=(i,dir)=>{for(let j=i;j>=0&&j<m.n;j+=dir)if(have[j])return j;return -1};
    let W=1,H=1,dom=false,lastD=-1,lastPx=1e9,lastPy=1e9;
    const resize=()=>{
      const w=Math.max(1,pin.clientWidth),h=Math.max(1,pin.clientHeight),pr=Math.min(devicePixelRatio||1,1.5);
      W=Math.round(w*pr);H=Math.round(h*pr);cv.width=W;cv.height=H;
      dom=w/h<.8;tunnel.classList.toggle('dom-text',dom);
      dirty=true;
    };
    const ro=new ResizeObserver(resize);ro.observe(pin);resize();

    /* Ratón: parallax mínimo y con inercia, sin inclinar la imagen */
    const pan={x:0,y:0},ndc={x:0,y:0};let pointerIn=false;
    if(!coarse){
      pin.addEventListener('pointermove',e=>{
        const r=pin.getBoundingClientRect();
        ndc.x=((e.clientX-r.left)/r.width)*2-1;ndc.y=-(((e.clientY-r.top)/r.height)*2-1);pointerIn=true;
      },{passive:true});
      pin.addEventListener('pointerleave',()=>{pointerIn=false},{passive:true});
    }

    /* Proyección del cartel con la cámara de Blender (24 mm, sensor 36 mm, inclinada 0,7° hacia arriba) */
    const tanH=18/24,tanV=tanH*m.h/m.w;
    /* inclinación de plano de cine: sube al acercarse al cartel para encuadrarlo entero (igual que en el render) */
    const pitchAt=yb=>m.pitch+m.tilt*smooth(22,12,yb)*(1-smooth(6,0,yb));
    const proj=(X,Y,Z,th)=>{
      const cs=Math.cos(th),sn=Math.sin(th),dp=Y*cs+Z*sn,up=-Y*sn+Z*cs;
      return dp<.3?null:[.5+.5*(X/dp)/tanH,.5-.5*(up/dp)/tanV];
    };
    const place=(d,sc,ox,oy,iw,ih)=>{
      let shown=-1;
      for(let k=1;k<=SEG;k++){
        const Yb=k*S+CAMY-d;
        if(Yb>1){shown=k;break}
      }
      boardEls.forEach((el,i)=>{
        const k=i+1;
        if(dom||k!==shown){if(el.dataset.on==='1'){el.dataset.on='0';el.style.opacity='0'}return}
        const Yf=k*S+CAMY-d-.11;
        const th=pitchAt(k*S+CAMY-d)*Math.PI/180;
        const a=proj(-BWM/2,Yf,BCZ+BHM/2,th),b=proj(BWM/2,Yf,BCZ-BHM/2,th);
        if(!a||!b){el.style.opacity='0';return}
        const x0=ox+a[0]*iw*sc,y0=oy+a[1]*ih*sc,x1=ox+b[0]*iw*sc,y1=oy+b[1]*ih*sc;
        const bd=k*S+CAMY-d,reveal=clamp(smooth(46,15,bd)*1.15,0,1),op=smooth(2,9,bd)*(reveal>0?1:0);
        el.dataset.on=op>.01?'1':'0';
        el.style.cssText='left:'+x0.toFixed(1)+'px;top:'+y0.toFixed(1)+'px;width:'+(x1-x0).toFixed(1)+'px;height:'+(y1-y0).toFixed(1)+'px;opacity:'+op.toFixed(3)+';clip-path:inset(0 '+((1-reveal)*100).toFixed(1)+'% 0 0)';
      });
    };

    const render=()=>{
      const d=dist();
      pan.x+=((pointerIn?ndc.x:0)-pan.x)*.05;pan.y+=((pointerIn?ndc.y:0)-pan.y)*.05;
      const px=pan.x*10,py=-pan.y*6;
      if(Math.abs(px-lastPx)>.02||Math.abs(py-lastPy)>.02){wrap.style.transform='translate3d('+px.toFixed(2)+'px,'+py.toFixed(2)+'px,0) scale(1.035)';lastPx=px;lastPy=py}
      const k=Math.round(P.p*SEG);
      setStage(k>=1&&k<=SEG&&Math.abs(P.p*SEG-k)<.3?k:0);
      if(!dirty&&Math.abs(d-lastD)<.0005)return;
      lastD=d;dirty=false;
      /* fotogramas vecinos cargados y mezcla según la distancia */
      let lo=0,hi=m.n-1;
      while(hi-lo>1){const mid=(lo+hi)>>1;if(m.d[mid]<=d)lo=mid;else hi=mid}
      const a=nearest(lo,-1),b=nearest(hi,1),fa=a<0?b:a,fb=b<0?a:b;
      if(fa<0)return;
      const A=imgs[fa],iw=A.naturalWidth,ih=A.naturalHeight,sc=Math.max(W/iw,H/ih),ox=(W-iw*sc)/2,oy=(H-ih*sc)/2;
      ctx.imageSmoothingQuality='high';
      ctx.globalAlpha=1;ctx.drawImage(A,ox,oy,iw*sc,ih*sc);
      if(fb!==fa){
        const t=clamp((d-m.d[fa])/(m.d[fb]-m.d[fa]),0,1);
        if(t>.002){ctx.globalAlpha=t;ctx.drawImage(imgs[fb],ox,oy,iw*sc,ih*sc);ctx.globalAlpha=1}
      }
      /* el texto del cartel se coloca en píxeles CSS (el lienzo puede tener más densidad) */
      const r=W/Math.max(1,pin.clientWidth);
      place(d,sc/r,ox/r,oy/r,iw,ih);
    };

    let visible=true;
    const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:0});io.observe(tunnel);
    G.ticker.add(()=>{if(visible)render()});
    pump();
    window.tunnelScene={destroy(){io.disconnect();ro.disconnect()}};
    return true;
  }

  /* Contenido de cada cartel (HTML real, accesible desde el panel de etapa) */
  function cineBoardHTML(k){
    if(typeof PATH==='undefined')return '';
    if(k>PATH.steps.length)return '<div class="cb-main cb-end"><p class="cb-kicker">El resultado</p><h3 class="cb-title">'+esc(PATH.result)+'</h3><p class="cb-ask">Javier García · Desarrollo Full Stack</p></div>';
    const s=PATH.steps[k-1];
    const train=s.training.length?'<div class="cb-card"><h4>Formación</h4><ul>'+s.training.map(t=>'<li><b>'+esc(t.title)+'</b><span>'+esc(t.place)+' · '+esc(t.years)+'</span></li>').join('')+'</ul></div>':'';
    return '<div class="cb-main"><p class="cb-kicker">Etapa 0'+k+' de 0'+PATH.steps.length+'</p><h3 class="cb-title">'+esc(s.name)+'</h3><p class="cb-ask">'+esc(s.ask)+'</p></div>'
      +'<div class="cb-cards">'+train+'<div class="cb-card"><h4>Cómo lo implemento</h4><p>'+esc(s.implement)+'</p></div></div>';
  }

  async function build(THREE,post){
    const FOV=62,SEG=5,S=46,R=7,EYE=-2,ROAD=-3.6,EXTRA=60;
    const ZEND=SEG*S,L=ZEND+300,TEND=220,LT=TEND+30;
    const clamp=(v,a,b)=>v<a?a:v>b?b:v;
    const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

    let renderer;
    try{renderer=new THREE.WebGLRenderer({canvas,antialias:!coarse&&!post,alpha:false,powerPreference:'high-performance'})}
    catch(e){tunnel.classList.add('nogl');return}
    renderer.setClearColor(0x0d0f12,1);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1;
    renderer.autoClear=false;
    const maxAniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());

    const scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x0d0f12,.0135);
    const camera=new THREE.PerspectiveCamera(FOV,1,.1,1300);
    camera.position.set(0,EYE,0);
    scene.add(camera);
    let baseFov=FOV;
    const disposables=[];
    const track=o=>(disposables.push(o),o);
    const SRGB=THREE.SRGBColorSpace;
    let seed=20260929;
    const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};

    /* Color progresivo de la luz: blanco frío → azul → cian a lo largo del viaje */
    const slate=new THREE.Color(0xdfe8ff),blue=new THREE.Color(0x6f9bff),cyan=new THREE.Color(0x5fe0ff);
    const tint=(t,out)=>t<.62?out.copy(slate).lerp(blue,t/.62):out.copy(blue).lerp(cyan,(t-.62)/.38);
    const progress=z=>clamp(-z/ZEND,0,1);

    /* Texturas generadas en canvas: hormigón y asfalto con marcas viales */
    const canvasTex=(w,h,paint,srgb,wrap)=>{
      const c=document.createElement('canvas');c.width=w;c.height=h;
      paint(c.getContext('2d'),w,h);
      const t=new THREE.CanvasTexture(c);
      if(wrap){t.wrapS=t.wrapT=THREE.RepeatWrapping}
      t.anisotropy=maxAniso;
      if(srgb)t.colorSpace=SRGB;
      return track(t);
    };
    const speckle=(x,w,h,n,base,alpha)=>{
      for(let i=0;i<n;i++){
        const v=base+(rnd()*70|0);
        x.fillStyle='rgba('+v+','+(v+3)+','+(v+12)+','+alpha+')';
        x.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1+rnd()*3);
      }
    };
    const concrete=canvasTex(512,512,(x,w,h)=>{
      x.fillStyle='#69717f';x.fillRect(0,0,w,h);
      speckle(x,w,h,14000,70,.08);speckle(x,w,h,6000,30,.1);
      for(let i=0;i<10;i++){const gx=rnd()*w,gr=x.createLinearGradient(gx,0,gx+30,h);gr.addColorStop(0,'rgba(20,26,40,0)');gr.addColorStop(.5,'rgba(20,26,40,.12)');gr.addColorStop(1,'rgba(20,26,40,0)');x.fillStyle=gr;x.fillRect(gx,0,30,h)}
      x.fillStyle='rgba(18,22,32,.55)';x.fillRect(0,0,3,h);x.fillRect(0,0,w,3);
    },true,true);
    const concreteBump=canvasTex(512,512,(x,w,h)=>{
      x.fillStyle='#808080';x.fillRect(0,0,w,h);speckle(x,w,h,16000,60,.18);
      x.fillStyle='#202020';x.fillRect(0,0,3,h);x.fillRect(0,0,w,3);
    },false,true);
    const asphalt=canvasTex(512,512,(x,w,h)=>{
      x.fillStyle='#1c212b';x.fillRect(0,0,w,h);
      speckle(x,w,h,16000,24,.14);
      x.fillStyle='#d3dae9';x.fillRect(14,0,8,h);x.fillRect(w-22,0,8,h);
      x.fillStyle='#e7c64e';x.fillRect(w/2-4,0,8,h*.4);
    },true,true);
    const tiled=(base,rx,ry)=>{const t=track(base.clone());t.repeat.set(rx,ry);t.needsUpdate=true;return t};

    /* Entorno: cielo oscuro con tiras de luz, para que el asfalto tenga un brillo húmedo */
    const pmrem=new THREE.PMREMGenerator(renderer);
    const ec=document.createElement('canvas');ec.width=512;ec.height=256;
    const ex=ec.getContext('2d'),eg=ex.createLinearGradient(0,0,0,256);
    eg.addColorStop(0,'#1d2f66');eg.addColorStop(.5,'#0b1226');eg.addColorStop(1,'#04060c');
    ex.fillStyle=eg;ex.fillRect(0,0,512,256);
    ex.fillStyle='rgba(220,232,255,.95)';for(let i=0;i<8;i++)ex.fillRect(i*64+18,60,30,8);
    const envSrc=new THREE.CanvasTexture(ec);envSrc.mapping=THREE.EquirectangularReflectionMapping;envSrc.colorSpace=SRGB;
    const envRT=pmrem.fromEquirectangular(envSrc);
    scene.environment=envRT.texture;scene.environmentIntensity=.4;
    envSrc.dispose();pmrem.dispose();

    /* Tubo de hormigón (por dentro) y carretera */
    const zc=-(L/2)+30;
    const shell=new THREE.Mesh(
      track(new THREE.CylinderGeometry(R,R,LT,56,1,true).rotateX(Math.PI/2)),
      track(new THREE.MeshStandardMaterial({map:tiled(concrete,10,LT/12),bumpMap:tiled(concreteBump,10,LT/12),bumpScale:1.2,color:0xffffff,roughness:.94,metalness:0,side:THREE.BackSide}))
    );
    shell.position.z=-(TEND-30)/2;scene.add(shell);
    const RW=11.6;
    const road=new THREE.Mesh(
      track(new THREE.PlaneGeometry(RW,L).rotateX(-Math.PI/2)),
      track(new THREE.MeshStandardMaterial({map:tiled(asphalt,1,L/12),roughness:.62,metalness:.08}))
    );
    road.position.set(0,ROAD,zc);scene.add(road);

    /* Lámparas de techo y charcos de luz en el asfalto */
    const GAP=12,nL=Math.ceil(LT/GAP);
    const lampGeo=track(new THREE.BoxGeometry(1,1,1));
    const lamps=new THREE.InstancedMesh(lampGeo,track(new THREE.MeshBasicMaterial({color:0xffffff})),nL*2);
    const poolGeo=track(new THREE.PlaneGeometry(9,15).rotateX(-Math.PI/2));
    const poolTex=canvasTex(128,128,(x)=>{
      const g=x.createRadialGradient(64,64,0,64,64,64);
      g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.45,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=g;x.fillRect(0,0,128,128);
    },false,false);
    const pools=new THREE.InstancedMesh(poolGeo,track(new THREE.MeshBasicMaterial({map:poolTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5,fog:true})),nL*2);
    const dummy=new THREE.Object3D(),col=new THREE.Color(),white=new THREE.Color(1,1,1);
    const lampX=2.5,lampY=Math.sqrt(R*R-lampX*lampX)-.25;
    let li=0;
    for(let i=0;i<nL;i++){
      const z=-6-i*GAP,t=progress(z);
      for(const sx of [-1,1]){
        dummy.position.set(sx*lampX,lampY,z);dummy.scale.set(.55,.14,3.4);dummy.updateMatrix();
        lamps.setMatrixAt(li,dummy.matrix);
        tint(t,col).lerp(white,.35).multiplyScalar(3.2);lamps.setColorAt(li,col);
        dummy.position.set(sx*lampX*1.2,ROAD+.03,z);dummy.scale.set(1,1,1);dummy.updateMatrix();
        pools.setMatrixAt(li,dummy.matrix);
        tint(t,col).multiplyScalar(.9);pools.setColorAt(li,col);
        li++;
      }
    }
    lamps.instanceMatrix.needsUpdate=true;pools.instanceMatrix.needsUpdate=true;
    if(lamps.instanceColor)lamps.instanceColor.needsUpdate=true;
    if(pools.instanceColor)pools.instanceColor.needsUpdate=true;
    lamps.frustumCulled=false;pools.frustumCulled=false;
    scene.add(lamps,pools);disposables.push(lamps,pools);

    /* Luz: ambiente tenue y faro frontal que acompaña a la cámara */
    const hemi=new THREE.HemisphereLight(0x8aa0d6,0x10131c,.6);scene.add(hemi);
    const head=new THREE.SpotLight(0xe6eeff,420,120,.8,.75,1.3);
    head.position.set(0,.2,0);head.target.position.set(0,-.6,-40);
    camera.add(head,head.target);

    /* La luz del final del túnel y el exterior: fachada con su abertura, cielo con sol, colinas, montañas, árboles y quitamiedos.
       Desde dentro solo se ve la abertura brillante; al salir, el ojo se adapta (exposición) y todo se ilumina a pleno día. */
    const sun=new THREE.DirectionalLight(0xfff0d6,0);
    sun.position.set(-60,90,70);sun.target.position.set(0,0,0);
    scene.add(sun,sun.target);

    const sunDir=new THREE.Vector3(.06,.34,-1).normalize();
    const skyMat=track(new THREE.ShaderMaterial({
      uniforms:{uSun:{value:sunDir}},side:THREE.BackSide,depthWrite:false,fog:false,
      vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:[
        'uniform vec3 uSun;varying vec3 vDir;',
        'void main(){',
        '  vec3 d=normalize(vDir);float h=clamp(d.y,0.,1.);',
        '  vec3 top=vec3(.05,.2,.62),hor=vec3(.66,.8,.95);',
        '  vec3 c=mix(hor,top,pow(h,.5));',
        '  if(d.y<0.)c=hor*.88;',
        '  float s=max(dot(d,uSun),0.);',
        '  c+=vec3(1.,.9,.72)*(pow(s,900.)*7.+pow(s,80.)*.5);',
        '  gl_FragColor=vec4(c,1.);',
        '  #include <tonemapping_fragment>',
        '  #include <colorspace_fragment>',
        '}'
      ].join('\n')
    }));
    const skyDome=new THREE.Mesh(track(new THREE.SphereGeometry(900,32,16)),skyMat);
    skyDome.renderOrder=-10;skyDome.frustumCulled=false;scene.add(skyDome);

    const cloudTex=canvasTex(256,128,(x,w,h)=>{
      for(let i=0;i<26;i++){
        const cx=40+rnd()*(w-80),cy=h*.5+(rnd()-.5)*28,r=22+rnd()*30;
        const g=x.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
        x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);
      }
    },true,false);
    const cloudGeo=track(new THREE.PlaneGeometry(1,.5));
    for(let i=0;i<9;i++){
      const m=new THREE.Mesh(cloudGeo,track(new THREE.MeshBasicMaterial({map:cloudTex,transparent:true,depthWrite:false,fog:false,opacity:.7})));
      const sc=220+rnd()*260;
      m.scale.set(sc,sc,1);
      m.position.set((rnd()-.5)*900,140+rnd()*160,-TEND-380-rnd()*380);
      scene.add(m);
    }

    const mountMat=[track(new THREE.MeshBasicMaterial({color:0x5b7aa6,fog:false})),track(new THREE.MeshBasicMaterial({color:0x7897bd,fog:false}))];
    const mountGeo=track(new THREE.ConeGeometry(1,1,6));
    for(let i=0;i<9;i++){
      const m=new THREE.Mesh(mountGeo,mountMat[i%2]);
      const w=140+rnd()*140,h=70+rnd()*80;
      m.scale.set(w,h,w*.8);
      m.position.set(-420+i*105+(rnd()-.5)*40,ROAD-6+h/2,-TEND-460-rnd()*240);
      scene.add(m);
    }

    const grassTex=canvasTex(256,256,(x,w,h)=>{
      x.fillStyle='#4a7d3e';x.fillRect(0,0,w,h);
      for(let i=0;i<9000;i++){
        const g=90+(rnd()*80|0);
        x.fillStyle='rgba('+(g-30)+','+g+','+(g-50)+','+(.05+rnd()*.08)+')';
        x.fillRect(rnd()*w,rnd()*h,1+rnd()*2,2+rnd()*4);
      }
    },true,true);
    const outLen=720;
    const ground=new THREE.Mesh(track(new THREE.PlaneGeometry(900,outLen).rotateX(-Math.PI/2)),track(new THREE.MeshStandardMaterial({map:tiled(grassTex,120,100),roughness:1,metalness:0})));
    ground.position.set(0,ROAD-.15,-TEND-2-outLen/2);scene.add(ground);

    const hillMats=[track(new THREE.MeshStandardMaterial({color:0x4f8a45,roughness:1})),track(new THREE.MeshStandardMaterial({color:0x3f7a3c,roughness:1}))];
    const hillGeo=track(new THREE.SphereGeometry(1,28,16));
    for(let i=0;i<18;i++){
      const sx=i%2?1:-1,w=30+rnd()*34,h=9+rnd()*14;
      const m=new THREE.Mesh(hillGeo,hillMats[i%2]);
      m.scale.set(w,h,w*1.3);
      m.position.set(sx*(40+rnd()*90),ROAD-1,-TEND-30-i*24-rnd()*16);
      scene.add(m);
    }

    const NT=coarse?46:110;
    const treeGeo=track(new THREE.ConeGeometry(1,1,7).translate(0,.5,0));
    const trees=new THREE.InstancedMesh(treeGeo,track(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95})),NT);
    const greens=[0x2c5a3a,0x34683f,0x2a5236,0x3b7345];
    for(let i=0;i<NT;i++){
      const sx=i%2?1:-1,x=sx*(10+rnd()*34),z=-TEND-12-rnd()*340,w=1.3+rnd()*1.3,h=3.6+rnd()*4.2;
      dummy.position.set(x,ROAD-.1,z);dummy.scale.set(w,h,w);dummy.rotation.set(0,rnd()*6.28,0);dummy.updateMatrix();
      trees.setMatrixAt(i,dummy.matrix);col.setHex(greens[i%greens.length]);trees.setColorAt(i,col);
    }
    trees.instanceMatrix.needsUpdate=true;if(trees.instanceColor)trees.instanceColor.needsUpdate=true;
    trees.frustumCulled=false;scene.add(trees);disposables.push(trees);

    /* quitamiedos: carril continuo y postes */
    const railMat=track(new THREE.MeshStandardMaterial({color:0xaeb6c4,metalness:.8,roughness:.4}));
    const railGeo=track(new THREE.BoxGeometry(.12,.3,outLen));
    const postGeoR=track(new THREE.BoxGeometry(.14,.9,.14));
    const railX=RW/2+1.5;
    for(const sx of [-1,1]){
      const r=new THREE.Mesh(railGeo,railMat);r.position.set(sx*railX,ROAD+.7,-TEND-2-outLen/2);scene.add(r);
    }
    const nPost=Math.floor(outLen/4);
    const posts=new THREE.InstancedMesh(postGeoR,railMat,nPost*2);
    for(let i=0;i<nPost;i++)for(let s2=0;s2<2;s2++){
      dummy.position.set((s2?1:-1)*railX,ROAD+.35,-TEND-6-i*4);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();
      posts.setMatrixAt(i*2+s2,dummy.matrix);
    }
    posts.instanceMatrix.needsUpdate=true;posts.frustumCulled=false;scene.add(posts);disposables.push(posts);

    /* fachada de la boca del túnel: muro de hormigón con la abertura circular */
    const shape=new THREE.Shape();
    shape.moveTo(-70,-24);shape.lineTo(70,-24);shape.lineTo(70,36);shape.lineTo(-70,36);shape.lineTo(-70,-24);
    const hole=new THREE.Path();hole.absarc(0,0,R+.02,0,Math.PI*2,true);shape.holes.push(hole);
    const facade=new THREE.Mesh(
      track(new THREE.ExtrudeGeometry(shape,{depth:4,bevelEnabled:false,curveSegments:64})),
      track(new THREE.MeshStandardMaterial({map:tiled(concrete,28,12),color:0xb9c0cc,roughness:.95,side:THREE.DoubleSide}))
    );
    facade.position.z=-TEND-4;scene.add(facade);

    /* "Ver la luz": la exposición se adapta, el resplandor crece al acercarse y al salir todo pasa a plena luz del día */
    const fogDark=new THREE.Color(0x0d0f12),fogDay=new THREE.Color(0xa7c2de);
    const skyDark=new THREE.Color(0x8aa0d6),skyDay=new THREE.Color(0xe3ebf6);
    const grDark=new THREE.Color(0x10131c),grDay=new THREE.Color(0x85806f);
    const updateDay=z=>{
      const day=smooth(-TEND+60,-TEND-25,z);
      const near=smooth(-TEND+170,-TEND-20,z);
      const glare=smooth(-TEND+95,-TEND+8,z)*(1-day);
      sun.intensity=3.4*day;
      hemi.intensity=.6+.5*day;hemi.color.copy(skyDark).lerp(skyDay,day);hemi.groundColor.copy(grDark).lerp(grDay,day);
      head.intensity=420*(1-.85*day);
      scene.fog.density=.0135-.0085*near;
      scene.fog.color.copy(fogDark).lerp(fogDay,day);
      renderer.toneMappingExposure=1+.5*glare-.1*day;
      scene.environmentIntensity=.4-.34*day;
      if(bloom)bloom.strength=.26+.5*glare+.08*day;
      skyDome.position.copy(camera.position);
    };

    /* Elementos reales de un túnel de carretera: catadióptricos, salidas de emergencia y ventiladores */
    const eyeGeo=track(new THREE.BoxGeometry(.14,.05,.22));
    const nEye=Math.ceil(L/4)*2;
    const eyes=new THREE.InstancedMesh(eyeGeo,track(new THREE.MeshBasicMaterial({color:0xffffff})),nEye);
    const amber=new THREE.Color(1,.62,.12);
    for(let i=0;i<nEye/2;i++){
      const z=-i*4;
      for(const sx of [-1,1]){
        dummy.position.set(sx*(RW/2-.12),ROAD+.03,z);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();
        const idx=i*2+(sx>0?1:0);
        eyes.setMatrixAt(idx,dummy.matrix);
        col.copy(sx<0?white:amber).multiplyScalar(2.4);eyes.setColorAt(idx,col);
      }
    }
    eyes.instanceMatrix.needsUpdate=true;if(eyes.instanceColor)eyes.instanceColor.needsUpdate=true;
    eyes.frustumCulled=false;scene.add(eyes);disposables.push(eyes);

    const exitTexSign=canvasTex(256,160,(x,w,h)=>{
      x.fillStyle='#0b7d3f';x.fillRect(0,0,w,h);
      x.strokeStyle='#e8fff0';x.lineWidth=6;x.strokeRect(6,6,w-12,h-12);
      x.fillStyle='#fff';x.font='700 44px Geist,Segoe UI,sans-serif';x.textAlign='center';x.fillText('SALIDA',w/2+20,64);
      x.beginPath();x.moveTo(30,102);x.lineTo(104,102);x.lineTo(104,88);x.lineTo(136,112);x.lineTo(104,136);x.lineTo(104,122);x.lineTo(30,122);x.closePath();x.fill();
      x.font='600 26px Geist,Segoe UI,sans-serif';x.fillText('EXIT',w/2+66,134);
    },true,false);
    const exitMat=track(new THREE.MeshBasicMaterial({map:exitTexSign,color:new THREE.Color(1.7,1.7,1.7)}));
    const exitGeo=track(new THREE.PlaneGeometry(1.7,1.06));
    const niche=track(new THREE.MeshStandardMaterial({color:0x10151f,roughness:.8,metalness:.2}));
    const nicheGeo=track(new THREE.BoxGeometry(.2,2.3,2.4));
    for(let k=0;k<=SEG-2;k++){
      for(const dz of [-22,-34]){
        const z=-k*S+dz;
        const s=new THREE.Mesh(exitGeo,exitMat);s.position.set(6.55,.9,z);s.rotation.y=-Math.PI/2+.32;scene.add(s);
        const n=new THREE.Mesh(nicheGeo,niche);n.position.set(6.8,-.1,z-.2);scene.add(n);
      }
    }
    const fanMat=track(new THREE.MeshStandardMaterial({color:0x8d96a8,roughness:.45,metalness:.7}));
    const fanGeo=track(new THREE.CylinderGeometry(.82,.82,3.4,28).rotateX(Math.PI/2));
    const fanEnd=track(new THREE.CylinderGeometry(.62,.62,.08,28).rotateX(Math.PI/2));
    const darkMat=track(new THREE.MeshStandardMaterial({color:0x05070b,roughness:.9}));
    for(let z=-40;z>-TEND+30;z-=70){
      for(const sx of [-1,1]){
        const f=new THREE.Mesh(fanGeo,fanMat);f.position.set(sx*2.9,5.2,z);scene.add(f);
        for(const e of [-1,1]){const d=new THREE.Mesh(fanEnd,darkMat);d.position.set(sx*2.9,5.2,z+e*1.72);scene.add(d)}
      }
    }

    /* Puntos de control: cada etapa es un pórtico luminoso sobre la carretera, con el número pintado en el asfalto */
    const labelScene=new THREE.Scene();
    const BW=2048,BH=980,BWORLD=12.4,BCY=1.6,BDIST=12;
    const FONT="Geist,'Segoe UI',system-ui,sans-serif";
    try{await Promise.race([document.fonts.load('700 96px Geist'),new Promise(r=>setTimeout(r,1500))])}catch(e){}
    const mctx=document.createElement('canvas').getContext('2d');
    const wrapText=(ctx,text,max)=>{
      const out=[];let line='';
      for(const w of text.split(' ')){const t=line?line+' '+w:w;if(ctx.measureText(t).width>max&&line){out.push(line);line=w}else line=t}
      out.push(line);return out;
    };
    const roundRect=(x,px,py,w,h,r)=>{x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath()};
    const fitText=(text,weight,maxW,maxLines,start,min)=>{
      let s=start;
      for(;s>min;s-=4){
        mctx.font=weight+' '+s+'px '+FONT;
        const l=wrapText(mctx,text,maxW);
        if(l.length<=maxLines&&l.every(q=>mctx.measureText(q).width<=maxW))return {s,l};
      }
      mctx.font=weight+' '+min+'px '+FONT;
      return {s:min,l:wrapText(mctx,text,maxW)};
    };
    const boardTexture=k=>{
      const c=document.createElement('canvas');c.width=BW;c.height=BH;
      const x=c.getContext('2d');
      const bg=x.createLinearGradient(0,0,0,BH);bg.addColorStop(0,'#0b1224');bg.addColorStop(1,'#060a14');
      roundRect(x,8,8,BW-16,BH-16,40);x.fillStyle=bg;x.fill();
      x.lineWidth=7;x.strokeStyle='rgba(125,165,255,.7)';x.stroke();
      x.fillStyle='rgba(125,165,255,.35)';x.fillRect(56,44,BW-112,6);
      x.textBaseline='alphabetic';x.textAlign='left';
      const hasData=typeof PATH!=='undefined';
      const step=hasData&&k<=PATH.steps.length?PATH.steps[k-1]:null;
      if(!step){
        const t=hasData?PATH.result:'';
        const f=fitText(t,'700',BW-300,3,150,70);
        x.textAlign='center';
        x.font='600 38px '+FONT;x.fillStyle='#aebfe6';x.letterSpacing='8px';x.fillText('EL RESULTADO',BW/2,200);x.letterSpacing='0px';
        x.font='700 '+f.s+'px '+FONT;x.fillStyle='#fff';
        f.l.forEach((l,i)=>x.fillText(l,BW/2,330+i*f.s*1.08));
        x.font='500 54px '+FONT;x.fillStyle='#cfdcff';x.fillText('Javier García · Desarrollo Full Stack',BW/2,330+f.l.length*f.s*1.08+70);
      }else{
        /* columna izquierda: etapa, nombre y pregunta */
        const LW=760;
        x.font='600 36px '+FONT;x.fillStyle='#aebfe6';x.letterSpacing='7px';x.fillText('ETAPA 0'+k+' DE 0'+PATH.steps.length,80,150);x.letterSpacing='0px';
        const t=fitText(step.name,'700',LW,3,150,84);
        x.font='700 '+t.s+'px '+FONT;x.fillStyle='#fff';
        t.l.forEach((l,i)=>x.fillText(l,80,150+t.s*1.02+i*t.s*1.04));
        const ay=150+t.s*1.02+(t.l.length-1)*t.s*1.04+86;
        const a=fitText(step.ask,'500',LW,4,56,40);
        x.font='500 '+a.s+'px '+FONT;x.fillStyle='#cfdcff';
        a.l.forEach((l,i)=>x.fillText(l,80,ay+i*a.s*1.32));
        /* columna derecha: formación y cómo lo implemento */
        const CX=900,CW=BW-CX-70,fs=45,lh=fs*1.3,pad=30;
        mctx.font='400 '+fs+'px '+FONT;
        const cards=[];
        if(step.training.length)cards.push({label:'FORMACIÓN',items:step.training.map(q=>q.title+' · '+q.place+' · '+q.years)});
        cards.push({label:'CÓMO LO IMPLEMENTO',items:[step.implement]});
        const laid=cards.map(cd=>{const blocks=cd.items.map(it=>wrapText(mctx,it,CW-2*pad-34));return {cd,blocks,h:pad+30+26+blocks.reduce((n,b)=>n+b.length*lh+14,0)+pad-14}});
        const total=laid.reduce((n,q)=>n+q.h,0)+(laid.length-1)*28;
        let y=(BH-total)/2;
        for(const q of laid){
          roundRect(x,CX,y,CW,q.h,26);x.fillStyle='rgba(22,34,66,.92)';x.fill();x.lineWidth=3;x.strokeStyle='rgba(125,165,255,.4)';x.stroke();
          x.font='600 30px '+FONT;x.fillStyle='#9fb4e6';x.letterSpacing='5px';x.fillText(q.cd.label,CX+pad,y+pad+26);x.letterSpacing='0px';
          let yy=y+pad+30+26;
          x.font='400 '+fs+'px '+FONT;
          for(const b of q.blocks){
            x.fillStyle='#7fa6ff';x.beginPath();x.arc(CX+pad+8,yy+fs*.62,7,0,6.2832);x.fill();
            x.fillStyle='#f2f6ff';
            b.forEach((l,i)=>x.fillText(l,CX+pad+34,yy+fs*.95+i*lh));
            yy+=b.length*lh+14;
          }
          y+=q.h+28;
        }
      }
      /* rejilla de LED: cuadrícula fina que deja el texto nítido pero con aspecto de panel luminoso */
      x.globalCompositeOperation='destination-out';x.fillStyle='rgba(0,0,0,.2)';
      for(let yy=0;yy<BH;yy+=6)x.fillRect(0,yy,BW,1.4);
      for(let xx=0;xx<BW;xx+=6)x.fillRect(xx,0,1.4,BH);
      x.globalCompositeOperation='source-over';
      return canvasTex2(c);
    };
    const canvasTex2=c=>{const t=new THREE.CanvasTexture(c);t.colorSpace=SRGB;t.anisotropy=maxAniso;return track(t)};
    const boardMats=[];
    const boardGeo=track(new THREE.PlaneGeometry(BWORLD,BWORLD*BH/BW));
    const frameGeo=track(new THREE.BoxGeometry(BWORLD+.5,BWORLD*BH/BW+.5,.3));
    const frameMat=track(new THREE.MeshStandardMaterial({color:0x151b28,roughness:.5,metalness:.8}));
    const rodGeo=track(new THREE.CylinderGeometry(.07,.07,1,10));
    const postGeo=track(new THREE.CylinderGeometry(.16,.2,1,12));
    const boards=[];
    for(let k=1;k<=SEG;k++){
      const z=-k*S-BDIST;
      const mat=track(new THREE.ShaderMaterial({
        uniforms:{map:{value:boardTexture(k)},uReveal:{value:0},uOpacity:{value:0}},
        transparent:true,depthWrite:false,
        vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:[
          'uniform sampler2D map;uniform float uReveal,uOpacity;varying vec2 vUv;',
          'void main(){',
          '  vec4 t=texture2D(map,vUv);',
          '  float shown=1.-smoothstep(uReveal-.1,uReveal,vUv.x);',
          '  float beam=smoothstep(uReveal-.03,uReveal,vUv.x)*(1.-smoothstep(uReveal,uReveal+.025,vUv.x));',
          '  vec3 c=t.rgb+vec3(.45,.65,1.)*beam*.9;',
          '  gl_FragColor=vec4(c,(t.a*shown+beam*.35)*uOpacity);',
          '  #include <colorspace_fragment>',
          '}'
        ].join('\n')
      }));
      const board=new THREE.Mesh(boardGeo,mat);board.position.set(0,BCY,z+.18);labelScene.add(board);
      const frame=new THREE.Mesh(frameGeo,frameMat);frame.position.set(0,BCY,z-.05);scene.add(frame);
      const topY=BCY+BWORLD*BH/BW/2+.25,ceilY=Math.sqrt(R*R-25)-.1;
      if(k<SEG){
        for(const sx of [-1,1]){
          const rod=new THREE.Mesh(rodGeo,frameMat);rod.scale.y=Math.max(.4,ceilY-topY);rod.position.set(sx*4.9,topY+rod.scale.y/2,z-.05);scene.add(rod);
        }
      }else{
        /* último cartel, ya fuera del túnel: dos postes hasta el suelo, como un pórtico de carretera */
        for(const sx of [-1,1]){
          const post=new THREE.Mesh(postGeo,frameMat);post.scale.y=topY-ROAD;post.position.set(sx*(BWORLD/2+.45),ROAD+post.scale.y/2,z-.05);scene.add(post);
        }
      }
      boards.push({board,frame,mat,z});
    }
    /* números pintados en el asfalto */
    const roadMarks=[];
    for(let k=1;k<=SEG;k++){
      const tex=canvasTex(256,256,(x,w,h)=>{
        x.fillStyle='#e9eef8';x.font='800 150px Geist,Segoe UI,sans-serif';x.textAlign='center';x.textBaseline='middle';
        x.fillText(k<=4?'0'+k:'★',w/2,h/2+8);
        for(let i=0;i<500;i++){x.clearRect(rnd()*w,rnd()*h,1+rnd()*3,1+rnd()*2)}
      },true,false);
      const m=new THREE.Mesh(track(new THREE.PlaneGeometry(3.2,3.2).rotateX(-Math.PI/2)),track(new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.8,color:new THREE.Color(.9,.9,.9)})));
      m.position.set(0,ROAD+.04,-k*S-7);m.rotation.y=0;scene.add(m);roadMarks.push(m);
    }

    /* Polvo en suspensión: motas muy suaves, casi quietas */
    const N=coarse?260:760;
    const dPos=new Float32Array(N*3),dSize=new Float32Array(N),dPhase=new Float32Array(N);
    for(let i=0;i<N;i++){
      let x,y;do{x=(rnd()*2-1)*5.4;y=(rnd()*2-1)*5.4}while(x*x+y*y>26||y<ROAD+.4);
      dPos[i*3]=x;dPos[i*3+1]=y;dPos[i*3+2]=14-rnd()*(TEND+14);
      dSize[i]=.05+rnd()*.12;dPhase[i]=rnd()*6.2832;
    }
    const dGeo=track(new THREE.BufferGeometry());
    dGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
    dGeo.setAttribute('aSize',new THREE.BufferAttribute(dSize,1));
    dGeo.setAttribute('aPhase',new THREE.BufferAttribute(dPhase,1));
    dGeo.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,-ZEND/2),ZEND);
    const U={uScale:{value:600},uTime:{value:0}};
    const dust=new THREE.Points(dGeo,track(new THREE.ShaderMaterial({
      uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:[
        'uniform float uScale,uTime;attribute float aSize,aPhase;varying float vAlpha;',
        'void main(){',
        '  vec3 p=position+vec3(sin(uTime*.12+aPhase),cos(uTime*.1+aPhase*1.3),0.)*.18;',
        '  vec4 mv=modelViewMatrix*vec4(p,1.0);float d=-mv.z;',
        '  vAlpha=smoothstep(90.,10.,d)*smoothstep(.8,4.,d);',
        '  gl_PointSize=clamp(aSize*uScale/max(d,.1),0.,20.);gl_Position=projectionMatrix*mv;}'
      ].join('\n'),
      fragmentShader:[
        'varying float vAlpha;',
        'void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,r);gl_FragColor=vec4(vec3(.8,.88,1.),a*a*vAlpha*.4);}'
      ].join('\n')
    })));
    dust.frustumCulled=false;scene.add(dust);

    /* Ratón: la cámara se inclina de forma sutil y con inercia (lerp .05) */
    const pan={x:0,y:0},ndc=new THREE.Vector2(0,0);
    let pointerIn=false;
    const onNetMove=e=>{
      const r=pin.getBoundingClientRect();
      ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
      pointerIn=true;
    };
    const onNetLeave=()=>{pointerIn=false};
    if(full&&!coarse){
      pin.addEventListener('pointermove',onNetMove,{passive:true});
      pin.addEventListener('pointerleave',onNetLeave,{passive:true});
    }

    /* Postprocesado suave (solo escritorio): un poco de bloom en las lámparas */
    let composer=null,bloom=null;
    if(post){
      try{
        const rt=new THREE.WebGLRenderTarget(2,2,{type:THREE.HalfFloatType,samples:4});
        composer=new post.EffectComposer(renderer,rt);
        composer.addPass(new post.RenderPass(scene,camera));
        bloom=new post.UnrealBloomPass(new THREE.Vector2(256,256),.26,.55,.97);
        composer.addPass(bloom);
        composer.addPass(new post.OutputPass());
      }catch(e){composer=null;bloom=null}
    }

    /* Cámara: avanza recta entre paradas con ease suave y se detiene en cada etapa */
    const stopZ=k=>-k*S;
    const ease=t=>{t=clamp((t-.14)/.72,0,1);return t*t*(3-2*t)};
    const camZ=p=>{
      const u=clamp(p,0,1)*SEG,k=Math.min(SEG-1,Math.floor(u));
      return stopZ(k)+(stopZ(k+1)-stopZ(k))*ease(u-k);
    };

    let domMode=false;
    const resize=()=>{
      const w=Math.max(1,pin.clientWidth),h=Math.max(1,pin.clientHeight);
      const pr=Math.min(devicePixelRatio||1,coarse?1.5:2);
      renderer.setPixelRatio(pr);
      renderer.setSize(w,h,false);
      if(composer){composer.setPixelRatio(pr);composer.setSize(w,h)}
      camera.aspect=w/h;
      domMode=w/h<.8;
      tunnel.classList.toggle('dom-text',domMode);
      baseFov=w/h<.8?FOV+14:FOV;
      camera.fov=baseFov;
      camera.updateProjectionMatrix();
      U.uScale.value=h*pr*.5/Math.tan(THREE.MathUtils.degToRad(baseFov/2));
      if(!full)draw(0);
    };

    function draw(t){
      t=t||0;
      const z=camZ(P.p)-EXTRA*P.out;
      pan.x+=((pointerIn?ndc.x:0)-pan.x)*.05;pan.y+=((pointerIn?ndc.y:0)-pan.y)*.05;
      camera.position.set(pan.x*.3,EYE+pan.y*.12,z);
      camera.rotation.set(.012+pan.y*.025,-pan.x*.045,0);
      U.uTime.value=t;
      updateDay(z);
      for(const b of boards){
        const d=z-b.z,op=smooth(1,8,d)*(d<80?1:0),show=!domMode&&op>.01;
        b.board.visible=show;b.frame.visible=!domMode;
        b.mat.uniforms.uReveal.value=smooth(46,15,d)*1.15;
        b.mat.uniforms.uOpacity.value=show?op:0;
      }
      if(full){
        const u=P.p*SEG,k=Math.round(u);
        setStage(k>=1&&k<=SEG&&Math.abs(u-k)<.3?k:0);
      }
      if(composer)composer.render();
      else{renderer.clear();renderer.render(scene,camera)}
      renderer.clearDepth();
      renderer.render(labelScene,camera);
    }

    let visible=true,n=0;
    const tick=time=>{
      if(!visible)return;
      if(coarse&&(n++&1))return;
      draw(time);
    };
    const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:0});
    io.observe(tunnel);
    const ro=new ResizeObserver(resize);
    ro.observe(pin);
    resize();

    if(full)G.ticker.add(tick);else draw(0);
    tunnel.classList.add('ready');

    /* Limpieza completa: ticker, observadores, ScrollTrigger, geometrías, materiales, texturas y contexto */
    const onLost=e=>{e.preventDefault();destroy();tunnel.classList.add('nogl')};
    canvas.addEventListener('webglcontextlost',onLost);
    function destroy(){
      G?.ticker.remove(tick);
      io.disconnect();ro.disconnect();
      clearTimeout(swapTimer);
      pin.removeEventListener('pointermove',onNetMove);pin.removeEventListener('pointerleave',onNetLeave);
      canvas.removeEventListener('webglcontextlost',onLost);
      tl?.scrollTrigger?.kill();tl?.kill();
      disposables.forEach(o=>o.dispose());
      composer?.dispose();bloom?.dispose();envRT.dispose();
      renderer.dispose();renderer.forceContextLoss();
      tunnel.classList.remove('ready');
    }
    addEventListener('pagehide',destroy,{once:true});
    window.tunnelScene={destroy};
  }
}
