export function createStore(client, onChange, onStatus) {
  let epoch=0, request=0, snapshot=null, user=null, channel=null, timer=null, busy=false, dirty=false;
  const clear=()=>{epoch++;request++;snapshot=null;user=null;busy=false;dirty=false;if(channel)client.removeChannel(channel).catch(()=>{});channel=null;clearInterval(timer);timer=null;onChange(null);};
  async function refresh(){
    if(!user)return null;
    const generation=epoch, serial=++request;
    const {data,error}=await client.rpc('planner_snapshot');
    if(generation!==epoch || serial!==request)return null;
    if(error){
      if(error.code==='42501'){clear();onStatus('Přístup nebyl schválen nebo byl odebrán.',true);}
      else onStatus('Data se nepodařilo načíst. Zkuste Obnovit. '+error.message,true);
      throw error;
    }
    if(snapshot && data.version<snapshot.version)return snapshot;
    snapshot=data;onChange(data);onStatus('Aktuální data načtena.');return data;
  }
  async function session(nextUser){
    if(nextUser?.id===user?.id && snapshot)return;
    clear();user=nextUser;
    if(!user)return;
    const generation=epoch;
    await refresh();
    if(generation!==epoch || !user)return;
    channel=client.channel('planner-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'planner_control'},()=>{if(busy)dirty=true;else refresh().catch(()=>{});}).subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')onStatus('Živé spojení vypadlo; probíhá pravidelné obnovování.',true);});
    timer=setInterval(()=>{if(!busy)refresh().catch(()=>{});},30000);
  }
  async function commit(operations, expectedVersion){
    if(busy)throw Error('Počkejte na dokončení ukládání.');
    if(!snapshot || snapshot.role!=='editor')throw Error('Nemáte oprávnění k úpravám.');
    busy=true;const generation=epoch;request++;
    try{
      const {data,error}=await client.rpc('planner_apply',{expected_version:expectedVersion??snapshot.version,operations});
      if(generation!==epoch)return false;
      if(error){
        if(error.code==='40001'){await refresh();throw Error('Plán změnil jiný uživatel. Zavřete detail a otevřete aktuální verzi; změna nebyla uložena.');}
        if(error.code==='42501'){clear();throw Error('Oprávnění bylo odebráno.');}
        // The response may have been lost after commit: never silently retry a write.
        await refresh().catch(()=>{});
        throw Error('Uložení se nepotvrdilo. Ověřte aktuální plán před opakováním. '+error.message);
      }
      if(!snapshot || data.version>=snapshot.version){snapshot=data;onChange(data);}onStatus('Uloženo.');return true;
    }finally{if(generation===epoch){busy=false;if(dirty){dirty=false;refresh().catch(()=>{});}}}
  }
  return {session,refresh,commit,clear,get snapshot(){return snapshot;},get busy(){return busy;}};
}
