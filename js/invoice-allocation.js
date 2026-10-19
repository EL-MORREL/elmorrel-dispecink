import {hours,localDate} from './data.js?v=workspace-2';
import {purchaseShares} from './purchase-shares.js?v=workspace-2';
import {warrantyWork,warrantyPurchases} from './warranty-data.js?v=workspace-2';
import {costReport} from './costs.js?v=overhead-categories-1';
export const invoiceWork=s=>warrantyWork(s,[...s.attendance.filter(a=>a.end).map(a=>({sourceId:a.id,sourceType:'attendance',worker:a.worker,job:a.job,date:localDate(a.start),hours:hours(a)})),...(s.extras?.historicalHours||[]).map(a=>({sourceId:a.id,sourceType:'historical',worker:a.worker_id,job:a.job_id,date:a.date,hours:Number(a.hours)}))],{billable:true});
export function inferredInvoiceLines(s,data,e){
 const items=e.line_items||[],known=items.filter(i=>i.category&&i.category!=='unclassified');
 if(known.length||e.kind!=='invoice')return {items,automatic:false};
 const days=new Set(e.dates||[]),rates=data.entries.filter(x=>x.kind==='rate').sort((a,b)=>b.valid_from.localeCompare(a.valid_from));
 let labor=0,worked=0,missing=false;for(const a of invoiceWork(s).filter(a=>a.job===e.job_id&&days.has(a.date))){const r=rates.find(r=>r.worker_id===a.worker&&r.valid_from<=a.date);if(!r&&a.hours>0)missing=true;worked+=a.hours;labor+=a.hours*Number(r?.amount||0);}
 const material=warrantyPurchases(s,purchaseShares(data),{billable:true}).filter(p=>p.invoice_id===e.id&&p.job_id===e.job_id&&!p.is_overhead&&p.cost_category==='material').reduce((n,p)=>n+Number(p.amount),0);
 const m=Math.round(material*(1+Number(e.material_markup||0)/100)*100)/100,l=Math.round(labor*(1+Number(e.labor_markup||0)/100)*100)/100,t=Math.round((Number(e.amount)-m-l)*100)/100;
 if(missing||!days.size||!worked||t<0)return {items,automatic:false,warning:missing?'Chybí nákladová sazba práce.':!days.size?'Chybí fakturované dny.':!worked?'Chybí odpracované hodiny ve fakturovaných dnech.':'Materiál a práce s přirážkou přesahují celkovou částku.'};
 return {automatic:true,items:[{category:'material',name:'Materiál – dopočet',amount:m},{category:'labor',name:'Práce – dopočet',amount:l},{category:'transport',name:'Doprava – zbytek celkové částky',amount:t}]};
}
export function periodMargin(s,data,from,to,report=costReport(s,data,from,to)){
 const inside=d=>d>=from&&d<=to,work=invoiceWork(s),rates=data.entries.filter(e=>e.kind==='rate').sort((a,b)=>b.valid_from.localeCompare(a.valid_from)),overhead=new Set((data.jobKinds||[]).filter(j=>j.overhead).map(j=>j.job_id)),shares=warrantyPurchases(s,purchaseShares(data),{billable:true}),billedDays=new Set();let revenue=0,cost=0,missing=false,estimated=false;
 for(const e of data.entries.filter(e=>e.kind==='invoice'&&!overhead.has(e.job_id))){const dates=[...new Set(e.dates||[])],rows=work.filter(a=>a.job===e.job_id&&dates.includes(a.date)),total=rows.reduce((n,a)=>n+a.hours,0);let ratio=0;if(dates.length){ratio=total>0?rows.filter(a=>inside(a.date)).reduce((n,a)=>n+a.hours,0)/total:dates.filter(inside).length/dates.length;estimated||=total===0&&ratio>0;missing||=total===0&&ratio>0;for(const d of dates.filter(inside))billedDays.add(e.job_id+'|'+d);}else{ratio=inside(e.valid_from)?1:0;estimated||=ratio>0;}revenue+=Number(e.amount)*ratio;cost+=shares.filter(p=>p.invoice_id===e.id&&p.job_id===e.job_id&&!p.is_overhead).reduce((n,p)=>n+Number(p.amount),0)*ratio;}
 for(const a of work.filter(a=>inside(a.date)&&billedDays.has(a.job+'|'+a.date))){const r=rates.find(r=>r.worker_id===a.worker&&r.valid_from<=a.date),pool=report.pools.get('actual'+a.date.slice(0,7));cost+=a.hours*Number(r?.amount||0)+(pool?.hours?pool.cost*a.hours/pool.hours:0);missing||=(!r&&a.hours>0)||!!pool?.missing;}
 for(const j of report.jobs.filter(j=>!j.overhead)){cost+=j.warrantyCost;if(j.warrantyHours&&j.missingRates)missing=true;}
 return {revenue,cost:missing?null:cost,profit:missing?null:revenue-cost,margin:!missing&&revenue>0?(revenue-cost)/revenue*100:null,estimated};
}
