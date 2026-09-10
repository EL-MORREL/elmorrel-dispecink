import {TABLES,empty,copy,esc,id,iso,dateOf,addDays,monday,holidays,validateRow,parseBackup,vehicleRows,planChange,removal} from './model.js';
import {createStore} from './api.js';
const $=id=>document.getElementById(id);
const client=window.supabase.createClient(window.PLANNER_CONFIG.url,window.PLANNER_CONFIG.key);
let db=empty(),role=null,week=monday(new Date()),edit=null,returnFocus=null,user=null,dragging=false,pendingRender=false;
const status=(message,error=false)=>{$('status').textContent=message;$('status').classList.toggle('error',error);};
const store=createStore(client,snapshot=>{
  if(!snapshot){db=empty();role=null;edit=null;document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('workspace').hidden=true;$('loginPassword').value='';$('newPassword').value='';$('board').replaceChildren();$('items').replaceChildren();return;}
  db=snapshot.data;role=snapshot.role;$('workspace').hidden=false;
  document.querySelectorAll('[data-editor]').forEach(el=>el.hidden=role!=='editor');
  if($('editor').open){$('fields').disabled=role!=='editor';$('saveButton').hidden=role!=='editor';if(role!=='editor')$('extraActions').replaceChildren();}
  if(edit && edit.version!==snapshot.version)$('editWarning').textContent='Plán byl mezitím změněn. Před uložením zavřete a znovu otevřete detail.';
  if(dragging)pendingRender=true;else render();
},status);
const byId=(table,value)=>db[table].find(r=>r.id===Number(value));
const defaultHours=()=>store.snapshot?.workDayHours??10;
const value=name=>$(name).value;
const num=name=>value(name)===''?null:Number(value(name));
const button=(action,label,data='',cls='secondary')=>`<button type="button" class="${cls}" data-action="${action}" ${data}>${esc(label)}</button>`;
const rowData=(table,row)=>`data-table="${table}" data-id="${row.id}"`;
function matches(job){const q=value('search').toLocaleLowerCase('cs');return [job.title,job.address,job.contact,job.phone,job.note,job.state,job.skill].join(' ').toLocaleLowerCase('cs').includes(q);}
function progress(job){return db.assignments.filter(a=>a.job_id===job.id && a.worker_id!==null).reduce((sum,a)=>sum+Number(a.load??0),0);}
function jobCard(job,a){
  const vehicles=a?vehicleRows(db,job.id,a.date).map(v=>{
    const car=byId('vehicles',v.vehicle_id);if(!car)return null;
    return `${car.title} (${v.load} h, ${car.people_capacity??5} míst)`;
  }).filter(Boolean):[];
  const crew=a?db.assignments.filter(x=>x.job_id===job.id && x.date===a.date && x.worker_id).map(x=>byId('workers',x.worker_id)?.title).filter(Boolean):[];
  const worker=a?.worker_id?byId('workers',a.worker_id):null;
  const mismatch=worker && job.skill && job.skill!=='Bez požadavku' && !worker.skills?.includes(job.skill);
  return `<article class="job ${a?.invoiced?'invoiced':''}" draggable="${role==='editor'}" data-job="${job.id}" data-assignment="${a?.id??''}">
  <strong>${esc(job.title)}</strong><div>${esc(job.address)}</div><div>${esc(job.contact)} ${esc(job.phone)}</div>
  <div class="badges"><span>${esc(job.state)}</span><span>${progress(job)} / ${job.estimated??0} h plán</span>${a?`<span>${a.worker_id?a.load??0:0} h pracovník</span>`:''}</div>
  ${job.lead_worker_id?`<div>Vedoucí: ${esc(byId('workers',job.lead_worker_id)?.title)}</div>`:''}
  ${vehicles.length?`<div>🚐 ${esc(vehicles.join(', '))}</div>`:''}${crew.length?`<div>👷 ${esc(crew.join(', '))}</div>`:''}
  ${a?.note?`<p class="note">${esc(a.note)}</p>`:''}${mismatch?'<p class="error">Chybí požadovaná odbornost</p>':''}
  ${a?.invoiced?'<div>Vyfakturováno</div>':''}
  <div class="actions">${button(a?'assignment':'edit',a?'Detail plánu':'Detail',a?`data-id="${a.id}"`:rowData('jobs',job))}
  ${role==='editor'&&!a?button('plan','Naplánovat',`data-job="${job.id}"`):''}</div></article>`;
}
function render(){
  if(!role)return;
  $('weekLabel').textContent=`${dateOf(iso(week)).toLocaleDateString('cs-CZ')} – ${addDays(week,6).toLocaleDateString('cs-CZ')}`;
  const table=value('listMode');
  if(table==='jobs'){
    const filter=value('jobFilter');
    const jobs=db.jobs.filter(matches).filter(j=>filter==='all'||(filter==='active'?!['Dokončeno','Vyfakturováno','Storno'].includes(j.state):filter==='archive'?['Dokončeno','Vyfakturováno','Storno'].includes(j.state):filter==='to_invoice'?j.state==='Dokončeno':progress(j)>(j.estimated??0)));
    $('items').innerHTML=jobs.map(j=>jobCard(j)).join('')||'<p>Žádné zakázky.</p>';
  }else $('items').innerHTML=db[table].map(r=>`<article class="job"><strong>${esc(r.title)}</strong><div>${esc(r.email??r.spz??'')}</div>${button('edit','Detail',rowData(table,r))}</article>`).join('')||'<p>Žádné záznamy.</p>';
  const kind=value('viewMode'),rows=db[kind];
  const days=Array.from({length:7},(_,i)=>iso(addDays(week,i)));
  const calendar=new Set([...holidays(week.getFullYear()),...holidays(addDays(week,6).getFullYear())]);
  $('board').style.setProperty('--rows',Math.max(rows.length,1));
  $('board').innerHTML=days.map(date=>{
    const relevant=rows.filter(r=>kind!=='workers'||!r.hidden_from||date<r.hidden_from);
    return `<section class="day ${calendar.has(date)||[0,6].includes(dateOf(date).getDay())?'holiday':''}"><h2>${esc(dateOf(date).toLocaleDateString('cs-CZ',{weekday:'long',day:'numeric',month:'numeric'}))}</h2><div class="day-grid">${relevant.map(r=>{
      let assignments;
      if(kind==='workers')assignments=db.assignments.filter(a=>a.worker_id===r.id&&a.date===date);
      else assignments=db.assignment_vehicles.filter(v=>v.vehicle_id===r.id&&v.date===date).map(v=>db.assignments.find(a=>a.job_id===v.job_id&&a.date===date)??{id:null,job_id:v.job_id,date,load:0,vehicle_load:v.load});
      const all=assignments.filter(a=>byId('jobs',a.job_id)?.state!=='Storno');
      const shown=all.filter(a=>{const j=byId('jobs',a.job_id);return j&&matches(j);});
      const absTable=kind==='workers'?'absences':'vehicle_absences',key=kind==='workers'?'worker_id':'vehicle_id';
      const abs=db[absTable].filter(a=>a[key]===r.id&&a.date===date);
      const used=kind==='workers'?all.reduce((s,a)=>s+Number(a.load??0),0)+(abs.length?Number(r.capacity??defaultHours()):0):db.assignment_vehicles.filter(v=>v.vehicle_id===r.id&&v.date===date&&byId('jobs',v.job_id)?.state!=='Storno').reduce((s,v)=>s+Number(v.load??0),0)+(abs.length?Number(r.capacity??defaultHours()):0);
      return `<div class="cell" data-kind="${kind}" data-id="${r.id}" data-date="${date}"><h3>${esc(r.title)}</h3><div class="capacity ${used>(r.capacity??defaultHours())?'error':''}">${used} / ${r.capacity??defaultHours()} h</div>
      ${role==='editor'?`<div class="actions">${button('absence',kind==='workers'?'Volno':'Blokace',`data-table="${absTable}" data-person="${r.id}" data-date="${date}"`)}${kind==='workers'?button('note','Poznámka',`data-person="${r.id}" data-date="${date}"`):''}</div>`:''}
      ${abs.map(a=>`<div class="absence">${esc(a.reason)} ${role==='editor'?button('delete','Odstranit',rowData(absTable,a)):''}</div>`).join('')}
      ${kind==='workers'?db.notes.filter(n=>n.row_id===r.id&&n.date===date).map(n=>`<div class="note">${esc(n.note)}${role==='editor'?button('note','Upravit',`data-id="${n.id}"`)+button('delete','Odstranit',rowData('notes',n)):''}</div>`).join(''):''}
      ${shown.map(a=>jobCard(byId('jobs',a.job_id),a)).join('')}</div>`;
    }).join('')||'<p>Žádné aktivní zdroje.</p>'}</div></section>`;
  }).join('');
}
function inputField(name,label,val='',type='text',extra='') {return `<label>${esc(label)}<input id="f_${name}" name="${name}" type="${type}" value="${esc(val??'')}" ${extra}></label>`;}
function textField(name,label,val=''){return `<label class="full">${esc(label)}<textarea id="f_${name}" name="${name}" maxlength="20000">${esc(val??'')}</textarea></label>`;}
function selectField(name,label,options,selected,multiple=false){const selectedValues=multiple?(selected??[]).map(String):[String(selected??'')];return `<label>${esc(label)}<select id="f_${name}" name="${name}" ${multiple?'multiple size="5"':''}>${options.map(([val,title])=>`<option value="${esc(val)}" ${selectedValues.includes(String(val))?'selected':''}>${esc(title)}</option>`).join('')}</select></label>`;}
const options=table=>db[table].map(r=>[r.id,r.title]);
const skills=['Elektroinstalace','Optika','Kancelář','Servis','Montáž','Revize'];
function openEditor(table,row){
  edit={table,row:copy(row??{id:id()}),existing:!!row,version:store.snapshot.version};
  const r=edit.row,h=defaultHours();let fields='';
  if(['jobs','workers','vehicles'].includes(table))fields+=inputField('title',table==='workers'?'Jméno':'Název',r.title,'text','required maxlength="500"');
  if(table==='jobs'){
    fields+=selectField('priority','Priorita',['Vysoká','Střední','Nízká'].map(x=>[x,x]),r.priority??'Střední')+selectField('skill','Odbornost',['Bez požadavku',...skills].map(x=>[x,x]),r.skill??'Bez požadavku')+selectField('state','Stav',['Nová','Naplánováno','Probíhá','Dokončeno','Vyfakturováno','Storno'].map(x=>[x,x]),r.state??'Nová');
    fields+=inputField('address','Adresa',r.address)+inputField('contact','Kontakt',r.contact)+inputField('phone','Telefon',r.phone,'tel')+selectField('lead_worker_id','Vedoucí technik',[['','Bez technika'],...options('workers')],r.lead_worker_id);
    fields+=inputField('days','Počet dní',r.days??1,'number','min="0" step="0.5"')+inputField('people','Počet lidí',r.people??1,'number','min="0" step="1"')+inputField('estimated','Odhad hodin',r.estimated??h,'number','min="0" step="0.5"');
    fields+=inputField('load','Hodin pracovníka',r.load??h,'number','min="0" max="24" step="0.5"')+inputField('vehicle_load','Hodin vozidla',r.vehicle_load??h,'number','min="0" max="24" step="0.5"')+inputField('time_from','Čas od',r.time_from,'time')+inputField('time_to','Čas do',r.time_to,'time')+textField('note','Poznámka',r.note);
    fields+=`<p class="full">Naplánováno: ${progress(r)} h. Poslední změna: ${esc(r.updated_by??'—')}</p>`;
  }else if(table==='workers')fields+=inputField('email','E-mail',r.email,'email')+inputField('phone','Telefon',r.phone,'tel')+inputField('capacity','Kapacita hodin / den',r.capacity??h,'number','min="0" max="24" step="0.5"')+inputField('hidden_from','Skrýt od',r.hidden_from,'date')+selectField('skills','Specializace',skills.map(x=>[x,x]),r.skills??[],true);
  else if(table==='vehicles')fields+=inputField('spz','SPZ',r.spz)+inputField('type','Typ',r.type)+inputField('capacity','Kapacita hodin / den',r.capacity??h,'number','min="0" max="24" step="0.5"')+inputField('people_capacity','Kapacita osob',r.people_capacity??5,'number','min="1" step="1"')+textField('note','Poznámka',r.note);
  showDialog(table==='jobs'?'Zakázka':table==='workers'?'Pracovník':'Vozidlo',fields);
  $('extraActions').innerHTML=row&&role==='editor'?button('delete','Smazat',rowData(table,row),'danger')+(table==='jobs'?button('duplicate','Duplikovat',`data-id="${row.id}"`):''):'';
}
function openAssignment(row,jobId){
  const job=byId('jobs',row?.job_id??jobId);if(!job)throw Error('Zakázka nenalezena.');
  const actual=row?.id?row:null;
  const r=copy(row??{id:id(),job_id:job.id,date:iso(week),worker_id:null,load:job.load??defaultHours(),vehicle_load:job.vehicle_load??defaultHours(),invoiced:false,note:''});
  if(!r.id)r.id=id();
  edit={table:'assignments',row:r,existing:!!actual,version:store.snapshot.version};
  const fields=selectField('worker_id','Pracovník',[['','Bez pracovníka'],...options('workers')],r.worker_id)+inputField('date','Datum',r.date,'date','required')+selectField('vehicles','Vozidla pro celou zakázku v tento den',options('vehicles'),vehicleRows(db,r.job_id,r.date).map(v=>v.vehicle_id),true)+inputField('load','Hodin pracovníka',r.load??0,'number','min="0" max="24" step="0.5"')+'<div id="carHours" class="full form-grid"></div>'+textField('note','Poznámka',r.note)+`<label class="full checkbox"><input type="checkbox" name="invoiced" ${r.invoiced?'checked':''}> Vyfakturováno (toto přiřazení)</label>`;
  showDialog(job.title+' — plán',fields);
  renderCarHours();
  $('extraActions').innerHTML=actual&&role==='editor'?button('unassign','Odebrat z plánu',`data-id="${actual.id}"`,'danger'):'';
}
function renderCarHours(){
  if(edit?.table!=='assignments')return;
  const previous=Object.fromEntries(Array.from(document.querySelectorAll('#carHours input')).map(el=>[el.name,el.value]));
  const selected=Array.from($('f_vehicles').selectedOptions).map(o=>Number(o.value));
  $('carHours').innerHTML=selected.map(v=>{
    const binding=vehicleRows(db,edit.row.job_id,value('f_date')).find(a=>a.vehicle_id===v);
    return inputField('car_load_'+v,'Hodiny auta '+byId('vehicles',v).title,previous['car_load_'+v]??binding?.load??edit.row.vehicle_load??defaultHours(),'number','required min="0" max="24" step="0.5"');
  }).join('');
}
function showDialog(title,fields){
  returnFocus=document.activeElement;$('dialogTitle').textContent=title;$('fields').innerHTML=fields;$('editWarning').textContent='';$('extraActions').replaceChildren();
  $('saveButton').hidden=role!=='editor';$('fields').disabled=role!=='editor';$('editor').showModal();
}
function formRow(){
  const row=copy(edit.row),data=new FormData($('editForm'));
  const numbers=['lead_worker_id','days','people','estimated','load','vehicle_load','capacity','people_capacity','worker_id'];
  for(const [key,val] of data){if(['vehicles','skills'].includes(key)||key.startsWith('car_load_'))continue;row[key]=numbers.includes(key)?(val===''?null:Number(val)):String(val).trim();}
  if(edit.table==='workers'){row.skills=data.getAll('skills');row.hidden_from=row.hidden_from||null;}
  if(edit.table==='jobs')row.invoiced=row.state==='Vyfakturováno';
  if(edit.table==='assignments')row.invoiced=data.has('invoiced');
  validateRow(edit.table,row);return row;
}
async function save(){
  if(!edit||role!=='editor')throw Error('Nemáte oprávnění.');
  const row=formRow();
  const form=new FormData($('editForm'));
  const vehicleLoads=Object.fromEntries(Array.from(form).filter(([key])=>key.startsWith('car_load_')).map(([key,v])=>[key.slice(9),Number(v)]));
  const operations=edit.table==='assignments'?planChange(db,{row,previous:edit.existing?edit.row:null,vehicles:form.getAll('vehicles').map(Number),vehicleLoads}):[{table:edit.table,op:edit.existing?'update':'insert',row}];
  if(await store.commit(operations,edit.version))$('editor').close();
}
async function deleteRow(table,rowId){
  const row=byId(table,rowId);if(!row)return;
  if(!confirm('Opravdu odstranit záznam? Související vazby budou upraveny v databázi.'))return;
  const ops=table==='assignments'?removal(db,row):[{table,op:'delete',id:row.id}];
  if(await store.commit(ops,edit?.version))$('editor').close();
}
async function exportBackup(){
  const fresh=await store.refresh();if(!fresh)throw Error('Export se nepodařilo načíst.');
  const blob=new Blob([JSON.stringify({format:'elmorrel-planner',version:2,complete:true,exportedAt:new Date().toISOString(),data:fresh.data},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`planovac-uplny-export-${iso(new Date())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importBackup(file){
  if(role!=='editor')throw Error('Nemáte oprávnění.');
  if(file.size>20*1024*1024)throw Error('Soubor překračuje 20 MB.');
  const incoming=parseBackup(await file.text());
  const fresh=await store.refresh();if(!fresh)throw Error('Nelze ověřit aktuální data.');
  let creates=0,updates=0;const ops=[];
  for(const table of ['workers','vehicles','jobs','assignments','assignment_vehicles','notes','absences','vehicle_absences'])for(const row of incoming[table]){
    const exists=fresh.data[table].some(r=>r.id===row.id);exists?updates++:creates++;
    ops.push({table,op:exists?'update':'insert',row});
  }
  if(!ops.length)throw Error('Export je prázdný.');
  if(!confirm(`Sloučit import: ${creates} nových a ${updates} aktualizovaných záznamů podle ID. Ostatní záznamy zůstanou. Pokračovat?`))return;
  await store.commit(ops,fresh.version);
}
async function smallRecord(table,row){
  if(role!=='editor')throw Error('Nemáte oprávnění.');
  const existing=!!row.id;
  const answer=prompt(table==='notes'?'Poznámka:':table==='absences'?'Důvod volna:':'Důvod blokace:',row.note??row.reason??'');
  if(answer===null||!answer.trim())return;
  await store.commit([{table,op:existing?'update':'insert',row:{...row,id:row.id??id(),[table==='notes'?'note':'reason']:answer.trim()}}]);
}
async function action(el){
  const d=el.dataset;
  switch(d.action){
    case 'login':{const {error}=await client.auth.signInWithPassword({email:value('loginEmail').trim(),password:value('loginPassword')});$('loginPassword').value='';if(error)throw error;break;}
    case 'logout':{store.clear();user=null;$('currentUser').textContent='';$('loginBox').hidden=false;$('logout').hidden=true;const {error}=await client.auth.signOut();if(error){await client.auth.signOut({scope:'local'});throw Error('Místně odhlášeno. Odhlášení ostatních zařízení se nepotvrdilo.');}status('Odhlášeno.');break;}
    case 'reset':{const email=value('loginEmail').trim();if(!email)throw Error('Nejdřív vyplňte e-mail.');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;status('Pokud účet existuje, přijde odkaz pro změnu hesla.');break;}
    case 'password':{const password=value('newPassword');if(password.length<12)throw Error('Použijte alespoň 12 znaků.');const {error}=await client.auth.updateUser({password});if(error)throw error;$('newPassword').value='';$('passwordDialog').close();status('Heslo změněno.');break;}
    case 'refresh':await store.refresh();break;
    case 'previous':week=addDays(week,-7);render();break;
    case 'next':week=addDays(week,7);render();break;
    case 'today':week=monday(new Date());render();break;
    case 'edit':openEditor(d.table,d.id?byId(d.table,d.id):null);break;
    case 'plan':openAssignment(null,Number(d.job));break;
    case 'assignment':{const a=byId('assignments',d.id);if(a)openAssignment(a);else {const card=el.closest('[data-job]');openAssignment({id:null,job_id:Number(card.dataset.job),date:el.closest('[data-date]').dataset.date,worker_id:null,load:0,vehicle_load:defaultHours()});}break;}
    case 'close':$('editor').close();break;
    case 'delete':await deleteRow(d.table,Number(d.id));break;
    case 'unassign':await deleteRow('assignments',Number(d.id));break;
    case 'duplicate':{if(role!=='editor')throw Error('Nemáte oprávnění.');const old=byId('jobs',d.id);if(old){const row={...old,id:id(),title:old.title+' – kopie',state:'Nová',invoiced:false};if(await store.commit([{table:'jobs',op:'insert',row}],edit?.version))$('editor').close();}break;}
    case 'absence':await smallRecord(d.table,{[d.table==='absences'?'worker_id':'vehicle_id']:Number(d.person),date:d.date});break;
    case 'note':await smallRecord('notes',d.id?byId('notes',d.id):{row_kind:'worker',row_id:Number(d.person),date:d.date});break;
    case 'export':await exportBackup();break;
    case 'import':$('importFile').click();break;
  }
}
async function run(fn){try{await fn();}catch(error){status(error.message||'Operace se nepodařila.',true);if($('editor').open)$('editWarning').textContent=error.message;}finally{$('saveButton').disabled=false;}}
document.addEventListener('click',event=>{const el=event.target.closest('[data-action]');if(el){event.preventDefault();run(()=>action(el));}});
$('editForm').addEventListener('submit',event=>{event.preventDefault();$('saveButton').disabled=true;run(save);});
$('loginBox').addEventListener('submit',event=>{event.preventDefault();run(()=>action({dataset:{action:'login'}}));});
$('editor').addEventListener('close',()=>{edit=null;$('fields').replaceChildren();$('extraActions').replaceChildren();returnFocus?.focus();});
for(const key of ['listMode','viewMode','jobFilter'])$(key).addEventListener('change',render);
$('search').addEventListener('input',render);
$('fields').addEventListener('input',event=>{
  if(edit?.table!=='jobs')return;
  if(['days','people'].includes(event.target.name))$('f_estimated').value=(num('f_days')??0)*(num('f_people')??0)*defaultHours();
  if(['time_from','time_to'].includes(event.target.name)&&value('f_time_from')&&value('f_time_to')){const toHours=t=>{const [h,m]=t.split(':').map(Number);return h+m/60;};const from=toHours(value('f_time_from')),to=toHours(value('f_time_to'));const hours=(to-from+24)%24;$('f_load').value=hours;$('f_vehicle_load').value=hours;}
});
$('fields').addEventListener('change',event=>{if(['vehicles','date'].includes(event.target.name))renderCarHours();});
$('importFile').addEventListener('change',event=>{const file=event.target.files[0];event.target.value='';if(file)run(()=>importBackup(file));});
document.addEventListener('dragstart',event=>{const card=event.target.closest('[data-job]');if(!card||role!=='editor'){event.preventDefault();return;}dragging=true;event.dataTransfer.setData('text/plain',JSON.stringify({job:Number(card.dataset.job),assignment:Number(card.dataset.assignment)||null,version:store.snapshot.version}));});
function finishDrag(){dragging=false;document.querySelectorAll('.dragover').forEach(el=>el.classList.remove('dragover'));if(pendingRender){pendingRender=false;render();}}
document.addEventListener('dragend',finishDrag);
document.addEventListener('dragover',event=>{const cell=event.target.closest('.cell');if(cell&&role==='editor'){event.preventDefault();cell.classList.add('dragover');}});
document.addEventListener('dragleave',event=>event.target.closest('.cell')?.classList.remove('dragover'));
document.addEventListener('drop',event=>{
  const cell=event.target.closest('.cell');if(!cell)return;event.preventDefault();
  run(async()=>{try{
    if(role!=='editor')throw Error('Nemáte oprávnění.');
    const payload=JSON.parse(event.dataTransfer.getData('text/plain')),job=byId('jobs',payload.job);
    let old=byId('assignments',payload.assignment);
    if(!job)throw Error('Neplatná zakázka.');
    if(!old&&cell.dataset.kind==='vehicles')old=db.assignments.find(a=>a.job_id===job.id&&a.date===cell.dataset.date);
    const row=copy(old??{id:id(),job_id:job.id,worker_id:null,load:job.load??defaultHours(),vehicle_load:job.vehicle_load??defaultHours(),note:'',invoiced:false});row.date=cell.dataset.date;
    let vehicles=vehicleRows(db,job.id,row.date).map(v=>v.vehicle_id);
    if(cell.dataset.kind==='workers')row.worker_id=Number(cell.dataset.id);else vehicles=[...new Set([...vehicles,Number(cell.dataset.id)])];
    await store.commit(planChange(db,{row,previous:old,vehicles}),payload.version);
  }finally{finishDrag();}});
});
window.addEventListener('online',()=>run(()=>store.refresh()));
window.addEventListener('offline',()=>status('Jste offline. Ukládání vyžaduje připojení.',true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)run(()=>store.refresh());});
client.auth.onAuthStateChange((event,session)=>{
  // Supabase calls must run after this callback releases its auth lock.
  setTimeout(()=>run(async()=>{
    user=session?.user??null;$('currentUser').textContent=user?.email??'';$('loginBox').hidden=!!user;$('logout').hidden=!user;
    try{await store.session(user);}finally{
      if(event==='PASSWORD_RECOVERY' && user?.id===session?.user?.id && !$('passwordDialog').open)$('passwordDialog').showModal();
    }
  }),0);
});
status('Přihlaste se schváleným účtem.');
