/* ADC Task Manager v2 — training-form.js */

var _allUsers = [];
var _selectedAgents = [];   // for multiple mode
var _selectedTrainers = [];
var _targetType = 'individual';

document.addEventListener('DOMContentLoaded', function(){
  AUTH.need();
  var s = AUTH.get();
  initSB();
  U.set('sbUname', s.display_name || s.full_name.split(' ')[0]);
  U.set('sbUrole', s.role);
  U.set('sbAvTxt', U.ini(s.full_name));

  // Min deadline = today
  var dl = U.el('fDeadline'); if(dl) dl.min = new Date().toISOString().slice(0,10);

  // Load users
  API.get('users_list', {}).then(function(d){
    _allUsers = d.users || [];
    populateSingleAgent(_allUsers);
    populateTeamTLs(_allUsers);
    populateDDItems('agentsDDItems', _allUsers, _selectedAgents, 'toggleAgent');
    populateDDItems('trainersDDItems', _allUsers, _selectedTrainers, 'toggleTrainer');
    updateDeptCount(_allUsers);
  }).catch(function(){
    U.toast('Could not load staff list', 'error');
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function(e){
    if(!e.target.closest('.dd-wrap')){
      document.querySelectorAll('.dd-list.open').forEach(function(d){ d.classList.remove('open'); });
      document.querySelectorAll('.pills-box.open').forEach(function(p){ p.classList.remove('open'); });
    }
  });
});

/* ── POPULATE ── */
function populateSingleAgent(users){
  var sel = U.el('fSingleAgent'); if(!sel) return;
  var agents = users.filter(function(u){ return u.role === 'Agent' || u.role === 'ATL'; });
  agents.sort(function(a,b){ return a.full_name.localeCompare(b.full_name); });
  sel.innerHTML = '<option value="">Select agent...</option>';
  agents.forEach(function(u){
    var o = document.createElement('option');
    o.value = u.user_id; o.textContent = u.full_name + ' (' + u.role + ')';
    sel.appendChild(o);
  });
}

function populateTeamTLs(users){
  var sel = U.el('fTeamTL'); if(!sel) return;
  var tls = users.filter(function(u){ return u.role === 'TL' || u.role === 'Team Leader' || u.role === 'ATL'; });
  tls.sort(function(a,b){ return a.full_name.localeCompare(b.full_name); });
  sel.innerHTML = '<option value="">Select team leader...</option>';
  tls.forEach(function(u){
    var o = document.createElement('option');
    o.value = u.user_id; o.textContent = u.full_name + ' (' + (u.team||u.role) + ')';
    sel.appendChild(o);
  });
}

function updateDeptCount(users){
  var agents = users.filter(function(u){ return u.role === 'Agent' || u.role === 'ATL'; });
  U.set('deptCount', agents.length + ' agents across all teams');
}

/* ── TARGET TYPE ── */
function setTarget(type){
  _targetType = type;
  ['individual','multiple','team','department'].forEach(function(t){
    var tab = U.el('ttab-'+t), pan = U.el('tpan-'+t);
    var on = t === type;
    if(tab) tab.className = 'target-tab' + (on ? ' on' : '');
    if(pan) pan.className = 'tpanel' + (on ? ' on' : '');
  });
}

function showTeamPreview(){
  var tlId = U.el('fTeamTL') ? U.el('fTeamTL').value : '';
  var preview = U.el('teamPreview');
  var list = U.el('teamPreviewList');
  if(!preview || !list) return;
  if(!tlId){ preview.style.display = 'none'; return; }
  // Show agents in same team as the TL
  var tl = _allUsers.find(function(u){ return u.user_id === tlId; });
  if(!tl){ preview.style.display = 'none'; return; }
  var teammates = _allUsers.filter(function(u){
    return (u.role === 'Agent' || u.role === 'ATL') && u.team === tl.team;
  });
  preview.style.display = 'block';
  list.innerHTML = teammates.map(function(u){
    return '<span style="display:inline-flex;align-items:center;gap:5px;background:var(--blt);border:1px solid rgba(24,119,197,.2);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--blue)">'+
      U.esc(u.full_name)+'</span>';
  }).join('') || '<span style="color:var(--t3);font-size:12px">No agents found in this team</span>';
}

/* ── DROPDOWN ── */
function toggleDD(id){
  var dd = U.el(id);
  var pb = dd ? dd.previousElementSibling : null;
  if(!dd) return;
  var open = dd.classList.toggle('open');
  if(pb) pb.classList.toggle('open', open);
}

function filterDD(searchId, listId){
  var q = (U.el(searchId) ? U.el(searchId).value : '').toLowerCase();
  var isAgents = listId === 'agentsDDItems';
  var sel = isAgents ? _selectedAgents : _selectedTrainers;
  populateDDItems(listId, _allUsers.filter(function(u){
    return !q || (u.full_name + ' ' + u.role).toLowerCase().indexOf(q) !== -1;
  }), sel, isAgents ? 'toggleAgent' : 'toggleTrainer');
}

function populateDDItems(containerId, users, selected, fn){
  var container = U.el(containerId); if(!container) return;
  container.innerHTML = users.map(function(u){
    var on = selected.some(function(s){ return s.user_id === u.user_id; });
    return '<div class="dd-opt'+(on?' on':'')+'" onclick="'+fn+'(\''+u.user_id+'\',\''+u.full_name.replace(/'/g,'\\x27')+'\',\''+u.role+'\')">'+
      '<div class="dd-chk">'+(on?'<svg width="10" height="10" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':'')+
      '</div>'+
      U.av(u.full_name, 28)+
      '<div><div style="font-size:13px;font-weight:500;color:var(--t1)">'+U.esc(u.full_name)+'</div>'+
      '<div style="font-size:11px;color:var(--t3)">'+U.esc(u.role)+'</div></div>'+
    '</div>';
  }).join('') || '<div style="padding:20px;text-align:center;color:var(--t3);font-size:13px">No results</div>';
}

function toggleAgent(uid, name, role){
  var idx = _selectedAgents.findIndex(function(s){ return s.user_id === uid; });
  if(idx > -1) _selectedAgents.splice(idx, 1);
  else _selectedAgents.push({user_id:uid, name:name, role:role});
  populateDDItems('agentsDDItems', _allUsers, _selectedAgents, 'toggleAgent');
  updatePills('agentsPills', 'agentsPh', _selectedAgents, 'toggleAgent', 'agentsCount', 'agents');
}

function toggleTrainer(uid, name, role){
  var idx = _selectedTrainers.findIndex(function(s){ return s.user_id === uid; });
  if(idx > -1) _selectedTrainers.splice(idx, 1);
  else _selectedTrainers.push({user_id:uid, name:name, role:role});
  populateDDItems('trainersDDItems', _allUsers, _selectedTrainers, 'toggleTrainer');
  updatePills('trainerPills', 'trainersPh', _selectedTrainers, 'toggleTrainer', 'trainersCount', 'trainers');
}

function updatePills(pillsId, phId, selected, toggleFn, countId, label){
  var box = U.el(pillsId), ph = U.el(phId), cnt = U.el(countId);
  if(!box) return;
  if(!selected.length){
    if(ph) ph.style.display = '';
    box.innerHTML = ''; if(ph){ box.appendChild(ph); }
    if(cnt) cnt.textContent = '0 ' + label + ' selected';
    return;
  }
  if(ph) ph.style.display = 'none';
  box.innerHTML = selected.map(function(s){
    return '<span class="dpill">'+U.esc(s.name)+
      '<button onclick="event.stopPropagation();'+toggleFn+'(\''+s.user_id+'\',\''+s.name.replace(/'/g,'\\x27')+'\',\''+s.role+'\')" >&#215;</button></span>';
  }).join('');
  if(cnt) cnt.textContent = selected.length + ' ' + label + ' selected';
}

/* ── MSG ── */
function showMsg(text, type){
  var m = U.el('msg'); if(!m) return;
  m.textContent = text;
  m.className = 'trf-msg ' + type;
}

/* ── SUBMIT ── */
async function submitTraining(){
  var title    = U.el('fTitle')    ? U.el('fTitle').value.trim()    : '';
  var cat      = U.el('fCat')      ? U.el('fCat').value             : '';
  var deadline = U.el('fDeadline') ? U.el('fDeadline').value        : '';
  var pri      = U.el('fPri')      ? U.el('fPri').value             : 'Medium';

  if(!title)    { showMsg('Please enter a training title', 'error'); return; }
  if(!cat)      { showMsg('Please select a category', 'error'); return; }
  if(!deadline) { showMsg('Please set a deadline', 'error'); return; }
  if(!_selectedTrainers.length){ showMsg('Please select at least one trainer', 'error'); return; }

  // Build target agents list
  var targetAgents = [];
  var targetType = _targetType;

  if(targetType === 'individual'){
    var sel = U.el('fSingleAgent');
    if(!sel || !sel.value){ showMsg('Please select an agent', 'error'); return; }
    var agent = _allUsers.find(function(u){ return u.user_id === sel.value; });
    if(agent) targetAgents = [agent];

  } else if(targetType === 'multiple'){
    if(!_selectedAgents.length){ showMsg('Please select at least one agent', 'error'); return; }
    targetAgents = _selectedAgents;

  } else if(targetType === 'team'){
    var tl = U.el('fTeamTL');
    if(!tl || !tl.value){ showMsg('Please select a team leader', 'error'); return; }
    var tlUser = _allUsers.find(function(u){ return u.user_id === tl.value; });
    if(tlUser){
      targetAgents = _allUsers.filter(function(u){
        return (u.role === 'Agent' || u.role === 'ATL') && u.team === tlUser.team;
      });
    }
    if(!targetAgents.length){ showMsg('No agents found in that team', 'error'); return; }

  } else if(targetType === 'department'){
    targetAgents = _allUsers.filter(function(u){ return u.role === 'Agent' || u.role === 'ATL'; });
  }

  try{
    await API.post('training_create', {
      title:          title,
      category:       cat,
      priority:       pri,
      deadline:       deadline,
      description:    U.el('fDesc') ? U.el('fDesc').value : '',
      target_type:    targetType,
      target_agents:  targetAgents,
      total_agents:   targetAgents.length,
      trainers:       _selectedTrainers
    });
    showMsg('Training plan created successfully!', 'success');
    setTimeout(function(){ location.href = './training.html'; }, 1200);
  }catch(ex){
    showMsg('Error: ' + ex.message, 'error');
  }
}
