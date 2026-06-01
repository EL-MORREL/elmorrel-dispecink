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
