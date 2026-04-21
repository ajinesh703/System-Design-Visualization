<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CDN — How It Works</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0c10;
    --surface: #111318;
    --surface2: #1a1d24;
    --border: rgba(255,255,255,0.08);
    --border2: rgba(255,255,255,0.14);
    --text: #e8e6de;
    --muted: #7a7870;
    --accent-blue: #3b8bd4;
    --accent-green: #1d9e75;
    --accent-red: #d85a30;
    --accent-amber: #ef9f27;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
  }

  html, body {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-display);
    overflow-x: hidden;
  }

  /* Background grid */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(59,139,212,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,139,212,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  body::after {
    content: '';
    position: fixed;
    top: -200px; left: 50%; transform: translateX(-50%);
    width: 600px; height: 400px;
    background: radial-gradient(ellipse, rgba(59,139,212,0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .wrapper {
    position: relative;
    z-index: 1;
    max-width: 960px;
    margin: 0 auto;
    padding: 32px 20px 48px;
  }

  /* Header */
  .header {
    margin-bottom: 28px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-left h1 {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--text);
    line-height: 1;
  }

  .header-left p {
    margin-top: 6px;
    font-size: 13px;
    color: var(--muted);
    font-family: var(--font-mono);
    letter-spacing: 0.02em;
  }

  .tag {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid var(--border2);
    color: var(--accent-blue);
    background: rgba(59,139,212,0.08);
    align-self: flex-start;
  }

  /* Main canvas card */
  .canvas-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 16px;
    position: relative;
  }

  .canvas-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,139,212,0.4), transparent);
  }

  canvas {
    display: block;
    width: 100%;
    height: 340px;
  }

  /* Stats row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
  }

  .stat-card .val {
    font-size: 26px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--text);
    line-height: 1;
  }

  .stat-card .name {
    margin-top: 4px;
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .stat-card.green .val { color: var(--accent-green); }
  .stat-card.red .val   { color: var(--accent-red); }
  .stat-card.blue .val  { color: var(--accent-blue); }

  /* Bottom row */
  .bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  @media (max-width: 600px) {
    .bottom-row { grid-template-columns: 1fr; }
    .stats-row { grid-template-columns: repeat(2, 1fr); }
  }

  .log-panel-wrap, .controls-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }

  .panel-header {
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-header .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent-green);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .log-panel {
    padding: 10px 14px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    height: 150px;
    overflow-y: auto;
    line-height: 1.7;
    scrollbar-width: thin;
    scrollbar-color: var(--border2) transparent;
  }

  .log-panel::-webkit-scrollbar { width: 4px; }
  .log-panel::-webkit-scrollbar-track { background: transparent; }
  .log-panel::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .log-hit    { color: var(--accent-green); }
  .log-miss   { color: var(--accent-red); }
  .log-origin { color: var(--accent-blue); }
  .log-req    { color: var(--text); }
  .log-info   { color: var(--muted); }

  /* Controls */
  .controls-wrap {
    display: flex;
    flex-direction: column;
  }

  .controls-body {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }

  .btn-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  button {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid var(--border2);
    background: var(--surface2);
    color: var(--text);
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  button:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.22); }
  button:active { transform: scale(0.96); }

  button.primary {
    background: rgba(59,139,212,0.15);
    border-color: rgba(59,139,212,0.4);
    color: #7bb8e8;
  }
  button.primary:hover { background: rgba(59,139,212,0.25); }

  button.danger {
    background: rgba(216,90,48,0.12);
    border-color: rgba(216,90,48,0.35);
    color: #e87c52;
  }
  button.danger:hover { background: rgba(216,90,48,0.2); }

  button.auto-active {
    background: rgba(29,158,117,0.15);
    border-color: rgba(29,158,117,0.4);
    color: #4fcca0;
  }

  .speed-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
  }

  input[type=range] {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    appearance: none;
    background: var(--border2);
    outline: none;
    cursor: pointer;
  }

  input[type=range]::-webkit-slider-thumb {
    appearance: none;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--accent-blue);
    border: 2px solid var(--bg);
    cursor: pointer;
  }

  .legend-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
  }

  .legend-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
  }

  /* User request buttons */
  .user-btn-row {
    display: flex;
    gap: 8px;
  }

  .user-btn {
    flex: 1;
    font-size: 10px;
    padding: 7px 8px;
    text-align: center;
  }
</style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <div class="header-left">
      <h1>CDN — Content Delivery Network</h1>
      <p>// how requests flow from users to edge servers to origin</p>
    </div>
    <span class="tag">INTERACTIVE</span>
  </div>

  <!-- Canvas -->
  <div class="canvas-card">
    <canvas id="cdn-canvas"></canvas>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-card green">
      <div class="val" id="hit-count">0</div>
      <div class="name">Cache Hits</div>
    </div>
    <div class="stat-card red">
      <div class="val" id="miss-count">0</div>
      <div class="name">Cache Misses</div>
    </div>
    <div class="stat-card blue">
      <div class="val" id="ratio-val">—</div>
      <div class="name">Hit Ratio</div>
    </div>
    <div class="stat-card">
      <div class="val" id="saved-val">0ms</div>
      <div class="name">Avg Saved</div>
    </div>
  </div>

  <!-- Bottom row -->
  <div class="bottom-row">

    <!-- Log -->
    <div class="log-panel-wrap">
      <div class="panel-header">
        <span class="dot"></span>
        Request Log
      </div>
      <div class="log-panel" id="log-panel">Waiting for requests…</div>
    </div>

    <!-- Controls -->
    <div class="controls-wrap">
      <div class="panel-header">Controls</div>
      <div class="controls-body">

        <div class="user-btn-row">
          <button class="user-btn primary" onclick="sendRequest(0)">🧑‍💻 India</button>
          <button class="user-btn primary" onclick="sendRequest(1)">👩‍💻 US</button>
          <button class="user-btn primary" onclick="sendRequest(2)">🧑‍🏻 EU</button>
        </div>

        <div class="btn-group">
          <button id="auto-btn" onclick="toggleAuto()">▶ Auto Demo</button>
          <button class="danger" onclick="clearCache()">⟳ Clear Cache</button>
        </div>

        <div class="speed-row">
          <span>SPEED</span>
          <input type="range" id="speed-slider" min="0.5" max="4" step="0.5" value="1.5"
            oninput="document.getElementById('speed-label').textContent = this.value + '×'">
          <span id="speed-label">1.5×</span>
        </div>

        <div class="legend-row">
          <div class="legend-item"><div class="legend-dot" style="background:#3b8bd4"></div>Request</div>
          <div class="legend-item"><div class="legend-dot" style="background:#1d9e75"></div>Cache hit</div>
          <div class="legend-item"><div class="legend-dot" style="background:#d85a30"></div>Cache miss</div>
          <div class="legend-item"><div class="legend-dot" style="background:#ef9f27"></div>Origin fetch</div>
        </div>

      </div>
    </div>

  </div>

</div>

<script>
const canvas = document.getElementById('cdn-canvas');
const ctx = canvas.getContext('2d');

let W, H, dpr;

function resize() {
  dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  W = rect.width;
  H = rect.height;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

/* ─── Data ─── */
const USERS = [
  { label: 'India',     emoji: '🧑‍💻' },
  { label: 'US',        emoji: '👩‍💻' },
  { label: 'EU',        emoji: '🧑‍🏻' },
];

const EDGES = [
  { label: 'Mumbai',    emoji: '🗄', cached: false },
  { label: 'New York',  emoji: '🗄', cached: false },
  { label: 'Amsterdam', emoji: '🗄', cached: false },
];

const ORIGIN = { label: 'Origin', emoji: '🏢' };

let stats = { hits: 0, misses: 0, savedMs: 0 };
let particles = [];
let highlights  = {};
let cacheStates = {};
let reqCount = 0;
let busy = false;
let autoTimer = null;

/* ─── Layout ─── */
function L() {
  const cols = [0.18, 0.50, 0.82].map(r => r * W);
  return {
    uY: H * 0.10,
    eY: H * 0.46,
    oY: H * 0.80,
    cols,
    oX: W * 0.50,
    R: 24,
  };
}

/* ─── Draw helpers ─── */
function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function drawNode(x, y, emoji, label, sublabel, hl, cacheState) {
  const R = L().R;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - R, y - R, R*2, R*2, 8);

  if (hl === 'hit') {
    ctx.fillStyle   = hexAlpha('#1d9e75', 0.15);
    ctx.strokeStyle = '#1d9e75';
    ctx.lineWidth   = 1.5;
  } else if (hl === 'miss') {
    ctx.fillStyle   = hexAlpha('#d85a30', 0.12);
    ctx.strokeStyle = '#d85a30';
    ctx.lineWidth   = 1.5;
  } else if (hl === 'active') {
    ctx.fillStyle   = hexAlpha('#3b8bd4', 0.12);
    ctx.strokeStyle = '#3b8bd4';
    ctx.lineWidth   = 1.5;
  } else {
    ctx.fillStyle   = '#1a1d24';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 0.5;
  }
  ctx.fill(); ctx.stroke();
  ctx.restore();

  /* Emoji */
  ctx.save();
  ctx.font = `${R}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y - 1);
  ctx.restore();

  /* Cache badge */
  if (cacheState) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + R - 6, y - R + 6, 7, 0, Math.PI*2);
    ctx.fillStyle = cacheState === 'hit' ? '#1d9e75' : '#d85a30';
    ctx.fill();
    ctx.font = '8px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cacheState === 'hit' ? '✓' : '✗', x + R - 6, y - R + 6);
    ctx.restore();
  }

  /* Labels */
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '500 11px Syne, sans-serif';
  ctx.fillStyle = '#e8e6de';
  ctx.fillText(label, x, y + R + 6);
  if (sublabel) {
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = '#7a7870';
    ctx.fillText(sublabel, x, y + R + 20);
  }
  ctx.restore();
}

function drawLine(x1, y1, x2, y2, col, dashed) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = col || 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 0.5;
  if (dashed) ctx.setLineDash([4,4]);
  ctx.stroke();
  ctx.restore();
}

function drawSectionLabel(x, y, text) {
  ctx.save();
  ctx.font = '700 9px "Space Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '0.1em';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ─── Draw loop ─── */
function drawScene() {
  ctx.clearRect(0, 0, W, H);
  const l = L();

  /* Section labels */
  drawSectionLabel(10, l.uY, 'USERS');
  drawSectionLabel(10, l.eY, 'EDGE SERVERS');
  drawSectionLabel(10, l.oY, 'ORIGIN');

  /* Connecting lines */
  l.cols.forEach((cx, i) => {
    drawLine(cx, l.uY + l.R, cx, l.eY - l.R, 'rgba(255,255,255,0.07)');
    drawLine(cx, l.eY + l.R, l.oX, l.oY - l.R, 'rgba(255,255,255,0.05)', true);
  });

  /* Nodes */
  USERS.forEach((u, i) => {
    drawNode(l.cols[i], l.uY, u.emoji, u.label, null, highlights['U'+i], null);
  });

  EDGES.forEach((e, i) => {
    drawNode(l.cols[i], l.eY, e.emoji, e.label.split(' ')[0], e.label.split(' ')[1]||null,
      highlights['E'+i], cacheStates['E'+i]);
  });

  drawNode(l.oX, l.oY, ORIGIN.emoji, ORIGIN.label, null, highlights['O'], null);

  /* Particles */
  particles.forEach(p => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;

    /* Glow */
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.restore();
  });
}

/* ─── Animation ─── */
function lerp(a, b, t) { return a + (b-a)*t; }
function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function spawnParticle(x1, y1, x2, y2, color, speed, r, onDone) {
  const dist = Math.hypot(x2-x1, y2-y1);
  const dur  = (dist / 200) * 600 / speed;
  const p    = { x: x1, y: y1, r: r||5, color, alpha: 0 };
  particles.push(p);

  const start = performance.now();
  function step(now) {
    const raw = Math.min((now - start) / dur, 1);
    const t   = easeInOut(raw);
    p.x = lerp(x1, x2, t);
    p.y = lerp(y1, y2, t);
    p.alpha = raw < 0.1 ? raw*10 : raw > 0.9 ? (1-raw)*10 : 1;
    if (raw < 1) requestAnimationFrame(step);
    else {
      particles = particles.filter(q => q !== p);
      if (onDone) onDone();
    }
  }
  requestAnimationFrame(step);
  return p;
}

/* ─── Logging ─── */
function log(msg, cls) {
  const panel = document.getElementById('log-panel');
  if (panel.textContent === 'Waiting for requests…') panel.innerHTML = '';
  const div = document.createElement('div');
  div.className = cls || '';
  div.textContent = msg;
  panel.appendChild(div);
  panel.scrollTop = panel.scrollHeight;
  while (panel.children.length > 60) panel.removeChild(panel.firstChild);
}

/* ─── Stats ─── */
function updateStats() {
  document.getElementById('hit-count').textContent  = stats.hits;
  document.getElementById('miss-count').textContent = stats.misses;
  const total = stats.hits + stats.misses;
  document.getElementById('ratio-val').textContent  = total ? Math.round(stats.hits/total*100)+'%' : '—';
  const avg = stats.hits > 0 ? Math.round(stats.savedMs / stats.hits) : 0;
  document.getElementById('saved-val').textContent  = avg + 'ms';
}

/* ─── Request flow ─── */
const ORIGIN_LATENCY = 300;
const EDGE_LATENCY   = 40;

function getSpeed() { return parseFloat(document.getElementById('speed-slider').value); }

function sendRequest(uIdx) {
  if (busy) return;
  busy = true;
  const l     = L();
  const speed = getSpeed();
  const edge  = EDGES[uIdx];
  const isHit = edge.cached;

  reqCount++;
  const id   = '#' + String(reqCount).padStart(3,'0');
  const uLbl = USERS[uIdx].label;
  const eLbl = edge.label;

  log(`${id}  ${uLbl} → ${eLbl}`, 'log-req');
  highlights['U'+uIdx] = 'active';

  const ux = l.cols[uIdx], uy = l.uY;
  const ex = l.cols[uIdx], ey = l.eY;
  const ox = l.oX,         oy = l.oY;

  spawnParticle(ux, uy+l.R, ex, ey-l.R, '#3b8bd4', speed, 5, () => {
    highlights['U'+uIdx] = null;

    if (isHit) {
      stats.hits++;
      stats.savedMs += (ORIGIN_LATENCY - EDGE_LATENCY);
      updateStats();
      highlights['E'+uIdx] = 'hit';
      log(`       ✓ HIT at ${eLbl} (~${EDGE_LATENCY}ms)`, 'log-hit');

      setTimeout(() => {
        spawnParticle(ex, ey-l.R, ux, uy+l.R, '#1d9e75', speed, 5, () => {
          highlights['E'+uIdx] = null;
          busy = false;
        });
      }, 80 / speed);

    } else {
      stats.misses++;
      updateStats();
      highlights['E'+uIdx] = 'miss';
      cacheStates['E'+uIdx] = 'miss';
      log(`       ✗ MISS — fetching origin…`, 'log-miss');

      spawnParticle(ex, ey+l.R, ox, oy-l.R, '#d85a30', speed, 5, () => {
        highlights['O'] = 'active';

        setTimeout(() => {
          highlights['O'] = null;
          edge.cached = true;
          cacheStates['E'+uIdx] = 'hit';
          log(`       ↩ Origin → ${eLbl} (~${ORIGIN_LATENCY}ms) cached ✓`, 'log-origin');

          spawnParticle(ox, oy-l.R, ex, ey+l.R, '#ef9f27', speed, 5, () => {
            highlights['E'+uIdx] = 'hit';
            spawnParticle(ex, ey-l.R, ux, uy+l.R, '#1d9e75', speed, 5, () => {
              highlights['E'+uIdx] = null;
              busy = false;
            });
          });
        }, 140 / speed);
      });
    }
  });
}

/* ─── Auto demo ─── */
const autoSeq = [0,1,2,0,1,2,0,2,1,0,0,1];
let autoIdx = 0;

function toggleAuto() {
  const btn = document.getElementById('auto-btn');
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btn.textContent = '▶ Auto Demo';
    btn.classList.remove('auto-active');
  } else {
    btn.textContent = '⏸ Stop Auto';
    btn.classList.add('auto-active');
    autoTimer = setInterval(() => {
      if (!busy) {
        sendRequest(autoSeq[autoIdx % autoSeq.length]);
        autoIdx++;
      }
    }, 900);
  }
}

function clearCache() {
  EDGES.forEach((e, i) => {
    e.cached = false;
    cacheStates['E'+i] = null;
  });
  log('— Cache cleared on all edge nodes —', 'log-info');
}

/* ─── Render loop ─── */
let lastFrame = 0;
function loop(ts) {
  if (ts - lastFrame > 14) { drawScene(); lastFrame = ts; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script>
</body>
</html>
