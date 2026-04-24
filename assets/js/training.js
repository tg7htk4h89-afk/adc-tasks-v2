/*
 * ADC Task Manager — training.js
 * Page-specific logic for training.html
 * Requires: auth.js loaded first
 * v2.0
 */

async function loadT() {
  curSess = AUTH.getSession();
  if(!curSess){ AUTH.requireAuth(); return; }

  // Init sidebar
  var ai = document.getElementById('avatarInitials');
  var sn = document.getElementById('sidebarName');
  var sr = document.getElementById('sidebarRole');
  if(ai) ai.textContent = UTILS.ini(curSess.full_name);
  if(sn) sn.textContent = curSess.full_name || '';
  if(sr) sr.textContent = curSess.role || '';

  // Role-based: show New Plan button for managers
  var roles = ['HoD','Manager','CC Manager','QA Manager','DGM'];
  var btnNew = document.getElementById('btnNewPlan');
  if(btnNew && roles.indexOf(curSess.role) !== -1) btnNew.style.display = 'flex';

  var pl = document.getElementById('planList');
  var loading = document.getElementById('planLoading');

  try {
    var statusFilter = document.getElementById('tSt');
    var p = {};
    if(statusFilter && statusFilter.value) p.status = statusFilter.value;

    var d = await API.get('training_list', p);
    allPlans = d.plans || [];
    renderPlans(allPlans);
  } catch(ex) {
    if(pl) pl.innerHTML = '<div style="padding:40px;text-align:center;color:#E5383B;font-size:13px">⚠ Failed to load training plans: ' + UTILS.esc(ex.message) + '</div>';
  }
}

function renderPlans(plans) {
  var pl = document.getElementById('planList');
  if(!pl) return;

  // Update hero stats
  var total = plans.length;
  var active = plans.filter(function(p){ return p.status === 'InProgress' || p.status === 'Assigned'; }).length;
  var delayed = plans.filter(function(p){ return p.status === 'Delayed'; }).length;
  var done = plans.filter(function(p){ return p.status === 'Completed'; }).length;
  var pct = total ? Math.round(done/total*100) : 0;

  var setEl = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  setEl('tA', active);
  setEl('tD', delayed);
  setEl('tC', done);
  setEl('tP', total);
  setEl('trainRingPct', pct + '%');
  var fill = document.getElementById('trainRingFill');
  if(fill) fill.style.strokeDashoffset = 201 - (201 * pct / 100);

  if(!plans.length) {
    pl.innerHTML = '<div style="padding:48px 24px;text-align:center;border:2px dashed #E4EAF3;border-radius:16px;background:#FAFCFF"><div style="font-size:32px;margin-bottom:12px;opacity:.5">📋</div><div style="font-size:14px;font-weight:700;color:#4A5568;margin-bottom:6px">No training plans found</div><div style="font-size:12px;color:#8A9BB0">Create a new plan to get started</div></div>';
    return;
  }

  var STATUS_COLOR = { InProgress:'#1D4ED8', Assigned:'#1D4ED8', Delayed:'#B45309', Completed:'#065F46', Cancelled:'#64748B' };
  var STATUS_BG    = { InProgress:'#EFF6FF', Assigned:'#EFF6FF', Delayed:'#FFFBEB', Completed:'#ECFDF5', Cancelled:'#F8FAFC' };
  var PRI_COLOR    = { Critical:'#DC2626', High:'#D97706', Medium:'#2563EB', Low:'#16A34A' };
  var PRI_BG       = { Critical:'#FEF2F2', High:'#FFFBEB', Medium:'#EFF6FF', Low:'#F0FDF4' };
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  pl.innerHTML = plans.map(function(plan) {
    var pct = Math.min(100, Number(plan.completion_pct || 0));
    var stC  = STATUS_COLOR[plan.status] || '#64748B';
    var stBg = STATUS_BG[plan.status]   || '#F8FAFC';
    var priC  = PRI_COLOR[plan.priority] || '#64748B';
    var priBg = PRI_BG[plan.priority]   || '#F8FAFC';
    var tr = UTILS.tr(plan.deadline);

    var deadlineStr = '—';
    if(plan.deadline) {
      var dd = new Date(plan.deadline);
      deadlineStr = dd.getDate() + ' ' + months[dd.getMonth()] + ' ' + dd.getFullYear();
    }

    var progColor = pct >= 100 ? '#0EA472' : (plan.status === 'Delayed' ? '#F59E0B' : '#1877C5');
    var done = Number(plan.done_count || plan.completed_agents || 0);
    var total = Number(plan.total_agents || 1);

    return '<div class="plan-card" data-pid="' + (plan.training_id||'') + '" onclick="openPlanCard(this.dataset.pid)" style="cursor:pointer">'
      // Top row: title + status
      + '<div class="plan-header">'
        + '<div style="flex:1;min-width:0">'
          + '<div class="plan-title">' + UTILS.esc(plan.title || 'Untitled') + '</div>'
          + '<div class="plan-sub">' + UTILS.esc(plan.category || '') + (plan.target_type ? ' · ' + UTILS.esc(plan.target_type) : '') + '</div>'
        + '</div>'
        + '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">'
          + '<span style="font-size:11px;font-weight:700;color:' + stC + ';background:' + stBg + ';padding:4px 12px;border-radius:20px;white-space:nowrap">' + UTILS.esc(plan.status || '—') + '</span>'
          + (plan.priority ? '<span style="font-size:10px;font-weight:700;color:' + priC + ';background:' + priBg + ';padding:3px 9px;border-radius:10px">' + UTILS.esc(plan.priority) + '</span>' : '')
        + '</div>'
      + '</div>'
      // Progress section
      + '<div style="margin-bottom:14px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
          + '<span style="font-size:11px;color:#8A9BB0;font-weight:600">Progress — ' + done + ' / ' + total + ' agents</span>'
          + '<span style="font-size:12px;font-weight:800;color:' + progColor + '">' + pct + '%</span>'
        + '</div>'
        + '<div style="height:6px;background:#EEF1F7;border-radius:6px;overflow:hidden">'
          + '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + progColor + ',' + progColor + 'cc);border-radius:6px;transition:width .5s ease"></div>'
        + '</div>'
      + '</div>'
      // Footer
      + '<div class="plan-footer">'
        + UTILS.av(plan.created_by_name || '?', 26)
        + '<span style="font-size:11px;color:#4A5568;font-weight:600">by ' + UTILS.esc(plan.created_by_name || '—') + '</span>'
        + '<div style="margin-left:auto;display:flex;align-items:center;gap:6px">'
          + '<svg width="12" height="12" fill="none" stroke="' + tr.color + '" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
          + '<span style="font-size:11px;font-weight:700;color:' + tr.color + '">' + UTILS.esc(deadlineStr) + '</span>'
        + '</div>'
      + '</div>'
    + '</div>';
  }).join('');
}

// Filter change
var filterEl = document.getElementById('tSt');
if(filterEl) filterEl.addEventListener('change', loadT);

// Open card detail modal
function openPlanCard(id) {
  var modal = document.getElementById('cardModal');
  var body  = document.getElementById('cardBody');
  if(!modal || !body) return;
  modal.style.display = 'flex';
  body.innerHTML = '<div style="padding:40px;text-align:center;color:#8A9BB0"><div style="width:28px;height:28px;border:3px solid #E4EAF3;border-top-color:#1877C5;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 12px"></div>Loading plan details...</div>';

  API.get('training_detail', { training_id: id }).then(function(d) {
    var plan = d.plan || {};
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var fmt = function(dt){ if(!dt)return '—'; var dd=new Date(dt); return dd.getDate()+' '+months[dd.getMonth()]+' '+dd.getFullYear(); };
    var pct = Math.min(100, Number(plan.completion_pct || 0));
    var STATUS_COLOR = { InProgress:'#1D4ED8', Delayed:'#B45309', Completed:'#065F46', Assigned:'#1D4ED8', Cancelled:'#64748B' };
    var STATUS_BG    = { InProgress:'#EFF6FF', Delayed:'#FFFBEB', Completed:'#ECFDF5', Assigned:'#EFF6FF', Cancelled:'#F8FAFC' };
    var stC  = STATUS_COLOR[plan.status] || '#64748B';
    var stBg = STATUS_BG[plan.status]   || '#F8FAFC';
    var progColor = pct >= 100 ? '#0EA472' : '#1877C5';

    body.innerHTML = '<div style="padding:28px 28px 24px">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px">'
        + '<div>'
          + '<div style="font-size:9px;font-weight:800;color:#8A9BB0;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">' + UTILS.esc(plan.category || 'Training') + '</div>'
          + '<div style="font-size:20px;font-weight:900;color:#0A1628;line-height:1.3;letter-spacing:-.3px">' + UTILS.esc(plan.title || 'Training Plan') + '</div>'
        + '</div>'
        + '<span style="font-size:12px;font-weight:700;color:' + stC + ';background:' + stBg + ';padding:5px 14px;border-radius:20px;white-space:nowrap;flex-shrink:0">' + UTILS.esc(plan.status || '—') + '</span>'
      + '</div>'
      + (plan.description ? '<div style="font-size:13px;color:#4A5568;line-height:1.6;margin-bottom:20px;padding:14px 16px;background:#F8FAFC;border-radius:12px;border:1px solid #E4EAF3">' + UTILS.esc(plan.description) + '</div>' : '')
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">'
        + '<div style="background:#F8FAFC;border:1px solid #E4EAF3;border-radius:12px;padding:14px">'
          + '<div style="font-size:10px;font-weight:700;color:#8A9BB0;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">Deadline</div>'
          + '<div style="font-size:14px;font-weight:700;color:#0A1628">' + fmt(plan.deadline) + '</div>'
        + '</div>'
        + '<div style="background:#F8FAFC;border:1px solid #E4EAF3;border-radius:12px;padding:14px">'
          + '<div style="font-size:10px;font-weight:700;color:#8A9BB0;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">Agents</div>'
          + '<div style="font-size:14px;font-weight:700;color:#0A1628">' + UTILS.esc(String(plan.done_count || 0)) + ' / ' + UTILS.esc(String(plan.total_agents || '—')) + ' completed</div>'
        + '</div>'
      + '</div>'
      + '<div style="margin-bottom:20px">'
        + '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'
          + '<span style="font-size:11px;font-weight:700;color:#4A5568">Overall Progress</span>'
          + '<span style="font-size:13px;font-weight:900;color:' + progColor + '">' + pct + '%</span>'
        + '</div>'
        + '<div style="height:8px;background:#EEF1F7;border-radius:8px;overflow:hidden">'
          + '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + progColor + ',' + progColor + 'cc);border-radius:8px;transition:width .5s ease"></div>'
        + '</div>'
      + '</div>'
      + '<div style="border-top:1px solid #F0F4F9;padding-top:16px;display:flex;align-items:center;gap:10px">'
        + UTILS.av(plan.created_by_name || '?', 30)
        + '<div>'
          + '<div style="font-size:12px;font-weight:700;color:#0A1628">' + UTILS.esc(plan.created_by_name || '—') + '</div>'
          + '<div style="font-size:10px;color:#8A9BB0">Created ' + fmt(plan.created_at) + '</div>'
        + '</div>'
      + '</div>'
    + '</div>';
  }).catch(function(ex) {
    body.innerHTML = '<div style="padding:32px;text-align:center;color:#E5383B">⚠ ' + UTILS.esc(ex.message) + '</div>';
  });
}

function closeCard() {
  var modal = document.getElementById('cardModal');
  if(modal) modal.style.display = 'none';
}

// Init
AUTH.requireAuth();
loadT();
