// Use calendar minutes: the planner stores local dates/times and planned hours.
export function nextPlanTime(assignments,worker,date,fallback='07:00'){
 const day=Date.parse(date+'T00:00:00Z')/60000;
 const ends=assignments.filter(a=>a.worker===worker&&Number(a.planned)>0).map(a=>{
  const [h,m]=String(a.start||fallback).split(':').map(Number),start=Date.parse(a.date+'T00:00:00Z')/60000+h*60+m;
  return {start,end:start+Math.round(Number(a.planned)*60)};
 }).filter(a=>Number.isFinite(a.end)&&a.start<day+1440&&a.end>day&&a.start>=day-1440);
 if(!ends.length)return {date,start:fallback,following:false};
 const end=new Date(Math.max(...ends.map(a=>a.end))*60000).toISOString();
 return {date:end.slice(0,10),start:end.slice(11,16),following:true};
}
