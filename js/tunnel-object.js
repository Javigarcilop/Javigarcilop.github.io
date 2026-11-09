/* Objeto protagonista del túnel: una pantalla de producto en capas, hecha en código con Three.js (r169, vendorizado).
   Solo existe en el modo completo y se carga en reposo; el túnel CSS 3D sigue siendo el fondo.

   PROTOTIPO (fases 1 y 4 de "Del diseño al producto"):
   - Wireframe cian: aristas del chasis, marco de la pantalla y la maqueta (layout) de la interfaz.
   - Producto final: chasis de aluminio, cristal negro con clearcoat, pantalla con la interfaz iluminada, reflejos de un
     entorno de paneles de luz azules/cian y un giro completo ligado al scroll.
   - Entre ambas, un barrido de escáner (plano de recorte) convierte el wireframe en objeto sólido.
   Pendientes: UI con color por capas y capas de código explosionadas (fases 2 y 3).

   Coste acotado: sin sombras, sin postprocesado y sin transmission; render bajo demanda (solo cuando cambia el scroll o el
   cursor), DPR máx. 1,5, canvas transparente con opacidad CSS. Sin WebGL o si falla la carga, no se crea nada. */

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;

const W=3.2,H=2.0,R=.16,D=.09,BEV=.025;               /* medidas del dispositivo (unidades de escena) */
const FRONT=D/2+BEV;                                  /* z de la cara frontal */

function roundedRect(THREE,w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-Math.PI/2,0,false);
  s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,Math.PI/2,false);
  s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,Math.PI/2,Math.PI,false);
  s.lineTo(x,y+r);s.absarc(x+r,y+r,r,Math.PI,Math.PI*1.5,false);
  return s;
}
/* ShapeGeometry con UV normalizadas 0..1 para poder texturizar la pantalla */
function shapeWithUV(THREE,shape,w,h){
  const g=new THREE.ShapeGeometry(shape,24),pos=g.attributes.position,uv=new Float32Array(pos.count*2);
  for(let i=0;i<pos.count;i++){uv[i*2]=pos.getX(i)/w+.5;uv[i*2+1]=pos.getY(i)/h+.5}
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;
}

/* Maqueta de la interfaz en coordenadas normalizadas de pantalla (0..1): [x,y,w,h] */
const LAYOUT=[
  [.03,.05,.94,.10],                                   /* barra superior */
  [.03,.19,.17,.76],                                   /* lateral */
  [.24,.19,.34,.34],[.62,.19,.34,.34],                 /* tarjetas */
  [.24,.57,.72,.38],                                   /* gráfico */
  [.27,.62,.08,.28],[.38,.62,.08,.28],[.49,.62,.08,.28],[.60,.62,.08,.28],[.71,.62,.08,.28],[.82,.62,.08,.28]
];

/* Interfaz del producto (sin cifras ni datos inventados: formas y etiquetas del recorrido) */
function drawUI(ctx,w,h){
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#0B1A36');g.addColorStop(1,'#060C19');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const rr=(x,y,ww,hh,r)=>{ctx.beginPath();ctx.roundRect(x*w,y*h,ww*w,hh*h,r);};
  ctx.fillStyle='rgba(116,170,255,.10)';rr(.03,.05,.94,.10,14);ctx.fill();
  ctx.fillStyle='#4CE4ED';ctx.beginPath();ctx.arc(.06*w,.10*h,9,0,6.283);ctx.fill();
  ctx.font='600 26px "Space Grotesk",system-ui,sans-serif';ctx.fillStyle='#EDF4FF';ctx.fillText('javigarcilop',.085*w,.113*h);
  ctx.font='500 18px "JetBrains Mono",ui-monospace,monospace';ctx.fillStyle='#B7D4FF';
  ['Idea','Diseño','Código','Producto'].forEach((t,i)=>ctx.fillText(t,(.60+i*.095)*w,.108*h));
  ctx.fillStyle='rgba(116,170,255,.08)';rr(.03,.19,.17,.76,16);ctx.fill();
  for(let i=0;i<6;i++){ctx.fillStyle=i===1?'rgba(76,228,237,.85)':'rgba(183,212,255,.28)';rr(.05,.23+i*.07,.13,.035,8);ctx.fill()}
  [[.24,.19],[.62,.19]].forEach(([x,y],k)=>{
    ctx.fillStyle='rgba(116,170,255,.12)';rr(x,y,.34,.34,18);ctx.fill();
    ctx.strokeStyle='rgba(116,170,255,.45)';ctx.lineWidth=2;rr(x,y,.34,.34,18);ctx.stroke();
    const gg=ctx.createLinearGradient(0,0,w,0);gg.addColorStop(0,'#74AAFF');gg.addColorStop(1,'#4CE4ED');
    ctx.fillStyle=gg;rr(x+.03,y+.05,.14,.035,8);ctx.fill();
    ctx.fillStyle='rgba(183,212,255,.35)';rr(x+.03,y+.12,.26,.025,6);ctx.fill();rr(x+.03,y+.17,.2,.025,6);ctx.fill();
    ctx.fillStyle=k?'rgba(76,228,237,.9)':'rgba(116,170,255,.9)';rr(x+.03,y+.25,.12,.055,14);ctx.fill();
  });
  ctx.fillStyle='rgba(116,170,255,.08)';rr(.24,.57,.72,.38,18);ctx.fill();
  [.45,.7,.52,.9,.62,.78].forEach((v,i)=>{
    const bg=ctx.createLinearGradient(0,(.92-.3*v)*h,0,.92*h);bg.addColorStop(0,'#4CE4ED');bg.addColorStop(1,'#2765D8');
    ctx.fillStyle=bg;rr(.27+i*.11,.92-.3*v,.08,.3*v,10);ctx.fill();
  });
}

export async function createObject(scene,stops){
  let THREE;
  try{THREE=await import('../assets/vendor/three.module.min.js')}catch(e){return null}
  const canvas=document.createElement('canvas');
  canvas.className='tn-object';canvas.setAttribute('aria-hidden','true');

  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power',stencil:false});
  }catch(e){return null}
  const coarse=matchMedia('(pointer: coarse)').matches;
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.localClippingEnabled=true;

  const tmx=document.getElementById('tnCam2');
  scene.insertBefore(canvas,tmx);

  const three=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,1.6,.1,50);camera.position.set(0,0,7);

  /* ---------- entorno de reflejos: paneles de luz azules y cian, solo para reflejar ---------- */
  const env=new THREE.Scene();env.background=new THREE.Color(0x02050d);
  const panel=(w,h,color,k,x,y,z,rx,ry)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(k),side:THREE.DoubleSide}));
    m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0);env.add(m);
  };
  panel(9,3,0xffffff,5.5,0,5,0,Math.PI/2,0);            /* softbox superior */
  panel(2,9,0x4CE4ED,6,-6,0,1,0,Math.PI/2);             /* tira cian izquierda */
  panel(2,9,0x74AAFF,5,6,0,-1,0,Math.PI/2);             /* tira azul derecha */
  panel(8,2.5,0xB7D4FF,2.2,0,-4,3,-Math.PI/2,0);        /* relleno inferior */
  panel(6,6,0x1a3a7a,1.2,0,0,-7,0,0);                   /* fondo azul */
  panel(9,5,0xBFD4FF,1.15,0,1,-6,0,0);                   /* softbox trasero (para la cara posterior) */
  panel(8,4,0xffffff,1.2,0,.5,7,0,0);                   /* relleno frontal suave */
  const pm=new THREE.PMREMGenerator(renderer);
  const envRT=pm.fromScene(env,.03);
  three.environment=envRT.texture;pm.dispose();
  env.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});

  /* ---------- dispositivo ---------- */
  const device=new THREE.Group();three.add(device);
  const solid=new THREE.Group(),wire=new THREE.Group();device.add(solid,wire);

  const solidPlane=new THREE.Plane(new THREE.Vector3(-1,0,0),0);
  const wirePlane=new THREE.Plane(new THREE.Vector3(1,0,0),0);

  const bodyGeo=new THREE.ExtrudeGeometry(roundedRect(THREE,W,H,R),{depth:D,bevelEnabled:true,bevelThickness:BEV,bevelSize:BEV,bevelSegments:4,curveSegments:24});
  bodyGeo.translate(0,0,-D/2);
  const alu=new THREE.MeshPhysicalMaterial({color:0xaab8cf,metalness:1,roughness:.26,envMapIntensity:1.35,clippingPlanes:[solidPlane]});
  solid.add(new THREE.Mesh(bodyGeo,alu));

  const glassGeo=shapeWithUV(THREE,roundedRect(THREE,W-.05,H-.05,R-.02),W-.05,H-.05);
  const glass=new THREE.Mesh(glassGeo,new THREE.MeshPhysicalMaterial({color:0x04070f,metalness:0,roughness:.12,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1.6,clippingPlanes:[solidPlane]}));
  glass.position.z=FRONT+.0004;solid.add(glass);

  const SW=W-.2,SH=H-.2;
  const ui=document.createElement('canvas');ui.width=1280;ui.height=Math.round(1280*SH/SW);
  drawUI(ui.getContext('2d'),ui.width,ui.height);
  const tex=new THREE.CanvasTexture(ui);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const screen=new THREE.Mesh(shapeWithUV(THREE,roundedRect(THREE,SW,SH,.09),SW,SH),
    new THREE.MeshPhysicalMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:1.0,roughness:.4,metalness:0,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1.0,toneMapped:false,clippingPlanes:[solidPlane]}));
  screen.position.z=FRONT+.0012;solid.add(screen);

  /* detalle trasero: anillo cian emisivo */
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.26,.018,12,64),new THREE.MeshBasicMaterial({color:0x4CE4ED,clippingPlanes:[solidPlane]}));
  ring.position.z=-FRONT-.002;ring.rotation.y=Math.PI;solid.add(ring);

  /* wireframe: aristas del chasis, marco de pantalla y maqueta de la interfaz */
  const wireMat=new THREE.LineBasicMaterial({color:0x4CE4ED,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,clippingPlanes:[wirePlane]});
  const wireDim=new THREE.LineBasicMaterial({color:0x74AAFF,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false,clippingPlanes:[wirePlane]});
  wire.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo,35),wireMat));
  const frame=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(roundedRect(THREE,SW,SH,.09).getPoints(20).map(p=>new THREE.Vector3(p.x,p.y,FRONT+.002))),wireMat);
  wire.add(frame);
  const seg=[];
  LAYOUT.forEach(([x,y,w,h])=>{
    const x0=(x-.5)*SW,x1=(x+w-.5)*SW,y0=(.5-y)*SH,y1=(.5-y-h)*SH,z=FRONT+.002;
    seg.push(x0,y0,z,x1,y0,z, x1,y0,z,x1,y1,z, x1,y1,z,x0,y1,z, x0,y1,z,x0,y0,z);
  });
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(seg,3));
  wire.add(new THREE.LineSegments(lg,wireDim));

  /* línea de barrido */
  const scanMat=new THREE.MeshBasicMaterial({color:0x7FF3F8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const scan=new THREE.Mesh(new THREE.PlaneGeometry(.035,H+.5),scanMat);scan.position.z=FRONT+.02;device.add(scan);

  /* ---------- estado ---------- */
  const sides=(stops||[]).map(s=>({at:s.at,v:s.lado==='left'?1:s.lado==='right'?-1:0}));
  const sideAt=p=>{
    if(!sides.length)return 0;
    if(p<=sides[0].at)return sides[0].v;
    for(let i=1;i<sides.length;i++)if(p<=sides[i].at){const a=sides[i-1],b=sides[i];return lerp(a.v,b.v,smooth(a.at,b.at,p))}
    return 0;
  };

  let enabled=true,running=false,lost=false,P=0,MX=0,MY=0,aspect=1.6,shown=false;
  const resize=()=>{
    const w=Math.max(2,scene.clientWidth),h=Math.max(2,scene.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.25:1.5));
    renderer.setSize(w,h,false);aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix();
  };
  const ro='ResizeObserver' in window?new ResizeObserver(()=>{resize();draw(true)}):null;ro?.observe(scene);
  resize();

  const tmpN=new THREE.Vector3(),tmpP=new THREE.Vector3();
  let lastP=-9,lastMX=-9,lastMY=-9,lastOp=-1;
  function draw(force){
    if(!enabled||!running||lost)return;
    /* sin cambios apreciables no se vuelve a pintar (la cola del suavizado del scroll son frames casi idénticos) */
    if(!force&&Math.abs(P-lastP)<.0003&&Math.abs(MX-lastMX)<.003&&Math.abs(MY-lastMY)<.003)return;
    lastP=P;lastMX=MX;lastMY=MY;
    const p=P;
    const v0=sideAt(p),c0=1-Math.abs(v0);
    const vis=smooth(0,.10,p)*(1-smooth(.84,.90,p))*(1-.88*c0*c0*(1-smooth(.45,.55,p)));
    if(vis<.004){if(shown){shown=false;lastOp=0;canvas.style.opacity='0'}return}
    shown=true;
    if(Math.abs(vis-lastOp)>.004){lastOp=vis;canvas.style.opacity=vis.toFixed(3)}

    const v=sideAt(p),center=1-Math.abs(v);
    const k=clamp(aspect/1.6,.62,1.12);
    const sc=.74*k*(1-.32*center)*(1+.2*smooth(.58,.74,p));
    device.scale.setScalar(sc);
    device.position.set(v*1.75*k*(aspect>1.2?1:.6),.05+MY*.06,-5*(1-smooth(0,.22,p)));

    /* barrido: de wireframe a sólido */
    const u=smooth(.34,.64,p),sx=lerp(-W/2-.15,W/2+.15,u);
    device.rotation.set(.1+MY*.10,0,0);
    /* giro completo ligado al scroll en la fase final, y balanceo con el cursor */
    const yaw=-.38+smooth(.60,.88,p)*Math.PI*2+MX*.14;
    device.rotation.y=yaw;
    const q=device.quaternion;                          /* el padre es la escena (identidad): sin recalcular matrices aparte */
    tmpP.set(sx*sc,0,0).applyQuaternion(q).add(device.position);
    tmpN.set(-1,0,0).applyQuaternion(q);solidPlane.setFromNormalAndCoplanarPoint(tmpN,tmpP);
    tmpN.set(1,0,0).applyQuaternion(q);wirePlane.setFromNormalAndCoplanarPoint(tmpN,tmpP);
    scan.position.x=sx;scanMat.opacity=u>0&&u<1?.9*Math.sin(Math.PI*u):0;
    solid.visible=u>0;wire.visible=u<1;
    wireMat.opacity=.95;wireDim.opacity=.7;

    /* los reflejos se mueven con el scroll y con el cursor */
    three.environmentRotation.set(0,p*Math.PI*1.4+MX*.5,MY*.15);
    renderer.render(three,camera);
  }

  const set=(p,mx,my)=>{P=p;MX=mx||0;MY=my||0;draw()};
  const play=()=>{running=true;draw(true)};
  const pause=()=>{running=false};
  const setEnabled=b=>{enabled=!!b;if(!enabled){canvas.style.opacity='0';shown=false;lastOp=0}else draw(true)};

  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;canvas.style.opacity='0'});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;draw(true)});

  const destroy=()=>{
    ro?.disconnect();
    three.traverse(o=>{o.geometry?.dispose();const m=o.material;if(m){(Array.isArray(m)?m:[m]).forEach(x=>{x.map?.dispose();x.dispose()})}});
    tex.dispose();envRT.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();
  };
  return {set,play,pause,setEnabled,destroy,canvas};
}
