import {client} from './connection.js?v=shared-groups-1';
import {esc} from './data.js?v=workspace-2';
import {workbook,download} from './xlsx.js?v=workspace-2';
export async function readPrivateTrips(company){const {data,error}=await client.rpc('saas_private_trips',{c:company,action:'read',p:{}});if(error)throw Error(error.message);return data.trips||[]}
export function privateTripRows(s,trips,f={}){return trips.filter(t=>(!f.vehicle||t.vehicle_id===f.vehicle)&&(!f.worker||t.worker_id===f.worker)&&(!f.from||t.date>=f.from)&&(!f.to||t.date<=f.to)&&!f.job).map(t=>({id:t.id,date:t.date,vehicle:s.vehicles.find(v=>v.id===t.vehicle_id)?.name||'Vozidlo',plate:s.vehicles.find(v=>v.id===t.vehicle_id)?.plate||'',worker:s.workers.find(w=>w.id===t.worker_id)?.name||'Pracovník',job:'Soukromá jízda',hours:0,kilometres:Number(t.kilometres),note:t.note||''}));}
export function installPrivateTripOverview(ctx){
 let filters={vehicle:'',worker:'',from:'',to:''},company=null;
 async function decorate(){
  if(!ctx.manager())return;
  const c=ctx.company();if(c!==company){company=c;filters={vehicle:'',worker:'',from:'',to:''}}
  const panel=document.createElement('section');panel.className='panel';panel.style.marginTop='24px';document.getElementById('content').append(panel);
  const s=ctx.state(),options=(rows,key)=>'<option value="">Vše</option>'+[...rows].sort((a,b)=>a.name.localeCompare(b.name,'cs')).map(r=>`<option value="${esc(r.id)}" ${filters[key]===r.id?'selected':''}>${esc(r.name)}</option>`).join('');
  panel.innerHTML=`<div class="panel-content"><h2>Soukromé jízdy</h2><form class="form-grid"><label>Vozidlo<select name="vehicle">${options(s.vehicles,'vehicle')}</select></label><label>Pracovník<select name="worker">${options(s.workers,'worker')}</select></label><label>Od<input name="from" type="date" value="${esc(filters.from)}"></label><label>Do<input name="to" type="date" value="${esc(filters.to)}"></label><button type="button" data-clear>Zrušit filtry</button><button type="button" data-export disabled>Export Excel</button></form><div data-results role="status">Načítám soukromé jízdy…</div></div>`;
  let trips=[];const form=panel.querySelector('form'),result=panel.querySelector('[data-results]');
  function rows(){filters=Object.fromEntries(new FormData(form));return privateTripRows(ctx.state(),trips,filters).sort((a,b)=>b.date.localeCompare(a.date));}
  function draw(){const list=rows(),invalid=filters.from&&filters.to&&filters.from>filters.to;panel.querySelector('[data-export]').disabled=!!invalid;if(invalid){result.textContent='Datum Od nesmí být po datu Do.';return}result.innerHTML=`<p>${list.length} jízd · <strong>${list.reduce((n,r)=>n+r.kilometres,0).toLocaleString('cs-CZ')} km</strong></p><div class="table-wrap"><table class="simple-table"><thead><tr><th>Datum</th><th>Vozidlo</th><th>SPZ</th><th>Pracovník</th><th>Soukromé km</th><th>Poznámka</th></tr></thead><tbody>${list.map(r=>'<tr>'+[r.date,r.vehicle,r.plate,r.worker,r.kilometres,r.note].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')}</tbody></table></div>${list.length?'':'<p>Pro vybrané filtry nejsou žádné soukromé jízdy.</p>'}`;}
  form.onsubmit=e=>e.preventDefault();form.onchange=draw;panel.querySelector('[data-clear]').onclick=()=>{for(const e of form.elements)if(e.name)e.value='';draw()};
  panel.querySelector('[data-export]').onclick=()=>download(workbook(['Datum','Vozidlo','SPZ','Pracovník','Soukromé km','Poznámka'],rows().map(r=>[r.date,r.vehicle,r.plate,r.worker,r.kilometres,r.note]),{name:'Soukromé jízdy',dateColumns:[0],numberColumns:[4]}),'soukrome-jizdy.xlsx');
  try{trips=await readPrivateTrips(c);if(panel.isConnected&&ctx.company()===c&&ctx.manager())draw()}catch(e){if(panel.isConnected)result.textContent=e.message}
 }
 return {decorate};
}
