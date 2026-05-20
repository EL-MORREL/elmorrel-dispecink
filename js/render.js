function render(){renderHeader();renderSide();renderBoard()}

function renderHeader(){const days=["Pracovník"];
  for(let i=0;i<7;i++)days.push(czDate(addDays(weekStart,i)));
  head.innerHTML=days.map(d=>`<div>${esc(d)}</div>`).join("")}

function renderSide(){
  const filter=jobFilter.value;jobsTitle.textContent=filter==="archive"?"Archiv zakázek":filter==="to_invoice"?"Čeká na fakturaci":filter==="overrun"?"Přetažené zakázky":"Zakázky";
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
  x.date === iso(date));
const hasAbsence = absences.length > 0;
  html += `
    <div
      class="cell ${hasAbsence ? "cell-absence" : ""}"
      data-row-kind="${row.kind}"
      data-row-id="${row.id}"
      data-date="${iso(date)}"
      ondragover="allowDrop(event)"
      ondragleave="leaveDrop(event)"
      ondrop="dropJob(event)"
    >
  
      <div class="capacity ${used > row.capacity ? "over" : ""}">
        <span>${used}/${row.capacity} hod.</span>
        <span>${used > row.capacity ? "PŘETÍŽENO" : ""}</span>
      </div>
      ${row.kind === "worker" ? `
        <button
          class="secondary"
          style="width:100%;margin-bottom:4px;padding:4px;font-size:10px"
          onclick="addAbsence(${row.id},'${iso(date)}')">
          Volno
        </button>
      ` : ""}
      ${row.kind === "worker" ? `
        <button
          class="day-note-add"
          onclick="editDayNote(${row.id},'${iso(date)}')">
          📝 Přidat poznámku
        </button>
      ` : ""}
  `;
      const notes =
  row.kind === "worker"
    ? getDayNotes(row.id, iso(date))
    : [];
notes.forEach(note => {
 html += `
  <div
    class="day-note"
    onclick="editExistingNote(${note.id})"
  >
    <span>📝 ${esc(note.text)}</span>
    <button
      class="note-delete"
      onclick="event.stopPropagation(); deleteDayNote(${note.id})">
      ✕
    </button>
  </div>
`;
});
absences.forEach(a => {
  let color = "#94a3b8";
  if(a.type.includes("Dovolená")){
    color = "#0ea5e9";}
  if(a.type.includes("Nemoc")){
    color = "#dc2626";}
  if(a.type.includes("Školení")){
    color = "#8b5cf6";}
  html += `
    <div
      class="job"
      style="
        background:${color};
        color:white;
        border-left:none;
        position:relative;
      ">
      <button
        onclick="deleteAbsence(${a.id})"
        style="
          position:absolute;
          top:4px;
          right:4px;
          border:none;
          background:rgba(255,255,255,.2);
          color:white;
          border-radius:6px;
          cursor:pointer;
          padding:2px 6px;
          font-size:11px;
        ">✕
      </button>
      <div class="job-title">
        ${esc(a.type)}
      </div>
    </div>
  `;});
      ass.forEach(a => {
        const j = jobById(a.jobId);
        if(j){
          html += jobCard(j,a);
        }
      });
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }).join("");}

function skillClass(skill){
  if(!skill) return "";
  if(skill.includes("Elektro")) return "skill-elektro";
  if(skill.includes("Optika")) return "skill-optika";
  if(skill.includes("Servis")) return "skill-servis";
  if(skill.includes("Montáž")) return "skill-montaz";
  if(skill.includes("Revize")) return "skill-revize";
  if(skill.includes("Kancelář")) return "skill-kancelar";
  return "";}

function jobCard(j,a){
  const worker = a ? workerById(a.workerId) : null;
  const vehicle = a ? vehicleById(a.vehicleId) : null;
  const leadWorker = j.leadWorkerId
  ? workerById(j.leadWorkerId)
  : null;
  const sameDayAssignments = a
  ? db.assignments.filter(x =>
      x.date === a.date &&
      Number(x.jobId) === Number(a.jobId) &&
      x.workerId): [];
  const crewNames = sameDayAssignments
  .map(x => workerById(x.workerId)?.title)
  .filter(Boolean);
  const otherCrew = worker
  ? crewNames.filter(n => n !== worker.title)
  : crewNames;
  const mismatch = 
    a && 
    worker &&
    !workerHasSkill(worker,j.skill);
  const p = jobProgress(j);
  const badgeClass = 
    p.over
      ?"red"
      :(p.pct>=85?"orange":"green");
return `
<div
  class="
    job
    ${priorityClass(j.priority)}
    ${skillClass(j.skill)}
    ${jobVisualState(j)}
    ${mismatch ? "skill-mismatch" : ""}
  " 
  draggable="true" data-job-id="${j.id}" data-assignment-id="${a?a.id:""}" ondragstart="dragJob(event)" ondblclick="${a?`openAssignment(${a.id})`:`openJob(${j.id})`}"><div class="job-title">${esc(j.title)}</div><div class="job-meta">${esc(j.address||"")}</div><div class="job-meta">${esc(j.contact||"")} ${esc(j.phone||"")}</div><div class="badges"><span class="badge">${esc(j.state||"Nová")}</span><span class="badge ${badgeClass}">${p.actual.toFixed(2)}/${p.estimated||0} hod.</span>${j.skill&&j.skill!=="Bez požadavku"?`<span class="badge skill">Pož.: ${esc(j.skill)}</span>`:""}${leadWorker ? `
  <span class="badge">
    ⭐ Vedoucí: ${esc(leadWorker.title)}
  </span>
` : ""}${worker ? `
  <span class="badge">
    👤 ${esc(worker.title)}
  </span>
` : ""}${otherCrew.length ? `
  <span class="badge skill">
    👥 ${esc(otherCrew.join(", "))}
  </span>
` : ""}${vehicle?`<span class="badge">🚐 ${esc(vehicle.title)}</span>`:""}${mismatch?`<span class="badge warn">⚠ odbornost</span>`:""}</div>${a ? `
  <div class="quick-actions">
    <button
      class="secondary"
      onclick="openAssignment(${a.id})">
      Upravit plán
    </button>
  </div>
` : ""}<div class="progress"><div style="width:${Math.min(p.pct,100)}%;background:${p.color}"></div></div>${p.over?`<div class="job-meta" style="color:#991b1b;font-weight:700">Přetaženo o ${(p.actual-p.estimated).toFixed(1)} hodin</div>`:""}
${mismatch?`<div class="skill-note">⚠ Pracovník nemá požadovanou specializaci</div>`:""}</div>`;
}
