let realtimeChannel = null;

function startRealtime(){
  if(!currentUser) return;
  if(realtimeChannel){
    supabaseClient.removeChannel(realtimeChannel);}
  realtimeChannel = supabaseClient
    .channel("app_state_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_state"},
      async (payload) => {
        console.log("Realtime změna", payload);
        const { data, error } = await supabaseClient
          .from("app_state")
          .select("data")
          .eq("id",1)
          .single();
        if(error){
          console.error(error);
          return;}
        if(data?.data){
          db = data.data;
          if(!db.notes){
            db.notes = [];}
        if(!db.absences){
          db.absences = [];}
          render();
          setStatus("Aktualizováno z cloudu");}})
    .subscribe((status)=>{
      console.log("Realtime status:", status);
    });
}

