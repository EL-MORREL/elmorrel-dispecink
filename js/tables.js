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
