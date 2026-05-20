function openWorker(id){selectedWorkerId=id||null;
  const w=id?workerById(id):null;
  workerModalTitle.textContent=w?"Detail pracovníka":"Nový pracovník";
  w_title.value=w?.title||"";
  w_email.value=w?.email||"";
  w_phone.value=w?.phone||"";
  w_capacity.value=w?.capacity||10;
  setSelectedMulti("w_skills",w?.skills||[]);
  deleteWorkerBtn.classList.toggle("hidden",!w);
  openModal("workerModal")}

async function saveWorker(){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  const p = {
    title: w_title.value.trim(),
    email: w_email.value.trim(),
    phone: w_phone.value.trim(),
    capacity: Number(w_capacity.value || 0),
    skills: getSelectedMulti("w_skills")};
  if(!p.title){
    alert("Vyplň jméno pracovníka.");
    return;}
  if(selectedWorkerId){
    const i = db.workers.findIndex(
      w => Number(w.id) === Number(selectedWorkerId));
    db.workers[i] = {
      ...db.workers[i],
      ...p};
  }else{
    db.workers.push({
      id: nextId(db.workers),
      ...p});}
  const ok = await saveDb();
  if(!ok) return;
  closeModal("workerModal");
  render();}

async function deleteWorker(){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  if(!selectedWorkerId) return;
  if(!confirm("Smazat pracovníka? Zakázky zůstanou, jen se odebere pracovník z přiřazení.")){
    return;}
  db.workers = db.workers.filter(
    w => Number(w.id) !== Number(selectedWorkerId));
  db.assignments.forEach(a => {
    if(Number(a.workerId) === Number(selectedWorkerId)){
      a.workerId = null;}});
  db.assignments = db.assignments.filter(
    a => a.workerId || a.vehicleId);
  await saveDb();
  closeModal("workerModal");
  render();}

async function deleteWorkerDirect(id){
  selectedWorkerId = id;
  deleteWorker();}
