/*
 * ADC Task Manager — auth.js
 * Shared across ALL pages. Include FIRST before any page script.
 * Contains: API_BASE, SES_KEY, API client, AUTH, UTILS, cleanName, KIB_HIERARCHY
 * v2.0
 */

var API_BASE='https://n8n.kib-cc-wfm.com/webhook';
var SES_KEY='kib_ops_session';
var API={
  _t:function(){var s=AUTH.getSession();return s?s.session_token:null;},
  post:async function(action,body){
    var path=action.replace(/_/g,'-');
    var url=API_BASE+'/kib/'+path;
    var p=Object.assign({},body||{});
    var t=this._t();if(t)p.session_token=t;
    var r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
    var txt=await r.text();var d;
    try{d=JSON.parse(txt);}catch(e){throw new Error('Server '+r.status+': '+(txt||'empty').slice(0,120));}
    if(!d.success)throw new Error(d.error&&d.error.message?d.error.message:d.message||'API error');
    return d.data;
  },
  get:async function(action,params){return this.post(action,params||{});}
};
var AUTH={
  getSession:function(){try{var s=JSON.parse(localStorage.getItem(SES_KEY));return s&&new Date(s.expires_at)>new Date()?s:null;}catch(e){return null;}},
  requireAuth:function(){if(!this.getSession())window.location.href='/login.html';},
  logout:function(){localStorage.removeItem(SES_KEY);window.location.href='/login.html';},
  hasRole:function(r){var s=this.getSession();if(!s)return false;return Array.isArray(r)?r.indexOf(s.role)!==-1:s.role===r;},
  canDo:function(a){var s=this.getSession();if(!s)return false;var m={'tasks.create':['HoD','Manager','DGM','DataEntry','QA Manager'],'handover.create':['HoD','Manager','TL','AL'],'training.create':['HoD','Manager','QA Manager'],'sales.entry':['HoD','Manager','TL','AL'],'settings.edit':['HoD','DGM']};if(a==='tasks.create'&&window.KIB_HIERARCHY){return KIB_HIERARCHY.canCreateTask(s.role);}return m[a]?m[a].indexOf(s.role)!==-1:true;},
  getUserId:function(){var s=this.getSession();return s?s.user_id:null;},
  getRole:function(){var s=this.getSession();return s?s.role:'';}
};
var UTILS={
  esc:function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');},
  fdt:function(iso){if(!iso)return'—';try{var d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}catch(e){return String(iso).slice(0,16);}},
  fd:function(iso){if(!iso)return'—';try{return new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return String(iso).slice(0,10);}},
  today:function(){return new Date(Date.now()+3*3600000).toISOString().slice(0,10);},
  tr:function(iso){
    if(!iso)return{label:'—',overdue:false,diffMs:0};
    var diff=new Date(iso)-Date.now();
    var abs=Math.abs(diff);
    var label=abs<3600000?Math.floor(abs/60000)+'m':abs<86400000?Math.floor(abs/3600000)+'h':Math.floor(abs/86400000)+'d';
    var isOv=window.KIB_CALENDAR?KIB_CALENDAR.isOverdue(iso,'active'):diff<0;
    return{label:diff<0?label+' over':label+' left',overdue:isOv,diffMs:diff};
  },
  ini:function(n){return String(n||'?').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();},
  _avc:[['#3B82F6','#fff'],['#8B5CF6','#fff'],['#10B981','#fff'],['#F59E0B','#fff'],['#EC4899','#fff'],['#0EA472','#fff'],['#EF4444','#fff'],['#6366F1','#fff'],['#14B8A6','#fff'],['#F97316','#fff']],
  avc:function(n){var h=0,s=String(n||'');for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))&0xffff;return this._avc[h%this._avc.length];},
  av:function(n,sz){sz=sz||28;var c=this.avc(n);return'<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+c[0]+';color:'+c[1]+';display:flex;align-items:center;justify-content:center;font-size:'+Math.round(sz*.38)+'px;font-weight:700;flex-shrink:0">'+this.ini(n)+'</div>';},
  toast:function(msg,type){var c={success:'#0EA472',error:'#E5383B',warning:'#F4A523',info:'#1877C5'};var t=document.createElement('div');t.style.cssText='position:fixed;bottom:20px;right:20px;background:#0D1B3E;color:#fff;padding:12px 18px;border-radius:10px;font-size:13px;border-left:3px solid '+(c[type]||c.info)+';box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:9999;max-width:340px;font-family:inherit';t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove();},3500);},
  empty:function(id,title,sub){var el=document.getElementById(id);if(!el)return;el.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;padding:40px 20px;color:#8A9BB0;text-align:center;gap:8px"><svg width="36" height="36" fill="none" stroke="#B8C5D4" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg><div style="font-size:13px;font-weight:600;color:#4A5568">'+(title||'No data')+'</div>'+(sub?'<div style="font-size:11px">'+sub+'</div>':'')+'</div>';},
  loader:function(id){var el=document.getElementById(id);if(!el)return;el.innerHTML='<div style="padding:20px;display:flex;flex-direction:column;gap:10px"><div style="height:44px;background:linear-gradient(90deg,#F0F4F9 25%,#E4EAF3 50%,#F0F4F9 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;border-radius:8px"></div><div style="height:44px;background:linear-gradient(90deg,#F0F4F9 25%,#E4EAF3 50%,#F0F4F9 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;border-radius:8px"></div></div>';},
  setUser:function(s){
    if(!s)return;
    // Support both sidebar HTML structures
    var i=document.getElementById('avatarInitials')||document.querySelector('.user-avatar');
    var n=document.getElementById('sidebarName')||document.querySelector('.user-name');
    var r=document.getElementById('sidebarRole')||document.querySelector('.user-role');
    if(i)i.textContent=this.ini(s.full_name);
    if(n)n.textContent=s.display_name||s.full_name.split(' ')[0];
    if(r)r.textContent=s.role;
    document.querySelectorAll('[data-roles]').forEach(function(el){
      if(el.getAttribute('data-roles').split(',').map(function(x){return x.trim();}).indexOf(s.role)===-1)el.style.display='none';
    });
  },
  sidebar:function(){var btn=document.getElementById('sidebarToggle'),sb=document.getElementById('sidebar'),ov=document.getElementById('sidebarOverlay');if(btn&&sb){btn.addEventListener('click',function(){sb.classList.toggle('open');if(ov)ov.style.display=sb.classList.contains('open')?'block':'none';});}}
};




// ── NAME SANITIZER ─────────────────────────────────────────
// Guards against literal 'undefined' stored by old bad delegate writes
function cleanName(n){ return (n && n !== 'undefined' && n !== 'null') ? n : ''; }

var KIB_HIERARCHY = {

  // ── USER TREE ─────────────────────────────────────────────────
  // reports_to maps: user_id → parent user_id
  reports_to: {
    'USR-001': 'USR-013', // Talal → Nawaf
    'USR-002': 'USR-001', // Taher → Talal
    'USR-003': 'USR-002', // Shouq → Taher
    'USR-004': 'USR-002', // Alanoud → Taher
    'USR-005': 'USR-002', // Mohammad Alothman → Taher
    'USR-006': 'USR-004', // Hasan → Alanoud
    'USR-007': 'USR-003', // Naser → Shouq
    'USR-008': 'USR-002', // Abdulrahman → Taher
    'USR-009': 'USR-002', // Nourah → Taher
    'USR-010': 'USR-011', // Badreyah → Fatmah
    'USR-011': 'USR-012', // Fatmah → Mohammad Abdulraheem
    'USR-012': 'USR-002', // Mohammad Abdulraheem → Taher
    'USR-014': 'USR-013', // Ammar → Nawaf
    'USR-015': 'USR-013', // Hamad → Nawaf
    'USR-016': 'USR-013', // Abdullah → Nawaf
    'USR-017': 'USR-014', // Hussein → Ammar
    'USR-018': 'USR-015', // Ahmad → Hamad
    // USR-013 Nawaf: no parent (top level)
    // USR-099 DataEntry: no parent
  },

  // ── DIRECT REPORTS ────────────────────────────────────────────
  // Who each manager can assign tasks to
  direct_reports: {
    'USR-013': ['USR-001','USR-014','USR-015','USR-016'],           // Nawaf's directs
    'USR-001': ['USR-001','USR-002','USR-003','USR-004','USR-005','USR-006','USR-007','USR-008','USR-009','USR-010','USR-011','USR-012','USR-013','USR-014','USR-015','USR-016','USR-017','USR-018','USR-099'],
    'USR-002': ['USR-003','USR-004','USR-005','USR-008','USR-009','USR-012'], // Taher's directs
    'USR-003': ['USR-007'],                                                   // Shouq (no assign)
    'USR-004': ['USR-006'],                                                   // Alanoud (no assign)
    'USR-005': ['USR-006','USR-007'],                                                   // Mohammad TL (no assign)
    'USR-006': [],                                                   // Hasan AL (no assign)
    'USR-007': [],                                                   // Naser AL (no assign)
    'USR-008': [],
    'USR-009': [],
    'USR-010': [],
    'USR-011': ['USR-010'],                                          // Fatmah → Badreyah
    'USR-012': ['USR-011'],                                          // Mohammad QA Sup → Fatmah
    'USR-014': ['USR-017'],                                          // Ammar → Hussein
    'USR-015': ['USR-018'],                                          // Hamad → Ahmad
    'USR-016': [],                                                   // Abdullah (no assign)
    'USR-017': [],
    'USR-018': [],
    'USR-099': ['USR-001','USR-014','USR-015','USR-016'],           // DataEntry → Nawaf's scope
  },

  // ── FULL VISIBILITY TREE ──────────────────────────────────────
  // Who each user can SEE tasks for (includes all indirect reports)
  visibility_tree: {
    'USR-013': ['USR-001','USR-014','USR-015','USR-016'],
    'USR-001': ['USR-001','USR-002','USR-003','USR-004','USR-005','USR-006','USR-007','USR-008','USR-009','USR-010','USR-011','USR-012','USR-013','USR-014','USR-015','USR-016','USR-017','USR-018','USR-099'],
    'USR-002': ['USR-003','USR-004','USR-005','USR-006','USR-007','USR-008','USR-009','USR-010','USR-011','USR-012'],
    'USR-003': [],   // Shouq: self only
    'USR-004': [],   // Alanoud: self only
    'USR-005': [],   // Mohammad TL: self only
    'USR-006': [],   // Hasan: self only
    'USR-007': [],   // Naser: self only
    'USR-008': [],
    'USR-009': [],
    'USR-010': [],   // Badreyah: self only
    'USR-011': ['USR-010'],              // Fatmah: herself + Badreyah
    'USR-012': ['USR-010','USR-011'],    // Mohammad QA: himself + Fatmah + Badreyah
    'USR-014': ['USR-017'],              // Ammar: himself + Hussein
    'USR-015': ['USR-018'],              // Hamad: himself + Ahmad
    'USR-016': [],                       // Abdullah: self only
    'USR-017': [],
    'USR-018': [],
    'USR-099': ['USR-001','USR-014','USR-015','USR-016'], // DataEntry: Nawaf's directs
  },

  // ── ROLE PERMISSIONS ──────────────────────────────────────────
  roles: {
    'DGM':        { canCreate: true,  canAssign: true,  isAdmin: false, isManager: true,  level: 1 },
    'HoD':        { canCreate: true,  canAssign: true,  isAdmin: true,  isManager: true,  level: 2 },
    'Manager':    { canCreate: true,  canAssign: true,  isAdmin: true,  isManager: true,  level: 3 },
    'QA Manager': { canCreate: true,  canAssign: true,  isAdmin: false, isManager: true,  level: 3 },
    'TL':         { canCreate: true,  canAssign: true,  isAdmin: false, isManager: false, level: 4 },
    'AL':         { canCreate: false, canAssign: false, isAdmin: false, isManager: false, level: 4 },
    'QA':         { canCreate: false, canAssign: false, isAdmin: false, isManager: false, level: 5 },
    'BackOffice': { canCreate: false, canAssign: false, isAdmin: false, isManager: false, level: 5 },
    'DataEntry':  { canCreate: true,  canAssign: true,  isAdmin: false, isManager: false, level: 4 },
  },

  // ── METHODS ───────────────────────────────────────────────────

  // Get all users this user can SEE tasks for (including themselves)
  getVisibleUserIds: function(userId) {
    var tree = this.visibility_tree[userId] || [];
    return [userId].concat(tree);
  },

  // Get all users this user can ASSIGN tasks to
  getAssignableUserIds: function(userId) {
    return this.direct_reports[userId] || [];
  },

  // Check if user A can see user B's tasks
  canSeeUser: function(viewerUserId, targetUserId) {
    if (viewerUserId === targetUserId) return true;
    var visible = this.visibility_tree[viewerUserId] || [];
    return visible.indexOf(targetUserId) !== -1;
  },

  // Get role config
  getRoleConfig: function(role) {
    return this.roles[role] || { canCreate: false, canAssign: false, isAdmin: false, isManager: false, level: 5 };
  },

  // Can this user create tasks?
  canCreateTask: function(role) {
    return (this.roles[role] || {}).canCreate === true;
  },

  // Can this user assign tasks to others?
  canAssignTask: function(userId, role) {
    var cfg = this.roles[role] || {};
    if (!cfg.canAssign) return false;
    var directs = this.direct_reports[userId] || [];
    return directs.length > 0;
  },

  // Get department display name
  getDeptColor: function(dept) {
    var colors = {
      'Contact Center': '#1877C5',
      'Quality Assurance': '#7C3AED',
      'E-Banking': '#0EA472',
      'ATM': '#F59E0B',
      'Digital Branches': '#EC4899',
      'Executive Management': '#0D1B3E',
    };
    return colors[dept] || '#64748B';
  }
};

AUTH.requireAuth();
UTILS.setUser(AUTH.getSession());
UTILS.sidebar();

// ── KIB HIERARCHY ─────────────────────────────────────────


// ── CONFIG ────────────────────────────────────────────────
var _sess = AUTH.getSession() || {};
var allT = [], curF = 'all', currentTask = null;

// Show New Task button for users who can create
if (window.KIB_HIERARCHY&&KIB_HIERARCHY.canCreateTask((_sess.role||''))) {
  var btnNew = document.getElementById('btnNew');
  if (btnNew) btnNew.style.display = 'flex';
}
