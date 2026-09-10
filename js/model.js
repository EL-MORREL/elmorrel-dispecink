export const TABLES = ['jobs','workers','vehicles','assignments','assignment_vehicles','notes','absences','vehicle_absences'];
export const empty = () => Object.fromEntries(TABLES.map(t => [t, []]));
export const copy = value => structuredClone(value);
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const id = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return (a[0] & 0x1fffff) * 4294967296 + a[1] || 1; };
export const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const dateOf = text => new Date(`${text}T12:00:00`);
export const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate()+days); return d; };
export const monday = date => addDays(date, 1-(date.getDay() || 7));
export function holidays(year) {
  // Gregorian Easter (Meeus/Jones/Butcher), independent of the displayed year.
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const n=h+l-7*m+114, easter=new Date(year,Math.floor(n/31)-1,n%31+1,12);
  return new Set(['01-01','05-01','05-08','07-05','07-06','09-28','10-28','11-17','12-24','12-25','12-26'].map(x=>`${year}-${x}`).concat(iso(addDays(easter,-2)),iso(addDays(easter,1))));
}
export function validateRow(table, row) {
  if (!row || typeof row !== 'object' || Array.isArray(row) || !Number.isSafeInteger(row.id) || row.id<=0) throw Error('Neplatné ID záznamu.');
  for (const key of ['job_id','worker_id','vehicle_id','lead_worker_id','row_id']) if(row[key]!=null && (!Number.isSafeInteger(row[key]) || row[key]<=0)) throw Error('Neplatný odkaz záznamu.');
  for(const key of ['date','hidden_from']) if(row[key]!=null && (!/^\d{4}-\d{2}-\d{2}$/.test(row[key]) || iso(dateOf(row[key]))!==row[key])) throw Error('Neplatné datum.');
  for(const key of ['load','vehicle_load','capacity']) if(row[key]!=null && (typeof row[key]!=='number' || !Number.isFinite(row[key]) || row[key]<0 || row[key]>24)) throw Error('Hodiny musí být mezi 0 a 24.');
  for(const key of ['days','estimated','people','people_capacity']) if(row[key]!=null && (typeof row[key]!=='number' || !Number.isFinite(row[key]) || row[key]<0)) throw Error('Neplatná kapacita nebo odhad.');
  if(['jobs','workers','vehicles'].includes(table) && (typeof row.title!=='string' || !row.title.trim())) throw Error('Vyplňte název nebo jméno.');
  if(table==='workers' && (!Array.isArray(row.skills) || row.skills.some(s=>typeof s!=='string'))) throw Error('Neplatné specializace.');
  if(table==='notes' && row.row_kind!=='worker') throw Error('Poznámka musí patřit pracovníkovi.');
  for(const value of Object.values(row)) if(typeof value==='string' && value.length>20000) throw Error('Text je příliš dlouhý.');
}
export function parseBackup(text) {
  if(text.length>20*1024*1024) throw Error('Soubor překračuje 20 MB.');
  const file=JSON.parse(text);
  if(file.format!=='elmorrel-planner' || file.version!==2 || file.complete!==true) throw Error('Použijte úplný export nové verze. Starý týdenní export není úplná záloha.');
  if(!file.data || Object.keys(file.data).some(t=>!TABLES.includes(t))) throw Error('Neznámá tabulka v exportu.');
  for(const table of TABLES){
    if(!Array.isArray(file.data[table])) throw Error(`Chybí ${table}.`);
    const ids=new Set();
    for(const row of file.data[table]){validateRow(table,row);if(ids.has(row.id))throw Error('Duplicitní ID v souboru.');ids.add(row.id);}
  }
  return file.data;
}
export const vehicleRows = (db,job,date) => db.assignment_vehicles.filter(v=>v.job_id===job && v.date===date);
export function planChange(db, input) {
  const row=copy(input.row), previous=input.previous;
  validateRow('assignments',row);
  const job=db.jobs.find(j=>j.id===row.job_id);
  if(!job) throw Error('Zakázka už neexistuje.');
  if(!row.worker_id && !input.vehicles.length) throw Error('Vyberte pracovníka nebo alespoň jedno vozidlo.');
  if(row.worker_id && db.absences.some(a=>a.worker_id===row.worker_id && a.date===row.date)) throw Error('Pracovník má v tento den volno.');
  for(const vehicle of input.vehicles){
    if(db.vehicle_absences.some(a=>a.vehicle_id===vehicle && a.date===row.date)) throw Error('Vozidlo je v tento den blokované.');
  }
  row.vehicle_id=null; // assignment_vehicles is the only source for cars.
  const ops=[{table:'assignments',op:previous?'update':'insert',row}];
  // Cars belong to the job/day, not to an individual worker.
  for(const a of vehicleRows(db,row.job_id,row.date)) if(!input.vehicles.includes(a.vehicle_id)) ops.push({table:'assignment_vehicles',op:'delete',id:a.id});
  for(const v of new Set(input.vehicles)){
    const old=vehicleRows(db,row.job_id,row.date).find(a=>a.vehicle_id===v);
    const load=input.vehicleLoads?.[v]??old?.load??row.vehicle_load;
    const binding={...(old||{}),id:old?.id??id(),job_id:row.job_id,vehicle_id:v,date:row.date,load};
    validateRow('assignment_vehicles',binding);
    if(!old || old.load!==load)ops.push({table:'assignment_vehicles',op:old?'update':'insert',row:binding});
  }
  if(previous && previous.date!==row.date && !db.assignments.some(a=>a.id!==row.id && a.job_id===previous.job_id && a.date===previous.date)) for(const v of vehicleRows(db,previous.job_id,previous.date)) ops.push({table:'assignment_vehicles',op:'delete',id:v.id});
  if(job.state==='Nová') ops.push({table:'jobs',op:'update',row:{...job,state:'Naplánováno'}});
  return ops;
}
export function removal(db,row){
  const ops=[{table:'assignments',op:'delete',id:row.id}];
  if(!db.assignments.some(a=>a.id!==row.id && a.job_id===row.job_id && a.date===row.date)) for(const v of vehicleRows(db,row.job_id,row.date))ops.push({table:'assignment_vehicles',op:'delete',id:v.id});
  return ops;
}
