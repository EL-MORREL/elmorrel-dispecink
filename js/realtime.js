let draggingNow = false;
let realtimeChannel = null;

async function startRealtime() {

  if (!currentUser) return;

  if (realtimeChannel) {
    await supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  realtimeChannel = supabaseClient
    .channel("app_state_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_state"
      },
     (payload) => {

  console.log("Realtime payload:", payload);

  if (!payload.new?.data) return;

  const incoming = payload.new.data;

if(
  JSON.stringify(incoming) ===
  JSON.stringify(db)
){
  return;
}
if(draggingNow){

  setTimeout(() => {
    db = incoming;
    render();
  }, 1000);

  return;
}
console.log(
  "Realtime update",
  incoming.jobs?.length,
  "zakázek"
);       
db = incoming;

  if (!db.notes) {
    db.notes = [];
  }

  if (!db.absences) {
    db.absences = [];
  }

  if (!db.vehicleAbsences) {
    db.vehicleAbsences = [];
  }

  setTimeout(() => {
  render();
}, 50);

  setStatus("Aktualizováno z cloudu");
}
    )
    .subscribe((status) => {
      console.log("Realtime status:", status);

      if (status === "SUBSCRIBED") {
        console.log("Realtime připojen");
      }

      if (status === "CHANNEL_ERROR") {
        console.error("Realtime channel error");
      }

      if (status === "TIMED_OUT") {
        console.error("Realtime timeout");
      }
    });
}
