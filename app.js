// Mini Banner Training: simple SPA with three views
const views = {
  home: document.getElementById('view-home'),
  key: document.getElementById('view-swadder-key'),
  form: document.getElementById('view-swadder-form')
};
const topbar = document.getElementById('topbar');
const toast = document.getElementById('toast');
const searchInput = document.getElementById('centerSearchInput');
const searchResults = document.getElementById('searchResults');

// Simple pages registry (enough for the demo dropdown)
const PAGES = [
  { code: 'SWADDER', title: 'Address Information Form', open: () => go('/swadder/key') },
  { code: 'SPAIDEN', title: 'General Person Identification', open: () => alert('Demo only: SPAIDEN is not implemented.') },
  { code: 'GUAMESG', title: 'Banner Messages', open: () => alert('Demo only: GUAMESG is not implemented.') }
];

// Fake recent list
let recentlyOpened = [];

// Router
function go(path) {
  // naive router using path
  if (path === '/home') {
    topbar.classList.add('hidden');
    show(views.home);
  } else if (path === '/swadder/key') {
    topbar.classList.remove('hidden');
    show(views.key);
    focusID();
    markRecent('Address Information Form (SWADDER)');
  } else if (path === '/swadder/form') {
    topbar.classList.remove('hidden');
    show(views.form);
  }
  window.location.hash = path;
}

function show(el) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  el.classList.remove('hidden');
}

function focusID(){
  setTimeout(() => document.getElementById('key-id').focus(), 50);
}

// Tabs on home
const tabSearch = document.getElementById('tab-search');
const tabDirect = document.getElementById('tab-direct');
const panelSearch = document.getElementById('panel-search');
const panelDirect = document.getElementById('panel-direct');

tabSearch.addEventListener('click', () => {
  tabSearch.classList.add('tab--active'); tabSearch.setAttribute('aria-selected','true');
  tabDirect.classList.remove('tab--active'); tabDirect.setAttribute('aria-selected','false');
  panelSearch.classList.add('panel--active'); panelDirect.classList.remove('panel--active');
  document.getElementById('centerSearchInput').focus();
});
tabDirect.addEventListener('click', () => {
  tabDirect.classList.add('tab--active'); tabDirect.setAttribute('aria-selected','true');
  tabSearch.classList.remove('tab--active'); tabSearch.setAttribute('aria-selected','false');
  panelDirect.classList.add('panel--active'); panelSearch.classList.remove('panel--active');
  document.getElementById('directCode').focus();
});

// Search interactions
function renderResults(items){
  searchResults.innerHTML = '';
  if (!items.length){ searchResults.setAttribute('aria-expanded', 'false'); searchResults.classList.remove('show'); return; }
  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.setAttribute('role','option');
    li.setAttribute('id', `opt-${idx}`);
    li.innerHTML = `<strong>${item.code}</strong> — ${item.title}`;
    li.addEventListener('click', () => item.open());
    searchResults.appendChild(li);
  });
  searchResults.setAttribute('aria-expanded', 'true');
  searchResults.classList.add('show');
}
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toUpperCase();
  if (!q) { renderResults([]); return; }
  const matches = PAGES.filter(p => p.code.includes(q) || p.title.toUpperCase().includes(q));
  renderResults(matches);
});

// Direct navigation
document.getElementById('goDirect').addEventListener('click', () => {
  const code = document.getElementById('directCode').value.trim().toUpperCase();
  const page = PAGES.find(p => p.code === code);
  if (page) page.open();
  else showToast(`Code '${code}' not found (demo). Try SWADDER.`);
});

// Key block -> fetch student and load form
let CURRENT_STUDENT = null;

document.getElementById('key-go').addEventListener('click', async () => {
  const id = document.getElementById('key-id').value.trim();
  if (!id) { showToast('Please enter an ID'); return; }
  const students = await loadStudents();
  const match = students.find(s => s.id.toUpperCase() === id.toUpperCase());
  if (!match) { showToast(`No person found for ID '${id}' (demo data).`); return; }
  CURRENT_STUDENT = match;
  fillForm(match);
  go('/swadder/form');
});

// Fill the form with a student record
function fillForm(s) {
  // Address info
  document.getElementById('addrType').value = s.address.type;
  document.getElementById('state').value = s.address.stateProv;
  document.getElementById('zip').value = s.address.postcode;
  document.getElementById('county').value = s.address.county;
  document.getElementById('nation').value = s.address.nationName;
  document.getElementById('fromDate').value = s.address.fromDate || '';
  document.getElementById('toDate').value = s.address.toDate || '';
  document.getElementById('addr1').value = s.address.line1;
  document.getElementById('addr2').value = s.address.line2 || '';
  document.getElementById('addr3').value = s.address.line3 || '';
  document.getElementById('city').value = s.address.city;

  // Emergency contact (optional fake)
  document.getElementById('emgFirst').value = s.emergency.firstName || '';
  document.getElementById('emgInitial').value = s.emergency.initial || '';
  document.getElementById('emgLast').value = s.emergency.lastName || '';
  document.getElementById('emgRelationship').value = s.emergency.relationship || '';

  // Phone
  document.getElementById('phone').value = s.phone.number;
  document.getElementById('phoneType').value = s.phone.type;
  document.getElementById('phonePrimary').checked = true;
  document.getElementById('phoneUnlisted').checked = false;
  document.getElementById('phoneInactive').checked = false;
}

// Save (demo)
document.querySelectorAll('[data-action="save"]').forEach(btn => btn.addEventListener('click', () => {
  showToast('Saved (demo only — nothing persisted).');
}));

// Start Over buttons
function startOver(){
  document.getElementById('key-id').value='';
  CURRENT_STUDENT = null;
  go('/home');
}
document.querySelectorAll('[data-action="start-over"]').forEach(btn => btn.addEventListener('click', startOver));

// Sidebar buttons (only Dashboard wired)
document.querySelectorAll('.sidebar__btn[data-route="home"]').forEach(b => b.addEventListener('click', () => go('/home')));

// Recently opened (fake)
function markRecent(caption){
  recentlyOpened.unshift(caption);
  recentlyOpened = [...new Set(recentlyOpened)].slice(0, 5);
}

// Helpers
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

async function loadStudents(){
  const res = await fetch('data/students.json', {cache:'no-store'});
  return res.json();
}

// Init
(function init(){
  // Hash route if present
  if (location.hash && location.hash.length > 1) go(location.hash.slice(1));
  else go('/home');
})();
