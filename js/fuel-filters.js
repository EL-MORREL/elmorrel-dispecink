const pragueDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'});
export function fuelDate(value){const d=new Date(value);return Number.isFinite(+d)?pragueDate.format(d):''}
export function filteredFuel(rows,{vehicle='',worker='',month='',from='',to=''}={},manager=false,me=null){
 if(from&&to&&from>to)return [];
 return rows.filter(r=>{
  if(!manager&&r.worker!==me)return false;
  if(worker&&r.worker!==worker)return false;
  if(vehicle&&(vehicle==='private'?!!r.vehicle:r.vehicle!==vehicle))return false;
  const day=fuelDate(r.at);
  return (!month||day.startsWith(month))&&(!from||day>=from)&&(!to||day<=to);
 }).sort((a,b)=>new Date(b.at)-new Date(a.at));
}
