/* Capa de animación con GSAP + ScrollTrigger.
   Es opcional: si GSAP no carga o el sistema pide reducir el movimiento, la página funciona igual sin ella. */
(()=>{
  const G=window.gsap,ST=window.ScrollTrigger;
  const enabled=!!(G&&ST)&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion=window.motion={enabled};
  if(!enabled)return;
  G.registerPlugin(ST);

  /* ---------- Mapa de nodos: rebote elástico al soltar ---------- */
  motion.release=g=>{
    const c=g.querySelector('circle.core, circle.dot');
    if(c)G.fromTo(c,{scale:1.55},{scale:1,duration:1.1,ease:'elastic.out(1.1,.3)',transformOrigin:'50% 50%',clearProps:'transform'});
  };


  /* ---------- Proyectos: monitor 3D que se enciende con el scroll ---------- */
  motion.initProyectos=()=>{
    const flat=matchMedia('(max-width:820px), (pointer: coarse)').matches;
    const clamp=(v,a,b)=>v<a?a:v>b?b:v;
    const vis=document.querySelector('.visor');
    if(!vis)return;
    const scene=vis.querySelector('.escena-3d-contenedor'),rotor=vis.querySelector('.escena-rotor');
    const dev=vis.querySelector('.monitor'),off=vis.querySelector('.pantalla-apagada'),flash=vis.querySelector('.destello'),desk=vis.querySelector('.escritorio');
    const REST={rx:5,ry:-7};

    const tl=G.timeline({paused:true,defaults:{ease:'power2.out'}});
    /* Fase 1: el monitor se endereza y escala un poco */
    tl.fromTo(dev,flat?{scale:.95,y:24,opacity:0}:{rotationX:15,rotationY:-15,scale:1},
                  flat?{scale:1,y:0,opacity:1,duration:.9}:{rotationX:REST.rx,rotationY:REST.ry,scale:1.03,duration:1.4},0)
    /* Fase 2: la pantalla se enciende con un destello */
      .fromTo(off,{opacity:1},{opacity:0,duration:.6,ease:'power1.in'},.55)
      .fromTo(flash,{xPercent:-140,opacity:.9},{xPercent:140,duration:.9,ease:'power2.inOut'},.55)
      .set(flash,{opacity:0});
    /* Fase 3: el teclado aparece sobre el escritorio */
    if(!flat&&desk)tl.fromTo(desk,{opacity:0,y:30},{opacity:1,y:0,duration:.9},.4);

    /* Inclinación reactiva tras el reveal. Sobre la pantalla el monitor se endereza para poder usar la demo. */
    let ready=false;
    tl.eventCallback('onComplete',()=>{ready=true});
    if(!flat){
      const o={duration:.9,ease:'power3.out'};
      const qRX=G.quickTo(rotor,'rotationX',o),qRY=G.quickTo(rotor,'rotationY',o);
      const qMX=G.quickTo(dev,'rotationX',o),qMY=G.quickTo(dev,'rotationY',o);
      let rect=null;
      addEventListener('scroll',()=>{rect=null},{passive:true});
      scene.addEventListener('pointermove',e=>{
        if(!ready)return;
        if(e.target.closest&&e.target.closest('.pantalla')){qRX(0);qRY(0);qMX(0);qMY(0);return}
        rect=rect||scene.getBoundingClientRect();
        const nx=clamp((e.clientX-rect.left)/rect.width*2-1,-1,1),ny=clamp((e.clientY-rect.top)/rect.height*2-1,-1,1);
        qRY(nx*9);qRX(-ny*6);qMX(REST.rx);qMY(REST.ry);
      });
      scene.addEventListener('pointerleave',()=>{qRX(0);qRY(0);qMX(REST.rx);qMY(REST.ry)});
    }

    ST.create({
      trigger:vis,start:'top 75%',
      onEnter:()=>tl.play(),onEnterBack:()=>tl.play(),
      onRefresh:self=>{if(self.progress>0&&tl.progress()===0)tl.play()}
    });
  };
})();
