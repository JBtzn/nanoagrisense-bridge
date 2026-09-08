/* =========================================================
   SOIL PARAMETER CHART CAROUSEL
   Colors reused from styles.css palette:
   leaf #4c7a3a / leaf-dark #2f4f22 / violet (ochre) #a97a2b /
   teal (sky) #1f7fa0 / crimson (terracotta) #a8472e / cream #f6f2da
   ========================================================= */

// Shared plot area — left margin reserved for y-axis value labels
const PLOT_LEFT = 34, PLOT_RIGHT = 352, PX_TOP = 20, PX_BOTTOM = 180;

function valueToY(value, valMin, valMax){
  const t = (value - valMin) / (valMax - valMin);
  return PX_BOTTOM - t * (PX_BOTTOM - PX_TOP);
}

function xAt(i, n){ return PLOT_LEFT + ((PLOT_RIGHT - PLOT_LEFT) / (n - 1)) * i; }

function toPoints(values, valMin, valMax){
  return values.map((v, i) => ({ x: xAt(i, values.length), y: valueToY(v, valMin, valMax) }));
}

// Smooth (Catmull-Rom -> Bezier) path, used for the moisture + temperature charts
function smoothPath(points){
  let d = `M${points[0].x},${points[0].y}`;
  for(let i = 0; i < points.length - 1; i++){
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

// Straight-segment path, used for step / dynamic-color charts
function linePath(points){
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

// Staircase path (holds value until the next reading), used for the EC chart
function stepPath(points){
  let d = `M${points[0].x},${points[0].y}`;
  for(let i = 1; i < points.length; i++){
    d += ` L${points[i].x},${points[i - 1].y} L${points[i].x},${points[i].y}`;
  }
  return d;
}

function areaPath(linePart, points){
  const first = points[0], last = points[points.length - 1];
  return `${linePart} L${last.x},${PX_BOTTOM} L${first.x},${PX_BOTTOM} Z`;
}

// Real value-based y-axis: gridlines + labels drawn at the same y as the tick value
function yAxis(valMin, valMax, formatter, tickCount = 4){
  let lines = '', labels = '';
  for(let i = 0; i <= tickCount; i++){
    const value = valMin + (valMax - valMin) * (i / tickCount);
    const y = valueToY(value, valMin, valMax);
    lines += `<line x1="${PLOT_LEFT}" y1="${y}" x2="${PLOT_RIGHT}" y2="${y}" stroke="#eae5c9" stroke-width="1"/>`;
    labels += `<text x="${PLOT_LEFT - 8}" y="${y + 3}" text-anchor="end" class="chart-axis-label">${formatter(value)}</text>`;
  }
  return `<g>${lines}</g><g>${labels}</g>`;
}

function xAxisLabels(labels){
  const mid = (PLOT_LEFT + PLOT_RIGHT) / 2;
  return `<g class="chart-axis-label">
    <text x="${PLOT_LEFT}" y="196" text-anchor="start">${labels[0]}</text>
    <text x="${mid}" y="196" text-anchor="middle">${labels[1]}</text>
    <text x="${PLOT_RIGHT}" y="196" text-anchor="end">${labels[2]}</text>
  </g>`;
}

// Live-updatable chart datasets — mutated in place by nudgeChartsData()
const chartData = {
  moisture: [44, 50, 58, 64, 69, 72, 67, 60, 54, 61, 66],
  temp: [19, 21, 25, 29, 33, 36, 34, 30, 26, 22, 20],
  ec: [1.1, 1.1, 1.7, 1.7, 2.6, 2.6, 2.9, 2.9, 2.0, 2.0, 1.5],
  ph: [5.7, 6.0, 6.3, 6.6, 6.9, 7.1, 7.4, 7.6, 7.3, 6.8, 6.4],
  npkNodes: [
    { label: 'Node_001', N: 180, P: 95, K: 210 },
    { label: 'Node_002', N: 150, P: 80, K: 175 }
  ]
};

const CHARTS = [

  // 1. SOIL MOISTURE — smooth line + gradient fill + optimal band + irrigation trigger droplets
  {
    title: 'Soil Moisture Analytics',
    subtitle: 'Sensor cluster B-3 · 24h view',
    legend: [
      { color: '#4c7a3a', label: 'Soil moisture %' },
      { color: '#cfe6c2', label: 'Optimal zone (50–70%)' },
      { color: '#4c7a3a', label: 'Irrigation trigger', icon: 'drop' }
    ],
    render(){
      const valMin = 0, valMax = 100;
      const values = chartData.moisture;
      const pts = toPoints(values, valMin, valMax);
      const line = smoothPath(pts);
      const bandTop = valueToY(70, valMin, valMax);
      const bandBottom = valueToY(50, valMin, valMax);
      const triggers = [2, 8];
      const drops = triggers.map(i => `
        <g transform="translate(${pts[i].x},${pts[i].y - 20})">
          <path d="M0,-7 C4,-1 6,2 6,5 A6,6 0 1 1 -6,5 C-6,2 -4,-1 0,-7 Z" fill="#4c7a3a" stroke="#fffdf3" stroke-width="1.2"/>
        </g>`).join('');
      return `
        <svg viewBox="0 0 360 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#4c7a3a" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#4c7a3a" stop-opacity="0"/>
            </linearGradient>
          </defs>
          ${yAxis(valMin, valMax, v => `${Math.round(v)}%`)}
          <rect x="${PLOT_LEFT}" y="${bandTop}" width="${PLOT_RIGHT - PLOT_LEFT}" height="${bandBottom - bandTop}" fill="#4c7a3a" opacity="0.12"/>
          <path d="${areaPath(line, pts)}" fill="url(#fillGrad)"/>
          <path d="${line}" fill="none" stroke="#4c7a3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <g fill="#4c7a3a">${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3"/>`).join('')}</g>
          ${drops}
          ${xAxisLabels(['00:00', '12:00', '24:00'])}
        </svg>`;
    }
  },

  // 2. SOIL TEMPERATURE — spline + day/night bands + high/low threshold lines
  {
    title: 'Soil Temperature Dynamics',
    subtitle: 'Sensor cluster B-3 · 24h view',
    legend: [
      { color: '#a8472e', label: 'Soil temperature °C' },
      { color: '#a8472e', label: 'High warning (>35°C)', dashed: true },
      { color: '#1f7fa0', label: 'Low warning (<18°C)', dashed: true }
    ],
    render(){
      const valMin = 10, valMax = 40;
      const values = chartData.temp;
      const pts = toPoints(values, valMin, valMax);
      const line = smoothPath(pts);
      const highY = valueToY(35, valMin, valMax);
      const lowY = valueToY(18, valMin, valMax);
      const bandW = (PLOT_RIGHT - PLOT_LEFT) / 4;
      return `
        <svg viewBox="0 0 360 200" preserveAspectRatio="none">
          <g opacity="0.5">
            <rect x="${PLOT_LEFT + bandW}" y="${PX_TOP}" width="${bandW}" height="${PX_BOTTOM - PX_TOP}" fill="#2c2a1e" opacity="0.05"/>
            <rect x="${PLOT_LEFT + bandW * 3}" y="${PX_TOP}" width="${bandW}" height="${PX_BOTTOM - PX_TOP}" fill="#2c2a1e" opacity="0.05"/>
          </g>
          ${yAxis(valMin, valMax, v => `${Math.round(v)}°C`)}
          <line x1="${PLOT_LEFT}" y1="${highY}" x2="${PLOT_RIGHT}" y2="${highY}" stroke="#a8472e" stroke-width="1.5" stroke-dasharray="6 5"/>
          <line x1="${PLOT_LEFT}" y1="${lowY}" x2="${PLOT_RIGHT}" y2="${lowY}" stroke="#1f7fa0" stroke-width="1.5" stroke-dasharray="6 5"/>
          <path d="${line}" fill="none" stroke="#a8472e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <g fill="#a8472e">${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3"/>`).join('')}</g>
          ${xAxisLabels(['00:00', '12:00', '24:00'])}
        </svg>`;
    }
  },

  // 3. ELECTRICAL CONDUCTIVITY / SALINITY — step line + alert region + fertigation pins
  {
    title: 'Electrical Conductivity & Salinity',
    subtitle: 'Sensor cluster B-3 · mS/cm',
    legend: [
      { color: '#a97a2b', label: 'EC (mS/cm)' },
      { color: '#a8472e', label: 'Salinity buildup (>2.5 mS/cm)' },
      { color: '#1f7fa0', label: 'Fertigation event', icon: 'pin' }
    ],
    render(){
      const valMin = 0, valMax = 3.5;
      const values = chartData.ec;
      const pts = toPoints(values, valMin, valMax);
      const path = stepPath(pts);
      const alertY = valueToY(2.5, valMin, valMax);
      const pins = [4, 6].map(i => `
        <g transform="translate(${pts[i].x},${pts[i].y - 26})">
          <path d="M0,0 C-6,-8 -6,-16 0,-16 C6,-16 6,-8 0,0 Z" fill="#1f7fa0" stroke="#fffdf3" stroke-width="1.2"/>
          <circle cx="0" cy="-16" r="2.4" fill="#fffdf3"/>
        </g>`).join('');
      return `
        <svg viewBox="0 0 360 200" preserveAspectRatio="none">
          ${yAxis(valMin, valMax, v => v.toFixed(1))}
          <rect x="${PLOT_LEFT}" y="${PX_TOP}" width="${PLOT_RIGHT - PLOT_LEFT}" height="${alertY - PX_TOP}" fill="#a8472e" opacity="0.10"/>
          <line x1="${PLOT_LEFT}" y1="${alertY}" x2="${PLOT_RIGHT}" y2="${alertY}" stroke="#a8472e" stroke-width="1.5" stroke-dasharray="6 5"/>
          <path d="${path}" fill="none" stroke="#a97a2b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <g fill="#a97a2b">${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3"/>`).join('')}</g>
          ${pins}
          ${xAxisLabels(['00:00', '12:00', '24:00'])}
        </svg>`;
    }
  },

  // 4. SOIL pH — dynamic colour-shifting line + target zone + mini radial gauge
  {
    title: 'Soil pH Balance',
    subtitle: 'Sensor cluster B-3 · pH 0–14',
    legend: [
      { color: '#a8472e', label: 'Acidic (<6.0)' },
      { color: '#4c7a3a', label: 'Optimal (6.0–7.5)' },
      { color: '#1f7fa0', label: 'Alkaline (>7.5)' }
    ],
    render(){
      const valMin = 0, valMax = 14;
      const values = chartData.ph;
      const pts = toPoints(values, valMin, valMax);
      const zoneColor = v => v < 6 ? '#a8472e' : v > 7.5 ? '#1f7fa0' : '#4c7a3a';
      let segments = '';
      for(let i = 0; i < pts.length - 1; i++){
        const avg = (values[i] + values[i + 1]) / 2;
        segments += `<path d="M${pts[i].x},${pts[i].y} L${pts[i + 1].x},${pts[i + 1].y}" fill="none" stroke="${zoneColor(avg)}" stroke-width="3" stroke-linecap="round"/>`;
      }
      const zoneTop = valueToY(7.0, valMin, valMax);
      const zoneBottom = valueToY(6.0, valMin, valMax);
      const current = values[values.length - 1];
      const gaugeColor = zoneColor(current);
      const R = 20, C = 2 * Math.PI * R;
      const arc = C * (current / 14);
      return `
        <svg viewBox="0 0 360 200" preserveAspectRatio="none">
          ${yAxis(valMin, valMax, v => v.toFixed(1))}
          <rect x="${PLOT_LEFT}" y="${zoneTop}" width="${PLOT_RIGHT - PLOT_LEFT}" height="${zoneBottom - zoneTop}" fill="#4c7a3a" opacity="0.12"/>
          ${segments}
          <g>${pts.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${zoneColor(values[i])}"/>`).join('')}</g>
          <g transform="translate(318,45)">
            <circle cx="0" cy="0" r="${R}" fill="none" stroke="#e9e5cd" stroke-width="6"/>
            <circle cx="0" cy="0" r="${R}" fill="none" stroke="${gaugeColor}" stroke-width="6" stroke-linecap="round"
              stroke-dasharray="${arc} ${C}" transform="rotate(-90)"/>
            <text x="0" y="4" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700" font-size="12" fill="${gaugeColor}">${current.toFixed(1)}</text>
          </g>
          ${xAxisLabels(['00:00', '12:00', '24:00'])}
        </svg>`;
    }
  },

  // 5. NPK NUTRIENT CONCENTRATION — grouped bar chart across sensor nodes + baseline minimums
  {
    title: 'NPK Nutrient Concentration',
    subtitle: 'By sensor node · mg/kg',
    legend: [
      { color: '#4c7a3a', label: 'Nitrogen (N)' },
      { color: '#a97a2b', label: 'Phosphorus (P)' },
      { color: '#1f7fa0', label: 'Potassium (K)' }
    ],
    render(){
      const valMin = 0, valMax = 260;
      const nodes = chartData.npkNodes;
      const groupW = (PLOT_RIGHT - PLOT_LEFT) / nodes.length;
      const barW = 20, gap = 2;
      const colors = { N: '#4c7a3a', P: '#a97a2b', K: '#1f7fa0' };
      const baselines = { N: 150, P: 70, K: 160 };

      let bars = '', labels = '', baseLines = '';
      nodes.forEach((n, i) => {
        const center = PLOT_LEFT + groupW * i + groupW / 2;
        ['N', 'P', 'K'].forEach((key, j) => {
          const x = center + (j - 1) * (barW + gap) - barW / 2;
          const y = valueToY(n[key], valMin, valMax);
          bars += `<rect x="${x}" y="${y}" width="${barW}" height="${PX_BOTTOM - y}" rx="3" fill="${colors[key]}"/>`;
        });
        labels += `<text x="${center}" y="196" text-anchor="middle" class="chart-axis-label">${n.label.replace('Node_', 'N')}</text>`;
      });
      ['N', 'P', 'K'].forEach(key => {
        const y = valueToY(baselines[key], valMin, valMax);
        baseLines += `<line x1="${PLOT_LEFT}" y1="${y}" x2="${PLOT_RIGHT}" y2="${y}" stroke="${colors[key]}" stroke-width="1.3" stroke-dasharray="5 4" opacity="0.6"/>`;
      });

      return `
        <svg viewBox="0 0 360 200" preserveAspectRatio="none">
          ${yAxis(valMin, valMax, v => Math.round(v))}
          ${baseLines}
          ${bars}
          ${labels}
        </svg>`;
    }
  }

];

let currentChart = 0;

function iconSvg(kind, color){
  if(kind === 'drop'){
    return `<svg viewBox="0 0 12 14" width="12" height="14"><path d="M6,0 C7,4 10,7 10,9.5 A4,4 0 1 1 2,9.5 C2,7 5,4 6,0 Z" fill="${color}"/></svg>`;
  }
  if(kind === 'pin'){
    return `<svg viewBox="0 0 12 16" width="12" height="16"><path d="M6,0 C2,0 0,3 0,6 C0,10 6,16 6,16 C6,16 12,10 12,6 C12,3 10,0 6,0 Z" fill="${color}"/></svg>`;
  }
  return '';
}

function renderChart(index){
  currentChart = (index + CHARTS.length) % CHARTS.length;
  const chart = CHARTS[currentChart];

  document.getElementById('chartTitle').textContent = chart.title;
  document.getElementById('chartSubtitle').textContent = chart.subtitle;
  document.getElementById('chartSvgWrap').innerHTML = chart.render();

  document.getElementById('chartLegend').innerHTML = chart.legend.map(item => {
    let swatch;
    if(item.icon){
      swatch = iconSvg(item.icon, item.color);
    } else if(item.dashed){
      swatch = `<svg width="14" height="10" viewBox="0 0 14 10"><line x1="0" y1="5" x2="14" y2="5" stroke="${item.color}" stroke-width="2" stroke-dasharray="3 2"/></svg>`;
    } else {
      swatch = `<i class="dot" style="background:${item.color}"></i>`;
    }
    return `<span>${swatch}${item.label}</span>`;
  }).join('');

  document.getElementById('chartDots').innerHTML = CHARTS.map((_, i) =>
    `<button class="chart-dot${i === currentChart ? ' active' : ''}" data-index="${i}" aria-label="Show parameter ${i + 1}"></button>`
  ).join('');

  document.querySelectorAll('.chart-dot').forEach(dot => {
    dot.addEventListener('click', () => renderChart(parseInt(dot.dataset.index, 10)));
  });
}

document.getElementById('navLeft').addEventListener('click', () => renderChart(currentChart - 1));
document.getElementById('navRight').addEventListener('click', () => renderChart(currentChart + 1));

renderChart(0);

// Sensor Node Overview — All / Online / Offline filter toggle
const filterButtons = document.querySelectorAll('.node-filter-btn');
const filterThumb = document.getElementById('filterThumb');
const nodeCards = document.querySelectorAll('.node-card');

filterButtons.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    filterThumb.style.transform = `translateX(${i * 100}%)`;

    const filter = btn.dataset.filter;
    nodeCards.forEach(card => {
      const match = filter === 'all' || card.dataset.status === filter;
      card.style.display = match ? '' : 'none';
    });
  });
});

// Nav item that reveals its full name on hover ("Irrigation" -> full label)
const navIrrigation = document.getElementById('navIrrigation');
if(navIrrigation){
  navIrrigation.addEventListener('mouseenter', () => {
    navIrrigation.textContent = navIrrigation.dataset.full;
  });
  navIrrigation.addEventListener('mouseleave', () => {
    navIrrigation.textContent = navIrrigation.dataset.short;
  });
  navIrrigation.addEventListener('focus', () => {
    navIrrigation.textContent = navIrrigation.dataset.full;
  });
  navIrrigation.addEventListener('blur', () => {
    navIrrigation.textContent = navIrrigation.dataset.short;
  });
}

// Real-time greeting based on the current hour
function updateGreeting(){
  const greetingEl = document.getElementById('greetingTitle');
  if(!greetingEl) return;
  const hour = new Date().getHours();
  let greeting;
  if(hour < 12) greeting = 'Good morning';
  else if(hour < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';
  greetingEl.textContent = `${greeting}.`;
}
updateGreeting();
setInterval(updateGreeting, 60 * 1000); // re-check every minute

/* =========================================================
   SOIL / AIR KPI CARDS — sensor-ready hooks
   Cards currently show "--" placeholders. Once real sensors
   are wired up (MQTT, WebSocket, or a polling REST endpoint),
   call updateSensorReadings(reading, nodeSuffix) with any subset
   of the fields below and the matching cards update in place —
   including their fuzzy Low/Medium/High membership bars, which
   are derived automatically from the crisp value you pass in.
   nodeSuffix is '' for Node_001's cards or 'Node2' for Node_002's.

   Example:
   updateSensorReadings({
     soilMoisture: 63, soilMoistureStatus: { label: 'Optimal', level: 'ok' },
     soilTemp: 27, soilTempNote: 'Ambient +4.8°C',
     ec: 1.4, ecStatus: { label: 'Normal', level: 'ok' },
     ph: 6.4,
     npk: { n: 180, p: 95, k: 210 },       // mg/kg (bars auto-scale to 0–260)
     co2: 612, co2Avg: 605,
     co2Status: { label: 'Normal', level: 'ok' } // level: 'ok' | 'watch' | 'alert'
   }, 'Node2');
   ========================================================= */

const NPK_BAR_MAX = 260; // mg/kg — same scale used by the NPK chart

function setStatusPill(id, status){
  const el = document.getElementById(id);
  if(!el || !status) return;
  el.textContent = status.label;
  el.className = `status-pill ${status.level || 'ok'}`;
}

// ---- Fuzzy membership helpers -----------------------------------------
function clamp01(x){ return Math.min(1, Math.max(0, x)); }

// Triangular membership function: 0 at/beyond a and c, peaks at 1 at b
function triMF(x, a, b, c){
  if(x <= a || x >= c) return 0;
  return x < b ? (x - a) / (b - a) : (c - x) / (c - b);
}

// Renders a membership track + caption for one KPI card.
// `base` is the id root (e.g. 'kpiSoilMoisture'); `suffix` is '' or 'Node2'.
// `sets` is an array of { label, degree } — the highest degree wins.
function applyMembership(base, suffix, noun, color, sets){
  const fillEl = document.getElementById(`${base}MemFill${suffix}`);
  const capEl = document.getElementById(`${base}MemCaption${suffix}`);
  if(!fillEl || !capEl) return;

  let best = sets[0];
  sets.forEach(s => { if(s.degree > best.degree) best = s; });

  const pct = Math.round(clamp01(best.degree) * 100);
  fillEl.style.width = `${pct}%`;
  fillEl.className = `membership-fill ${color}`;
  capEl.className = `membership-caption ${color}`;
  capEl.textContent = `${best.label} ${noun} (${pct}%)`;
}

function moistureMembership(v){
  const low = clamp01((60 - v) / 30);
  return [{ label: 'LOW', degree: low }, { label: 'HIGH', degree: 1 - low }];
}

function ecMembership(v){
  return [
    { label: 'LOW', degree: clamp01((1.2 - v) / 1.2) },
    { label: 'MEDIUM', degree: triMF(v, 0.8, 1.75, 2.7) },
    { label: 'HIGH', degree: clamp01((v - 2.2) / 1.3) }
  ];
}

// Same low/high warning thresholds already drawn on the temperature chart
// (<18°C low warning, >35°C high warning), with the band between them optimal.
function tempMembership(v){
  return [
    { label: 'LOW', degree: clamp01((20 - v) / 8) },
    { label: 'OPTIMAL', degree: triMF(v, 16, 26, 36) },
    { label: 'HIGH', degree: clamp01((v - 32) / 6) }
  ];
}

function phMembership(v){
  let inRange;
  if(v <= 5.6 || v >= 7.2) inRange = 0;
  else if(v < 6.0) inRange = (v - 5.6) / 0.4;
  else if(v <= 6.8) inRange = 1;
  else inRange = (7.2 - v) / 0.4;
  return [{ label: 'OUT', degree: 1 - inRange }, { label: 'IN-RANGE', degree: inRange }];
}

// NPK is judged as a whole: each nutrient's distance above its minimum
// baseline (same baselines as the NPK chart) is averaged into one ratio.
function npkMembership(n, p, k){
  const rN = clamp01((n - 150) / (260 - 150));
  const rP = clamp01((p - 70) / (260 - 70));
  const rK = clamp01((k - 160) / (260 - 160));
  const c = (rN + rP + rK) / 3;
  return [
    { label: 'LOW', degree: clamp01((0.4 - c) / 0.4) },
    { label: 'MEDIUM', degree: triMF(c, 0.15, 0.5, 0.85) },
    { label: 'HIGH', degree: clamp01((c - 0.6) / 0.4) }
  ];
}

function updateSensorReadings(reading = {}, suffix = ''){
  const id = base => `${base}${suffix}`;

  if(reading.soilMoisture !== undefined){
    document.getElementById(id('kpiSoilMoisture')).innerHTML = `${Math.round(reading.soilMoisture)}<span class="kpi-unit">%</span>`;
    applyMembership('kpiSoilMoisture', suffix, 'moisture', 'teal', moistureMembership(reading.soilMoisture));
  }
  setStatusPill(id('kpiSoilMoistureStatus'), reading.soilMoistureStatus);

  if(reading.soilTemp !== undefined){
    document.getElementById(id('kpiSoilTemp')).innerHTML = `${reading.soilTemp.toFixed(1)}<span class="kpi-unit">°C</span>`;
    applyMembership('kpiSoilTemp', suffix, 'temp', 'crimson', tempMembership(reading.soilTemp));
  }
  if(reading.soilTempNote !== undefined){
    document.getElementById(id('kpiSoilTempNote')).textContent = reading.soilTempNote;
  }

  if(reading.ec !== undefined){
    document.getElementById(id('kpiEc')).innerHTML = `${reading.ec.toFixed(1)}<span class="kpi-unit">mS/cm</span>`;
    applyMembership('kpiEc', suffix, 'salinity', 'violet', ecMembership(reading.ec));
  }
  setStatusPill(id('kpiEcStatus'), reading.ecStatus);

  if(reading.ph !== undefined){
    document.getElementById(id('kpiPh')).textContent = reading.ph.toFixed(1);
    applyMembership('kpiPh', suffix, 'pH', 'leaf', phMembership(reading.ph));
  }

  if(reading.npk){
    const { n, p, k } = reading.npk;
    document.getElementById(id('kpiNpkNBar')).style.width = `${Math.min(100, (n / NPK_BAR_MAX) * 100)}%`;
    document.getElementById(id('kpiNpkPBar')).style.width = `${Math.min(100, (p / NPK_BAR_MAX) * 100)}%`;
    document.getElementById(id('kpiNpkKBar')).style.width = `${Math.min(100, (k / NPK_BAR_MAX) * 100)}%`;
    document.getElementById(id('kpiNpkNote')).textContent = `${Math.round(n)} / ${Math.round(p)} / ${Math.round(k)} mg/kg`;
    applyMembership('kpiNpk', suffix, 'NPK', 'violet', npkMembership(n, p, k));
  }

  if(reading.co2 !== undefined){
    document.getElementById(id('kpiCo2')).innerHTML = `${Math.round(reading.co2)}<span class="kpi-unit">ppm</span>`;
  }
  if(reading.co2Avg !== undefined){
    document.getElementById(id('kpiCo2Avg')).textContent = Math.round(reading.co2Avg);
  }
  setStatusPill(id('kpiCo2Status'), reading.co2Status);
}

// ---- Demo data source: derives readings from the same simulated nodes
// that already drive the Live Sensor Feed table, so every panel on this
// dashboard reflects the same underlying (simulated) hardware state.
function moistureStatusFor(v){
  return (v < 35 || v > 78) ? { label: 'Watch', level: 'watch' } : { label: 'Optimal', level: 'ok' };
}
function ecStatusFor(v){
  if(v > 2.5) return { label: 'Alert', level: 'alert' };
  if(v > 2.0) return { label: 'Watch', level: 'watch' };
  return { label: 'Normal', level: 'ok' };
}
function co2StatusFor(v){
  return v > 950 ? { label: 'Watch', level: 'watch' } : { label: 'Normal', level: 'ok' };
}

function buildNodeReading(feedNode, npkNode){
  const ambient = 22;
  const diff = feedNode.temp - ambient;
  return {
    soilMoisture: feedNode.moisture,
    soilMoistureStatus: moistureStatusFor(feedNode.moisture),
    soilTemp: feedNode.temp,
    soilTempNote: `Ambient ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}°C`,
    ec: feedNode.ec,
    ecStatus: ecStatusFor(feedNode.ec),
    ph: feedNode.ph,
    npk: { n: npkNode.N, p: npkNode.P, k: npkNode.K },
    co2: feedNode.co2,
    co2Avg: feedNode.co2Avg,
    co2Status: co2StatusFor(feedNode.co2)
  };
}

function refreshKpiCards(){
  const npk1 = chartData.npkNodes.find(n => n.label === 'Node_001') || chartData.npkNodes[0];
  const npk2 = chartData.npkNodes.find(n => n.label === 'Node_002') || chartData.npkNodes[1];
  updateSensorReadings(buildNodeReading(feedNodes.carbon, npk1), '');
  updateSensorReadings(buildNodeReading(feedNodes.nano, npk2), 'Node2');
}

/* =========================================================
   LIVE SENSOR FEED — Node table
   Simulates incoming readings from Node 1 (Carbon) and
   Node 2 (Nano). Swap generateReading()'s random walk for a
   real MQTT/WebSocket/REST payload when the hardware is wired up.
   ========================================================= */

const feedBody = document.getElementById('feedTableBody');
const MAX_FEED_ROWS = 8;

const feedNodes = {
  carbon: { label: 'Node 1 (Mushroom)', co2: 400, co2Avg: 400, ph: 6.5, moisture: 45, npk: 120, temp: 28, ec: 1.1, battery: 85 },
  nano:   { label: 'Node 2 (Nanofertilizer)', co2: 380, co2Avg: 380, ph: 6.7, moisture: 42, npk: 312, temp: 28.5, ec: 1.6, battery: 84 }
};

function statusForReading(node){
  if(node.battery < 45) return { label: 'Action', level: 'alert' };
  if(node.npk > 300 || node.co2 > 900) return { label: 'Watch', level: 'watch' };
  return { label: 'Normal', level: 'ok' };
}

function batteryLabel(pct){
  if(pct < 45) return `${Math.round(pct)}% (Discharging)`;
  if(pct < 70) return `${Math.round(pct)}% (Charging)`;
  return `${Math.round(pct)}% (Optimal)`;
}

function txIntervalFor(pct){
  return pct < 45 ? '15 min (Power Save)' : '2 min (Real-Time)';
}

function feedRowHtml(node, status){
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `<tr>
    <td>${time}</td><td>${date}</td><td>${node.label}</td>
    <td class="mono readings">${Math.round(node.co2)} ppm CO2, ${node.ph.toFixed(1)} pH, ${Math.round(node.moisture)}% Moisture, ${Math.round(node.npk)} ppm NPK, ${node.temp.toFixed(1)}°C</td>
    <td>${batteryLabel(node.battery)}</td><td>${txIntervalFor(node.battery)}</td>
    <td><span class="status-pill ${status.level}">${status.label}</span></td>
  </tr>`;
}

function stepNode(node){
  node.co2 = Math.max(360, Math.min(1050, node.co2 + (Math.random() - 0.5) * 30));
  node.co2Avg = node.co2Avg * 0.85 + node.co2 * 0.15;
  node.ph = Math.max(5.5, Math.min(7.8, node.ph + (Math.random() - 0.5) * 0.15));
  node.moisture = Math.max(28, Math.min(72, node.moisture + (Math.random() - 0.5) * 3));
  node.npk = Math.max(90, Math.min(340, node.npk + (Math.random() - 0.5) * 20));
  node.temp = Math.max(17, Math.min(37, node.temp + (Math.random() - 0.5) * 0.8));
  node.ec = Math.max(0.4, Math.min(3.2, node.ec + (Math.random() - 0.5) * 0.15));
  node.battery = Math.max(30, node.battery - Math.random() * 0.4);
}

let feedTurn = 0;
function pushLiveReading(){
  const key = feedTurn % 2 === 0 ? 'carbon' : 'nano';
  feedTurn++;
  const node = feedNodes[key];
  stepNode(node);
  const status = statusForReading(node);

  feedBody.insertAdjacentHTML('afterbegin', feedRowHtml(node, status));
  const rows = feedBody.querySelectorAll('tr');
  if(rows.length > MAX_FEED_ROWS){
    for(let i = MAX_FEED_ROWS; i < rows.length; i++) rows[i].remove();
  }
}

/* =========================================================
   SENSOR NODE OVERVIEW — battery-aware refresh cadence
   Two field nodes: Node_001 (Mushroom) and Node_002 (Nanofertilizer).
   Each tracks its own solar battery %. When a node's battery drops
   below 45%, it drops into Power Save mode. The overall refresh
   cadence for this node overview, the charts on the right, and the
   live sensor feed on the left is driven by the combined battery
   status: 2 minutes while both nodes are Real-Time, 15 minutes once
   either (avg) drops into Power Save.
   ========================================================= */

const REALTIME_INTERVAL_MS = 2 * 60 * 1000;  // 2 minutes
const POWERSAVE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const BATTERY_THRESHOLD = 45; // % — below this, a node switches to Power Save

const overviewNodes = {
  node1: { battery: 88 },
  node2: { battery: 81 }
};

function updateNodeCards(){
  Object.entries(overviewNodes).forEach(([key, node]) => {
    const idx = key === 'node1' ? '1' : '2';
    const valueEl = document.getElementById(`node${idx}Battery`);
    const modeEl = document.getElementById(`node${idx}Mode`);
    if(!valueEl || !modeEl) return;

    valueEl.textContent = `${Math.round(node.battery)}%`;
    const isPowerSave = node.battery < BATTERY_THRESHOLD;
    modeEl.textContent = isPowerSave ? 'Power Save' : 'Real-Time';
    modeEl.className = `node-mode-tag ${isPowerSave ? 'powersave' : 'realtime'}`;
  });
}

function currentIntervalMs(){
  const avgBattery = (overviewNodes.node1.battery + overviewNodes.node2.battery) / 2;
  return avgBattery < BATTERY_THRESHOLD ? POWERSAVE_INTERVAL_MS : REALTIME_INTERVAL_MS;
}

function nudgeSeries(arr, min, max, step){
  arr.shift();
  const next = Math.max(min, Math.min(max, arr[arr.length - 1] + (Math.random() - 0.5) * step));
  arr.push(next);
}

function nudgeChartsData(){
  nudgeSeries(chartData.moisture, 30, 85, 5);
  nudgeSeries(chartData.temp, 15, 39, 2.5);
  nudgeSeries(chartData.ec, 0.6, 3.3, 0.3);
  nudgeSeries(chartData.ph, 5.6, 7.8, 0.3);
  chartData.npkNodes.forEach(n => {
    n.N = Math.max(90, Math.min(250, n.N + (Math.random() - 0.5) * 15));
    n.P = Math.max(60, Math.min(150, n.P + (Math.random() - 0.5) * 10));
    n.K = Math.max(100, Math.min(260, n.K + (Math.random() - 0.5) * 15));
  });
}

function fieldTick(){
  // Drain each node's solar battery a little each cycle
  overviewNodes.node1.battery = Math.max(15, overviewNodes.node1.battery - (0.3 + Math.random() * 0.5));
  overviewNodes.node2.battery = Math.max(15, overviewNodes.node2.battery - (0.3 + Math.random() * 0.5));
  updateNodeCards();

  pushLiveReading();

  nudgeChartsData();
  renderChart(currentChart);

  refreshKpiCards();
  checkFieldNotifications();

  setTimeout(fieldTick, currentIntervalMs());
}

updateNodeCards();
refreshKpiCards();
setTimeout(fieldTick, currentIntervalMs());

/* =========================================================
   FULLSCREEN TOGGLES — live feed table + chart panel
   ========================================================= */

function expandIcon(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"></path></svg>`;
}
function collapseIcon(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4a2 2 0 0 0 2-2V3M20 9h-4a2 2 0 0 1-2-2V3M4 15h4a2 2 0 0 1 2 2v4M20 15h-4a2 2 0 0 0-2 2v4"></path></svg>`;
}

function setupFullscreenToggle(panelId, btnId){
  const panel = document.getElementById(panelId);
  const btn = document.getElementById(btnId);
  if(!panel || !btn) return;

  btn.addEventListener('click', () => {
    if(document.fullscreenElement === panel){
      document.exitFullscreen();
    } else if(panel.requestFullscreen){
      panel.requestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const isActive = document.fullscreenElement === panel;
    btn.innerHTML = isActive ? collapseIcon() : expandIcon();
    btn.setAttribute('aria-label', isActive ? 'Exit fullscreen' : 'Toggle fullscreen');
  });
}

setupFullscreenToggle('liveFeedPanel', 'feedFullscreenBtn');
setupFullscreenToggle('chartPanel', 'chartFullscreenBtn');

/* =========================================================
   NOTIFICATION PANEL — three-tier severity system
   critical  = actionable failure, a mechatronic failsafe fired
   warning   = anomaly worth watching before it becomes a failsafe
   log       = routine background event, system working as expected
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

// ---- Edge-triggered hooks into the live field simulation ----
// Fires a notification only on state *transitions*, not every tick,
// so the feed doesn't spam the same alert while a value sits high.
const notifTracker = {
  node1: { power: 'realtime' },
  node2: { power: 'realtime' },
  carbon: { ec: 'ok', moisture: 'ok' },
  nano: { ec: 'ok', moisture: 'ok' }
};

function checkFieldNotifications(){
  // Battery -> Power Save transitions (Sensor Node Overview)
  [['node1', 'Node_001 (Mushroom)'], ['node2', 'Node_002 (Nanofertilizer)']].forEach(([key, label]) => {
    const node = overviewNodes[key];
    const nowPower = node.battery < BATTERY_THRESHOLD ? 'powersave' : 'realtime';
    if(nowPower !== notifTracker[key].power){
      if(nowPower === 'powersave'){
        addNotification('warning', `${label}: battery at ${Math.round(node.battery)}% — switched to Power Save mode.`);
      } else {
        addNotification('log', `${label}: battery recovered to ${Math.round(node.battery)}% — back to Real-Time mode.`);
      }
      notifTracker[key].power = nowPower;
    }
  });

  // EC + moisture status transitions (Live Sensor Feed nodes)
  [['carbon', 'Node_001 (Mushroom)'], ['nano', 'Node_002 (Nanofertilizer)']].forEach(([key, label]) => {
    const node = feedNodes[key];
    const tracker = notifTracker[key];

    const ecLevel = ecStatusFor(node.ec).level;
    if(ecLevel !== tracker.ec){
      if(ecLevel === 'alert'){
        addNotification('critical', `${label}: EC hit ${node.ec.toFixed(1)} mS/cm — nutrient dosing failsafe engaged.`);
      } else if(ecLevel === 'watch'){
        addNotification('warning', `${label}: EC rising (${node.ec.toFixed(1)} mS/cm) — monitor before the failsafe threshold.`);
      } else if(tracker.ec !== 'ok'){
        addNotification('log', `${label}: EC normalized to ${node.ec.toFixed(1)} mS/cm.`);
      }
      tracker.ec = ecLevel;
    }

    const moistureLevel = moistureStatusFor(node.moisture).level;
    if(moistureLevel !== tracker.moisture){
      if(moistureLevel === 'watch'){
        addNotification('warning', `${label}: soil moisture out of optimal band (${Math.round(node.moisture)}%) — monitor.`);
      } else {
        addNotification('log', `${label}: soil moisture back in the optimal band (${Math.round(node.moisture)}%).`);
      }
      tracker.moisture = moistureLevel;
    }
  });
}

