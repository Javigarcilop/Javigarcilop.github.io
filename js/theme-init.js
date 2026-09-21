/* Aplica el tema guardado antes de pintar la página, para evitar parpadeos. */
try{var t=localStorage.getItem('jg-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}
