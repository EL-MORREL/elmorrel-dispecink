function createEmptyDb(){
  return{
    jobs:[],
    workers:[],
    vehicles:[],
    assignments:[],
    notes:[],
    absences:[],
    vehicleAbsences:[]
  }
}
async function loadDb(){
  if(!currentUser) return;

  const { data, error } = await supabaseClient
    .from("app_state")
    .select("data")
    .eq("id", 1)
    .maybeSingle();

  if(error){
    console.error("LOAD ERROR:", error);
    alert("Chyba načtení supabase: " + error.message);
    return;
  }

  if(data?.data){
    db = data.data;
  }else{
    db = createEmptyDb();
    await saveDb();
  }

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

  if(!currentUser){
    alert("Nejste přihlášen");
    return false;
  }

  const payload = {
    data: JSON.parse(JSON.stringify(db)),
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

  setStatus("Uloženo do cloudu");

  return true;
}

