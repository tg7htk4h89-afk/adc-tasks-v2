/*
 * ADC Task Manager — mock.js
 * ══════════════════════════════════════════════════════════
 * Intercepts all API calls and returns realistic fake data.
 * Use this to test layouts WITHOUT connecting to n8n.
 *
 * HOW TO USE:
 *   Add this BEFORE auth.js in any HTML page:
 *   <script src="./assets/js/mock.js"></script>
 *   <script src="./assets/js/auth.js"></script>
 *
 * HOW TO DISABLE:
 *   Simply remove the mock.js script tag.
 * ══════════════════════════════════════════════════════════
 */

console.log('%c[MOCK MODE] API calls are intercepted — no n8n required', 'color:#1877C5;font-weight:700;font-size:13px');

/* ── MOCK SESSION (auto-login as Taher) ───────────────── */
(function() {
  var KEY = 'kib_ops_session';
  var mockSession = {
    user_id: 'USR-002',
    full_name: 'Taher Al Baghli',
    display_name: 'Taher',
    role: 'CC Manager',
    team: 'Management',
    session_token: 'mock-token-12345',
    expires_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString()
  };
  localStorage.setItem(KEY, JSON.stringify(mockSession));
})();

/* ── MOCK DATA ────────────────────────────────────────── */
var MOCK = {

  /* ── USERS ── */
  users: [
    { user_id:'USR-001', full_name:'Talal Al Jarki',       role:'HoD',        team:'Management' },
    { user_id:'USR-002', full_name:'Taher Al Baghli',      role:'CC Manager', team:'Management' },
    { user_id:'USR-003', full_name:'Shouq Alkandari',       role:'TL',         team:'Inbound' },
    { user_id:'USR-004', full_name:'Alanoud Alotaibi',      role:'TL',         team:'Outbound' },
    { user_id:'USR-005', full_name:'Mohammad Alothman',     role:'TL',         team:'ITM' },
    { user_id:'USR-006', full_name:'Hasan Alajmi',          role:'ATL',        team:'Inbound' },
    { user_id:'USR-007', full_name:'Naser Bandar',          role:'ATL',        team:'Outbound' },
    { user_id:'USR-008', full_name:'Abdulrahman Alfassam',  role:'Agent',      team:'Inbound' },
    { user_id:'USR-009', full_name:'Nourah Almutairi',      role:'Agent',      team:'Inbound' },
    { user_id:'USR-010', full_name:'Badreyah Alattar',      role:'Agent',      team:'Inbound' },
    { user_id:'USR-011', full_name:'Fatmah Alhamar',        role:'Agent',      team:'Wage' },
    { user_id:'USR-012', full_name:'Mohammad Abdulraheem',  role:'QA Manager', team:'Quality' },
    { user_id:'USR-013', full_name:'Ammar Maqames',         role:'Manager',    team:'Management' },
  ],

  /* ── TASKS ── */
  tasks: [
    {
      task_id:'TASK-20260424-001', title:'Review Q1 KPI Report',
      category:'Performance', priority:'High', status:'InProgress',
      assigned_to_user_id:'USR-002', assigned_to_name:'Taher Al Baghli',
      assigned_to_role:'CC Manager', assigned_by_name:'Talal Al Jarki',
      due_date:'2026-04-28T16:00:00', progress_pct:45, sla_pct:72,
      description:'Review Q1 2026 KPI report and prepare summary for HoD.',
      delegated_flag:false, created_at:'2026-04-20T09:00:00',
    },
    {
      task_id:'TASK-20260424-002', title:'Onboard 3 new agents',
      category:'HR', priority:'Critical', status:'New',
      assigned_to_user_id:'USR-003', assigned_to_name:'Shouq Alkandari',
      assigned_to_role:'TL', assigned_by_name:'Taher Al Baghli',
      due_date:'2026-04-26T12:00:00', progress_pct:0, sla_pct:90,
      description:'Complete onboarding checklist for 3 new agents joining Inbound team.',
      delegated_flag:false, created_at:'2026-04-22T10:00:00',
    },
    {
      task_id:'TASK-20260424-003', title:'Update IVR scripts for Ramadan',
      category:'Operations', priority:'Medium', status:'Pending',
      assigned_to_user_id:'USR-004', assigned_to_name:'Alanoud Alotaibi',
      assigned_to_role:'TL', assigned_by_name:'Taher Al Baghli',
      due_date:'2026-04-30T16:00:00', progress_pct:20, sla_pct:55,
      description:'Review and update all IVR scripts for Ramadan working hours.',
      delegated_flag:false, created_at:'2026-04-21T11:00:00',
    },
    {
      task_id:'TASK-20260424-004', title:'Team performance review — April',
      category:'Performance', priority:'Low', status:'Completed',
      assigned_to_user_id:'USR-012', assigned_to_name:'Mohammad Abdulraheem',
      assigned_to_role:'QA Manager', assigned_by_name:'Taher Al Baghli',
      due_date:'2026-04-23T16:00:00', progress_pct:100, sla_pct:120,
      description:'Conduct monthly team performance review for April 2026.',
      delegated_flag:true, delegated_from_name:'Talal Al Jarki',
      created_at:'2026-04-15T08:00:00',
    },
    {
      task_id:'TASK-20260424-005', title:'Fix escalation routing issue',
      category:'Technical', priority:'Critical', status:'Escalated',
      assigned_to_user_id:'USR-005', assigned_to_name:'Mohammad Alothman',
      assigned_to_role:'TL', assigned_by_name:'Taher Al Baghli',
      due_date:'2026-04-24T12:00:00', progress_pct:60, sla_pct:98,
      description:'Investigate and fix the escalation routing bug affecting ITM team.',
      delegated_flag:false, created_at:'2026-04-23T07:00:00',
    },
    {
      task_id:'TASK-20260424-006', title:'Prepare training plan — May',
      category:'Training', priority:'Medium', status:'InProgress',
      assigned_to_user_id:'USR-002', assigned_to_name:'Taher Al Baghli',
      assigned_to_role:'CC Manager', assigned_by_name:'Talal Al Jarki',
      due_date:'2026-05-01T16:00:00', progress_pct:30, sla_pct:40,
      description:'Prepare comprehensive training plan for May 2026.',
      delegated_flag:false, created_at:'2026-04-20T14:00:00',
    },
    {
      task_id:'TASK-20260424-007', title:'Wage team schedule — May',
      category:'Scheduling', priority:'High', status:'New',
      assigned_to_user_id:'USR-011', assigned_to_name:'Fatmah Alhamar',
      assigned_to_role:'Agent', assigned_by_name:'Taher Al Baghli',
      due_date:'2026-04-29T16:00:00', progress_pct:0, sla_pct:60,
      description:'Prepare and publish Wage team schedule for May 2026.',
      delegated_flag:false, created_at:'2026-04-23T09:00:00',
    },
    {
      task_id:'TASK-20260424-008', title:'Customer complaint follow-up',
      category:'Quality', priority:'High', status:'Overdue',
      assigned_to_user_id:'USR-006', assigned_to_name:'Hasan Alajmi',
      assigned_to_role:'ATL', assigned_by_name:'Shouq Alkandari',
      due_date:'2026-04-22T16:00:00', progress_pct:10, sla_pct:150,
      description:'Follow up on customer complaint case #KIB-2026-441.',
      delegated_flag:false, created_at:'2026-04-19T10:00:00',
    },
  ],

  /* ── TRAINING PLANS ── */
  plans: [
    {
      training_id:'TRN-001', title:'Digital Banking — Product Knowledge',
      category:'Product', priority:'High', status:'InProgress',
      target_type:'Inbound', deadline:'2026-05-15T16:00:00',
      completion_pct:62, done_count:10, total_agents:16,
      created_by_name:'Taher Al Baghli', created_at:'2026-04-10T09:00:00',
      description:'Comprehensive product knowledge training on all digital banking services.',
    },
    {
      training_id:'TRN-002', title:'Objection Handling Masterclass',
      category:'Soft Skills', priority:'Medium', status:'Assigned',
      target_type:'Outbound', deadline:'2026-05-20T16:00:00',
      completion_pct:0, done_count:0, total_agents:8,
      created_by_name:'Mohammad Abdulraheem', created_at:'2026-04-18T10:00:00',
      description:'Advanced objection handling techniques for outbound sales team.',
    },
    {
      training_id:'TRN-003', title:'KYC Compliance — 2026 Update',
      category:'Compliance', priority:'Critical', status:'Delayed',
      target_type:'All', deadline:'2026-04-25T16:00:00',
      completion_pct:38, done_count:21, total_agents:54,
      created_by_name:'Talal Al Jarki', created_at:'2026-04-01T08:00:00',
      description:'Updated KYC compliance training mandated by CBK guidelines.',
    },
    {
      training_id:'TRN-004', title:'CRM System — Advanced Features',
      category:'Technical', priority:'Low', status:'Completed',
      target_type:'Inbound', deadline:'2026-04-15T16:00:00',
      completion_pct:100, done_count:25, total_agents:25,
      created_by_name:'Taher Al Baghli', created_at:'2026-04-01T08:00:00',
      description:'Training on advanced CRM features for case management.',
    },
  ],

  /* ── TODO ── */
  todos: [
    { todo_id:'TD-001', title:'Review escalation report', status:'Pending', due_date:'2026-04-24', note:'Check with Hasan before EOD', created_at:'2026-04-23T08:00:00' },
    { todo_id:'TD-002', title:'Call Talal re: May headcount', status:'Pending', due_date:'2026-04-25', note:'', created_at:'2026-04-23T09:00:00' },
    { todo_id:'TD-003', title:'Submit leave request for Eid', status:'Completed', due_date:'2026-04-22', note:'', created_at:'2026-04-20T10:00:00' },
    { todo_id:'TD-004', title:'Approve Shouq training plan', status:'Pending', due_date:'2026-04-26', note:'Check budget first', created_at:'2026-04-22T11:00:00' },
    { todo_id:'TD-005', title:'Update portal user list', status:'Pending', due_date:'2026-04-30', note:'Add new joiners', created_at:'2026-04-21T14:00:00' },
    { todo_id:'TD-006', title:'Monthly 1-on-1s with TLs', status:'Pending', due_date:'2026-04-28', note:'Book meeting rooms', created_at:'2026-04-20T08:00:00' },
    { todo_id:'TD-007', title:'Send Q1 summary to management', status:'Completed', due_date:'2026-04-18', note:'', created_at:'2026-04-17T09:00:00' },
  ],

  /* ── ARCHIVE ── */
  archive: [
    { task_id:'TASK-20260401-011', title:'Q4 performance summary', category:'Performance', priority:'High', status:'Completed', assigned_to_name:'Taher Al Baghli', assigned_by_name:'Talal Al Jarki', progress_pct:100, completed_at:'2026-04-10T16:00:00' },
    { task_id:'TASK-20260401-012', title:'Agent satisfaction survey', category:'HR', priority:'Medium', status:'Completed', assigned_to_name:'Mohammad Abdulraheem', assigned_by_name:'Taher Al Baghli', progress_pct:100, completed_at:'2026-04-08T14:00:00' },
    { task_id:'TASK-20260401-013', title:'IVR update — Q1', category:'Operations', priority:'Low', status:'Cancelled', assigned_to_name:'Shouq Alkandari', assigned_by_name:'Taher Al Baghli', progress_pct:30, completed_at:'2026-04-05T12:00:00' },
    { task_id:'TASK-20260401-014', title:'New agent badges', category:'HR', priority:'Low', status:'Completed', assigned_to_name:'Alanoud Alotaibi', assigned_by_name:'Taher Al Baghli', progress_pct:100, completed_at:'2026-04-03T11:00:00' },
    { task_id:'TASK-20260401-015', title:'Emergency call routing fix', category:'Technical', priority:'Critical', status:'Completed', assigned_to_name:'Mohammad Alothman', assigned_by_name:'Taher Al Baghli', progress_pct:100, completed_at:'2026-04-02T09:00:00' },
  ],

  /* ── NOTIFICATIONS ── */
  notifications: [
    { notif_id:'N-001', type:'task_assigned', message:'You have been assigned "Review Q1 KPI Report"', created_at:'2026-04-24T08:00:00', read:false },
    { notif_id:'N-002', type:'task_overdue',  message:'"Customer complaint follow-up" is overdue',     created_at:'2026-04-23T16:00:00', read:false },
    { notif_id:'N-003', type:'comment',        message:'Talal commented on "Team performance review"',  created_at:'2026-04-22T14:00:00', read:true  },
  ],

  /* ── SETTINGS ── */
  settings: {
    sla_critical_hours:4, sla_high_hours:24, sla_medium_hours:72, sla_low_hours:168,
    auto_escalate_hours:48, max_delegates:3,
    portal_name:'ADC Task Manager', allow_self_assign:true,
  },
};

/* ── API INTERCEPTOR ─────────────────────────────────── */
// Override the API object before auth.js defines it
// We use a flag so auth.js skips its own API definition
window.__MOCK_API__ = true;

window.API = {
  get: function(action, params) { return this.post(action, params); },
  post: function(action, params) {
    return new Promise(function(resolve, reject) {
      // Simulate network delay (200-600ms)
      var delay = 200 + Math.random() * 400;
      setTimeout(function() {
        try {
          var result = MOCK._handle(action, params || {});
          resolve(result);
        } catch(e) {
          reject(new Error(e.message));
        }
      }, delay);
    });
  },
  _handle: function(action, p) {
    var sess = JSON.parse(localStorage.getItem('kib_ops_session') || '{}');
    var uid  = sess.user_id || 'USR-002';

    switch(action) {

      /* Tasks */
      case 'tasks_list': {
        var tasks = MOCK.tasks.slice();
        if (p.assigned_to) tasks = tasks.filter(function(t){ return t.assigned_to_user_id === p.assigned_to; });
        if (p.status) tasks = tasks.filter(function(t){ return t.status === p.status; });
        var counts = {};
        tasks.forEach(function(t){ counts[t.status] = (counts[t.status]||0)+1; });
        return { tasks:tasks, total:tasks.length, counts:counts, is_working_time:true };
      }

      case 'tasks_detail': {
        var t = MOCK.tasks.find(function(x){ return x.task_id === p.task_id; });
        if (!t) throw new Error('Task not found');
        return {
          task: t,
          subtasks: [
            { subtask_id:'ST-001', task_id:t.task_id, title:'Review existing documentation', status:'Done',    assigned_to_name:'Taher Al Baghli' },
            { subtask_id:'ST-002', task_id:t.task_id, title:'Prepare draft report',          status:'Pending', assigned_to_name:'Taher Al Baghli' },
            { subtask_id:'ST-003', task_id:t.task_id, title:'Get approval from HoD',         status:'Pending', assigned_to_name:'Talal Al Jarki' },
          ],
          comments: [
            { comment_id:'C-001', task_id:t.task_id, author_name:'Talal Al Jarki', body:'Please prioritize this one.', created_at:'2026-04-22T10:00:00' },
            { comment_id:'C-002', task_id:t.task_id, author_name:'Taher Al Baghli', body:'On it, will have draft by tomorrow.', created_at:'2026-04-22T11:00:00' },
          ],
          activity: [
            { log_id:'L-001', task_id:t.task_id, actor_name:'Talal Al Jarki', action:'Created task', created_at:t.created_at },
            { log_id:'L-002', task_id:t.task_id, actor_name:'Taher Al Baghli', action:'Updated progress to '+t.progress_pct+'%', created_at:'2026-04-23T09:00:00' },
          ],
        };
      }

      case 'tasks_create': {
        var newTask = {
          task_id: 'TASK-MOCK-' + Date.now(),
          title: p.title || 'New Task',
          category: p.category || 'General',
          priority: p.priority || 'Medium',
          status: 'New',
          assigned_to_user_id: p.assignees && p.assignees[0] ? p.assignees[0].user_id : uid,
          assigned_to_name:    p.assignees && p.assignees[0] ? p.assignees[0].name    : sess.full_name,
          assigned_to_role:    p.assignees && p.assignees[0] ? p.assignees[0].role    : sess.role,
          assigned_by_name: sess.full_name,
          due_date: p.due_date || null,
          progress_pct: 0, sla_pct: 0,
          description: p.description || '',
          delegated_flag: false,
          created_at: new Date().toISOString(),
        };
        MOCK.tasks.unshift(newTask);
        return { task_id: newTask.task_id };
      }

      case 'tasks_update': {
        var idx = MOCK.tasks.findIndex(function(x){ return x.task_id === p.task_id; });
        if (idx > -1) Object.assign(MOCK.tasks[idx], p);
        return { ok:true };
      }

      case 'task_delegate': {
        var t2 = MOCK.tasks.find(function(x){ return x.task_id === p.task_id; });
        if (t2) {
          var newUser = MOCK.users.find(function(u){ return u.user_id === p.delegate_to_user_id; });
          if (newUser) {
            t2.delegated_from_name = t2.assigned_to_name;
            t2.assigned_to_user_id = newUser.user_id;
            t2.assigned_to_name    = newUser.full_name;
            t2.assigned_to_role    = newUser.role;
            t2.delegated_flag      = true;
          }
        }
        return { ok:true };
      }

      case 'subtask_mark': {
        return { ok:true };
      }

      case 'tasks_comment': {
        return { comment_id: 'C-MOCK-'+Date.now(), ok:true };
      }

      case 'task_ext_request': {
        return { ok:true };
      }

      /* Archive */
      case 'tasks_archive': {
        return { tasks: MOCK.archive, total: MOCK.archive.length };
      }

      /* To-Do */
      case 'ptodo_list': {
        var myTodos = MOCK.todos.filter(function(t){ return true; }); // show all
        return { todos: myTodos };
      }
      case 'ptodo_add': {
        var newTodo = { todo_id:'TD-MOCK-'+Date.now(), title:p.title, status:'Pending', due_date:p.due_date||null, note:p.note||'', created_at:new Date().toISOString() };
        MOCK.todos.unshift(newTodo);
        return { todo_id: newTodo.todo_id };
      }
      case 'ptodo_update': {
        var td = MOCK.todos.find(function(x){ return x.todo_id === p.todo_id; });
        if (td) Object.assign(td, p);
        return { ok:true };
      }
      case 'ptodo_delete': {
        MOCK.todos = MOCK.todos.filter(function(x){ return x.todo_id !== p.todo_id; });
        return { ok:true };
      }

      /* Training */
      case 'training_list': {
        var plans = MOCK.plans.slice();
        if (p.status) plans = plans.filter(function(x){ return x.status === p.status; });
        return { plans:plans };
      }
      case 'training_detail': {
        var plan = MOCK.plans.find(function(x){ return x.training_id === p.training_id; });
        if (!plan) throw new Error('Plan not found');
        return { plan:plan };
      }
      case 'training_create': {
        var newPlan = Object.assign({ training_id:'TRN-MOCK-'+Date.now(), completion_pct:0, done_count:0, created_at:new Date().toISOString(), created_by_name:sess.full_name }, p);
        MOCK.plans.unshift(newPlan);
        return { training_id: newPlan.training_id };
      }

      /* Users */
      case 'users_list': {
        return { users: MOCK.users };
      }

      /* Notifications */
      case 'notif_list': {
        return { notifications: MOCK.notifications, unread: MOCK.notifications.filter(function(n){ return !n.read; }).length };
      }

      /* Settings */
      case 'settings_update': {
        Object.assign(MOCK.settings, p);
        return { ok:true };
      }

      default:
        console.warn('[MOCK] Unknown action:', action);
        return { ok:true, data:{} };
    }
  }
};

console.log('%c[MOCK] ' + MOCK.tasks.length + ' tasks | ' + MOCK.plans.length + ' plans | ' + MOCK.todos.length + ' todos | ' + MOCK.users.length + ' users', 'color:#0EA472;font-weight:600');
