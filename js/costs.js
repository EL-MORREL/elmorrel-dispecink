export function costReport(state,finance,from,to){
 const entries=finance.entries||[],kinds=new Set((finance.jobKinds||[]).filter(k=>k.overhead).map(k=>k.job_id));
 const rates=entries.filter(e=>e.kind==='rate').sort((a,b)=>b.valid_from.localeCompare(a.valid_from));
 const result=new Map(state.jobs.map(j=>[j.id,{id:j.id,name:j.name,overhead:kinds.has(j.id),plannedHours:0,actualHours:0,plannedCost:0,actualCost:0,plannedOverhead:0,actualOverhead:0,missingRates:0}]));
 const pools=new Map(),workers=new Map(),issues=[];
 const dateOf=s=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Prague'}).format(new Date(s));
 const actual=state.attendance.filter(a=>a.end).map(a=>({worker:a.worker,job:a.job,date:dateOf(a.start),hours:Math.max(0,(new Date(a.end)-new Date(a.start))/3600000-(a.breakMinutes||0)/60)})).concat((state.extras?.historicalHours||[]).map(h=>({worker:h.worker_id,job:h.job_id,date:h.date,hours:Number(h.hours)})));
 const planned=state.assignments.map(a=>({worker:a.worker,job:a.job,date:a.date,hours:Number(a.planned)}));
 // Monthly pools are calculated over full months; selected days receive their share only.
 for(const [mode,rows] of [['actual',actual],['planned',planned]])for(const r of rows){
  if(r.date.slice(0,7)<from.slice(0,7)||r.date.slice(0,7)>to.slice(0,7))continue;
  const job=result.get(r.job);if(!job)continue;const rate=rates.find(e=>e.worker_id===r.worker&&e.valid_from<=r.date);const amount=rate?Number(rate.amount)*r.hours:0;
  const key=mode+r.date.slice(0,7),pool=pools.get(key)||{cost:0,hours:0,missing:false};if(job.overhead){pool.cost+=amount;if(!rate&&r.hours)pool.missing=true}else pool.hours+=r.hours;pools.set(key,pool);
  if(r.date<from||r.date>to)continue;
  job[mode+'Hours']+=r.hours;job[mode+'Cost']+=amount;if(!rate&&r.hours){job.missingRates++;issues.push({kind:'rate',worker:r.worker,date:r.date,job:r.job})}
  if(mode==='actual'){const w=workers.get(r.worker)||{id:r.worker,hours:0,cost:0,missingRates:0};w.hours+=r.hours;w.cost+=amount;if(!rate&&r.hours)w.missingRates++;workers.set(r.worker,w)}
 }
 for(const e of entries.filter(e=>e.kind==='overhead'))for(const mode of ['actual','planned']){const key=mode+e.valid_from.slice(0,7),pool=pools.get(key)||{cost:0,hours:0,missing:false};pool.cost+=Number(e.amount);pools.set(key,pool)}
 for(const [mode,rows] of [['actual',actual],['planned',planned]])for(const r of rows){if(r.date<from||r.date>to)continue;const job=result.get(r.job),pool=pools.get(mode+r.date.slice(0,7));if(job&&!job.overhead&&pool?.hours){job[mode+'Overhead']+=pool.cost*r.hours/pool.hours;if(pool.missing)job.missingRates++}}
 for(const j of result.values()){
  const budget=entries.find(e=>e.kind==='budget'&&e.job_id===j.id);j.price=budget?Number(budget.amount)+entries.filter(e=>e.kind==='change'&&e.job_id===j.id&&e.status==='approved').reduce((n,e)=>n+Number(e.amount),0):null;
  const invoices=entries.filter(e=>e.kind==='invoice'&&e.job_id===j.id);j.invoiced=invoices.reduce((n,e)=>n+Number(e.amount),0);
  j.periodInvoiced=invoices.filter(e=>e.dates.every(d=>d>=from&&d<=to)).reduce((n,e)=>n+Number(e.amount),0);
  j.partialInvoice=invoices.some(e=>e.dates.some(d=>d>=from&&d<=to)&&!e.dates.every(d=>d>=from&&d<=to));
  j.actualResult=j.missingRates?null:j.periodInvoiced-j.actualCost-j.actualOverhead;
  j.plannedResult=j.missingRates||j.price===null?null:j.price-j.plannedCost-j.plannedOverhead;
 }
 return {jobs:[...result.values()],workers:[...workers.values()],issues,pools};
}
