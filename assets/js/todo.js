/*
 * ADC Task Manager — todo.js
 * Page-specific logic for todo.html
 * Requires: auth.js loaded first
 * v2.0
 */

async function loadTodos() {
  try {
    var d = await API.get('ptodo_list', {});
    todos = (d.todos || []).filter(function(t) { return t && t.todo_id; }).map(function(t){
      // Normalize status: n8n stores 'Done', UI uses 'Completed'
      if(t.status === 'Done') t.status = 'Completed';
      // Normalize due_date to YYYY-MM-DD string
      if(t.due_date && typeof t.due_date === 'string' && t.due_date.length > 10) {
        t.due_date = t.due_date.slice(0, 10);
      }
      return t;
    });
    updateUI();
  } catch(ex) {
    document.getElementById('tdList').innerHTML = '<div class="td-empty"><div class="td-empty-icon">⚠️</div><div class="td-empty-title">Could not load to-do list</div><div class="td-empty-sub">' + UTILS.esc(ex.message) + '</div></div>';
  }
}

// ── UPDATE UI ─────────────────────────────────────────────
function updateUI() {
  updateHero();
  updateTabs();
  renderList();
}

function updateHero() {
  var today = todayStr();
  var pending = todos.filter(function(t){ return t.status !== 'Completed'; });
  var done    = todos.filter(function(t){ return t.status === 'Completed'; });
  var overdue = pending.filter(function(t){ return normDate(t.due_date) && normDate(t.due_date) < today; });
  var dueToday = pending.filter(function(t){ return normDate(t.due_date) === today; });
  document.getElementById('heroPending').textContent   = pending.length;
  document.getElementById('heroDone').textContent      = done.length;
  document.getElementById('heroOverdue').textContent   = overdue.length;
  document.getElementById('heroDueToday').textContent  = dueToday.length;
  var pct = todos.length > 0 ? Math.round(done.length / todos.length * 100) : 0;
  var circ = 32 * 2 * Math.PI; // r=32
  var offset = circ - (pct / 100) * circ;
  var ring = document.getElementById('ringFill');
  if (ring) { ring.style.strokeDashoffset = offset; ring.setAttribute('stroke-dasharray', circ); }
  var ringPct = document.getElementById('ringPct');
  if (ringPct) ringPct.textContent = pct + '%';
}

function updateTabs() {
  var today = todayStr();
  var pending = todos.filter(function(t){ return t.status !== 'Completed'; });
  var done    = todos.filter(function(t){ return t.status === 'Completed'; });
  var overdue = pending.filter(function(t){ return normDate(t.due_date) && normDate(t.due_date) < today; });
  var dueToday = pending.filter(function(t){ return normDate(t.due_date) === today; });
  document.getElementById('cntPending').textContent  = pending.length;
  document.getElementById('cntToday').textContent    = dueToday.length;
  document.getElementById('cntOverdue').textContent  = overdue.length;
  document.getElementById('cntDone').textContent     = done.length;
}

function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('.td-tab').forEach(function(b){ b.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderList();
}

// ── RENDER ────────────────────────────────────────────────
function renderList() {
  var today = todayStr();
  var list = document.getElementById('tdList');

  // Filter
  var items;
  if (currentFilter === 'pending')  items = todos.filter(function(t){ return t.status !== 'Completed'; });
  else if (currentFilter === 'done') items = todos.filter(function(t){ return t.status === 'Completed'; });
  else if (currentFilter === 'overdue') items = todos.filter(function(t){ return t.status !== 'Completed' && normDate(t.due_date) && normDate(t.due_date) < today; });
  else if (currentFilter === 'today') items = todos.filter(function(t){ return t.status !== 'Completed' && normDate(t.due_date) === today; });
  else items = todos;

  if (!items.length) {
    var msgs = {
      pending: ['📋', 'All caught up!', 'No pending tasks. Add something above.'],
      done:    ['✅', 'Nothing done yet', 'Complete a task to see it here.'],
      overdue: ['🎉', 'No overdue tasks!', 'Everything is on track.'],
      today:   ['📅', 'Nothing due today', 'Your schedule is clear.'],
      all:     ['📝', 'No to-do items', 'Add your first task above.'],
    };
    var m = msgs[currentFilter] || msgs.all;
    list.innerHTML = '<div class="td-empty"><div class="td-empty-icon">'+m[0]+'</div><div class="td-empty-title">'+m[1]+'</div><div class="td-empty-sub">'+m[2]+'</div></div>';
    return;
  }

  // Group: Overdue / Today / Upcoming / Done
  if (currentFilter === 'all' || currentFilter === 'pending') {
    var groups = [
      { key:'overdue',  label:'Overdue',  items: items.filter(function(t){ return t.status!=='Completed' && normDate(t.due_date) && normDate(t.due_date) < today; }) },
      { key:'today',    label:'Due Today', items: items.filter(function(t){ return t.status!=='Completed' && normDate(t.due_date) === today; }) },
      { key:'upcoming', label:'Upcoming',  items: items.filter(function(t){ return t.status!=='Completed' && (!t.due_date || normDate(t.due_date) > today); }) },
      { key:'done',     label:'Completed', items: items.filter(function(t){ return t.status==='Completed'; }) },
    ].filter(function(g){ return g.items.length > 0; });

    list.innerHTML = groups.map(function(g) {
      return renderGroup(g.label, g.items);
    }).join('');
  } else {
    var groupLabel = { done:'Completed', overdue:'Overdue', today:'Due Today', all:'All Tasks' };
    list.innerHTML = renderGroup(groupLabel[currentFilter] || '', items);
  }
}

function renderGroup(label, items) {
  var html = '<div class="td-group"><span>' + UTILS.esc(label) + '</span><span class="td-group-cnt">' + items.length + '</span></div>';
  html += items.map(renderItem).join('');
  return html;
}

function renderItem(t) {
  var today = todayStr();
  var dc = dateClass(normDate(t.due_date));
  var isDone = t.status === 'Completed';
  var eid = t.todo_id;

  var dateHtml = '';
  if (normDate(t.due_date)) {
    var cls = isDone ? 'td-ok' : (dc === 'overdue' ? 'td-over' : dc === 'today-due' ? 'td-today' : 'td-ok');
    var icon = dc === 'overdue' ? '⚠️' : dc === 'today-due' ? '⏰' : '📅';
    dateHtml = '<span class="td-date ' + cls + '">' + icon + ' ' + (formatDate(normDate(t.due_date)) || '') + '</span>';
  }
  var noteHtml = t.note ? '<div class="td-note">' + UTILS.esc(t.note) + '</div>' : '';
  var doneChk = isDone
    ? '<svg width="12" height="12" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
    : '';

  return (
    '<div class="td-item' + (isDone?' done':'') + (dc?' '+dc:'') + '" id="item-'+eid+'">'
    + '<div class="td-chk-wrap">'
    + '<div class="td-chk'+(isDone?' done':'')+'" data-id="'+eid+'" data-action="toggle">'
    + doneChk
    + '</div></div>'
    + '<div class="td-body">'
    + '<div class="td-title'+(isDone?' done':'')+'">'+UTILS.esc(t.title)+'</div>'
    + noteHtml
    + '<div class="td-meta">'+dateHtml+'</div>'
    + '</div>'
    + '<div class="td-actions">'
    + '<button class="td-btn" data-id="'+eid+'" data-action="edit" title="Edit">'
    + '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
    + '</button>'
    + '<button class="td-btn del" data-id="'+eid+'" data-action="delete" title="Delete">'
    + '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>'
    + '</button>'
    + '</div>'
    + '</div>'
  );
}

// ── ADD ───────────────────────────────────────────────────

// ── ADD CARD INTERACTIONS ────────────────────────────────
var noteShowing = false;

function focusAdd() {
  document.getElementById('addCard').classList.add('focused');
  document.getElementById('tdInput').focus();
}

function blurAdd() {
  document.getElementById('addCard').classList.remove('focused');
  document.getElementById('tdInput').value = '';
  document.getElementById('tdDue').value = '';
  document.getElementById('tdNote').value = '';
  document.getElementById('dueLbl').textContent = 'Due date';
  document.getElementById('noteLblTxt').textContent = 'Note';
  var dp=document.getElementById('datePill'); if(dp) dp.classList.remove('set');
  var np=document.getElementById('notePill'); if(np) np.classList.remove('set');
  if(noteShowing){ hideNote(); }
  document.getElementById('btnAdd').disabled = true;
}

function openDatePicker() {
  var inp = document.getElementById('tdDue');
  try {
    if (inp.showPicker) { inp.showPicker(); }
    else { inp.click(); }
  } catch(e) { inp.click(); }
}

function updateDueLabel() {
  var val = document.getElementById('tdDue').value;
  var pill = document.getElementById('datePill');
  if(val) {
    var d = new Date(val + 'T00:00:00');
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    document.getElementById('dueLbl').textContent = d.getDate()+' '+months[d.getMonth()];
    if(pill) pill.classList.add('set');
  } else {
    document.getElementById('dueLbl').textContent = 'Due date';
    if(pill) pill.classList.remove('set');
  }
}

function toggleNote() {
  noteShowing = !noteShowing;
  var pill = document.getElementById('notePill');
  if(noteShowing) {
    document.getElementById('noteWrap').style.display = 'block';
    document.getElementById('tdNote').focus();
    document.getElementById('noteLblTxt').textContent = 'Hide note';
    if(pill) pill.classList.add('set');
  } else {
    hideNote();
  }
}
function hideNote(){
  noteShowing = false;
  document.getElementById('noteWrap').style.display = 'none';
  document.getElementById('tdNote').value = '';
  document.getElementById('noteLblTxt').textContent = 'Note';
  var pill = document.getElementById('notePill');
  if(pill) pill.classList.remove('set');
}

// Close add card on outside click
document.addEventListener('click', function(e) {
  var card = document.getElementById('addCard');
  if (card && !card.contains(e.target)) {
    card.classList.remove('focused');
  }
});

// Enable Add button only when input has text
document.getElementById('tdInput').addEventListener('input', function() {
  document.getElementById('btnAdd').disabled = !this.value.trim();
});

// Note pill uses onclick directly


async function addTodo() {
  var title = (document.getElementById('tdInput').value || '').trim();
  if (!title) return;
  var due   = document.getElementById('tdDue').value || '';
  var note  = document.getElementById('tdNote').value || '';
  document.getElementById('btnAdd').disabled = true;
  try {
    await API.post('ptodo_add', { title: title, note: note, due_date: due });
    document.getElementById('tdInput').value = '';
    document.getElementById('tdDue').value = '';
    document.getElementById('tdNote').value = '';
    document.getElementById('addCard').classList.remove('focused');
    document.getElementById('btnAdd').disabled = true;
    UTILS.toast('Task added ✓', 'success');
    await loadTodos();
  } catch(ex) {
    UTILS.toast('Error: ' + ex.message, 'error');
    document.getElementById('btnAdd').disabled = false;
  }
}

// ── TOGGLE DONE ──────────────────────────────────────────
async function toggleDone(id) {
  var t = todos.find(function(x){ return x.todo_id === id; });
  if (!t) return;
  var newStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
  var dbStatus = newStatus === 'Completed' ? 'Done' : 'Pending';
  // Optimistic update
  t.status = newStatus;
  updateUI();
  try {
    await API.post('ptodo_update', { todo_id: id, status: dbStatus });
  } catch(ex) {
    t.status = newStatus === 'Completed' ? 'Pending' : 'Completed';
    updateUI();
    UTILS.toast('Error updating task', 'error');
  }
}

// ── EDIT ─────────────────────────────────────────────────
function startEdit(id) {
  if (editingId) cancelEdit();
  editingId = id;
  var t = todos.find(function(x){ return x.todo_id === id; });
  if (!t) return;
  var el = document.getElementById('item-' + id);
  if (!el) return;

  // Build edit form using DOM (avoids string quoting issues)
  var body = el.querySelector('.td-body');
  body.innerHTML = '';
  var wrap = document.createElement('div'); wrap.className = 'td-edit';

  var inp = document.createElement('input'); inp.className = 'td-edit-title'; inp.id = 'editTitle';
  inp.value = t.title || ''; inp.placeholder = 'Task title';
  inp.addEventListener('keydown', function(e){ if(e.key==='Enter')saveEdit(id); if(e.key==='Escape')cancelEdit(); });

  var row = document.createElement('div'); row.className = 'td-edit-row';

  var f1 = document.createElement('div'); f1.className = 'td-edit-field';
  var l1 = document.createElement('label'); l1.textContent = '📅 Due';
  var d1 = document.createElement('input'); d1.type = 'date'; d1.id = 'editDue'; d1.value = t.due_date || '';
  f1.appendChild(l1); f1.appendChild(d1);

  var f2 = document.createElement('div'); f2.className = 'td-edit-field'; f2.style.flex = '2';
  var l2 = document.createElement('label'); l2.textContent = '📝 Note';
  var n2 = document.createElement('input'); n2.id = 'editNote'; n2.value = t.note || ''; n2.placeholder = 'Optional note...';
  f2.appendChild(l2); f2.appendChild(n2);

  row.appendChild(f1); row.appendChild(f2);

  var btns = document.createElement('div'); btns.className = 'td-edit-btns';
  var bSave = document.createElement('button'); bSave.className = 'btn-save'; bSave.textContent = 'Save';
  bSave.addEventListener('click', function(){ saveEdit(id); });
  var bCancel = document.createElement('button'); bCancel.className = 'btn-cancel'; bCancel.textContent = 'Cancel';
  bCancel.addEventListener('click', cancelEdit);
  btns.appendChild(bSave); btns.appendChild(bCancel);

  wrap.appendChild(inp); wrap.appendChild(row); wrap.appendChild(btns);
  body.appendChild(wrap);

  el.querySelector('.td-actions').style.display = 'none';
  inp.focus();
}

function cancelEdit() {
  editingId = null;
  renderList();
}

async function saveEdit(id) {
  var title = (document.getElementById('editTitle').value || '').trim();
  if (!title) { UTILS.toast('Title cannot be empty', 'warning'); return; }
  var due  = document.getElementById('editDue').value || '';
  var note = document.getElementById('editNote').value || '';
  try {
    await API.post('ptodo_update', { todo_id: id, title: title, due_date: due, note: note });
    editingId = null;
    UTILS.toast('Updated ✓', 'success');
    await loadTodos();
  } catch(ex) {
    UTILS.toast('Error: ' + ex.message, 'error');
  }
}

// ── DELETE ────────────────────────────────────────────────
async function deleteTodo(id) {
  if (!confirm('Delete this task?')) return;
  todos = todos.filter(function(t){ return t.todo_id !== id; });
  updateUI();
  try {
    await API.post('ptodo_delete', { todo_id: id });
    UTILS.toast('Deleted', 'info');
  } catch(ex) {
    UTILS.toast('Error deleting', 'error');
    await loadTodos();
  }
}

// ── REFRESH ───────────────────────────────────────────────
async function refreshTodos() {
  var icon = document.getElementById('refreshIcon');
  if (icon) icon.classList.add('spinning');
  await loadTodos();
  setTimeout(function(){ if(icon) icon.classList.remove('spinning'); }, 600);
}

// ── NOTIFICATIONS BELL ────────────────────────────────────
async function loadBell() {
  try {
    var d = await API.get('notif_list', { limit:'5', unread_only:'true' });
    var nb = document.getElementById('notifBadge');
    if (nb) {
      if ((d.unread_count || 0) > 0) { nb.textContent = d.unread_count; nb.classList.remove('hidden'); }
      else nb.classList.add('hidden');
    }
  } catch(e) {}
}


// Event delegation for todo items
document.getElementById('tdList').addEventListener('click', function(e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var id = btn.getAttribute('data-id');
  var action = btn.getAttribute('data-action');
  if (action === 'toggle') toggleDone(id);
  else if (action === 'edit') startEdit(id);
  else if (action === 'delete') deleteTodo(id);
});

// ── INIT ─────────────────────────────────────────────────
loadBell();
loadTodos();
setInterval(loadBell, 60000);
setInterval(loadTodos, 60000);



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
