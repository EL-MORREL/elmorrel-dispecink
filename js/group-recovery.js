import {esc} from './data.js?v=jobs-read-1';

// Recover only group labels for IDs already present in this company's jobs.
// Keep conflicting personal versions separate; never guess which one is right.
export function findLegacyGroups(jobs,storage=localStorage){
 const ids=new Set(jobs.map(j=>j.id)),found=new Map();
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);if(!key?.startsWith('planner-job-preferences:')&&!key?.startsWith('planner-group-backup:'))continue;
  let groups;try{groups=JSON.parse(storage.getItem(key)||'{}').groups}catch{continue}
  if(!groups||typeof groups!=='object'||Array.isArray(groups))continue;
  for(const [id,value] of Object.entries(groups)){
   if(!ids.has(id)||typeof value!=='string'||!value.trim()||value.trim().length>60)continue;
   if(!found.has(id))found.set(id,new Set());found.get(id).add(value.trim());
  }
 }
 return jobs.filter(j=>found.has(j.id)).map(j=>({job:j,groups:[...found.get(j.id)].sort((a,b)=>a.localeCompare(b,'cs'))}));
}

export function installGroupRecovery(anchor,state,user,ctx){
 if(!ctx.admin)return;
 const panel=document.createElement('details');panel.className='group-recovery';
 panel.innerHTML='<summary>Obnovit původní skupiny</summary><p>Vyhledá dřívější skupiny uložené v tomto prohlížeči i pod jiným účtem. Zobrazí pouze přiřazení k zakázkám této firmy. Existující společné skupiny zůstanou zachované.</p><button type="button">Vyhledat uložené skupiny</button><div class="group-recovery-result" aria-live="polite"></div>';
 anchor.after(panel);
 panel.querySelector('button').onclick=()=>{
  const result=panel.querySelector('.group-recovery-result');let found;
  try{found=findLegacyGroups(state.jobs)}catch{result.textContent='Prohlížeč nedovolil přečíst uložené skupiny.';return}
  if(!found.length){result.textContent='V tomto prohlížeči se původní přiřazení nenašlo. Otevřete tuto obnovu na zařízení a v prohlížeči, kde jste skupiny nastavovali. Údaje na jiném zařízení tato stránka nemůže přečíst.';return}
  // Preserve every discovered alternative before another screen can write preferences.
  let backedUp=true;try{const stamp=Date.now();found.forEach(({job,groups})=>groups.forEach((group,n)=>localStorage.setItem('planner-group-backup:'+user+':'+stamp+':'+job.id+':'+n,JSON.stringify({groups:{[job.id]:group}}))))}catch{backedUp=false}
  const pending=found.filter(r=>!r.job.groupName);
  result.innerHTML=`<p>Nalezeno přiřazení u ${found.length} zakázek. K převodu: ${pending.length}.${backedUp?' Původní údaje jsou ponechané a zálohované v tomto prohlížeči.':' Zálohu do prohlížeče se nepodařilo uložit; původní údaje nebyly změněné.'}</p>`;
  if(!pending.length)return;
  const form=document.createElement('form');form.innerHTML=pending.map(({job,groups})=>`<label>${esc(job.name)}<select data-recover-job="${esc(job.id)}"><option value="">Nepřevádět${groups.length>1?' — vyberte správnou skupinu':''}</option>${groups.map(g=>`<option value="${esc(g)}" ${groups.length===1?'selected':''}>${esc(g)}</option>`).join('')}</select></label>`).join('')+'<p role="alert"></p><button type="submit" class="primary">Obnovit vybrané skupiny pro celou firmu</button>';
  result.append(form);form.onsubmit=async e=>{
   e.preventDefault();const values=Object.fromEntries([...form.querySelectorAll('[data-recover-job]')].filter(el=>el.value).map(el=>[el.dataset.recoverJob,el.value]));
   const error=form.querySelector('[role=alert]');if(!Object.keys(values).length){error.textContent='Vyberte alespoň jednu skupinu k obnovení.';return}
   const button=form.querySelector('button');button.disabled=true;button.textContent='Obnovuji…';
   try{await ctx.saveGroups(values)}catch(ex){error.textContent=ex.message;button.disabled=false;button.textContent='Obnovit vybrané skupiny pro celou firmu'}
  };
 };
}
