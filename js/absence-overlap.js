const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function localInstant(value){const p=Object.fromEntries(clock.formatToParts(new Date(value)).map(p=>[p.type,p.value]));return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`)+(Date.parse(value)%1000)}
export function attendanceAbsenceOverlap(attendance,absence){
 if(absence.status!=='approved'||absence.worker_id!==attendance.worker)return false;
 const day=Date.parse(absence.date+'T00:00:00Z'),partial=absence.start_time&&absence.end_time;
 const start=partial?Date.parse(absence.date+'T'+absence.start_time+'Z'):day;
 const end=partial?Date.parse(absence.date+'T'+absence.end_time+'Z'):day+86400000;
 const arrived=localInstant(attendance.start),left=attendance.end?localInstant(attendance.end):arrived+1;
 return arrived<end&&left>start;
}
