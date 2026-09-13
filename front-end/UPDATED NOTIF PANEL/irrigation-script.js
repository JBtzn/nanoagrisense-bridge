/* =========================================================
   NOTIFICATION BELL + PANEL
   Same behavior as the main dashboard: three severity tiers
   (critical / warning / log), unread badge, relative timestamps.
   ========================================================= */

const TIER_ICONS = {
  critical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="8" x2="12" y2="13"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  log: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>`
};

let notifications = []; // { id, tier: 'critical'|'warning'|'log', message, time: Date, read: bool }
let notifIdSeed = 1;
let notifPanelOpen = false;

function relativeTime(date){
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if(diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if(diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if(diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

function notifItemHtml(n){
  return `
    <div class="notif-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
      <span class="notif-item-icon">${TIER_ICONS[n.tier]}</span>
      <div class="notif-item-body">
        <p class="notif-item-msg">${n.message}</p>
        <p class="notif-item-time" data-time="${n.time.toISOString()}">${relativeTime(n.time)}</p>
      </div>
    </div>`;
}

function renderTierList(tier, listId, countId, emptyText){
  const items = notifications
    .filter(n => n.tier === tier)
    .sort((a, b) => b.time - a.time);
  document.getElementById(countId).textContent = items.length;
  document.getElementById(listId).innerHTML = items.length
    ? items.map(notifItemHtml).join('')
    : `<p class="notif-empty">${emptyText}</p>`;
}

function renderNotifications(){
  renderTierList('critical', 'critList', 'critCount', 'No critical alerts — no failsafes triggered.');
  renderTierList('warning', 'warnList', 'warnCount', 'No warnings — nothing to monitor right now.');
  renderTierList('log', 'logList', 'logCount', 'No recent activity.');
}

function updateNotifTimestamps(){
  document.querySelectorAll('.notif-item-time').forEach(el => {
    el.textContent = relativeTime(new Date(el.dataset.time));
  });
}

function unreadCount(){
  return notifications.filter(n => !n.read).length;
}

function renderBadge(){
  const count = unreadCount();
  const badge = document.getElementById('notifBadge');
  badge.textContent = count > 9 ? '9+' : count;
  badge.classList.toggle('is-hidden', count === 0);
}

function addNotification(tier, message){
  notifications.unshift({
    id: notifIdSeed++,
    tier, message,
    time: new Date(),
    read: notifPanelOpen // if the panel is already open, treat as seen immediately
  });
  if(notifications.length > 40) notifications.length = 40;
  renderNotifications();
  renderBadge();
}

function markAllNotificationsRead(){
  notifications.forEach(n => { n.read = true; });
  renderNotifications();
  renderBadge();
}

// ---- Seed data so the panel demonstrates all three tiers on load ----
function seedNotifications(){
  const now = Date.now();
  notifications = [
    { id: notifIdSeed++, tier: 'critical', message: 'Node_002 (Nanofertilizer): EC breached 2.5 mS/cm — nutrient dosing failsafe engaged.', time: new Date(now - 2 * 3600 * 1000), read: false },
    { id: notifIdSeed++, tier: 'critical', message: 'Node_001 (Mushroom): Soil temperature exceeded 35°C — cooling failsafe triggered.', time: new Date(now - 5 * 3600 * 1000), read: true },
    { id: notifIdSeed++, tier: 'warning', message: 'Node_001 battery at 42% — switched to Power Save mode.', time: new Date(now - 46 * 60 * 1000), read: false },
    { id: notifIdSeed++, tier: 'warning', message: 'Node_002: Soil pH trending acidic (5.8) — monitor before it drifts out of range.', time: new Date(now - 12 * 60 * 1000), read: false },
    { id: notifIdSeed++, tier: 'log', message: 'Node_001 telemetry sync completed — all parameters nominal.', time: new Date(now - 3 * 60 * 1000), read: false },
    { id: notifIdSeed++, tier: 'log', message: 'Automated irrigation cycle completed for Plot A.', time: new Date(now - 70 * 60 * 1000), read: true },
    { id: notifIdSeed++, tier: 'log', message: 'Node_002 reconnected to gateway after brief signal drop.', time: new Date(now - 4 * 3600 * 1000), read: true }
  ];
  renderNotifications();
  renderBadge();
}

// ---- Panel open / close ----
const notifBellBtn = document.getElementById('notifBellBtn');
const notifPanel = document.getElementById('notifPanel');

function openNotifPanel(){
  notifPanelOpen = true;
  notifPanel.classList.add('open');
  notifPanel.setAttribute('aria-hidden', 'false');
  notifBellBtn.setAttribute('aria-expanded', 'true');
  markAllNotificationsRead(); // badge fades out once the panel is opened and read
}

function closeNotifPanel(){
  notifPanelOpen = false;
  notifPanel.classList.remove('open');
  notifPanel.setAttribute('aria-hidden', 'true');
  notifBellBtn.setAttribute('aria-expanded', 'false');
}

notifBellBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  notifPanelOpen ? closeNotifPanel() : openNotifPanel();
});
document.addEventListener('click', (e) => {
  if(notifPanelOpen && !notifPanel.contains(e.target) && !notifBellBtn.contains(e.target)){
    closeNotifPanel();
  }
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && notifPanelOpen) closeNotifPanel();
});

seedNotifications();
setInterval(updateNotifTimestamps, 30 * 1000); // keep "X minutes ago" fresh

/* =========================================================
   CONTROL PANEL — Automatic Irrigation / Manual Override
   ========================================================= */

let autoIrrigationOn = true; // starts ON, matching the default dashboard state

const autoToggleBtn  = document.getElementById('autoToggleBtn');
const autoStatusIcon = document.getElementById('autoStatusIcon');
const autoStatusText = document.getElementById('autoStatusText');

const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>`;
const ICON_CROSS  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

// Manual valve state per reservoir — forced closed whenever automatic mode is on
const valveState = {
  1: 'close',
  2: 'close'
};

function updateAutoUI(){
  if(autoIrrigationOn){
    autoToggleBtn.textContent = 'DISABLE Automatic Irrigation';
    autoToggleBtn.classList.add('is-on');
    autoToggleBtn.classList.remove('is-off');
    autoStatusIcon.classList.add('on');
    autoStatusIcon.classList.remove('off');
    autoStatusIcon.innerHTML = ICON_CHECK;
    autoStatusText.textContent = 'ON';

    // Automatic mode takes over — both valves are forced closed and locked
    valveState[1] = 'close';
    valveState[2] = 'close';
  } else {
    autoToggleBtn.textContent = 'ENABLE Automatic Irrigation';
    autoToggleBtn.classList.add('is-off');
    autoToggleBtn.classList.remove('is-on');
    autoStatusIcon.classList.add('off');
    autoStatusIcon.classList.remove('on');
    autoStatusIcon.innerHTML = ICON_CROSS;
    autoStatusText.textContent = 'OFF';
  }

  updateValveUI(1);
  updateValveUI(2);
}

function updateValveUI(reservoirNum){
  const group = document.getElementById(`valveGroup${reservoirNum}`);
  const openBtn = group.querySelector('[data-action="open"]');
  const closeBtn = group.querySelector('[data-action="close"]');
  const state = valveState[reservoirNum];

  openBtn.classList.toggle('is-active', state === 'open');
  closeBtn.classList.toggle('is-active', state === 'close');

  // Manual override is only usable while automatic irrigation is off
  openBtn.disabled = autoIrrigationOn;
  closeBtn.disabled = autoIrrigationOn;
}

autoToggleBtn.addEventListener('click', () => {
  autoIrrigationOn = !autoIrrigationOn;
  updateAutoUI();
});

document.querySelectorAll('.cp-valve-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if(autoIrrigationOn) return; // locked while automatic mode is running
    const reservoirNum = btn.dataset.reservoir;
    valveState[reservoirNum] = btn.dataset.action;
    updateValveUI(reservoirNum);
  });
});

updateAutoUI();

/* =========================================================
   CONTROL PANEL — Water Level Sensors (real-time simulation)
   ========================================================= */

function sensorStatus(value){
  if(value < 40) return { label: 'Low', cls: 'low' };
  if(value > 80) return { label: 'High', cls: 'high' };
  return { label: 'Adequate', cls: 'adequate' };
}

function renderSensor(prefix, value, avg){
  document.getElementById(`${prefix}LevelVal`).textContent = value;
  document.getElementById(`${prefix}AvgVal`).textContent = avg;
  document.getElementById(`${prefix}PercentLabel`).textContent = `${value}%`;
  document.getElementById(`${prefix}Fill`).style.width = `${value}%`;
  document.getElementById(`${prefix}Handle`).style.left = `${value}%`;

  const status = sensorStatus(value);
  const statusEl = document.getElementById(`${prefix}StatusText`);
  statusEl.textContent = status.label;
  statusEl.classList.remove('low', 'adequate', 'high');
  statusEl.classList.add(status.cls);
}

const sensorData = {
  mix: { value: 72, avg: 68 },
  res: { value: 72, avg: 68 }
};

function tickSensor(sensor){
  // Small random real-time drift, kept mostly within the safe range
  const drift = (Math.random() - 0.5) * 6;
  let next = sensor.value + drift;
  next = Math.max(20, Math.min(95, next));
  sensor.value = Math.round(next);

  // Daily average creeps slowly toward the current value
  sensor.avg = Math.round(sensor.avg + (sensor.value - sensor.avg) * 0.05);
}

function updateAllSensors(){
  tickSensor(sensorData.mix);
  tickSensor(sensorData.res);
  renderSensor('mix', sensorData.mix.value, sensorData.mix.avg);
  renderSensor('res', sensorData.res.value, sensorData.res.avg);
}

updateAllSensors();
setInterval(updateAllSensors, 4000); // real-time-style refresh
