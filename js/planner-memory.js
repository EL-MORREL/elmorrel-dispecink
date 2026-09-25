// UI-only memory, isolated by account and company. No requests or business data.
export function createPlannerMemory({identity,read,restore}){
 let key=null,record={},visible=false,layout='',restoring=false,frame=0,timer=0;
 const mode=()=>matchMedia('(max-width:700px)').matches?'mobile':'desktop';
 const validPoint=p=>p&&['x','y','left','top'].every(k=>Number.isFinite(p[k])&&p[k]>=0);
 function write(){if(!key)return;try{localStorage.setItem(key,JSON.stringify(record))}catch{}}
 function capture(){if(!visible||restoring)return;const b=document.querySelector('.board-wrap');record.positions??={};record.positions[layout]={x:window.scrollX,y:window.scrollY,left:b?.scrollLeft||0,top:b?.scrollTop||0};}
 function remember(){if(!key)return;record.selection=read();write()}
 function before(){
  const id=identity(),next=id?'planner-position-v1:'+id:null;
  if(next!==key){cancelAnimationFrame(frame);clearTimeout(timer);key=next;record={};visible=false;restoring=false;try{record=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}if(typeof record!=='object'||Array.isArray(record))record={};if(!record.positions||typeof record.positions!=='object'||Array.isArray(record.positions))record.positions={};restore(record.selection&&typeof record.selection==='object'?record.selection:{});}
  capture();
 }
 function after(isPlan){
  visible=isPlan;if(!isPlan){cancelAnimationFrame(frame);restoring=false;write();return}
  layout=mode();remember();const p=record.positions?.[layout];if(!validPoint(p))return;
  restoring=true;cancelAnimationFrame(frame);
  const apply=()=>{const b=document.querySelector('.board-wrap');if(b){b.scrollLeft=p.left;b.scrollTop=p.top}window.scrollTo({left:p.x,top:p.y,behavior:'instant'});};
  apply();frame=requestAnimationFrame(()=>{if(visible){apply();restoring=false;}});
 }
 function saveScroll(){if(!visible||restoring)return;capture();clearTimeout(timer);timer=setTimeout(remember,120)}
 document.addEventListener('scroll',saveScroll,{capture:true,passive:true});
 window.addEventListener('pagehide',()=>{capture();if(visible)remember();else write()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){capture();if(visible)remember()}});
 return {before,after,remember,reset(){capture();write();cancelAnimationFrame(frame);clearTimeout(timer);key=null;record={};visible=false;restoring=false}};
}
