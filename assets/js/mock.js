/* ADC Task Manager v2 — mock.js
   Add BEFORE auth.js to test without n8n.
   Remove when ready to go live.
*/
console.log('%c[MOCK] No n8n needed','color:#1877C5;font-weight:700;font-size:13px');
window.__MOCK__ = true;

/* Auto-login */
localStorage.setItem('kib_ops_session', JSON.stringify({
  user_id:'USR-002', full_name:'Taher Al Baghli', display_name:'Taher',
  role:'CC Manager', team:'Management', session_token:'mock',
  expires_at: new Date(Date.now() + 8*3600000).toISOString()
}));

/* ── DATA ── */
var M = {
  users:[
    {user_id:'USR-001',full_name:'Talal Al Jarki',      role:'HoD',        team:'Management'},
    {user_id:'USR-002',full_name:'Taher Al Baghli',     role:'CC Manager', team:'Management'},
    {user_id:'USR-003',full_name:'Shouq Alkandari',      role:'TL',         team:'Inbound'},
    {user_id:'USR-004',full_name:'Alanoud Alotaibi',     role:'TL',         team:'Outbound'},
    {user_id:'USR-005',full_name:'Mohammad Alothman',    role:'TL',         team:'ITM'},
    {user_id:'USR-006',full_name:'Hasan Alajmi',         role:'ATL',        team:'Inbound'},
    {user_id:'USR-007',full_name:'Naser Bandar',         role:'ATL',        team:'Outbound'},
    {user_id:'USR-008',full_name:'Fatmah Alhamar',       role:'Agent',      team:'Wage'},
    {user_id:'USR-009',full_name:'Mohammad Abdulraheem', role:'QA Manager', team:'Quality'},
    {user_id:'USR-010',full_name:'Ammar Maqames',        role:'Manager',    team:'Management'},
    {user_id:'USR-011',full_name:'Abdulrahman Alfassam', role:'Agent',      team:'Inbound'},
    {user_id:'USR-012',full_name:'Nourah Almutairi',     role:'Agent',      team:'Inbound'},
    {user_id:'USR-013',full_name:'Athoub Alnoufal',      role:'ATL',        team:'ITM'}
  ],
  tasks:[
    {task_id:'TASK-001',title:'Review Q1 KPI Report',category:'Performance',priority:'High',status:'InProgress',
     assigned_to_user_id:'USR-002',assigned_to_name:'Taher Al Baghli',assigned_to_role:'CC Manager',
     assigned_by_name:'Talal Al Jarki',due_date:'2026-04-28T16:00:00',progress_pct:45,sla_pct:72,
     description:'Review Q1 2026 KPI report and prepare summary for HoD.',delegated_flag:false,created_at:'2026-04-20T09:00:00'},
    {task_id:'TASK-002',title:'Onboard 3 new agents',category:'HR',priority:'Critical',status:'New',
     assigned_to_user_id:'USR-003',assigned_to_name:'Shouq Alkandari',assigned_to_role:'TL',
     assigned_by_name:'Taher Al Baghli',due_date:'2026-04-26T12:00:00',progress_pct:0,sla_pct:90,
     description:'Complete onboarding checklist for 3 new Inbound agents.',delegated_flag:false,created_at:'2026-04-22T10:00:00'},
    {task_id:'TASK-003',title:'Update IVR scripts',category:'Operations',priority:'Medium',status:'Pending',
     assigned_to_user_id:'USR-004',assigned_to_name:'Alanoud Alotaibi',assigned_to_role:'TL',
     assigned_by_name:'Taher Al Baghli',due_date:'2026-04-30T16:00:00',progress_pct:20,sla_pct:55,
     description:'Review and update all IVR scripts for Ramadan hours.',delegated_flag:false,created_at:'2026-04-21T11:00:00'},
    {task_id:'TASK-004',title:'Team performance review April',category:'Performance',priority:'Low',status:'Completed',
     assigned_to_user_id:'USR-009',assigned_to_name:'Mohammad Abdulraheem',assigned_to_role:'QA Manager',
     assigned_by_name:'Taher Al Baghli',due_date:'2026-04-23T16:00:00',progress_pct:100,sla_pct:120,
     description:'Monthly performance review April 2026.',delegated_flag:true,delegated_from_name:'Talal Al Jarki',created_at:'2026-04-15T08:00:00'},
    {task_id:'TASK-005',title:'Fix escalation routing',category:'Technical',priority:'Critical',status:'Escalated',
     assigned_to_user_id:'USR-005',assigned_to_name:'Mohammad Alothman',assigned_to_role:'TL',
     assigned_by_name:'Taher Al Baghli',due_date:'2026-04-24T12:00:00',progress_pct:60,sla_pct:98,
     description:'Investigate escalation routing issue in ITM queue.',delegated_flag:false,created_at:'2026-04-23T07:00:00'},
    {task_id:'TASK-006',title:'Prepare May training plan',category:'Training',priority:'Medium',status:'InProgress',
     assigned_to_user_id:'USR-002',assigned_to_name:'Taher Al Baghli',assigned_to_role:'CC Manager',
     assigned_by_name:'Talal Al Jarki',due_date:'2026-05-01T16:00:00',progress_pct:30,sla_pct:40,
     description:'Build comprehensive training plan for May 2026.',delegated_flag:false,created_at:'2026-04-20T14:00:00'},
    {task_id:'TASK-007',title:'Wage team May schedule',category:'Scheduling',priority:'High',status:'New',
     assigned_to_user_id:'USR-008',assigned_to_name:'Fatmah Alhamar',assigned_to_role:'Agent',
     assigned_by_name:'Taher Al Baghli',due_date:'2026-04-29T16:00:00',progress_pct:0,sla_pct:60,
     description:'Publish Wage team schedule for May 2026.',delegated_flag:false,created_at:'2026-04-23T09:00:00'},
    {task_id:'TASK-008',title:'Customer complaint follow-up',category:'Quality',priority:'High',status:'Overdue',
     assigned_to_user_id:'USR-006',assigned_to_name:'Hasan Alajmi',assigned_to_role:'ATL',
     assigned_by_name:'Shouq Alkandari',due_date:'2026-04-22T16:00:00',progress_pct:10,sla_pct:150,
     description:'Follow up on complaint case KIB-2026-441.',delegated_flag:false,created_at:'2026-04-19T10:00:00'}
  ],
  plans:[
    {training_id:'TRN-001',title:'Digital Banking Product Knowledge',category:'Product',priority:'High',status:'InProgress',
     target_type:'Inbound',deadline:'2026-05-15T16:00:00',completion_pct:62,done_count:10,total_agents:16,
     created_by_name:'Taher Al Baghli',created_at:'2026-04-10T09:00:00',
     description:'Comprehensive product knowledge on all digital banking services.'},
    {training_id:'TRN-002',title:'Objection Handling Masterclass',category:'Soft Skills',priority:'Medium',status:'Assigned',
     target_type:'Outbound',deadline:'2026-05-20T16:00:00',completion_pct:0,done_count:0,total_agents:8,
     created_by_name:'Mohammad Abdulraheem',created_at:'2026-04-18T10:00:00',
     description:'Advanced objection handling for outbound team.'},
    {training_id:'TRN-003',title:'KYC Compliance 2026',category:'Compliance',priority:'Critical',status:'Delayed',
     target_type:'All',deadline:'2026-04-25T16:00:00',completion_pct:38,done_count:21,total_agents:54,
     created_by_name:'Talal Al Jarki',created_at:'2026-04-01T08:00:00',
     description:'CBK-mandated KYC compliance update training.'},
    {training_id:'TRN-004',title:'CRM Advanced Features',category:'Technical',priority:'Low',status:'Completed',
     target_type:'Inbound',deadline:'2026-04-15T16:00:00',completion_pct:100,done_count:25,total_agents:25,
     created_by_name:'Taher Al Baghli',created_at:'2026-04-01T08:00:00',
     description:'Advanced CRM features for case management.'}
  ],
  todos:[
    {todo_id:'TD-001',title:'Review escalation report',status:'Pending',due_date:'2026-04-24',note:'Check with Hasan before EOD'},
    {todo_id:'TD-002',title:'Call Talal — May headcount',status:'Pending',due_date:'2026-04-25',note:''},
    {todo_id:'TD-003',title:'Submit leave request for Eid',status:'Completed',due_date:'2026-04-22',note:''},
    {todo_id:'TD-004',title:'Approve Shouq training plan',status:'Pending',due_date:'2026-04-26',note:'Check budget first'},
    {todo_id:'TD-005',title:'Update portal user list',status:'Pending',due_date:'2026-04-30',note:'Add new joiners'},
    {todo_id:'TD-006',title:'Monthly 1-on-1s with TLs',status:'Pending',due_date:'2026-04-28',note:'Book meeting rooms'},
    {todo_id:'TD-007',title:'Send Q1 summary to management',status:'Completed',due_date:'2026-04-18',note:''}
  ],
  archive:[
    {task_id:'ARC-001',title:'Q4 performance summary',category:'Performance',priority:'High',status:'Completed',
     assigned_to_name:'Taher Al Baghli',assigned_by_name:'Talal Al Jarki',progress_pct:100,completed_at:'2026-04-10T16:00:00'},
    {task_id:'ARC-002',title:'Agent satisfaction survey',category:'HR',priority:'Medium',status:'Completed',
     assigned_to_name:'Mohammad Abdulraheem',assigned_by_name:'Taher Al Baghli',progress_pct:100,completed_at:'2026-04-08T14:00:00'},
    {task_id:'ARC-003',title:'IVR update Q1',category:'Operations',priority:'Low',status:'Cancelled',
     assigned_to_name:'Shouq Alkandari',assigned_by_name:'Taher Al Baghli',progress_pct:30,completed_at:'2026-04-05T12:00:00'},
    {task_id:'ARC-004',title:'Emergency routing fix',category:'Technical',priority:'Critical',status:'Completed',
     assigned_to_name:'Mohammad Alothman',assigned_by_name:'Taher Al Baghli',progress_pct:100,completed_at:'2026-04-02T09:00:00'},
    {task_id:'ARC-005',title:'New agent badges setup',category:'HR',priority:'Low',status:'Completed',
     assigned_to_name:'Alanoud Alotaibi',assigned_by_name:'Taher Al Baghli',progress_pct:100,completed_at:'2026-04-03T11:00:00'}
  ]
};

/* ── API ── */
var API = {
  call: function(action, body){
    return new Promise(function(res,rej){
      setTimeout(function(){
        try{ res(M.handle(action, body||{})); }
        catch(e){ rej(new Error(e.message)); }
      }, 200 + Math.random()*300);
    });
  },
  get:  function(a,b){ return this.call(a,b); },
  post: function(a,b){ return this.call(a,b); }
};

M.handle = function(action, p){
  var sess = JSON.parse(localStorage.getItem('kib_ops_session')||'{}');
  switch(action){
    case 'tasks_list':{
      var t=this.tasks.slice();
      if(p.assigned_to) t=t.filter(function(x){return x.assigned_to_user_id===p.assigned_to;});
      if(p.status)      t=t.filter(function(x){return x.status===p.status;});
      var c={}; t.forEach(function(x){c[x.status]=(c[x.status]||0)+1;});
      return{tasks:t,total:t.length,counts:c};
    }
    case 'tasks_detail':{
      var task=this.tasks.find(function(x){return x.task_id===p.task_id;});
      if(!task) throw new Error('Task not found');
      return{
        task:task,
        subtasks:[
          {subtask_id:'ST-1',title:'Review documentation',status:'Done',assigned_to_name:'Taher Al Baghli'},
          {subtask_id:'ST-2',title:'Prepare draft',status:'Pending',assigned_to_name:'Taher Al Baghli'},
          {subtask_id:'ST-3',title:'Get HoD approval',status:'Pending',assigned_to_name:'Talal Al Jarki'}
        ],
        comments:[
          {comment_id:'C-1',author_name:'Talal Al Jarki',body:'Please prioritize this.',created_at:'2026-04-22T10:00:00'},
          {comment_id:'C-2',author_name:'Taher Al Baghli',body:'On it, draft ready by tomorrow.',created_at:'2026-04-22T11:00:00'}
        ],
        activity:[
          {log_id:'L-1',actor_name:'Talal Al Jarki',action:'Created task',created_at:task.created_at},
          {log_id:'L-2',actor_name:'Taher Al Baghli',action:'Updated progress to '+task.progress_pct+'%',created_at:'2026-04-23T09:00:00'}
        ]
      };
    }
    case 'tasks_create':{
      var nt=Object.assign({task_id:'TASK-'+Date.now(),status:'New',progress_pct:0,sla_pct:0,
        assigned_to_user_id:sess.user_id,assigned_to_name:sess.full_name,
        assigned_to_role:sess.role,assigned_by_name:sess.full_name,
        delegated_flag:false,created_at:new Date().toISOString()},p);
      if(p.assignees&&p.assignees[0]){
        nt.assigned_to_user_id=p.assignees[0].user_id;
        nt.assigned_to_name=p.assignees[0].name;
        nt.assigned_to_role=p.assignees[0].role;
      }
      this.tasks.unshift(nt);
      return{task_id:nt.task_id};
    }
    case 'tasks_update':{
      var i=this.tasks.findIndex(function(x){return x.task_id===p.task_id;});
      if(i>-1) Object.assign(this.tasks[i],p);
      return{ok:true};
    }
    case 'task_delegate':{
      var t2=this.tasks.find(function(x){return x.task_id===p.task_id;});
      if(t2){
        var u=this.users.find(function(x){return x.user_id===p.delegate_to_user_id;});
        if(u){t2.delegated_from_name=t2.assigned_to_name;t2.assigned_to_user_id=u.user_id;t2.assigned_to_name=u.full_name;t2.assigned_to_role=u.role;t2.delegated_flag=true;}
      }
      return{ok:true};
    }
    case 'subtask_mark':   return{ok:true};
    case 'tasks_comment':  return{comment_id:'C-'+Date.now(),ok:true};
    case 'task_ext_request':return{ok:true};
    case 'tasks_archive':  return{tasks:this.archive,total:this.archive.length};
    case 'ptodo_list':     return{todos:this.todos};
    case 'ptodo_add':{
      var ntd={todo_id:'TD-'+Date.now(),title:p.title,status:'Pending',due_date:p.due_date||null,note:p.note||'',created_at:new Date().toISOString()};
      this.todos.unshift(ntd); return{todo_id:ntd.todo_id};
    }
    case 'ptodo_update':{
      var td=this.todos.find(function(x){return x.todo_id===p.todo_id;});
      if(td) Object.assign(td,p); return{ok:true};
    }
    case 'ptodo_delete':{
      this.todos=this.todos.filter(function(x){return x.todo_id!==p.todo_id;}); return{ok:true};
    }
    case 'training_list':{
      var pl=this.plans.slice();
      if(p.status) pl=pl.filter(function(x){return x.status===p.status;});
      return{plans:pl};
    }
    case 'training_detail':{
      var plan=this.plans.find(function(x){return x.training_id===p.training_id;});
      if(!plan) throw new Error('Not found');
      return{plan:plan};
    }
    case 'training_create':{
      var np=Object.assign({training_id:'TRN-'+Date.now(),completion_pct:0,done_count:0,
        created_at:new Date().toISOString(),created_by_name:sess.full_name},p);
      this.plans.unshift(np); return{training_id:np.training_id};
    }
    case 'users_list':   return{users:this.users};
    case 'settings_update': return{ok:true};
    default:
      console.warn('[MOCK] Unknown action:',action);
      return{ok:true};
  }
};

console.log('%c[MOCK] '+M.tasks.length+' tasks | '+M.plans.length+' plans | '+M.todos.length+' todos | '+M.users.length+' users','color:#0EA472;font-weight:600');
