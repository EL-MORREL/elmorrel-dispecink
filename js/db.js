let dbVersion = null;
let savingDb = false;

function createEmptyDb(){
  return{
    jobs:[],
    workers:[],
    vehicles:[],
    assignments:[],
    assignmentVehicles:[],
    notes:[],
    absences:[],
    vehicleAbsences:[]
    
  }
}

async function loadDb(){
  
  if(!currentUser) return;

  const { data, error } = await supabaseClient
  .from("app_state")
  .select("data, updated_at")
  .eq("id", 1)
  .maybeSingle();

  if(error){
    console.error("LOAD ERROR:", error);
    alert("Chyba načtení supabase: " + error.message);
    return;
  }

 if(data?.data){
  db = data.data;
  dbVersion = data.updated_at;
}else{
  db = createEmptyDb();
  await saveDb();
}

db.jobs = await loadJobsTable();
db.workers = await loadWorkersTable();
db.vehicles = await loadVehiclesTable();
db.assignments = await loadAssignmentsTable();
db.assignmentVehicles = await loadAssignmentVehiclesTable();
db.notes = await loadNotesTable();
db.absences = await loadAbsencesTable();
db.vehicleAbsences = await loadVehicleAbsencesTable();
  // DOPLNIT ↓↓↓

  if(!db.notes){
    db.notes = [];
  }

  if(!db.absences){
    db.absences = [];
  }
  if(!db.vehicleAbsences){
  db.vehicleAbsences = [];
}
  // migrace starých procent na hodiny
  db.workers.forEach(w => {
    if(w.capacity === 100){
      w.capacity = 10;
    }
  });

  db.vehicles.forEach(v => {
    if(v.capacity === 100){
      v.capacity = 10;
    }
  });
render();
}
async function saveDb(){

  if(savingDb){
    console.warn("SAVE SKIPPED");
    return false;
  }

  savingDb = true;

  try{

    if(!currentUser){
  alert("Nejste přihlášen");
  return false;
}

const { data: current } = await supabaseClient
  .from("app_state")
  .select("updated_at")
  .eq("id", 1)
  .single();

if(
  current?.updated_at &&
  dbVersion &&
  current.updated_at !== dbVersion
){

  alert(
    "Data změnil jiný uživatel. Načítám aktuální verzi."
  );

  await loadDb();

  return false;
}

const dbForSave =
  JSON.parse(JSON.stringify(db));

delete dbForSave.jobs;
delete dbForSave.workers;
delete dbForSave.vehicles;
delete dbForSave.assignments;
delete dbForSave.notes;
delete dbForSave.absences;
delete dbForSave.vehicleAbsences;

const payload = {
  data: dbForSave,
  updated_by: currentUser.email,
  updated_at: new Date().toISOString()
};

    const { error } = await supabaseClient
      .from("app_state")
      .update(payload)
      .eq("id", 1);

    if(error){
      console.error("SAVE ERROR:", error);
      alert("Chyba ukládání: " + error.message);
      return false;
    }

    dbVersion = payload.updated_at;

setStatus("Uloženo do cloudu");

return true;

  }finally{

    savingDb = false;

  }
}
