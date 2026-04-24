/* archive.js */
var _all=[],_fil=[],_page=1,_pp=20,_as;
document.addEventListener('DOMContentLoaded',function(){
  AUTH.need();_as=AUTH.get();initSB();
  U.set('sbUname',_as.display_name||_as.full_name.split(' ')[0]);
  U.set('sbUrole',_as.role);U.set('sbAvTxt',U.ini(_as.full_name));
  loadA();
  ['fSrc','fSt','fPr','fCat'].forEach(function(id){var e=U.el(id);if(e)e.addEventListener('input',applyF);});
});
async function loadA(){
  U.load('archC','Loading archive...');
  try{
    var d=await API.get('tasks_archive',{});
    _all=d.tasks||[];updH();applyF();
  }catch(ex){
    U.html('archC','<div class="empty-wrap"><div class="empty-ico">&#9888;&#65039;</div><div class="empty-t">Could not load</div><div class="empty-s">'+U.esc(ex.message)+'</div><button class="btn btn-blue" style="margin-top:12px" onclick="loadA()">Retry</button></div>');
  }
}
function updH(){
  var dn=_all.filter(function(t){return t.status==='Completed';}).length;
  var cn=_all.filter(function(t){return t.status==='Cancelled';}).length;
  var pct=_all.length?Math.round(dn/_all.length*100):0;
  U.set('hTotal',_all.length);U.set('hDone',dn);U.set('hCanc',cn);U.set('hPct',pct+'%');
  var r=U.el('hRing');if(r){var c=2*Math.PI*32;r.style.strokeDashoffset=c-(pct/100)*c;r.setAttribute('stroke-dasharray',c);}
}
function applyF(){
  var q=(U.el('fSrc')?U.el('fSrc').value:'').toLowerCase();
  var st=U.el('fSt')?U.el('fSt').value:'';
  var pr=U.el('fPr')?U.el('fPr').value:'';
  var ca=U.el('fCat')?U.el('fCat').value:'';
  _fil=_all.filter(function(t){
    if(q&&!(t.title||'').toLowerCase().includes(q)&&!(t.assigned_to_name||'').toLowerCase().includes(q))return false;
    if(st&&t.status!==st)return false;
    if(pr&&t.priority!==pr)return false;
    if(ca&&t.category!==ca)return false;
    return true;
  });
  _page=1;renderA();
}
function clearF(){
  ['fSrc','fSt','fPr','fCat'].forEach(function(id){var e=U.el(id);if(e)e.value='';});applyF();
}
var PC={Critical:'color:#991B1B;background:var(--rdim)',High:'color:#92400E;background:var(--adim)',Medium:'color:#1E40AF;background:var(--blt)',Low:'color:#065F46;background:var(--gdim)'};
var BC={Completed:'b-done',Cancelled:'b-can',Escalated:'b-esc'};
function renderA(){
  var start=(_page-1)*_pp,page=_fil.slice(start,start+_pp),total=_fil.length;
  U.set('archCnt',total+' task'+(total!==1?'s':''));
  U.set('pagI','Showing '+(total===0?0:start+1)+'–'+Math.min(start+_pp,total)+' of '+total);
  var el=U.el('archC');if(!el)return;
  if(!page.length){U.empty('archC','&#128194;','No tasks found','Adjust filters.');renderPag(0);return;}
  if(window.innerWidth<=768) renderCards(el,page);
  else renderTable(el,page);
  renderPag(Math.ceil(total/_pp));
}
function renderTable(el,page){
  el.innerHTML='<div class="tbl"><table>'+
    '<thead><tr><th>Task</th><th>Assigned To</th><th>Category</th><th>Priority</th><th>Status</th><th>Progress</th><th>Closed</th><th>By</th></tr></thead>'+
    '<tbody>'+page.map(function(t){
      var pct=t.status==='Completed'?100:Math.min(100,t.progress_pct||0);
      var an=t.assigned_to_name&&t.assigned_to_name!=='undefined'?t.assigned_to_name:null;
      return '<tr>'+
        '<td><div style="font-size:12.5px;font-weight:700;color:var(--t1)">'+U.esc(t.title||'—')+'</div><div style="font-size:10px;color:var(--t4);font-family:monospace">'+U.esc(t.task_id||'')+'</div></td>'+
        '<td><div style="display:flex;align-items:center;gap:7px">'+(an?U.av(an,24):'')+U.esc(an||'—')+'</div></td>'+
        '<td>'+U.esc(t.category||'—')+'</td>'+
        '<td><span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;'+(PC[t.priority]||'')+'">'+U.esc(t.priority||'—')+'</span></td>'+
        '<td><span class="badge '+(BC[t.status]||'b-can')+'">'+U.esc(t.status||'—')+'</span></td>'+
        '<td><div class="pbar"><div class="pfill" style="width:'+pct+'%"></div></div><div style="font-size:10px;color:var(--t3);margin-top:3px">'+pct+'%</div></td>'+
        '<td style="white-space:nowrap">'+U.date(t.completed_at||t.updated_at)+'</td>'+
        '<td>'+U.esc(t.assigned_by_name||'—')+'</td>'+
      '</tr>';
    }).join('')+'</tbody></table></div>';
}
function renderCards(el,page){
  el.innerHTML=page.map(function(t){
    var pct=t.status==='Completed'?100:Math.min(100,t.progress_pct||0);
    var an=t.assigned_to_name&&t.assigned_to_name!=='undefined'?t.assigned_to_name:null;
    return '<div style="background:var(--card);border:1px solid var(--bdr);border-radius:var(--r2);padding:14px;margin-bottom:8px;box-shadow:var(--s1)">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px">'+
        '<div><div style="font-size:13px;font-weight:700;color:var(--t1)">'+U.esc(t.title||'Untitled')+'</div><div style="font-size:9px;color:var(--t4);font-family:monospace;margin-top:2px">'+U.esc(t.task_id||'')+'</div></div>'+
        '<span class="badge '+(BC[t.status]||'b-can')+'">'+U.esc(t.status||'—')+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+
        (t.priority?'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;'+(PC[t.priority]||'')+'">'+U.esc(t.priority)+'</span>':'')+
        (t.category?'<span style="font-size:10px;font-weight:600;color:var(--blue);background:var(--blt);padding:2px 8px;border-radius:10px">'+U.esc(t.category)+'</span>':'')+
      '</div>'+
      '<div class="pbar" style="margin-bottom:10px"><div class="pfill" style="width:'+pct+'%"></div></div>'+
      '<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--t3);padding-top:8px;border-top:1px solid var(--bdr)">'+
        (an?U.av(an,22)+'<span>'+U.esc(an)+'</span>':'')+
        '<span style="margin-left:auto">'+U.date(t.completed_at||t.updated_at)+'</span>'+
      '</div>'+
    '</div>';
  }).join('');
}
function renderPag(total){
  var w=U.el('pagW');if(!w)return;
  w.style.display=total>1?'flex':'none';
  var h='<button class="pbn" onclick="goP('+(_page-1)+')" '+(_page<=1?'disabled':'')+'>&#8249;</button>';
  for(var i=1;i<=Math.min(total,7);i++) h+='<button class="pbn'+(_page===i?' on':'')+'" onclick="goP('+i+')">'+i+'</button>';
  h+='<button class="pbn" onclick="goP('+(_page+1)+')" '+(_page>=total?'disabled':'')+'>&#8250;</button>';
  U.html('pagBtns',h);
}
function goP(p){if(p<1||p>Math.ceil(_fil.length/_pp))return;_page=p;renderA();}
window.addEventListener('resize',function(){if(_fil.length)renderA();});
