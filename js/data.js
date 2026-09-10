export const DEMO_DAY=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Prague'});
export const COLORS=['#9d63e4','#398aef','#45a56f','#efaa40','#df6380','#8195b4'];
export function upgrade(state){
 if(!state.vehicleBookings){state.vehicleBookings=[];for(const a of state.assignments)for(const vehicle of a.vehicles||[])if(!state.vehicleBookings.some(b=>b.job===a.job&&b.date===a.date&&b.vehicle===vehicle))state.vehicleBookings.push({id:uid(),job:a.job,date:a.date,vehicle,hours:8});}
 for(const j of state.jobs)if(j.estimated===undefined)j.estimated=null;
 return state;
}
export const bookings=(state,job,date)=>state.vehicleBookings.filter(b=>b.job===job&&b.date===date);
export function jobTotals(state,job){return {planned:state.assignments.filter(a=>a.job===job).reduce((sum,a)=>sum+Number(a.planned||0),0),actual:state.attendance.filter(a=>a.job===job).reduce((sum,a)=>sum+(hours(a)||0),0)}}
export function saveAssignment(state,row,vehicleRows){
 const next=structuredClone(state),old=next.assignments.find(a=>a.id===row.id);
 if(!next.jobs.some(j=>j.id===row.job)||!next.workers.some(w=>w.id===row.worker))throw Error('Vyberte pracovníka a zakázku.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||dateKey(new Date(row.date+'T12:00:00'))!==row.date)throw Error('Neplatné datum.');
 if(!Number.isFinite(row.planned)||row.planned<0||row.planned>24)throw Error('Hodiny pracovníka musí být mezi 0 a 24.');
 if(old&&(old.worker!==row.worker||old.date!==row.date||old.job!==row.job)&&next.attendance.some(t=>t.worker===old.worker&&t.job===old.job&&localDate(t.start)===old.date))throw Error('U tohoto přiřazení už je docházka. Přesun by ji oddělil od plánu; nejdřív zkontrolujte docházku.');
 for(const b of vehicleRows)if(!next.vehicles.some(v=>v.id===b.vehicle)||!Number.isFinite(b.hours)||b.hours<0||b.hours>24)throw Error('Hodiny každého auta musí být mezi 0 a 24.');
 if(new Set(vehicleRows.map(b=>b.vehicle)).size!==vehicleRows.length)throw Error('Vozidlo je vybrané vícekrát.');
 if(old)Object.assign(old,row);else next.assignments.push(row);
 next.vehicleBookings=next.vehicleBookings.filter(b=>b.job!==row.job||b.date!==row.date);
 next.vehicleBookings.push(...vehicleRows.map(b=>({...b,id:b.id||uid(),job:row.job,date:row.date})));
 for(const a of next.assignments)a.vehicles=bookings(next,a.job,a.date).map(b=>b.vehicle);
 return next;
}
export function moveBooking(state,payload,target){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(target.date)||dateKey(new Date(target.date+'T12:00:00'))!==target.date)throw Error('Neplatné datum přesunu.');
 const next=structuredClone(state);
 if(target.kind==='workers'){
  const a=next.assignments.find(a=>a.id===payload.assignment);if(!a)throw Error('Přiřazení už neexistuje.');
  return saveAssignment(next,{...a,worker:target.resource,date:target.date},bookings(next,a.job,target.date));
 }
 const b=next.vehicleBookings.find(b=>b.id===payload.booking);if(!b)throw Error('Přetahujte kartu z pohledu vozidel.');
 if(!next.vehicles.some(v=>v.id===target.resource))throw Error('Vozidlo neexistuje.');
 if(next.vehicleBookings.some(x=>x.id!==b.id&&x.job===b.job&&x.date===target.date&&x.vehicle===target.resource))throw Error('Toto auto už je na zakázce v cílovém dni.');
 Object.assign(b,{vehicle:target.resource,date:target.date});for(const a of next.assignments)a.vehicles=bookings(next,a.job,a.date).map(x=>x.vehicle);return next;
}
export function seed(){
 const jobs=[{id:'j1',name:'Rezidence Park',color:COLORS[0],address:'Praha 5 · Smíchov',skill:'s1',documents:[{name:'Projektová dokumentace',url:'https://www.microsoft.com/microsoft-365/sharepoint/collaboration'}]},{id:'j2',name:'Škola Zbraslav',color:COLORS[1],address:'Praha 16 · Zbraslav',skill:'s1',documents:[]},{id:'j3',name:'Servis Praha',color:COLORS[2],address:'Praha 4 · Pankrác',skill:'s3',documents:[]}];
 const workers=[{id:'w1',name:'Jan Novák',email:'jan@example.invalid',role:'worker',card:'DEMO 4821',skills:['s1']},{id:'w2',name:'Petr Dvořák',email:'petr@example.invalid',role:'worker',card:'DEMO 3917',skills:['s1','s2']},{id:'w3',name:'Martin Svoboda',email:'martin@example.invalid',role:'dispatcher',card:'DEMO 6204',skills:['s3']}];
 const vehicles=[{id:'v1',name:'Ford Transit',plate:'1AB 2345'},{id:'v2',name:'VW Caddy',plate:'2BC 5678'}];
 const assignments=[],attendance=[];const order=[['j1','j2','j3','j1','j2'],['j3','j1','j2','j2','j3'],['j2','j3','j1','j1','j1']];
 for(let wi=0;wi<3;wi++)for(let d=0;d<5;d++){
  const date=`2026-09-${String(7+d).padStart(2,'0')}`,job=order[wi][d];assignments.push({id:`a${wi}${d}`,worker:workers[wi].id,job,date,start:'07:00',planned:8,vehicles:['v1','v2']});
  if(date<DEMO_DAY){const start=`${date}T07:0${wi}:00`,duration=wi===0&&d===0?7.5:8;attendance.push({id:`t${wi}${d}`,worker:workers[wi].id,job,start,end:new Date(new Date(start).getTime()+duration*3600000).toISOString(),breakMinutes:0});}
 }
 return {company:{name:'EL-MORREL',logo:null,dayStart:'07:00',tolerance:15,hours:8,allowOtherJobs:true},skills:[{id:'s1',name:'Elektroinstalace',active:true},{id:'s2',name:'Optika',active:true},{id:'s3',name:'Servis',active:true}],jobs,workers,vehicles,assignments,attendance,fuel:[],reviewed:[],history:[]};
}
export const uid=()=>crypto.randomUUID();
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const localDate=s=>dateKey(new Date(s));
export const fmtHours=n=>Number(n).toLocaleString('cs-CZ',{maximumFractionDigits:2});
export const time=s=>new Date(s).toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});
export const hours=t=>t.end?Math.max(0,(new Date(t.end)-new Date(t.start))/3600000-(t.breakMinutes||0)/60):null;
export const safeColor=c=>/^#[\da-f]{6}$/i.test(c??'')?c:COLORS[0];
export function safeUrl(raw){try{const u=new URL(raw);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
export function actual(state,worker,job,date){const rows=state.attendance.filter(t=>t.worker===worker&&t.job===job&&localDate(t.start)===date);return {rows,total:rows.reduce((s,t)=>s+(hours(t)??0),0),open:rows.some(t=>!t.end)};}
export function mismatch(state,job,date){const groups=new Map();for(const t of state.attendance.filter(t=>t.job===job&&localDate(t.start)===date&&t.end))groups.set(t.worker,(groups.get(t.worker)||0)+hours(t));return groups.size>1&&new Set([...groups.values()].map(h=>Math.round(h*60))).size>1;}
export function arrive(state,worker,job,now){
 if(state.attendance.some(t=>t.worker===worker&&!t.end))throw Error('Příchod už je zaznamenaný.');
 if(!state.jobs.some(j=>j.id===job)||!state.workers.some(w=>w.id===worker))throw Error('Vyberte existující zakázku a pracovníka.');
 state.attendance.push({id:uid(),worker,job,start:now,end:null,breakMinutes:0});
 const date=localDate(now);if(!state.assignments.some(a=>a.worker===worker&&a.job===job&&a.date===date))state.assignments.push({id:uid(),worker,job,date,start:time(now),planned:0,vehicles:[],fromAttendance:true});
}
export function depart(state,worker,now,breakMinutes=0){const row=state.attendance.find(t=>t.worker===worker&&!t.end);if(!row)throw Error('Nemáte zaznamenaný příchod.');const duration=(new Date(now)-new Date(row.start))/60000;if(!Number.isFinite(breakMinutes)||breakMinutes<0||breakMinutes>duration)throw Error('Přestávka nesmí přesáhnout délku práce.');if(duration<0)throw Error('Odchod nemůže být před příchodem.');row.end=now;row.breakMinutes=breakMinutes;return row;}
export function reportRows(state,{month,job,worker}){return state.attendance.filter(t=>t.end&&localDate(t.start).startsWith(month)&&(!job||t.job===job)&&(!worker||t.worker===worker)).sort((a,b)=>a.start.localeCompare(b.start)).map(t=>({date:localDate(t.start),worker:state.workers.find(w=>w.id===t.worker)?.name??'—',job:state.jobs.find(j=>j.id===t.job)?.name??'—',arrival:time(t.start),departure:time(t.end),breakMinutes:t.breakMinutes||0,hours:hours(t)}));}
