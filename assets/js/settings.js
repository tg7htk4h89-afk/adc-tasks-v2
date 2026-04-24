/* settings.js */
var _ss;
document.addEventListener('DOMContentLoaded',function(){
  AUTH.need();_ss=AUTH.get();initSB();
  U.set('sbUname',_ss.display_name||_ss.full_name.split(' ')[0]);
  U.set('sbUrole',_ss.role);U.set('sbAvTxt',U.ini(_ss.full_name));
  U.set('sUser',_ss.full_name||'—');
  U.set('sRole',_ss.role||'—');
  U.set('sTeam',_ss.team||'—');
  U.set('sId',_ss.user_id||'—');
});
async function saveSettings(){
  var btn=U.el('saveBtn');if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    var b={};
    ['slaC','slaH','slaM','slaL'].forEach(function(id){var e=U.el(id);if(e&&e.value)b[id]=parseInt(e.value);});
    await API.post('settings_update',b);
    U.toast('Saved','success');
  }catch(ex){U.toast(ex.message,'error');}
  finally{if(btn){btn.disabled=false;btn.textContent='Save Settings';}}
}
function logout(){AUTH.out();}
