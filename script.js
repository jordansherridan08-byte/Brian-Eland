const opening=document.getElementById('opening');
const envelope=document.getElementById('envelope');
const openButton=document.getElementById('openButton');
const main=document.getElementById('main');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle=document.getElementById('motionToggle');
const dustCanvas=document.getElementById('goldDust');
const dustContext=dustCanvas?.getContext('2d');
let opened=false,effectsPaused=false,flapTimer=0,revealTimer=0,openingHideTimer=0,introTimer=0;

function settleIntro(){
  clearTimeout(introTimer);introTimer=0;
  document.body.classList.add('intro-complete');
}

function revealInvitation(){
  if(!main.hidden)return;
  clearTimeout(flapTimer);
  clearTimeout(revealTimer);
  main.hidden=false;
  opening.inert=true;
  opening.classList.add('gone');
  document.body.classList.remove('opening-active');
  document.body.classList.add('invitation-open');
  if(reducedMotion.matches||effectsPaused||document.body.classList.contains('intro-complete'))settleIntro();
  else introTimer=setTimeout(settleIntro,2100);
  window.scrollTo(0,0);
  const title=document.getElementById('inviteTitle');
  title.setAttribute('tabindex','-1');
  title.focus({preventScroll:true});
  openingHideTimer=setTimeout(()=>{opening.hidden=true;},reducedMotion.matches||effectsPaused?0:650);
  releaseGold();
}
function openInvitation(){
  if(opened)return;
  opened=true;
  envelope.setAttribute('aria-disabled','true');
  openButton.disabled=true;
  envelope.classList.remove('is-hovered');
  ['--tilt-x','--tilt-y','--lift-y'].forEach(name=>envelope.style.removeProperty(name));
  if(reducedMotion.matches||effectsPaused){revealInvitation();return;}
  opening.classList.add('is-playing');
  envelope.classList.add('cutting');
  flapTimer=setTimeout(()=>envelope.classList.add('opened'),1550);
  revealTimer=setTimeout(revealInvitation,4550);
}
envelope.addEventListener('click',openInvitation);
openButton.addEventListener('click',openInvitation);
envelope.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openInvitation();}});
envelope.addEventListener('pointerenter',()=>{if(!opened&&!effectsPaused&&!reducedMotion.matches)envelope.classList.add('is-hovered');});
envelope.addEventListener('pointermove',event=>{
  if(opened||effectsPaused||reducedMotion.matches||event.pointerType==='touch')return;
  const rect=envelope.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;
  envelope.style.setProperty('--tilt-y',x*15+'deg');
  envelope.style.setProperty('--tilt-x',-y*12+'deg');
  envelope.style.setProperty('--lift-y','-16px');
});
function clearEnvelopeTilt(){
  envelope.classList.remove('is-hovered');
  ['--tilt-x','--tilt-y','--lift-y'].forEach(name=>envelope.style.removeProperty(name));
}
envelope.addEventListener('pointerleave',clearEnvelopeTilt);

// A small, non-interactive layer of gold dust, kept mostly at the edges.
let dustWidth=0,dustHeight=0,dustFrame=0,lastDraw=0,dustClock=0,resizeFrame=0;
let dust=[],goldBurst=[];
const goldColours=['#efd99a','#d8ae55','#fff0bd'];
function edgePosition(){
  const edge=Math.random()<.88;
  return edge?(Math.random()<.5?Math.random()*.14:.86+Math.random()*.14)*dustWidth:Math.random()*dustWidth;
}
function makeDust(randomHeight=true){
  return {x:edgePosition(),y:randomHeight?Math.random()*dustHeight:dustHeight+12,
    radius:.6+Math.random()*1.45,speed:5+Math.random()*12,phase:Math.random()*Math.PI*2,
    sway:2+Math.random()*5,twinkle:.45+Math.random()*.55,star:Math.random()<.18,
    colour:goldColours[Math.floor(Math.random()*goldColours.length)]};
}
function sizeDust(){
  if(!dustCanvas||!dustContext)return;
  const nextWidth=Math.max(1,document.documentElement.clientWidth);
  const nextHeight=Math.max(1,window.innerHeight);
  if(nextWidth===dustWidth&&nextHeight===dustHeight)return;
  dustWidth=nextWidth;dustHeight=nextHeight;
  const ratio=Math.min(window.devicePixelRatio||1,1.5);
  dustCanvas.width=Math.round(dustWidth*ratio);
  dustCanvas.height=Math.round(dustHeight*ratio);
  dustCanvas.style.width=dustWidth+'px';
  dustCanvas.style.height=dustHeight+'px';
  dustContext.setTransform(ratio,0,0,ratio,0,0);
  dust=Array.from({length:dustWidth<700?32:60},()=>makeDust());
  goldBurst=[];
}
function sparkle(x,y,radius,star,colour,alpha){
  dustContext.globalAlpha=alpha;
  dustContext.fillStyle=colour;
  dustContext.beginPath();
  if(star){
    dustContext.moveTo(x,y-radius*2.4);
    dustContext.lineTo(x+radius*.36,y-radius*.36);
    dustContext.lineTo(x+radius*2.4,y);
    dustContext.lineTo(x+radius*.36,y+radius*.36);
    dustContext.lineTo(x,y+radius*2.4);
    dustContext.lineTo(x-radius*.36,y+radius*.36);
    dustContext.lineTo(x-radius*2.4,y);
    dustContext.lineTo(x-radius*.36,y-radius*.36);
    dustContext.closePath();
  }else dustContext.arc(x,y,radius,0,Math.PI*2);
  dustContext.fill();
}
function effectsAllowed(){return !effectsPaused&&!reducedMotion.matches&&!document.hidden;}
function drawDust(now){
  dustFrame=0;
  if(!effectsAllowed()||!dustContext)return;
  if(lastDraw&&now-lastDraw<1000/30){dustFrame=requestAnimationFrame(drawDust);return;}
  const elapsed=lastDraw?Math.min((now-lastDraw)/1000,.06):1/30;
  lastDraw=now;dustClock+=elapsed;
  dustContext.clearRect(0,0,dustWidth,dustHeight);
  for(const particle of dust){
    particle.y-=particle.speed*elapsed;
    if(particle.y<-12)Object.assign(particle,makeDust(false));
    const twinkle=.12+(.5+.5*Math.sin(dustClock*particle.twinkle+particle.phase))*.48;
    sparkle(particle.x+Math.sin(dustClock*.4+particle.phase)*particle.sway,particle.y,
      particle.radius,particle.star,particle.colour,twinkle);
  }
  for(let i=goldBurst.length-1;i>=0;i--){
    const particle=goldBurst[i];particle.life-=elapsed;
    if(particle.life<=0){goldBurst.splice(i,1);continue;}
    particle.x+=particle.vx*elapsed;particle.y+=particle.vy*elapsed;
    particle.vx*=Math.pow(.48,elapsed);particle.vy+=10*elapsed;
    const fade=Math.min(1,(particle.maxLife-particle.life)*5)*Math.min(1,particle.life/.9);
    sparkle(particle.x,particle.y,particle.radius,true,particle.colour,fade*.7);
  }
  dustContext.globalAlpha=1;
  dustFrame=requestAnimationFrame(drawDust);
}
function stopDust(){
  cancelAnimationFrame(dustFrame);dustFrame=0;lastDraw=0;
  goldBurst=[];
  dustContext?.clearRect(0,0,dustWidth,dustHeight);
}
function startDust(){
  if(!dustContext||!effectsAllowed()||dustFrame)return;
  sizeDust();lastDraw=0;dustFrame=requestAnimationFrame(drawDust);
}
function releaseGold(){
  if(!dustContext||!effectsAllowed())return;
  sizeDust();
  const rect=document.getElementById('inviteTitle').getBoundingClientRect();
  const originX=rect.left+rect.width/2,originY=Math.min(dustHeight*.5,rect.top+rect.height*.35);
  goldBurst=Array.from({length:dustWidth<700?26:42},()=>{
    const angle=Math.random()*Math.PI*2,speed=55+Math.random()*115,life=1.8+Math.random()*.9;
    return {x:originX,y:originY,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-28,
      radius:.9+Math.random()*1.1,life,maxLife:life,colour:goldColours[Math.floor(Math.random()*goldColours.length)]};
  });
  startDust();
}
function updateMotion(){
  document.body.classList.toggle('motion-paused',effectsPaused);
  if(motionToggle){
    motionToggle.hidden=reducedMotion.matches;
    motionToggle.textContent=effectsPaused?'Play effects':'Pause effects';
    motionToggle.setAttribute('aria-label',effectsPaused?'Play decorative effects':'Pause decorative effects');
  }
  if(!effectsAllowed()){
    stopDust();clearEnvelopeTilt();
    if(opened&&main.hidden)revealInvitation();
    else if(opened&&(effectsPaused||reducedMotion.matches))settleIntro();
  }else startDust();
}
motionToggle?.addEventListener('click',()=>{effectsPaused=!effectsPaused;updateMotion();});
reducedMotion.addEventListener('change',updateMotion);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopDust();else startDust();});
window.addEventListener('resize',()=>{
  if(resizeFrame)return;
  resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;sizeDust();if(effectsAllowed())startDust();});
},{passive:true});
window.addEventListener('pagehide',()=>{
  stopDust();cancelAnimationFrame(resizeFrame);resizeFrame=0;
  clearTimeout(flapTimer);clearTimeout(revealTimer);clearTimeout(openingHideTimer);
  if(opened)settleIntro();
});
window.addEventListener('pageshow',()=>{
  if(opened&&main.hidden)revealInvitation();
  else if(opened){opening.hidden=true;settleIntro();}
  updateMotion();
});
sizeDust();updateMotion();

// Fixed Johannesburg event time; the clock stays correct in every guest's time zone.
const celebrationTime=new Date('2026-12-05T12:30:00+02:00').getTime();
const countdownRoot=document.getElementById('countdown');
const countdownNumbers=document.getElementById('countdownNumbers');
const countdownLabel=document.getElementById('countdownLabel');
const countdownFields=['countDays','countHours','countMinutes','countSeconds'].map(id=>document.getElementById(id));
let countdownTicker=0;
function updateCountdown(){
  if(!countdownRoot)return false;
  const seconds=Math.max(0,Math.ceil((celebrationTime-Date.now())/1000));
  countdownRoot.hidden=false;
  if(seconds===0){
    countdownLabel.textContent='It’s time to celebrate!';
    countdownNumbers.hidden=true;
    countdownRoot.setAttribute('aria-label','Brian’s 70th birthday celebration has started.');
    return false;
  }
  const values=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
  countdownNumbers.hidden=false;
  values.forEach((value,index)=>{const text=String(value).padStart(2,'0');if(countdownFields[index].textContent!==text)countdownFields[index].textContent=text;});
  countdownRoot.setAttribute('aria-label',`${values[0]} days, ${values[1]} hours, ${values[2]} minutes and ${values[3]} seconds until Brian’s 70th birthday.`);
  return true;
}
function stopCountdown(){clearInterval(countdownTicker);countdownTicker=0;}
function startCountdown(){
  stopCountdown();
  if(updateCountdown()&&!document.hidden)countdownTicker=setInterval(()=>{if(!updateCountdown())stopCountdown();},1000);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCountdown();else startCountdown();});
window.addEventListener('pagehide',stopCountdown);
window.addEventListener('pageshow',startCountdown);
startCountdown();

// Direct links show the relevant part of the same invitation without replaying the envelope.
if(window.location.hash==='#inviteTitle'||window.location.hash==='#rsvp'){
  opened=true;
  openButton.disabled=true;
  envelope.setAttribute('aria-disabled','true');
  main.hidden=false;
  opening.hidden=true;
  opening.inert=true;
  document.body.classList.remove('opening-active');
  document.body.classList.add('invitation-open');
  settleIntro();
  const target=document.getElementById(window.location.hash==='#rsvp'?'rsvp':'inviteTitle');
  target.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});
  if(window.location.hash==='#rsvp')target.scrollIntoView({block:'start'});
}
