import {pragueToday} from './arrival-order.js?v=office-workflow-1';

export function currentWorkerRate(entries,worker,day){
 return entries.filter(e=>e.kind==='rate'&&e.worker_id===worker&&e.valid_from<=day)
  .sort((a,b)=>b.valid_from.localeCompare(a.valid_from))[0]||null;
}

export async function showWorkerRates(root,load,admin){
 if(!admin())return;
 const slots=[...root.querySelectorAll('[data-worker-current-rate]')];
 if(!slots.length)return;
 try{
  const data=await load();if(!admin())return;
  const day=pragueToday();
  for(const slot of slots){
   if(!slot.isConnected)continue;
   const rate=currentWorkerRate(data.entries||[],slot.dataset.workerCurrentRate,day);
   slot.textContent=rate?'Aktuální sazba: '+Number(rate.amount).toLocaleString('cs-CZ',{maximumFractionDigits:2})+' Kč/h · od '+new Date(rate.valid_from+'T12:00:00').toLocaleDateString('cs-CZ'):'Aktuální sazba není zadaná';
   slot.title='Hodinový náklad pracovníka platný k dnešnímu dni. Historii a budoucí sazby najdete v Hodinových nákladech.';
  }
 }catch{
  if(admin())for(const slot of slots)if(slot.isConnected)slot.textContent='Sazbu se nepodařilo načíst. Otevřete Hodinové náklady.';
 }
}
