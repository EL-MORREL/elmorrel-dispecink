let draggingNow = false;
let realtimeChannel = null;

async function startRealtime() {

  if (!currentUser) return;

  if (realtimeChannel) {
    await supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  realtimeChannel = supabaseClient
    .channel("planner_realtime")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "jobs"
      },
      async () => {
        if(draggingNow) return;
        await loadDb();
        setStatus("Aktualizováno z cloudu");
      }
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "assignments"
      },
      async () => {
        if(draggingNow) return;
        await loadDb();
        setStatus("Aktualizováno z cloudu");
      }
    )

    .subscribe((status) => {

      console.log("Realtime status:", status);

      if(status === "SUBSCRIBED"){
        console.log("Realtime připojen");
      }

      if(status === "CHANNEL_ERROR"){
        console.error("Realtime channel error");
      }

      if(status === "TIMED_OUT"){
        console.error("Realtime timeout");
      }

    });
}
