import {esc} from './data.js?v=workspace-2';
export function customerIds(s,job){return (s.extras?.jobParties||[]).filter(x=>x.job_id===job&&x.kind==='customer').map(x=>x.party_id)}
export function customerName(s,job){const ids=customerIds(s,job);return (s.extras?.directory||[]).filter(p=>ids.includes(p.id)).map(p=>p.name).join(' · ')}
export function customerMarkup(s,job){const name=customerName(s,job);return name?'<small class="plan-customer">'+esc(name)+'</small>':''}
export function matchesCustomer(s,job,value){const ids=customerIds(s,job);return !value||value==='none'&&!ids.length||ids.includes(value)}
