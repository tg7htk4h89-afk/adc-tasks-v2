/*
 * ADC Task Manager — archive.js
 * Page-specific logic for tasks-archive.html
 * Requires: auth.js loaded first
 * v2.0
 */

async function loadArchive(){
  try{
    var d = await API.get('tasks_archive',{});
    allTasks = (d.tasks||[]).filter(function(t){return t&&t.task_id;});
    updateStats();
    applyFilters();
  }catch(ex){
    document.getElementById('tasksTbody').innerHTML = '<tr><td colspan="8" style="padding:40px;text-align:center;color:#E5383B">Error loading archive: '+UTILS.esc(ex.message)+'</td></tr>';
  }
}

function updateStats(){
  var completed = allTasks.filter(function(t){return t.status==='Completed';}).length;
  var cancelled = allTasks.filter(function(t){return t.status==='Cancelled';}).length;
  var rate = allTasks.length > 0 ? Math.round(completed/allTasks.length*100) : 0;
  var now = new Date();
  var thisMonth = allTasks.filter(function(t){
    if(!t.completed_at && !t.updated_at) return false;
    var d = new Date(t.completed_at||t.updated_at);
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  }).length;
  // Update ring
  var archRate = allTasks.length > 0 ? Math.round(completed/allTasks.length*100) : 0;
  var archRing = document.getElementById('archRingFill');
  var archPct = document.getElementById('archRingPct');
  if(archRing){ var circ=32*2*Math.PI; archRing.style.strokeDashoffset=circ-(archRate/100)*circ; archRing.setAttribute('stroke-dasharray',circ); }
  if(archPct) archPct.textContent = archRate+'%';
  var _se = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  _se('stCompleted', completed);
  _se('stCancelled', cancelled);
  _se('stRate', rate+'%');
  _se('stThisMonth', thisMonth);
}

function applyFilters(){
  var q = (document.getElementById('searchInp').value||'').toLowerCase();
  var st = document.getElementById('filterStatus').value;
  var pri = document.getElementById('filterPriority').value;
  var cat = document.getElementById('filterCategory').value;
  var mon = document.getElementById('filterMonth').value;

  filtered = allTasks.filter(function(t){
    if(q && !(t.title||'').toLowerCase().includes(q) && !(t.assigned_to_name||'').toLowerCase().includes(q)) return false;
    if(st && t.status !== st) return false;
    if(pri && t.priority !== pri) return false;
    if(cat && t.category !== cat) return false;
    if(mon){
      var d = new Date(t.completed_at||t.updated_at||t.created_at);
      var ym = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      if(ym !== mon) return false;
    }
    return true;
  });

  currentPage = 1;
  renderTable();
}

function renderTable(){
  var tbody = document.getElementById('tasksTbody');
  var count = document.getElementById('tableCount');
  var pagInfo = document.getElementById('pagInfo');

  if(count) count.textContent = filtered.length + ' task' + (filtered.length!==1?'s':'') + ' found';

  if(!filtered.length){
    tbody.innerHTML = '<tr><td colspan="8"><div style="padding:48px;text-align:center;color:#8A9BB0"><svg width="48" height="48" fill="none" stroke="#D0D9E8" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><div style="font-size:14px;font-weight:600;color:#4A5568;margin-bottom:4px">No tasks found</div><div style="font-size:12px">Try adjusting your filters</div></div></td></tr>';
    if(pagInfo) pagInfo.textContent = '';
    renderPagination(0);
    return;
  }

  var totalPages = Math.ceil(filtered.length / pageSize);
  var start = (currentPage-1)*pageSize;
  var page = filtered.slice(start, start+pageSize);

  var PRI_COLOR = {Critical:'#EF4444',High:'#F59E0B',Medium:'#3B82F6',Low:'#10B981'};
  var PRI_BG    = {Critical:'#FEF2F2',High:'#FFFBEB',Medium:'#EFF6FF',Low:'#ECFDF5'};
  var STATUS_COLOR = {Completed:'#0EA472',Cancelled:'#94A3B8'};
  var STATUS_BG    = {Completed:'#ECFDF5',Cancelled:'#F1F5F9'};

  tbody.innerHTML = page.map(function(t){
    var pct = t.status==='Completed' ? 100 : Math.min(100,Number(t.progress_pct||t.progress_percentage||0));
    var closedDate = t.completed_at||t.updated_at||'';
    var dateStr = closedDate ? (function(){
      var d=new Date(closedDate);
      var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear();
    })() : '—';

    var _an = (t.assigned_to_name && t.assigned_to_name !== 'undefined' && t.assigned_to_name !== 'null') ? t.assigned_to_name : null;
    var av = UTILS.av(_an||'?', 28);
    var assignedName = _an || '—';
    var priC = PRI_COLOR[t.priority]||'#64748B';
    var priBg = PRI_BG[t.priority]||'#F8FAFC';
    var stC = STATUS_COLOR[t.status]||'#64748B';
    var stBg = STATUS_BG[t.status]||'#F8FAFC';

    return '<tr style="cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'#FAFCFF\'" onmouseout="this.style.background=\'\'">'
      +'<td style="padding:14px 16px;border-bottom:1px solid #F1F5F9;max-width:240px">'
        +'<div style="font-size:13px;font-weight:600;color:#0A1628;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px">'+UTILS.esc(t.title||'Untitled')+'</div>'
        +'<div style="font-size:10px;color:#B8C5D4;margin-top:2px;font-family:monospace">'+UTILS.esc(t.task_id||'')+'</div>'
      +'</td>'
      +'<td style="padding:14px 16px;border-bottom:1px solid #F1F5F9">'
        +'<div style="display:flex;align-items:center;gap:8px">'+av+'<span style="font-size:12px;font-weight:500;color:#4A5568;white-space:nowrap">'+UTILS.esc(assignedName)+'</span></div>'
      +'</td>'
      +'<td style="padding:14px 16px;border-bottom:1px solid #F1F5F9"><span style="font-size:11px;color:#64748B">'+UTILS.esc(t.category||'—')+'</span></td>'
      +'<td style="padding:14px 16px;border-bottom:1px solid #F1F5F9">'
        +'<span style="font-size:11px;font-weight:700;color:'+priC+';background:'+priBg+';padding:3px 8px;border-radius:10px">'+UTILS.esc(t.priority||'—')+'</span>'
      +'</td>'
      +'<td style="padding:14px 16px;border-bottom:1px solid #F1F5F9">'
        +'<span style="font-size:11px;font-weight:700;color:'+stC+';background:'+stBg+';padding:3px 10px;border-radius:10px">'+UTILS.esc(t.status||'—')+'</span>'
      +'</td>'
      +'<td style="padding:14px 16px;border-bottom:1px solid #F1F5F9">'
        +'<div style="display:flex;align-items:center;gap:8px">'
          +'<div style="flex:1;height:6px;background:#E4EAF3;border-radius:4px;overflow:hidden;min-width:60px">'
            +'<div style="height:100%;width:'+pct+'%;background:'+(pct>=100?'#0EA472':'#3B82F6')+';border-radius:4px"></div>'
          +'</div>'
          +'<span style="font-size:11px;font-weight:700;color:'+(pct>=100?'#0EA472':'#64748B')+'">'+pct+'%</span>'
        +'</div>'
      +'</td>'
      +'<td style="padding:14px 16px;border-bottom:1px solid #F1F5F9;white-space:nowrap"><span style="font-size:12px;color:#64748B">'+dateStr+'</span></td>'
      +'<td style="padding:14px 16px;border-bottom:1px solid #F1F5F9"><span style="font-size:12px;color:#64748B">'+UTILS.esc(t.assigned_by_name||'—')+'</span></td>'
    +'</tr>';
  }).join('');

  if(pagInfo) pagInfo.textContent = 'Showing '+(start+1)+'–'+Math.min(start+pageSize,filtered.length)+' of '+filtered.length;
  renderPagination(totalPages);

  // Switch between table (desktop) and cards (mobile)
  var isMobile = window.innerWidth <= 768;
  var tableWrap = document.querySelector('.arch-table-wrap');
  var cardsWrap = document.getElementById('archCards');
  var paginationWrap = document.getElementById('paginationWrap');

  if (isMobile) {
    if (tableWrap) tableWrap.style.display = 'none';
    if (cardsWrap) cardsWrap.style.display = 'flex';
    if (cardsWrap) cardsWrap.style.flexDirection = 'column';
    renderMobileCards(page);
  } else {
    if (tableWrap) tableWrap.style.display = '';
    if (cardsWrap) cardsWrap.style.display = 'none';
  }
  if (paginationWrap) paginationWrap.style.display = 'flex';
}

function renderMobileCards(page) {
  var cards = document.getElementById('archCards');
  if (!cards) return;
  if (!page || !page.length) { cards.innerHTML = ''; return; }
  var PRI_COLOR = {Critical:'#EF4444',High:'#F59E0B',Medium:'#3B82F6',Low:'#10B981'};
  var PRI_BG    = {Critical:'#FEF2F2',High:'#FFFBEB',Medium:'#EFF6FF',Low:'#ECFDF5'};
  var STA_COLOR = {Completed:'#0EA472',Cancelled:'#94A3B8'};
  var STA_BG    = {Completed:'#ECFDF5',Cancelled:'#F1F5F9'};
  cards.innerHTML = page.map(function(t) {
    var pct = t.status==='Completed' ? 100 : Math.min(100,Number(t.progress_pct||t.progress_percentage||0));
    var priC = PRI_COLOR[t.priority]||'#64748B';
    var priBg = PRI_BG[t.priority]||'#F8FAFC';
    var stC = STA_COLOR[t.status]||'#64748B';
    var stBg = STA_BG[t.status]||'#F8FAFC';
    var av = UTILS.av(t.assigned_to_name||'?', 24);
    var date = (function(){
      var d=t.completed_at||t.updated_at||'';
      if(!d)return '—';
      var dt=new Date(d);
      var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return dt.getDate()+' '+m[dt.getMonth()]+' '+dt.getFullYear();
    })();
    var progColor = pct>=100?'#0EA472':'#3B82F6';
    return '<div class="arch-card">'
      // Header row
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">'
        +'<div style="flex:1;min-width:0">'
          +'<div class="arch-card-title">'+UTILS.esc(t.title||'Untitled')+'</div>'
          +'<div class="arch-card-id">'+UTILS.esc(t.task_id||'')+'</div>'
        +'</div>'
        +'<span style="font-size:11px;font-weight:700;color:'+stC+';background:'+stBg+';padding:4px 10px;border-radius:20px;flex-shrink:0;white-space:nowrap">'+UTILS.esc(t.status||'—')+'</span>'
      +'</div>'
      // Badges row
      +'<div class="arch-card-row">'
        +'<span style="font-size:10px;font-weight:700;color:'+priC+';background:'+priBg+';padding:3px 9px;border-radius:10px;border:1px solid '+priC+'33">'+UTILS.esc(t.priority||'—')+'</span>'
        +(t.category?'<span style="font-size:10px;font-weight:600;color:#1877C5;background:#EBF3FC;padding:3px 9px;border-radius:10px">'+UTILS.esc(t.category)+'</span>':'')
      +'</div>'
      // Progress bar
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
        +'<div style="flex:1;height:5px;background:#EEF1F7;border-radius:5px;overflow:hidden">'
          +'<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+progColor+','+progColor+'cc);border-radius:5px;transition:width .5s ease"></div>'
        +'</div>'
        +'<span style="font-size:11px;font-weight:800;color:'+progColor+';min-width:34px;text-align:right">'+pct+'%</span>'
      +'</div>'
      // Footer
      +'<div class="arch-card-bottom">'
        +av
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:11px;font-weight:600;color:#0A1628;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+UTILS.esc(t.assigned_to_name||'—')+'</div>'
          +'<div style="font-size:10px;color:#8A9BB0">by '+UTILS.esc(t.assigned_by_name||'—')+'</div>'
        +'</div>'
        +'<div style="text-align:right;flex-shrink:0">'
          +'<div style="font-size:11px;font-weight:600;color:#4A5568">'+date+'</div>'
          +'<div style="font-size:10px;color:#B8C5D4">closed</div>'
        +'</div>'
      +'</div>'
    +'</div>';
  }).join('');
}

function renderPagination(total){
  var wrap = document.getElementById('paginationWrap');
  if(!wrap) return;
  if(total <= 1){ wrap.innerHTML=''; return; }
  var html = '<div style="display:flex;align-items:center;gap:6px">';
  html += '<button onclick="goPage('+(currentPage-1)+')" '+(currentPage<=1?'disabled':'')+' style="padding:6px 12px;border:1.5px solid #E4EAF3;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#4A5568;transition:all .15s"'+(currentPage<=1?' disabled':'')+'">← Prev</button>';
  for(var i=1;i<=total;i++){
    if(i===currentPage) html+='<button style="padding:6px 12px;border:none;border-radius:8px;background:#1877C5;color:#fff;font-size:12px;font-weight:700;cursor:default">'+i+'</button>';
    else html+='<button onclick="goPage('+i+')" style="padding:6px 12px;border:1.5px solid #E4EAF3;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#4A5568;transition:all .15s">'+i+'</button>';
  }
  html += '<button onclick="goPage('+(currentPage+1)+')" '+(currentPage>=total?'disabled':'')+' style="padding:6px 12px;border:1.5px solid #E4EAF3;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#4A5568">Next →</button>';
  html += '</div>';
  wrap.innerHTML = html;
}

function goPage(p){
  var total = Math.ceil(filtered.length/pageSize);
  currentPage = Math.max(1,Math.min(p,total));
  renderTable();
  window.scrollTo({top:0,behavior:'smooth'});
}

// Init
loadBell();
loadArchive();

// Handle resize — re-render on orientation change
window.addEventListener('resize', function(){
  if(filtered && filtered.length) renderTable();
});

setInterval(loadBell, 60000);

// ── MOBILE MORE SHEET ────────────────────────────────────
function toggleMobileMore() {
  var sheet = document.getElementById('mobileMoreSheet');
  var overlay = document.getElementById('mobileMoreOverlay');
  var isOpen = sheet.style.transform === 'translateY(0px)' || sheet.style.transform === 'translateY(0%)' || sheet.style.transform === 'translateY(0)';
  if (isOpen) { closeMobileMore(); }
  else { openMobileMore(); }
}
function openMobileMore() {
  var sheet = document.getElementById('mobileMoreSheet');
  var overlay = document.getElementById('mobileMoreOverlay');
  var btn = document.getElementById('btnMobileMore');
  sheet.style.display = 'block';
  overlay.style.display = 'block';
  if (btn) btn.classList.add('active');
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      sheet.style.transform = 'translateY(0)';
      sheet.style.transition = 'transform .3s cubic-bezier(.32,0,.67,0)';
    });
  });
  // Fill user info
  var s = AUTH.getSession() || {};
  if (s.full_name) {
    var ini = s.full_name.split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
    var av = document.getElementById('moreAvatar'); if(av) av.textContent = ini;
    var nm = document.getElementById('moreName'); if(nm) nm.textContent = s.full_name;
    var rl = document.getElementById('moreRole'); if(rl) rl.textContent = s.role || '';
    var dp = document.getElementById('moreDept'); if(dp) dp.textContent = s.department || 'KIB';
  }
}
function closeMobileMore() {
  var sheet = document.getElementById('mobileMoreSheet');
  var overlay = document.getElementById('mobileMoreOverlay');
  var btn = document.getElementById('btnMobileMore');
  sheet.style.transform = 'translateY(100%)';
  if (btn) btn.classList.remove('active');
  setTimeout(function(){
    sheet.style.display = 'none';
    overlay.style.display = 'none';
  }, 300);
}
