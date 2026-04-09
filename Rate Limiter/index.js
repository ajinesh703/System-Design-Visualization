<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rate Limiter — System Design</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --bg:      #06080e;
  --s1:      #0b0e1a;
  --s2:      #111628;
  --s3:      #1a2040;
  --bdr:     #1e2644;
  --bdr2:    #2a3660;
  --blue:    #4f8eff;
  --cyan:    #00d4ff;
  --green:   #22d47a;
  --red:     #ff4d6a;
  --amber:   #f5a623;
  --purple:  #9b72f5;
  --pink:    #f06292;
  --text:    #e8eaf6;
  --text2:   #7a85a8;
  --text3:   #323c5e;
  --mono:    'JetBrains Mono', monospace;
  --disp:    'Syne', sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--disp);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}
body::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:
    linear-gradient(rgba(79,142,255,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(79,142,255,.03) 1px,transparent 1px);
  background-size:36px 36px;
}
.wrap { position:relative; z-index:1; max-width:1160px; margin:0 auto; padding:22px 18px 36px; }

/* ── HEADER ── */
.hdr { margin-bottom:18px; }
.hdr h1 {
  font-size:26px; font-weight:800; letter-spacing:-.02em;
  background:linear-gradient(120deg,var(--blue) 0%,var(--cyan) 50%,var(--purple) 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  margin-bottom:2px;
}
.hdr .sub { font-family:var(--mono); font-size:11px; color:var(--text3); letter-spacing:.06em; }

/* ── STATS ── */
.stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:18px; }
.sp {
  background:var(--s1); border:1px solid var(--bdr);
  border-radius:8px; padding:5px 14px;
  font-family:var(--mono); font-size:11px; color:var(--text2);
  display:flex; align-items:center; gap:6px;
}
.sp b { font-size:14px; font-weight:700; color:var(--text); }

/* ── ALGO TABS ── */
.algo-tabs { display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap; }
.at {
  font-family:var(--mono); font-size:11px; font-weight:600;
  padding:7px 16px; border-radius:8px; border:1px solid var(--bdr);
  background:var(--s1); color:var(--text2); cursor:pointer;
  transition:all .2s; letter-spacing:.02em;
}
.at:hover { border-color:var(--bdr2); color:var(--text); }
.at.active { background:var(--s2); border-color:var(--blue); color:var(--blue); box-shadow:0 0 12px rgba(79,142,255,.15); }

/* ── MAIN GRID ── */
.grid {
  display:grid;
  grid-template-columns:1fr 320px;
  gap:14px;
}

/* ── LEFT COLUMN ── */
.left-col { display:flex; flex-direction:column; gap:12px; }

/* ── ALGO VISUALIZER ── */
.viz-card {
  background:var(--s1); border:1.5px solid var(--bdr);
  border-radius:16px; overflow:hidden;
}
.viz-hdr {
  padding:10px 16px 9px;
  border-bottom:1px solid var(--bdr);
  display:flex; align-items:center; gap:10px;
}
.viz-icon { font-size:20px; }
.vh-title { font-size:14px; font-weight:700; color:var(--text); }
.vh-sub   { font-size:10px; color:var(--text3); font-family:var(--mono); }
.viz-body { padding:16px; }

/* ── TOKEN BUCKET ── */
.bucket-wrap {
  display:flex; gap:24px; align-items:flex-start;
}
.bucket-vis {
  position:relative;
  width:120px; flex-shrink:0;
}
.bucket-svg { width:120px; height:160px; display:block; }
.bucket-label {
  text-align:center; font-family:var(--mono); font-size:11px;
  color:var(--text2); margin-top:6px;
}
.bucket-info { flex:1; }
.bi-row {
  display:flex; justify-content:space-between; align-items:center;
  font-size:11px; margin-bottom:8px; padding:5px 10px;
  background:var(--bg); border:1px solid var(--bdr); border-radius:7px;
}
.bi-label { color:var(--text2); font-family:var(--mono); }
.bi-val   { font-weight:700; font-family:var(--mono); color:var(--text); }

/* ── LEAKY BUCKET ── */
.leaky-wrap { display:flex; gap:20px; align-items:flex-start; }
.queue-visual {
  width:130px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:4px;
}
.queue-slot {
  width:110px; height:28px; border-radius:6px; border:1px solid var(--bdr);
  background:var(--bg); display:flex; align-items:center; justify-content:center;
  font-family:var(--mono); font-size:10px; color:var(--text3);
  transition:background .3s, border-color .3s;
}
.queue-slot.filled { background:#0a2040; border-color:var(--blue); color:var(--blue); }
.queue-slot.draining { background:#061210; border-color:var(--green); color:var(--green); }
.drain-arrow { font-size:18px; color:var(--green); margin-top:4px; }

/* ── FIXED WINDOW ── */
.window-vis {
  display:flex; flex-direction:column; gap:8px;
}
.window-track {
  position:relative; height:48px;
  background:var(--bg); border:1px solid var(--bdr); border-radius:8px;
  overflow:hidden;
}
.window-fill {
  position:absolute; left:0; top:0; bottom:0;
  border-radius:8px 0 0 8px;
  transition:width .3s ease;
}
.window-label {
  position:absolute; inset:0; display:flex; align-items:center;
  padding:0 12px; font-family:var(--mono); font-size:11px;
  justify-content:space-between;
}
.window-tick {
  display:flex; justify-content:space-between;
  font-family:var(--mono); font-size:9px; color:var(--text3); padding:0 4px;
}
.req-dots {
  display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;
}
.req-dot {
  width:14px; height:14px; border-radius:3px;
  transition:background .3s;
}

/* ── SLIDING WINDOW ── */
.sliding-vis { position:relative; }
.sw-timeline {
  position:relative; height:56px;
  background:var(--bg); border:1px solid var(--bdr); border-radius:8px;
  overflow:hidden; margin-bottom:8px;
}
.sw-window {
  position:absolute; top:4px; bottom:4px;
  background:rgba(79,142,255,.08); border:1px solid rgba(79,142,255,.3);
  border-radius:6px; transition:left .4s ease, width .4s ease;
}
.sw-req {
  position:absolute; top:50%; width:10px; height:10px;
  border-radius:50%; transform:translateY(-50%);
  transition:left .3s;
}
.sw-labels {
  display:flex; justify-content:space-between;
  font-family:var(--mono); font-size:9px; color:var(--text3);
}

/* ── PROGRESS / METER ── */
.meter-row { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
.meter-label { font-family:var(--mono); font-size:10px; color:var(--text2); width:100px; flex-shrink:0; }
.meter-track { flex:1; height:6px; background:var(--bdr); border-radius:3px; overflow:hidden; }
.meter-fill  { height:100%; border-radius:3px; transition:width .4s ease, background .4s; }
.meter-val   { font-family:var(--mono); font-size:10px; font-weight:700; color:var(--text); width:48px; text-align:right; flex-shrink:0; }

/* ── PIPELINE STEPS ── */
.pipe-card {
  background:var(--s1); border:1.5px solid var(--bdr);
  border-radius:14px; overflow:hidden;
}
.pipe-hdr {
  padding:8px 14px; border-bottom:1px solid var(--bdr);
  font-family:var(--mono); font-size:10px; font-weight:700;
  color:var(--text3); letter-spacing:.08em; text-transform:uppercase;
  display:flex; align-items:center; justify-content:space-between;
}
.pipe-steps { padding:8px 10px; display:flex; flex-direction:column; gap:5px; }
.pst {
  display:flex; align-items:center; gap:10px;
  background:var(--bg); border:1px solid var(--bdr);
  border-radius:9px; padding:7px 12px;
  transition:border-color .25s, background .25s;
}
.pst.lit  { border-color:var(--blue);  background:#080e20; }
.pst.pass { border-color:var(--green); background:#05120a; }
.pst.fail { border-color:var(--red);   background:#120508; }
.pst.wait { border-color:var(--amber); background:#120a03; }
.pst-icon { font-size:15px; flex-shrink:0; }
.pst-name { font-size:11px; font-weight:600; color:var(--text2); flex:1; }
.pst-sub  { font-family:var(--mono); font-size:9px; color:var(--text3); }
.pst-badge {
  font-family:var(--mono); font-size:9px; font-weight:700;
  padding:2px 8px; border-radius:5px; flex-shrink:0;
}

/* ── REQUEST STREAM ── */
.stream-card {
  background:var(--s1); border:1.5px solid var(--bdr); border-radius:14px; overflow:hidden;
}
.stream-body { padding:10px 12px; }
.stream-track {
  display:flex; gap:5px; flex-wrap:wrap; min-height:44px; align-content:flex-start;
}
.req-chip {
  height:30px; border-radius:7px; border:1px solid;
  display:flex; align-items:center; gap:5px;
  padding:0 9px; font-family:var(--mono); font-size:10px; font-weight:600;
  white-space:nowrap; cursor:pointer;
  animation:chip-in .25s ease;
  transition:opacity .3s;
}
@keyframes chip-in { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
.rc-allow  { background:#05120a; border-color:var(--green);  color:var(--green); }
.rc-block  { background:#120508; border-color:var(--red);    color:var(--red); }
.rc-queue  { background:#0a1228; border-color:var(--blue);   color:var(--blue); }
.rc-drain  { background:#120a03; border-color:var(--amber);  color:var(--amber); }

/* ── RIGHT COLUMN ── */
.right-col { display:flex; flex-direction:column; gap:12px; }

/* Config panel */
.cfg-card {
  background:var(--s1); border:1.5px solid var(--bdr); border-radius:14px; overflow:hidden;
}
.cfg-hdr {
  padding:8px 14px; border-bottom:1px solid var(--bdr);
  font-family:var(--mono); font-size:10px; font-weight:700;
  color:var(--text3); letter-spacing:.08em; text-transform:uppercase;
}
.cfg-body { padding:10px 12px; }
.cfg-row {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:10px; gap:8px; font-size:11px;
}
.cfg-label { color:var(--text2); flex:1; }
.cfg-slider { width:90px; accent-color:var(--blue); }
.cfg-val {
  font-family:var(--mono); font-size:10px; font-weight:700;
  background:var(--bg); border:1px solid var(--bdr);
  padding:2px 8px; border-radius:5px; color:var(--cyan); min-width:46px; text-align:center;
}

/* Client selector */
.clients-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; }
.cli {
  display:flex; flex-direction:column; align-items:center; gap:2px;
  background:var(--bg); border:1px solid var(--bdr); border-radius:9px;
  padding:7px 10px; cursor:pointer; transition:all .2s; user-select:none;
}
.cli:hover { border-color:var(--bdr2); }
.cli.sel   { border-color:var(--blue); background:var(--s2); }
.cli-icon { font-size:18px; }
.cli-name { font-family:var(--mono); font-size:9px; color:var(--text2); }
.cli-cnt  { font-family:var(--mono); font-size:9px; font-weight:700; color:var(--text3); }

/* Algo description */
.desc-card {
  background:var(--s1); border:1.5px solid var(--bdr); border-radius:14px; padding:12px 14px;
}
.desc-title { font-size:12px; font-weight:700; color:var(--text); margin-bottom:6px; }
.desc-body  { font-family:var(--mono); font-size:10px; color:var(--text2); line-height:1.7; }
.desc-pros  { margin-top:8px; }
.desc-item  { display:flex; gap:5px; margin-bottom:3px; }
.desc-item .di { flex-shrink:0; }

/* ── LOG ── */
.log-wrap {
  background:var(--s1); border:1.5px solid var(--bdr); border-radius:12px; overflow:hidden;
}
.log-hdr {
  padding:7px 14px; font-family:var(--mono); font-size:10px; font-weight:700;
  color:var(--text3); border-bottom:1px solid var(--bdr);
  letter-spacing:.07em; text-transform:uppercase;
  display:flex; justify-content:space-between;
}
.log-body {
  height:68px; overflow-y:auto; padding:5px 14px;
  font-family:var(--mono); font-size:11px; line-height:1.7;
}
.log-body::-webkit-scrollbar { width:3px; }
.log-body::-webkit-scrollbar-thumb { background:var(--bdr2); border-radius:2px; }
@keyframes li { from{opacity:0;transform:translateY(3px)} to{opacity:1} }
.le { animation:li .2s ease; }
.ll { color:var(--green); }
.lb { color:var(--red); }
.lw { color:var(--amber); }
.li { color:var(--blue); }
.lp { color:var(--purple); }

/* ── CONTROLS ── */
.controls {
  display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin:12px 0 0;
}
.btn {
  font-family:var(--disp); font-size:12px; font-weight:600;
  padding:8px 16px; border-radius:8px; border:1px solid var(--bdr);
  background:var(--s1); color:var(--text2); cursor:pointer;
  transition:all .15s;
}
.btn:hover  { background:var(--s2); border-color:var(--bdr2); color:var(--text); }
.btn.active { background:#0e1e3a; border-color:var(--blue); color:var(--blue); }
.btn.green  { border-color:#14532d; color:var(--green); }
.btn.green:hover { background:#061210; }
.btn.red    { border-color:#450a0a; color:var(--red); }
.btn.red:hover { background:#120508; }
.btn.amber  { border-color:#451a03; color:var(--amber); }
.btn.amber:hover { background:#120a03; }
.speed-row {
  display:flex; align-items:center; gap:8px; justify-content:center;
  font-family:var(--mono); font-size:11px; color:var(--text3); margin-top:8px;
}
input[type=range] { width:80px; accent-color:var(--blue); }

/* ── FLOATING TOKENS ── */
.tok {
  position:fixed; pointer-events:none; z-index:300;
  width:28px; height:28px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:14px; border:2px solid rgba(255,255,255,.2);
  box-shadow:0 4px 18px rgba(0,0,0,.5);
}
</style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="hdr">
    <h1>Rate Limiter</h1>
    <div class="sub">// token bucket · leaky bucket · fixed window · sliding window log · sliding window counter</div>
  </div>

  <!-- STATS -->
  <div class="stats">
    <div class="sp">Total Requests <b id="st-total">0</b></div>
    <div class="sp" style="border-color:#14532d">✓ Allowed <b id="st-allow" style="color:var(--green)">0</b></div>
    <div class="sp" style="border-color:#450a0a">✗ Blocked <b id="st-block" style="color:var(--red)">0</b></div>
    <div class="sp" style="border-color:#451a03">⏳ Queued <b id="st-queue" style="color:var(--amber)">0</b></div>
    <div class="sp">Block Rate <b id="st-brate">0%</b></div>
    <div class="sp">Current Algo <b id="st-algo" style="color:var(--blue)">Token Bucket</b></div>
  </div>

  <!-- ALGO TABS -->
  <div class="algo-tabs">
    <div class="at active" onclick="switchAlgo('token')">🪣 Token Bucket</div>
    <div class="at" onclick="switchAlgo('leaky')">💧 Leaky Bucket</div>
    <div class="at" onclick="switchAlgo('fixed')">🗂 Fixed Window</div>
    <div class="at" onclick="switchAlgo('sliding')">📊 Sliding Window Log</div>
    <div class="at" onclick="switchAlgo('counter')">🔢 Sliding Window Counter</div>
  </div>

  <div class="grid">
    <!-- LEFT -->
    <div class="left-col">

      <!-- ALGO VISUALIZER -->
      <div class="viz-card">
        <div class="viz-hdr">
          <div class="viz-icon" id="viz-icon">🪣</div>
          <div>
            <div class="vh-title" id="viz-title">Token Bucket</div>
            <div class="vh-sub" id="viz-sub">refill at constant rate · burst allowed</div>
          </div>
          <div style="margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--text3);" id="viz-extra"></div>
        </div>
        <div class="viz-body" id="viz-body"><!-- dynamic --></div>
      </div>

      <!-- DECISION PIPELINE -->
      <div class="pipe-card">
        <div class="pipe-hdr">
          <span>Decision Pipeline</span>
          <span id="pipe-decision" style="font-size:10px;font-weight:700;"></span>
        </div>
        <div class="pipe-steps" id="pipe-steps">
          <div class="pst" id="pst-0"><span class="pst-icon">🔑</span><span class="pst-name">Identify Client</span><span class="pst-sub">IP / user-id / API key</span><span class="pst-badge" id="pb-0" style="background:#0a1228;color:var(--blue);">—</span></div>
          <div class="pst" id="pst-1"><span class="pst-icon">💾</span><span class="pst-name">Fetch Counter (Redis)</span><span class="pst-sub">atomic GET / INCR</span><span class="pst-badge" id="pb-1" style="background:#0a1228;color:var(--blue);">—</span></div>
          <div class="pst" id="pst-2"><span class="pst-icon">⚖️</span><span class="pst-name">Apply Algorithm</span><span class="pst-sub" id="pst-2-sub">check tokens / window</span><span class="pst-badge" id="pb-2" style="background:#0a1228;color:var(--blue);">—</span></div>
          <div class="pst" id="pst-3"><span class="pst-icon">📝</span><span class="pst-name">Update State (Redis)</span><span class="pst-sub">SET with TTL / LPUSH / ZADD</span><span class="pst-badge" id="pb-3" style="background:#0a1228;color:var(--blue);">—</span></div>
          <div class="pst" id="pst-4"><span class="pst-icon">↩️</span><span class="pst-name">Return Decision</span><span class="pst-sub">200 / 429 + Retry-After</span><span class="pst-badge" id="pb-4" style="background:#0a1228;color:var(--blue);">—</span></div>
        </div>
      </div>

      <!-- REQUEST STREAM -->
      <div class="stream-card">
        <div class="pipe-hdr">
          <span>Request Stream</span>
          <span style="font-size:9px;color:var(--text3);">last 40 requests</span>
        </div>
        <div class="stream-body">
          <div class="stream-track" id="stream-track">
            <span style="font-family:var(--mono);font-size:10px;color:var(--text3);">requests will appear here…</span>
          </div>
        </div>
      </div>

      <!-- LOG -->
      <div class="log-wrap">
        <div class="log-hdr"><span>Rate Limiter Log</span><span style="color:var(--text3)">atomic · distributed · Redis</span></div>
        <div class="log-body" id="log"></div>
      </div>

    </div>

    <!-- RIGHT -->
    <div class="right-col">

      <!-- CLIENT SELECTOR -->
      <div class="cfg-card">
        <div class="cfg-hdr">Active Client</div>
        <div class="cfg-body" style="padding-bottom:6px;">
          <div class="clients-row" id="clients-row">
            <div class="cli sel" id="cli-0" onclick="selectClient(0)"><span class="cli-icon">🧑‍💻</span><span class="cli-name">user:alice</span><span class="cli-cnt" id="cc-0">0 req</span></div>
            <div class="cli" id="cli-1" onclick="selectClient(1)"><span class="cli-icon">📱</span><span class="cli-name">user:bob</span><span class="cli-cnt" id="cc-1">0 req</span></div>
            <div class="cli" id="cli-2" onclick="selectClient(2)"><span class="cli-icon">🤖</span><span class="cli-name">bot:crawler</span><span class="cli-cnt" id="cc-2">0 req</span></div>
            <div class="cli" id="cli-3" onclick="selectClient(3)"><span class="cli-icon">🔌</span><span class="cli-name">api:service</span><span class="cli-cnt" id="cc-3">0 req</span></div>
          </div>
        </div>
      </div>

      <!-- CONFIG -->
      <div class="cfg-card">
        <div class="cfg-hdr">⚙️ Configuration</div>
        <div class="cfg-body">
          <div class="cfg-row">
            <span class="cfg-label">Rate limit</span>
            <input class="cfg-slider" type="range" min="3" max="15" value="8" oninput="CFG.limit=+this.value;document.getElementById('cv-limit').textContent=this.value+' req'">
            <span class="cfg-val" id="cv-limit">8 req</span>
          </div>
          <div class="cfg-row">
            <span class="cfg-label">Window / refill</span>
            <input class="cfg-slider" type="range" min="5" max="30" value="10" oninput="CFG.window=+this.value;document.getElementById('cv-window').textContent=this.value+'s'">
            <span class="cfg-val" id="cv-window">10s</span>
          </div>
          <div class="cfg-row">
            <span class="cfg-label">Burst capacity</span>
            <input class="cfg-slider" type="range" min="1" max="8" value="4" oninput="CFG.burst=+this.value;document.getElementById('cv-burst').textContent=this.value">
            <span class="cfg-val" id="cv-burst">4</span>
          </div>
          <div class="cfg-row">
            <span class="cfg-label">Queue size</span>
            <input class="cfg-slider" type="range" min="0" max="8" value="4" oninput="CFG.queueSize=+this.value;document.getElementById('cv-queue').textContent=this.value">
            <span class="cfg-val" id="cv-queue">4</span>
          </div>
        </div>
      </div>

      <!-- ALGO DESCRIPTION -->
      <div class="desc-card" id="desc-card">
        <div class="desc-title" id="desc-title">Token Bucket</div>
        <div class="desc-body" id="desc-body"></div>
      </div>

      <!-- HEADERS RESPONSE -->
      <div class="cfg-card">
        <div class="cfg-hdr">HTTP Response Headers</div>
        <div class="cfg-body" style="padding:8px 10px;">
          <table style="width:100%;font-family:var(--mono);font-size:10px;border-collapse:collapse;">
            <tr style="border-bottom:1px solid var(--bdr)"><td style="color:var(--cyan);padding:4px 6px;">X-RateLimit-Limit</td><td style="color:var(--text2);padding:4px 6px;" id="hdr-limit">—</td></tr>
            <tr style="border-bottom:1px solid var(--bdr)"><td style="color:var(--cyan);padding:4px 6px;">X-RateLimit-Remaining</td><td style="color:var(--text2);padding:4px 6px;" id="hdr-remain">—</td></tr>
            <tr style="border-bottom:1px solid var(--bdr)"><td style="color:var(--cyan);padding:4px 6px;">X-RateLimit-Reset</td><td style="color:var(--text2);padding:4px 6px;" id="hdr-reset">—</td></tr>
            <tr><td style="color:var(--red);padding:4px 6px;" id="hdr-retry-lbl">Retry-After</td><td style="color:var(--text2);padding:4px 6px;" id="hdr-retry">—</td></tr>
          </table>
        </div>
      </div>

    </div>
  </div>

  <!-- CONTROLS -->
  <div class="controls">
    <button class="btn green" onclick="sendOne()">📤 Send Request</button>
    <button class="btn amber" onclick="burstSend()">💥 Burst (10x)</button>
    <button class="btn red"   onclick="floodSend()">🌊 Flood (30x)</button>
    <button class="btn"       onclick="refillTokens()">🔄 Refill Tokens</button>
    <button class="btn"       onclick="resetWindow()">🗂 Reset Window</button>
    <button class="btn active" id="auto-btn" onclick="toggleAuto()">▶ Auto Demo</button>
    <button class="btn"       onclick="resetAll()" style="color:var(--text3)">↺ Reset</button>
  </div>
  <div class="speed-row">
    Speed <input type="range" min="0.3" max="3" step="0.1" value="1" oninput="spd=parseFloat(this.value)">
  </div>

</div>
<div id="toks" style="position:fixed;inset:0;pointer-events:none;z-index:200;"></div>

<script>
let spd=1, autoTimer=null;
let currentAlgo='token';
let currentClient=0;
let pipeTimers=[];

const CLIENTS=[
  {id:'user:alice',  icon:'🧑‍💻', color:'#4f8eff'},
  {id:'user:bob',    icon:'📱',   color:'#22d47a'},
  {id:'bot:crawler', icon:'🤖',   color:'#f5a623'},
  {id:'api:service', icon:'🔌',   color:'#9b72f5'},
];

const CFG={ limit:8, window:10, burst:4, queueSize:4 };

/* Per-client state */
const STATE = CLIENTS.map(()=>({
  totalReq:0, allowed:0, blocked:0, queued:0,
  /* token bucket */
  tokens:8,
  /* leaky bucket */
  queue:[],
  /* fixed window */
  fwCount:0, fwReset:Date.now()+10000,
  /* sliding window log */
  swLog:[],
  /* sliding window counter */
  swcCurr:0, swcPrev:0, swcWindowStart:Date.now(),
}));

/* Global stats */
let gTotal=0, gAllow=0, gBlock=0, gQueue=0;

function d(ms){ return ms/spd; }

/* ══ ALGO META ══ */
const ALGO_META={
  token:{
    icon:'🪣', title:'Token Bucket',
    sub:'refill at constant rate · burst allowed',
    desc:`Tokens accumulate in a bucket up to a max capacity (burst).\nEach request consumes one token.\nIf empty → request is blocked.\nTokens refill at a fixed rate (limit/window).`,
    pros:[['✅','Allows controlled bursting'],['✅','Simple and memory-efficient'],['⚠️','Clock skew in distributed systems']],
  },
  leaky:{
    icon:'💧', title:'Leaky Bucket',
    sub:'fixed output rate · burst queued',
    desc:`Requests enter a queue (bucket).\nThey drip out at a constant rate.\nIf queue is full → request is dropped.\nSmoothes traffic spikes into steady flow.`,
    pros:[['✅','Strict constant output rate'],['✅','Protects downstream services'],['⚠️','Can delay bursty but valid traffic']],
  },
  fixed:{
    icon:'🗂',  title:'Fixed Window Counter',
    sub:'count requests per time window',
    desc:`Time divided into fixed windows (e.g. 10s).\nCounter increments per request.\nAt window boundary → counter resets.\nSimple but boundary spike problem.`,
    pros:[['✅','Very simple to implement'],['✅','Low memory (one counter/key)'],['⚠️','2x traffic possible at window edge']],
  },
  sliding:{
    icon:'📊', title:'Sliding Window Log',
    sub:'sorted set of timestamps per user',
    desc:`Each request timestamp stored in a sorted set.\nOn each request, remove entries outside window.\nCount remaining → compare to limit.\nPrecise but memory grows with traffic.`,
    pros:[['✅','No boundary spike problem'],['✅','Very precise per-user limiting'],['⚠️','Higher memory usage (O(limit))']],
  },
  counter:{
    icon:'🔢', title:'Sliding Window Counter',
    sub:'hybrid: prev + curr window weighted',
    desc:`Combines two fixed window counters.\nEstimate = prev×(1−elapsed%) + curr.\nLow memory, near-precise sliding window.\nUsed by Cloudflare, Nginx rate limiting.`,
    pros:[['✅','Low memory O(1)'],['✅','Approximates sliding window well'],['✅','Used in production at scale']],
  },
};

/* ══ RENDER ALGO VIZ ══ */
function renderViz(){
  const meta=ALGO_META[currentAlgo];
  document.getElementById('viz-icon').textContent=meta.icon;
  document.getElementById('viz-title').textContent=meta.title;
  document.getElementById('viz-sub').textContent=meta.sub;

  const st=STATE[currentClient];
  const body=document.getElementById('viz-body');

  if(currentAlgo==='token'){
    const tokens=Math.round(st.tokens);
    const pct=tokens/CFG.limit*100;
    const fill=pct>60?'var(--blue)':pct>30?'var(--amber)':'var(--red)';
    body.innerHTML=`
    <div class="bucket-wrap">
      <div class="bucket-vis">
        <svg class="bucket-svg" viewBox="0 0 120 160">
          <defs>
            <clipPath id="bclip"><path d="M14,30 L106,30 L100,150 L20,150 Z"/></clipPath>
          </defs>
          <!-- bucket outline -->
          <path d="M14,30 L106,30 L100,150 L20,150 Z" fill="none" stroke="var(--bdr2)" stroke-width="2"/>
          <!-- fill -->
          <rect x="0" y="${30+(120-pct*1.2)}" width="120" height="200" fill="${fill}" opacity=".25" clip-path="url(#bclip)"/>
          <rect x="0" y="${30+(120-pct*1.2)}" width="120" height="4" fill="${fill}" opacity=".7" clip-path="url(#bclip)"/>
          <!-- token circles -->
          ${generateTokenCircles(tokens, CFG.limit)}
          <!-- refill arrow -->
          <text x="60" y="22" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="var(--green)">+${(CFG.limit/CFG.window).toFixed(1)}/s refill</text>
          <!-- exit pipe -->
          <line x1="20" y1="150" x2="10" y2="165" stroke="var(--bdr2)" stroke-width="3"/>
          <line x1="100" y1="150" x2="110" y2="165" stroke="var(--bdr2)" stroke-width="3"/>
        </svg>
        <div class="bucket-label">${tokens}/${CFG.limit} tokens</div>
      </div>
      <div class="bucket-info">
        <div class="bi-row"><span class="bi-label">Tokens left</span><span class="bi-val" style="color:${fill}">${tokens}</span></div>
        <div class="bi-row"><span class="bi-label">Capacity</span><span class="bi-val">${CFG.limit}</span></div>
        <div class="bi-row"><span class="bi-label">Refill rate</span><span class="bi-val">${(CFG.limit/CFG.window).toFixed(1)}/s</span></div>
        <div class="bi-row"><span class="bi-label">Burst max</span><span class="bi-val">${CFG.limit}</span></div>
        <div class="meter-row" style="margin-top:8px;">
          <span class="meter-label">Fill level</span>
          <div class="meter-track"><div class="meter-fill" style="width:${pct}%;background:${fill};"></div></div>
          <span class="meter-val">${Math.round(pct)}%</span>
        </div>
      </div>
    </div>`;
  }
  else if(currentAlgo==='leaky'){
    const q=st.queue;
    const slots=Array.from({length:CFG.queueSize},(_, i)=>q[i]||null);
    body.innerHTML=`
    <div class="leaky-wrap">
      <div class="queue-visual">
        <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:4px;">← incoming</div>
        ${slots.map((s,i)=>`<div class="queue-slot ${s?'filled':''}" id="lqs-${i}">${s?'📨 req':'empty'}</div>`).join('')}
        <div class="drain-arrow">↓</div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--green);">${(1).toFixed(0)} req/s</div>
      </div>
      <div style="flex:1;">
        <div class="bi-row" style="margin-bottom:6px;"><span class="bi-label">Queue depth</span><span class="bi-val" style="color:var(--blue)">${q.length} / ${CFG.queueSize}</span></div>
        <div class="bi-row" style="margin-bottom:6px;"><span class="bi-label">Drain rate</span><span class="bi-val">1 req/s</span></div>
        <div class="bi-row" style="margin-bottom:6px;"><span class="bi-label">Status</span><span class="bi-val" style="color:${q.length>=CFG.queueSize?'var(--red)':'var(--green)'}">${q.length>=CFG.queueSize?'FULL — DROP':'ACCEPTING'}</span></div>
        <div class="meter-row" style="margin-top:8px;">
          <span class="meter-label">Queue fill</span>
          <div class="meter-track"><div class="meter-fill" style="width:${CFG.queueSize?q.length/CFG.queueSize*100:0}%;background:${q.length>=CFG.queueSize?'var(--red)':'var(--blue)'};"></div></div>
          <span class="meter-val">${CFG.queueSize?Math.round(q.length/CFG.queueSize*100):0}%</span>
        </div>
      </div>
    </div>`;
  }
  else if(currentAlgo==='fixed'){
    const now=Date.now();
    const remaining=Math.max(0, Math.ceil((st.fwReset-now)/1000));
    const pct=Math.min(1, st.fwCount/CFG.limit)*100;
    const fill=pct>=100?'var(--red)':pct>=70?'var(--amber)':'var(--blue)';
    body.innerHTML=`
    <div class="window-vis">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <div style="font-family:var(--mono);font-size:11px;color:var(--text2);">Window: <b style="color:var(--cyan)">${CFG.window}s</b></div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--text2);">Resets in: <b style="color:var(--amber)">${remaining}s</b></div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--text2);">Count: <b style="color:${fill}">${st.fwCount}/${CFG.limit}</b></div>
      </div>
      <div class="window-track">
        <div class="window-fill" style="width:${pct}%;background:${fill};opacity:.25;"></div>
        <div class="window-fill" style="width:${pct}%;background:${fill};opacity:.15;position:absolute;left:0;top:0;bottom:0;border-radius:8px 0 0 8px;"></div>
        <div class="window-label">
          <span style="color:${fill};font-family:var(--mono);font-size:12px;font-weight:700;">${st.fwCount} / ${CFG.limit}</span>
          <span style="color:var(--text3);font-size:10px;">${remaining}s until reset</span>
        </div>
      </div>
      <div class="window-tick">
        <span>0s</span><span>${CFG.window/4}s</span><span>${CFG.window/2}s</span><span>${CFG.window*3/4}s</span><span>${CFG.window}s</span>
      </div>
      <div class="req-dots" id="fw-dots">
        ${Array.from({length:CFG.limit},(_,i)=>`<div class="req-dot" style="background:${i<st.fwCount?(pct>=100?'var(--red)':'var(--blue)'):'var(--bdr)'};border-radius:3px;"></div>`).join('')}
      </div>
    </div>`;
  }
  else if(currentAlgo==='sliding'){
    const now=Date.now();
    const windowMs=CFG.window*1000;
    const validLogs=st.swLog.filter(t=>now-t<windowMs);
    const pct=Math.min(1,validLogs.length/CFG.limit)*100;
    const fill=pct>=100?'var(--red)':pct>=70?'var(--amber)':'var(--green)';
    const total=CFG.window*1000;
    body.innerHTML=`
    <div class="sliding-vis">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <span style="font-family:var(--mono);font-size:11px;color:var(--text2);">Window: <b style="color:var(--cyan)">${CFG.window}s sliding</b></span>
        <span style="font-family:var(--mono);font-size:11px;color:${fill)">${validLogs.length}/${CFG.limit} in window</span>
      </div>
      <div class="sw-timeline" id="sw-tl">
        <div class="sw-window" style="left:0;right:0;top:4px;bottom:4px;"></div>
        ${validLogs.map((t,i)=>{
          const age=now-t;
          const pctLeft=100-(age/total*100);
          const clr=i<CFG.limit?'var(--blue)':'var(--red)';
          return `<div class="sw-req" style="left:${pctLeft}%;background:${clr};width:10px;height:10px;"></div>`;
        }).join('')}
      </div>
      <div class="sw-labels">
        <span>← older</span>
        <span style="color:var(--text3);">sorted timestamp log (Redis ZSET)</span>
        <span>now →</span>
      </div>
      <div class="meter-row" style="margin-top:8px;">
        <span class="meter-label">Window fill</span>
        <div class="meter-track"><div class="meter-fill" style="width:${pct}%;background:${fill};"></div></div>
        <span class="meter-val">${validLogs.length}/${CFG.limit}</span>
      </div>
    </div>`;
  }
  else if(currentAlgo==='counter'){
    const now=Date.now();
    const elapsed=(now-st.swcWindowStart)/1000;
    const windowFrac=Math.min(1, elapsed/CFG.window);
    const estimate=st.swcPrev*(1-windowFrac)+st.swcCurr;
    const pct=Math.min(1,estimate/CFG.limit)*100;
    const fill=pct>=100?'var(--red)':pct>=70?'var(--amber)':'var(--purple)';
    body.innerHTML=`
    <div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="background:var(--bg);border:1px solid var(--bdr);border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:3px;">PREV WINDOW</div>
          <div style="font-size:22px;font-weight:800;color:var(--text2);">${st.swcPrev}</div>
          <div style="font-family:var(--mono);font-size:9px;color:var(--text3);">weight: ${(1-windowFrac).toFixed(2)}</div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--bdr2);border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:3px;">CURR WINDOW</div>
          <div style="font-size:22px;font-weight:800;color:var(--blue);">${st.swcCurr}</div>
          <div style="font-family:var(--mono);font-size:9px;color:var(--text3);">weight: ${windowFrac.toFixed(2)}</div>
        </div>
      </div>
      <div class="bi-row" style="margin-bottom:6px;">
        <span class="bi-label">Weighted estimate</span>
        <span class="bi-val" style="color:${fill}">${estimate.toFixed(1)} / ${CFG.limit}</span>
      </div>
      <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:6px;">
        = prev×(1−${windowFrac.toFixed(2)}) + curr = ${(st.swcPrev*(1-windowFrac)).toFixed(1)} + ${st.swcCurr} = ${estimate.toFixed(1)}
      </div>
      <div class="meter-row">
        <span class="meter-label">Utilization</span>
        <div class="meter-track"><div class="meter-fill" style="width:${pct}%;background:${fill};"></div></div>
        <span class="meter-val">${Math.round(pct)}%</span>
      </div>
    </div>`;
  }
}

function generateTokenCircles(n, max){
  const cols=Math.min(n,8), rows=Math.ceil(n/cols);
  let out='';
  let k=0;
  for(let r=0;r<rows&&k<n;r++){
    for(let c=0;c<cols&&k<n;c++){
      const x=18+c*12, y=50+r*16;
      out+=`<circle cx="${x}" cy="${y}" r="4" fill="var(--blue)" opacity=".8"/>`;
      k++;
    }
  }
  return out;
}

/* ══ ALGO DESCRIPTION ══ */
function renderDesc(){
  const m=ALGO_META[currentAlgo];
  document.getElementById('desc-title').textContent=m.title;
  document.getElementById('desc-body').innerHTML=
    `<div style="white-space:pre-line;margin-bottom:8px;">${m.desc}</div>`+
    m.pros.map(([ic,txt])=>`<div class="desc-item"><span class="di">${ic}</span><span>${txt}</span></div>`).join('');
}

/* ══ PIPE HELPERS ══ */
function clearPipe(){
  pipeTimers.forEach(t=>clearTimeout(t)); pipeTimers=[];
  for(let i=0;i<5;i++){
    document.getElementById('pst-'+i).className='pst';
    document.getElementById('pb-'+i).textContent='—';
    document.getElementById('pb-'+i).style.color='var(--blue)';
  }
  document.getElementById('pipe-decision').textContent='';
}

function lightPipe(i, cls, badge, bcolor, delay){
  const t=setTimeout(()=>{
    document.getElementById('pst-'+i).className='pst '+cls;
    document.getElementById('pb-'+i).textContent=badge;
    document.getElementById('pb-'+i).style.color=bcolor||'var(--green)';
  }, d(delay));
  pipeTimers.push(t);
}

/* ══ FLOATING TOKEN ANIMATION ══ */
function floatToken(fromEl, toEl, color, label, onDone){
  if(!fromEl||!toEl) return;
  const fr=fromEl.getBoundingClientRect(), to=toEl.getBoundingClientRect();
  const fx=fr.left+fr.width/2, fy=fr.top+fr.height/2;
  const tx=to.left+to.width/2, ty=to.top+to.height/2;
  const tok=document.createElement('div');
  tok.className='tok';
  tok.style.cssText=`background:${color}22;border-color:${color};left:${fx-14}px;top:${fy-14}px;`;
  tok.textContent=label;
  document.getElementById('toks').appendChild(tok);
  const dist=Math.hypot(tx-fx,ty-fy);
  const dur=Math.max(250,dist/(200*spd)*1000);
  tok.animate([
    {left:(fx-14)+'px',top:(fy-14)+'px',opacity:1},
    {left:(tx-14)+'px',top:(ty-14)+'px',opacity:.8}
  ],{duration:dur,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'})
  .finished.then(()=>{ tok.remove(); if(onDone) onDone(); });
}

/* ══ LOG ══ */
function addLog(cls, msg){
  const ts=new Date().toLocaleTimeString('en-GB',{hour12:false});
  const el=document.createElement('div');
  el.className='le';
  el.innerHTML=`<span style="color:var(--text3)">${ts}</span> <span class="${cls}">${msg}</span>`;
  const lb=document.getElementById('log');
  lb.appendChild(el); lb.scrollTop=lb.scrollHeight;
  if(lb.children.length>80) lb.removeChild(lb.firstChild);
}

/* ══ STREAM TRACK ══ */
function addChip(type, label){
  const track=document.getElementById('stream-track');
  const empty=track.querySelector('span');
  if(empty) empty.remove();
  const chip=document.createElement('div');
  chip.className=`req-chip rc-${type}`;
  chip.textContent=label;
  track.appendChild(chip);
  if(track.children.length>40) track.removeChild(track.firstChild);
  track.scrollLeft=track.scrollWidth;
}

/* ══ UPDATE HEADERS ══ */
function updateHeaders(remaining, reset, retryAfter){
  document.getElementById('hdr-limit').textContent=CFG.limit;
  document.getElementById('hdr-remain').textContent=remaining;
  document.getElementById('hdr-reset').textContent=new Date(reset).toLocaleTimeString();
  if(retryAfter){
    document.getElementById('hdr-retry').textContent=retryAfter+'s';
    document.getElementById('hdr-retry-lbl').style.color='var(--red)';
  } else {
    document.getElementById('hdr-retry').textContent='—';
    document.getElementById('hdr-retry-lbl').style.color='var(--text2)';
  }
}

/* ══ CORE DECISION ══ */
function decide(){
  const st=STATE[currentClient];
  const cli=CLIENTS[currentClient];
  const now=Date.now();
  st.totalReq++;
  gTotal++;

  clearPipe();
  lightPipe(0,'lit',cli.id,'var(--cyan)',0);
  lightPipe(0,'pass',cli.id,'var(--green)',d(180));

  let allowed=false, queued=false, retryAfter=null;

  if(currentAlgo==='token'){
    lightPipe(1,'lit','fetching…','var(--amber)',d(200));
    const tokenStr=`${Math.floor(st.tokens)} tok`;
    lightPipe(1,'pass',tokenStr,'var(--green)',d(420));
    if(st.tokens>=1){
      st.tokens=Math.max(0,st.tokens-1);
      allowed=true;
      lightPipe(2,'pass','✓ token','var(--green)',d(500));
      addLog('ll',`[Token Bucket] ${cli.id} — consumed 1 token. Remaining: ${Math.floor(st.tokens)}/${CFG.limit}`);
    } else {
      retryAfter=Math.ceil(CFG.window/CFG.limit);
      lightPipe(2,'fail','✗ empty','var(--red)',d(500));
      addLog('lb',`[Token Bucket] ${cli.id} — BLOCKED. Bucket empty. Retry after ${retryAfter}s`);
    }
  }
  else if(currentAlgo==='leaky'){
    lightPipe(1,'lit','checking Q…','var(--amber)',d(200));
    if(st.queue.length<CFG.queueSize){
      st.queue.push(now);
      queued=true; allowed=true;
      lightPipe(1,'pass',`Q:${st.queue.length}`,'var(--green)',d(420));
      lightPipe(2,'pass','✓ queued','var(--green)',d(500));
      addLog('lw',`[Leaky Bucket] ${cli.id} — queued (${st.queue.length}/${CFG.queueSize}). Draining at 1/s`);
    } else {
      lightPipe(1,'fail','FULL','var(--red)',d(420));
      lightPipe(2,'fail','✗ dropped','var(--red)',d(500));
      addLog('lb',`[Leaky Bucket] ${cli.id} — DROPPED. Queue full (${CFG.queueSize}/${CFG.queueSize})`);
      retryAfter=st.queue.length;
    }
  }
  else if(currentAlgo==='fixed'){
    if(now>st.fwReset){ st.fwCount=0; st.fwReset=now+CFG.window*1000; }
    lightPipe(1,'lit',`${st.fwCount} reqs`,'var(--amber)',d(200));
    if(st.fwCount<CFG.limit){
      st.fwCount++;
      allowed=true;
      lightPipe(1,'pass',`${st.fwCount}/${CFG.limit}`,'var(--green)',d(420));
      lightPipe(2,'pass','✓ allowed','var(--green)',d(500));
      addLog('ll',`[Fixed Window] ${cli.id} — allowed (${st.fwCount}/${CFG.limit}). Resets ${Math.ceil((st.fwReset-now)/1000)}s`);
    } else {
      retryAfter=Math.ceil((st.fwReset-now)/1000);
      lightPipe(1,'fail',`${st.fwCount}/${CFG.limit}`,'var(--red)',d(420));
      lightPipe(2,'fail','✗ limit','var(--red)',d(500));
      addLog('lb',`[Fixed Window] ${cli.id} — BLOCKED. Count ${st.fwCount}/${CFG.limit}. Reset in ${retryAfter}s`);
    }
  }
  else if(currentAlgo==='sliding'){
    const windowMs=CFG.window*1000;
    st.swLog=st.swLog.filter(t=>now-t<windowMs);
    lightPipe(1,'lit',`${st.swLog.length} in log`,'var(--amber)',d(200));
    if(st.swLog.length<CFG.limit){
      st.swLog.push(now);
      allowed=true;
      lightPipe(1,'pass',`${st.swLog.length}/${CFG.limit}`,'var(--green)',d(420));
      lightPipe(2,'pass','✓ in window','var(--green)',d(500));
      addLog('ll',`[Sliding Log] ${cli.id} — allowed (${st.swLog.length}/${CFG.limit} in ${CFG.window}s window)`);
    } else {
      retryAfter=Math.ceil((st.swLog[0]+windowMs-now)/1000);
      lightPipe(1,'fail',`${st.swLog.length}/${CFG.limit}`,'var(--red)',d(420));
      lightPipe(2,'fail','✗ full','var(--red)',d(500));
      addLog('lb',`[Sliding Log] ${cli.id} — BLOCKED. ${st.swLog.length} requests in window. Retry in ${retryAfter}s`);
    }
  }
  else if(currentAlgo==='counter'){
    if(now-st.swcWindowStart>CFG.window*1000){
      st.swcPrev=st.swcCurr; st.swcCurr=0; st.swcWindowStart=now;
    }
    const elapsed=(now-st.swcWindowStart)/1000;
    const windowFrac=elapsed/CFG.window;
    const estimate=st.swcPrev*(1-windowFrac)+st.swcCurr;
    lightPipe(1,'lit',`est:${estimate.toFixed(1)}`,'var(--amber)',d(200));
    if(estimate<CFG.limit){
      st.swcCurr++;
      allowed=true;
      lightPipe(1,'pass',`${estimate.toFixed(1)}/${CFG.limit}`,'var(--green)',d(420));
      lightPipe(2,'pass','✓ estimate OK','var(--green)',d(500));
      addLog('ll',`[SW Counter] ${cli.id} — allowed. Est: ${estimate.toFixed(1)}/${CFG.limit}`);
    } else {
      retryAfter=Math.ceil(CFG.window*windowFrac);
      lightPipe(1,'fail',`${estimate.toFixed(1)}/${CFG.limit}`,'var(--red)',d(420));
      lightPipe(2,'fail','✗ over limit','var(--red)',d(500));
      addLog('lb',`[SW Counter] ${cli.id} — BLOCKED. Est: ${estimate.toFixed(1)} ≥ ${CFG.limit}`);
    }
  }

  /* Update state storage step */
  pipeTimers.push(setTimeout(()=>{
    document.getElementById('pst-3').className='pst '+(allowed?'pass':'fail');
    document.getElementById('pb-3').textContent=allowed?'updated':'—';
    document.getElementById('pb-3').style.color=allowed?'var(--green)':'var(--text3)';
  }, d(650)));

  /* Final decision */
  pipeTimers.push(setTimeout(()=>{
    const isAllow=allowed&&!queued;
    const isQueue=queued;
    const isBlock=!allowed&&!queued;
    const cls=isBlock?'fail':isQueue?'wait':'pass';
    const badge=isBlock?'429':'200';
    const color=isBlock?'var(--red)':isQueue?'var(--amber)':'var(--green)';
    document.getElementById('pst-4').className='pst '+cls;
    document.getElementById('pb-4').textContent=badge;
    document.getElementById('pb-4').style.color=color;
    document.getElementById('pipe-decision').textContent=
      isBlock?'🚫 BLOCKED':isQueue?'⏳ QUEUED':'✅ ALLOWED';
    document.getElementById('pipe-decision').style.color=color;

    /* stream chip */
    if(isBlock){
      addChip('block',`✗ ${cli.icon}`);
      gBlock++; st.blocked++;
    } else if(isQueue){
      addChip('queue',`⏳ ${cli.icon}`);
      gQueue++; st.queued++;
    } else {
      addChip('allow',`✓ ${cli.icon}`);
      gAllow++; st.allowed++;
    }

    /* headers */
    const remaining=currentAlgo==='token'?Math.floor(st.tokens):
      currentAlgo==='fixed'?Math.max(0,CFG.limit-st.fwCount):
      currentAlgo==='sliding'?Math.max(0,CFG.limit-st.swLog.length):
      Math.max(0,CFG.limit-st.swcCurr);
    updateHeaders(remaining, Date.now()+CFG.window*1000, retryAfter);
    document.getElementById('cc-'+currentClient).textContent=st.totalReq+' req';
    renderViz();
    updateStats();
  }, d(800)));

  renderViz();
  updateStats();
}

/* ══ ACTIONS ══ */
function sendOne(){ decide(); }

function burstSend(){
  addLog('lw',`[Burst] Sending 10 rapid requests from ${CLIENTS[currentClient].id}…`);
  let i=0;
  const iv=setInterval(()=>{
    if(i++>=10){ clearInterval(iv); return; }
    decide();
  }, d(180));
}

function floodSend(){
  addLog('lb',`[Flood] 🌊 30 requests — testing rate limiter limits…`);
  let i=0;
  const iv=setInterval(()=>{
    if(i++>=30){ clearInterval(iv); return; }
    decide();
  }, d(120));
}

function refillTokens(){
  const st=STATE[currentClient];
  const prev=Math.floor(st.tokens);
  st.tokens=CFG.limit;
  addLog('lw',`[Refill] Token bucket refilled: ${prev} → ${CFG.limit} tokens`);
  renderViz();
}

function resetWindow(){
  const st=STATE[currentClient];
  st.fwCount=0; st.fwReset=Date.now()+CFG.window*1000;
  st.swLog=[]; st.swcCurr=0; st.swcPrev=0; st.swcWindowStart=Date.now();
  addLog('li',`[Reset] Window counters reset for ${CLIENTS[currentClient].id}`);
  renderViz();
}

/* ══ SWITCH ALGO ══ */
function switchAlgo(algo){
  currentAlgo=algo;
  document.querySelectorAll('.at').forEach((el,i)=>{
    const keys=['token','leaky','fixed','sliding','counter'];
    el.classList.toggle('active', keys[i]===algo);
  });
  document.getElementById('st-algo').textContent=ALGO_META[algo].title;
  renderViz(); renderDesc();
  clearPipe();
  addLog('li',`[System] Switched to ${ALGO_META[algo].title}`);
}

/* ══ SELECT CLIENT ══ */
function selectClient(i){
  currentClient=i;
  document.querySelectorAll('.cli').forEach((el,j)=>el.classList.toggle('sel',j===i));
  renderViz();
}

/* ══ STATS ══ */
function updateStats(){
  document.getElementById('st-total').textContent=gTotal;
  document.getElementById('st-allow').textContent=gAllow;
  document.getElementById('st-block').textContent=gBlock;
  document.getElementById('st-queue').textContent=gQueue;
  const brate=gTotal?Math.round((gBlock+gQueue)/gTotal*100):0;
  document.getElementById('st-brate').textContent=brate+'%';
  document.getElementById('st-brate').style.color=brate>50?'var(--red)':brate>20?'var(--amber)':'var(--green)';
}

/* ══ AUTO DEMO ══ */
const AUTO_SEQ=[
  ()=>{ switchAlgo('token'); selectClient(0); burstSend(); },
  ()=>{ floodSend(); },
  ()=>{ switchAlgo('leaky'); selectClient(2); burstSend(); },
  ()=>{ switchAlgo('fixed'); selectClient(1); burstSend(); },
  ()=>{ floodSend(); },
  ()=>{ switchAlgo('sliding'); selectClient(3); burstSend(); },
  ()=>{ switchAlgo('counter'); selectClient(0); burstSend(); },
];
let autoTick=0;

function toggleAuto(){
  const btn=document.getElementById('auto-btn');
  if(autoTimer){ clearInterval(autoTimer); autoTimer=null; btn.textContent='▶ Auto Demo'; btn.classList.add('active'); return; }
  btn.textContent='⏹ Stop Demo';
  autoTimer=setInterval(()=>{
    AUTO_SEQ[autoTick%AUTO_SEQ.length]();
    autoTick++;
  }, d(3800));
}

/* ══ LEAKY DRAIN LOOP ══ */
setInterval(()=>{
  STATE.forEach(st=>{
    if(st.queue.length>0) st.queue.shift();
  });
  if(currentAlgo==='leaky') renderViz();
}, 1000);

/* ══ TOKEN REFILL LOOP ══ */
setInterval(()=>{
  const rate=CFG.limit/CFG.window;
  STATE.forEach(st=>{
    st.tokens=Math.min(CFG.limit, st.tokens+rate*0.5);
  });
  if(currentAlgo==='token') renderViz();
}, 500);

/* ══ RESET ══ */
function resetAll(){
  if(autoTimer){ clearInterval(autoTimer); autoTimer=null; document.getElementById('auto-btn').textContent='▶ Auto Demo'; document.getElementById('auto-btn').classList.add('active'); }
  STATE.forEach(st=>{
    Object.assign(st,{totalReq:0,allowed:0,blocked:0,queued:0,tokens:CFG.limit,queue:[],fwCount:0,fwReset:Date.now()+CFG.window*1000,swLog:[],swcCurr:0,swcPrev:0,swcWindowStart:Date.now()});
  });
  gTotal=0; gAllow=0; gBlock=0; gQueue=0;
  CLIENTS.forEach((_,i)=>{ document.getElementById('cc-'+i).textContent='0 req'; });
  document.getElementById('stream-track').innerHTML='<span style="font-family:var(--mono);font-size:10px;color:var(--text3);">requests will appear here…</span>';
  document.getElementById('log').innerHTML='';
  clearPipe(); renderViz(); updateStats();
  addLog('li','[System] Rate limiter reset — all counters cleared');
}

/* ══ INIT ══ */
renderViz(); renderDesc(); updateStats();
addLog('li','[System] Rate Limiter ready — 5 algorithms loaded');
addLog('li','[System] Click ▶ Auto Demo or send requests manually');
toggleAuto();
</script>
</body>
</html>
