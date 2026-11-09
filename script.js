const opening=document.getElementById('opening');
const envelope=document.getElementById('envelope');
const openButton=document.getElementById('openButton');
const main=document.getElementById('main');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let opened=false;
function revealInvitation(){
  main.hidden=false;
  opening.inert=true;
  opening.classList.add('gone');
  document.body.classList.remove('opening-active');
  window.scrollTo(0,0);
  const title=document.getElementById('inviteTitle');
  title.setAttribute('tabindex','-1');
  title.focus({preventScroll:true});
  setTimeout(()=>{opening.hidden=true;},reducedMotion.matches?0:650);
}
function openInvitation(){
  if(opened)return;
  opened=true;
  envelope.setAttribute('aria-disabled','true');
  openButton.disabled=true;
  envelope.classList.remove('is-hovered');
  ['--tilt-x','--tilt-y','--lift-y'].forEach(name=>envelope.style.removeProperty(name));
  if(reducedMotion.matches){revealInvitation();return;}
  opening.classList.add('is-playing');
  envelope.classList.add('cutting');
  setTimeout(()=>envelope.classList.add('opened'),1550);
  setTimeout(revealInvitation,4550);
}
envelope.addEventListener('click',openInvitation);
openButton.addEventListener('click',openInvitation);
envelope.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openInvitation();}});
envelope.addEventListener('pointerenter',()=>{if(!opened)envelope.classList.add('is-hovered');});
envelope.addEventListener('pointermove',event=>{
  if(opened||reducedMotion.matches||event.pointerType==='touch')return;
  const rect=envelope.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;
  envelope.style.setProperty('--tilt-y',x*15+'deg');
  envelope.style.setProperty('--tilt-x',-y*12+'deg');
  envelope.style.setProperty('--lift-y','-16px');
});
envelope.addEventListener('pointerleave',()=>{envelope.classList.remove('is-hovered');['--tilt-x','--tilt-y','--lift-y'].forEach(name=>envelope.style.removeProperty(name));});
