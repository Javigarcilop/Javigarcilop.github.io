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

})();
