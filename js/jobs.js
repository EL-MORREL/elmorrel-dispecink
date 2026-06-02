
function openJob(id){selectedJobId=id||null;const j=id?jobById(id):null;jobModalTitle.textContent=j?"Detail zakázky":"Nová zakázka";j_title.value=j?.title||"";j_address.value=j?.address||"";j_contact.value=j?.contact||"";j_phone.value = j?.phone || "";
j_lead_worker.innerHTML =
  `<option value="">Bez technika</option>` +
  db.workers.map(w =>
    `<option value="${w.id}">
      ${esc(w.title)}
    </option>`
  ).join("");
j_lead_worker.value = j?.leadWorkerId || "";j_priority.value=j?.priority||"Střední";j_skill.value=j?.skill||"Bez požadavku";j_state.value=j?.state||"Nová";j_days.value=j?.days||1;j_people.value=j?.people||1;j_estimated.value = j?.estimated || ((j?.days || 1) * (j?.people || 1) * 10);
j_load.value = j?.load || 10;
j_vehicle_load.value = j?.vehicleLoad || 10;j_from.value=j?.timeFrom||"";j_to.value=j?.timeTo||"";j_note.value=j?.note||"";deleteJobBtn.classList.toggle("hidden",!j);duplicateJobBtn.classList.toggle("hidden",!j);completeJobBtn.classList.toggle("hidden",!j);invoiceJobBtn.classList.toggle("hidden",!j);if(j){
  const p = jobProgress(j);
  jobStats.innerHTML = `
    Odhad: <b>${p.estimated}</b> hodin ·
    Naplánováno: <b>${p.actual.toFixed(1)}</b> ·
    Zbývá: <b>${(p.estimated - p.actual).toFixed(1)}</b> hod.
    ${p.over ? " · <b style='color:#b91c1c'>PŘETAŽENO</b>" : ""}
  `;
  if(j.updatedBy){
    jobStats.innerHTML += `
      <br>
      Poslední změna:
      <b>${j.updatedBy}</b>
    `;
  }
}else{
  jobStats.innerHTML = "";
}
openModal("jobModal");
}
function getJobPayload(){
  return{
    title:j_title.value.trim(),
    address:j_address.value.trim(),
    contact:j_contact.value.trim(),
    phone:j_phone.value.trim(),
    leadWorkerId: j_lead_worker.value
  ? Number(j_lead_worker.value)
  : null,
    priority:j_priority.value,
    skill:j_skill.value,
    state:j_state.value,
    days:Number(j_days.value||1),
    people:Number(j_people.value||1),
    estimated:Number(j_estimated.value||10),
    load:Number(j_load.value||10),
    vehicleLoad:Number(j_vehicle_load.value||10),
    timeFrom:j_from.value,
    timeTo:j_to.value,
    note:j_note.value.trim(),
    updatedAt:new Date().toISOString(),
    updatedBy:currentUser?.email || "neznámý"
  }
}
 function syncHoursFromTime(){
  if(!j_from.value || !j_to.value) return;
  const [fh,fm] = j_from.value.split(":").map(Number);
  const [th,tm] = j_to.value.split(":").map(Number);
  const from = fh + fm / 60;
  const to = th + tm / 60;
  let diff = to - from;
  if(diff < 0){
    diff += 24;
  }
  j_load.value = diff.toFixed(1);
  j_vehicle_load.value = diff.toFixed(1);
  if(diff > 10){
    setStatus("Pozor: překročen standard 10 hodin");
  }
}
function syncEstimateFromDaysPeople(){
  j_estimated.value =
    (
      Number(j_days.value || 0) *
      Number(j_people.value || 0) *
      10
    ).toString();
}
async function saveJob(){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;
  }
  const p = getJobPayload();
  if(!p.title){
    alert("Vyplň název zakázky.");
    return;
  }
  if(selectedJobId){
    const i = db.jobs.findIndex(
      j => Number(j.id) === Number(selectedJobId)
    );
    db.jobs[i] = {
      ...db.jobs[i],
      ...p
    };
  }else{
    db.jobs.push({
      id: nextId(db.jobs),
      invoiced: p.state === "Vyfakturováno",
      ...p
    });
  }
  if(p.state === "Vyfakturováno"){
    const j = selectedJobId
      ? jobById(selectedJobId)
      : db.jobs[db.jobs.length - 1];
    if(j){
      j.invoiced = true;
    }
  }
const job = selectedJobId
  ? jobById(selectedJobId)
  : db.jobs[db.jobs.length - 1];

await upsertJobTable(job);
  closeModal("jobModal");
  render();
}
async function deleteJob(){
  if(!canEdit){
    alert("Nemáte oprávnění k úpravám");
    return;
  }
  if(!selectedJobId) return;
  if(!confirm("Smazat zakázku včetně jejího přiřazení v plánu?")){
    return;
  }
  db.jobs = db.jobs.filter(
    j => Number(j.id) !== Number(selectedJobId)
  );
  db.assignments = db.assignments.filter(
    a => Number(a.jobId) !== Number(selectedJobId)
  );
 await deleteJobTable(selectedJobId);

  closeModal("jobModal");
  render();
}
async function duplicateJob(){

  if(!selectedJobId)return;

  const j = jobById(selectedJobId);

  if(!j)return;

  const copy = {
    ...j,
    id: nextId(db.jobs),
    title: j.title + " - kopie",
    state: "Nová",
    invoiced: false
  };

  db.jobs.push(copy);

  await upsertJobTable(copy);

  closeModal("jobModal");
  render();
}
async function duplicateJob(){

  if(!selectedJobId)return;

  const j = jobById(selectedJobId);

  if(!j)return;

  const copy = {
    ...j,
    id: nextId(db.jobs),
    title: j.title + " - kopie",
    state: "Nová",
    invoiced: false
  };

  db.jobs.push(copy);

  await upsertJobTable(copy);

  closeModal("jobModal");
  render();
}
