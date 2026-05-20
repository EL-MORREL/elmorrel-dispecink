function assignmentsFor(row,date){const d=iso(date);if(row.kind==="worker")return db.assignments.filter(a=>Number(a.workerId)===Number(row.id)&&a.date===d);return db.assignments.filter(a=>Number(a.vehicleId)===Number(row.id)&&a.date===d)}

function usedCapacity(row,ass,date){
  let used = row.kind==="worker"
    ? ass.reduce((s,a)=>s+Number(a.load||10),0)
    : ass.reduce((s,a)=>s+Number(a.vehicleLoad||10),0);
  if(row.kind === "worker"){
    const hasAbsence = db.absences.some(a =>
  Number(a.workerId) === Number(row.id) &&
  a.date === (
    typeof date === "string"
      ? date
      : iso(date)));
    if(hasAbsence){
      used += row.capacity;}}
  return used;}

function getDayNotes(workerId,date){
  if(!db.notes){
    db.notes = [];
  }
  return db.notes.filter(n =>
    Number(n.workerId) === Number(workerId) &&
    n.date === date);}

async function editDayNote(workerId,date){

  if(!canEdit){
    alert("Nemáte oprávnění");
    return;}
  if(!db.notes){
    db.notes = [];}
  const text = prompt("Nová poznámka:");
  if(!text){
    return;}
  db.notes.push({
    id: Date.now(),
    workerId,
    date,
    text
  });
  await saveDb();
  render();}

async function deleteDayNote(noteId){
  if(!canEdit){
    alert("Nemáte oprávnění");
    return;}
  if(!confirm("Smazat poznámku?")){
    return;}
  db.notes = db.notes.filter(
    n => Number(n.id) !== Number(noteId));
  await saveDb();
  render();}

async function addAbsence(workerId,date){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  const type = prompt(
    "Typ volna:\n\nDovolená\nNemoc\nŠkolení\nHome office\nVolno");
  if(!type) return;
  db.absences.push({
    id: nextId(db.absences),
    workerId,
    date,
    type});
  await saveDb();
  render();}

async function deleteAbsence(id){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  if(!confirm("Smazat volno?")){
    return;}
  db.absences = db.absences.filter(
    a => Number(a.id) !== Number(id));
  await saveDb();
  render();}

async function editExistingNote(noteId){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  const note = db.notes.find(
    n => Number(n.id) === Number(noteId));
  if(!note) return;
  const text = prompt(
    "Upravit poznámku:",
    note.text);
  if(text === null){
    return;}
  note.text = text;
  await saveDb();
  render();}  

function dragJob(ev){const card=ev.target.closest(".job");ev.dataTransfer.setData("jobId",card.dataset.jobId);ev.dataTransfer.setData("assignmentId",card.dataset.assignmentId||"");ev.dataTransfer.effectAllowed="move"}

function allowDrop(ev){
  ev.preventDefault();
  ev.currentTarget.classList.add("dragover");}

function leaveDrop(ev){
  ev.currentTarget.classList.remove("dragover");}

async function dropJob(ev){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  ev.preventDefault();
  ev.currentTarget.classList.remove("dragover");
  const jobId = Number(ev.dataTransfer.getData("jobId"));
  const assignmentId = Number(ev.dataTransfer.getData("assignmentId") || 0);
  const rowKind = ev.currentTarget.dataset.rowKind;
  const rowId = Number(ev.currentTarget.dataset.rowId);
  const date = ev.currentTarget.dataset.date;
  const job = jobById(jobId);
  if(!job) return;
  let a = assignmentId
    ? assignmentById(assignmentId)
    : null;
  if(!a){
    a = {
      id: nextId(db.assignments),
      jobId,
      workerId: null,
      vehicleId: null,
      date,
      load: Number(job.load || 10),
      vehicleLoad: Number(job.vehicleLoad || 10)
    };
    db.assignments.push(a);
  }
  a.date = date;
  if(rowKind === "worker"){
    const hasAbsence = db.absences.some(x =>
  Number(x.workerId) === Number(rowId) &&
  x.date === date);
if(hasAbsence){
  alert("Pracovník má v tento den volno.");
  return;}
    a.workerId = rowId;
    const w = workerById(rowId);
    if(w && !workerHasSkill(w, job.skill)){
      setStatus("Upozornění: pracovník nemá požadovanou specializaci");}}
  if(rowKind === "vehicle"){
    a.vehicleId = rowId;}
  if(job.state === "Nová"){
    job.state = "Naplánováno";}
  await saveDb();
  render();}

function openAssignment(id){selectedAssignmentId=id;
  const a=assignmentById(id);if(!a)return;
  const j=jobById(a.jobId);a_job_title.value=j?.title||"";
  a_date.value=a.date||iso(new Date());
  a_load.value=a.load||10;
  a_vehicle_load.value=a.vehicleLoad||10;
  a_worker.innerHTML=`<option value="">Bez pracovníka</option>`+db.workers.map(w=>`<option value="${w.id}">${esc(w.title)}</option>`).join("");
  a_worker.value=a.workerId||"";
  a_vehicle.innerHTML=`<option value="">Bez vozidla</option>`+db.vehicles.map(v=>`<option value="${v.id}">${esc(v.title)} ${v.spz?"· "+esc(v.spz):""}</option>`).join("");
  a_vehicle.value=a.vehicleId||"";openModal("assignModal")}

async function saveAssignmentFromModal(){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  const a = assignmentById(selectedAssignmentId);
  if(!a) return;
  a.date = a_date.value;
  a.workerId = a_worker.value
    ? Number(a_worker.value)
    : null;
  a.vehicleId = a_vehicle.value
    ? Number(a_vehicle.value)
    : null;
  a.load = Number(a_load.value || 10);
  a.vehicleLoad = Number(a_vehicle_load.value || 10);
  if(!a.workerId && !a.vehicleId){
    db.assignments = db.assignments.filter(
      x => Number(x.id) !== Number(a.id)
    );
  }
  await saveDb();
  closeModal("assignModal");
  render();
}
async function unassignCurrent(){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;
  }
  if(!selectedAssignmentId) return;
  db.assignments = db.assignments.filter(
    a => Number(a.id) !== Number(selectedAssignmentId)
  );
  await saveDb();
  closeModal("assignModal");
  render();
}
