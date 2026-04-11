var calCurrentMonth = new Date().getMonth();
var calCurrentYear = new Date().getFullYear();

var MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

document.addEventListener('click', function (e) {
  var link = e.target.closest('#nav-calendar');
  if (!link) return;
  e.preventDefault();
  showCalendarPanel();
});

function showCalendarPanel() {
  document.getElementById('home-panel').style.display = 'none';
  document.getElementById('database-panel').style.display = 'none';
  document.getElementById('calendar-panel').style.display = 'block';

  if (typeof setActiveNav === 'function') setActiveNav('nav-calendar');

  var addBtn = document.getElementById('add-event-btn');
  if (!hasRole('owner', 'admin')) {
    addBtn.style.display = 'none';
  } else {
    addBtn.style.display = '';
  }

  renderCalendar();
}

document.getElementById('cal-prev').addEventListener('click', function () {
  calCurrentMonth--;
  if (calCurrentMonth < 0) {
    calCurrentMonth = 11;
    calCurrentYear--;
  }
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', function () {
  calCurrentMonth++;
  if (calCurrentMonth > 11) {
    calCurrentMonth = 0;
    calCurrentYear++;
  }
  renderCalendar();
});

async function renderCalendar() {
  document.getElementById('cal-month-year').textContent =
    MONTH_NAMES[calCurrentMonth] + ' ' + calCurrentYear;

  var grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  DAY_NAMES.forEach(function (day) {
    var header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    grid.appendChild(header);
  });

  var firstDay = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
  var daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

  for (var i = 0; i < firstDay; i++) {
    var empty = document.createElement('div');
    empty.className = 'calendar-day calendar-day-empty';
    grid.appendChild(empty);
  }

  var events = await fetchEvents(calCurrentYear, calCurrentMonth);

  for (var d = 1; d <= daysInMonth; d++) {
    var cell = document.createElement('div');
    cell.className = 'calendar-day';

    var dateNum = document.createElement('span');
    dateNum.className = 'calendar-date-num';
    dateNum.textContent = d;
    cell.appendChild(dateNum);

    var dateStr = calCurrentYear + '-' +
      String(calCurrentMonth + 1).padStart(2, '0') + '-' +
      String(d).padStart(2, '0');

    var dayEvents = events.filter(function (ev) { return ev.event_date === dateStr; });
    dayEvents.forEach(function (ev) {
      var pill = document.createElement('div');
      pill.className = 'calendar-event';
      pill.textContent = ev.title;
      pill.style.cursor = 'pointer';
      pill.addEventListener('click', function () {
        showEventDetail(ev);
      });
      cell.appendChild(pill);
    });

    grid.appendChild(cell);
  }
}

async function fetchEvents(year, month) {
  var startDate = year + '-' + String(month + 1).padStart(2, '0') + '-01';
  var endDay = new Date(year, month + 1, 0).getDate();
  var endDate = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(endDay).padStart(2, '0');

  var { data, error } = await supabaseClient
    .from('events')
    .select('id, title, event_date, event_time, description')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date')
    .order('event_time', { nullsFirst: false });

  if (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
  return data || [];
}

function formatTime(timeStr) {
  if (!timeStr) return null;
  var parts = timeStr.split(':');
  var hours = parseInt(parts[0], 10);
  var minutes = parts[1];
  var suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return hours + ':' + minutes + ' ' + suffix;
}

function formatDate(dateStr) {
  var parts = dateStr.split('-');
  var month = MONTH_NAMES[parseInt(parts[1], 10) - 1];
  var day = parseInt(parts[2], 10);
  return month + ' ' + day + ', ' + parts[0];
}

function showEventDetail(ev) {
  document.getElementById('detail-title').textContent = ev.title;
  document.getElementById('detail-date').textContent = formatDate(ev.event_date);

  var timeRow = document.getElementById('detail-time-row');
  var timeEl = document.getElementById('detail-time');
  if (ev.event_time) {
    timeEl.textContent = formatTime(ev.event_time);
    timeRow.style.display = '';
  } else {
    timeRow.style.display = 'none';
  }

  var descRow = document.getElementById('detail-desc-row');
  var descEl = document.getElementById('detail-description');
  if (ev.description) {
    descEl.textContent = ev.description;
    descRow.style.display = '';
  } else {
    descRow.style.display = 'none';
  }

  var deleteBtn = document.getElementById('detail-delete-btn');
  if (hasRole('owner', 'admin')) {
    deleteBtn.style.display = '';
    deleteBtn.onclick = function () {
      deleteEvent(ev.id, ev.title);
    };
  } else {
    deleteBtn.style.display = 'none';
  }

  document.getElementById('event-detail-modal').style.display = 'flex';
}

document.getElementById('detail-close-btn').addEventListener('click', function () {
  document.getElementById('event-detail-modal').style.display = 'none';
});

document.getElementById('event-detail-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    this.style.display = 'none';
  }
});

document.getElementById('add-event-btn').addEventListener('click', function () {
  document.getElementById('event-title').value = '';
  document.getElementById('event-time').value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-date').value =
    calCurrentYear + '-' + String(calCurrentMonth + 1).padStart(2, '0') + '-01';
  document.getElementById('event-modal').style.display = 'flex';
});

document.getElementById('event-modal-cancel').addEventListener('click', function () {
  document.getElementById('event-modal').style.display = 'none';
});

document.getElementById('event-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    this.style.display = 'none';
  }
});

document.getElementById('event-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  var title = document.getElementById('event-title').value.trim();
  var eventDate = document.getElementById('event-date').value;
  var eventTime = document.getElementById('event-time').value || null;
  var description = document.getElementById('event-description').value.trim() || null;

  if (!title || !eventDate) return;

  var { data: { session } } = await supabaseClient.auth.getSession();

  var { error } = await supabaseClient
    .from('events')
    .insert({
      title: title,
      event_date: eventDate,
      event_time: eventTime,
      description: description,
      created_by: session.user.id
    });

  if (error) {
    alert('Failed to add event: ' + error.message);
    return;
  }

  document.getElementById('event-title').value = '';
  document.getElementById('event-time').value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-modal').style.display = 'none';
  renderCalendar();
});

async function deleteEvent(eventId, eventTitle) {
  if (!confirm('Delete event "' + eventTitle + '"?')) return;

  var { error } = await supabaseClient
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    alert('Failed to delete event: ' + error.message);
    return;
  }

  document.getElementById('event-detail-modal').style.display = 'none';
  renderCalendar();
}
