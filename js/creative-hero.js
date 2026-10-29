/* Fondo del hero: formas de diseño que un escáner láser transforma en flujos de código.
   Decorativo y opcional: sin GSAP o con movimiento reducido se pinta un único fotograma estático. */
(()=>{
  const hero=document.querySelector('.hero');
  if(!hero)return;

  const G=window.gsap;
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live=!!G&&!calm;
  const coarse=matchMedia('(pointer: coarse)').matches;

  const cv=document.createElement('canvas');
  cv.className='hero-fx';
  cv.setAttribute('aria-hidden','true');
  hero.prepend(cv);
  const ctx=cv.getContext('2d');
  if(!ctx)return;

  const MONO='ui-monospace,SFMono-Regular,Consolas,Menlo,monospace';
  const TOKENS=['{ }','</>','=>','200','JWT','SQL','POST','[ ]','API','0x1F','GET','404'];
  const HEX='0123456789abcdef';
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};

  /* Valores normalizados (0–1) para que el diseño no dependa del tamaño */
  const COLS=coarse?5:9,ROWS=coarse?4:4;
  const items=[];
  let seed=7;
  const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    items.push({
      x:(c+.15+rnd()*.7)/COLS,y:(r+.15+rnd()*.7)/ROWS,
      type:Math.floor(rnd()*6),size:.7+rnd()*.9,d:.2+rnd()*.8,
      rot:(rnd()-.5)*1.2,tok:TOKENS[Math.floor(rnd()*TOKENS.length)],
      cyan:rnd()<.35,ox:0,oy:0
    });
  }
  const LANES=coarse?5:9,PER=coarse?4:7;
  const streams=[];
  for(let l=0;l<LANES;l++)for(let k=0;k<PER;k++){
    streams.push({y:(l+.5)/LANES+(rnd()-.5)*.03,x:rnd(),v:.012+rnd()*.03,t:HEX[Math.floor(rnd()*16)]+HEX[Math.floor(rnd()*16)]});
  }

  const S={scan:calm?.55:-.04,px:0,py:0,mx:-9999,my:-9999,vis:true,dir:1};
  let W=0,H=0,dpr=1,col={blue:'#2F6BFF',cyan:'#19D3F3',text:'#1E55E6'};
  let prevScan=S.scan,frame=0,mobileW=false,heroTop=0;

  function readColors(){
    const cs=getComputedStyle(document.documentElement);
    col={blue:cs.getPropertyValue('--blue').trim()||col.blue,cyan:cs.getPropertyValue('--cyan').trim()||col.cyan,text:cs.getPropertyValue('--blue-text').trim()||col.text};
  }
  function resize(){
    const r=hero.getBoundingClientRect();
    W=Math.max(1,Math.round(r.width));H=Math.max(1,Math.round(r.height));heroTop=r.top;
    dpr=Math.min(window.devicePixelRatio||1,coarse?1.5:2);
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    mobileW=W<900;
    draw();
  }

  /* Visibilidad del texto: el fondo se atenúa donde está el texto para no restarle legibilidad */
  const weight=x=>mobileW?.28:.22+.78*smooth((x-.36)/.26);

  function shape(it,px,py,s,a,k){
    ctx.globalAlpha=a;
    ctx.lineWidth=1.5;
    const c=it.cyan?col.cyan:col.blue;
    ctx.strokeStyle=c;ctx.fillStyle=c;
    ctx.save();ctx.translate(px,py);ctx.rotate(it.rot*k);
    ctx.beginPath();
    switch(it.type){
      case 0:ctx.arc(0,0,s*.55,0,6.283);ctx.stroke();ctx.globalAlpha=a*.18;ctx.fill();break;
      case 1:ctx.rect(-s*.5,-s*.5,s,s);ctx.stroke();break;
      case 2:ctx.moveTo(0,-s*.6);ctx.lineTo(s*.55,s*.45);ctx.lineTo(-s*.55,s*.45);ctx.closePath();ctx.stroke();break;
      case 3:ctx.arc(0,0,s*.6,0,6.283);ctx.moveTo(s*.28,0);ctx.arc(0,0,s*.28,0,6.283);ctx.stroke();break;
      case 4:
        ctx.moveTo(-s*.7,s*.3);ctx.quadraticCurveTo(0,-s*.9,s*.7,s*.3);ctx.stroke();
        ctx.globalAlpha=a*.7;ctx.fillRect(-s*.7-3,s*.3-3,6,6);ctx.fillRect(s*.7-3,s*.3-3,6,6);
        break;
      default:
        ctx.globalAlpha=a*.5;ctx.fillRect(-s*.5,-s*.45,s,s*.3);
        ctx.globalAlpha=a*.8;ctx.fillRect(-s*.5,-s*.12,s,s*.3);
        ctx.globalAlpha=a;ctx.fillRect(-s*.5,s*.21,s,s*.3);
    }
    ctx.restore();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    const sx=S.scan*W,band=.07;
    const unit=Math.min(W,H*1.6);
    const base=clamp(unit*.045,16,40);

    /* Estela detrás de la línea, según el sentido del movimiento */
    if(S.scan>-.03&&S.scan<1.03){
      const len=W*.16,x0=S.dir>0?sx-len:sx,x1=S.dir>0?sx:sx+len;
      const g=ctx.createLinearGradient(x0,0,x1,0);
      g.addColorStop(S.dir>0?0:1,'rgba(25,211,243,0)');
      g.addColorStop(S.dir>0?1:0,'rgba(25,211,243,.13)');
      ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(x0,0,len,H);
    }

    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`600 ${Math.round(clamp(base*.36,11,14))}px ${MONO}`;

    for(let i=0;i<items.length;i++){
      const it=items[i];
      const m=smooth((S.scan-it.x)/band);
      const near=1-clamp(Math.abs(S.scan-it.x)/band,0,1);
      const w=weight(it.x);
      let tx=S.px*it.d,ty=S.py*it.d;
      if(S.mx>-9000){
        const dx=S.mx-(it.x*W+tx),dy=S.my-(it.y*H+ty),d2=dx*dx+dy*dy;
        if(d2<22500){const d=Math.sqrt(d2)||1,f=(1-d/150);const pull=f*f*14;tx+=dx/d*pull;ty+=dy/d*pull}
      }
      it.ox+=(tx-it.ox)*.12;it.oy+=(ty-it.oy)*.12;
      const px=it.x*W+it.ox,py=it.y*H+it.oy,s=base*it.size;
      const jit=near>0?(Math.sin(frame*1.7+i*3)*2.2*near):0;
      if(m<.98)shape(it,px+jit,py,s*(1-.3*m),(1-m)*.5*w,1+m);
      if(m>.02){
        ctx.globalAlpha=Math.min(.6,m*.6*w+near*.18);
        ctx.fillStyle=col.text;
        ctx.fillText(it.tok,px,py);
      }
    }

    /* Flujos de datos: solo detrás de la línea */
    ctx.font=`500 11px ${MONO}`;ctx.fillStyle=col.text;
    for(let i=0;i<streams.length;i++){
      const st=streams[i],m=smooth((S.scan-st.x)/.12);
      if(m<.02)continue;
      ctx.globalAlpha=m*.26*weight(st.x);
      ctx.fillText(st.t,st.x*W+S.px*.4,st.y*H+S.py*.4);
    }

    /* Línea de escáner */
    if(S.scan>-.03&&S.scan<1.03){
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'rgba(25,211,243,0)');g.addColorStop(.2,'rgba(25,211,243,.9)');
      g.addColorStop(.8,'rgba(25,211,243,.9)');g.addColorStop(1,'rgba(25,211,243,0)');
      ctx.globalAlpha=.85;ctx.fillStyle=g;ctx.fillRect(sx-1,0,2,H);
      ctx.globalAlpha=.1;ctx.fillRect(sx-7,0,14,H);
    }
    ctx.globalAlpha=1;
  }

  function tick(){
    frame++;
    if(!S.vis)return;
    if(coarse&&(frame&1))return;
    for(let i=0;i<streams.length;i++){
      const st=streams[i];
      st.x+=st.v*.016;if(st.x>1.02){st.x=-.02;st.t=HEX[(Math.random()*16)|0]+HEX[(Math.random()*16)|0]}
    }
    if(S.scan!==prevScan){S.dir=S.scan>prevScan?1:-1;prevScan=S.scan}
    draw();
  }

  readColors();
  new ResizeObserver(resize).observe(hero);
  const retheme=()=>{readColors();draw()};
  new MutationObserver(retheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',retheme);
  resize();

  if(!live)return;

  /* Escáner: ida (diseño → código) y vuelta (código → diseño) */
  const tl=G.timeline({delay:1.1,repeat:-1,repeatDelay:5,yoyo:true,defaults:{ease:'power2.inOut'}});
  tl.to(S,{scan:1.04,duration:3.4});

  new IntersectionObserver(es=>{S.vis=es[0].isIntersecting;tl.paused(!S.vis)},{threshold:0}).observe(hero);
  G.ticker.add(tick);

  /* Paralaje magnético: solo con puntero fino */
  if(!coarse){
    const qx=G.quickTo(S,'px',{duration:.9,ease:'power3.out'}),qy=G.quickTo(S,'py',{duration:.9,ease:'power3.out'});
    const qmx=G.quickTo(S,'mx',{duration:.35,ease:'power3.out'}),qmy=G.quickTo(S,'my',{duration:.35,ease:'power3.out'});
    addEventListener('scroll',()=>{heroTop=hero.getBoundingClientRect().top},{passive:true});
    addEventListener('pointermove',e=>{
      qx((e.clientX/innerWidth-.5)*-30);qy((e.clientY/innerHeight-.5)*-24);
      const inside=e.clientY>=heroTop&&e.clientY<=heroTop+H;
      if(inside){if(S.mx<-9000){S.mx=e.clientX;S.my=e.clientY-heroTop}qmx(e.clientX);qmy(e.clientY-heroTop)}
      else{S.mx=-9999}
    },{passive:true});
    document.addEventListener('pointerleave',()=>{S.mx=-9999},{passive:true});
  }
})();
