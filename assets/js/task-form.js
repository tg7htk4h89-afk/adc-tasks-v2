/* ADC Task Manager v2 — task-form.js */


// V2 init
document.addEventListener('DOMContentLoaded', function(){
  AUTH.need();
  var sess = AUTH.get();
  initSB();
  U.set('sbUname', sess.display_name||sess.full_name.split(' ')[0]);
  U.set('sbUrole', sess.role);
  U.set('sbAvTxt', U.ini(sess.full_name));

  // Set min date/time
  var now = new Date();
  var dtEl = document.getElementById('taskDueDate');
  if(dtEl){ now.setHours(now.getHours()+1); dtEl.min=now.toISOString().slice(0,16); }

  // Load users
  API.get('users_list',{}).then(function(d){
    allUsers = d.users||[];
    renderAssigneeList('');
  }).catch(function(){});
});

function switchFTab(btn){
  var panels={'ftab-details':'fpanel-details','ftab-assignees':'fpanel-assignees','ftab-subtasks':'fpanel-subtasks','ftab-recurring':'fpanel-recurring'};
  Object.keys(panels).forEach(function(tid){
    var t=document.getElementById(tid),p=document.getElementById(panels[tid]);
    var active=tid===btn.dataset.tab;
    if(t){t.style.color=active?'#fff':'rgba(255,255,255,.45)';t.style.borderBottom=active?'2px solid #60A5FA':'2px solid transparent';t.style.fontWeight=active?'700':'500';}
    if(p)p.style.display=active?'':'none';
  });
}
function switchFTabById(id){switchFTab(document.getElementById(id));}

// ── STATE ─────────────────────────────────────────────────────────
var allUsers=[], selectedAssignees=[], subtasks=[], recurringType='';

// Set min date
document.getElementById('fDue').min = UTILS.today();

// ── LOAD USERS ────────────────────────────────────────────────────
setTimeout(function(){
  var list=document.getElementById('assigneeList');
  list.innerHTML='<div style="padding:20px;text-align:center;color:#94A3B8;font-size:13px"><div style="width:24px;height:24px;border:2px solid #E2E8F0;border-top-color:#1A4A7A;border-radius:50%;animation:formSpin .8s linear infinite;margin:0 auto 8px"></div>Loading staff...</div>';
  var sess=AUTH.getSession()||{};
  var myId=sess.user_id;
  API.get('users_list',{}).then(function(d){
    var all=(d.users||[]).filter(function(u){return u.active_status!=='inactive';});
    var assignable=(window.KIB_HIERARCHY&&myId)?KIB_HIERARCHY.getAssignableUserIds(myId):[];
    if(assignable.length>0){
      allUsers=all.filter(function(u){return assignable.indexOf(u.user_id)!==-1;}).sort(function(a,b){return a.full_name.localeCompare(b.full_name);});
    } else {
      allUsers=all.sort(function(a,b){return a.full_name.localeCompare(b.full_name);});
    }
    if(allUsers.length===0){
      list.innerHTML='<div style="padding:20px;text-align:center;color:#94A3B8;font-size:13px">No assignable staff found</div>';
    } else {
      renderAssigneeList('');
    }
  }).catch(function(e){
    list.innerHTML='<div style="padding:16px;text-align:center;color:#EF4444;font-size:13px">Could not load staff: '+e.message+'</div>';
  });
}, 500);

// ── ASSIGNEE LIST ─────────────────────────────────────────────────
function renderAssigneeList(query){
  var list=document.getElementById('assigneeList');
  if(!list)return;
  var q=(query||'').toLowerCase();
  var filtered=q?allUsers.filter(function(u){return(u.full_name||'').toLowerCase().includes(q)||(u.role||'').toLowerCase().includes(q)||(u.department||'').toLowerCase().includes(q);}):allUsers;
  if(filtered.length===0){list.innerHTML='<div style="padding:12px;color:#94A3B8;text-align:center;font-size:13px">No staff found</div>';return;}
  var html='';
  filtered.forEach(function(u){
    var sel=selectedAssignees.some(function(a){return a.user_id===u.user_id;});
    var ac=UTILS.avc(u.full_name);
    html+='<div data-uid="'+u.user_id+'" class="assignee-row" style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;cursor:pointer;background:'+(sel?'#EFF6FF':'#fff')+';border:1.5px solid '+(sel?'#BFDBFE':'#E4EAF3')+';transition:all .15s;box-shadow:'+(sel?'0 2px 8px rgba(59,130,246,.1)':'0 1px 3px rgba(6,15,36,.04)')+';margin-bottom:6px">';
    html+='<div style="width:36px;height:36px;border-radius:50%;background:'+ac[0]+';color:'+ac[1]+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0">'+UTILS.ini(u.full_name)+'</div>';
    html+='<div style="flex:1;min-width:0">';
    html+='<div style="font-size:13px;font-weight:700;color:#0A1628;line-height:1.3">'+UTILS.esc(u.full_name)+'</div>';
    html+='<div style="font-size:11px;color:#8A9BB0;margin-top:2px">'+UTILS.esc(u.role||'')+(u.team?' · '+UTILS.esc(u.team):'')+'</div>';
    html+='</div>';
    html+='<div style="width:24px;height:24px;border-radius:50%;border:2px solid '+(sel?'#3B82F6':'#D0D9E8')+';background:'+(sel?'#3B82F6':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s">';
    if(sel) html+='<svg width="11" height="11" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
    html+='</div>';
    html+='</div>';
  });
  list.innerHTML=html;
  // Attach click handlers using event delegation
  list.onclick=function(e){
    var row=e.target.closest('.assignee-row');
    if(!row)return;
    var uid=row.dataset.uid;
    var user=allUsers.find(function(u){return u.user_id===uid;});
    if(!user)return;
    var idx=selectedAssignees.findIndex(function(a){return a.user_id===uid;});
    if(idx>-1){selectedAssignees.splice(idx,1);}else{selectedAssignees.push({user_id:user.user_id,name:user.full_name,role:user.role,department:user.department||''});}
    renderAssigneeList(document.getElementById('assigneeSearch').value);
    renderSelectedPills();
  };
}

function filterAssigneeList(q){renderAssigneeList(q);}

function renderSelectedPills(){
  var wrap=document.getElementById('selectedAssignees');
  var count=document.getElementById('assigneeCount');
  var badge=document.getElementById('ftabAssigneeBadge');
  if(!wrap)return;
  if(selectedAssignees.length===0){
    wrap.innerHTML='<div style="color:#CBD5E1;font-size:13px;padding:4px">No assignees selected yet — pick from the list above</div>';
    if(count)count.textContent='0 assignees selected';
    if(badge){badge.style.display='none';}
    return;
  }
  wrap.innerHTML=selectedAssignees.map(function(a){
    var ac=UTILS.avc(a.name);
    return '<div class="sel-pill" data-uid="'+a.user_id+'" style="display:inline-flex;align-items:center;gap:6px;background:#EFF6FF;border:1.5px solid #BFDBFE;color:#1E40AF;border-radius:20px;padding:5px 12px 5px 6px;font-size:12px;font-weight:600;cursor:default">'
      +'<div style="width:22px;height:22px;border-radius:50%;background:'+ac[0]+';color:'+ac[1]+';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0">'+UTILS.ini(a.name)+'</div>'
      +UTILS.esc(a.name.split(' ')[0])
      +'<span class="remove-pill" style="cursor:pointer;opacity:.5;font-size:14px;line-height:1;margin-left:2px">×</span>'
      +'</div>';
  }).join('');
  if(count)count.textContent=selectedAssignees.length+' assignee'+(selectedAssignees.length!==1?'s':'')+' selected';
  if(badge){badge.textContent=selectedAssignees.length;badge.style.display='inline';}
  // event delegation for remove pills
  wrap.onclick=function(e){
    var btn=e.target.closest('.remove-pill');
    if(!btn)return;
    var pill=btn.closest('.sel-pill');
    if(!pill)return;
    var uid=pill.dataset.uid;
    selectedAssignees=selectedAssignees.filter(function(a){return a.user_id!==uid;});
    renderAssigneeList(document.getElementById('assigneeSearch').value);
    renderSelectedPills();
  };
}

// ── SUB-TASKS ─────────────────────────────────────────────────────
function addSubtask(){
  var inp=document.getElementById('subtaskInput');
  var val=(inp.value||'').trim();
  if(!val)return;
  subtasks.push({title:val});
  inp.value='';
  inp.focus();
  renderSubtasks();
}

function renderSubtasks(){
  var list=document.getElementById('subtaskList');
  var badge=document.getElementById('ftabSubBadge');
  if(!list)return;
  if(badge){badge.textContent=subtasks.length;badge.style.display=subtasks.length?'inline':'none';}
  if(subtasks.length===0){
    list.innerHTML='<div style="text-align:center;padding:20px;color:#CBD5E1;font-size:13px">No sub-tasks yet — add one below</div>';
    return;
  }
  var html='';
  subtasks.forEach(function(st,i){
    html+='<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px">';
    html+='<div style="width:22px;height:22px;border-radius:50%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#64748B;flex-shrink:0">'+(i+1)+'</div>';
    html+='<div style="flex:1;font-size:13px;font-weight:600;color:#0F172A">'+UTILS.esc(st.title)+'</div>';
    html+='<button class="rm-sub" data-idx="'+i+'" style="background:#FEF2F2;border:none;border-radius:6px;width:24px;height:24px;cursor:pointer;color:#EF4444;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1">×</button>';
    html+='</div>';
  });
  list.innerHTML=html;
  // event delegation - no inline onclicks needed
  list.onclick=function(e){
    var btn=e.target.closest('.rm-sub');
    if(!btn)return;
    var idx=parseInt(btn.dataset.idx);
    if(!isNaN(idx)){subtasks.splice(idx,1);renderSubtasks();}
  };
}

// ── RECURRING ─────────────────────────────────────────────────────
function toggleRecurring(on){
  document.getElementById('recurringPanel').style.display=on?'':'none';
  if(!on){recurringType='';document.querySelectorAll('.rec-btn').forEach(function(b){b.style.background='#fff';b.style.color='#64748B';b.style.borderColor='#E2E8F0';b.style.boxShadow='none';});}
}

function setRecurring(btn){
  recurringType=btn.dataset.r;
  document.querySelectorAll('.rec-btn').forEach(function(b){
    var active=b.dataset.r===recurringType;
    b.style.background=active?'linear-gradient(135deg,#1E3A6E,#1A4A7A)':'#fff';
    b.style.color=active?'#fff':'#64748B';
    b.style.borderColor=active?'#1A4A7A':'#E2E8F0';
    b.style.boxShadow=active?'0 2px 8px rgba(26,74,122,.3)':'none';
  });
  var labels={daily:'Every day',weekly:'Every week',monthly:'Every month'};
  var prev=document.getElementById('recurringPreview');
  prev.textContent='↺ '+(labels[recurringType]||'')+' — a new task will be created automatically';
  prev.style.display='';
}

// ── SUBMIT ────────────────────────────────────────────────────────
async function subT(){
  var title=document.getElementById('fTitle').value.trim();
  var cat=document.getElementById('fCat').value;
  var pri=document.getElementById('fPri').value;
  var due=document.getElementById('fDue').value;
  var sv=document.getElementById('fSV').value;
  var su=document.getElementById('fSU').value;

  if(!title){UTILS.toast('Please enter a task title','error');switchFTabById('ftab-details');return;}
  if(!cat){UTILS.toast('Please select a category','error');switchFTabById('ftab-details');return;}
  if(!pri){UTILS.toast('Please select a priority','error');switchFTabById('ftab-details');return;}
  if(!sv){UTILS.toast('Please enter an SLA value','error');switchFTabById('ftab-details');return;}
  if(selectedAssignees.length===0){UTILS.toast('Please select at least one assignee','error');switchFTabById('ftab-assignees');return;}
  if(document.getElementById('recurringToggle').checked&&!recurringType){UTILS.toast('Please select a recurring frequency','error');switchFTabById('ftab-recurring');return;}

  var btn=document.querySelector('[onclick="subT()"]');
  if(btn){btn.disabled=true;btn.textContent='Creating...';}
  try{
    var d=await API.post('tasks_create',{
      title:title,
      description:document.getElementById('fDesc').value,
      category:cat,
      priority:pri,
      due_date:due||'',
      sla_value:sv,
      sla_unit:su,
      assignees_json:JSON.stringify(selectedAssignees),
      subtasks_json:JSON.stringify(subtasks),
      recurring_flag:document.getElementById('recurringToggle').checked?'TRUE':'FALSE',
      recurring_type:recurringType||''
    });
    UTILS.toast('Task created: '+d.task_id,'success');
    setTimeout(function(){location.href='./tasks.html';},1200);
  }catch(ex){
    UTILS.toast('Error: '+ex.message,'error');
    if(btn){btn.disabled=false;btn.textContent='✓ Create Task';}
  }
}

// Initialize
renderSelectedPills();
renderSubtasks();
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