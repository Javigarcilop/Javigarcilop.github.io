/* Viaje por la trayectoria: un pasillo 3D de marcos controlado por el scroll (Three.js + GSAP ScrollTrigger).
   Marketing → Diseño → Código → Product Engineering e IA → resultado. Cada etapa es un portal con su nombre;
   los marcos pasan de gris azulado a azul y a cian: cada etapa suma a la anterior.
   - Pocas draw calls: un LineSegments (marcos y guías), un Points (polvo) y un plano por etiqueta.
   - Three.js se carga diferido (import dinámico) cuando la página ya es interactiva.
   - Sin WebGL, sin GSAP, con movimiento reducido o ahorro de datos: hero estático y legible. */

const tunnel=document.querySelector('.tunnel');
if(tunnel)start();

function start(){
  const pin=document.getElementById('tunnelPin'),canvas=document.getElementById('tunnelCanvas');
  const copy=document.getElementById('tunnelCopy'),hint=document.getElementById('tunnelHint');
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

  const P={p:full?0:.05};

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
      .fromTo(copy,{scale:1,opacity:1},{scale:3.2,opacity:0,ease:'power2.in',duration:.06,force3D:true},0)
      .to(hint,{opacity:0,duration:.02},0)
      .to(pin,{opacity:0,ease:'power1.inOut',duration:.18},.8)
      .to({},{duration:.02},.98);
  }

  if(!webgl||saveData)return;

  /* Carga diferida de Three.js: no compite con el primer pintado ni con la interactividad */
  const idle=cb=>('requestIdleCallback' in window)?requestIdleCallback(cb,{timeout:1800}):setTimeout(cb,400);
  const boot=()=>idle(()=>import('../assets/vendor/three.module.min.js').then(build).catch(()=>tunnel.classList.add('nogl')));
  if(document.readyState==='complete')boot();else addEventListener('load',boot,{once:true});

  async function build(THREE){
    const FOV=64,SEG=5,S=46,SP=S/4,STOP=14,HALF=7.5;
    const ZEND=SEG*S;
    const clamp=(v,a,b)=>v<a?a:v>b?b:v;
    const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

    let renderer;
    try{renderer=new THREE.WebGLRenderer({canvas,antialias:!coarse,alpha:false,powerPreference:'high-performance'})}
    catch(e){tunnel.classList.add('nogl');return}
    renderer.setClearColor(0x0d0f12,1);

    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(FOV,1,.1,420);
    const disposables=[];
    const track=o=>(disposables.push(o),o);

    /* Color progresivo: gris azulado → azul → cian a lo largo del viaje */
    const slate=new THREE.Color(0x56678f),blue=new THREE.Color(0x4c82ff),cyan=new THREE.Color(0x19d3f3);
    const tint=(t,out)=>t<.62?out.copy(slate).lerp(blue,t/.62):out.copy(blue).lerp(cyan,(t-.62)/.38);

    /* Marcos y guías: un único LineSegments */
    const verts=[],cols=[],alphas=[],tmp=new THREE.Color();
    const seg=(x1,y1,z1,x2,y2,z2,c,a)=>{verts.push(x1,y1,z1,x2,y2,z2);cols.push(c.r,c.g,c.b,c.r,c.g,c.b);alphas.push(a,a)};
    const frame=(z,h,c,a)=>{
      seg(-h,-h,z,h,-h,z,c,a);seg(h,-h,z,h,h,z,c,a);seg(h,h,z,-h,h,z,c,a);seg(-h,h,z,-h,-h,z,c,a);
    };
    const nFrames=Math.ceil((ZEND+SP*5)/SP);
    for(let f=0;f<=nFrames;f++){
      const z=-f*SP,t=clamp(-z/ZEND,0,1);
      tint(t,tmp);
      const portal=f%4===0&&f>0&&f<=SEG*4;
      frame(z,HALF,tmp,portal?.85:.3);
      if(portal){frame(z,HALF+1.6,tmp,.4);frame(z,HALF-1.5,tmp,.55)}
    }
    const zFar=-(ZEND+SP*5);
    for(const [x,y,a] of [[-1,-1,.2],[1,-1,.2],[1,1,.2],[-1,1,.2],[0,-1,.1],[0,1,.1],[-1,0,.1],[1,0,.1]]){
      for(let z=12;z>zFar;z-=40){
        const t0=clamp(-z/ZEND,0,1),t1=clamp(-(z-40)/ZEND,0,1);
        seg(x*HALF,y*HALF,z,x*HALF,y*HALF,z-40,tint((t0+t1)/2,tmp).clone(),a);
      }
    }
    const lGeo=track(new THREE.BufferGeometry());
    lGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    lGeo.setAttribute('aColor',new THREE.Float32BufferAttribute(cols,3));
    lGeo.setAttribute('aAlpha',new THREE.Float32BufferAttribute(alphas,1));
    lGeo.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,-ZEND/2),ZEND);
    const lMat=track(new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`
        attribute vec3 aColor;attribute float aAlpha;
        varying vec3 vColor;varying float vAlpha;
        void main(){
          vec4 mv=modelViewMatrix*vec4(position,1.0);
          float d=-mv.z;
          vAlpha=aAlpha*smoothstep(300.,70.,d)*smoothstep(.6,5.,d);
          vColor=aColor;
          gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){gl_FragColor=vec4(vColor*1.35,vAlpha);}`
    }));
    const lines=new THREE.LineSegments(lGeo,lMat);
    lines.frustumCulled=false;
    scene.add(lines);

    /* Polvo de datos: muy pocos glifos tenues, un solo tono, quietos */
    const GLYPHS='{}<>/=;01[]()#+_|';
    const at=document.createElement('canvas');at.width=512;at.height=256;
    const ax=at.getContext('2d');
    ax.fillStyle='#fff';ax.textAlign='center';ax.textBaseline='middle';
    ax.font='700 46px ui-monospace,SFMono-Regular,Consolas,Menlo,monospace';
    for(let i=0;i<GLYPHS.length;i++)ax.fillText(GLYPHS[i],(i%8)*64+32,((i/8)|0)*64+34);
    const atlas=track(new THREE.CanvasTexture(at));
    atlas.anisotropy=2;
    let seed=20260929;
    const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
    const N=coarse?420:1000;
    const dPos=new Float32Array(N*3),dChar=new Float32Array(N),dSize=new Float32Array(N);
    for(let i=0;i<N;i++){
      const a=rnd()*6.2832,r=HALF+1.2+rnd()*9;
      dPos[i*3]=Math.cos(a)*r;dPos[i*3+1]=Math.sin(a)*r;dPos[i*3+2]=10-rnd()*(ZEND+SP*5);
      dChar[i]=(rnd()*GLYPHS.length)|0;dSize[i]=.3+rnd()*.5;
    }
    const dGeo=track(new THREE.BufferGeometry());
    dGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
    dGeo.setAttribute('aChar',new THREE.BufferAttribute(dChar,1));
    dGeo.setAttribute('aSize',new THREE.BufferAttribute(dSize,1));
    dGeo.boundingSphere=lGeo.boundingSphere;
    const U={uScale:{value:600},uAtlas:{value:atlas}};
    const dMat=track(new THREE.ShaderMaterial({
      uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`
        uniform float uScale;attribute float aChar,aSize;
        varying float vChar,vAlpha;
        void main(){
          vec4 mv=modelViewMatrix*vec4(position,1.0);
          float d=-mv.z;
          vAlpha=smoothstep(180.,40.,d)*smoothstep(2.,8.,d)*.34;
          vChar=aChar;
          gl_PointSize=clamp(aSize*uScale/max(d,.1),0.,56.);
          gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader:`
        uniform sampler2D uAtlas;varying float vChar,vAlpha;
        void main(){
          float c=floor(vChar+.5);
          vec2 cell=vec2(mod(c,8.),floor(c/8.));
          vec2 uv=vec2((cell.x+gl_PointCoord.x)/8.,1.-(cell.y+gl_PointCoord.y)/4.);
          gl_FragColor=vec4(vec3(.56,.64,.84),texture2D(uAtlas,uv).a*vAlpha);
        }`
    }));
    const dust=new THREE.Points(dGeo,dMat);
    dust.frustumCulled=false;
    scene.add(dust);

    /* Etiquetas de cada etapa: texto en textura, un plano por portal */
    try{await Promise.race([document.fonts.load('700 96px Geist'),new Promise(r=>setTimeout(r,1500))])}catch(e){}
    const FONT="Geist,'Segoe UI',system-ui,sans-serif";
    const steps=(typeof PATH!=='undefined'?PATH.steps:[]).map((s,i)=>({kicker:'Etapa 0'+(i+1),title:s.name,sub:s.ask}));
    if(typeof PATH!=='undefined')steps.push({kicker:'El resultado',title:PATH.result,sub:'Cada etapa suma a la anterior.',big:true});
    const wrap=(ctx,text,max)=>{
      const out=[];let line='';
      for(const w of text.split(' ')){const t=line?line+' '+w:w;if(ctx.measureText(t).width>max&&line){out.push(line);line=w}else line=t}
      out.push(line);return out;
    };
    const W=coarse?768:1024,Hh=W/2;
    const labelTex=s=>{
      const c=document.createElement('canvas');c.width=W;c.height=Hh;
      const x=c.getContext('2d'),k=W/1024;
      x.textAlign='center';x.textBaseline='alphabetic';
      let size=(s.big?80:132)*k;
      x.font=`700 ${size}px ${FONT}`;
      let lines=wrap(x,s.title,W*.92);
      while(lines.length>(s.big?3:2)||Math.max(...lines.map(l=>x.measureText(l).width))>W*.94){size*=.92;x.font=`700 ${size}px ${FONT}`;lines=wrap(x,s.title,W*.92)}
      x.font=`500 ${38*k}px ${FONT}`;
      const sub=wrap(x,s.sub,W*.86).slice(0,2);
      const lh=size*1.1,kick=30*k,gap=26*k,subLh=46*k;
      const total=kick+gap+lines.length*lh+gap*.6+sub.length*subLh;
      let y=(Hh-total)/2;
      x.font=`500 ${kick}px ${FONT}`;x.fillStyle='#8a9fd0';
      x.letterSpacing=`${4*k}px`;x.fillText(s.kicker.toUpperCase(),W/2,y+kick*.85);x.letterSpacing='0px';
      y+=kick+gap;
      x.font=`700 ${size}px ${FONT}`;
      x.shadowColor='rgba(76,130,255,.55)';x.shadowBlur=36*k;x.fillStyle='#eef3ff';
      lines.forEach((l,i)=>x.fillText(l,W/2,y+size*.85+i*lh));
      x.shadowBlur=0;
      y+=lines.length*lh+gap*.6;
      x.font=`500 ${38*k}px ${FONT}`;x.fillStyle='#a9bbe6';
      sub.forEach((l,i)=>x.fillText(l,W/2,y+subLh*.8+i*subLh));
      const t=new THREE.CanvasTexture(c);t.anisotropy=4;t.colorSpace=THREE.SRGBColorSpace;return t;
    };
    const labels=steps.map((s,i)=>{
      const tex=track(labelTex(s));
      const mat=track(new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:0}));
      const geo=track(new THREE.PlaneGeometry(16,8));
      const m=new THREE.Mesh(geo,mat);
      m.position.set(0,0,-(i+1)*S);
      scene.add(m);
      return m;
    });

    /* Resplandor al final del pasillo */
    const gc=document.createElement('canvas');gc.width=gc.height=128;
    const gx=gc.getContext('2d'),gg=gx.createRadialGradient(64,64,0,64,64,64);
    gg.addColorStop(0,'rgba(120,170,255,.55)');gg.addColorStop(.35,'rgba(60,120,255,.18)');gg.addColorStop(1,'rgba(60,120,255,0)');
    gx.fillStyle=gg;gx.fillRect(0,0,128,128);
    const glowTex=track(new THREE.CanvasTexture(gc));
    const glow=new THREE.Mesh(track(new THREE.PlaneGeometry(46,46)),track(new THREE.MeshBasicMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.9})));
    glow.position.set(0,0,-(ZEND+22));
    scene.add(glow);

    /* Cámara: avanza entre paradas con ease suave y se detiene delante de cada portal */
    const stopZ=k=>k===0?0:-k*S+STOP;
    const ease=t=>{t=clamp((t-.14)/.72,0,1);return t*t*(3-2*t)};
    const camZ=p=>{
      const u=clamp(p,0,1)*SEG,k=Math.min(SEG-1,Math.floor(u));
      return stopZ(k)+(stopZ(k+1)-stopZ(k))*ease(u-k);
    };

    const resize=()=>{
      const w=Math.max(1,pin.clientWidth),h=Math.max(1,pin.clientHeight);
      const pr=Math.min(devicePixelRatio||1,coarse?1.5:2);
      renderer.setPixelRatio(pr);
      renderer.setSize(w,h,false);
      camera.aspect=w/h;
      camera.fov=w/h<.8?FOV+14:FOV;
      camera.updateProjectionMatrix();
      U.uScale.value=h*pr*.5/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      const visW=2*STOP*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect;
      const sc=clamp(visW*.78/16,.45,1.25);
      labels.forEach(m=>m.scale.setScalar(sc));
      if(!full)draw();
    };

    /* Ratón: giro suave de cámara (solo con puntero fino) */
    const M={yaw:0,pitch:0};
    let qYaw,qPitch;
    const onMove=e=>{qYaw((e.clientX/innerWidth-.5)*-.09);qPitch((e.clientY/innerHeight-.5)*-.06)};
    if(full&&!coarse){
      qYaw=G.quickTo(M,'yaw',{duration:1.2,ease:'power3.out'});
      qPitch=G.quickTo(M,'pitch',{duration:1.2,ease:'power3.out'});
      addEventListener('pointermove',onMove,{passive:true});
    }

    function draw(){
      const z=camZ(P.p);
      camera.position.set(0,0,z);
      camera.rotation.set(M.pitch,M.yaw,Math.sin(P.p*SEG*3.1416)*.012);
      for(const m of labels){
        const d=z-m.position.z;
        m.material.opacity=smooth(40,20,d)*smooth(3,9,d);
      }
      glow.material.opacity=.35+.65*smooth(0,1,P.p);
      renderer.render(scene,camera);
    }

    let visible=true,n=0;
    const tick=()=>{
      if(!visible)return;
      if(coarse&&(n++&1))return;
      draw();
    };
    const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:0});
    io.observe(tunnel);
    const ro=new ResizeObserver(resize);
    ro.observe(pin);
    resize();

    if(full)G.ticker.add(tick);else draw();
    tunnel.classList.add('ready');

    /* Limpieza completa: ticker, observadores, ScrollTrigger, geometrías, materiales, texturas y contexto */
    const onLost=e=>{e.preventDefault();destroy();tunnel.classList.add('nogl')};
    canvas.addEventListener('webglcontextlost',onLost);
    function destroy(){
      G?.ticker.remove(tick);
      io.disconnect();ro.disconnect();
      removeEventListener('pointermove',onMove);
      canvas.removeEventListener('webglcontextlost',onLost);
      tl?.scrollTrigger?.kill();tl?.kill();
      disposables.forEach(o=>o.dispose());
      renderer.dispose();renderer.forceContextLoss();
      tunnel.classList.remove('ready');
    }
    addEventListener('pagehide',destroy,{once:true});
    window.tunnelScene={destroy};
  }
}
