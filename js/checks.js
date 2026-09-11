export function attendanceChecks(state,from,to){
 const date=s=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Prague'}).format(new Date(s)),issues=[];
 const rows=state.attendance.filter(a=>date(a.start)>=from&&date(a.start)<=to);
 for(const a of rows){const d=date(a.start);if(!a.end)issues.push({worker:a.worker,date:d,text:'Chybí odchod'});
 for(const b of rows)if(a.id<b.id&&a.worker===b.worker&&new Date(a.start)<new Date(b.end||'9999-01-01')&&new Date(b.start)<new Date(a.end||'9999-01-01'))issues.push({worker:a.worker,date:d,text:'Překrývající se docházka'});
 if((state.extras.absences||[]).some(x=>x.worker_id===a.worker&&x.date===d&&x.status==='approved'))issues.push({worker:a.worker,date:d,text:'Práce v den schváleného volna — ověřte rozsah'});
 }
 return issues;
}
