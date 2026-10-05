import {missingAttendance} from './missing-attendance.js?v=missing-attendance-1';
import {pragueToday} from './arrival-order.js?v=jobs-read-1';
export function attendanceChecks(state,from='',to=pragueToday()){
 const date=s=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Prague'}).format(new Date(s)),issues=[],seen=new Set();
 for(const a of state.assignments||[]){const key=[a.worker,a.job,a.date].join('|');if(a.date<from||a.date>to||seen.has(key))continue;seen.add(key);const missing=missingAttendance(state,a);if(missing)issues.push({worker:a.worker,job:a.job,date:a.date,assignment:a.id,attendance:missing.record?.id,text:missing.record?'Chybí odchod':'Chybí příchod a odchod',missing:true});}
 const rows=state.attendance.filter(a=>date(a.start)>=from&&date(a.start)<=to);
 for(const a of rows){const d=date(a.start),base={worker:a.worker,job:a.job,date:d,attendance:a.id};
 if(!a.end&&d<pragueToday()&&!issues.some(r=>r.attendance===a.id))issues.push({...base,text:'Chybí odchod'});
 for(const b of rows)if(a.id<b.id&&a.worker===b.worker&&new Date(a.start)<new Date(b.end||'9999-01-01')&&new Date(b.start)<new Date(a.end||'9999-01-01'))issues.push({...base,text:'Překrývající se docházka'});
 if((state.extras?.absences||[]).some(x=>x.worker_id===a.worker&&x.date===d&&x.status==='approved'))issues.push({...base,text:'Práce v den schváleného volna — ověřte rozsah'});
 }
 for(const r of state.extras?.requests||[]){const d=date(r.proposed_start);if(r.status==='pending'&&d>=from&&d<=to&&!issues.some(i=>i.worker===r.worker_id&&i.job===r.job_id&&i.date===d))issues.push({worker:r.worker_id,job:r.job_id,date:d,attendance:r.attendance_id,text:'Návrh opravy čeká na schválení'});}
 return issues.sort((a,b)=>b.date.localeCompare(a.date)||(state.workers.find(w=>w.id===a.worker)?.name||'').localeCompare(state.workers.find(w=>w.id===b.worker)?.name||'','cs'));
}
