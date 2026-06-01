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
