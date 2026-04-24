/* ADC Task Manager v2 — auth.js */

var KEY = 'kib_ops_session';
var N8N = 'https://n8n.kib-cc-wfm.com/webhook';

/* ── AUTH ── */
var AUTH = {
  get: function(){
    try{
      var s = JSON.parse(localStorage.getItem(KEY)||'null');
      return (s && new Date(s.expires_at) > new Date()) ? s : null;
    }catch(e){ return null; }
  },
  need: function(){ if(!this.get()) location.href='./login.html'; },
  out:  function(){ localStorage.removeItem(KEY); location.href='./login.html'; },
  can:  function(r){ var s=this.get(); if(!s)return false; return Array.isArray(r)?r.indexOf(s.role)!==-1:s.role===r; }
};

/* ── API — skipped if mock.js already set it ── */
if(!window.__MOCK__){
  var API = {
    call: async function(action, data){
      var s = AUTH.get();
      var body = Object.assign({}, data||{});
      if(s) body.session_token = s.session_token;
      var r = await fetch(N8N+'/kib/'+action.replace(/_/g,'-'), {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)
      });
      var txt = await r.text(), d;
      try{ d = JSON.parse(txt); }catch(e){ throw new Error('Server error '+r.status); }
      if(!d.success) throw new Error(d.error&&d.error.message ? d.error.message : d.message||'Error');
      return d.data;
    },
    get:  function(a,b){ return this.call(a,b); },
    post: function(a,b){ return this.call(a,b); }
  };
}

/* ── UTILS ── */
var U = {
  esc: function(s){
    var d=document.createElement('div');
    d.textContent=String(s==null?'':s); return d.innerHTML;
  },
  ini: function(n){
    return String(n||'?').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
  },
  av: function(n, sz){
    sz = sz||28;
    var cols=['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EC4899','#0EA472','#EF4444','#6366F1'];
    var h=0, s=String(n||'');
    for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))&0xffff;
    var bg=cols[h%cols.length];
    return '<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+bg+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:'+Math.round(sz*.38)+'px;font-weight:700;flex-shrink:0">'+this.ini(n)+'</div>';
  },
  date: function(iso){
    if(!iso) return '—';
    try{
      var d=new Date(iso);
      var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return d.getDate()+' '+m[d.getMonth()]+' '+d.getFullYear();
    }catch(e){ return '—'; }
  },
  due: function(iso){
    if(!iso) return {label:'—',over:false};
    var diff=new Date(iso)-Date.now();
    if(diff<0) return {label:'Overdue',over:true};
    var h=diff/3600000;
    if(h<24) return {label:'Due today',over:false};
    return {label:Math.ceil(h/24)+'d left',over:false};
  },
  toast: function(msg, type){
    var c={success:'#0EA472',error:'#E5383B',warn:'#F4A523',info:'#1877C5'};
    var el=document.createElement('div');
    el.style.cssText='position:fixed;bottom:80px;right:20px;background:#fff;border:1px solid #E4EAF3;border-left:4px solid '+(c[type]||c.info)+';border-radius:12px;padding:12px 18px;font-size:13px;font-family:inherit;box-shadow:0 8px 24px rgba(6,15,36,.12);z-index:9999;max-width:300px;animation:up .25s ease';
    el.textContent=msg;
    document.body.appendChild(el);
    setTimeout(function(){el.remove();},3500);
  },
  el:   function(id){ return document.getElementById(id); },
  set:  function(id,v){ var e=this.el(id); if(e) e.textContent=v; },
  html: function(id,v){ var e=this.el(id); if(e) e.innerHTML=v; },
  show: function(id){ var e=this.el(id); if(e) e.style.display=''; },
  hide: function(id){ var e=this.el(id); if(e) e.style.display='none'; },
  load: function(id,msg){
    this.html(id,'<div class="loading"><div class="spin" style="margin-bottom:10px"></div><div>'+(msg||'Loading...')+'</div></div>');
  },
  empty: function(id,icon,title,sub){
    this.html(id,'<div class="empty-wrap"><div class="empty-ico">'+icon+'</div><div class="empty-t">'+title+'</div>'+(sub?'<div class="empty-s">'+sub+'</div>':'')+'</div>');
  }
};

/* ── ROLES ── */
var ROLES = {
  mgr: ['HoD','CC Manager','Manager','DGM','GM'],
  tl:  ['HoD','CC Manager','Manager','DGM','GM','TL','Team Leader','QA Manager'],
  canCreate: function(r){ return this.tl.indexOf(r)!==-1; }
};

/* ── SIDEBAR INIT ── */
function initSB(){
  var s = AUTH.get(); if(!s) return;
  U.set('sbUname', s.display_name||s.full_name.split(' ')[0]);
  U.set('sbUrole', s.role);
  U.set('sbAvTxt', U.ini(s.full_name));
  var btn=U.el('sbBtn'), sb=U.el('sidebar'), ov=U.el('overlay');
  if(btn && sb){
    btn.addEventListener('click', function(){
      var open=sb.classList.toggle('open');
      if(ov) ov.style.display=open?'block':'none';
    });
  }
  if(ov && sb){
    ov.addEventListener('click', function(){
      sb.classList.remove('open'); ov.style.display='none';
    });
  }
}
