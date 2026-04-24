/* ADC Task Manager v2 — training-form.js */


// V2 init
document.addEventListener('DOMContentLoaded', function(){
  AUTH.need();
  var sess = AUTH.get();
  initSB();
  U.set('sbUname', sess.display_name||sess.full_name.split(' ')[0]);
  U.set('sbUrole', sess.role);
  U.set('sbAvTxt', U.ini(sess.full_name));
  API.get('users_list',{}).then(function(d){
    var users = d.users||[];
    populateMultiAgents(users);
    populateTrainers(users);
    populateSingleAgent(users);
    populateTeamTLs(users);
  }).catch(function(){});
});

function setTargetType(type){
  currentTargetType = type;
  ['individual','multiple','team','department'].forEach(function(t){
    document.getElementById('panel-'+t).style.display = t===type ? '' : 'none';
    document.getElementById('tab-'+t).classList.toggle('active', t===type);
  });
}

async function submitTraining(){
  var title    = document.getElementById('fTitle').value.trim();
  var cat      = document.getElementById('fCat').value;
  var deadline = document.getElementById('fDeadline').value;
  var desc     = document.getElementById('fDesc').value;
  var pri      = document.getElementById('fPri').value;

  if(!title){showMsg('Please enter a training title','error');return;}
  if(!cat){showMsg('Please select a category','error');return;}
  if(!deadline){showMsg('Please set a deadline','error');return;}
  if(!selectedTrainers.length){showMsg('Please select at least one trainer','error');return;}

  // Build target agents list
  var targetAgents = [];
  if(currentTargetType==='individual'){
    var sel=document.getElementById('fSingleAgent');
    if(!sel.value){showMsg('Please select an agent','error');return;}
    var u=allUsers.find(function(x){return x.user_id===sel.value;});
    if(u) targetAgents=[{user_id:u.user_id,name:u.full_name}];
  } else if(currentTargetType==='multiple'){
    if(!selectedAgents.length){showMsg('Please select at least one agent','error');return;}
    targetAgents=selectedAgents.map(function(a){return {user_id:a.user_id,name:a.name||a.full_name};});
  } else if(currentTargetType==='team'){
    var tlId=document.getElementById('fTeamTL').value;
    if(!tlId){showMsg('Please select a team leader','error');return;}
    var tl=allUsers.find(function(u){return u.user_id===tlId;});
    var tlName=(tl.full_name||tl.name||'').trim();
    var teamAgents = teamMap[tlName] || [];
    targetAgents = teamAgents.map(function(u){return {user_id:u.user_id,name:u.full_name||u.name};});
    if(!targetAgents.length){showMsg('No agents found for team leader: '+tlName,'error');return;}
  } else if(currentTargetType==='department'){
    targetAgents=allUsers.filter(function(u){return !['HoD','DGM','TL','CC Manager','Manager','QA Manager','Team Leader','DataEntry'].includes(u.role);}).map(function(u){return {user_id:u.user_id,name:u.full_name||u.name};});
  }

  var btn=document.querySelector('button.btn-primary');
  btn.disabled=true;btn.textContent='Creating...';

  try{
    var d = await API.post('training_create', {
      title:                  title,
      category:               cat,
      description:            desc,
      priority:               pri,
      deadline:               deadline,
      target_type:            currentTargetType,
      target_agents_json:     JSON.stringify(targetAgents),
      assigned_trainers_json: JSON.stringify(selectedTrainers),
      total_agents:           String(targetAgents.length)
    });
    showMsg('Training plan created! ID: '+d.training_id,'success');
    setTimeout(function(){location.href='./training.html';},1500);
  }catch(ex){
    showMsg('Error: '+ex.message,'error');
    btn.disabled=false;btn.textContent='Create Training Plan';
  }
}

function showMsg(msg,type){
  var el=document.getElementById('msg');
  el.textContent=msg;
  el.style.background=type==='success'?'#DCFCE7':'#FEE2E2';
  el.style.color=type==='success'?'#166534':'#991B1B';
  el.style.display='block';
}

// Set default deadline to 2 weeks from now
var d2w=new Date(Date.now()+14*86400000+3*3600000);
document.getElementById('fDeadline').value=d2w.toISOString().slice(0,10);
loadBell();

// ── MOBILE SCROLL MANAGEMENT ─────────────────────────────────
var _scrollY = 0;
function lockBodyScroll() {
  _scrollY = document.querySelector('.main-content') ? 
    document.querySelector('.main-content').scrollTop : window.scrollY;
  document.body.classList.add('modal-open');
}
function unlockBodyScroll() {
  document.body.classList.remove('modal-open');
  var mc = document.querySelector('.main-content');
  if (mc) mc.scrollTop = _scrollY;
}
// ── END MOBILE SCROLL ──────────────────────────────────────