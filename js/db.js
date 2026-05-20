function createEmptyDb(){return{jobs:[],workers:[],vehicles:[],assignments:[],notes:[],absences:[]}}
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
  const { error } = await supabaseClient
    .from("app_state")
    .upsert({
      id: 1,
      data: db,
      updated_by: currentUser.email
    });
  if(error){
    console.error("SAVE ERROR:", error);
    alert("Chyba ukládání: " + error.message);
    return false;
  }
  setStatus("Uloženo do cloudu");
  return true;
}
