/*
 * ADC Task Manager — settings.js
 * Requires: auth.js
 */

if(!AUTH.hasRole('HoD'))location.href='/index.html';
UTILS.setUser(AUTH.getSession());UTILS.sidebar();
['w1','w2','w3','w4','w5'].forEach(function(id){document.getElementById(id).addEventListener('input',function(){
  var t=['w1','w2','w3','w4','w5'].reduce(function(s,i){return s+Number(document.getElementById(i).value||0);},0);
  var el=document.getElementById('wtotal');el.textContent='Total: '+t+'%';el.style.color=t===100?'var(--green)':'var(--red)';
});});
async function saveW(){
  var t=['w1','w2','w3','w4','w5'].reduce(function(s,i){return s+Number(document.getElementById(i).value||0);},0);
  if(t!==100){UTILS.toast('Weights must total 100%','error');return;}
  try{await API.post('settings_update',{weight_task_completion:Number(document.getElementById('w1').value),weight_sla_compliance:Number(document.getElementById('w2').value),weight_handover_quality:Number(document.getElementById('w3').value),weight_training_progress:Number(document.getElementById('w4').value),weight_sales_achievement:Number(document.getElementById('w5').value)});UTILS.toast('Saved','success');}catch(ex){UTILS.toast('Error: '+ex.message,'error');}
}

loadBell();

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
