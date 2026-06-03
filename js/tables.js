async function loadJobsTable(){

  const { data, error } = await supabaseClient
    .from("jobs")
    .select("*");

  if(error){
    console.error(error);
    return [];
  }

  return data || [];
}

async function saveJobTable(job){

  const { error } = await supabaseClient
    .from("jobs")
    .upsert(job);

  if(error){
    console.error(error);
    throw error;
  }

  return true;
}
loadJobsTable().then(data => {
  console.log("JOBS TABLE:", data);
});
async function upsertJobTable(job){

  const { error } = await supabaseClient
    .from("jobs")
    .upsert({
      id: job.id,
      title: job.title,
      priority: job.priority,
      skill: job.skill,
      state: job.state,
      address: job.address,
      contact: job.contact,
      phone: job.phone,
      lead_worker_id: job.leadWorkerId,
      estimated: job.estimated,
      load: job.load,
      vehicle_load: job.vehicleLoad,
      note: job.note,
      days: job.days,
      people: job.people,
      time_from: job.timeFrom,
      time_to: job.timeTo,
      invoiced: job.invoiced || false,
      updated_by: job.updatedBy,
      updated_at: job.updatedAt
    });

  if(error){
    console.error("UPSERT JOB ERROR", error);
    throw error;
  }

  return true;
}
async function deleteJobTable(id){

  const { error } = await supabaseClient
    .from("jobs")
    .delete()
    .eq("id", id);

  if(error){
    console.error("DELETE JOB ERROR", error);
    throw error;
  }

  return true;
}
async function upsertWorkerTable(worker){

  const { error } = await supabaseClient
    .from("workers")
    .upsert({
      id: worker.id,
      title: worker.title,
      email: worker.email,
      phone: worker.phone,
      capacity: worker.capacity,
      skills: worker.skills || [],
      hidden_from: worker.hiddenFrom || null
    });

  if(error){
    console.error("UPSERT WORKER ERROR", error);
    throw error;
  }

  return true;
}

async function deleteWorkerTable(id){

  const { error } = await supabaseClient
    .from("workers")
    .delete()
    .eq("id", id);

  if(error){
    console.error("DELETE WORKER ERROR", error);
    throw error;
  }

  return true;
}

async function loadWorkersTable(){

  const { data, error } = await supabaseClient
    .from("workers")
    .select("*");

  if(error){
    console.error(error);
    return [];
  }

  return (data || []).map(w => ({
    id: w.id,
    title: w.title,
    email: w.email,
    phone: w.phone,
    capacity: w.capacity,
    skills: w.skills || [],
    hiddenFrom: w.hidden_from
  }));
}
async function upsertVehicleTable(vehicle){

  const { error } = await supabaseClient
    .from("vehicles")
    .upsert({
      id: vehicle.id,
      title: vehicle.title,
      spz: vehicle.spz,
      type: vehicle.type,
      capacity: vehicle.capacity,
      people_capacity: vehicle.peopleCapacity,
      note: vehicle.note
    });

  if(error){
    console.error("UPSERT VEHICLE ERROR", error);
    throw error;
  }

  return true;
}

async function deleteVehicleTable(id){

  const { error } = await supabaseClient
    .from("vehicles")
    .delete()
    .eq("id", id);

  if(error){
    console.error("DELETE VEHICLE ERROR", error);
    throw error;
  }

  return true;
}

async function loadVehiclesTable(){

  const { data, error } = await supabaseClient
    .from("vehicles")
    .select("*");

  if(error){
    console.error(error);
    return [];
  }

  return (data || []).map(v => ({
    id: v.id,
    title: v.title,
    spz: v.spz,
    type: v.type,
    capacity: v.capacity,
    peopleCapacity: v.people_capacity,
    note: v.note
  }));
}
async function loadAssignmentsTable(){

  const { data, error } = await supabaseClient
    .from("assignments")
    .select("*");

  if(error){
    console.error(error);
    return [];
  }

  return (data || []).map(a => ({
    id: a.id,
    jobId: a.job_id,
    workerId: a.worker_id,
    vehicleId: a.vehicle_id,
    date: a.date,
    load: a.load,
    vehicleLoad: a.vehicle_load,
    note: a.note || "",
    invoiced: !!a.invoiced
  }));
}

async function upsertAssignmentTable(a){

  const { error } = await supabaseClient
    .from("assignments")
    .upsert({
      id: a.id,
      job_id: a.jobId,
      worker_id: a.workerId,
      vehicle_id: a.vehicleId,
      date: a.date,
      load: a.load,
      vehicle_load: a.vehicleLoad,
      note: a.note || "",
      invoiced: !!a.invoiced
    });

  if(error){
    console.error("UPSERT ASSIGNMENT ERROR", error);
    throw error;
  }
}

async function deleteAssignmentTable(id){

  const { error } = await supabaseClient
    .from("assignments")
    .delete()
    .eq("id", id);

  if(error){
    console.error("DELETE ASSIGNMENT ERROR", error);
    throw error;
  }
}
async function loadNotesTable(){

  const { data, error } = await supabaseClient
    .from("notes")
    .select("*");

  if(error){
    console.error(error);
    return [];
  }

  return (data || []).map(n => ({
    id: n.id,
    workerId: n.row_id,
    date: n.date,
    text: n.note
  }));
}

async function upsertNoteTable(note){

  const { error } = await supabaseClient
    .from("notes")
    .upsert({
      id: note.id,
      row_kind: "worker",
      row_id: note.workerId,
      date: note.date,
      note: note.text
    });

  if(error){
    console.error("UPSERT NOTE ERROR", error);
    throw error;
  }
}

async function deleteNoteTable(id){

  const { error } = await supabaseClient
    .from("notes")
    .delete()
    .eq("id", id);

  if(error){
    console.error("DELETE NOTE ERROR", error);
    throw error;
  }
}
async function loadAbsencesTable(){

  const { data, error } = await supabaseClient
    .from("absences")
    .select("*");

  if(error){
    console.error(error);
    return [];
  }

  return (data || []).map(a => ({
    id: a.id,
    workerId: a.worker_id,
    date: a.date,
    type: a.reason
  }));
}

async function upsertAbsenceTable(a){

  const { error } = await supabaseClient
    .from("absences")
    .upsert({
      id: a.id,
      worker_id: a.workerId,
      date: a.date,
      reason: a.type
    });

  if(error){
    console.error("UPSERT ABSENCE ERROR", error);
    throw error;
  }
}

async function deleteAbsenceTable(id){

  const { error } = await supabaseClient
    .from("absences")
    .delete()
    .eq("id", id);

  if(error){
    console.error("DELETE ABSENCE ERROR", error);
    throw error;
  }
}
async function loadVehicleAbsencesTable(){

  const { data, error } = await supabaseClient
    .from("vehicle_absences")
    .select("*");

  if(error){
    console.error(error);
    return [];
  }

  return (data || []).map(v => ({
    id: v.id,
    vehicleId: v.vehicle_id,
    date: v.date,
    type: v.reason
  }));
}

async function upsertVehicleAbsenceTable(v){

  const { error } = await supabaseClient
    .from("vehicle_absences")
    .upsert({
      id: v.id,
      vehicle_id: v.vehicleId,
      date: v.date,
      reason: v.type
    });

  if(error){
    console.error("UPSERT VEHICLE ABSENCE ERROR", error);
    throw error;
  }
}

async function deleteVehicleAbsenceTable(id){

  const { error } = await supabaseClient
    .from("vehicle_absences")
    .delete()
    .eq("id", id);

  if(error){
    console.error("DELETE VEHICLE ABSENCE ERROR", error);
    throw error;
  }
}
  async function loadAssignmentVehiclesTable(){

  const { data, error } =
    await supabaseClient
      .from("assignment_vehicles")
      .select("*");

  if(error){
    console.error(error);
    return [];
  }

  return data || [];
}
async function setAssignmentVehiclesTable(jobId, date, vehicleIds){

  await supabaseClient
    .from("assignment_vehicles")
    .delete()
    .eq("job_id", jobId)
    .eq("date", date);

  if(!vehicleIds.length){
    return;
  }

  const rows = vehicleIds.map(vehicleId => ({
    job_id: jobId,
    date,
    vehicle_id: vehicleId
  }));

  const { error } = await supabaseClient
    .from("assignment_vehicles")
    .insert(rows);

  if(error){
    console.error("SET ASSIGNMENT VEHICLES ERROR", error);
    throw error;
  }
}
