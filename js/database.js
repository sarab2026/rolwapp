document.addEventListener('click', function (e) {
  var link = e.target.closest('#nav-database');
  if (!link) return;
  e.preventDefault();
  document.getElementById('home-panel').style.display = 'none';
  document.getElementById('calendar-panel').style.display = 'none';
  if (typeof setActiveNav === 'function') setActiveNav('nav-database');
  loadUsersPanel();
});

async function loadUsersPanel() {
  var panel = document.getElementById('database-panel');
  panel.style.display = 'block';

  var tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

  var { data: users, error } = await supabaseClient.rpc('get_all_users');

  if (error) {
    tbody.innerHTML = '<tr><td colspan="3">Failed to load users.</td></tr>';
    return;
  }

  tbody.innerHTML = '';

  users.forEach(function (user) {
    var tr = document.createElement('tr');

    var nameTd = document.createElement('td');
    nameTd.textContent = (user.first_name + ' ' + user.last_name).trim() || '—';
    tr.appendChild(nameTd);

    var emailTd = document.createElement('td');
    emailTd.textContent = user.email;
    tr.appendChild(emailTd);

    var roleTd = document.createElement('td');
    var select = document.createElement('select');
    select.className = 'role-select';
    select.setAttribute('data-user-id', user.id);

    ['member', 'admin', 'owner'].forEach(function (role) {
      var option = document.createElement('option');
      option.value = role;
      option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
      if (role === user.role) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener('change', function () {
      updateUserRole(user.id, this.value, this);
    });

    roleTd.appendChild(select);
    tr.appendChild(roleTd);
    tbody.appendChild(tr);
  });

  if (hasRole('owner')) {
    populateDonationDropdown(users);
    populateDeptDropdown(users);
    buildDeptCheckboxes();
  }
}

function populateDonationDropdown(users) {
  var dropdown = document.getElementById('donation-user');
  if (!dropdown) return;

  dropdown.innerHTML = '';

  var placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a user...';
  placeholder.disabled = true;
  placeholder.selected = true;
  dropdown.appendChild(placeholder);

  users.forEach(function (user) {
    var option = document.createElement('option');
    option.value = user.id;
    var name = (user.first_name + ' ' + user.last_name).trim() || '—';
    option.textContent = name + ' (' + user.email + ')';
    dropdown.appendChild(option);
  });
}

async function updateUserRole(userId, newRole, selectEl) {
  selectEl.disabled = true;

  var { error } = await supabaseClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    alert('Failed to update role: ' + error.message);
    loadUsersPanel();
  }

  selectEl.disabled = false;
}

document.getElementById('donation-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  var userId = document.getElementById('donation-user').value;
  var amount = parseFloat(document.getElementById('donation-amount').value);
  var msgEl = document.getElementById('donation-message');
  msgEl.textContent = '';
  msgEl.className = 'donation-message';

  if (!userId || isNaN(amount) || amount <= 0) return;

  var { error } = await supabaseClient
    .from('donations')
    .insert({ user_id: userId, amount: amount });

  if (error) {
    msgEl.textContent = 'Failed to add donation: ' + error.message;
    msgEl.classList.add('donation-error');
    return;
  }

  msgEl.textContent = 'Donation of $' + amount.toFixed(2) + ' added successfully.';
  msgEl.classList.add('donation-success');
  document.getElementById('donation-amount').value = '';
  document.getElementById('donation-user').selectedIndex = 0;
});

var DEPARTMENTS = [
  'Finance', 'Youth Ministry', 'Board', 'Praise Team',
  'In His Presence', 'Ushers', 'Greeters', 'IT/Media',
  'Security', 'Admin'
];

function populateDeptDropdown(users) {
  var dropdown = document.getElementById('dept-user');
  if (!dropdown) return;

  dropdown.innerHTML = '';

  var placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a user...';
  placeholder.disabled = true;
  placeholder.selected = true;
  dropdown.appendChild(placeholder);

  users.forEach(function (user) {
    var option = document.createElement('option');
    option.value = user.id;
    var name = (user.first_name + ' ' + user.last_name).trim() || '—';
    option.textContent = name + ' (' + user.email + ')';
    dropdown.appendChild(option);
  });
}

function buildDeptCheckboxes() {
  var group = document.getElementById('dept-checkbox-group');
  if (!group) return;
  group.innerHTML = '';

  DEPARTMENTS.forEach(function (dept) {
    var label = document.createElement('label');
    label.className = 'dept-checkbox-label';

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = dept;
    cb.name = 'dept-cb';

    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + dept));
    group.appendChild(label);
  });
}

document.getElementById('dept-user').addEventListener('change', async function () {
  var userId = this.value;
  if (!userId) return;

  document.getElementById('dept-save-btn').disabled = false;

  var { data, error } = await supabaseClient
    .from('profiles')
    .select('departments')
    .eq('id', userId)
    .single();

  var current = (!error && data && data.departments) ? data.departments : [];

  document.querySelectorAll('#dept-checkbox-group input[type="checkbox"]').forEach(function (cb) {
    cb.checked = current.indexOf(cb.value) !== -1;
  });
});

document.getElementById('dept-save-btn').addEventListener('click', async function () {
  var userId = document.getElementById('dept-user').value;
  var msgEl = document.getElementById('dept-message');
  msgEl.textContent = '';
  msgEl.className = 'donation-message';

  if (!userId) return;

  var selected = [];
  document.querySelectorAll('#dept-checkbox-group input[type="checkbox"]:checked').forEach(function (cb) {
    selected.push(cb.value);
  });

  this.disabled = true;

  var { error } = await supabaseClient
    .from('profiles')
    .update({ departments: selected })
    .eq('id', userId);

  this.disabled = false;

  if (error) {
    msgEl.textContent = 'Failed to save: ' + error.message;
    msgEl.classList.add('donation-error');
    return;
  }

  msgEl.textContent = 'Departments saved successfully.';
  msgEl.classList.add('donation-success');
});
