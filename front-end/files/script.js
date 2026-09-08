// Live field-audit clock for the weather widget (Tarlac local time)
const clockEl = document.getElementById('fieldClock');
function tickClock(){
  clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
}
tickClock();
setInterval(tickClock, 1000);

// Build the 8 circular gauges (4 per row) as inline SVG ring charts
const gauges = [
  { pct: null, label: 'Sunlight', color: 'violet' },
  { pct: 49,   label: 'Organic %', color: 'violet' },
  { pct: 'check', label: 'Irrigation', color: 'teal' },
  { pct: 'x',    label: 'pH alert', color: 'crimson' },
  { pct: null, label: 'Coverage', color: 'violet' },
  { pct: 69,   label: 'Root health', color: 'violet' },
  { pct: 'check', label: 'Drainage', color: 'teal' },
  { pct: 'x',    label: 'Pest signal', color: 'crimson' },
];

const colorMap = { violet: '#7c4fd1', teal: '#16a893', crimson: '#c22a4e' };
const trackMap = { violet: '#e6dcf7', teal: '#d7f0eb', crimson: '#f6dde3' };

const container = document.getElementById('gauges');
const R = 40, C = 2 * Math.PI * R;

gauges.forEach(g => {
  const stroke = colorMap[g.color];
  const track = trackMap[g.color];
  let arc, inner;

  if (g.pct === 'check' || g.pct === 'x') {
    arc = C; // full ring
    inner = g.pct === 'check'
      ? `<path d="M35 51 L46 62 L67 39" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M38 38 L64 64 M64 38 L38 64" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  } else if (g.pct === null) {
    arc = 0.001;
    inner = '';
  } else {
    arc = C * (g.pct / 100);
    inner = `<text x="51" y="57" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700" font-size="17" fill="${stroke}">${g.pct}%</text>`;
  }

  const isFull = g.pct === 'check' || g.pct === 'x';

  const svg = `
    <svg viewBox="0 0 102 102">
      <circle cx="51" cy="51" r="${R}" fill="none" stroke="${track}" stroke-width="8"/>
      <circle cx="51" cy="51" r="${R}" fill="${isFull ? stroke : 'none'}" stroke="${isFull ? 'none' : stroke}"
        stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${arc} ${C}"
        transform="rotate(-90 51 51)"/>
      ${inner}
    </svg>`;

  const wrap = document.createElement('div');
  wrap.className = 'gauge';
  wrap.innerHTML = svg + `<span class="gauge-caption">${g.label}</span>`;
  container.appendChild(wrap);
});
