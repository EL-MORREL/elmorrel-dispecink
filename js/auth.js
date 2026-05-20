async function register(){
  const email = loginEmail.value;
  const password = loginPassword.value;
  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });
  if(error){
    alert(error.message);
    return;
  }
  alert("Uživatel vytvořen");
}
async function login(){ 
  const email = loginEmail.value;
  const password = loginPassword.value;
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  if(error){
    alert(error.message);
    return;
  }
currentUser = data.user;
document.querySelector(".layout").style.display = "";
document.querySelector(".toolbar").style.display = "";
await checkEditor();
await loadDb();
startRealtime();
currentUserDiv();
}
async function logout(){
  await supabaseClient.auth.signOut();
  currentUser = null;
  realtimeSubscribed = false;
document.querySelector(".layout").style.display = "none";
document.querySelector(".toolbar").style.display = "none";
currentUserDiv();
setStatus("Nepřihlášen");
}
function currentUserDiv(){
  const el = document.getElementById("currentUserBox");
  const loginBox = document.getElementById("loginBox");
  const logoutBtn = document.getElementById("logoutBtn");
  if(currentUser){
    el.innerHTML = "Přihlášen: " + currentUser.email;
    loginBox.style.display = "none";
    logoutBtn.style.display = "";
  }else{
    el.innerHTML = "Nepřihlášen";
    loginBox.style.display = "";
    logoutBtn.style.display = "none";
  }
}
async function checkEditor(){
  if(!currentUser){
    canEdit = false;
    return;
  }
  const { data } = await supabaseClient
    .from("editors")
    .select("email")
    .eq("email", currentUser.email)
    .maybeSingle();
  canEdit = !!data;
}
supabaseClient.auth.getUser().then(async ({ data }) => {
  currentUser = data.user;
  currentUserDiv();
  if(currentUser){
    document.querySelector(".layout").style.display = "";
    document.querySelector(".toolbar").style.display = "";
    await checkEditor();
    await loadDb();
    startRealtime();
  }else{
    document.querySelector(".layout").style.display = "none";
    document.querySelector(".toolbar").style.display = "none";
    setStatus("Nepřihlášen");
  }
});
