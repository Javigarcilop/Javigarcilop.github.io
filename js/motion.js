/* Capa de animación con GSAP + ScrollTrigger.
   Es opcional: si GSAP no carga o el sistema pide reducir el movimiento, la página funciona igual sin ella. */
(()=>{
  const G=window.gsap,ST=window.ScrollTrigger;
  const enabled=!!(G&&ST)&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion=window.motion={enabled};
  if(!enabled)return;
  G.registerPlugin(ST);

  motion.card=el=>G.fromTo(el.children,{opacity:0,y:14},{opacity:1,y:0,duration:.5,stagger:.07,ease:'power2.out',clearProps:'opacity,transform'});

  /* ---------- Mapa de nodos: rebote elástico al soltar ---------- */
  motion.release=g=>{
    const c=g.querySelector('circle.core, circle.dot');
    if(c)G.fromTo(c,{scale:1.55},{scale:1,duration:1.1,ease:'elastic.out(1.1,.3)',transformOrigin:'50% 50%',clearProps:'transform'});
  };

  /* ---------- Cómo pienso: las fases avanzan con el scroll ---------- */
  document.addEventListener('DOMContentLoaded',()=>{
    const sec=document.getElementById('como-pienso'),think=sec.querySelector('.think');
    const panel=document.getElementById('thinkPanel'),n=THINKING.length;
    let st=null;

    G.from('.flow-node',{y:18,opacity:0,duration:.6,stagger:.12,ease:'back.out(2)',clearProps:'transform,opacity',
      scrollTrigger:{trigger:'#flow',start:'top 85%',once:true}});

    const pin=(target,start)=>{
      st=ST.create({
        trigger:target,pin:true,start,
        end:()=>'+='+Math.round(innerHeight*.55*(n-1)),
        snap:{snapTo:1/(n-1),duration:{min:.15,max:.4},delay:.08,ease:'power1.inOut'},
        onUpdate:self=>{
          const i=Math.round(self.progress*(n-1));
          if(i!==thinkIdx)setThink(i,false,true);
        }
      });
      return ()=>{st=null};
    };
    const mm=G.matchMedia();
    mm.add('(min-width:1081px) and (min-height:900px)',()=>pin(sec,'top top'));
    mm.add('(min-width:1081px) and (min-height:660px) and (max-height:899px)',()=>pin(think,'center center+=32'));

    document.addEventListener('thinkchange',e=>{
      G.fromTo(panel.children,{opacity:0,y:12},{opacity:1,y:0,duration:.45,stagger:.06,ease:'power2.out',clearProps:'opacity,transform'});
      /* Si se elige una fase con el ratón o el teclado mientras la sección está fijada, el scroll se alinea con ella. */
      if(!e.detail.fromScroll&&st&&st.isActive){
        scrollTo({top:st.start+(st.end-st.start)*e.detail.i/(n-1),behavior:'instant'});
      }
    });
  });
})();
