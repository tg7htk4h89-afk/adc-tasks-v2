/* todo.js */
var _todos=[], _tf='all', _ts;
document.addEventListener('DOMContentLoaded',function(){
  AUTH.need(); _ts=AUTH.get(); initSB();
  U.set('sbUname',_ts.display_name||_ts.full_name.split(' ')[0]);
  U.set('sbUrole',_ts.role); U.set('sbAvTxt',U.ini(_ts.full_name));
  loadT();
});
async function loadT(){
  U.load('tdList','Loading...');
  try{
    var d=await API.get('ptodo_list',{});
    _todos=(d.todos||[]).filter(function(t){return t&&t.todo_id;});
    render();
  }catch(ex){
    U.html('tdList','<div class="empty-wrap"><div class="empty-ico">&#9888;&#65039;</div><div class="empty-t">Could not load</div><div class="empty-s">'+U.esc(ex.message)+'</div><button class="btn btn-blue" style="margin-top:12px" onclick="loadT()">Retry</button></div>');
  }
}
function today(){ return new Date().toISOString().slice(0,10); }
function nd(d){ return d?String(d).slice(0,10):null; }
function render(){ updHero(); updFilters(); renderList(); }
function updHero(){
  var td=today(),p=_todos.filter(function(t){return t.status!=='Done'&&t.status!=='Completed';}),
      dn=_todos.filter(function(t){return t.status==='Done'||t.status==='Completed';}),
      ov=p.filter(function(t){var n=nd(t.due_date);return n&&n<td;}),
      du=p.filter(function(t){return nd(t.due_date)===td;});
  U.set('hPend',p.length); U.set('hDone',dn.length); U.set('hOver',ov.length); U.set('hDue',du.length);
  var pct=_todos.length?Math.round(dn.length/_todos.length*100):0;
  U.set('hPct',pct+'%');
  var r=U.el('hRing');
  if(r){var c=2*Math.PI*32;r.style.strokeDashoffset=c-(pct/100)*c;r.setAttribute('stroke-dasharray',c);}
}
function updFilters(){
  var td=today(),p=_todos.filter(function(t){return t.status!=='Done'&&t.status!=='Completed';}),
      dn=_todos.filter(function(t){return t.status==='Done'||t.status==='Completed';}),
      ov=p.filter(function(t){var n=nd(t.due_date);return n&&n<td;}),
      du=p.filter(function(t){return nd(t.due_date)===td;});
  U.set('cAll',_todos.length);U.set('cPend',p.length);U.set('cOver',ov.length);U.set('cDue',du.length);U.set('cDone',dn.length);
}
function setTF(f,el){
  _tf=f;
  document.querySelectorAll('.td-pill').forEach(function(p){p.classList.remove('on');});
  if(el)el.classList.add('on');
  renderList();
}
function renderList(){
  var td=today(),items;
  if(_tf==='pending') items=_todos.filter(function(t){return t.status!=='Done'&&t.status!=='Completed';});
  else if(_tf==='done') items=_todos.filter(function(t){return t.status==='Done'||t.status==='Completed';});
  else if(_tf==='overdue') items=_todos.filter(function(t){var n=nd(t.due_date);return t.status!=='Done'&&t.status!=='Completed'&&n&&n<td;});
  else if(_tf==='today') items=_todos.filter(function(t){return t.status!=='Done'&&t.status!=='Completed'&&nd(t.due_date)===td;});
  else items=_todos.slice();
  var list=U.el('tdList');if(!list)return;
  if(!items.length){
    var m={all:'No to-do items',pending:'All clear!',done:'Nothing done yet',overdue:'No overdue tasks',today:'Nothing due today'};
    list.innerHTML='<div class="empty-wrap"><div class="empty-t">'+m[_tf]+'</div></div>';
    return;
  }
  if(_tf==='all'||_tf==='pending'){
    var groups=[
      {l:'Overdue',   i:items.filter(function(t){var n=nd(t.due_date);return t.status!=='Done'&&t.status!=='Completed'&&n&&n<td;})},
      {l:'Due Today', i:items.filter(function(t){return t.status!=='Done'&&t.status!=='Completed'&&nd(t.due_date)===td;})},
      {l:'Upcoming',  i:items.filter(function(t){var n=nd(t.due_date);return t.status!=='Done'&&t.status!=='Completed'&&(!n||n>td);})},
      {l:'Done',      i:items.filter(function(t){return t.status==='Done'||t.status==='Completed';})}
    ].filter(function(g){return g.i.length;});
    list.innerHTML=groups.map(function(g){return grp(g.l,g.i,td);}).join('');
  }else{
    list.innerHTML=grp('',items,td);
  }
  list.addEventListener('click',tdClick);
}
function grp(l,items,td){
  return (l?'<div style="display:flex;align-items:center;gap:8px;padding:6px 0;margin-bottom:6px;margin-top:10px"><span style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.7px">'+l+'</span><span style="font-size:10px;font-weight:700;color:var(--t3);background:var(--bg);border:1px solid var(--bdr);border-radius:10px;padding:1px 8px">'+items.length+'</span></div>':'')+
    items.map(function(t){return tdRow(t,td);}).join('');
}
function tdRow(t,td){
  var n=nd(t.due_date),done=t.status==='Done'||t.status==='Completed';
  var dStyle='',dIcon='',dLbl='';
  if(n){
    if(n<td){dStyle='color:#991B1B;background:var(--rdim)';dIcon='&#9888;&#65039;';dLbl=n;}
    else if(n===td){dStyle='color:#92400E;background:var(--adim)';dIcon='&#9200;';dLbl='Today';}
    else{dStyle='color:var(--t3);background:var(--bg)';dIcon='&#128197;';dLbl=n;}
  }
  return '<div style="background:var(--card);border:1px solid var(--bdr);border-radius:var(--r2);padding:11px 13px;margin-bottom:6px;display:flex;align-items:flex-start;gap:10px;box-shadow:var(--s1)">'+
    '<div data-a="toggle" data-id="'+t.todo_id+'" style="width:18px;height:18px;border-radius:5px;border:1.5px solid '+(done?'var(--green)':'var(--bdr2)')+';background:'+(done?'var(--green)':'transparent')+';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;margin-top:1px;transition:all .15s">'+
      (done?'<svg width="10" height="10" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':'')+
    '</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-size:13px;font-weight:600;color:var(--t1);'+(done?'text-decoration:line-through;color:var(--t3)':'')+'">'+U.esc(t.title)+'</div>'+
      (t.note?'<div style="font-size:11px;color:var(--t3);margin-top:2px">'+U.esc(t.note)+'</div>':'')+
      (n?'<div style="margin-top:4px"><span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;'+dStyle+'">'+dIcon+' '+dLbl+'</span></div>':'')+
    '</div>'+
    '<div style="display:flex;gap:4px;flex-shrink:0">'+
      '<button data-a="edit" data-id="'+t.todo_id+'" style="width:28px;height:28px;border:1px solid var(--bdr);border-radius:var(--r1);background:var(--card);color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s">'+
        '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'+
      '</button>'+
      '<button data-a="del" data-id="'+t.todo_id+'" style="width:28px;height:28px;border:1px solid var(--bdr);border-radius:var(--r1);background:var(--card);color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s">'+
        '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>'+
      '</button>'+
    '</div>'+
  '</div>';
}
function tdClick(e){
  var b=e.target.closest('[data-a]');if(!b)return;
  var id=b.dataset.id,a=b.dataset.a;
  if(a==='toggle')toggleDone(id);
  if(a==='edit')editItem(id);
  if(a==='del')delItem(id);
}

/* ADD */
var _noteOn=false;
document.addEventListener('click',function(e){var c=U.el('addCard');if(c&&!c.contains(e.target))c.classList.remove('focused');});
function focusAdd(){U.el('addCard').classList.add('focused');U.el('addIn').focus();}
function onAddInput(){var b=U.el('addBtn');if(b)b.disabled=!U.el('addIn').value.trim();}
function toggleNote(){
  _noteOn=!_noteOn;
  var w=U.el('noteWrap');if(w)w.style.display=_noteOn?'block':'none';
  U.set('noteLbl',_noteOn?'Hide note':'Note');
  if(_noteOn&&U.el('addNote'))U.el('addNote').focus();
}
function openDp(){var i=U.el('addDue');try{if(i.showPicker)i.showPicker();else i.click();}catch(e){i.click();}}
function updDue(){
  var v=U.el('addDue').value,l=U.el('dueLbl');
  if(v){var d=new Date(v+'T00:00:00'),m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];if(l)l.textContent=d.getDate()+' '+m[d.getMonth()];U.el('duePill')&&U.el('duePill').classList.add('on');}
  else{if(l)l.textContent='Due date';U.el('duePill')&&U.el('duePill').classList.remove('on');}
}
async function addTodo(){
  var inp=U.el('addIn');if(!inp||!inp.value.trim())return;
  try{
    await API.post('ptodo_add',{title:inp.value.trim(),due_date:U.el('addDue')?U.el('addDue').value||null:null,note:U.el('addNote')?U.el('addNote').value||'':''});
    inp.value='';if(U.el('addDue'))U.el('addDue').value='';if(U.el('addNote'))U.el('addNote').value='';
    U.el('addCard').classList.remove('focused');U.el('addBtn').disabled=true;
    U.set('dueLbl','Due date');U.el('duePill')&&U.el('duePill').classList.remove('on');
    _noteOn=false;if(U.el('noteWrap'))U.el('noteWrap').style.display='none';
    await loadT();U.toast('Added','success');
  }catch(ex){U.toast(ex.message,'error');}
}
async function toggleDone(id){
  var t=_todos.find(function(x){return x.todo_id===id;});if(!t)return;
  var ns=(t.status==='Done'||t.status==='Completed')?'Pending':'Done';
  try{await API.post('ptodo_update',{todo_id:id,status:ns});t.status=ns;render();}catch(ex){U.toast(ex.message,'error');}
}
async function delItem(id){
  if(!confirm('Delete?'))return;
  try{await API.post('ptodo_delete',{todo_id:id});_todos=_todos.filter(function(t){return t.todo_id!==id;});render();U.toast('Deleted','success');}catch(ex){U.toast(ex.message,'error');}
}
function editItem(id){
  var t=_todos.find(function(x){return x.todo_id===id;});if(!t)return;
  var v=prompt('Edit title:',t.title);if(v===null)return;
  API.post('ptodo_update',{todo_id:id,title:v.trim()}).then(function(){t.title=v.trim();render();U.toast('Saved','success');}).catch(function(ex){U.toast(ex.message,'error');});
}
