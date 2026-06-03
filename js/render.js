function render(){
  renderHeader();
  renderSide();
  renderBoard();
}
function renderHeader(){

  const cols = ["Datum"];

  rows().forEach(r => {

    cols.push(`
      <div>
        <strong>${esc(r.title)}</strong>
        <div style="
          font-size:11px;
          font-weight:400;
          margin-top:4px;
          opacity:.8;
        ">
          ${esc(r.sub || "")}
        </div>
      </div>
    `);

  });

 head.innerHTML = cols
  .map(d => typeof d === "string"
    ? `<div>${d}</div>`
    : d
  )
  .join("");
}

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
        <div class="cell">
          <div class="empty">
            Nejdřív přidej pracovníky nebo vozidla.
          </div>
        </div>
      </div>
    `;
    return;
  }

  const holidays = [
    "2026-01-01",
    "2026-04-03",
    "2026-04-06",
    "2026-05-01",
    "2026-05-08",
    "2026-07-05",
    "2026-07-06",
    "2026-09-28",
    "2026-10-28",
    "2026-11-17",
    "2026-12-24",
    "2026-12-25",
    "2026-12-26"
  ];

  body.innerHTML = Array.from({length:7}, (_,i)=>{

    const date = addDays(weekStart,i);
    const currentDate = iso(date);

    const day = new Date(currentDate).getDay();

    const isWeekend =
      day === 0 || day === 6;

    const isHoliday =
      holidays.includes(currentDate);
   const workers = db.workers;
   const vehicles = db.vehicles;

   const busyWorkers = workers.filter(w => {

   const ass = db.assignments.filter(a =>
    Number(a.workerId) === Number(w.id) &&
    a.date === currentDate
  );

  return ass.length > 0;

}).length;

   const busyVehicles = vehicles.filter(v => {

   const ass = db.assignments.filter(a =>
    Number(a.vehicleId) === Number(v.id) &&
    a.date === currentDate
  );

  return ass.length > 0;

}).length;

   const absentWorkers = db.absences.filter(a =>
  a.date === currentDate
).length;

   const totalHours = db.assignments
  .filter(a => a.date === currentDate)
  .reduce((sum,a)=>{
    return sum + Number(a.load || 0);
  },0);

    let html = `
      <div class="row">

        <div class="
          name-cell
          ${isWeekend ? "weekend" : ""}
          ${isHoliday ? "holiday" : ""}
        ">
          <strong>${esc(czDate(date))}</strong>

<div style="
  margin-top:8px;
  font-size:11px;
  line-height:1.5;
  opacity:.85;
">

  👷 ${busyWorkers}/${workers.length}

  <br>

  🚐 ${busyVehicles}/${vehicles.length}

  <br>

  ⏱ ${totalHours} h

  ${
    absentWorkers
      ? `<br>🏖 ${absentWorkers} volno`
      : ""
  }

    </div>
</div>
    `;

    r.forEach(row => {

      let ass = assignmentsFor(row,date).filter(a => {
        const j = jobById(a.jobId);
        return j &&
          matchesFilter(j) &&
          matchesSearch(j);
      });

      if(jobFilter.value === "active"){
        ass = ass.filter(a =>
          !isArchiveState(jobById(a.jobId))
        );
      }

      const used =
        usedCapacity(row,ass,date);

      const crewCount =
        row.kind === "vehicle"
          ? vehicleCrewCount(
              row.id,
              iso(date)
            )
          : 0;

      const absences =
  row.kind === "worker"
    ? db.absences.filter(x =>
        Number(x.workerId) === Number(row.id) &&
        x.date === iso(date)
      )
    : [];

      const hasAbsence =
        absences.length > 0;
      const vehicleAbsences =
  row.kind === "vehicle"
    ? db.vehicleAbsences.filter(x =>
        Number(x.vehicleId) === Number(row.id) &&
        x.date === iso(date)
      )
    : [];
      html += `
        <div
          class="cell
            ${hasAbsence ? "cell-absence" : ""}
            ${isWeekend ? "weekend" : ""}
            ${isHoliday ? "holiday" : ""}"
          data-row-kind="${row.kind}"
          data-row-id="${row.id}"
          data-date="${iso(date)}"
          ondragover="allowDrop(event)"
          ondragleave="leaveDrop(event)"
          ondrop="dropJob(event)"
        >

          <div class="
            capacity
            ${used > row.capacity ? "over" : ""}
          ">

            <span>
              ${used}/${row.capacity} hod.
            </span>

            <span>
              ${used > row.capacity
                ? "PŘETÍŽENO"
                : ""}
            </span>

            ${
              row.kind === "vehicle"
              ? `
                <span>
                  👥 ${crewCount}/${row.peopleCapacity || 5}
                </span>
              `
              : ""
            }

          </div>

         ${row.kind === "worker" ? `
  <button
    class="secondary"
    style="
      width:100%;
      margin-bottom:4px;
      padding:4px;
      font-size:10px
    "
    onclick="
      addAbsence(
        ${row.id},
        '${iso(date)}'
      )
    ">
    Volno
  </button>
` : ""}

${row.kind === "vehicle" ? `
  <button
    class="secondary"
    style="
      width:100%;
      margin-bottom:4px;
      padding:4px;
      font-size:10px
    "
    onclick="
      addVehicleAbsence(
        ${row.id},
        '${iso(date)}'
      )
    ">
    🚐 Servis
  </button>
` : ""}

${row.kind === "worker" ? `
  <button
    class="day-note-add"
              onclick="
                editDayNote(
                  ${row.id},
                  '${iso(date)}'
                )
              ">
              📝 Přidat poznámku
            </button>
          ` : ""}
      `;

      const notes =
        row.kind === "worker"
          ? getDayNotes(
              row.id,
              iso(date)
            )
          : [];

      notes.forEach(note => {

        html += `
          <div
            class="day-note"
            onclick="
              editExistingNote(${note.id})
            "
          >
            <span>
              📝 ${esc(note.text)}
            </span>

            <button
              class="note-delete"
              onclick="
                event.stopPropagation();
                deleteDayNote(${note.id})
              ">
              ✕
            </button>
          </div>
        `;
      });

      absences.forEach(a => {
        
        let color = "#94a3b8";

        if(a.type.includes("Dovolená")){
          color = "#0ea5e9";
        }

        if(a.type.includes("Nemoc")){
          color = "#dc2626";
        }

        if(a.type.includes("Školení")){
          color = "#8b5cf6";
        }

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
              onclick="
                deleteAbsence(${a.id})
              "
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
              ">
              ✕
            </button>

            <div class="job-title">
              ${esc(a.type)}
            </div>

          </div>
        `;
      });
      vehicleAbsences.forEach(a => {

  html += `
    <div
      class="job"
      style="
        background:#fee2e2;
        color:#991b1b;
        border-left:4px solid #dc2626;
      "
    >
      <div class="job-title">
        🚐 ${esc(a.type)}
      </div>
    </div>
  `;

});
      const renderedJobs = new Set();

      ass.forEach(a => {

        if(row.kind === "vehicle"){

          const key =
            `${a.date}_${a.jobId}`;

          if(renderedJobs.has(key)){
            return;
          }

          renderedJobs.add(key);
        }

        const j = jobById(a.jobId);

        if(j){
          html += jobCard(j,a);
        }
      });

      html += `</div>`;
    });

    html += `</div>`;

    return html;

  }).join("");
}
function renderMobileBoard(){

  const days = Array.from(
    {length:7},
    (_,i)=>addDays(weekStart,i)
  );

  body.innerHTML = days.map(date => {

    const currentDate = iso(date);

    const workers = db.workers;

    const busyWorkers = workers.filter(w =>
      db.assignments.some(a =>
        Number(a.workerId) === Number(w.id) &&
        a.date === currentDate
      )
    ).length;

    const busyVehicles = db.vehicles.filter(v =>
      db.assignments.some(a =>
        Number(a.vehicleId) === Number(v.id) &&
        a.date === currentDate
      )
    ).length;

    return `

      <div class="mobile-day-card">

        <div class="mobile-day-header">

          <div>
            <div class="mobile-day-title">
              ${esc(czDate(date))}
            </div>

            <div class="mobile-day-stats">
              👷 ${busyWorkers}/${db.workers.length}
              ·
              🚐 ${busyVehicles}/${db.vehicles.length}
            </div>
          </div>

        </div>

        <div class="mobile-workers">

          ${db.workers.map(worker => {

            const ass = db.assignments.filter(a =>
              Number(a.workerId) === Number(worker.id) &&
              a.date === currentDate
            );

            const absences = db.absences.filter(a =>
              Number(a.workerId) === Number(worker.id) &&
              a.date === currentDate
            );

            return `

              <div class="mobile-worker-card">

                <div class="mobile-worker-head">

                  <div>
                    <strong>
                      ${esc(worker.title)}
                    </strong>
                  </div>

                  <button
                    class="secondary"
                    onclick="
                      addAbsence(
                        ${worker.id},
                        '${currentDate}'
                      )
                    ">
                    Volno
                  </button>

                </div>

                ${absences.map(a => `
                  <div class="mobile-absence">
                    ${esc(a.type)}
                  </div>
                `).join("")}

                ${ass.map(a => {

                  const j = jobById(a.jobId);

                  if(!j) return "";

                  return `
                    <div
                      class="mobile-job"
                      ondblclick="
                        openAssignment(${a.id})
                      "
                    >

                      <div class="mobile-job-title">
                        ${esc(j.title)}
                      </div>

                      <div class="mobile-job-meta">
                        ${esc(j.address || "")}
                      </div>

                      <div class="mobile-job-meta">
                        ⏱ ${a.load || 0} h
                      </div>

                    </div>
                  `;

                }).join("")}

              </div>
            `;

          }).join("")}

        </div>

      </div>
    `;

  }).join("");
}
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
  const assignedVehicleRows =
  a
    ? vehiclesForJobDate(a.jobId, a.date)
    : [];
let assignedVehicles =
  assignedVehicleRows
    .map(x => vehicleById(x.vehicle_id))
    .filter(Boolean);

// kompatibilita se starými daty
if(
  assignedVehicles.length === 0 &&
  a?.vehicleId
){
  const oldVehicle =
    vehicleById(a.vehicleId);

  if(oldVehicle){
    assignedVehicles = [oldVehicle];
  }
}
const vehicleBadge = assignedVehicles.length
  ? assignedVehicles.map(v => {

      const vehicleCrew =
        vehicleCrewCount(v.id, a.date);

      const vehicleCapacity =
        Number(v.peopleCapacity || 5);

      return `
        <span class="badge ${vehicleCrew > vehicleCapacity ? "warn" : ""}">
          🚐 ${esc(v.title)}${v.spz ? " · " + esc(v.spz) : ""} · 👥 ${vehicleCrew}/${vehicleCapacity}
        </span>
      `;

    }).join("")
  : "";
return `
<div class="job
    ${priorityClass(j.priority)}
    ${skillClass(j.skill)}
    ${jobVisualState(j)}
    ${mismatch ? "skill-mismatch" : ""}
    ${a?.invoiced ? "invoiced-job" : ""}
  "
  draggable="true"
  data-job-id="${j.id}"
  data-assignment-id="${a?a.id:""}"
  ondragstart="dragJob(event)"
  ondblclick="${a
    ? `openAssignment(${a.id})`
    : `openJob(${j.id})`
  }">

<div class="job-title">${esc(j.title)}</div>
${a?.invoiced ? `
  <div class="invoice-overlay">
    💰 VYFAKTUROVÁNO
  </div>
` : ""}
<div class="job-meta">${esc(j.address||"")}</div>
<div class="job-meta">${esc(j.contact||"")} ${esc(j.phone||"")}</div>

${j.address ? `
  <div class="job-meta job-address">
    📍 ${esc(j.address)}
  </div>
` : ""}

${j.contact || j.phone ? `
  <div class="job-meta job-contact">
    ☎ ${esc(j.contact || "")} ${esc(j.phone || "")}
  </div>
` : ""}
  ${a?.note ? `
  <div class="job-note"> 📝 ${esc(a.note)}</div>
` : ""}
  <div class="badges"><span class="badge">${esc(j.state||"Nová")}</span>
  <span class="badge ${badgeClass}">${p.actual.toFixed(2)}/${p.estimated||0} hod.</span>
  
  ${leadWorker ? `
  <span class="badge">
    ⭐ Vedoucí: ${esc(leadWorker.title)}
  </span>
` : ""}
${otherCrew.length ? `
  <span class="badge skill">
    👥 ${esc(otherCrew.join(", "))}
  </span>
` : ""}

${vehicleBadge}

${mismatch
  ? `<span class="badge warn">⚠ odbornost</span>`
  : ""
}</div>${a ? `
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
