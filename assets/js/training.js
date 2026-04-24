/* training.js */
var _plans=[],_ss;
document.addEventListener('DOMContentLoaded',function(){
  AUTH.need();_ss=AUTH.get();initSB();
  U.set('sbUname',_ss.display_name||_ss.full_name.split(' ')[0]);
  U.set('sbUrole',_ss.role);U.set('sbAvTxt',U.ini(_ss.full_name));
  if(ROLES.canCreate(_ss.role)){var b=U.el('btnNewP');if(b)b.style.display='inline-flex';}
  loadP();
  var f=U.el('fSt');if(f)f.addEventListener('change',loadP);
});
async function loadP(){
  U.load('planList','Loading plans...');
  try{
    var f=U.el('fSt'),p=f&&f.value?{status:f.value}:{};
    var d=await API.get('training_list',p);
    _plans=d.plans||[];updPH();renderP();
  }catch(ex){
    U.html('planList','<div class="empty-wrap"><div class="empty-ico">&#9888;&#65039;</div><div class="empty-t">Could not load</div><div class="empty-s">'+U.esc(ex.message)+'</div><button class="btn btn-blue" style="margin-top:12px" onclick="loadP()">Retry</button></div>');
  }
}
function updPH(){
  var active=_plans.filter(function(p){return p.status==='InProgress'||p.status==='Assigned';}).length;
  var delayed=_plans.filter(function(p){return p.status==='Delayed';}).length;
  var done=_plans.filter(function(p){return p.status==='Completed';}).length;
  var pct=_plans.length?Math.round(done/_plans.length*100):0;
  U.set('hActive',active);U.set('hDelayed',delayed);U.set('hDone',done);U.set('hPct',pct+'%');
  var r=U.el('hRing');if(r){var c=2*Math.PI*32;r.style.strokeDashoffset=c-(pct/100)*c;r.setAttribute('stroke-dasharray',c);}
}
var SCOL={InProgress:'var(--blt)',Assigned:'var(--blt)',Delayed:'var(--adim)',Completed:'var(--gdim)'};
var STXT={InProgress:'#1E40AF',Assigned:'#1E40AF',Delayed:'#92400E',Completed:'#065F46'};
var PCOL={Critical:'color:#991B1B;background:var(--rdim)',High:'color:#92400E;background:var(--adim)',Medium:'color:#1E40AF;background:var(--blt)',Low:'color:#065F46;background:var(--gdim)'};
function renderP(){
  if(!_plans.length){U.empty('planList','&#128203;','No plans','Create one to get started.');return;}
  U.html('planList',_plans.map(function(p){
    var pct=Math.min(100,p.completion_pct||0);
    var bc=STXT[p.status]||'#64748B',bg=SCOL[p.status]||'#F1F5F9';
    var pc=pct>=100?'var(--green)':p.status==='Delayed'?'var(--amber)':'var(--blue)';
    return '<div onclick="openP(\''+p.training_id+'\')" style="background:var(--card);border:1px solid var(--bdr);border-radius:var(--r3);padding:16px 18px;margin-bottom:10px;box-shadow:var(--s1);cursor:pointer;transition:box-shadow .15s,border-color .15s" onmouseover="this.style.boxShadow=\'var(--s2)\';this.style.borderColor=\'var(--bdr2)\'" onmouseout="this.style.boxShadow=\'var(--s1)\';this.style.borderColor=\'var(--bdr)\'">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">'+
        '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;color:var(--t1);margin-bottom:3px">'+U.esc(p.title)+'</div><div style="font-size:11px;color:var(--t3)">'+U.esc(p.category||'')+(p.target_type?' · '+U.esc(p.target_type):'')+'</div></div>'+
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">'+
          '<span style="font-size:11px;font-weight:700;color:'+bc+';background:'+bg+';padding:3px 10px;border-radius:20px;white-space:nowrap">'+U.esc(p.status||'—')+'</span>'+
          (p.priority?'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;'+PCOL[p.priority]+'" >'+U.esc(p.priority)+'</span>':'')+
        '</div>'+
      '</div>'+
      '<div style="margin-bottom:12px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">'+
          '<span style="font-size:11px;color:var(--t3)">'+(p.done_count||0)+' / '+(p.total_agents||'—')+' agents</span>'+
          '<span style="font-size:12px;font-weight:800;color:'+pc+'">'+pct+'%</span>'+
        '</div>'+
        '<div class="pbar"><div class="pfill" style="width:'+pct+'%;background:'+pc+'"></div></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--t3);padding-top:10px;border-top:1px solid var(--bdr)">'+
        U.av(p.created_by_name||'?',22)+'<span>'+U.esc(p.created_by_name||'—')+'</span>'+
        (p.deadline?'<span style="margin-left:auto">&#128197; '+U.date(p.deadline)+'</span>':'')+
      '</div>'+
    '</div>';
  }).join(''));
}
async function openP(id){
  var m=U.el('planModal'),b=U.el('planBody');if(!m||!b)return;
  m.style.display='flex';
  b.innerHTML='<div class="loading"><div class="spin"></div></div>';
  try{
    var d=await API.get('training_detail',{training_id:id});
    var p=d.plan||{};
    var pct=Math.min(100,p.completion_pct||0);
    var pc=pct>=100?'var(--green)':'var(--blue)';
    b.innerHTML='<div style="padding:22px">'+
      '<div style="font-size:9px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">'+U.esc(p.category||'Training')+'</div>'+
      '<div style="font-size:18px;font-weight:800;color:var(--t1);margin-bottom:16px">'+U.esc(p.title||'')+'</div>'+
      (p.description?'<div style="font-size:13px;color:var(--t2);line-height:1.6;padding:12px 14px;background:var(--card2);border:1px solid var(--bdr);border-radius:var(--r2);margin-bottom:16px">'+U.esc(p.description)+'</div>':'')+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'+
        '<div style="padding:12px;background:var(--card2);border:1px solid var(--bdr);border-radius:var(--r2)"><div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">Deadline</div><div style="font-size:13px;font-weight:700;color:var(--t1)">'+U.date(p.deadline)+'</div></div>'+
        '<div style="padding:12px;background:var(--card2);border:1px solid var(--bdr);border-radius:var(--r2)"><div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">Completion</div><div style="font-size:13px;font-weight:700;color:var(--t1)">'+(p.done_count||0)+' / '+(p.total_agents||'—')+'</div></div>'+
      '</div>'+
      '<div style="margin-bottom:16px">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:12px;font-weight:600;color:var(--t2)">Overall Progress</span><span style="font-size:13px;font-weight:800;color:'+pc+'">'+pct+'%</span></div>'+
        '<div class="pbar" style="height:8px"><div class="pfill" style="width:'+pct+'%;background:'+pc+'"></div></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:10px;padding-top:14px;border-top:1px solid var(--bdr)">'+
        U.av(p.created_by_name||'?',30)+
        '<div><div style="font-size:12px;font-weight:700;color:var(--t1)">'+U.esc(p.created_by_name||'—')+'</div><div style="font-size:10px;color:var(--t3)">Created '+U.date(p.created_at)+'</div></div>'+
      '</div>'+
    '</div>';
  }catch(ex){
    b.innerHTML='<div class="empty-wrap"><div class="empty-t">Error</div><div class="empty-s">'+U.esc(ex.message)+'</div></div>';
  }
}
function closeP(){var m=U.el('planModal');if(m)m.style.display='none';}
