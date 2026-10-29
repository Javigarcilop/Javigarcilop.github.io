/* Túnel de código 3D controlado por el scroll (Three.js + GSAP ScrollTrigger).
   - Una sola BufferGeometry de puntos (glifos de código) y otra de líneas (ráfagas de luz): 2 draw calls.
   - Three.js se carga diferido (import dinámico) cuando la página ya es interactiva.
   - Si no hay WebGL, GSAP, o se pide movimiento reducido / ahorro de datos, queda un hero estático y legible. */

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
  const measure=()=>{span=full?Math.max(1,tunnel.offsetHeight-innerHeight):innerHeight;headerState()};
  const headerState=()=>document.body.classList.toggle('on-tunnel',scrollY<span*.7);
  addEventListener('scroll',headerState,{passive:true});
  addEventListener('resize',measure,{passive:true});
  measure();

  const P={p:full?0:.12};

  /* Guion del scroll: el texto se acerca y se desvanece, el túnel avanza y todo se funde hacia Trayectoria */
  let tl=null;
  if(full){
    G.registerPlugin(ST);
    tl=G.timeline({
      defaults:{ease:'none'},
      scrollTrigger:{
        trigger:tunnel,start:'top top',end:'bottom bottom',scrub:.8,
        onUpdate:self=>{copy.style.pointerEvents=self.progress>.16?'none':''}
      }
    });
    tl.to(P,{p:1,duration:.86},0)
      .fromTo(copy,{scale:1,opacity:1},{scale:3.6,opacity:0,ease:'power2.in',duration:.34,force3D:true},.03)
      .to(hint,{opacity:0,duration:.06},0)
      .to(pin,{opacity:0,ease:'power1.inOut',duration:.26},.6);
  }

  if(!webgl||saveData)return;

  /* Carga diferida de Three.js: no compite con el primer pintado ni con la interactividad */
  const idle=cb=>('requestIdleCallback' in window)?requestIdleCallback(cb,{timeout:1800}):setTimeout(cb,400);
  const boot=()=>idle(()=>import('../assets/vendor/three.module.min.js').then(build).catch(()=>tunnel.classList.add('nogl')));
  if(document.readyState==='complete')boot();else addEventListener('load',boot,{once:true});

  function build(THREE){
    const FOV=70,LEN=320,R_IN=5.5,R_OUT=20;
    const N_GLYPH=coarse?3000:8000,N_STREAK=coarse?320:900;

    let renderer;
    try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'})}
    catch(e){tunnel.classList.add('nogl');return}
    renderer.setClearColor(0x0d0f12,1);

    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(FOV,1,.1,400);
    const world=new THREE.Group();
    scene.add(world);

    let seed=20260929;
    const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};

    const palette=[new THREE.Color(0x4C82FF),new THREE.Color(0x2F6BFF),new THREE.Color(0x6C63FF),new THREE.Color(0x8DB0FF)];
    const green=new THREE.Color(0x19E6A0);
    const pick=()=>rnd()<.13?green:palette[(rnd()*palette.length)|0];

    /* Atlas de glifos: 8 × 4 celdas de 64 px, una sola textura para todas las partículas */
    const GLYPHS='{}<>/=;:01$[]()#*+-_&|!?%@~7fxe"';
    const at=document.createElement('canvas');at.width=512;at.height=256;
    const ax=at.getContext('2d');
    ax.fillStyle='#fff';ax.textAlign='center';ax.textBaseline='middle';
    ax.font='700 46px ui-monospace,SFMono-Regular,Consolas,Menlo,monospace';
    for(let i=0;i<GLYPHS.length;i++)ax.fillText(GLYPHS[i],(i%8)*64+32,((i/8)|0)*64+34);
    const atlas=new THREE.CanvasTexture(at);
    atlas.anisotropy=2;

    /* Glifos: un único BufferGeometry */
    const gPos=new Float32Array(N_GLYPH*3),gCol=new Float32Array(N_GLYPH*3);
    const gChar=new Float32Array(N_GLYPH),gSize=new Float32Array(N_GLYPH),gPhase=new Float32Array(N_GLYPH);
    for(let i=0;i<N_GLYPH;i++){
      const a=rnd()*6.2832,r=R_IN+(R_OUT-R_IN)*Math.pow(rnd(),1.7);
      gPos[i*3]=Math.cos(a)*r;gPos[i*3+1]=Math.sin(a)*r;gPos[i*3+2]=8-rnd()*(LEN+8);
      const c=pick(),k=.7+rnd()*.3;
      gCol[i*3]=c.r*k;gCol[i*3+1]=c.g*k;gCol[i*3+2]=c.b*k;
      gChar[i]=(rnd()*GLYPHS.length)|0;gSize[i]=.5+rnd()*.95;gPhase[i]=rnd();
    }
    const gGeo=new THREE.BufferGeometry();
    gGeo.setAttribute('position',new THREE.BufferAttribute(gPos,3));
    gGeo.setAttribute('aColor',new THREE.BufferAttribute(gCol,3));
    gGeo.setAttribute('aChar',new THREE.BufferAttribute(gChar,1));
    gGeo.setAttribute('aSize',new THREE.BufferAttribute(gSize,1));
    gGeo.setAttribute('aPhase',new THREE.BufferAttribute(gPhase,1));
    gGeo.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,-LEN/2),LEN);

    const U={uTime:{value:0},uScale:{value:600},uStretch:{value:0},uAtlas:{value:atlas}};
    const gMat=new THREE.ShaderMaterial({
      uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`
        uniform float uTime,uScale;
        attribute vec3 aColor;attribute float aChar,aSize,aPhase;
        varying vec3 vColor;varying float vChar,vAlpha;
        void main(){
          vec4 mv=modelViewMatrix*vec4(position,1.0);
          float d=-mv.z;
          float tw=.7+.3*sin(uTime*1.5+aPhase*6.2831);
          vAlpha=smoothstep(230.,45.,d)*smoothstep(1.5,6.,d)*tw;
          vColor=aColor;vChar=aChar;
          gl_PointSize=clamp(aSize*uScale/max(d,.1),0.,84.);
          gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader:`
        uniform sampler2D uAtlas;
        varying vec3 vColor;varying float vChar,vAlpha;
        void main(){
          float c=floor(vChar+.5);
          vec2 cell=vec2(mod(c,8.),floor(c/8.));
          vec2 uv=vec2((cell.x+gl_PointCoord.x)/8.,1.-(cell.y+gl_PointCoord.y)/4.);
          float a=texture2D(uAtlas,uv).a;
          gl_FragColor=vec4(vColor*2.2,a*vAlpha);
        }`
    });
    const glyphs=new THREE.Points(gGeo,gMat);
    glyphs.frustumCulled=false;
    world.add(glyphs);

    /* Ráfagas de luz: un único LineSegments, la cola se estira con la velocidad del scroll */
    const lPos=new Float32Array(N_STREAK*6),lCol=new Float32Array(N_STREAK*6);
    const lT=new Float32Array(N_STREAK*2),lLen=new Float32Array(N_STREAK*2);
    for(let i=0;i<N_STREAK;i++){
      const a=rnd()*6.2832,r=R_IN-.4+(R_OUT-R_IN)*Math.pow(rnd(),1.4);
      const x=Math.cos(a)*r,y=Math.sin(a)*r,z=6-rnd()*(LEN+6),len=5+rnd()*24,c=pick(),k=.75+rnd()*.25;
      for(let v=0;v<2;v++){
        const o=i*6+v*3;
        lPos[o]=x;lPos[o+1]=y;lPos[o+2]=z;
        lCol[o]=c.r*k;lCol[o+1]=c.g*k;lCol[o+2]=c.b*k;
        lT[i*2+v]=v?0:1;lLen[i*2+v]=len;
      }
    }
    const lGeo=new THREE.BufferGeometry();
    lGeo.setAttribute('position',new THREE.BufferAttribute(lPos,3));
    lGeo.setAttribute('aColor',new THREE.BufferAttribute(lCol,3));
    lGeo.setAttribute('aT',new THREE.BufferAttribute(lT,1));
    lGeo.setAttribute('aLen',new THREE.BufferAttribute(lLen,1));
    lGeo.boundingSphere=gGeo.boundingSphere;
    const lMat=new THREE.ShaderMaterial({
      uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`
        uniform float uStretch;
        attribute vec3 aColor;attribute float aT,aLen;
        varying vec3 vColor;varying float vAlpha;
        void main(){
          vec3 p=position;
          p.z-=(1.0-aT)*aLen*(1.0+uStretch);
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          float d=-mv.z;
          vAlpha=aT*smoothstep(230.,45.,d)*smoothstep(1.,5.,d);
          vColor=aColor;
          gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader:`
        varying vec3 vColor;varying float vAlpha;
        void main(){gl_FragColor=vec4(vColor*2.6,vAlpha);}`
    });
    const streaks=new THREE.LineSegments(lGeo,lMat);
    streaks.frustumCulled=false;
    world.add(streaks);

    /* Tamaño: ResizeObserver actualiza cámara y renderer sin deformar la escena */
    const resize=()=>{
      const w=Math.max(1,pin.clientWidth),h=Math.max(1,pin.clientHeight);
      const pr=Math.min(devicePixelRatio||1,coarse?1.5:2);
      renderer.setPixelRatio(pr);
      renderer.setSize(w,h,false);
      camera.aspect=w/h;
      camera.fov=w/h<.8?FOV+12:FOV;
      camera.updateProjectionMatrix();
      U.uScale.value=h*pr*.5/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      if(!full)draw(0);
    };

    /* Ratón: giro suave de cámara (solo con puntero fino) */
    const M={yaw:0,pitch:0};
    let qYaw,qPitch;
    const onMove=e=>{qYaw((e.clientX/innerWidth-.5)*-.14);qPitch((e.clientY/innerHeight-.5)*-.09)};
    if(full&&!coarse){
      qYaw=G.quickTo(M,'yaw',{duration:1.1,ease:'power3.out'});
      qPitch=G.quickTo(M,'pitch',{duration:1.1,ease:'power3.out'});
      addEventListener('pointermove',onMove,{passive:true});
    }

    let lastZ=0,speed=0;
    const draw=t=>{
      const zTarget=-Math.pow(P.p,1.12)*(LEN*.96);
      speed+=(Math.abs(zTarget-lastZ)-speed)*.12;lastZ=zTarget;
      U.uTime.value=t;
      U.uStretch.value=Math.min(5,speed*1.6);
      camera.position.z=zTarget;
      camera.rotation.set(M.pitch,M.yaw,P.p*.35);
      world.rotation.z=t*.025+P.p*.9;
      renderer.render(scene,camera);
    };

    let visible=true,n=0;
    const frame=(time)=>{
      if(!visible)return;
      if(coarse&&(n++&1))return;
      draw(time);
    };
    const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:0});
    io.observe(tunnel);
    const ro=new ResizeObserver(resize);
    ro.observe(pin);
    resize();

    if(full)G.ticker.add(frame);else draw(0);
    tunnel.classList.add('ready');

    /* Limpieza completa: ticker, observadores, escrolltrigger, geometrías, materiales, textura y contexto */
    const onLost=e=>{e.preventDefault();destroy();tunnel.classList.add('nogl')};
    canvas.addEventListener('webglcontextlost',onLost);
    function destroy(){
      G?.ticker.remove(frame);
      io.disconnect();ro.disconnect();
      removeEventListener('pointermove',onMove);
      canvas.removeEventListener('webglcontextlost',onLost);
      tl?.scrollTrigger?.kill();tl?.kill();
      gGeo.dispose();lGeo.dispose();gMat.dispose();lMat.dispose();atlas.dispose();
      renderer.dispose();renderer.forceContextLoss();
      tunnel.classList.remove('ready');
    }
    addEventListener('pagehide',destroy,{once:true});
    window.tunnelScene={destroy};
  }
}
