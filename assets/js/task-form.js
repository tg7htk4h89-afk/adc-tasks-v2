/* ADC Task Manager v2 — task-form.js */

var _users=[], _assignees=[], _subtasks=[], _recType='';

document.addEventListener('DOMContentLoaded', function(){
  AUTH.need();
  var s=AUTH.get();
  initSB();
  U.set('sbUname', s.display_name||s.full_name.split(' ')[0]);
  U.set('sbUrole', s.role);
  U.set('sbAvTxt', U.ini(s.full_name));

  var due=U.el('fDue'); if(due) due.min=new Date().toISOString().slice(0,10);

  API.get('users_list',{}).then(function(d){
    _users=d.users||[];
    renderAsgList('');
  }).catch(function(){
    U.html('asgList','<div style="padding:20px;text-align:center;color:var(--t3)">Could not load staff list</div>');
  });

  renderSubList();
});

/* TABS */
var TABS=['det','asg','sub','rec'];
function goTab(id){
  TABS.forEach(function(t){
    var tab=U.el('tab-'+t), pan=U.el('pan-'+t), on=t===id;
    if(tab) tab.className='tf-tab'+(on?' on':'');
    if(pan) pan.className='tf-panel'+(on?' on':'');
  });
}

/* ASSIGNEES */
function filterAsg(q){ renderAsgList(q||''); }
function renderAsgList(q){
  var list=U.el('asgList'); if(!list) return;
  var users=_users.filter(function(u){
    if(!q) return true;
    return (u.full_name+' '+u.role).toLowerCase().indexOf(q.toLowerCase())!==-1;
  });
  if(!users.length){ list.innerHTML='<div style="padding:20px;text-align:center;color:var(--t3);font-size:13px">No matches</div>'; return; }
  list.innerHTML=users.map(function(u){
    var sel=_assignees.some(function(a){return a.user_id===u.user_id;});
    return '<div class="asg-item'+(sel?' on':'')+'" onclick="toggleAsg(\''+u.user_id+'\',\''+u.full_name.replace(/'/g,'\\x27')+'\',\''+u.role+'\')">'+
      U.av(u.full_name,36)+
      '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--t1)">'+U.esc(u.full_name)+'</div>'+
      '<div style="font-size:11px;color:var(--t3)">'+U.esc(u.role)+(u.team?' · '+U.esc(u.team):'')+'</div></div>'+
      '<div class="asg-chk">'+(sel?'<svg width="11" height="11" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':'')+
      '</div></div>';
  }).join('');
}
function toggleAsg(uid,name,role){
  var idx=_assignees.findIndex(function(a){return a.user_id===uid;});
  if(idx>-1) _assignees.splice(idx,1);
  else _assignees.push({user_id:uid,name:name,role:role});
  var q=U.el('asgQ'); renderAsgList(q?q.value:'');
  renderAsgPills();
}
function renderAsgPills(){
  var cnt=_assignees.length;
  var badge=U.el('bAsg');
  if(badge){badge.textContent=cnt;badge.className='tf-badge'+(cnt?' v':'');}
  U.set('asgCnt',cnt+(cnt===1?' assignee':' assignees'));
  var pills=U.el('asgPills'); if(!pills) return;
  if(!cnt){pills.innerHTML='<span style="color:var(--t4);font-size:12px">None selected</span>';return;}
  pills.innerHTML=_assignees.map(function(a){
    return '<span class="sel-pill">'+U.esc(a.name)+
      '<button onclick="toggleAsg(\''+a.user_id+'\',\''+a.name.replace(/'/g,'\\x27')+'\',\''+a.role+'\')" style="background:none;border:none;color:inherit;cursor:pointer;font-size:14px;opacity:.6;padding:0;line-height:1;margin-left:2px">&#215;</button></span>';
  }).join('');
}

/* SUB-TASKS */
function addSub(){
  var inp=U.el('subInp'); if(!inp||!inp.value.trim()) return;
  _subtasks.push(inp.value.trim()); inp.value=''; renderSubList();
}
function removeSub(i){ _subtasks.splice(i,1); renderSubList(); }
function renderSubList(){
  var cnt=_subtasks.length;
  var badge=U.el('bSub');
  if(badge){badge.textContent=cnt;badge.className='tf-badge'+(cnt?' v':'');}
  var list=U.el('subList'); if(!list) return;
  if(!cnt){
    list.innerHTML='<div style="padding:16px;text-align:center;color:var(--t3);font-size:13px;background:var(--bg);border-radius:var(--r2)">No sub-tasks yet — add one below</div>';
    return;
  }
  list.innerHTML=_subtasks.map(function(s,i){
    return '<div class="sub-item">'+
      '<div style="width:8px;height:8px;border-radius:50%;background:var(--blue);flex-shrink:0"></div>'+
      '<span style="flex:1;font-size:13px;color:var(--t1)">'+U.esc(s)+'</span>'+
      '<button onclick="removeSub('+i+')" style="background:none;border:none;color:var(--t4);cursor:pointer;font-size:18px;line-height:1;padding:0">&#215;</button>'+
    '</div>';
  }).join('');
}

/* RECURRING */
function toggleRec(on){
  var panel=U.el('recPanel'); if(panel) panel.style.display=on?'block':'none';
  if(!on){_recType='';document.querySelectorAll('.rec-btn').forEach(function(b){b.classList.remove('on');});updateRecPreview();}
}
function setRec(btn){
  _recType=btn.dataset.r;
  document.querySelectorAll('.rec-btn').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on'); updateRecPreview();
}
function updateRecPreview(){
  var p=U.el('recPreview'); if(!p) return;
  if(!_recType){p.style.display='none';return;}
  var m={daily:'A new copy will be created every day.',weekly:'A new copy will be created every week.',monthly:'A new copy will be created every month.'};
  p.innerHTML='&#128200; '+(m[_recType]||'');
  p.style.display='block';
}

/* SUBMIT */
async function submitTask(){
  var title=(U.el('fTitle')?U.el('fTitle').value.trim():'');
  var cat  =(U.el('fCat')  ?U.el('fCat').value:'');
  var pri  =(U.el('fPri')  ?U.el('fPri').value:'');
  var sv   =(U.el('fSV')   ?U.el('fSV').value:'');

  if(!title){U.toast('Please enter a task title','error');goTab('det');return;}
  if(!cat)  {U.toast('Please select a category','error');goTab('det');return;}
  if(!pri)  {U.toast('Please select a priority','error');goTab('det');return;}
  if(!sv)   {U.toast('Please enter an SLA value','error');goTab('det');return;}
  if(!_assignees.length){U.toast('Please select at least one assignee','error');goTab('asg');return;}

  var recOn=U.el('recToggle')&&U.el('recToggle').checked;
  if(recOn&&!_recType){U.toast('Please select a recurring frequency','error');goTab('rec');return;}

  var btn=U.el('submitBtn');
  if(btn){btn.disabled=true;btn.textContent='Creating...';}

  try{
    await API.post('tasks_create',{
      title:          title,
      description:    U.el('fDesc')?U.el('fDesc').value:'',
      category:       cat,
      priority:       pri,
      due_date:       U.el('fDue')?U.el('fDue').value||'':'',
      sla_value:      sv,
      sla_unit:       U.el('fSU')?U.el('fSU').value:'hours',
      assignees:      _assignees,
      subtasks:       _subtasks,
      recurring_flag: recOn?'TRUE':'FALSE',
      recurring_type: _recType||''
    });
    U.toast('Task created!','success');
    setTimeout(function(){location.href='./tasks.html';},1200);
  }catch(ex){
    U.toast('Error: '+ex.message,'error');
    if(btn){btn.disabled=false;btn.textContent='✓ Create Task';}
  }
}
