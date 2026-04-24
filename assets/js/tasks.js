/* ADC Task Manager v2 — tasks.js */

var _sess, _tasks=[], _filter='all', _fails=0, _retry=null, _cur=null, _users=[], _sel=[];

var COLS=[
  {id:'New',      label:'New',        color:'#6366F1'},
  {id:'InProgress',label:'In Progress',color:'#1877C5'},
  {id:'Pending',  label:'Pending',     color:'#F4A523'},
  {id:'Overdue',  label:'Overdue',     color:'#E5383B'},
  {id:'Escalated',label:'Escalated',   color:'#7B61FF'},
  {id:'Completed',label:'Completed',   color:'#0EA472'}
];

var STATUS_GROUP={
  New:['New'],
  InProgress:['InProgress','Assigned','WaitingInput','UnderReview'],
  Pending:['Pending'],
  Overdue:['Overdue'],
  Escalated:['Escalated'],
  Completed:['Completed']
};

var BADGE_CLS={New:'b-new',InProgress:'b-inp',Assigned:'b-inp',Pending:'b-pend',Overdue:'b-over',Escalated:'b-esc',Completed:'b-done',Cancelled:'b-can'};

document.addEventListener('DOMContentLoaded', function(){
  AUTH.need();
  _sess = AUTH.get();
  initSB();
  U.set('sbUname', _sess.display_name||_sess.full_name.split(' ')[0]);
  U.set('sbUrole', _sess.role);
  U.set('sbAvTxt', U.ini(_sess.full_name));
  if(ROLES.canCreate(_sess.role)){
    var b=U.el('btnNew'); if(b) b.style.display='inline-flex';
  }
  load();
  setInterval(function(){ if(!document.hidden) load(true); }, 180000);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) load(true); });
  window.addEventListener('resize', function(){ if(_tasks.length) board(); });
});

/* ── LOAD ── */
async function load(bg){
  if(!bg) U.load('board', 'Loading tasks...');
  try{
    var p={};
    if(_filter==='mine')    p.assigned_to=_sess.user_id;
    if(_filter==='overdue') p.status='Overdue';
    var d = await API.get('tasks_list', p);
    _tasks = (d.tasks||[]).filter(function(t){return t&&t.task_id;});
    _fails = 0;
    if(_retry){ clearTimeout(_retry); _retry=null; }
    var eb=U.el('errBanner'); if(eb) eb.remove();
    hero(d); board();
  }catch(ex){
    _fails++;
    if(_tasks.length && bg){
      if(_fails>=2 && !U.el('errBanner')){
        var bn=document.createElement('div');
        bn.id='errBanner';
        bn.style.cssText='background:#FEF2F2;border:1px solid rgba(229,56,59,.2);border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;font-size:12px;color:#991B1B';
        bn.innerHTML='<span style="flex:1">&#9888; Connection issue — showing cached data</span><button onclick="retryNow()" style="background:none;border:1px solid rgba(229,56,59,.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;color:#991B1B;cursor:pointer">Retry</button>';
        var brd=U.el('board'); if(brd) brd.insertAdjacentElement('beforebegin',bn);
      }
    } else if(!_tasks.length){
      U.html('board','<div class="empty-wrap"><div class="empty-ico">&#128225;</div><div class="empty-t">Connection issue</div><div class="empty-s">'+U.esc(ex.message)+'</div><button class="btn btn-blue" style="margin-top:16px" onclick="load()">&#8635; Retry</button></div>');
    }
    var delays=[10000,30000,120000];
    _retry=setTimeout(function(){load(true);}, delays[Math.min(_fails-1,2)]);
  }
}
function retryNow(){ var b=U.el('errBanner'); if(b) b.remove(); load(); }

/* ── HERO ── */
function hero(d){
  var tasks=d.tasks||[];
  var open=tasks.filter(function(t){return t.status!=='Completed'&&t.status!=='Cancelled';}).length;
  var over=tasks.filter(function(t){return t.status==='Overdue';}).length;
  var done=tasks.filter(function(t){return t.status==='Completed';}).length;
  var pct=tasks.length?Math.round(done/tasks.length*100):0;
  U.set('hTotal',tasks.length); U.set('hOpen',open); U.set('hOver',over); U.set('hDone',done);
  U.set('hPct',pct+'%');
  var ring=U.el('hRing');
  if(ring){ var c=2*Math.PI*32; ring.style.strokeDashoffset=c-(pct/100)*c; ring.setAttribute('stroke-dasharray',c); }
}

/* ── BOARD ── */
function board(){
  var el=U.el('board'); if(!el) return;
  if(window.innerWidth<=768) mobileList(el);
  else                       kanban(el);
}

function kanban(el){
  el.className='kb-scroll';
  el.style='';
  if(!_tasks.length){
    el.innerHTML='<div class="kb-empty" style="width:260px">No tasks found</div>';
    return;
  }
  el.innerHTML = COLS.map(function(col){
    var items = _tasks.filter(function(t){
      if(col.id==='Overdue'){
        return t.status==='Overdue'||(t.is_overdue==='TRUE'||t.is_overdue===true)&&t.status!=='Completed';
      }
      return (STATUS_GROUP[col.id]||[col.id]).indexOf(t.status)!==-1;
    });
    return '<div class="kb-col">'+
      '<div class="kb-head" style="border-top-color:'+col.color+'">'+
        '<div class="kb-dot" style="background:'+col.color+'"></div>'+
        '<span class="kb-lbl">'+col.label+'</span>'+
        '<span class="kb-cnt">'+items.length+'</span>'+
      '</div>'+
      (items.length ? items.map(card).join('') : '<div class="kb-empty">No '+col.label.toLowerCase()+'</div>')+
      (ROLES.canCreate(_sess.role) ? '<button class="kb-plus" onclick="openNew()">+ Add</button>' : '')+
    '</div>';
  }).join('');
  el.addEventListener('click', cardClick);
}

function mobileList(el){
  el.className='';
  el.style='display:flex;flex-direction:column;gap:0';
  if(!_tasks.length){
    el.innerHTML='<div class="empty-wrap"><div class="empty-ico">&#128203;</div><div class="empty-t">No tasks</div><div class="empty-s">All clear!</div></div>';
    return;
  }
  var html='';
  COLS.forEach(function(col){
    var items=_tasks.filter(function(t){
      if(col.id==='Overdue') return t.status==='Overdue'||(t.is_overdue==='TRUE'||t.is_overdue===true)&&t.status!=='Completed';
      return (STATUS_GROUP[col.id]||[col.id]).indexOf(t.status)!==-1;
    });
    if(!items.length) return;
    html+='<div style="margin-bottom:20px">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
        '<div style="width:10px;height:10px;border-radius:50%;background:'+col.color+';flex-shrink:0"></div>'+
        '<span style="font-size:13px;font-weight:700;color:var(--t1)">'+col.label+'</span>'+
        '<span style="font-size:11px;font-weight:700;color:var(--t3);background:var(--bg);border:1px solid var(--bdr);border-radius:6px;padding:1px 8px">'+items.length+'</span>'+
      '</div>'+
      items.map(card).join('')+
    '</div>';
  });
  el.innerHTML = html || '<div class="empty-wrap"><div class="empty-t">No tasks</div></div>';
  el.addEventListener('click', cardClick);
}

function card(t){
  var pct=Math.min(100,t.progress_pct||0);
  var an=t.assigned_to_name&&t.assigned_to_name!=='undefined'?t.assigned_to_name:null;
  var due=U.due(t.due_datetime||t.due_date);
  // Overdue from DB flag
  if((t.is_overdue==='TRUE'||t.is_overdue===true)&&t.status!=='Completed') due={label:'Overdue',over:true};
  return '<button class="kb-card'+(t.status==='Overdue'?' ov':'')+'" data-id="'+t.task_id+'">'+
    '<div class="kb-id">'+U.esc(t.task_id)+'</div>'+
    '<div class="kb-ttl">'+U.esc(t.title)+'</div>'+
    (t.category?'<div class="kb-cat">'+U.esc(t.category)+'</div>':'')+
    '<div class="kb-bot">'+
      '<span class="kb-pri '+t.priority+'">'+U.esc(t.priority||'—')+'</span>'+
      (due.label!=='—'?'<span style="font-size:10px;color:var(--t3);margin-left:auto">'+U.esc(due.label)+'</span>':'')+
    '</div>'+
    (pct>0?'<div class="kb-bar" style="margin-top:8px"><div class="kb-fill" style="width:'+pct+'%"></div></div>':'')+
    (an?'<div style="display:flex;align-items:center;gap:6px;margin-top:8px">'+U.av(an,20)+'<span style="font-size:11px;color:var(--t3)">'+U.esc(an)+'</span></div>':'')+
  '</button>';
}

function cardClick(e){
  var c=e.target.closest('[data-id]'); if(c) openTask(c.dataset.id);
}

/* ── FILTER ── */
function setFilter(f,el){
  _filter=f;
  document.querySelectorAll('.pill').forEach(function(p){p.classList.remove('on');});
  if(el) el.classList.add('on');
  load();
}

/* ── TASK MODAL ── */
async function openTask(id){
  var modal=U.el('tModal'), sheet=U.el('tSheet'), head=U.el('tHead'), body=U.el('tBody');
  if(!modal) return;
  modal.style.display='flex';
  head.innerHTML='';
  body.innerHTML='<div class="loading"><div class="spin" style="margin-bottom:10px"></div><div>Loading...</div></div>';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    var mob=window.innerWidth<=768;
    sheet.style.transition='transform .3s cubic-bezier(.32,0,.15,1)'+(mob?'':',opacity .25s');
    sheet.style.transform=mob?'translateY(0)':'scale(1) translateY(0)';
    if(!mob) sheet.style.opacity='1';
  }); });
  try{
    var d=await API.get('tasks_detail',{task_id:id});
    _cur=d;
    renderHead(d.task);
    renderBody(d);
  }catch(ex){
    body.innerHTML='<div class="empty-wrap"><div class="empty-t">Error</div><div class="empty-s">'+U.esc(ex.message)+'</div></div>';
  }
}

function closeTask(){
  var modal=U.el('tModal'), sheet=U.el('tSheet'); if(!modal) return;
  var mob=window.innerWidth<=768;
  sheet.style.transition='transform .25s cubic-bezier(.32,0,.67,0)'+(mob?'':',opacity .2s');
  sheet.style.transform=mob?'translateY(100%)':'scale(.96) translateY(12px)';
  if(!mob) sheet.style.opacity='0';
  setTimeout(function(){ modal.style.display='none'; }, 260);
}

function renderHead(t){
  var head=U.el('tHead'); if(!head) return;
  var an=t.assigned_to_name&&t.assigned_to_name!=='undefined'?t.assigned_to_name:null;
  head.innerHTML=
    '<div style="background:linear-gradient(135deg,var(--navy) 0%,var(--blue) 100%);padding:20px 22px;position:relative;overflow:hidden">'+
      '<div style="position:absolute;top:-40px;right:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.05)"></div>'+
      '<div style="position:relative;z-index:1">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
          '<span class="badge '+(BADGE_CLS[t.status]||'b-can')+'">'+U.esc(t.status)+'</span>'+
          '<span class="badge" style="background:rgba(255,255,255,.15);color:#fff">'+U.esc(t.priority||'')+'</span>'+
          (t.delegated_flag?'<span class="badge" style="background:rgba(123,97,255,.3);color:#C4B5FD">Delegated</span>':'')+
        '</div>'+
        '<div style="font-size:18px;font-weight:800;color:#fff;line-height:1.3;margin-bottom:8px">'+U.esc(t.title)+'</div>'+
        '<div style="display:flex;align-items:center;gap:16px;font-size:11px;color:rgba(255,255,255,.5)">'+
          (t.category?'<span>'+U.esc(t.category)+'</span>':'')+
          (t.due_date?'<span>Due '+U.date(t.due_datetime||t.due_date)+'</span>':'')+
          '<span>SLA '+Math.round(t.sla_pct||0)+'%</span>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="tabs" id="tTabs">'+
      '<button class="tab on" onclick="switchTab(\'det\',this)">Details</button>'+
      '<button class="tab" onclick="switchTab(\'sub\',this)">Sub-tasks</button>'+
      '<button class="tab" onclick="switchTab(\'cmt\',this)">Comments</button>'+
      '<button class="tab" onclick="switchTab(\'ext\',this)">Extension</button>'+
      '<button class="tab" onclick="switchTab(\'act\',this)">Activity</button>'+
    '</div>';
}

function switchTab(id,el){
  document.querySelectorAll('#tTabs .tab').forEach(function(t){t.classList.remove('on');});
  document.querySelectorAll('#tBody .panel').forEach(function(p){p.classList.remove('on');});
  if(el) el.classList.add('on');
  var p=U.el('p-'+id); if(p) p.classList.add('on');
}

function renderBody(d){
  var body=U.el('tBody'); if(!body) return;
  var t=d.task;
  var sub=[];
  try{ sub=Array.isArray(t.subtasks_data)?t.subtasks_data:JSON.parse(t.subtasks_data||'[]'); }catch(e){}
  var cmt=[];
  try{ cmt=Array.isArray(t.comments_data)?t.comments_data:JSON.parse(t.comments_data||'[]'); }catch(e){}
  var act=[];
  // Normalize subtask fields from DB (subtask_id, title, is_done/status, assigned_to_name)
  sub=sub.map(function(s){ return {subtask_id:s.subtask_id||s.id,title:s.title,status:s.is_done||s.done||s.status==='Done'||s.status==='Completed'?'Done':'Pending',assigned_to_name:s.assigned_to_name||''}; });
  // Normalize comment fields from DB
  cmt=cmt.map(function(c){ return {comment_id:c.comment_id||c.id,author_name:c.author_name||c.by_name||'',body:c.body||c.text||c.content||'',created_at:c.created_at||''}; });
  var an=t.assigned_to_name&&t.assigned_to_name!=='undefined'?t.assigned_to_name:null;
  var pct=Math.min(100,t.progress_pct||0);

  body.innerHTML=
    // Details
    '<div id="p-det" class="panel on">'+
      (t.description?'<div style="font-size:13px;color:var(--t2);line-height:1.6;padding:14px;background:var(--card2);border:1px solid var(--bdr);border-radius:var(--r2);margin-bottom:14px">'+U.esc(t.description)+'</div>':'')+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'+
        '<div style="padding:12px;background:var(--card2);border:1px solid var(--bdr);border-radius:var(--r2)">'+
          '<div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">Assigned To</div>'+
          '<div style="display:flex;align-items:center;gap:8px">'+(an?U.av(an,28):'')+
          '<div><div style="font-size:13px;font-weight:700;color:var(--t1)">'+U.esc(an||'—')+'</div>'+
          (t.delegated_flag&&t.delegated_from_name?'<div style="font-size:11px;color:var(--t3)">from '+U.esc(t.delegated_from_name)+'</div>':'')+
          '</div></div>'+
        '</div>'+
        '<div style="padding:12px;background:var(--card2);border:1px solid var(--bdr);border-radius:var(--r2)">'+
          '<div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">Assigned By</div>'+
          '<div style="display:flex;align-items:center;gap:8px">'+U.av(t.assigned_by_name||'?',28)+
          '<div style="font-size:13px;font-weight:700;color:var(--t1)">'+U.esc(t.assigned_by_name||'—')+'</div></div>'+
        '</div>'+
      '</div>'+
      '<div style="margin-bottom:14px">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
          '<span style="font-size:12px;font-weight:600;color:var(--t2)">Progress</span>'+
          '<span style="font-size:13px;font-weight:800;color:var(--blue)" id="pctLbl">'+pct+'%</span>'+
        '</div>'+
        '<div class="pbar"><div class="pfill" style="width:'+pct+'%"></div></div>'+
      '</div>'+
      (ROLES.canCreate(_sess.role)?
        '<div style="margin-bottom:14px">'+
          '<label class="flbl">Update Progress</label>'+
          '<div style="display:flex;align-items:center;gap:10px">'+
            '<input type="range" min="0" max="100" value="'+pct+'" id="pSlider" style="flex:1;accent-color:var(--blue)" oninput="U.set(\'pctLbl\',this.value+\'%\')">'+
            '<span style="font-size:13px;font-weight:700;color:var(--blue);min-width:40px" id="pctLbl">'+pct+'%</span>'+
          '</div>'+
        '</div>':'')+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:14px;border-top:1px solid var(--bdr)">'+
        '<button class="btn btn-blue btn-sm" onclick="saveProgress()">Save Progress</button>'+
        (ROLES.canCreate(_sess.role)?'<button class="btn btn-ghost btn-sm" onclick="toggleDelegate()">Delegate</button>':'')+
      '</div>'+
      '<div id="delegateBox" style="display:none;margin-top:14px;padding:14px;background:var(--card2);border:1px solid var(--bdr);border-radius:var(--r2)">'+
        '<label class="flbl">Delegate to</label>'+
        '<select id="delSel" style="margin-bottom:10px"><option value="">Select person...</option></select>'+
        '<div style="display:flex;gap:8px">'+
          '<button class="btn btn-blue btn-sm" onclick="doDelegate()">Confirm</button>'+
          '<button class="btn btn-ghost btn-sm" onclick="toggleDelegate()">Cancel</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    // Sub-tasks
    '<div id="p-sub" class="panel">'+
      (sub.length?sub.map(function(s){
        var done=s.status==='Done'||s.status==='Completed';
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr)">'+
          '<div onclick="markSub(\''+s.subtask_id+'\','+!done+')" style="width:18px;height:18px;border-radius:5px;border:1.5px solid '+(done?'var(--green)':'var(--bdr2)')+';background:'+(done?'var(--green)':'transparent')+';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s">'+
            (done?'<svg width="10" height="10" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':'')+
          '</div>'+
          '<span style="font-size:13px;flex:1;color:var(--t1);'+(done?'text-decoration:line-through;color:var(--t3)':'')+'">'+U.esc(s.title)+'</span>'+
          (s.assigned_to_name?'<span style="font-size:11px;color:var(--t3)">'+U.esc(s.assigned_to_name)+'</span>':'')+
        '</div>';
      }).join(''):'<div class="empty-wrap"><div class="empty-t">No sub-tasks</div></div>')+
    '</div>'+
    // Comments
    '<div id="p-cmt" class="panel">'+
      cmt.map(function(c){
        return '<div style="display:flex;gap:10px;margin-bottom:14px">'+
          U.av(c.author_name,32)+
          '<div style="flex:1"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
            '<span style="font-size:12px;font-weight:700;color:var(--t1)">'+U.esc(c.author_name)+'</span>'+
            '<span style="font-size:11px;color:var(--t3)">'+U.date(c.created_at)+'</span>'+
          '</div>'+
          '<div style="font-size:13px;color:var(--t2);line-height:1.5;background:var(--card2);padding:10px 12px;border-radius:var(--r2);border:1px solid var(--bdr)">'+U.esc(c.body)+'</div></div>'+
        '</div>';
      }).join('')+
      '<div style="display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--bdr)">'+
        '<textarea id="cmtBox" placeholder="Add comment..." rows="2" style="flex:1;resize:none"></textarea>'+
        '<button class="btn btn-blue btn-sm" style="align-self:flex-end" onclick="addCmt()">Send</button>'+
      '</div>'+
    '</div>'+
    // Extension
    '<div id="p-ext" class="panel">'+
      '<div class="fgrp"><label class="flbl">Reason</label><textarea id="extReason" placeholder="Explain why..." rows="3"></textarea></div>'+
      '<div class="fgrp"><label class="flbl">New Due Date</label><input type="datetime-local" id="extDate"></div>'+
      '<button class="btn btn-blue btn-sm" onclick="reqExt()">Request Extension</button>'+
    '</div>'+
    // Activity
    '<div id="p-act" class="panel">'+
      (act.length?act.map(function(a){
        return '<div style="display:flex;gap:10px;margin-bottom:12px">'+
          '<div style="width:8px;height:8px;border-radius:50%;background:var(--blue);flex-shrink:0;margin-top:4px"></div>'+
          '<div><div style="font-size:12px;font-weight:600;color:var(--t1)">'+U.esc(a.actor_name)+'</div>'+
          '<div style="font-size:11px;color:var(--t2)">'+U.esc(a.action)+'</div>'+
          '<div style="font-size:10px;color:var(--t3);margin-top:2px">'+U.date(a.created_at)+'</div></div>'+
        '</div>';
      }).join(''):'<div class="empty-wrap"><div class="empty-t">No activity</div></div>')+
    '</div>';

  loadDel();
}

async function loadDel(){
  try{
    var d=await API.get('users_list',{});
    _users=d.users||[];
    var sel=U.el('delSel'); if(!sel) return;
    _users.forEach(function(u){
      var o=document.createElement('option');
      o.value=u.user_id; o.textContent=u.full_name+' ('+u.role+')';
      sel.appendChild(o);
    });
  }catch(e){}
}

function toggleDelegate(){ var b=U.el('delegateBox'); if(b) b.style.display=b.style.display==='none'?'block':'none'; }

async function doDelegate(){
  if(!_cur) return;
  var sel=U.el('delSel'); if(!sel||!sel.value) return;
  try{
    await API.post('task_delegate',{task_id:_cur.task.task_id,delegate_to_user_id:sel.value});
    U.toast('Delegated','success'); closeTask(); load();
  }catch(ex){ U.toast(ex.message,'error'); }
}

async function saveProgress(){
  if(!_cur) return;
  var sl=U.el('pSlider'); if(!sl) return;
  var pct=parseInt(sl.value);
  try{
    await API.post('tasks_update',{task_id:_cur.task.task_id,progress_pct:pct,status:pct===100?'Completed':_cur.task.status});
    U.toast('Saved','success'); closeTask(); load();
  }catch(ex){ U.toast(ex.message,'error'); }
}

async function markSub(id,done){
  try{
    await API.post('subtask_mark',{subtask_id:id,done:done});
    if(_cur) openTask(_cur.task.task_id);
  }catch(ex){ U.toast(ex.message,'error'); }
}

async function addCmt(){
  var box=U.el('cmtBox'); if(!box||!box.value.trim()||!_cur) return;
  try{
    await API.post('tasks_comment',{task_id:_cur.task.task_id,body:box.value.trim()});
    box.value=''; U.toast('Sent','success'); openTask(_cur.task.task_id);
  }catch(ex){ U.toast(ex.message,'error'); }
}

async function reqExt(){
  var reason=U.el('extReason'), date=U.el('extDate'); if(!_cur) return;
  if(!reason||!reason.value.trim()){ U.toast('Enter a reason','warn'); return; }
  try{
    await API.post('task_ext_request',{task_id:_cur.task.task_id,reason:reason.value.trim(),new_due:date?date.value:''});
    U.toast('Extension requested','success'); closeTask();
  }catch(ex){ U.toast(ex.message,'error'); }
}

/* ── NEW TASK MODAL ── */
function openNew(){
  var m=U.el('nModal'); if(!m) return;
  m.style.display='flex'; _sel=[];
  switchNTab('det', document.querySelector('#nTabs .tab'));
  loadNUsers();
}
function closeNew(){ var m=U.el('nModal'); if(m) m.style.display='none'; }

function switchNTab(id,el){
  document.querySelectorAll('#nTabs .tab').forEach(function(t){t.classList.remove('on');});
  document.querySelectorAll('.nb .panel').forEach(function(p){p.classList.remove('on');});
  if(el) el.classList.add('on');
  var p=U.el('np-'+id); if(p) p.classList.add('on');
}

async function loadNUsers(){
  if(_users.length){ renderAsgList(''); return; }
  try{
    var d=await API.get('users_list',{}); _users=d.users||[]; renderAsgList('');
  }catch(e){ _users=[]; }
}

function renderAsgList(q){
  var list=U.el('asgList'); if(!list) return;
  var users=_users.filter(function(u){
    if(!q) return true;
    return (u.full_name+' '+u.role).toLowerCase().includes(q.toLowerCase());
  });
  list.innerHTML=users.map(function(u){
    var sel=_sel.some(function(s){return s.user_id===u.user_id;});
    return '<div onclick="toggleSel(\''+u.user_id+'\',\''+u.full_name.replace(/'/g,"\\'")+'\''+',\''+u.role+'\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r2);cursor:pointer;border:1.5px solid '+(sel?'var(--blue)':'var(--bdr)')+';background:'+(sel?'var(--blt)':'var(--card)')+';margin-bottom:5px;transition:all .15s">'+
      U.av(u.full_name,34)+
      '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--t1)">'+U.esc(u.full_name)+'</div><div style="font-size:11px;color:var(--t3)">'+U.esc(u.role)+'</div></div>'+
      (sel?'<svg width="18" height="18" fill="none" stroke="var(--blue)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':'')+
    '</div>';
  }).join('');
  renderPills();
}

function toggleSel(uid, name, role){
  var idx=_sel.findIndex(function(s){return s.user_id===uid;});
  if(idx>-1) _sel.splice(idx,1); else _sel.push({user_id:uid,name:name,role:role});
  var q=U.el('asgQ'); renderAsgList(q?q.value:'');
}

function renderPills(){
  var el=U.el('selPills'); if(!el) return;
  el.innerHTML=_sel.map(function(s){
    return '<span style="display:inline-flex;align-items:center;gap:4px;background:var(--blt);border:1px solid rgba(24,119,197,.25);color:var(--blue);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;margin:0 4px 4px 0">'+
      U.esc(s.name)+'<span onclick="toggleSel(\''+s.user_id+'\',\''+s.name.replace(/'/g,"\\'")+'\',\''+s.role+'\')" style="cursor:pointer;opacity:.6;font-size:14px;margin-left:2px">x</span></span>';
  }).join('') || '<span style="color:var(--t3);font-size:12px">None selected</span>';
  U.set('selCnt',_sel.length);
}

async function submitTask(){
  var title=U.el('ntTitle'); if(!title||!title.value.trim()){ U.toast('Enter a title','warn'); return; }
  try{
    await API.post('tasks_create',{
      title:title.value.trim(),
      category:U.el('ntCat')?U.el('ntCat').value:'General',
      priority:U.el('ntPri')?U.el('ntPri').value:'Medium',
      due_date:U.el('ntDue')?U.el('ntDue').value||null:null,
      description:U.el('ntDesc')?U.el('ntDesc').value:'',
      assignees:_sel
    });
    U.toast('Task created','success'); closeNew(); _sel=[]; load();
  }catch(ex){ U.toast(ex.message,'error'); }
}
