function assignmentsFor(row,date){const d=iso(date);if(row.kind==="worker")return db.assignments.filter(a=>Number(a.workerId)===Number(row.id)&&a.date===d);return db.assignments.filter(a=>Number(a.vehicleId)===Number(row.id)&&a.date===d)}

function usedCapacity(row, ass, date){

  let used = 0;

  if(row.kind === "worker"){

    used = ass.reduce(
      (s, a) => s + Number(a.load || 10),
      0
    );

    const hasAbsence = db.absences.some(a =>
      Number(a.workerId) === Number(row.id) &&
      a.date === (
        typeof date === "string"
          ? date
          : iso(date)
      )
    );

    if(hasAbsence){
      used += row.capacity;
    }

  } else {

    const uniqueJobs = new Set();

    ass.forEach(a => {

      const key = `${a.date}_${a.jobId}`;

      if(uniqueJobs.has(key)){
        return;
      }

      uniqueJobs.add(key);

      used += Number(a.vehicleLoad || 10);
    });
  }

  return used;
}

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
  const note = {
  id: Date.now(),
  workerId,
  date,
  text
};

db.notes.push(note);

await upsertNoteTable(note);
  render();}

async function deleteDayNote(noteId){
  if(!canEdit){
    alert("Nemáte oprávnění");
    return;}
  if(!confirm("Smazat poznámku?")){
    return;}
  db.notes = db.notes.filter(
    n => Number(n.id) !== Number(noteId));
  await deleteNoteTable(noteId);
  render();}

async function addAbsence(workerId,date){

  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;
  }

  const type = await quickAbsencePicker();

  if(!type) return;

  const absence = {
  id: nextId(db.absences),
  workerId,
  date,
  type
};

db.absences.push(absence);

await upsertAbsenceTable(absence);

  render();
}
function quickAbsencePicker(){

  return new Promise(resolve => {

    const old = document.getElementById("absencePicker");

    if(old){
      old.remove();
    }

    const box = document.createElement("div");

    box.id = "absencePicker";

    box.style = `
      position:fixed;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      background:white;
      border-radius:16px;
      padding:16px;
      z-index:9999;
      box-shadow:0 20px 60px rgba(0,0,0,.25);
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      min-width:320px;
    `;

    const options = [
      ["🏖","Dovolená"],
      ["🤒","Nemoc"],
      ["🎓","Školení"],
      ["🏠","Home office"],
      ["⛔","Volno"]
    ];

    options.forEach(([icon,label]) => {

      const btn = document.createElement("button");

      btn.innerHTML = `
        <div style="font-size:22px">
          ${icon}
        </div>

        <div>
          ${label}
        </div>
      `;

      btn.style = `
        padding:16px;
        border:none;
        border-radius:12px;
        cursor:pointer;
        background:#f3f4f6;
        color:#111827;
        font-size:14px;
        font-weight:700;
      `;

      btn.onclick = () => {
        box.remove();
        resolve(label);
      };

      box.appendChild(btn);
    });

    const cancel = document.createElement("button");

    cancel.textContent = "Zrušit";

    cancel.style = `
      grid-column:1/-1;
      padding:10px;
      border:none;
      border-radius:10px;
      background:#dc2626;
      color:white;
      cursor:pointer;
    `;

    cancel.onclick = () => {
      box.remove();
      resolve(null);
    };

    box.appendChild(cancel);

    document.body.appendChild(box);

  });
}
async function deleteAbsence(id){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  if(!confirm("Smazat volno?")){
    return;}
  db.absences = db.absences.filter(
    a => Number(a.id) !== Number(id));
  await deleteAbsenceTable(id);
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
  await upsertNoteTable(note);
  render();}  

function dragJob(ev){

  draggingNow = true;

  const card = ev.target.closest(".job");

  ev.dataTransfer.setData(
    "jobId",
    card.dataset.jobId
  );

  ev.dataTransfer.setData(
    "assignmentId",
    card.dataset.assignmentId || ""
  );

  ev.dataTransfer.effectAllowed = "move";
}

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
  if(!job){

  draggingNow = false;

  return;
}
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
    vehicleLoad: Number(job.vehicleLoad || 10),
    note: "",
    invoiced:false
  };

  db.assignments.push(a);

  await upsertAssignmentTable(a);
}
  a.date = date;
  if(rowKind === "worker"){
    const hasAbsence = db.absences.some(x =>
  Number(x.workerId) === Number(rowId) &&
  x.date === date);
if(hasAbsence){

  draggingNow = false;

  alert("Pracovník má v tento den volno.");

  return;
}
    a.workerId = rowId;
    const w = workerById(rowId);
    if(w && !workerHasSkill(w, job.skill)){
      setStatus("Upozornění: pracovník nemá požadovanou specializaci");}}
if(rowKind === "vehicle"){
  const vehicleBlocked =
  db.vehicleAbsences.some(x =>
    Number(x.vehicleId) === Number(rowId) &&
    x.date === date
  );

if(vehicleBlocked){

  draggingNow = false;

  alert("Vozidlo je blokované");

  return;
}
  const sameDayVehicleAssignments =
    db.assignments.filter(x =>
      Number(x.vehicleId) === Number(rowId) &&
      x.date === date
    );

  const otherJobUsingVehicle =
    sameDayVehicleAssignments.some(x =>
      Number(x.jobId) !== Number(jobId)
    );
if(otherJobUsingVehicle){

  draggingNow = false;

  alert(
    "⚠ Vozidlo je již přiřazené jiné zakázce"
  );

  return;
}

  a.vehicleId = rowId;

  db.assignments.forEach(x => {

    if(
      Number(x.jobId) === Number(a.jobId) &&
      x.date === a.date
    ){
      x.vehicleId = a.vehicleId;
      x.vehicleLoad = a.vehicleLoad;
    }

  });
}
  if(job.state === "Nová"){
    job.state = "Naplánováno";}
  
  try{

  await upsertAssignmentTable(a);

  render();

}finally{

  draggingNow = false;

}}
function vehicleCrewCount(vehicleId,date){

  const workers = new Set();

  db.assignments.forEach(a => {

    if(
      Number(a.vehicleId) === Number(vehicleId) &&
      a.date === date &&
      a.workerId
    ){
      workers.add(Number(a.workerId));
    }

  });

  return workers.size;
}
function openAssignment(id){ selectedAssignmentId = id; 
                            const a = assignmentById(id); if(!a) return; 
                            const j = jobById(a.jobId); a_job_title.value = j?.title || ""; 
                            a_date.value = a.date || iso(new Date()); a_load.value = a.load || 10; 
                            a_vehicle_load.value = a.vehicleLoad || 10; 
                            a_worker.innerHTML = `<option value="">Bez pracovníka</option>` + db.workers.map(w => ` <option value="${w.id}"> ${esc(w.title)} </option> `).join(""); 
                            a_worker.value = a.workerId || ""; 
                           a_vehicle.innerHTML =
                                db.vehicles.map(v => `
                                  <option value="${v.id}">
                                    ${esc(v.title)}
                                    ${v.spz ? "· " + esc(v.spz) : ""}
                                  </option>
                                `).join("");
                              
                              const assignedVehicles =
                                vehiclesForJobDate(
                                  a.jobId,
                                  a.date
                                );
                              
                              const selectedVehicleIds =
                                assignedVehicles.map(x =>
                                  Number(x.vehicle_id)
                                );
                              
                              Array.from(a_vehicle.options).forEach(opt => {
                                opt.selected =
                                  selectedVehicleIds.includes(
                                    Number(opt.value)
                                  );
                              }); 
                            a_note.value = a.note || ""; document.getElementById( "a_invoiced" ).checked = !!a.invoiced; openModal("assignModal"); }

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
  a.load = Number(a_load.value || 10);
  const selectedVehicleIds =
  Array.from(
    a_vehicle.selectedOptions
  ).map(x => Number(x.value));

a.vehicleLoad =
  Number(a_vehicle_load.value || 10);

db.assignments.forEach(x => {

  if(
    Number(x.jobId) === Number(a.jobId) &&
    x.date === a.date
  ){
    x.vehicleLoad = a.vehicleLoad;
  }

});
  a.note = a_note.value.trim();

const invoicedValue =
  document.getElementById("a_invoiced").checked;

db.assignments.forEach(x => {

  if(
    Number(x.jobId) === Number(a.jobId) &&
    x.date === a.date
  ){
    x.invoiced = invoicedValue;
  }

});
  if(!a.workerId){

  db.assignments = db.assignments.filter(
    x => Number(x.id) !== Number(a.id)
  );

  await deleteAssignmentTable(a.id);

}else{

  const sameJobSameDay =
    db.assignments.filter(x =>
      Number(x.jobId) === Number(a.jobId) &&
      x.date === a.date
    );

  for(const item of sameJobSameDay){
    await upsertAssignmentTable(item);
  }

}
await setAssignmentVehiclesTable(
  a.jobId,
  a.date,
  selectedVehicleIds
);

db.assignmentVehicles =
  await loadAssignmentVehiclesTable();
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

await deleteAssignmentTable(
  selectedAssignmentId
);

closeModal("assignModal");
render();
}
async function addVehicleAbsence(
  vehicleId,
  date
){

  if(!canEdit){
    alert("Nemáte oprávnění");
    return;
  }

  const type = prompt(
    "Typ blokace vozidla:",
    "Servis"
  );

  if(!type) return;

  const absence = {
    id: nextId(db.vehicleAbsences),
    vehicleId,
    date,
    type
  };

  db.vehicleAbsences.push(absence);

  await upsertVehicleAbsenceTable(absence);

  render();
}
