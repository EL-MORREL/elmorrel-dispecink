export const pragueToday=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Prague'}).format(new Date());
export function orderedJobChoices(state,worker,day=pragueToday()){
 const planned=new Set(state.assignments.filter(a=>a.worker===worker&&a.date===day).map(a=>a.job));
 return state.jobs.filter(j=>!['invoiced','merged','completed'].includes(j.status)&&(state.company.allowOtherJobs||planned.has(j.id))).sort((a,b)=>Number(planned.has(b.id))-Number(planned.has(a.id))||a.name.localeCompare(b.name,'cs',{sensitivity:'base',numeric:true})).map(j=>[j.id,(planned.has(j.id)?'Dnes naplánováno · ':'')+j.name]);
}
