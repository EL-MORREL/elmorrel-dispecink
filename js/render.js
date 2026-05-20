function render(){renderHeader();renderSide();renderBoard()}
function renderHeader(){const days=["Pracovník"];for(let i=0;i<7;i++)days.push(czDate(addDays(weekStart,i)));head.innerHTML=days.map(d=>`<div>${esc(d)}</div>`).join("")}
function renderSide(){const assigned=new Set(db.assignments.map(a=>Number(a.jobId))),filter=jobFilter.value;jobsTitle.textContent=filter==="archive"?"Archiv zakázek":filter==="to_invoice"?"Čeká na fakturaci":filter==="overrun"?"Přetažené zakázky":"Zakázky";
  let visible=db.jobs.filter(j=>matchesFilter(j)&&matchesSearch(j));
  let side = visible;if(filter !== "archive"){
  side = visible.filter(j => j.state !== "Vyfakturováno")};unassigned.innerHTML=side.length?side.map(j=>jobCard(j,null)).join(""):`<div class="empty">Žádné zakázky v tomto pohledu.</div>`;
peopleList.innerHTML=db.workers.length?db.workers.map(w=>`<div class="mini-card" ondblclick="openWorker(${w.id})"><div class="job-title">${esc(w.title)}</div><div class="job-meta">${esc(w.email||"")}</div><div class="badges">${(w.skills||[]).map(s=>`<span class="badge skill">${esc(s)}</span>`).join("")}</div><div class="quick-actions"><button class="secondary" onclick="openWorker(${w.id})">Upravit</button><button class="danger" onclick="deleteWorkerDirect(${w.id})">Smazat</button></div></div>`).join(""):`<div class="empty">Zatím nejsou založení pracovníci.</div>`;
carsList.innerHTML=db.vehicles.length?db.vehicles.map(v=>`<div class="mini-card" ondblclick="openVehicle(${v.id})"><div class="job-title">${esc(v.title)}</div><div class="job-meta">${esc(v.spz||"")} ${esc(v.type||"")}</div><div class="quick-actions"><button class="secondary" onclick="openVehicle(${v.id})">Upravit</button><button class="danger" onclick="deleteVehicleDirect(${v.id})">Smazat</button></div></div>`).join(""):`<div class="empty">Zatím nejsou založená vozidla.</div>`}
function renderBoard(){
  const r = rows();
  if(!r.length){
    body.innerHTML = `
      <div class="row">
        <div class="name-cell">Bez dat</div>
        <div class="cell" style="grid-column:span 7">
          <div class="empty">
            Nejdřív přidej pracovníky nebo vozidla.
          </div>
        </div>
      </div>
    `;
    return;
  }
  body.innerHTML = r.map(row => {
    let html = `
      <div class="row">
        <div class="name-cell">
          <strong>${esc(row.title)}</strong>
          <div class="sub">${esc(row.sub)}</div>
        </div>
    `;
    for(let i=0;i<7;i++){
      const date = addDays(weekStart,i);
      let ass = assignmentsFor(row,date).filter(a => {
        const j = jobById(a.jobId);
        return j && matchesFilter(j) && matchesSearch(j);
      });
      if(jobFilter.value === "active"){
        ass = ass.filter(a =>
          !isArchiveState(jobById(a.jobId))
        );
      }
     const used = usedCapacity(row,ass,date);
     const absences = db.absences.filter(x =>
  Number(x.workerId) === Number(row.id) &&
  x.date === iso(date)
);

