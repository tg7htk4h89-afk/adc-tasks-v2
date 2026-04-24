/* ADC Task Manager v2 — training-form.js */

/* ── TEAM STRUCTURE ── */
var TEAMS = {
  'Shoug Al Kandri': [
    'Shoug Al Kandri','Naser Bandar','Fahad Alabdullah','Abdollah Shaverdi',
    'Mohammad Alshakhs','Omar Alsaeed','Abdullah Bakhsh','Ali ShahAli',
    'Asrar Alattar','Abdulaziz Bozobar'
  ],
  'Al Anoud Al Otiabi': [
    'Al Anoud Al Otiabi','Hasan Alajmi','Fouzeyah Erzouqi','Saad Alharbi',
    'Ezz Alsalem','Ali Alwayel','Hussain Alkhabbaz','Saleh Aljabri',
    'Omar Almutairi','Abdulrahman Abdullah'
  ],
  'Mohammed Al Othman': [
    'Mohammed Al Othman - Malothamn','Abdullah W Mohammad','Ayedh Alotaibi',
    'Omar Mohammad','Hasan Ali','Abdulwahab Alsaber','Danah Alenezi',
    'Salman Albaqshi','Abdulaziz Al Zaabi','Yasmine Maraafi'
  ],
  'Quality Assurance': [
    'Mohammed Abdulraheem','Fatma Alhamar','Badreyah BoRubayea'
  ],
  'Outbound': [
    'Latifah Alhouti'
  ],
  'ITM Team': [
    'Badreyah Alruwayeh','Sulaiman Alkhalaf','Ahmad Alenezi',
    'Dhari Al Shammari','Mariam Almutairi'
  ]
};

/* All agents flat list */
var ALL_AGENTS = [];
(function(){
  var seen = {};
  Object.keys(TEAMS).forEach(function(tl){
    TEAMS[tl].forEach(function(name){
      if(!seen[name]){ seen[name]=true; ALL_AGENTS.push({name:name,team:tl}); }
    });
  });
})();

/* ── STATE ── */
var _selectedAgents  = [];   // multiple mode
var _selectedTrainers= [];
var _targetType      = 'individual';

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function(){
  AUTH.need();
  var s = AUTH.get();
  initSB();
  U.set('sbUname', s.display_name||s.full_name.split(' ')[0]);
  U.set('sbUrole', s.role);
  U.set('sbAvTxt', U.ini(s.full_name));

  var dl=U.el('fDeadline'); if(dl) dl.min=new Date().toISOString().slice(0,10);

  /* Populate from hardcoded team data */
  populateSingleAgent();
  populateTeamTLs();
  populateMultipleAgents();
  U.set('deptCount', ALL_AGENTS.length + ' agents across all teams');

  /* Load users from n8n for trainer list */
  API.get('users_list',{}).then(function(d){
    _apiUsers = d.users||[];
    populateTrainers(_apiUsers);
  }).catch(function(){
    /* fallback: use ALL_AGENTS as trainers too */
    populateTrainers(ALL_AGENTS.map(function(a){ return {full_name:a.name,role:'Staff',user_id:a.name,team:a.team}; }));
    U.toast('Using offline trainer list','warn');
  });

  /* Close dropdowns on outside click */
  document.addEventListener('click', function(e){
    if(!e.target.closest('.dd-wrap')){
      document.querySelectorAll('.dd-list.open').forEach(function(d){ d.classList.remove('open'); });
      document.querySelectorAll('.pills-box.open').forEach(function(p){ p.classList.remove('open'); });
    }
  });
});

/* ── POPULATE FROM TEAM DATA ── */
function populateSingleAgent(){
  var sel=U.el('fSingleAgent'); if(!sel) return;
  sel.innerHTML='<option value="">Select agent...</option>';
  ALL_AGENTS.forEach(function(a){
    var o=document.createElement('option');
    o.value=a.name; o.textContent=a.name+' ('+a.team+')';
    sel.appendChild(o);
  });
}

function populateTeamTLs(){
  var sel=U.el('fTeamTL'); if(!sel) return;
  sel.innerHTML='<option value="">Select team...</option>';
  Object.keys(TEAMS).forEach(function(tl){
    var o=document.createElement('option');
    o.value=tl; o.textContent=tl+' ('+TEAMS[tl].length+' members)';
    sel.appendChild(o);
  });
}

function showTeamPreview(){
  var sel=U.el('fTeamTL'), preview=U.el('teamPreview'), list=U.el('teamPreviewList');
  if(!sel||!preview||!list) return;
  var tl=sel.value;
  if(!tl){ preview.style.display='none'; return; }
  var members=TEAMS[tl]||[];
  preview.style.display='block';
  list.innerHTML=members.map(function(name){
    return '<span style="display:inline-flex;align-items:center;gap:5px;background:var(--blt);border:1px solid rgba(24,119,197,.2);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--blue)">'+U.esc(name)+'</span>';
  }).join(' ');
  // Also show count
  var cnt=U.el('teamMemberCount');
  if(cnt) cnt.textContent=members.length+' members';
}

function populateMultipleAgents(){
  populateDDItems('agentsDDItems', ALL_AGENTS.map(function(a){
    return {user_id:a.name, full_name:a.name, role:a.team};
  }), _selectedAgents, 'toggleAgent');
}

function populateTrainers(){
  var list = ALL_AGENTS.map(function(a){
    return {user_id:a.name, full_name:a.name, role:a.team};
  });
  populateDDItems('trainersDDItems', list, _selectedTrainers, 'toggleTrainer');
}

/* ── TARGET TYPE ── */
function setTarget(type){
  _targetType=type;
  ['individual','multiple','team','department'].forEach(function(t){
    var tab=U.el('ttab-'+t), pan=U.el('tpan-'+t), on=t===type;
    if(tab) tab.className='target-tab'+(on?' on':'');
    if(pan) pan.className='tpanel'+(on?' on':'');
  });
}

/* ── DROPDOWN ── */
function toggleDD(id){
  var dd=U.el(id); if(!dd) return;
  var pb=dd.previousElementSibling;
  var open=dd.classList.toggle('open');
  if(pb) pb.classList.toggle('open',open);
}

function filterDD(searchId, listId){
  var q=(U.el(searchId)?U.el(searchId).value:'').toLowerCase();
  var isAgents=listId==='agentsDDItems';
  var sel=isAgents?_selectedAgents:_selectedTrainers;
  var fn=isAgents?'toggleAgent':'toggleTrainer';

  if(isAgents){
    var filtered=ALL_AGENTS.filter(function(a){
      return !q||(a.name+' '+a.team).toLowerCase().indexOf(q)!==-1;
    }).map(function(a){ return {user_id:a.name,full_name:a.name,role:a.team}; });
    populateDDItems(listId, filtered, sel, fn);
  } else {
    var filtered2=ALL_AGENTS.filter(function(a){
      return !q||(a.name+' '+a.team).toLowerCase().indexOf(q)!==-1;
    }).map(function(a){ return {user_id:a.name,full_name:a.name,role:a.team}; });
    populateDDItems(listId, filtered2, sel, fn);
  }
}

function populateDDItems(containerId, users, selected, fn){
  var container=U.el(containerId); if(!container) return;
  if(!users.length){
    container.innerHTML='<div style="padding:20px;text-align:center;color:var(--t3);font-size:13px">No results</div>';
    return;
  }
  container.innerHTML=users.map(function(u){
    var on=selected.some(function(s){ return s.user_id===u.user_id; });
    return '<div class="dd-opt'+(on?' on':'')+'" onclick="'+fn+'(\''+u.user_id.replace(/'/g,'\\x27')+'\',\''+u.full_name.replace(/'/g,'\\x27')+'\',\''+u.role.replace(/'/g,'\\x27')+'\')">'+
      '<div class="dd-chk">'+(on?'<svg width="10" height="10" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':'')+
      '</div>'+
      U.av(u.full_name,28)+
      '<div><div style="font-size:13px;font-weight:500;color:var(--t1)">'+U.esc(u.full_name)+'</div>'+
      '<div style="font-size:11px;color:var(--t3)">'+U.esc(u.role)+'</div></div>'+
    '</div>';
  }).join('');
}

function toggleAgent(uid, name, role){
  var idx=_selectedAgents.findIndex(function(s){ return s.user_id===uid; });
  if(idx>-1) _selectedAgents.splice(idx,1);
  else _selectedAgents.push({user_id:uid,name:name,role:role});
  populateDDItems('agentsDDItems', ALL_AGENTS.map(function(a){ return {user_id:a.name,full_name:a.name,role:a.team}; }), _selectedAgents, 'toggleAgent');
  updatePills('agentsPills','agentsPh',_selectedAgents,'toggleAgent','agentsCount','agents');
}

function toggleTrainer(uid, name, role){
  var idx=_selectedTrainers.findIndex(function(s){ return s.user_id===uid; });
  if(idx>-1) _selectedTrainers.splice(idx,1);
  else _selectedTrainers.push({user_id:uid,name:name,role:role});
  var trainerList = ALL_AGENTS.map(function(a){ return {user_id:a.name,full_name:a.name,role:a.team}; });
  populateDDItems('trainersDDItems', trainerList, _selectedTrainers, 'toggleTrainer');
  updatePills('trainerPills','trainersPh',_selectedTrainers,'toggleTrainer','trainersCount','trainers');
}

function updatePills(pillsId, phId, selected, fn, countId, label){
  var box=U.el(pillsId), ph=U.el(phId), cnt=U.el(countId);
  if(!box) return;
  if(!selected.length){
    if(ph) ph.style.display='';
    box.innerHTML=''; if(ph) box.appendChild(ph);
    if(cnt) cnt.textContent='0 '+label+' selected';
    return;
  }
  if(ph) ph.style.display='none';
  box.innerHTML=selected.map(function(s){
    return '<span class="dpill">'+U.esc(s.name||s.full_name||s.user_id)+
      '<button onclick="event.stopPropagation();'+fn+'(\''+s.user_id.replace(/'/g,'\\x27')+'\',\''+( s.name||s.user_id).replace(/'/g,'\\x27')+'\',\''+(s.role||'').replace(/'/g,'\\x27')+'\')" >&#215;</button></span>';
  }).join('');
  if(cnt) cnt.textContent=selected.length+' '+label+' selected';
}

/* ── MSG ── */
function showMsg(text, type){
  var m=U.el('msg'); if(!m) return;
  m.textContent=text;
  m.className='trf-msg '+type;
  m.style.display='block';
  m.scrollIntoView({behavior:'smooth',block:'center'});
  if(type==='error') U.toast(text,'error');
}
function clearMsg(){
  var m=U.el('msg'); if(m){ m.className='trf-msg'; m.style.display='none'; }
}

/* ── SUBMIT ── */
async function submitTraining(){
  clearMsg();
  var title    = U.el('fTitle')    ? U.el('fTitle').value.trim()    : '';
  var cat      = U.el('fCat')      ? U.el('fCat').value             : '';
  var deadline = U.el('fDeadline') ? U.el('fDeadline').value        : '';
  var pri      = U.el('fPri')      ? U.el('fPri').value             : 'Medium';

  if(!title)    { showMsg('Please enter a training title',   'error'); return; }
  if(!cat)      { showMsg('Please select a category',        'error'); return; }
  if(!deadline) { showMsg('Please set a deadline',           'error'); return; }
  if(!_selectedTrainers.length){ showMsg('Please select at least one trainer','error'); return; }

  /* Build target agents */
  var targetAgents=[], targetType=_targetType;

  if(targetType==='individual'){
    var sel=U.el('fSingleAgent');
    if(!sel||!sel.value){ showMsg('Please select an agent','error'); return; }
    targetAgents=[{name:sel.value,team:''}];

  } else if(targetType==='multiple'){
    if(!_selectedAgents.length){ showMsg('Please select at least one agent','error'); return; }
    targetAgents=_selectedAgents.map(function(a){ return {name:a.name||a.user_id,team:a.role||''}; });

  } else if(targetType==='team'){
    var tlSel=U.el('fTeamTL');
    if(!tlSel||!tlSel.value){ showMsg('Please select a team','error'); return; }
    var members=TEAMS[tlSel.value]||[];
    if(!members.length){ showMsg('No members found for this team','error'); return; }
    targetAgents=members.map(function(name){ return {name:name,team:tlSel.value}; });
    targetType='team';

  } else if(targetType==='department'){
    targetAgents=ALL_AGENTS.map(function(a){ return {name:a.name,team:a.team}; });
  }

  try{
    await API.post('training_create',{
      title:                  title,
      category:               cat,
      priority:               pri,
      deadline:               deadline,
      description:            U.el('fDesc') ? U.el('fDesc').value : '',
      target_type:            targetType,
      target_agents_json:     JSON.stringify(targetAgents),
      assigned_trainers_json: JSON.stringify(_selectedTrainers),
      total_agents:           targetAgents.length
    });
    showMsg('Training plan created successfully! Redirecting...','success');
    setTimeout(function(){ location.href='./training.html'; },1500);
  }catch(ex){
    showMsg('Error: '+ex.message,'error');
  }
}
