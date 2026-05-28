function switchTab(t){sideJobs.classList.toggle("hidden",t!=="jobs");
   sidePeople.classList.toggle("hidden",t!=="people");
   sideCars.classList.toggle("hidden",t!=="cars");
   tabJobs.classList.toggle("active",t==="jobs");
   tabPeople.classList.toggle("active",t==="people");
   tabCars.classList.toggle("active",t==="cars")}

function prevWeek(){weekStart=addDays(weekStart,-7);render()}

function nextWeek(){weekStart=addDays(weekStart,7);render()}

function goToday(){weekStart=monday(new Date());render()}

function rows(){
  const mode=viewMode.value;

  if(mode==="vehicles"){
    return db.vehicles.map(v => ({
      kind:"vehicle",
      id:v.id,
      title:v.title,
      sub:[v.spz,v.type]
        .filter(Boolean)
        .join(" · "),
      capacity:Number(v.capacity||10),
      peopleCapacity:Number(v.peopleCapacity || 5)
    }));
  }

  return db.workers
  .filter(w => {

    if(!w.hiddenFrom){
      return true;
    }

    return iso(weekStart) < w.hiddenFrom;

  })
  .map(w => ({
    kind:"worker",
    id:w.id,
    title:w.title,
    sub:[w.email,w.phone]
      .filter(Boolean)
      .join(" · "),
    capacity:Number(w.capacity||10)
  }));
}

function exportData(){
  if(!canEdit){
    alert("Nemáte oprávnění k exportu");
    return;}
  const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="elmorrel-dispecink-data.json";
  a.click();URL.revokeObjectURL(url)}

async function importData(e){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  const file = e.target.files[0];
  if(!file) return;
  const r = new FileReader();
  r.onload = async () => {
    try{
      let imported = JSON.parse(r.result);
      if(imported.data){
        imported = imported.data;}
      if(
        !Array.isArray(imported.jobs) ||
        !Array.isArray(imported.workers) ||
        !Array.isArray(imported.vehicles) ||
        !Array.isArray(imported.assignments)){
        alert("Soubor nemá správnou strukturu.");
        return;}
      db = imported;
      const ok = await saveDb();
      if(!ok) return;
      render();
      alert("Import hotový.");
    }catch(err){
      console.error("IMPORT ERROR:", err);
      alert("Import se nepodařil: " + err.message);}};
  r.readAsText(file);
  e.target.value = "";}
