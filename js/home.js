var MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

document.addEventListener('click', function (e) {
  var homeLink = e.target.closest('#nav-home');
  if (homeLink) {
    e.preventDefault();
    showHomePanel();
    return;
  }
  var submitLink = e.target.closest('#nav-submit-request');
  if (submitLink) {
    e.preventDefault();
    var nav = document.querySelector('.site-nav');
    if (nav) nav.classList.remove('open');
    window.alert('feature coming soon!');
  }
});

function showHomePanel() {
  document.getElementById('home-panel').style.display = 'block';
  document.getElementById('calendar-panel').style.display = 'none';
  document.getElementById('database-panel').style.display = 'none';
  setActiveNav('nav-home');
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-menu a').forEach(function (a) {
    a.classList.remove('nav-active');
  });
  var el = document.getElementById(id);
  if (el) el.classList.add('nav-active');
}

document.addEventListener('authReady', function () {
  var name = window.userName || 'there';
  document.getElementById('welcome-heading').textContent = 'Welcome, ' + name;
  loadUpcomingEvents();
  loadDonationTotal();
  loadDepartments();
  loadDashboardFlyers();
});

async function loadUpcomingEvents() {
  var today = new Date();
  var dateStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  var { data, error } = await supabaseClient
    .from('events')
    .select('title, event_date, event_time')
    .gte('event_date', dateStr)
    .order('event_date')
    .order('event_time', { nullsFirst: false })
    .limit(3);

  var list = document.getElementById('upcoming-events-list');

  if (error || !data || data.length === 0) {
    list.innerHTML = '<li class="upcoming-empty">No upcoming events.</li>';
    return;
  }

  list.innerHTML = '';
  data.forEach(function (ev) {
    var li = document.createElement('li');

    var titleSpan = document.createElement('span');
    titleSpan.className = 'upcoming-event-title';
    titleSpan.textContent = ev.title;
    li.appendChild(titleSpan);

    var metaSpan = document.createElement('span');
    metaSpan.className = 'upcoming-event-meta';
    var parts = ev.event_date.split('-');
    var month = MONTH_ABBR[parseInt(parts[1], 10) - 1];
    var day = parseInt(parts[2], 10);
    var text = month + ' ' + day;

    if (ev.event_time) {
      var tp = ev.event_time.split(':');
      var h = parseInt(tp[0], 10);
      var m = tp[1];
      var suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      text += ' \u00B7 ' + h + ':' + m + ' ' + suffix;
    }

    metaSpan.textContent = text;
    li.appendChild(metaSpan);

    list.appendChild(li);
  });
}

async function loadDepartments() {
  var list = document.getElementById('departments-list');
  var { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    list.innerHTML = '<li class="upcoming-empty">Not signed in.</li>';
    return;
  }

  var { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('departments')
    .eq('id', session.user.id)
    .single();

  var depts = (!error && profile && profile.departments) ? profile.departments : [];

  if (depts.length === 0) {
    list.innerHTML = '<li class="dept-empty">No departments assigned.</li>';
    return;
  }

  list.innerHTML = '';
  depts.forEach(function (name) {
    var li = document.createElement('li');
    var icon = document.createElement('i');
    icon.className = 'fa-solid fa-circle-check';
    li.appendChild(icon);
    var span = document.createElement('span');
    span.textContent = name;
    li.appendChild(span);
    list.appendChild(li);
  });

  loadDeptTodoCards(depts);
}

async function loadDonationTotal() {
  var { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  var { data, error } = await supabaseClient
    .from('donations')
    .select('amount')
    .eq('user_id', session.user.id);

  var total = 0;
  if (!error && data) {
    data.forEach(function (row) {
      total += parseFloat(row.amount) || 0;
    });
  }

  document.getElementById('donation-total').textContent =
    '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

var CARD_COLORS = [
  { accent: '#1E40AF', bg: '#EFF6FF' },
  { accent: '#0369A1', bg: '#E0F2FE' },
  { accent: '#1D4ED8', bg: '#DBEAFE' },
  { accent: '#2563EB', bg: '#EFF6FF' },
  { accent: '#312E81', bg: '#EEF2FF' }
];

async function loadDeptTodoCards(depts) {
  var container = document.getElementById('dept-todo-cards');
  if (!container) return;

  var { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  var { data: allTodos, error } = await supabaseClient
    .from('dept_todos')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at');

  if (error) allTodos = [];

  container.innerHTML = '';

  depts.forEach(function (dept, i) {
    var colors = CARD_COLORS[i % CARD_COLORS.length];
    var todos = allTodos.filter(function (t) { return t.department === dept; });
    var card = buildTodoCard(dept, todos, colors);
    container.appendChild(card);
  });
}

function buildTodoCard(dept, todos, colors) {
  var card = document.createElement('div');
  card.className = 'dept-todo-card';
  card.style.setProperty('--card-accent', colors.accent);
  card.style.setProperty('--card-bg', colors.bg);

  var headerDiv = document.createElement('div');
  headerDiv.className = 'dept-todo-card-header';
  var DEPT_ICONS = {
    'Finance': 'fa-solid fa-coins',
    'Youth Ministry': 'fa-solid fa-children',
    'Board': 'fa-solid fa-users-rectangle',
    'Praise Team': 'fa-solid fa-music',
    'In His Presence': 'fa-solid fa-hands-praying',
    'Ushers': 'fa-solid fa-door-open',
    'Greeters': 'fa-solid fa-hand-wave',
    'IT/Media': 'fa-solid fa-laptop-code',
    'Security': 'fa-solid fa-shield-halved',
    'Admin': 'fa-solid fa-gear'
  };

  var headerIcon = document.createElement('i');
  headerIcon.className = DEPT_ICONS[dept] || 'fa-solid fa-list-check';
  headerDiv.appendChild(headerIcon);
  var headerTitle = document.createElement('h4');
  headerTitle.textContent = dept;
  headerDiv.appendChild(headerTitle);
  card.appendChild(headerDiv);

  var list = document.createElement('div');
  list.className = 'todo-list';

  if (todos.length === 0) {
    var emptyBtn = document.createElement('button');
    emptyBtn.className = 'todo-empty-btn';
    emptyBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add your first task';
    emptyBtn.addEventListener('click', function () {
      emptyBtn.style.display = 'none';
      card.querySelector('.todo-add-form').style.display = 'flex';
      card.querySelector('.todo-add-input').focus();
    });
    list.appendChild(emptyBtn);
  } else {
    todos.forEach(function (todo) {
      list.appendChild(buildTodoItem(todo, dept));
    });
  }

  card.appendChild(list);

  var form = document.createElement('div');
  form.className = 'todo-add-form';
  if (todos.length === 0) form.style.display = 'none';

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-add-input';
  input.placeholder = 'New task...';

  var addBtn = document.createElement('button');
  addBtn.className = 'todo-add-btn';
  addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';

  function doAdd() {
    var title = input.value.trim();
    if (title) addDeptTodo(dept, title);
  }

  addBtn.addEventListener('click', doAdd);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doAdd();
  });

  form.appendChild(input);
  form.appendChild(addBtn);
  card.appendChild(form);

  return card;
}

function buildTodoItem(todo, dept) {
  var row = document.createElement('div');
  row.className = 'todo-item' + (todo.done ? ' done' : '');

  var cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = todo.done;
  cb.addEventListener('change', function () {
    toggleDeptTodo(todo.id, cb.checked, dept);
  });

  var label = document.createElement('span');
  label.className = 'todo-item-label';
  label.textContent = todo.title;

  row.appendChild(cb);
  row.appendChild(label);

  if (todo.done) {
    var delBtn = document.createElement('button');
    delBtn.className = 'todo-delete-btn';
    delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    delBtn.addEventListener('click', function () {
      deleteDeptTodo(todo.id, dept);
    });
    row.appendChild(delBtn);
  }

  return row;
}

async function addDeptTodo(department, title) {
  var { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  await supabaseClient
    .from('dept_todos')
    .insert({ user_id: session.user.id, department: department, title: title });

  reloadSingleCard(department);
}

async function toggleDeptTodo(id, done, department) {
  await supabaseClient
    .from('dept_todos')
    .update({ done: done })
    .eq('id', id);

  reloadSingleCard(department);
}

async function deleteDeptTodo(id, department) {
  await supabaseClient
    .from('dept_todos')
    .delete()
    .eq('id', id);

  reloadSingleCard(department);
}

async function reloadSingleCard(department) {
  var { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  var container = document.getElementById('dept-todo-cards');
  if (!container) return;

  var { data: profile } = await supabaseClient
    .from('profiles')
    .select('departments')
    .eq('id', session.user.id)
    .single();

  var depts = (profile && profile.departments) ? profile.departments : [];
  var idx = depts.indexOf(department);
  if (idx === -1) return;

  var colors = CARD_COLORS[idx % CARD_COLORS.length];

  var { data: todos } = await supabaseClient
    .from('dept_todos')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('department', department)
    .order('created_at');

  if (!todos) todos = [];

  var cards = container.querySelectorAll('.dept-todo-card');
  var oldCard = cards[idx];
  var newCard = buildTodoCard(department, todos, colors);

  if (oldCard) {
    container.replaceChild(newCard, oldCard);
  }
}

/* --- Dashboard event flyers (Storage + dashboard_flyers) --- */
var DASHBOARD_FLYERS_BUCKET = 'event-flyers';

function canManageDashboardFlyers() {
  return typeof hasRole === 'function' && hasRole('owner', 'admin');
}

function dashboardFlyerPublicUrl(storagePath) {
  var out = supabaseClient.storage.from(DASHBOARD_FLYERS_BUCKET).getPublicUrl(storagePath);
  return out.data.publicUrl;
}

async function loadDashboardFlyers() {
  var grid = document.getElementById('dashboard-flyers-grid');
  if (!grid) return;

  var isManager = canManageDashboardFlyers();

  var { data, error } = await supabaseClient
    .from('dashboard_flyers')
    .select('id, storage_path, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('dashboard_flyers:', error);
    var msg = error.message || String(error);
    var hint = (msg.indexOf('does not exist') !== -1 || msg.indexOf('schema cache') !== -1)
      ? ' Run supabase/dashboard_flyers_setup.sql in the Supabase SQL editor.'
      : '';
    grid.innerHTML = '<p class="dashboard-flyers-empty">Flyers could not be loaded.' + hint + '</p>';
    return;
  }

  var rows = data || [];
  grid.innerHTML = '';

  rows.forEach(function (row) {
    grid.appendChild(buildDashboardFlyerCard(row, isManager));
  });

  if (isManager) {
    grid.appendChild(buildDashboardFlyerBlankCard());
  } else if (rows.length === 0) {
    grid.innerHTML = '<p class="dashboard-flyers-empty">No event flyers yet.</p>';
  }
}

function buildDashboardFlyerCard(row, isManager) {
  var card = document.createElement('div');
  card.className = 'dashboard-flyer-card';

  var img = document.createElement('img');
  img.className = 'dashboard-flyer-img';
  img.src = dashboardFlyerPublicUrl(row.storage_path);
  img.alt = 'Event flyer';
  img.loading = 'lazy';
  card.appendChild(img);

  if (isManager) {
    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'dashboard-flyer-delete';
    del.setAttribute('aria-label', 'Delete flyer');
    del.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    del.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteDashboardFlyer(row.id, row.storage_path);
    });
    card.appendChild(del);
  }

  return card;
}

function buildDashboardFlyerBlankCard() {
  var card = document.createElement('div');
  card.className = 'dashboard-flyer-card dashboard-flyer-card--blank';
  card.setAttribute('role', 'button');
  card.tabIndex = 0;
  card.setAttribute('aria-label', 'Upload a new flyer image');

  var input = document.createElement('input');
  input.type = 'file';
  input.className = 'dashboard-flyer-file-input';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';
  input.setAttribute('aria-hidden', 'true');

  function openPicker() {
    input.click();
  }

  card.addEventListener('click', function (e) {
    if (e.target === input) return;
    openPicker();
  });
  card.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  });

  input.addEventListener('change', function () {
    var f = input.files && input.files[0];
    input.value = '';
    if (f) uploadDashboardFlyer(f);
  });

  var inner = document.createElement('div');
  inner.className = 'dashboard-flyer-blank-inner';
  inner.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i><span>Upload flyer</span>';
  card.appendChild(inner);
  card.appendChild(input);

  return card;
}

async function uploadDashboardFlyer(file) {
  if (!canManageDashboardFlyers()) return;

  if (!file.type || file.type.indexOf('image/') !== 0) {
    window.alert('Please choose an image file (JPEG, PNG, WebP, or GIF).');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    window.alert('Image must be 5 MB or smaller.');
    return;
  }

  var rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  var ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].indexOf(rawExt) !== -1 ? rawExt : 'jpg';
  if (ext === 'jpeg') ext = 'jpg';

  var path = 'flyers/' + crypto.randomUUID() + '.' + ext;
  var contentType = file.type || 'image/jpeg';

  var { error: upErr } = await supabaseClient.storage
    .from(DASHBOARD_FLYERS_BUCKET)
    .upload(path, file, { contentType: contentType, upsert: false });

  if (upErr) {
    window.alert('Upload failed: ' + upErr.message);
    return;
  }

  var sortKey = Date.now();

  var { error: insErr } = await supabaseClient
    .from('dashboard_flyers')
    .insert({ storage_path: path, sort_order: sortKey });

  if (insErr) {
    await supabaseClient.storage.from(DASHBOARD_FLYERS_BUCKET).remove([path]);
    window.alert('Could not save flyer: ' + insErr.message);
    return;
  }

  loadDashboardFlyers();
}

async function deleteDashboardFlyer(id, storagePath) {
  if (!canManageDashboardFlyers()) return;
  if (!window.confirm('Remove this flyer from the dashboard?')) return;

  var { error: delRowErr } = await supabaseClient
    .from('dashboard_flyers')
    .delete()
    .eq('id', id);

  if (delRowErr) {
    window.alert('Could not remove flyer: ' + delRowErr.message);
    return;
  }

  var { error: delStErr } = await supabaseClient.storage
    .from(DASHBOARD_FLYERS_BUCKET)
    .remove([storagePath]);

  if (delStErr) {
    console.warn('Storage delete:', delStErr);
  }

  loadDashboardFlyers();
}
