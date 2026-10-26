const STORAGE_KEY = 'sound-and-service-v1';

const seedData = {
  instructions: [
    { id: 'g1', title: 'Sunday sound check', category: 'Audio', content: 'Arrive 45 minutes before service. Power on the mixer and stage boxes, check microphones one at a time, then confirm playback and livestream audio.' },
    { id: 'g2', title: 'Projector & lyrics', category: 'Presentation', content: 'Open the service presentation, check the confidence monitor, and confirm lyrics with the worship leader before doors open.' },
    { id: 'g3', title: 'Livestream checklist', category: 'Streaming', content: 'Check camera framing, confirm stream destination, test audio sync, and start the stream 5 minutes before the service begins.' },
    { id: 'g4', title: 'Pack-down & equipment care', category: 'General', content: 'Mute channels before powering down. Coil cables neatly, return microphones to their cases, and leave the booth tidy for the next team.' }
  ],
  schedule: [
    { id: 's1', date: upcomingSunday(0), time: '09:00', service: 'Sunday morning service', role: 'Audio engineer', memberId: 'm1', status: 'Confirmed' },
    { id: 's2', date: upcomingSunday(0), time: '09:00', service: 'Sunday morning service', role: 'Slides & lyrics', memberId: 'm2', status: 'Confirmed' },
    { id: 's3', date: upcomingSunday(0), time: '09:00', service: 'Sunday morning service', role: 'Camera operator', memberId: 'm3', status: 'To confirm' },
    { id: 's4', date: upcomingSunday(1), time: '09:00', service: 'Sunday morning service', role: 'Audio engineer', memberId: 'm2', status: 'Confirmed' }
  ],
  timetable: [
    { id: 't1', time: '08:00', activity: 'Team arrival & setup', location: 'Main auditorium', notes: 'Unlock booth and power up equipment.' },
    { id: 't2', time: '08:30', activity: 'Sound check', location: 'Main auditorium', notes: 'Check microphones, instruments and stream mix.' },
    { id: 't3', time: '09:00', activity: 'Doors open', location: 'Main auditorium', notes: 'Welcome music and welcome slide on screen.' },
    { id: 't4', time: '09:30', activity: 'Service begins', location: 'Main auditorium', notes: 'Livestream starts; follow service lead cues.' },
    { id: 't5', time: '11:15', activity: 'Pack-down', location: 'Main auditorium', notes: 'Power down safely and return equipment.' }
  ],
  members: [
    { id: 'm1', name: 'Jordan Lee', role: 'Audio', email: 'jordan@example.com', availability: 'Most Sundays' },
    { id: 'm2', name: 'Taylor Morgan', role: 'Presentation', email: 'taylor@example.com', availability: 'Twice a month' },
    { id: 'm3', name: 'Alex Chen', role: 'Video & cameras', email: 'alex@example.com', availability: 'Most Sundays' },
    { id: 'm4', name: 'Sam Rivera', role: 'Team lead', email: 'sam@example.com', availability: 'Weekly' }
  ]
};

const fieldDefinitions = {
  instructions: [
    { key: 'title', label: 'Instruction title', required: true },
    { key: 'category', label: 'Category', required: true },
    { key: 'content', label: 'Instructions', type: 'textarea', required: true }
  ],
  schedule: [
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'time', label: 'Call time', type: 'time', required: true },
    { key: 'service', label: 'Service or event', required: true },
    { key: 'role', label: 'Team role', required: true },
    { key: 'memberId', label: 'Team member', type: 'member', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'To confirm'] }
  ],
  timetable: [
    { key: 'time', label: 'Time', type: 'time', required: true },
    { key: 'activity', label: 'Activity', required: true },
    { key: 'location', label: 'Location' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ],
  members: [
    { key: 'name', label: 'Name', required: true },
    { key: 'role', label: 'Role', required: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'availability', label: 'Availability' }
  ]
};

let data = loadData();
let editing = null;
let activeCollection = null;

function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function upcomingSunday(weeksAhead) {
  const date = new Date();
  const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSunday + weeksAhead * 7);
  return date.toISOString().slice(0, 10);
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...seedData, ...JSON.parse(saved) } : structuredClone(seedData);
  } catch (error) {
    console.error('Could not load saved team data:', error);
    return structuredClone(seedData);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Could not save team data:', error);
    alert('Your changes could not be saved in this browser. Check available storage and try again.');
    return false;
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
}

function formatDate(dateString, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : new Intl.DateTimeFormat(undefined, options).format(date);
}

function memberName(id) {
  return data.members.find((member) => member.id === id)?.name || 'Unassigned';
}

function setPage(page) {
  document.querySelectorAll('.page').forEach((section) => section.classList.toggle('active', section.id === `page-${page}`));
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
  const pageLabels = { overview: 'Overview', schedule: 'Team schedule', timetable: 'Service timetable', instructions: 'Instructions', members: 'Team members' };
  document.getElementById('crumb').textContent = pageLabels[page] || 'Overview';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function emptyState(title, message) {
  return `<div class="empty-state"><strong>${escapeHtml(title)}</strong>${escapeHtml(message)}</div>`;
}

function renderOverview() {
  const upcoming = data.schedule.filter((item) => item.date >= futureDate(0)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  document.getElementById('stat-next').textContent = upcoming[0]?.service || '—';
  document.getElementById('stat-next-date').textContent = upcoming[0] ? `${formatDate(upcoming[0].date)} · ${upcoming[0].time}` : 'No upcoming service';
  document.getElementById('stat-members').textContent = data.members.length;
  document.getElementById('stat-guides').textContent = data.instructions.length;

  const upcomingList = document.getElementById('upcoming-list');
  const byService = [];
  upcoming.forEach((item) => {
    const key = `${item.date}|${item.service}`;
    let group = byService.find((entry) => entry.key === key);
    if (!group) {
      group = { key, date: item.date, service: item.service, time: item.time, people: [] };
      byService.push(group);
    }
    group.people.push(memberName(item.memberId));
  });
  upcomingList.innerHTML = byService.length ? byService.slice(0, 3).map((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    return `<div class="upcoming-row"><div class="date-block"><strong>${date.getDate()}</strong><small>${escapeHtml(new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date))}</small></div><div class="upcoming-info"><strong>${escapeHtml(item.service)}</strong><small>${escapeHtml(formatDate(item.date, { weekday: 'long' }))} · ${escapeHtml(item.time)}</small></div><span class="person-chip"><span class="avatar">${escapeHtml(initials(item.people[0]))}</span>${escapeHtml(item.people.length > 1 ? `${item.people[0]} +${item.people.length - 1}` : item.people[0])}</span></div>`;
  }).join('') : emptyState('Nothing scheduled yet', 'Add a team shift to get started.');

  const timetable = [...data.timetable].sort((a, b) => a.time.localeCompare(b.time));
  document.getElementById('overview-timetable').innerHTML = timetable.length
    ? timetable.slice(0, 4).map((item) => `<div class="mini-row"><time>${escapeHtml(item.time)}</time><span>${escapeHtml(item.activity)}</span></div>`).join('')
    : emptyState('No timetable items', 'Add a few moments to the service flow.');
}

function renderSchedule(filter = '') {
  const items = data.schedule.filter((item) => `${item.date} ${item.time} ${item.service} ${item.role} ${memberName(item.memberId)} ${item.status}`.toLowerCase().includes(filter.toLowerCase())).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  document.getElementById('schedule-count').textContent = `${items.length} ${items.length === 1 ? 'shift' : 'shifts'}`;
  document.getElementById('schedule-list').innerHTML = items.length ? items.map((item) => `<article class="list-card"><div class="date-block"><strong>${escapeHtml(new Date(`${item.date}T12:00:00`).getDate())}</strong><small>${escapeHtml(formatDate(item.date, { month: 'short' }))}</small></div><div class="list-card-main"><strong>${escapeHtml(item.service)}</strong><div class="list-meta"><span>${escapeHtml(item.time)}</span><span>${escapeHtml(item.role)}</span><span>${escapeHtml(memberName(item.memberId))}</span><span>${escapeHtml(item.status)}</span></div></div><div class="list-actions"><button class="small-action" data-edit="schedule" data-id="${escapeHtml(item.id)}" aria-label="Edit shift">✎</button><button class="small-action" data-delete="schedule" data-id="${escapeHtml(item.id)}" aria-label="Delete shift">×</button></div></article>`).join('') : emptyState('No shifts found', filter ? 'Try a different search.' : 'Add a shift to start planning the team rota.');
}

function renderTimetable(filter = '') {
  const items = data.timetable.filter((item) => `${item.time} ${item.activity} ${item.location} ${item.notes}`.toLowerCase().includes(filter.toLowerCase())).sort((a, b) => a.time.localeCompare(b.time));
  document.getElementById('timetable-count').textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
  document.getElementById('timetable-list').innerHTML = items.length ? items.map((item) => `<article class="list-card"><div class="date-block"><strong>${escapeHtml(item.time)}</strong><small>TIME</small></div><div class="list-card-main"><strong>${escapeHtml(item.activity)}</strong><div class="list-meta"><span>${escapeHtml(item.location || 'No location')}</span></div>${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}</div><div class="list-actions"><button class="small-action" data-edit="timetable" data-id="${escapeHtml(item.id)}" aria-label="Edit timetable item">✎</button><button class="small-action" data-delete="timetable" data-id="${escapeHtml(item.id)}" aria-label="Delete timetable item">×</button></div></article>`).join('') : emptyState('No timetable items found', filter ? 'Try a different search.' : 'Add a service moment to build the timetable.');
}

function renderInstructions(filter = '') {
  const items = data.instructions.filter((item) => `${item.title} ${item.category} ${item.content}`.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('instructions-count').textContent = `${items.length} ${items.length === 1 ? 'guide' : 'guides'}`;
  document.getElementById('instructions-list').innerHTML = items.length ? items.map((item) => `<article class="guide-card"><div class="guide-top"><span class="guide-symbol">▤</span><div class="list-actions"><button class="small-action" data-edit="instructions" data-id="${escapeHtml(item.id)}" aria-label="Edit instruction">✎</button><button class="small-action" data-delete="instructions" data-id="${escapeHtml(item.id)}" aria-label="Delete instruction">×</button></div></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.content)}</p><span class="guide-category">${escapeHtml(item.category)}</span></article>`).join('') : emptyState('No guides found', filter ? 'Try a different search.' : 'Add a helpful instruction for your team.');
}

function renderMembers(filter = '') {
  const items = data.members.filter((item) => `${item.name} ${item.role} ${item.email} ${item.availability}`.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('members-count').textContent = `${items.length} ${items.length === 1 ? 'member' : 'members'}`;
  document.getElementById('members-list').innerHTML = items.length ? items.map((item) => `<article class="member-card"><span class="avatar">${escapeHtml(initials(item.name))}</span><div class="member-info"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.role)}</p>${item.availability ? `<span class="member-detail">${escapeHtml(item.availability)}</span>` : ''}${item.email ? `<span class="member-detail">${escapeHtml(item.email)}</span>` : ''}</div><div class="list-actions"><button class="small-action" data-edit="members" data-id="${escapeHtml(item.id)}" aria-label="Edit member">✎</button><button class="small-action" data-delete="members" data-id="${escapeHtml(item.id)}" aria-label="Delete member">×</button></div></article>`).join('') : emptyState('No members found', filter ? 'Try a different search.' : 'Add a team member to get started.');
}

function renderAll() {
  renderOverview();
  renderSchedule(document.querySelector('[data-search="schedule"]').value);
  renderTimetable(document.querySelector('[data-search="timetable"]').value);
  renderInstructions(document.querySelector('[data-search="instructions"]').value);
  renderMembers(document.querySelector('[data-search="members"]').value);
}

function fieldMarkup(field, value = '') {
  const id = `field-${field.key}`;
  let input;
  if (field.type === 'textarea') {
    input = `<textarea id="${id}" name="${field.key}" ${field.required ? 'required' : ''}>${escapeHtml(value)}</textarea>`;
  } else if (field.type === 'select') {
    input = `<select id="${id}" name="${field.key}">${field.options.map((option) => `<option ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`;
  } else if (field.type === 'member') {
    input = `<select id="${id}" name="${field.key}" required>${data.members.map((member) => `<option value="${escapeHtml(member.id)}" ${member.id === value ? 'selected' : ''}>${escapeHtml(member.name)} — ${escapeHtml(member.role)}</option>`).join('')}</select>`;
  } else {
    input = `<input id="${id}" name="${field.key}" type="${field.type || 'text'}" value="${escapeHtml(value)}" ${field.required ? 'required' : ''}>`;
  }
  return `<label class="field-label" for="${id}">${escapeHtml(field.label)}${input}</label>`;
}

function openEditor(collection, id = null) {
  if (collection === 'schedule' && !data.members.length) {
    alert('Add a team member before creating a schedule shift.');
    setPage('members');
    return;
  }
  activeCollection = collection;
  editing = id ? data[collection].find((item) => item.id === id) : null;
  document.getElementById('dialog-title').textContent = `${editing ? 'Edit' : 'Add'} ${collection === 'members' ? 'member' : collection === 'instructions' ? 'instruction' : collection === 'timetable' ? 'timetable item' : 'schedule shift'}`;
  const fields = fieldDefinitions[collection];
  const fieldHtml = fields.map((field) => fieldMarkup(field, editing?.[field.key] ?? (field.key === 'date' ? upcomingSunday(0) : field.key === 'time' ? '09:00' : field.key === 'status' ? 'To confirm' : ''))).join('');
  document.getElementById('dialog-fields').innerHTML = fieldHtml;
  document.getElementById('edit-dialog').showModal();
}

function deleteItem(collection, id) {
  const item = data[collection].find((entry) => entry.id === id);
  if (!item || !confirm(`Delete “${item.title || item.name || item.activity || item.service}”? This cannot be undone.`)) return;
  data[collection] = data[collection].filter((entry) => entry.id !== id);
  if (collection === 'members') data.schedule.forEach((shift) => { if (shift.memberId === id) shift.memberId = ''; });
  if (saveData()) renderAll();
}

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.page)));
document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.go)));
document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => openEditor(button.dataset.add)));
document.querySelectorAll('[data-search]').forEach((input) => input.addEventListener('input', () => {
  const renderers = { schedule: renderSchedule, timetable: renderTimetable, instructions: renderInstructions, members: renderMembers };
  renderers[input.dataset.search](input.value);
}));
document.querySelectorAll('.close-dialog').forEach((button) => button.addEventListener('click', () => document.getElementById('edit-dialog').close()));

document.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  if (editButton) openEditor(editButton.dataset.edit, editButton.dataset.id);
  if (deleteButton) deleteItem(deleteButton.dataset.delete, deleteButton.dataset.id);
});

document.getElementById('edit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const next = { ...values, id: editing?.id || `${activeCollection[0]}${Date.now()}` };
  if (activeCollection === 'members' && !next.email) delete next.email;
  if (activeCollection === 'members' && !next.availability) delete next.availability;
  if (activeCollection === 'timetable' && !next.notes) delete next.notes;
  if (activeCollection === 'timetable' && !next.location) delete next.location;
  if (editing) data[activeCollection] = data[activeCollection].map((item) => item.id === editing.id ? next : item);
  else data[activeCollection].push(next);
  if (saveData()) {
    document.getElementById('edit-dialog').close();
    renderAll();
  }
});

document.getElementById('today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
renderAll();
