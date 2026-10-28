/* Aplica el tema guardado antes de pintar la página, para evitar parpadeos. */
try{var t=localStorage.getItem('jg-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}
/* Las apariciones al hacer scroll solo se activan si hay JavaScript: sin él, todo queda visible. */
document.documentElement.classList.add('js');
