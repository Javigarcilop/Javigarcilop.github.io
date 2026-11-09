/* Haces de luz del túnel: "Stream Convergence" (AnimatedWebs, plantilla gratuita), implementado desde su prompt y
   recoloreado a la paleta del sitio (azul #74AAFF, cian #4CE4ED, azul claro #B7D4FF sobre #060C19).
   Un único triángulo a pantalla completa con un shader WebGL1: tres senos rotados 0,55 rad, uno por haz, de los que
   solo se conserva la cresta (smoothstep) para que se lean como bandas de luz. La separación entre haces ("spread")
   va atada al progreso del túnel: abiertos al principio ("diseño") y convergiendo hacia la salida ("producto").

   Coste acotado:
   - Se crea en reposo (idle) y solo pinta entre el ~40 % y el final del recorrido; fuera de ese tramo no hay bucle.
   - Resolución interna a la mitad del viewport (el brillo es suave) y máximo 30 fps.
   - Pausa fuera de pantalla, con la pestaña oculta y al perder el contexto WebGL.
   - Sin WebGL, con movimiento reducido o en modo calm no se crea: queda el halo CSS (.tn-glow). */

const VERT='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG=[
  'precision mediump float;',
  'uniform vec2 uRes;uniform float uT,uSpread,uGain;',
  'const vec3 BG=vec3(.0235,.0471,.0980);',                       /* #060C19 */
  'void main(){',
  '  vec2 uv=(gl_FragCoord.xy*2.-uRes)/min(uRes.x,uRes.y);',      /* centrado y con la proporción corregida */
  '  float c=cos(.55),s=sin(.55);uv=mat2(c,-s,s,c)*uv;',
  '  vec3 col=vec3(0.);',
  '  for(int i=0;i<3;i++){',
  '    float f=float(i);',
  '    float y=uv.y+(1.-f)*uSpread+sin(uv.x*2.5-uT*1.5)*.12;',
  '    float w=smoothstep(.93,.995,sin(y*6.+uT*2.)*.5+.5);',
  '    vec3 tint=f<.5?vec3(.455,.667,1.):(f<1.5?vec3(.298,.894,.929):vec3(.718,.831,1.));',
  '    col+=tint*w*(f<.5?1.:(f<1.5?.85:.7));',
  '  }',
  '  float r=length(gl_FragCoord.xy/uRes*2.-1.);',
  '  float vig=exp(-r*.5)*(.28+.72*smoothstep(.25,1.05,r));',      /* viñeta exponencial; la luz se concentra en los bordes y deja el centro (texto) más oscuro */
  '  gl_FragColor=vec4(BG+col*vig*uGain,1.);',
  '}'
].join('\n');

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

/* Devuelve { set(p), play(), pause(), setEnabled(bool), destroy() } o null si no hay WebGL */
export function createStreams(scene){
  const canvas=document.createElement('canvas');
  canvas.className='tn-streams';canvas.setAttribute('aria-hidden','true');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power',preserveDrawingBuffer:false});
  if(!gl)return null;

  const sh=(type,src)=>{const o=gl.createShader(type);gl.shaderSource(o,src);gl.compileShader(o);return gl.getShaderParameter(o,gl.COMPILE_STATUS)?o:null};
  const vs=sh(gl.VERTEX_SHADER,VERT),fs=sh(gl.FRAGMENT_SHADER,FRAG);
  const prog=gl.createProgram();
  if(!vs||!fs){return null}
  gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return null;
  gl.useProgram(prog);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);   /* un triángulo que cubre la pantalla */
  const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uRes=gl.getUniformLocation(prog,'uRes'),uT=gl.getUniformLocation(prog,'uT'),uSpread=gl.getUniformLocation(prog,'uSpread'),uGain=gl.getUniformLocation(prog,'uGain');

  scene.insertBefore(canvas,scene.firstChild);

  const SCALE=.35;                                  /* resolución interna respecto al viewport */
  const FRAME_MS=1000/30;
  let W=1,H=1;
  const resize=()=>{
    const w=Math.max(2,Math.round(scene.clientWidth*SCALE)),h=Math.max(2,Math.round(scene.clientHeight*SCALE));
    if(w===W&&h===H)return;
    W=w;H=h;canvas.width=W;canvas.height=H;gl.viewport(0,0,W,H);
  };
  const ro='ResizeObserver' in window?new ResizeObserver(resize):null;ro?.observe(scene);
  resize();

  let tGain=0,tSpread=.55,gain=0,spread=.55,enabled=true,running=false,drawing=false,raf=0,last=0,lost=false;
  const t0=performance.now();

  const active=()=>enabled&&running&&!lost&&(tGain>.004||gain>.004);
  const draw=now=>{
    gain+=(tGain-gain)*.14;spread+=(tSpread-spread)*.14;
    gl.uniform2f(uRes,W,H);
    gl.uniform1f(uT,(now-t0)*.0003*3.3);            /* reloj del shader: ~3,3x más lento que el real, como en el prompt */
    gl.uniform1f(uSpread,spread);
    gl.uniform1f(uGain,gain);
    gl.drawArrays(gl.TRIANGLES,0,3);
  };
  const loop=ts=>{
    raf=0;
    if(!active()){drawing=false;canvas.style.visibility='hidden';return}
    raf=requestAnimationFrame(loop);
    if(ts-last<FRAME_MS)return;
    last=ts;draw(ts);
  };
  const kick=()=>{
    if(!active()){if(drawing){drawing=false;canvas.style.visibility='hidden'}return}
    if(!drawing){drawing=true;canvas.style.visibility='visible'}
    if(!raf)raf=requestAnimationFrame(loop);
  };

  /* p: progreso del túnel 0..1. Los haces aparecen hacia el 40 %, se juntan según se acerca la salida. */
  const set=p=>{
    tGain=smooth(.40,.78,p)*.6;
    tSpread=.55+(.03-.55)*smooth(.50,.98,p);
    kick();
  };
  const play=()=>{running=true;kick()};
  const pause=()=>{running=false;if(raf){cancelAnimationFrame(raf);raf=0}drawing=false;canvas.style.visibility='hidden'};
  const setEnabled=v=>{enabled=!!v;if(enabled)kick();else pause2()};
  const pause2=()=>{if(raf){cancelAnimationFrame(raf);raf=0}drawing=false;canvas.style.visibility='hidden'};

  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;pause2()});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;kick()});
  const onVis=()=>{if(document.hidden)pause2();else kick()};
  document.addEventListener('visibilitychange',onVis);

  const destroy=()=>{
    pause2();ro?.disconnect();document.removeEventListener('visibilitychange',onVis);
    gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();
  };
  return {set,play,pause,setEnabled,destroy,canvas};
}
