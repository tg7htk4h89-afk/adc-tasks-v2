/*
 * ADC Task Manager — tasks.js
 * Page-specific logic for tasks.html
 * Requires: auth.js loaded first
 * v2.0
 */

// ── BOARD COLUMNS ─────────────────────────────────────────
var COLS = [
  {id:'new',      label:'New',       s:['New'],                                c:'#7B61FF'},
  {id:'ip',       label:'In Progress',s:['Assigned','InProgress','WaitingInput','UnderReview'], c:'#1877C5'},
  {id:'pending',  label:'Pending',    s:['Pending'],                           c:'#F4A523'},
  {id:'overdue',  label:'Overdue',    s:['Overdue'],                           c:'#E5383B'},
  {id:'escalated',label:'Escalated',  s:['Escalated'],                         c:'#9B59B6'},
  {id:'completed',label:'Completed',  s:['Completed'],                         c:'#0EA472'},
];

var PRI_COLOR = {Critical:'#DC2626',High:'#D97706',Medium:'#2563EB',Low:'#16A34A'};

// ── LOAD TASKS ────────────────────────────────────────────
var _loadRetryTimer = null;
var _loadFailCount = 0;

async function loadT(isRetry) {
  try {
    var params = {};
    if (curF === 'mine') params.assigned_to = _sess.user_id;
    if (curF === 'overdue') params.status = 'Overdue';
    var d = await API.get('tasks_list', params);
    allT = (d.tasks || []).filter(function(t){ return t && t.task_id; });
    _loadFailCount = 0;
    if (_loadRetryTimer) { clearTimeout(_loadRetryTimer); _loadRetryTimer = null; }
    var eb = document.getElementById('loadErrBanner');
    if (eb) { eb.style.transition='opacity .3s'; eb.style.opacity='0'; setTimeout(function(){eb.remove();},300); }
    renderBoard();
  } catch(ex) {
    _loadFailCount++;
    // If we already have data — keep it, just show a soft banner
    var board = document.getElementById('kanbanBoard');
    if (allT && allT.length > 0) {
      if (_loadFailCount < 2) return; // ignore single blip
      // Keep existing board visible, show top warning banner
      var existing = board.innerHTML;
      var banner = '<div id="loadErrBanner" style="background:#FFF0F0;border:1px solid #FECACA;border-radius:12px;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;font-size:12px;color:#B91C1C">'
        + '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        + '<span>Connection issue — showing cached data</span>'
        + '<button onclick="retryFromBanner()" style="margin-left:auto;background:none;border:1px solid #FECACA;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;color:#B91C1C;cursor:pointer">Retry</button>'
        + '</div>';
      // Only add banner if not already there
      if (!document.getElementById('loadErrBanner')) {
        board.insertAdjacentHTML('beforebegin', banner);
      }
    } else {
      // No cached data — show error with retry
      board.innerHTML = '<div style="padding:32px 24px;text-align:center">'
        + '<div style="font-size:28px;margin-bottom:12px">📡</div>'
        + '<div style="font-size:14px;font-weight:700;color:#0A1628;margin-bottom:6px">Connection issue</div>'
        + '<div style="font-size:12px;color:#8A9BB0;margin-bottom:20px">' + UTILS.esc(ex.message) + '</div>'
        + '<button onclick="loadT(true)" style="background:linear-gradient(135deg,#1877C5,#1565A8);color:#fff;border:none;border-radius:10px;padding:10px 24px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">↻ Retry</button>'
        + '</div>';
    }
    // Auto-retry: 5s, 10s, 30s
    var delays = [10000, 30000, 120000];
    var delay = delays[Math.min(_loadFailCount - 1, delays.length - 1)];
    if (_loadRetryTimer) clearTimeout(_loadRetryTimer);
    _loadRetryTimer = setTimeout(function(){ loadT(true); }, delay);
  }
}

// ── RENDER BOARD ──────────────────────────────────────────
function renderBoard() {
  var tasks = allT.filter(function(t){ return t.status !== 'Cancelled'; });
  function setEl(id, val){ var el=document.getElementById(id); if(el) el.textContent=val; }

  // KPIs
  var done = tasks.filter(function(t){ return t.status === 'Completed'; }).length;
  var open = tasks.filter(function(t){ return !['Completed','Cancelled'].includes(t.status); }).length;
  var over = tasks.filter(function(t){ return t.is_overdue === 'TRUE' || t.is_overdue === true; }).length;
  var rate = tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0;
  setEl('kT', tasks.length);
  setEl('kO', open);
  setEl('kV', over);
  setEl('kD', done);
  // kR shown via ring
  // Update hero card
  var heroTitle = document.getElementById('heroTitle');
  if(heroTitle) heroTitle.textContent = curF==='mine'?'My Tasks':curF==='overdue'?'Overdue Tasks':'Task Board';
  var ring = document.getElementById('heroRingFill');
  var ringPct = document.getElementById('heroRingPct');
  var circ = 32*2*Math.PI;
  if(ring){ ring.style.strokeDashoffset=circ-(rate/100)*circ; ring.setAttribute('stroke-dasharray',circ); ring.style.stroke=rate>=80?'#6EE7B7':rate>=50?'#FCD34D':'#FCA5A5'; }
  if(ringPct) ringPct.textContent = rate+'%';

  // Build board — vertical on mobile, kanban on desktop
  var board = document.getElementById('kanbanBoard');
  var isMobile = window.innerWidth <= 768;

  if (isMobile) {
    board.style.cssText = 'display:flex;flex-direction:column;gap:0;overflow:visible;padding:0;min-width:0';
    var hasAny = tasks.length > 0;
    if (!hasAny) {
      board.innerHTML = '<div style="padding:40px 20px;text-align:center;color:#8A9BB0"><div style="font-size:28px;margin-bottom:10px">📋</div><div style="font-size:14px;font-weight:700;color:#4A5568;margin-bottom:4px">No tasks</div><div style="font-size:12px">All clear!</div></div>';
    } else {
      board.innerHTML = COLS.map(function(col) {
        var colTasks = tasks.filter(function(t){ return col.s.includes(t.status); });
        if (!colTasks.length) return '';
        return '<div style="margin-bottom:20px">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
            + '<div style="width:10px;height:10px;border-radius:50%;background:' + col.c + ';flex-shrink:0"></div>'
            + '<span style="font-size:13px;font-weight:800;color:#0A1628">' + col.label + '</span>'
            + '<span style="font-size:11px;font-weight:700;color:#8A9BB0;background:#F4F6FB;border:1px solid #E4EAF3;border-radius:6px;padding:1px 8px">' + colTasks.length + '</span>'
          + '</div>'
          + colTasks.map(function(t){ return renderCard(t); }).join('')
        + '</div>';
      }).join('');
    }
  } else {
    board.style.cssText = '';
    board.innerHTML = COLS.map(function(col) {
      var colTasks = tasks.filter(function(t){ return col.s.includes(t.status); });
      var cardsHtml = colTasks.length === 0
        ? '<div class="k-empty">No ' + col.label.toLowerCase() + ' tasks</div>'
        : colTasks.map(function(t){ return renderCard(t); }).join('');
      return '<div class="k-col">'
        + '<div class="k-header" style="border-top-color:' + col.c + '">'
        + '<div class="k-dot" style="background:' + col.c + '"></div>'
        + '<span class="k-label">' + col.label + '</span>'
        + '<span class="k-count">' + colTasks.length + '</span>'
        + '</div>'
        + cardsHtml
        + (window.KIB_HIERARCHY&&KIB_HIERARCHY.canCreateTask(_sess.role||'') ? '<button class="k-add" onclick="openNewTaskModal()" title="Add task"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' : '')
        + '</div>';
    }).join('');
  }

  // Click listener
  board.addEventListener('click', function(e) {
    var card = e.target.closest('.k-card');
    if (card) openTask(card.dataset.id);
  });
}

function renderCard(t) {
  var pct = t.status === 'Completed' ? 100 : Math.min(100, Number(t.progress_pct || t.progress_percentage || 0));
  var isOver = t.is_overdue === 'TRUE' || t.is_overdue === true;
  var priClass = t.priority || 'Medium';
  var _an = cleanName(t.assigned_to_name); var av = UTILS.av(_an || '?', 26);
  var dueStr = '';
  if (t.due_datetime) {
    var d = new Date(t.due_datetime);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    dueStr = d.getDate() + ' ' + months[d.getMonth()];
  }
  return '<div class="k-card" data-id="' + t.task_id + '">'
    + '<div class="k-card-id">' + t.task_id + '</div>'
    + '<div class="k-card-title">' + UTILS.esc(t.title || 'Untitled') + '</div>'
    + (t.category ? '<span class="k-card-cat">' + UTILS.esc(t.category) + '</span>' : '')
    + '<div class="k-card-bottom">'
    + '<span class="k-pri ' + priClass + '">' + UTILS.esc(t.priority || '') + '</span>'
    + (dueStr ? '<span style="font-size:10px;color:' + (isOver?'var(--red)':'var(--t3)') + '">' + (isOver?'⚠ ':'📅 ') + dueStr + '</span>' : '')
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px;margin-top:8px">'
    + '<div class="k-prog"><div class="k-prog-fill" style="width:' + pct + '%;background:' + (pct>=100?'var(--green)':'var(--blue)') + '"></div></div>'
    + av
    + '</div>'
    + '</div>';
}

// ── FILTER ────────────────────────────────────────────────
function setFilter(f, btn) {
  curF = f;
  document.querySelectorAll('.f-pill').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  loadT();
}

// ── OPEN TASK ─────────────────────────────────────────────
async function openTask(id) {
  try {
    var d = await API.get('tasks_detail', {task_id: id});
    currentTask = d;
    renderTaskModal(d);
  } catch(ex) {
    UTILS.toast('Error loading task: ' + ex.message, 'error');
  }
}

// ── CLOSE MODAL ───────────────────────────────────────────
function closeTaskModal() {
  var sheet = document.getElementById('taskModalSheet');
  if (sheet) {
    var isMob2 = window.innerWidth <= 768;
    sheet.style.transition = 'transform .22s cubic-bezier(.32,0,.67,0)' + (isMob2 ? '' : ', opacity .22s');
    sheet.style.transform = isMob2 ? 'translateY(100%)' : 'scale(.94) translateY(16px)';
    if (!isMob2) sheet.style.opacity = '0';
  }
  setTimeout(function() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('taskModalHeader').innerHTML = '';
    document.getElementById('taskModalBody').innerHTML = '';
    currentTask = null;
  }, 260);
}

// ── REFRESH ───────────────────────────────────────────────
function refreshTasks() {
  var icon = document.getElementById('refreshIcon');
  if (icon) icon.style.animation = 'spin .6s linear infinite';
  loadT();
  setTimeout(function(){ if(icon) icon.style.animation = ''; }, 800);
}

// ── UPDATE TASK STATUS ────────────────────────────────────
// ── DELEGATE SELECT POPULATION ────────────────────────────
function populateDelegateSelect() {
  var sel = document.getElementById('delegateSelect');
  if (!sel) return;
  // Clear existing options except placeholder
  while (sel.options.length > 1) sel.remove(1);
  var myId = (_sess && _sess.user_id) || '';
  var assignable = (window.KIB_HIERARCHY && myId) ? KIB_HIERARCHY.getAssignableUserIds(myId) : [];

  function fillSelect(users) {
    var filtered = assignable.length > 0
      ? users.filter(function(u) { return assignable.indexOf(u.user_id) !== -1; })
      : users.filter(function(u) { return u.user_id !== myId; });
    filtered.forEach(function(u) {
      var opt = document.createElement('option');
      opt.value = u.user_id;
      opt.textContent = (u.full_name || '') + ' (' + (u.role || '') + ')';
      sel.appendChild(opt);
    });
  }

  if (window._cachedUsers && window._cachedUsers.length) {
    fillSelect(window._cachedUsers);
  } else {
    API.get('users_list', {}).then(function(d) {
      window._cachedUsers = (d.users || []).filter(function(u) {
        return u && u.user_id && u.active_status !== 'inactive';
      });
      fillSelect(window._cachedUsers);
    }).catch(function(e) { console.error('users_list:', e); });
  }
}

// ── TASK MODAL TAB SWITCHER ────────────────────────────────
function switchTmTab(tabId) {
  var panels = ['detail','subtasks','comments','extension','activity'];
  panels.forEach(function(p) {
    var el = document.getElementById('tmpanel-' + p);
    if (el) el.style.display = 'none';
  });
  var panelId = tabId.replace('tmtab-', 'tmpanel-');
  var active = document.getElementById(panelId);
  if (active) active.style.display = 'block';
  // Update tab button styles
  panels.forEach(function(p) {
    var btn = document.getElementById('tmtab-' + p);
    if (!btn) return;
    var isActive = 'tmtab-' + p === tabId;
    btn.style.borderBottomColor = isActive ? '#60A5FA' : 'transparent';
    btn.style.color = isActive ? '#fff' : 'rgba(255,255,255,.45)';
    btn.style.fontWeight = isActive ? '700' : '500';
  });
}

async function updateTask(status) {
  if (!currentTask) return;
  var notes = '';
  if (status === 'Completed') { notes = prompt('Completion notes (optional):') || ''; }
  try {
    var payload = {task_id: currentTask.task.task_id, status: status, completion_notes: notes};
    if (status === 'Completed') payload.progress_pct = 100;
    if (status === 'Cancelled') payload.progress_pct = 0;
    await API.post('tasks_update', payload);
    UTILS.toast('Task ' + status.toLowerCase() + ' ✓', 'success');
    closeTaskModal();
    loadT();
  } catch(ex) { UTILS.toast('Error: ' + ex.message, 'error'); }
}

// ── LOAD BELL ─────────────────────────────────────────────
async function loadBell() {
  try {
    var d = await API.get('notif_list', {limit:'5',unread_only:'true'});
  } catch(e) {}
}

function renderTaskModal(d) {
  var t = d.task;
  var comments = [];
  try {
    var _cd = d.task ? d.task.comments_data : null;
    if (typeof _cd === 'string') comments = JSON.parse(_cd || '[]');
    else if (Array.isArray(_cd)) comments = _cd;
  } catch(e) { comments = []; }
  var activity = d.activity || [];
  var tr = UTILS.tr(t.due_datetime);
  var isA = t.assigned_to_user_id === AUTH.getUserId();
  var isM = AUTH.hasRole(['HoD','CC Manager','Manager']);
  var canAct = (isA || isM) && t.status !== 'Completed' && t.status !== 'Cancelled';

  var statusColors = {
    'New':'#6366F1','InProgress':'#3B82F6','Completed':'#10B981',
    'Blocked':'#EF4444','Escalated':'#F59E0B','Cancelled':'#94A3B8'
  };
  var statusBgs = {
    'New':'#EEF2FF','InProgress':'#EFF6FF','Completed':'#ECFDF5',
    'Blocked':'#FEF2F2','Escalated':'#FFFBEB','Cancelled':'#F8FAFC'
  };
  var priColors = {Critical:'#EF4444',High:'#F59E0B',Medium:'#3B82F6',Low:'#10B981'};
  var sc = statusColors[t.status] || '#94A3B8';
  var sb = statusBgs[t.status] || '#F8FAFC';
  var pc = priColors[t.priority] || '#94A3B8';
  var pct = t.status==='Completed' ? 100 : Math.min(100, Number(t.progress_pct||t.progress_percentage) || 0);

  var avatarColors = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#0EA472','#EF4444'];
  function aColor(name){ return avatarColors[(name||'A').charCodeAt(0) % avatarColors.length]; }
  function avatar(name, size){
    size = size || 36;
    var c = aColor(name);
    var ini = String(name||'?').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
    return '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+c+';display:flex;align-items:center;justify-content:center;font-size:'+(size*0.38|0)+'px;font-weight:800;color:#fff;flex-shrink:0;box-shadow:0 2px 6px '+c+'44">'+ini+'</div>';
  }

  var html = '';

  // ── HEADER ──────────────────────────────────────────────────────
  html += '<div style="background:linear-gradient(160deg,#0D1F3C 0%,#1E3A6E 60%,#1A4A7A 100%);padding:22px 24px 0;flex-shrink:0">';
  // Top row — priority + status + ID
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">';
  html += '<span style="font-size:10px;font-weight:700;background:'+sb+';color:'+sc+';padding:3px 12px;border-radius:20px">'+t.status+'</span>';
  html += '<span style="font-size:10px;font-weight:700;background:'+pc+'22;color:'+pc+';padding:3px 10px;border-radius:20px">'+t.priority+'</span>';
  if (t.is_overdue === 'TRUE' && t.status !== 'Completed') html += '<span style="font-size:10px;font-weight:700;background:#FEF2F2;color:#EF4444;padding:3px 10px;border-radius:20px">⚠ OVERDUE</span>';
  html += '<span style="font-size:10px;color:rgba(255,255,255,.35);margin-left:auto">'+UTILS.esc(t.task_id)+'</span>';
  html += '</div>';
  // Title + avatar
  html += '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px">';
  html += '<div style="flex:1;min-width:0">';
  html += '<div style="font-size:20px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:5px">'+UTILS.esc(t.title)+'</div>';
  html += '<div style="font-size:11px;color:rgba(255,255,255,.4)">'+UTILS.esc(t.category)+'  ·  Assigned by '+UTILS.esc(t.assigned_by_name||'—')+'</div>';
  html += '</div>';
  html += '<div style="flex-shrink:0;text-align:center">';
  html += avatar(cleanName(t.assigned_to_name) || '?', 48);
  html += '<div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:4px;max-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+UTILS.esc((cleanName(t.assigned_to_name)||'—').split(' ')[0])+'</div>';
  html += '</div></div>';
  // Stats strip
  html += '<div style="display:flex;background:rgba(0,0,0,.15);border-radius:10px 10px 0 0;overflow-x:auto;overflow-y:hidden;margin:0 -24px;-webkit-overflow-scrolling:touch;scrollbar-width:none">';
  html += '<div style="flex:1;padding:10px 16px;border-right:1px solid rgba(255,255,255,.06)">';
  html += '<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px">⏰ Due</div>';
  html += '<div style="font-size:12px;font-weight:700;color:'+(tr.overdue?'#FCA5A5':'rgba(255,255,255,.9)')+'">'+UTILS.fdt(t.due_datetime)+'</div>';
  html += '<div style="font-size:10px;color:rgba(255,255,255,.4)">'+tr.label+'</div>';
  html += '</div>';
  html += '<div style="flex:1;padding:10px 16px;border-right:1px solid rgba(255,255,255,.06)">';
  html += '<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px">📋 Category</div>';
  html += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.9)">'+UTILS.esc(t.category||'—')+'</div>';
  html += '</div>';
  // SLA Performance calculation
  var slaPerf = null;
  var slaPerfLabel = '';
  var slaPerfColor = 'rgba(255,255,255,.9)';
  var slaDaysLabel = '';
  if(t.created_at && t.due_datetime) {
    var created = new Date(t.created_at);
    var due     = new Date(t.due_datetime);
    var slaTotalMs = due - created;
    if(slaTotalMs > 0) {
      if(t.status === 'Completed' && t.completed_at) {
        var completed = new Date(t.completed_at);
        var diffMs = due - completed; // positive = early, negative = late
        var diffDays = Math.round(Math.abs(diffMs) / 86400000);
        var diffHours = Math.round(Math.abs(diffMs) / 3600000);
        var timeUsedMs = completed - created;
        if(timeUsedMs > 0) {
          // Cap at 150% to avoid test-task inflation
          var rawPerf = Math.round((slaTotalMs / timeUsedMs) * 100);
          slaPerf = Math.min(rawPerf, 150);
        }
        if(diffMs >= 0) {
          // Completed before deadline
          slaPerfColor = '#6EE7B7';
          slaDaysLabel = diffDays > 0 ? diffDays+'d early' : (diffHours > 0 ? diffHours+'h early' : 'On deadline');
          slaPerfLabel = 'On time';
        } else {
          // Completed after deadline
          slaPerf = Math.max(0, Math.round(((slaTotalMs + diffMs) / slaTotalMs) * 100));
          slaPerfColor = '#FCA5A5';
          slaDaysLabel = diffDays > 0 ? diffDays+'d late' : diffHours+'h late';
          slaPerfLabel = 'Late';
        }
      } else if(t.status !== 'Cancelled') {
        var now = new Date();
        var remaining = due - now;
        var remDays = Math.ceil(Math.abs(remaining) / 86400000);
        slaPerf = Math.max(0, Math.min(100, Math.round((remaining / slaTotalMs) * 100)));
        if(remaining > 0) {
          slaPerfColor = slaPerf > 30 ? '#6EE7B7' : slaPerf > 10 ? '#FCD34D' : '#FCA5A5';
          slaDaysLabel = remDays+'d left';
          slaPerfLabel = slaPerf > 30 ? 'On track' : slaPerf > 10 ? 'Due soon' : 'At risk';
        } else {
          slaPerfColor = '#FCA5A5';
          slaDaysLabel = remDays+'d overdue';
          slaPerfLabel = 'Overdue';
        }
      }
    }
  }
  html += '<div style="flex:1;padding:10px 16px">';
  html += '<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px">⚡ SLA</div>';
  if(slaPerf !== null) {
    html += '<div style="font-size:14px;font-weight:800;color:'+slaPerfColor+'">'+slaPerf+'%</div>';
    html += '<div style="font-size:10px;color:rgba(255,255,255,.5)">'+slaDaysLabel+'</div>';
  } else {
    html += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.9)">'+(t.sla_value||4)+' '+(t.sla_unit||'days')+'</div>';
  }
  html += '</div>';
  html += '</div>';
  // Tabs
  html += '<div style="display:flex;background:rgba(0,0,0,.2);margin:0 -24px">';
  var subtasks = [];
  try {
    var _sd = d.task ? d.task.subtasks_data : null;
    if (typeof _sd === 'string') subtasks = JSON.parse(_sd || '[]');
    else if (Array.isArray(_sd)) subtasks = _sd;
  } catch(e) { subtasks = []; }
  var extensions = [];
  try {
    var _ed = d.task ? d.task.extensions_data : null;
    if (typeof _ed === 'string') extensions = JSON.parse(_ed || '[]');
    else if (Array.isArray(_ed)) extensions = _ed;
  } catch(e) { extensions = []; }
  var assignees = [];
  try {
    var _aj = d.task ? d.task.assignees_json : null;
    if (typeof _aj === 'string') assignees = JSON.parse(_aj || '[]');
    else if (Array.isArray(_aj)) assignees = _aj;
  } catch(e) { assignees = []; }
  var pendingExt = extensions.find(function(x){ return x.status==='Pending'; });
  var canExtend  = !pendingExt && (isM || t.assigned_to_user_id === AUTH.getUserId());
  var tmTabs = [
    {id:'tmtab-detail',    label:'Details'},
    {id:'tmtab-subtasks',  label:'Sub-tasks', badge: subtasks.length > 0 ? (subtasks.filter(function(s){return s.status==='Completed';}).length+'/'+subtasks.length) : ''},
    {id:'tmtab-comments',  label:'Comments',  badge: comments.length > 0 ? String(comments.length) : ''},
    {id:'tmtab-extension', label:'Extension', badge: pendingExt ? '!' : ''},
    {id:'tmtab-activity',  label:'Activity',  badge: activity.length > 0 ? String(activity.length) : ''}
  ];
  tmTabs.forEach(function(tb, i){
    var active = i === 0;
    html += '<button id="'+tb.id+'" data-tab="'+tb.id+'" onclick="switchTmTab(this.dataset.tab)" style="flex:1;background:none;border:none;border-bottom:'+(active?'2px solid #60A5FA':'2px solid transparent')+';padding:11px 6px 9px;font-size:12px;font-weight:'+(active?'700':'500')+';color:'+(active?'#fff':'rgba(255,255,255,.45)')+';cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .2s">';
    html += tb.label;
    if(tb.badge) html += ' <span style="background:rgba(255,255,255,.18);color:#fff;font-size:9px;font-weight:700;padding:1px 7px;border-radius:20px;margin-left:3px">'+tb.badge+'</span>';
    html += '</button>';
  });
  html += '</div>';
  html += '</div>'; // end header

  // ── PANELS ──────────────────────────────────────────────────────
  html += '<div style="padding:20px 22px 24px;min-height:200px">';

  // DETAIL PANEL
  html += '<div id="tmpanel-detail">';
  if (t.description) {
    html += '<div style="background:#EFF6FF;border-left:3px solid #3B82F6;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#1E3A5F;line-height:1.6">'+UTILS.esc(t.description)+'</div>';
  }
  // Progress bar
  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">';
  html += '<div style="flex:1;background:#E2E8F0;border-radius:6px;height:8px;overflow:hidden">';
  html += '<div style="height:100%;border-radius:6px;background:'+(pct>=100?'#10B981':pct>50?'#3B82F6':'#F59E0B')+';width:'+pct+'%;transition:width .5s"></div>';
  html += '</div>';
  html += '<span style="font-size:12px;font-weight:700;color:'+(pct>=100?'#059669':'#64748B')+'">'+pct+'%</span>';
  html += '</div>';
  // Meta grid
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">';
  html += '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px">';
  // "Assigned To" = current owner (changes after delegation)
  var isDel = t.delegated_flag === true || t.delegated_flag === 'TRUE' || t.delegated_flag === 't';
  var _isDel = isDel;
  var _curName = cleanName(t.assigned_to_name);
  var _curRole = t.assigned_to_role || '';
  var _assigneesList = assignees.length ? assignees : [];
  html += '<div style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Assigned To</div>';
  if (_curName) {
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'+avatar(_curName,24)+'<span style="font-size:12px;color:#0F172A;font-weight:600">'+UTILS.esc(_curName)+'</span>'+(_curRole?'<span style="font-size:10px;color:#64748B">('+UTILS.esc(_curRole)+')</span>':'')+'</div>';
  } else if (_assigneesList.length) {
    html += _assigneesList.map(function(a){var n=a.name||a.full_name||'';return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'+avatar(n,24)+'<span style="font-size:12px;color:#0F172A;font-weight:600">'+UTILS.esc(n)+'</span>'+(a.role?'<span style="font-size:10px;color:#64748B">('+UTILS.esc(a.role)+')</span>':'')+'</div>';}).join('');
  } else {
    html += '<div style="font-size:12px;color:#94A3B8">—</div>';
  }
  // Delegated From note — shows who originally delegated this task
  if (_isDel && cleanName(t.delegated_from_name)) {
    html += '<div style="margin-top:6px;font-size:10px;color:#94A3B8">🔀 Delegated from <b style="color:#64748B">'+UTILS.esc(cleanName(t.delegated_from_name))+'</b></div>';
  }
  html += '</div>';
  html += '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px">';
  html += '<div style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Assigned By</div>';
  html += '<div style="display:flex;align-items:center;gap:8px">'+avatar(t.assigned_by_name,28)+'<span style="font-weight:600;font-size:13px;color:#0F172A">'+UTILS.esc(t.assigned_by_name||'—')+'</span></div>';
  html += '</div>';
  html += '</div>';
  // Progress bar + SLA Performance card
  var progBg = pct>=100?'#10B981':pct>=70?'#3B82F6':'#F59E0B';
  html += '<div style="background:#F8FAFC;border-radius:12px;padding:14px 16px;margin-bottom:14px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
  html += '<span style="font-size:11px;font-weight:700;color:#64748B">Task Progress</span>';
  html += '<span style="font-size:14px;font-weight:800;color:'+progBg+'">'+pct+'%</span>';
  html += '</div>';
  html += '<div style="height:8px;background:#E2E8F0;border-radius:6px;overflow:hidden">';
  html += '<div style="height:100%;width:'+pct+'%;background:'+progBg+';border-radius:6px;transition:width .6s ease"></div>';
  html += '</div>';
  if(slaPerf !== null){
    var slaCardBg = slaPerf>=100 ? '#ECFDF5' : '#FFF0F0';
    var slaCardBd = slaPerf>=100 ? '#A7F3D0' : '#FECACA';
    var slaCardTx = slaPerf>=100 ? '#065F46' : '#991B1B';
    var slaIcon   = slaPerf>=100 ? '✅' : '⚠️';
    html += '<div style="margin-top:10px;background:'+slaCardBg+';border:1px solid '+slaCardBd+';border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px">';
    html += '<span style="font-size:14px">'+slaIcon+'</span>';
    html += '<div>';
    html += '<div style="font-size:11px;font-weight:700;color:'+slaCardTx+'">'+(slaPerfLabel==='On time'||slaPerfLabel==='On track'?'✓ SLA '+slaPerfLabel:'⚠ SLA '+slaPerfLabel)+' — '+slaPerf+'%</div>';
    if(t.status==='Completed'){
      html += '<div style="font-size:10px;color:'+slaCardTx+';opacity:.7">'+(slaPerf>=100?'Completed before deadline ✓':'Completed after deadline'+(t.completed_at?' on '+UTILS.fdt(t.completed_at):''))+'</div>';
    } else {
      var daysLeft = Math.ceil((new Date(t.due_datetime)-new Date())/86400000);
      html += '<div style="font-size:10px;color:'+slaCardTx+';opacity:.7">'+(daysLeft>0?daysLeft+' day'+(daysLeft!==1?'s':'')+' remaining':'Overdue by '+Math.abs(daysLeft)+' day'+(Math.abs(daysLeft)!==1?'s':''))+'</div>';
    }
    html += '</div></div>';
  }
  html += '</div>';
  // Action buttons
  if (canAct) {
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid #F1F5F9;padding:16px 0 8px">';
    if(t.status === 'New'||t.status === 'Assigned') html += '<button data-s="InProgress" onclick="updateTask(this.dataset.s)" style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer">▶ Start</button>';
    html += '<button data-s="Completed" onclick="updateTask(this.dataset.s)" style="background:linear-gradient(135deg,#10B981,#059669);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer">✓ Complete</button>';
    if(isM) html += '<button data-s="Escalated" onclick="updateTask(this.dataset.s)" style="background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer">⚡ Escalate</button>';
    if(isM) html += '<button onclick="confirmCancel()" style="background:#FEF2F2;border:1.5px solid #FECACA;color:#EF4444;border-radius:10px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer">✕ Cancel Task</button>';
    html += '</div>';
  }
  html += '</div>';

  // COMMENTS PANEL
  html += '<div id="tmpanel-comments" style="display:none">';
  if(comments.length === 0){
    html += '<div style="text-align:center;padding:36px 0 20px">';
    html += '<div style="width:52px;height:52px;border-radius:50%;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 10px">💬</div>';
    html += '<div style="font-size:13px;font-weight:600;color:#64748B">No comments yet</div>';
    html += '</div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:12px;max-height:260px;overflow-y:auto;margin-bottom:16px;padding-right:4px">';
    comments.forEach(function(c){
      var ac = aColor(c.author_name);
      var isMgr = c.is_manager_note === 'TRUE';
      html += '<div style="display:flex;gap:10px">';
      html += '<div style="width:36px;height:36px;border-radius:50%;background:'+ac+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;color:#fff">'+UTILS.ini(c.author_name)+'</div>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="background:'+(isMgr?'#EFF6FF':'#F8FAFC')+';border:1px solid '+(isMgr?'#BFDBFE':'#E2E8F0')+';border-radius:4px 14px 14px 14px;padding:11px 14px">';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:5px">';
      html += '<span style="font-size:12px;font-weight:700;color:#0F172A">'+UTILS.esc(c.author_name)+(isMgr?' <span style="font-size:9px;background:#BFDBFE;color:#1E40AF;padding:1px 6px;border-radius:10px">Manager</span>':'')+'</span>';
      html += '<span style="font-size:10px;color:#94A3B8">'+UTILS.fdt(c.created_datetime)+'</span>';
      html += '</div>';
      html += '<div style="font-size:13px;color:#334155;line-height:1.5;white-space:pre-wrap">'+UTILS.esc(c.comment_text)+'</div>';
      html += '</div></div></div>';
    });
    html += '</div>';
  }
  // Composer
  var myAc = aColor(AUTH.getSession()&&AUTH.getSession().full_name||'?');
  html += '<div style="display:flex;gap:10px;align-items:flex-end;padding-top:14px;border-top:1px solid #F1F5F9">';
  html += '<div style="width:36px;height:36px;border-radius:50%;background:'+myAc+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;color:#fff">'+UTILS.ini((AUTH.getSession()&&AUTH.getSession().full_name)||'?')+'</div>';
  html += '<textarea id="tmCmt" rows="2" placeholder="Write a comment..." style="flex:1;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:12px;font-size:13px;font-family:inherit;resize:none;box-sizing:border-box;background:#F8FAFC;outline:none;min-width:0"></textarea>';
  html += '<button onclick="addTaskComment()" style="background:linear-gradient(135deg,#1E3A6E,#1A4A7A);color:#fff;border:none;border-radius:12px;padding:11px 20px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0">Send</button>';
  html += '</div>';
  html += '</div>';

  // ACTIVITY PANEL
  html += '<div id="tmpanel-activity" style="display:none">';
  if(activity.length === 0){
    html += '<div style="text-align:center;padding:36px 0;color:#94A3B8;font-size:13px">No activity yet</div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:0;max-height:320px;overflow-y:auto">';
    activity.forEach(function(a, idx){
      html += '<div style="display:flex;gap:12px;padding:10px 0;'+(idx>0?'border-top:1px solid #F1F5F9':'')+'">';
      html += '<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:32px">';
      html += '<div style="width:8px;height:8px;border-radius:50%;background:#3B82F6;margin-top:4px"></div>';
      if(idx < activity.length-1) html += '<div style="width:1px;flex:1;background:#E2E8F0;margin-top:4px"></div>';
      html += '</div>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:12px;font-weight:600;color:#0F172A">'+UTILS.esc(a.performed_by_name||'System')+'</div>';
      html += '<div style="font-size:12px;color:#64748B;margin-top:2px">'+UTILS.esc(a.action_description||a.action||'')+'</div>';
      html += '<div style="font-size:10px;color:#94A3B8;margin-top:3px">'+UTILS.fdt(a.performed_datetime||a.created_datetime||'')+'</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }
  html += '</div>';


  // SUB-TASKS PANEL
  html += '<div id="tmpanel-subtasks" style="display:none">';
  if(subtasks.length === 0){
    html += '<div style="text-align:center;padding:32px 0"><div style="font-size:36px;margin-bottom:8px">✅</div><div style="font-size:13px;font-weight:600;color:#64748B">No sub-tasks</div><div style="font-size:12px;color:#94A3B8;margin-top:4px">Add sub-tasks when creating the task</div></div>';
  } else {
    var stDone = subtasks.filter(function(s){return s.status==='Completed';}).length;
    var stPct  = Math.round(stDone/subtasks.length*100);
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">';
    html += '<div style="flex:1;background:#E2E8F0;border-radius:6px;height:8px;overflow:hidden"><div style="height:100%;border-radius:6px;background:'+(stPct>=100?'#10B981':'#3B82F6')+';width:'+stPct+'%;transition:width .5s"></div></div>';
    html += '<span style="font-size:12px;font-weight:700;color:'+(stPct>=100?'#059669':'#64748B')+'">'+stDone+'/'+subtasks.length+'</span>';
    html += '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    subtasks.forEach(function(st){
      var done = st.status === 'Completed';
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:'+(done?'#F0FDF4':'#F8FAFC')+';border:1.5px solid '+(done?'#A7F3D0':'#E2E8F0')+';border-radius:10px">';
      html += '<div style="width:22px;height:22px;border-radius:50%;background:'+(done?'#10B981':'#E2E8F0')+';display:flex;align-items:center;justify-content:center;flex-shrink:0">';
      if(done) html += '<svg width=11 height=11 fill=none stroke=#fff stroke-width=2.5 viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
      html += '</div>';
      html += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#0F172A">'+UTILS.esc(st.title)+'</div>';
      if(done && st.marked_by_name) html += '<div style="font-size:10px;color:#059669;font-weight:600;margin-top:1px">✓ by '+UTILS.esc(st.marked_by_name)+(st.marked_datetime?' · '+st.marked_datetime.slice(0,10):'')+'</div>';
      html += '</div>';
      if(canAct||isM){
        if(!done){
          html += '<button data-sid="'+st.subtask_id+'" onclick="markSubtask(this.dataset.sid,true)" style="background:#10B981;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0">✓ Done</button>';
        } else {
          html += '<button data-sid="'+st.subtask_id+'" onclick="markSubtask(this.dataset.sid,false)" style="background:#fff;color:#94A3B8;border:1.5px solid #E2E8F0;border-radius:8px;padding:6px 12px;font-size:11px;cursor:pointer;flex-shrink:0">↩</button>';
        }
      } else {
        html += '<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;'+(done?'background:#D1FAE5;color:#065F46':'background:#FEF3C7;color:#92400E')+'">'+(done?'Done':'Pending')+'</span>';
      }
      html += '</div>';
    });
    html += '</div>';
  }
  // Delegate section inside sub-tasks panel
  if(isM||t.assigned_to_user_id===AUTH.getUserId()){
    html += '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #F1F5F9">';
    html += '<div style="font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">🔀 Delegate Task</div>';
    if(t.delegated_flag==='TRUE'){
      html += '<div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:12px;color:#92400E">🔀 Delegated from <b>'+UTILS.esc(t.delegated_from_name||'')+'</b></div>';
    }
    html += '<div style="display:flex;gap:8px">';
    html += '<select id="delegateSelect" style="flex:1;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:inherit;background:#F8FAFC"><option value="">Select staff to delegate to...</option></select>';
    html += '<button onclick="delegateTask()" style="background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0">Delegate</button>';
    html += '</div>';
    html += '<input type="text" id="delegateReason" placeholder="Reason (optional)..." style="width:100%;margin-top:8px;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:inherit;box-sizing:border-box;background:#F8FAFC">';
    html += '</div>';
  }
  html += '</div>'; // end subtasks panel

  // EXTENSION PANEL
  html += '<div id="tmpanel-extension" style="display:none">';
  if(pendingExt && isM){
    html += '<div style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1.5px solid #FDE68A;border-radius:14px;padding:18px;margin-bottom:14px">';
    html += '<div style="font-size:13px;font-weight:700;color:#92400E;margin-bottom:10px">⏳ Pending from '+UTILS.esc(pendingExt.requested_by_name)+'</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">';
    html += '<div style="background:#fff;border-radius:10px;padding:12px"><div style="font-size:10px;color:#92400E;font-weight:700;text-transform:uppercase;margin-bottom:4px">Current</div><div style="font-size:14px;font-weight:800;color:#0F172A">'+UTILS.fdt(pendingExt.current_due)+'</div></div>';
    html += '<div style="background:#EFF6FF;border-radius:10px;padding:12px"><div style="font-size:10px;color:#1E40AF;font-weight:700;text-transform:uppercase;margin-bottom:4px">Requested</div><div style="font-size:14px;font-weight:800;color:#1E40AF">'+UTILS.esc(pendingExt.requested_due)+'</div></div>';
    html += '</div>';
    html += '<div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;color:#334155"><b>Reason:</b> '+UTILS.esc(pendingExt.reason)+'</div>';
    html += '<input type="text" id="extReviewNote" placeholder="Review note (optional)..." style="width:100%;padding:9px 12px;border:1.5px solid #FDE68A;border-radius:10px;font-size:12px;font-family:inherit;box-sizing:border-box;margin-bottom:12px;background:#fff">';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
    html += '<button data-extid="'+pendingExt.ext_id+'" data-dec="Approved" onclick="reviewTaskExt(this)" style="background:linear-gradient(135deg,#10B981,#059669);color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer">✅ Approve</button>';
    html += '<button data-extid="'+pendingExt.ext_id+'" data-dec="Rejected" onclick="reviewTaskExt(this)" style="background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer">❌ Reject</button>';
    html += '</div></div>';
  }
  if(pendingExt && !isM){
    html += '<div style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:12px;padding:16px;margin-bottom:14px;font-size:13px;color:#1E40AF">⏳ Extension request to <b>'+UTILS.esc(pendingExt.requested_due)+'</b> is pending approval.</div>';
  }
  if(canExtend){
    html += '<div id="tmExtForm" style="display:none;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:14px;padding:18px;margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:12px">⏰ Request Deadline Extension</div>';
    html += '<div style="background:#EFF6FF;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#334155">Current due: <b style="color:#0F172A">'+UTILS.fdt(t.due_datetime)+'</b></div>';
    html += '<label style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px">New Due Date *</label>';
    html += '<input type="date" id="tmExtDate" style="width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:inherit;box-sizing:border-box;margin-bottom:12px;background:#fff">';
    html += '<label style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px">Reason *</label>';
    html += '<textarea id="tmExtReason" rows="3" placeholder="Why is the extension needed?" style="width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:inherit;resize:none;box-sizing:border-box;margin-bottom:12px;background:#fff"></textarea>';
    html += '<div style="display:flex;gap:8px">';
    html += '<button onclick="submitTaskExt()" style="background:linear-gradient(135deg,#1E3A6E,#1A4A7A);color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer">Submit Request</button>';
    html += '<button onclick="document.getElementById(\'tmExtForm\').style.display=\'none\';" style="background:#fff;border:1.5px solid #E2E8F0;border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;color:#64748B">Cancel</button>';
    html += '</div></div>';
    html += '<button onclick="document.getElementById(\'tmExtForm\').style.display=\'\';this.style.display=\'none\';" style="width:100%;background:#fff;border:2px dashed #CBD5E1;border-radius:12px;padding:13px;font-size:13px;font-weight:600;color:#64748B;cursor:pointer">⏰ Request Deadline Extension</button>';
  }
  html += '</div>'; // end extension panel

  html += '</div>'; // end panels

  var splitMarker = '<div style="padding:20px 22px 24px;min-height:200px">';
  var splitIdx = html.indexOf(splitMarker);
  if (splitIdx > -1) {
    var hdr = document.getElementById('taskModalHeader');
    var bdy = document.getElementById('taskModalBody');
    if (hdr) hdr.innerHTML = html.slice(0, splitIdx);
    if (bdy) bdy.innerHTML = html.slice(splitIdx);
  } else {
    var bdy = document.getElementById('taskModalBody');
    if (bdy) bdy.innerHTML = html;
  }
  var modal = document.getElementById('taskModal');
  if (modal) {
    modal.style.display = 'flex';
    // Mobile: bottom sheet behaviour
    if (window.innerWidth <= 768) {
      modal.style.alignItems = 'flex-end';
      modal.style.padding = '0';
    } else {
      modal.style.alignItems = 'center';
      modal.style.padding = '20px';
    }
  }
  // Populate delegate dropdown
  populateDelegateSelect();
  var sheet = document.getElementById('taskModalSheet');
  if (sheet) {
    var _isMob = window.innerWidth <= 768;
    sheet.style.transform = _isMob ? 'translateY(100%)' : 'scale(.96) translateY(10px)';
    sheet.style.opacity = _isMob ? '1' : '0';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        var isMob = window.innerWidth <= 768;
        sheet.style.transition = 'transform .32s cubic-bezier(.32,0,.15,1)' + (isMob ? '' : ', opacity .28s');
        sheet.style.transform = isMob ? 'translateY(0)' : 'scale(1) translateY(0)';
        if (!isMob) sheet.style.opacity = '1';
      });
    });
  };
  // Reset form
  ['nTitle','nDesc','nDue','nSV'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  ['nCat','nPri','nSU'].forEach(function(id){var el=document.getElementById(id);if(el)el.selectedIndex=0;});
  ntmAssignees=[];ntmSubtasks=[];ntmRecurring='';
  var rt=document.getElementById('nRecurringToggle');if(rt)rt.checked=false;
  var rp=document.getElementById('nRecurringPanel');if(rp)rp.style.display='none';
  document.querySelectorAll('.nrec-btn').forEach(function(b){b.style.background='#fff';b.style.color='#64748B';b.style.borderColor='#E2E8F0';});
  var rpr=document.getElementById('nRecurringPreview');if(rpr)rpr.style.display='none';
  // Reset to details tab
  switchNTabById('ntab-details');
  // Set min date
  var due=document.getElementById('nDue');if(due)due.min=window.KIB_CALENDAR?KIB_CALENDAR.minDueDate():UTILS.today();
  // Load/render
  renderNSubtasks();
  renderNSelectedPills();
  // Load users - show loading state then render
  if(ntmAllUsers.length>0){
    renderNAssigneeList('');
  } else {
    // Show loading state in list
    var al=document.getElementById('nAssigneeList');
    if(al)al.innerHTML='<div style="padding:16px;text-align:center;color:#94A3B8;font-size:13px">Loading staff...</div>';
    loadNtmUsers();
  }
}

function closeNewTaskModal(){
  document.getElementById('newTaskModal').style.display='none';
}

// Tab switching
function switchNTab(btn){
  var tabId=btn.dataset.tab;
  document.querySelectorAll('[id^="ntab-"]').forEach(function(b){
    b.style.borderBottomColor='transparent';b.style.color='rgba(255,255,255,.45)';b.style.fontWeight='500';
  });
  btn.style.borderBottomColor='#60A5FA';btn.style.color='#fff';btn.style.fontWeight='700';
  document.querySelectorAll('[id^="npanel-"]').forEach(function(p){p.style.display='none';});
  var pid='npanel-'+tabId.replace('ntab-','');
  var panel=document.getElementById(pid);
  if(panel)panel.style.display='block';
  // If switching to assignees and list is empty, reload
  if(tabId==='ntab-assignees'){
    if(ntmAllUsers.length===0){loadNtmUsers();}
    else{renderNAssigneeList('');}
  }
}
function switchNTabById(id){switchNTab(document.getElementById(id));}

// Load users once — deferred so KIB_HIERARCHY and S are ready
function loadNtmUsers(){
  var _sess = AUTH.getSession();
  if(!_sess){setTimeout(loadNtmUsers,300);return;}
  var myId = _sess.user_id;
  API.get('users_list',{}).then(function(d){
    var allUsers=(d.users||[]).filter(function(u){return u&&u.user_id&&u.active_status!=='inactive';});
    if(!allUsers.length){
      // Fallback: build list from KIB_HIERARCHY if API fails
      if(window.KIB_HIERARCHY&&KIB_HIERARCHY.users){
        ntmAllUsers=Object.values(KIB_HIERARCHY.users).filter(function(u){return u&&u.user_id;});
      } else { ntmAllUsers=[]; }
      renderNAssigneeList('');
      return;
    }
    var assignable=(window.KIB_HIERARCHY&&myId)?KIB_HIERARCHY.getAssignableUserIds(myId):[];
    if(assignable.length>0){
      ntmAllUsers=allUsers.filter(function(u){return assignable.indexOf(u.user_id)!==-1;}).sort(function(a,b){return(a.full_name||'').localeCompare(b.full_name||'');});
    } else {
      ntmAllUsers=allUsers.sort(function(a,b){return(a.full_name||'').localeCompare(b.full_name||'');});
    }
    renderNAssigneeList('');
  }).catch(function(e){
    console.error('users_list failed:',e);
    // Fallback from hierarchy
    if(window.KIB_HIERARCHY&&KIB_HIERARCHY.users){
      ntmAllUsers=Object.values(KIB_HIERARCHY.users).filter(function(u){return u&&u.user_id;});
    } else { ntmAllUsers=[]; }
    renderNAssigneeList('');
  });
}
setTimeout(loadNtmUsers,500);

// Assignee list
function renderNAssigneeList(query){
  var list=document.getElementById('nAssigneeList');
  if(!list)return;
  if(ntmAllUsers.length===0){
    list.innerHTML='<div style="padding:16px;text-align:center;color:#94A3B8;font-size:13px"><div style="width:20px;height:20px;border:2px solid #E2E8F0;border-top-color:#1A4A7A;border-radius:50%;animation:ntmSpin .8s linear infinite;margin:0 auto 8px"></div>Loading staff...</div>';
    // Retry with increasing backoff
    var _retryMs = (renderNAssigneeList._retryCount||0) < 3 ? 600 : 2000;
    renderNAssigneeList._retryCount = (renderNAssigneeList._retryCount||0)+1;
    if(ntmAllUsers.length===0){loadNtmUsers();setTimeout(function(){renderNAssigneeList(query);},_retryMs);}
    return;
  }
  var q=(query||'').toLowerCase();
  var filtered=q?ntmAllUsers.filter(function(u){return(u.full_name||'').toLowerCase().includes(q)||(u.role||'').toLowerCase().includes(q);}):ntmAllUsers;
  if(filtered.length===0){list.innerHTML='<div style="padding:12px;text-align:center;color:#94A3B8;font-size:13px">No staff found</div>';return;}
  var html='';
  filtered.forEach(function(u){
    var sel=ntmAssignees.some(function(a){return a.user_id===u.user_id;});
    var ac=UTILS.avc(u.full_name);
    html+='<div class="nrow" data-uid="'+u.user_id+'" style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;background:'+(sel?'#EFF6FF':'#fff')+';border:1.5px solid '+(sel?'#BFDBFE':'transparent')+';transition:all .15s;margin-bottom:2px">';
    html+='<div style="width:34px;height:34px;border-radius:50%;background:'+ac+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0">'+UTILS.ini(u.full_name)+'</div>';
    html+='<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#0F172A">'+UTILS.esc(u.full_name)+'</div><div style="font-size:11px;color:#94A3B8">'+UTILS.esc(u.role||'')+'</div></div>';
    if(sel)html+='<div style="width:22px;height:22px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="11" height="11" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>';
    html+='</div>';
  });
  list.innerHTML=html;
  list.onclick=function(e){
    var row=e.target.closest('.nrow');if(!row)return;
    var uid=row.dataset.uid;
    var user=ntmAllUsers.find(function(u){return u.user_id===uid;});if(!user)return;
    var idx=ntmAssignees.findIndex(function(a){return a.user_id===uid;});
    if(idx>-1)ntmAssignees.splice(idx,1);else ntmAssignees.push({user_id:user.user_id,name:user.full_name,role:user.role});
    renderNAssigneeList(document.getElementById('nAssigneeSearch').value);
    renderNSelectedPills();
  };
}
function filterNAssignees(q){renderNAssigneeList(q);}

function renderNSelectedPills(){
  var wrap=document.getElementById('nSelectedAssignees');
  var count=document.getElementById('nAssigneeCount');
  var badge=document.getElementById('ntabAssigneeBadge');
  if(!wrap)return;
  if(ntmAssignees.length===0){
    wrap.innerHTML='<div style="color:#CBD5E1;font-size:13px;padding:4px">None selected — pick from list above</div>';
    if(count)count.textContent='0 assignees';
    if(badge)badge.style.display='none';
    return;
  }
  var html='';
  ntmAssignees.forEach(function(a){
    var ac=UTILS.avc(a.name);
    html+='<div class="npill" data-uid="'+a.user_id+'" style="display:inline-flex;align-items:center;gap:5px;background:#EFF6FF;border:1.5px solid #BFDBFE;color:#1E40AF;border-radius:20px;padding:5px 10px 5px 5px;font-size:12px;font-weight:600">';
    html+='<div style="width:22px;height:22px;border-radius:50%;background:'+ac+';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff">'+UTILS.ini(a.name)+'</div>';
    html+=UTILS.esc(a.name.split(' ')[0]);
    html+='<span class="npill-rm" style="cursor:pointer;opacity:.5;font-size:15px;line-height:1;margin-left:3px">×</span>';
    html+='</div>';
  });
  wrap.innerHTML=html;
  if(count)count.textContent=ntmAssignees.length+' assignee'+(ntmAssignees.length!==1?'s':'');
  if(badge){badge.textContent=ntmAssignees.length;badge.style.display='inline';}
  wrap.onclick=function(e){
    var btn=e.target.closest('.npill-rm');if(!btn)return;
    var pill=btn.closest('.npill');if(!pill)return;
    ntmAssignees=ntmAssignees.filter(function(a){return a.user_id!==pill.dataset.uid;});
    renderNAssigneeList(document.getElementById('nAssigneeSearch').value);
    renderNSelectedPills();
  };
}

// Sub-tasks
function addNSubtask(){
  var inp=document.getElementById('nSubtaskInput');
  var val=(inp.value||'').trim();if(!val)return;
  ntmSubtasks.push({title:val});inp.value='';inp.focus();
  renderNSubtasks();
}

function renderNSubtasks(){
  var list=document.getElementById('nSubtaskList');
  var badge=document.getElementById('ntabSubBadge');
  if(!list)return;
  if(badge){badge.textContent=ntmSubtasks.length;badge.style.display=ntmSubtasks.length?'inline':'none';}
  if(ntmSubtasks.length===0){
    list.innerHTML='<div style="text-align:center;padding:20px;color:#CBD5E1;font-size:13px">No sub-tasks yet — add one below</div>';
    return;
  }
  var html='';
  ntmSubtasks.forEach(function(st,i){
    html+='<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px">';
    html+='<div style="width:22px;height:22px;border-radius:50%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#64748B;flex-shrink:0">'+(i+1)+'</div>';
    html+='<div style="flex:1;font-size:13px;font-weight:600;color:#0F172A">'+UTILS.esc(st.title)+'</div>';
    html+='<button class="nrm-sub" data-idx="'+i+'" style="background:#FEF2F2;border:none;border-radius:6px;width:24px;height:24px;cursor:pointer;color:#EF4444;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1">×</button>';
    html+='</div>';
  });
  list.innerHTML=html;
  list.onclick=function(e){
    var btn=e.target.closest('.nrm-sub');if(!btn)return;
    var idx=parseInt(btn.dataset.idx);
    if(!isNaN(idx)){ntmSubtasks.splice(idx,1);renderNSubtasks();}
  };
}

// Recurring
function toggleNRecurring(on){
  document.getElementById('nRecurringPanel').style.display=on?'':'none';
  if(!on){ntmRecurring='';document.querySelectorAll('.nrec-btn').forEach(function(b){b.style.background='#fff';b.style.color='#64748B';b.style.borderColor='#E2E8F0';});}
}
function setNRecurring(btn){
  ntmRecurring=btn.dataset.r;
  document.querySelectorAll('.nrec-btn').forEach(function(b){
    var active=b.dataset.r===ntmRecurring;
    b.style.background=active?'linear-gradient(135deg,#1E3A6E,#1A4A7A)':'#fff';
    b.style.color=active?'#fff':'#64748B';
    b.style.borderColor=active?'#1A4A7A':'#E2E8F0';
  });
  var labels={daily:'Every day',weekly:'Every week',monthly:'Every month'};
  var prev=document.getElementById('nRecurringPreview');
  prev.textContent='↺ '+(labels[ntmRecurring]||'')+' — a new task will be created automatically';
  prev.style.display='';
}

// Submit
async function submitNewTask(){
  var title=(document.getElementById('nTitle').value||'').trim();
  var cat=document.getElementById('nCat').value;
  var pri=document.getElementById('nPri').value;
  var due=document.getElementById('nDue').value;
  var sv=document.getElementById('nSV').value;
  var su=document.getElementById('nSU').value;
  if(!title){UTILS.toast('Please enter a task title','error');switchNTabById('ntab-details');return;}
  if(!cat){UTILS.toast('Please select a category','error');switchNTabById('ntab-details');return;}
  if(!pri){UTILS.toast('Please select a priority','error');switchNTabById('ntab-details');return;}
  // SLA auto-defaults to 4 days
  // If no assignees selected, self-assign
  if(ntmAssignees.length===0){
    var _s=AUTH.getSession()||{};
    ntmAssignees=[{user_id:_s.user_id,name:_s.full_name,role:_s.role,team:_s.team}];
  }
  if(document.getElementById('nRecurringToggle').checked&&!ntmRecurring){UTILS.toast('Please select a recurring frequency','error');switchNTabById('ntab-recurring');return;}
  var btn=document.getElementById('nSubmitBtn');
  if(btn){btn.disabled=true;btn.textContent='Creating...';}
  try{
    var d=await API.post('tasks_create',{
      title:title,description:document.getElementById('nDesc').value,
      category:cat,priority:pri,due_date:due||'',sla_value:sv,sla_unit:su,
      assignees_json:JSON.stringify(ntmAssignees),
      subtasks_json:JSON.stringify(ntmSubtasks),
      recurring_flag:document.getElementById('nRecurringToggle').checked?'TRUE':'FALSE',
      recurring_type:ntmRecurring||''
    });
    var taskId=(d&&d.task_id)?d.task_id:'';
    UTILS.toast(taskId?'Task '+taskId+' created ✓':'Task created ✓','success');
    closeNewTaskModal();
    loadT();
// Auto-open new task modal if navigated from dashboard
if(window.location.hash==='#new'){try{if(AUTH.canDo&&AUTH.canDo('tasks.create'))setTimeout(openNewTaskModal,600);}catch(e){}}
  }catch(ex){if(btn){btn.disabled=false;btn.textContent='✓ Create Task';}UTILS.toast('Error: '+(ex.message||'Unknown error'),'error');return;}
  if(btn){btn.disabled=false;btn.textContent='✓ Create Task';}
}

// Close on backdrop click
document.addEventListener('DOMContentLoaded',function(){
  var m=document.getElementById('newTaskModal');
  if(m)m.addEventListener('click',function(e){if(e.target===this)closeNewTaskModal();});
});

// Close modal on backdrop click — deferred so element exists
document.addEventListener('DOMContentLoaded', function(){
  var m = document.getElementById('taskModal');
  if(m) m.addEventListener('click', function(e){ if(e.target===this) closeTaskModal(); });
});
loadT();

// Background data refresh every 2min (uses cache — no visible loading)
(function() {
  var _bgKey = '_bg_tasks';
  if(window[_bgKey]) clearInterval(window[_bgKey]);
  window[_bgKey] = setInterval(function(){
    if (!document.hidden) loadT();
  }, 180000);
  // Re-render on orientation change (mobile ↔ desktop)
  window.addEventListener('resize', function(){
    if (allT && allT.length) renderBoard();
  });
  // Refresh when tab becomes visible again
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden) loadT();
  });
})();
// Auto-open new task modal if navigated from dashboard
if(window.location.hash==='#new'){try{if(AUTH.canDo&&AUTH.canDo('tasks.create'))setTimeout(openNewTaskModal,600);}catch(e){}}


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


function refreshData(){
  CACHE.clear();
  var icon = document.getElementById('refreshIcon');
  if(icon) icon.style.animation='spin .6s linear infinite';
  loadT();loadBell();
  setTimeout(function(){if(icon)icon.style.animation='';},800);
}

async function markSubtask(sid) {
  try {
    await API.post('subtask_mark', {subtask_id: sid});
    if (currentTask) {
      var t = currentTask.task || currentTask;
      var d = await API.get('tasks_detail', {task_id: t.task_id});
      currentTask = d; renderTaskModal(d);
    }
  } catch(ex) { UTILS.toast('Error: ' + ex.message, 'error'); }
}

async function addComment() {
  var inp = document.getElementById('commentInput');
  if (!inp || !inp.value.trim()) return;
  var msg = inp.value.trim();
  if (!currentTask) return;
  var t = currentTask.task || currentTask;
  try {
    inp.value = '';
    await API.post('tasks_comment', {task_id: t.task_id, message: msg});
    var d = await API.get('tasks_detail', {task_id: t.task_id});
    currentTask = d; renderTaskModal(d);
  } catch(ex) { UTILS.toast('Error: ' + ex.message, 'error'); }
}

async function delegateTask() {
  var sel = document.getElementById('delegateSelect');
  if (!sel || !sel.value) { UTILS.toast('Select a person to delegate to', 'warning'); return; }
  if (!currentTask) return;
  var t = currentTask.task || currentTask;
  try {
    var reason = document.getElementById('delegateReason');
    // Get the selected option text to extract the name
    var selectedOpt = sel.options[sel.selectedIndex];
    var delegateName = selectedOpt ? selectedOpt.text.replace(/\s*\([^)]+\)\s*$/, '').trim() : '';
    await API.post('task_delegate', {
      task_id: t.task_id,
      delegate_to_user_id: sel.value,
      delegate_to_name: delegateName,
      reason: reason ? reason.value : ''
    });
    UTILS.toast('Task delegated ✓', 'success');
    closeTaskModal(); loadT();
  } catch(ex) { UTILS.toast('Error: ' + ex.message, 'error'); }
}

async function requestExtension() {
  var inp = document.getElementById('extReason');
  var days = document.getElementById('extDays');
  if (!inp || !inp.value.trim()) { UTILS.toast('Please provide a reason', 'warning'); return; }
  if (!currentTask) return;
  var t = currentTask.task || currentTask;
  try {
    await API.post('task_ext_request', {task_id: t.task_id, reason: inp.value.trim(), requested_days: days?days.value:'1'});
    UTILS.toast('Extension requested ✓', 'success'); if(inp) inp.value='';
  } catch(ex) { UTILS.toast('Error: ' + ex.message, 'error'); }
}

function openNewTaskModal() {
  var m = document.getElementById('newTaskModal');
  if (!m) return;
  m.style.display = 'flex';
  ['nTitle','nDesc','nDue','nSV'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  ['nCat','nPri','nSU'].forEach(function(id){var el=document.getElementById(id);if(el)el.selectedIndex=0;});
  ntmAssignees=[]; ntmSubtasks=[]; ntmRecurring='';
  var rt=document.getElementById('nRecurringToggle'); if(rt)rt.checked=false;
  var rp=document.getElementById('nRecurringPanel'); if(rp)rp.style.display='none';
  document.querySelectorAll('.nrec-btn').forEach(function(b){b.style.background='#fff';b.style.color='#64748B';b.style.borderColor='#E2E8F0';});
  switchNTabById('ntab-details');
  var due=document.getElementById('nDue'); if(due)due.min=window.KIB_CALENDAR?KIB_CALENDAR.minDueDate():UTILS.today();
  renderNAssigneeList(''); renderNSubtasks(); renderNSelectedPills();
}

function closeNewTaskModal() {
  var m = document.getElementById('newTaskModal');
  if (m) m.style.display = 'none';
}

function openTaskModal(d) { renderTaskModal(d); }

// ── INIT ─────────────────────────────────────────────────
loadT();
loadBell();
window._bgTasks = setInterval(loadT, 30000);

// Auto hash
if (window.location.hash === '#new') {
  try { if(AUTH.canDo && AUTH.canDo('tasks.create')) setTimeout(openNewTaskModal, 600); } catch(e){}
}


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

// ── KANBAN TOUCH DRAG ─────────────────────────────────────
(function() {
  var board, startX, scrollStart, isDragging = false;
  document.addEventListener('touchstart', function(e) {
    board = document.getElementById('kanbanBoard');
    if (!board || !board.contains(e.target)) return;
    startX = e.touches[0].clientX;
    scrollStart = board.scrollLeft;
    isDragging = false;
  }, {passive: true});
  document.addEventListener('touchmove', function(e) {
    if (!board) return;
    var dx = e.touches[0].clientX - startX;
    if (Math.abs(dx) > 5) isDragging = true;
    board.scrollLeft = scrollStart - dx;
  }, {passive: true});
  document.addEventListener('touchend', function() {
    board = null; isDragging = false;
  }, {passive: true});
})();
