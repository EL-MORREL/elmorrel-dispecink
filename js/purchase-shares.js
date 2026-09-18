export const allocationsOf=p=>Array.isArray(p.allocations)?p.allocations:(p.job_id?[{job_id:p.job_id,amount:p.amount,invoice_id:p.invoice_id}]:[]);
export const unallocated=p=>Math.max(0,Math.round((Number(p.amount)-allocationsOf(p).reduce((n,a)=>n+Number(a.amount),0))*100)/100);
export const purchaseShares=data=>(data.purchases||[]).flatMap(p=>allocationsOf(p).map(a=>({...p,...a,id:p.id,shared:allocationsOf(p).length>1,totalAmount:p.amount,unallocated:unallocated(p)})));
