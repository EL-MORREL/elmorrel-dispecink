export function blockingAbsences(s,worker,date,start=null,hours=0){
 const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
 const from=start?Date.parse(date+'T00:00:00Z')+minute(start)*60000:0,to=from+Number(hours)*3600000;
 return (s.extras?.absences||[]).filter(a=>{const t=s.extras?.absenceTypes?.find(t=>t.id===a.type_id);if(a.worker_id!==worker||a.status!=='approved'||!(t?.blocks||t?.bucket==='vacation'))return false;
 if(!start)return a.date===date&&(!a.start_time||!a.end_time);
 const day=Date.parse(a.date+'T00:00:00Z'),left=day+(a.start_time&&a.end_time?minute(a.start_time)*60000:0),right=day+(a.start_time&&a.end_time?minute(a.end_time)*60000:86400000);return from<right&&(to>left||Number(hours)===0&&from>=left);
 });
}
export function absenceMessage(s,worker,a){return (s.workers.find(w=>w.id===worker)?.name||'Pracovník')+' · '+a.date+': '+(s.extras?.absenceTypes?.find(t=>t.id===a.type_id)?.name||'Schválené volno')+'. V tomto čase nelze naplánovat zakázku.'}
