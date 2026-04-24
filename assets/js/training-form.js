/*
 * ADC Task Manager — training-form.js
 * Page-specific logic for training-form.html
 * Requires: auth.js loaded first
 * v2.0
 */

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
    setTimeout(function(){location.href='/training.html';},1500);
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



// ── MOBILE MORE SHEET ─────────────────────────────────────
function toggleMobileMore(){
  var sheet=document.getElementById('mobileMoreSheet');
  var isOpen=sheet&&sheet.style.transform==='translateY(0px)';
  isOpen?closeMobileMore():openMobileMore();
}
function openMobileMore(){
  var sheet=document.getElementById('mobileMoreSheet');
  var overlay=document.getElementById('mobileMoreOverlay');
  var btn=document.getElementById('btnMobileMore');
  if(!sheet)return;
  sheet.style.display='block';
  if(overlay)overlay.style.display='block';
  if(btn)btn.classList.add('active');
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){sheet.style.transform='translateY(0px)';});
  });
  var s=AUTH&&AUTH.getSession?AUTH.getSession():{};
  if(s&&s.full_name){
    var ini=s.full_name.split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
    var av=document.getElementById('moreAvatar');if(av)av.textContent=ini;
    var nm=document.getElementById('moreName');if(nm)nm.textContent=s.full_name;
    var rl=document.getElementById('moreRole');if(rl)rl.textContent=s.role||'';
    var dp=document.getElementById('moreDept');if(dp)dp.textContent=s.department||'KIB';
  }
}
function closeMobileMore(){
  var sheet=document.getElementById('mobileMoreSheet');
  var overlay=document.getElementById('mobileMoreOverlay');
  var btn=document.getElementById('btnMobileMore');
  if(sheet)sheet.style.transform='translateY(100%)';
  if(btn)btn.classList.remove('active');
  setTimeout(function(){
    if(sheet)sheet.style.display='none';
    if(overlay)overlay.style.display='none';
  },280);
}
