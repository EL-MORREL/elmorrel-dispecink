function openVehicle(id){selectedVehicleId=id||null;
  const v=id?vehicleById(id):null;vehicleModalTitle.textContent=v?"Detail vozidla":"Nové vozidlo";
  v_title.value=v?.title||"";
  v_spz.value=v?.spz||"";
  v_type.value=v?.type||"";
  v_capacity.value=v?.capacity||10;
  v_note.value=v?.note||"";
  v_people_capacity.value = v?.peopleCapacity || 5;
  deleteVehicleBtn.classList.toggle("hidden",!v);
  openModal("vehicleModal")}

async function saveVehicle(){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  const p = {
    title: v_title.value.trim(),
    spz: v_spz.value.trim(),
    type: v_type.value.trim(),
    capacity: Number(v_capacity.value || 10),
    peopleCapacity: Number( v_people_capacity.value || 5),
    note: v_note.value.trim()};
  if(!p.title){
    alert("Vyplň název vozidla.");
    return;}
  if(selectedVehicleId){
    const i = db.vehicles.findIndex(
      v => Number(v.id) === Number(selectedVehicleId));
    db.vehicles[i] = {
      ...db.vehicles[i],
      ...p};
  }else{
    db.vehicles.push({
      id: nextId(db.vehicles),
      ...p});}
  const vehicle = selectedVehicleId
  ? db.vehicles.find(
      v => Number(v.id) === Number(selectedVehicleId)
    )
  : db.vehicles[db.vehicles.length - 1];




  await upsertVehicleTable(vehicle);
  closeModal("vehicleModal");
  render();}

async function deleteVehicle(){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;}
  if(!selectedVehicleId) return;
  if(!confirm("Smazat vozidlo? Zakázky zůstanou, jen se odebere vozidlo z přiřazení.")){
    return;}
  db.vehicles = db.vehicles.filter(
    v => Number(v.id) !== Number(selectedVehicleId));
  db.assignments.forEach(a => {
    if(Number(a.vehicleId) === Number(selectedVehicleId)){
      a.vehicleId = null;}});
  db.assignments = db.assignments.filter(
    a => a.workerId || a.vehicleId);
  await deleteVehicleTable(selectedVehicleId);


  closeModal("vehicleModal");
  render();}

async function deleteVehicleDirect(id){selectedVehicleId=id;deleteVehicle()}
