<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CDN — Content Delivery Network</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --bg:     #05070d;
  --s1:     #090c18;
  --s2:     #0f1424;
  --s3:     #161d35;
  --bdr:    #1c2340;
  --bdr2:   #283060;
  --blue:   #4a8fff;
  --cyan:   #00d4ff;
  --green:  #20d472;
  --red:    #ff4060;
  --amber:  #f5a523;
  --purple: #9b72f5;
  --pink:   #f06292;
  --teal:   #00bfa5;
  --text:   #e6e9f8;
  --text2:  #7a85a8;
  --text3:  #2e3858;
  --mono:   'JetBrains Mono', monospace;
  --disp:   'Syne', sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: var(--disp);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── GRID BG ── */
body::before {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,143,255,.07) 0%, transparent 70%),
    linear-gradient(rgba(74,143,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74,143,255,.025) 1px, transparent 1px);
  background-size: 100% 100%, 48px 48px, 48px 48px;
}

.wrap {
  position: relative; z-index: 1;
  max-width: 1200px; margin: 0 auto;
  padding: 22px 18px 36px;
}

/* ── HEADER ── */
.hdr { margin-bottom: 16px; }
.hdr h1 {
  font-size: 28px; font-weight: 800; letter-spacing: -.02em; margin-bottom: 2px;
  background: linear-gradient(120deg, var(--blue) 0%, var(--cyan) 55%, var(--teal) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hdr .sub { font-family: var(--mono); font-size: 11px; color: var(--text3); letter-spacing: .06em; }

/* ── STATS ── */
.stats { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
.sp {
  background: var(--s1); border: 1px solid var(--bdr);
  border-radius: 8px; padding: 5px 14px;
  font-family: var(--mono); font-size: 11px; color: var(--text2);
  display: flex; align-items: center; gap: 6px;
}
.sp b { font-size: 15px; font-weight: 700; color: var(--text); }

/* ── WORLD MAP SECTION ── */
.world-section {
  background: var(--s1); border: 1.5px solid var(--bdr);
  border-radius: 18px; overflow: hidden; margin-bottom: 14px;
}
.ws-hdr {
  padding: 10px 16px 8px; border-bottom: 1px solid var(--bdr);
  display: flex; align-items: center; justify-content: space-between;
}
.ws-title { font-size: 13px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
.ws-legend { display: flex; gap: 12px; font-family: var(--mono); font-size: 10px; color: var(--text2); align-items: center; }
.wl-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }

/* MAP CANVAS */
.map-wrap { position: relative; width: 100%; height: 280px; overflow: hidden; }
#map-canvas { width: 100%; height: 100%; display: block; }

/* ── BOTTOM GRID ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

/* ── PANEL BASE ── */
.panel {
  background: var(--s1); border: 1.5px solid var(--bdr);
  border-radius: 14px; overflow: hidden;
}
.ph {
  padding: 8px 14px 7px; border-bottom: 1px solid var(--bdr);
  font-family: var(--mono); font-size: 10px; font-weight: 700;
  color: var(--text3); letter-spacing: .08em; text-transform: uppercase;
  display: flex; align-items: center; justify-content: space-between;
}
.pb { padding: 10px 12px; }

/* ── CACHE STATE ── */
.cache-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.cache-item {
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 8px; padding: 6px 8px;
  transition: border-color .3s, background .3s;
}
.cache-item.hit   { border-color: var(--green); background: #040e08; }
.cache-item.miss  { border-color: var(--red);   background: #0e0407; }
.cache-item.fresh { border-color: var(--blue);  background: #04081e; }
.ci-name { font-family: var(--mono); font-size: 9px; color: var(--text2); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ci-meta { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 8px; }
.ci-status { font-weight: 700; }
.ci-ttl { color: var(--text3); }
.ci-bar { height: 3px; background: var(--bdr); border-radius: 2px; margin-top: 3px; overflow: hidden; }
.ci-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }

/* ── REQUEST PIPELINE ── */
.pipe-steps { padding: 8px 10px; display: flex; flex-direction: column; gap: 5px; }
.pst {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 8px; padding: 6px 10px;
  transition: border-color .25s, background .25s;
}
.pst.lit  { border-color: var(--blue);  background: #080e22; }
.pst.hit  { border-color: var(--green); background: #04100a; }
.pst.miss { border-color: var(--amber); background: #120a02; }
.pst.err  { border-color: var(--red);   background: #100206; }
.pst-icon { font-size: 14px; flex-shrink: 0; }
.pst-name { font-size: 10px; font-weight: 600; color: var(--text2); flex: 1; }
.pst-val  { font-family: var(--mono); font-size: 9px; font-weight: 700; }

/* ── POPs TABLE ── */
.pop-table { width: 100%; font-family: var(--mono); font-size: 10px; border-collapse: collapse; }
.pop-table th { color: var(--text3); font-size: 8px; letter-spacing: .06em; text-transform: uppercase; padding: 4px 6px; text-align: left; border-bottom: 1px solid var(--bdr); }
.pop-table td { padding: 5px 6px; border-bottom: 1px solid var(--bdr); }
.pop-table tr:last-child td { border-bottom: none; }
.pop-name { color: var(--text); font-weight: 600; }
.pop-lat  { font-weight: 700; }
.pop-load { }
.load-bar { height: 4px; background: var(--bdr); border-radius: 2px; overflow: hidden; width: 60px; }
.load-fill { height: 100%; border-radius: 2px; transition: width .4s; }
.pop-status { font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
.ps-ok   { background: #061210; color: var(--green); }
.ps-busy { background: #150c02; color: var(--amber); }
.ps-down { background: #120206; color: var(--red); }

/* ── ASSET TYPES ── */
.asset-chips { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px; }
.ac {
  font-family: var(--mono); font-size: 9px; font-weight: 700;
  padding: 3px 8px; border-radius: 6px; border: 1px solid;
  cursor: pointer; transition: all .15s; user-select: none; opacity: .5;
}
.ac.sel { opacity: 1; }
.ac-img  { border-color: var(--blue);  color: var(--blue);  background: #04081e; }
.ac-js   { border-color: var(--amber); color: var(--amber); background: #0e0802; }
.ac-css  { border-color: var(--purple);color: var(--purple);background: #0c0820; }
.ac-vid  { border-color: var(--pink);  color: var(--pink);  background: #1a0610; }
.ac-api  { border-color: var(--teal);  color: var(--teal);  background: #02100e; }

/* ── HIT/MISS CHART ── */
.hm-chart { display: flex; gap: 8px; align-items: flex-end; min-height: 70px; padding-bottom: 4px; }
.hm-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
.hm-bar { width: 100%; border-radius: 4px 4px 0 0; min-height: 2px; transition: height .4s ease; }
.hm-label { font-family: var(--mono); font-size: 8px; color: var(--text3); text-align: center; }
.hm-val   { font-family: var(--mono); font-size: 9px; font-weight: 700; color: var(--text2); }

/* ── LATENCY COMPARISON ── */
.lat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 10px; }
.lat-lbl { font-family: var(--mono); color: var(--text2); width: 80px; flex-shrink: 0; font-size: 9px; }
.lat-track { flex: 1; height: 6px; background: var(--bdr); border-radius: 3px; overflow: hidden; }
.lat-fill  { height: 100%; border-radius: 3px; transition: width .5s ease; }
.lat-ms    { font-family: var(--mono); font-size: 10px; font-weight: 700; width: 52px; text-align: right; flex-shrink: 0; }

/* ── LOG ── */
.log-wrap { background: var(--s1); border: 1.5px solid var(--bdr); border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
.log-hdr {
  padding: 7px 14px; font-family: var(--mono); font-size: 10px; font-weight: 700;
  color: var(--text3); border-bottom: 1px solid var(--bdr);
  letter-spacing: .07em; text-transform: uppercase;
  display: flex; justify-content: space-between;
}
.log-body { height: 68px; overflow-y: auto; padding: 5px 14px; font-family: var(--mono); font-size: 11px; line-height: 1.7; }
.log-body::-webkit-scrollbar { width: 3px; }
.log-body::-webkit-scrollbar-thumb { background: var(--bdr2); border-radius: 2px; }
@keyframes li { from{opacity:0;transform:translateY(3px)} to{opacity:1} }
.le { animation: li .2s ease; }
.ll { color: var(--green); }
.lb { color: var(--red); }
.lw { color: var(--amber); }
.li { color: var(--blue); }
.lp { color: var(--purple); }
.lt { color: var(--teal); }

/* ── CONTROLS ── */
.controls { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
.btn {
  font-family: var(--disp); font-size: 12px; font-weight: 600;
  padding: 8px 15px; border-radius: 8px; border: 1px solid var(--bdr);
  background: var(--s1); color: var(--text2); cursor: pointer; transition: all .15s;
}
.btn:hover { background: var(--s2); border-color: var(--bdr2); color: var(--text); }
.btn.active { background: #0a1430; border-color: var(--blue); color: var(--blue); }
.btn.green { border-color: #0d3a1c; color: var(--green); }
.btn.green:hover { background: #040e08; }
.btn.amber { border-color: #3a2208; color: var(--amber); }
.btn.amber:hover { background: #0e0802; }
.btn.red { border-color: #3a0810; color: var(--red); }
.btn.red:hover { background: #0e0204; }
.speed-row { display: flex; align-items: center; gap: 8px; justify-content: center; font-family: var(--mono); font-size: 11px; color: var(--text3); }
input[type=range] { width: 80px; accent-color: var(--blue); }

/* ── FLOATING PACKET ── */
.pkt {
  position: fixed; pointer-events: none; z-index: 300;
  border-radius: 20px; font-family: var(--mono); font-size: 10px; font-weight: 700;
  display: flex; align-items: center; gap: 5px; padding: 4px 11px;
  white-space: nowrap; border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 4px 20px rgba(0,0,0,.6);
}

/* ── ACTIVE REQUEST INDICATOR ── */
@keyframes ping { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
.ping { animation: ping .8s ease-out infinite; }
</style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="hdr">
    <h1>CDN — Content Delivery Network</h1>
    <div class="sub">// edge caching · PoP routing · cache-hit/miss · origin pull · TTL · invalidation</div>
  </div>

  <!-- STATS -->
  <div class="stats">
    <div class="sp">Total Requests <b id="st-total">0</b></div>
    <div class="sp" style="border-color:#0d3a1c">⚡ Cache Hits <b id="st-hits" style="color:var(--green)">0</b></div>
    <div class="sp" style="border-color:#3a2208">🔄 Cache Misses <b id="st-misses" style="color:var(--amber)">0</b></div>
    <div class="sp" style="border-color:#0a1430">🌍 Origin Fetches <b id="st-origin" style="color:var(--blue)">0</b></div>
    <div class="sp">Hit Rate <b id="st-hitrate" style="color:var(--green)">0%</b></div>
    <div class="sp">Avg Latency <b id="st-lat">—</b></div>
    <div class="sp">Bandwidth Saved <b id="st-bw" style="color:var(--teal)">0 MB</b></div>
  </div>

  <!-- WORLD MAP -->
  <div class="world-section">
    <div class="ws-hdr">
      <div class="ws-title">🌍 Global CDN Network</div>
      <div class="ws-legend">
        <span><span class="wl-dot" style="background:var(--amber)"></span>Origin Server</span>
        <span><span class="wl-dot" style="background:var(--blue)"></span>CDN PoP (idle)</span>
        <span><span class="wl-dot" style="background:var(--green)"></span>CDN PoP (serving)</span>
        <span><span class="wl-dot" style="background:var(--red)"></span>Cache Miss → Origin</span>
        <span><span class="wl-dot" style="background:var(--purple)"></span>User Request</span>
      </div>
    </div>
    <div class="map-wrap">
      <canvas id="map-canvas"></canvas>
    </div>
  </div>

  <!-- ASSET TYPE SELECTOR -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
    <span style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:.06em;">ASSET TYPE:</span>
    <div class="asset-chips" id="asset-chips">
      <div class="ac ac-img sel" onclick="setAsset('img')">🖼 Image</div>
      <div class="ac ac-js"  onclick="setAsset('js')">📜 JS Bundle</div>
      <div class="ac ac-css" onclick="setAsset('css')">🎨 CSS</div>
      <div class="ac ac-vid" onclick="setAsset('vid')">🎥 Video</div>
      <div class="ac ac-api" onclick="setAsset('api')">📡 API Response</div>
    </div>
    <span style="font-family:var(--mono);font-size:10px;color:var(--text3);" id="asset-meta"></span>
  </div>

  <!-- BOTTOM GRID -->
  <div class="bottom-grid">

    <!-- REQUEST PIPELINE -->
    <div class="panel">
      <div class="ph"><span>📋 Request Pipeline</span><span id="pipe-result" style="font-size:10px;font-weight:700;"></span></div>
      <div class="pipe-steps" id="pipe-steps">
        <div class="pst" id="ps-0"><span class="pst-icon">👤</span><span class="pst-name">User Request</span><span class="pst-val" id="pv-0">—</span></div>
        <div class="pst" id="ps-1"><span class="pst-icon">🌍</span><span class="pst-name">DNS → Nearest PoP</span><span class="pst-val" id="pv-1">—</span></div>
        <div class="pst" id="ps-2"><span class="pst-icon">⚡</span><span class="pst-name">Edge Cache Lookup</span><span class="pst-val" id="pv-2">—</span></div>
        <div class="pst" id="ps-3a" style="display:none"><span class="pst-icon">✅</span><span class="pst-name">Cache HIT — Serve</span><span class="pst-val" id="pv-3a">—</span></div>
        <div class="pst" id="ps-3b" style="display:none"><span class="pst-icon">🔄</span><span class="pst-name">Cache MISS → Origin</span><span class="pst-val" id="pv-3b">—</span></div>
        <div class="pst" id="ps-4" style="display:none"><span class="pst-icon">🖥️</span><span class="pst-name">Origin Fetches Asset</span><span class="pst-val" id="pv-4">—</span></div>
        <div class="pst" id="ps-5" style="display:none"><span class="pst-icon">💾</span><span class="pst-name">Cache WRITE + TTL</span><span class="pst-val" id="pv-5">—</span></div>
        <div class="pst" id="ps-6"><span class="pst-icon">📤</span><span class="pst-name">Deliver to User</span><span class="pst-val" id="pv-6">—</span></div>
      </div>
    </div>

    <!-- EDGE CACHE STATE -->
    <div class="panel">
      <div class="ph">
        <span>💾 Edge Cache State</span>
        <span id="cache-ratio" style="font-size:9px;color:var(--text3);">0/8 slots</span>
      </div>
      <div class="pb">
        <div class="cache-grid" id="cache-grid">
          <!-- populated by JS -->
        </div>
        <!-- Latency comparison -->
        <div style="margin-top:10px;border-top:1px solid var(--bdr);padding-top:8px;">
          <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:6px;letter-spacing:.06em;">LATENCY COMPARISON</div>
          <div class="lat-row"><span class="lat-lbl">CDN hit</span><div class="lat-track"><div class="lat-fill" id="lf-hit" style="width:8%;background:var(--green);"></div></div><span class="lat-ms" style="color:var(--green)" id="lv-hit">~8ms</span></div>
          <div class="lat-row"><span class="lat-lbl">CDN miss</span><div class="lat-track"><div class="lat-fill" id="lf-miss" style="width:28%;background:var(--amber);"></div></div><span class="lat-ms" style="color:var(--amber)" id="lv-miss">~80ms</span></div>
          <div class="lat-row"><span class="lat-lbl">No CDN</span><div class="lat-track"><div class="lat-fill" id="lf-origin" style="width:90%;background:var(--red);"></div></div><span class="lat-ms" style="color:var(--red)" id="lv-origin">~280ms</span></div>
        </div>
      </div>
    </div>

    <!-- PoP STATUS TABLE -->
    <div class="panel">
      <div class="ph"><span>🗺 Points of Presence</span></div>
      <div class="pb" style="padding:0;">
        <table class="pop-table" id="pop-table">
          <thead><tr><th>PoP</th><th>Latency</th><th>Load</th><th>Status</th></tr></thead>
          <tbody id="pop-tbody"></tbody>
        </table>
      </div>
    </div>

  </div>

  <!-- SECOND ROW -->
  <div class="bottom-grid" style="grid-template-columns:1fr 1fr 1fr;">

    <!-- HIT/MISS CHART -->
    <div class="panel">
      <div class="ph"><span>📊 Cache Performance</span></div>
      <div class="pb">
        <div class="hm-chart" id="hm-chart"></div>
        <div style="display:flex;gap:16px;margin-top:8px;font-family:var(--mono);font-size:10px;">
          <span style="color:var(--green);">● Hit: <b id="cp-hits">0</b></span>
          <span style="color:var(--amber);">● Miss: <b id="cp-misses">0</b></span>
          <span style="color:var(--blue);">● Origin: <b id="cp-origin">0</b></span>
        </div>
      </div>
    </div>

    <!-- CACHE HEADERS -->
    <div class="panel">
      <div class="ph"><span>📨 HTTP Cache Headers</span></div>
      <div class="pb" style="padding:6px 10px;">
        <table style="width:100%;font-family:var(--mono);font-size:10px;border-collapse:collapse;" id="hdr-table">
          <tr style="border-bottom:1px solid var(--bdr)"><td style="color:var(--cyan);padding:4px 4px;">Cache-Control</td><td style="color:var(--text2);padding:4px 4px;" id="hh-cc">—</td></tr>
          <tr style="border-bottom:1px solid var(--bdr)"><td style="color:var(--cyan);padding:4px 4px;">CDN-Cache-Control</td><td style="color:var(--text2);padding:4px 4px;" id="hh-cdn">—</td></tr>
          <tr style="border-bottom:1px solid var(--bdr)"><td style="color:var(--cyan);padding:4px 4px;">ETag</td><td style="color:var(--text2);padding:4px 4px;" id="hh-etag">—</td></tr>
          <tr style="border-bottom:1px solid var(--bdr)"><td style="color:var(--cyan);padding:4px 4px;">X-Cache</td><td style="color:var(--text2);padding:4px 4px;" id="hh-xcache">—</td></tr>
          <tr style="border-bottom:1px solid var(--bdr)"><td style="color:var(--cyan);padding:4px 4px;">Age</td><td style="color:var(--text2);padding:4px 4px;" id="hh-age">—</td></tr>
          <tr><td style="color:var(--cyan);padding:4px 4px;">X-Served-By</td><td style="color:var(--text2);padding:4px 4px;" id="hh-by">—</td></tr>
        </table>
      </div>
    </div>

    <!-- CACHE INVALIDATION -->
    <div class="panel">
      <div class="ph"><span>🗑 Cache Invalidation</span></div>
      <div class="pb">
        <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:8px;">Purge strategies:</div>
        <div style="display:flex;flex-direction:column;gap:5px;" id="inval-list">
          <div style="background:var(--bg);border:1px solid var(--bdr);border-radius:7px;padding:6px 10px;font-size:10px;cursor:pointer;transition:border-color .2s;" onmouseenter="this.style.borderColor='var(--blue)'" onmouseleave="this.style.borderColor='var(--bdr)'" onclick="purgeAll()">
            <div style="font-weight:700;color:var(--text);margin-bottom:2px;">🗑 Purge All</div>
            <div style="font-family:var(--mono);font-size:9px;color:var(--text3);">Invalidate entire CDN cache</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--bdr);border-radius:7px;padding:6px 10px;font-size:10px;cursor:pointer;transition:border-color .2s;" onmouseenter="this.style.borderColor='var(--amber)'" onmouseleave="this.style.borderColor='var(--bdr)'" onclick="purgeTag()">
            <div style="font-weight:700;color:var(--text);margin-bottom:2px;">🏷 Purge by Tag</div>
            <div style="font-family:var(--mono);font-size:9px;color:var(--text3);">Invalidate tagged assets</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--bdr);border-radius:7px;padding:6px 10px;font-size:10px;cursor:pointer;transition:border-color .2s;" onmouseenter="this.style.borderColor='var(--purple)'" onmouseleave="this.style.borderColor='var(--bdr)'" onclick="purgeURL()">
            <div style="font-weight:700;color:var(--text);margin-bottom:2px;">🔗 Purge by URL</div>
            <div style="font-family:var(--mono);font-size:9px;color:var(--text3);">Single asset invalidation</div>
          </div>
          <div style="background:var(--bg);border:1px solid var(--bdr);border-radius:7px;padding:6px 10px;font-size:10px;cursor:pointer;transition:border-color .2s;" onmouseenter="this.style.borderColor='var(--teal)'" onmouseleave="this.style.borderColor='var(--bdr)'" onclick="ttlExpire()">
            <div style="font-weight:700;color:var(--text);margin-bottom:2px;">⏱ TTL Expire</div>
            <div style="font-family:var(--mono);font-size:9px;color:var(--text3);">Simulate TTL expiry</div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- LOG -->
  <div class="log-wrap">
    <div class="log-hdr"><span>CDN Event Log</span><span style="color:var(--text3);">edge · origin · cache</span></div>
    <div class="log-body" id="log"></div>
  </div>

  <!-- CONTROLS -->
  <div class="controls">
    <button class="btn green" onclick="sendReq()">📤 Send Request</button>
    <button class="btn amber" onclick="burstReq()">💥 Burst (15x)</button>
    <button class="btn"       onclick="simPrewarm()">🔥 Pre-warm Cache</button>
    <button class="btn red"   onclick="simFailover()">⚡ PoP Failover</button>
    <button class="btn"       onclick="purgeAll()">🗑 Purge Cache</button>
    <button class="btn active" id="auto-btn" onclick="toggleAuto()">▶ Auto Demo</button>
    <button class="btn"       onclick="resetAll()" style="color:var(--text3)">↺ Reset</button>
  </div>
  <div class="speed-row" style="margin-top:10px;">
    Speed <input type="range" min="0.3" max="3" step="0.1" value="1" oninput="spd=parseFloat(this.value)">
  </div>
</div>

<div id="pkts" style="position:fixed;inset:0;pointer-events:none;z-index:200;"></div>

<script>
/* ══ CONFIG ══ */
let spd = 1, autoTimer = null, busy = false;
let totalReq = 0, cacheHits = 0, cacheMisses = 0, originFetches = 0;
let latencies = [];
let bwSaved = 0;
let currentAsset = 'img';
let pipeTimers = [];

/* ══ ASSET CONFIGS ══ */
const ASSETS = {
  img:  { label:'Image (PNG)',       size:'245 KB', ttl:'86400s (24h)', cc:'public, max-age=86400, immutable',    cdn:'max-age=604800', etag:'"img-a4f2b9"', lat:{hit:6,miss:65,origin:220} },
  js:   { label:'JS Bundle',         size:'128 KB', ttl:'31536000s (1y)',cc:'public, max-age=31536000, immutable', cdn:'max-age=31536000',etag:'"js-3c8d12"',  lat:{hit:5,miss:55,origin:180} },
  css:  { label:'CSS File',          size:'42 KB',  ttl:'86400s (24h)', cc:'public, max-age=86400',               cdn:'max-age=86400',  etag:'"css-7e1a4f"', lat:{hit:4,miss:50,origin:160} },
  vid:  { label:'Video (MP4)',        size:'12.4 MB',ttl:'604800s (7d)', cc:'public, max-age=604800',              cdn:'max-age=604800', etag:'"vid-9b2c55"', lat:{hit:18,miss:280,origin:850}},
  api:  { label:'API Response (JSON)',size:'8 KB',   ttl:'60s (1 min)', cc:'public, max-age=60, s-maxage=300',    cdn:'s-maxage=300',   etag:'"api-d7e3a1"', lat:{hit:8,miss:40,origin:120} },
};

/* ══ PoPs ══ */
const POPS = [
  { id:'nyc', name:'New York',     x:.18, y:.38, lat:8,  load:42, status:'ok' },
  { id:'lax', name:'Los Angeles',  x:.10, y:.41, lat:11, load:58, status:'ok' },
  { id:'lon', name:'London',       x:.44, y:.28, lat:9,  load:35, status:'ok' },
  { id:'fra', name:'Frankfurt',    x:.48, y:.30, lat:7,  load:61, status:'ok' },
  { id:'sin', name:'Singapore',    x:.72, y:.58, lat:12, load:48, status:'ok' },
  { id:'tok', name:'Tokyo',        x:.82, y:.35, lat:10, load:29, status:'ok' },
  { id:'syd', name:'Sydney',       x:.84, y:.74, lat:14, load:22, status:'ok' },
  { id:'sao', name:'São Paulo',    x:.28, y:.68, lat:16, load:38, status:'ok' },
  { id:'mum', name:'Mumbai',       x:.66, y:.48, lat:13, load:44, status:'ok' },
  { id:'joh', name:'Johannesburg', x:.52, y:.70, lat:18, load:18, status:'ok' },
];

/* ORIGIN */
const ORIGIN = { x:.62, y:.30, name:'Origin (Virginia)' };

/* USERS — random spawn positions */
const USER_REGIONS = [
  {x:.14,y:.34,name:'US East'},
  {x:.08,y:.38,name:'US West'},
  {x:.42,y:.25,name:'Europe'},
  {x:.70,y:.55,name:'SE Asia'},
  {x:.80,y:.32,name:'Japan'},
  {x:.82,y:.72,name:'Australia'},
  {x:.25,y:.65,name:'S. America'},
  {x:.64,y:.45,name:'India'},
];

/* Per-PoP cache stores */
const popCache = {};
POPS.forEach(p => { popCache[p.id] = {}; });

/* ══ CANVAS SETUP ══ */
let canvas, ctx, W, H;
let animQueue = [];

function initCanvas() {
  canvas = document.getElementById('map-canvas');
  const wrap = canvas.parentElement;
  W = wrap.clientWidth;
  H = 280;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

function px(x, y) { return { x: x * W, y: y * H }; }

function drawMap() {
  ctx.clearRect(0, 0, W, H);

  /* background continents (simplified shapes) */
  ctx.fillStyle = 'rgba(255,255,255,.025)';
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 1;

  const continents = [
    // North America
    [[.05,.20],[.22,.20],[.24,.30],[.20,.45],[.12,.50],[.06,.40],[.04,.28]],
    // South America
    [[.18,.50],[.26,.50],[.30,.72],[.22,.80],[.16,.70],[.15,.58]],
    // Europe
    [[.38,.22],[.56,.22],[.58,.36],[.50,.40],[.40,.36],[.36,.28]],
    // Africa
    [[.42,.38],[.56,.38],[.58,.50],[.54,.74],[.44,.76],[.40,.62],[.40,.48]],
    // Asia
    [[.56,.18],[.88,.18],[.90,.32],[.88,.50],[.76,.54],[.60,.48],[.58,.36],[.58,.24]],
    // Australia
    [[.76,.60],[.90,.60],[.92,.72],[.84,.78],[.76,.74],[.74,.66]],
  ];
  continents.forEach(pts => {
    ctx.beginPath();
    const f = px(pts[0][0], pts[0][1]);
    ctx.moveTo(f.x, f.y);
    pts.slice(1).forEach(p => { const pp = px(p[0], p[1]); ctx.lineTo(pp.x, pp.y); });
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  });

  /* Connection lines: each PoP → ORIGIN (faint) */
  POPS.forEach(pop => {
    const a = px(pop.x, pop.y), b = px(ORIGIN.x, ORIGIN.y);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 28;
    ctx.quadraticCurveTo(mx, my, b.x, b.y);
    ctx.strokeStyle = 'rgba(74,143,255,.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  /* ORIGIN */
  const op = px(ORIGIN.x, ORIGIN.y);
  ctx.beginPath();
  ctx.arc(op.x, op.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245,165,35,.2)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(op.x, op.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f5a523';
  ctx.fill();
  ctx.fillStyle = 'rgba(230,233,248,.7)';
  ctx.font = `bold ${10 * devicePixelRatio / devicePixelRatio}px JetBrains Mono`;
  ctx.textAlign = 'center';
  ctx.fillText('ORIGIN', op.x, op.y + 20);

  /* PoPs */
  POPS.forEach(pop => {
    const p = px(pop.x, pop.y);
    const popC = popCache[pop.id] || {};
    const hasCached = Object.keys(popC).length > 0;
    const isDown = pop.status === 'down';
    const color = isDown ? '#ff4060' : hasCached ? '#20d472' : '#4a8fff';
    const r = pop.status === 'busy' ? 7 : 6;

    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = color + '22';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = 'rgba(230,233,248,.6)';
    ctx.font = `${9}px JetBrains Mono`;
    ctx.textAlign = 'center';
    ctx.fillText(pop.name, p.x, p.y + 16);
  });

  /* Animated packets */
  const now = performance.now();
  animQueue = animQueue.filter(a => {
    const t = Math.min(1, (now - a.start) / a.duration);
    if (t >= 1) { if (a.onDone) a.onDone(); return false; }
    const x = a.x1 + (a.x2 - a.x1) * easeInOut(t);
    const y = a.y1 + (a.y2 - a.y1) * easeInOut(t) - Math.sin(t * Math.PI) * 20;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = a.color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = a.color + '66';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return true;
  });

  requestAnimationFrame(drawMap);
}

function easeInOut(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function animPkt(from, to, color, dur, onDone) {
  const f = px(from.x, from.y), t = px(to.x, to.y);
  animQueue.push({ x1: f.x, y1: f.y, x2: t.x, y2: t.y, color, duration: dur, start: performance.now(), onDone });
}

/* ══ ASSET META DISPLAY ══ */
function setAsset(type) {
  currentAsset = type;
  document.querySelectorAll('.ac').forEach(el => el.classList.remove('sel'));
  document.querySelector(`.ac-${type}`).classList.add('sel');
  const a = ASSETS[type];
  document.getElementById('asset-meta').textContent = `size: ${a.size}  ttl: ${a.ttl}`;
  updateCacheHeaders(null);
}

/* ══ CACHE DISPLAY ══ */
const CACHE_KEYS = ['hero.png','bundle.js','styles.css','font.woff2','logo.svg','api/users','bg.jpg','icons.svg'];
let cacheState = {};

function renderCacheGrid() {
  const grid = document.getElementById('cache-grid');
  grid.innerHTML = '';
  let filled = 0;
  CACHE_KEYS.forEach(k => {
    const state = cacheState[k];
    const div = document.createElement('div');
    div.className = 'cache-item' + (state ? (state.status === 'hit' ? ' hit' : state.status === 'miss' ? ' miss' : ' fresh') : '');
    const pct = state ? Math.max(0, Math.min(100, state.ttlPct || 80)) : 0;
    const color = state ? (state.status === 'hit' ? 'var(--green)' : state.status === 'miss' ? 'var(--red)' : 'var(--blue)') : 'var(--bdr)';
    div.innerHTML = `
      <div class="ci-name">${k}</div>
      <div class="ci-meta">
        <span class="ci-status" style="color:${color}">${state ? state.status.toUpperCase() : 'EMPTY'}</span>
        <span class="ci-ttl">${state ? 'TTL:' + state.ttl : '—'}</span>
      </div>
      <div class="ci-bar"><div class="ci-fill" style="width:${pct}%;background:${color};"></div></div>
    `;
    grid.appendChild(div);
    if (state) filled++;
  });
  document.getElementById('cache-ratio').textContent = filled + '/' + CACHE_KEYS.length + ' slots';
}

function setCacheEntry(key, status, ttl, ttlPct) {
  cacheState[key] = { status, ttl, ttlPct };
  renderCacheGrid();
}

/* ══ PoP TABLE ══ */
function renderPopTable() {
  const tbody = document.getElementById('pop-tbody');
  tbody.innerHTML = '';
  POPS.forEach(pop => {
    const loadColor = pop.load > 70 ? 'var(--red)' : pop.load > 50 ? 'var(--amber)' : 'var(--green)';
    const statusClass = pop.status === 'down' ? 'ps-down' : pop.load > 70 ? 'ps-busy' : 'ps-ok';
    const statusText = pop.status === 'down' ? 'DOWN' : pop.load > 70 ? 'BUSY' : 'OK';
    const cachedCount = Object.keys(popCache[pop.id] || {}).length;
    tbody.innerHTML += `
      <tr>
        <td class="pop-name" title="${pop.name}">${pop.name.length > 10 ? pop.name.substring(0,10)+'…' : pop.name}</td>
        <td class="pop-lat" style="color:${pop.lat < 10 ? 'var(--green)' : pop.lat < 15 ? 'var(--amber)' : 'var(--red)'}">${pop.lat}ms</td>
        <td><div class="load-bar"><div class="load-fill" style="width:${pop.load}%;background:${loadColor};"></div></div></td>
        <td><span class="pop-status ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  });
}

/* ══ CACHE HEADERS ══ */
function updateCacheHeaders(isHit) {
  const a = ASSETS[currentAsset];
  document.getElementById('hh-cc').textContent = a.cc;
  document.getElementById('hh-cdn').textContent = a.cdn;
  document.getElementById('hh-etag').textContent = a.etag;
  if (isHit === true)  { document.getElementById('hh-xcache').textContent = 'HIT'; document.getElementById('hh-xcache').style.color = 'var(--green)'; document.getElementById('hh-age').textContent = Math.floor(Math.random()*3600)+'s'; }
  else if (isHit === false) { document.getElementById('hh-xcache').textContent = 'MISS'; document.getElementById('hh-xcache').style.color = 'var(--amber)'; document.getElementById('hh-age').textContent = '0'; }
  else { document.getElementById('hh-xcache').textContent = '—'; document.getElementById('hh-xcache').style.color = ''; document.getElementById('hh-age').textContent = '—'; }
}

/* ══ HIT/MISS CHART ══ */
const chartHistory = [];
function updateChart() {
  chartHistory.push({ hits: cacheHits, misses: cacheMisses, origin: originFetches });
  if (chartHistory.length > 12) chartHistory.shift();
  const chart = document.getElementById('hm-chart');
  const maxVal = Math.max(1, ...chartHistory.map(c => c.hits + c.misses));
  chart.innerHTML = chartHistory.map((c, i) => {
    const h = (c.hits / maxVal * 60) || 2;
    const m = (c.misses / maxVal * 60) || 2;
    return `<div class="hm-bar-wrap">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;justify-content:flex-end;height:64px;">
        <div class="hm-bar" style="height:${h}px;background:var(--green);width:16px;"></div>
        <div class="hm-bar" style="height:${m}px;background:var(--amber);width:16px;"></div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('cp-hits').textContent = cacheHits;
  document.getElementById('cp-misses').textContent = cacheMisses;
  document.getElementById('cp-origin').textContent = originFetches;
}

/* ══ LOG ══ */
function addLog(cls, msg) {
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const el = document.createElement('div');
  el.className = 'le';
  el.innerHTML = `<span style="color:var(--text3)">${ts}</span> <span class="${cls}">${msg}</span>`;
  const lb = document.getElementById('log');
  lb.appendChild(el); lb.scrollTop = lb.scrollHeight;
  if (lb.children.length > 80) lb.removeChild(lb.firstChild);
}

/* ══ STATS ══ */
function updateStats() {
  document.getElementById('st-total').textContent = totalReq;
  document.getElementById('st-hits').textContent = cacheHits;
  document.getElementById('st-misses').textContent = cacheMisses;
  document.getElementById('st-origin').textContent = originFetches;
  const rate = totalReq ? Math.round(cacheHits / totalReq * 100) : 0;
  document.getElementById('st-hitrate').textContent = rate + '%';
  document.getElementById('st-hitrate').style.color = rate > 70 ? 'var(--green)' : rate > 40 ? 'var(--amber)' : 'var(--red)';
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b) / latencies.length) : 0;
  document.getElementById('st-lat').textContent = avg ? avg + 'ms' : '—';
  document.getElementById('st-bw').textContent = (bwSaved / 1024).toFixed(1) + ' MB';
}

/* ══ PIPELINE HELPERS ══ */
function clearPipe() {
  pipeTimers.forEach(t => clearTimeout(t)); pipeTimers = [];
  for (let i = 0; i <= 6; i++) {
    const el = document.getElementById('ps-' + i);
    if (el) { el.className = 'pst'; el.style.display = i <= 2 || i === 6 ? 'flex' : 'none'; }
    const pv = document.getElementById('pv-' + i);
    if (pv) pv.textContent = '—';
  }
  ['ps-3a','ps-3b','ps-4','ps-5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'pst'; el.style.display = 'none'; }
  });
  document.getElementById('pipe-result').textContent = '';
}

function litPipe(id, cls, val, delay) {
  const t = setTimeout(() => {
    const el = document.getElementById(id);
    if (el) { el.className = 'pst ' + cls; el.style.display = 'flex'; }
    const vid = id.startsWith('ps-') ? 'pv-' + id.replace('ps-', '') : null;
    if (vid) { const ve = document.getElementById(vid); if (ve) ve.textContent = val || '—'; }
  }, d(delay));
  pipeTimers.push(t);
}

/* ══ SEND REQUEST ══ */
function sendReq() {
  totalReq++;
  const asset = ASSETS[currentAsset];
  const cacheKey = currentAsset + '_asset';

  /* Pick nearest PoP (skip downed ones) */
  const activePops = POPS.filter(p => p.status !== 'down');
  const pop = activePops[Math.floor(Math.random() * activePops.length)];
  const user = USER_REGIONS[Math.floor(Math.random() * USER_REGIONS.length)];

  const isHit = !!popCache[pop.id][cacheKey];
  clearPipe();

  addLog('li', `[${user.name}] → GET ${currentAsset === 'api' ? '/api/data' : `/assets/${currentAsset}`} → PoP: ${pop.name}`);

  /* Pipeline animation */
  litPipe('ps-0', 'lit', user.name, 0);
  litPipe('ps-0', 'hit', user.name, d(180));

  litPipe('ps-1', 'lit', 'routing…', d(200));
  litPipe('ps-1', 'hit', pop.name + ' (' + pop.lat + 'ms)', d(420));

  /* Animate: user → PoP */
  setTimeout(() => animPkt(user, pop, '#4a8fff', d(350), null), d(100));

  litPipe('ps-2', 'lit', 'checking…', d(480));

  if (isHit) {
    /* CACHE HIT */
    cacheHits++;
    bwSaved += parseFloat(asset.size) * 1024;
    const lat = asset.lat.hit + Math.floor(Math.random() * 4);
    latencies.push(lat); if (latencies.length > 30) latencies.shift();

    litPipe('ps-2', 'hit', 'HIT ✅', d(700));
    litPipe('ps-3a', 'hit', lat + 'ms', d(760));
    litPipe('ps-6', 'hit', '200 OK (' + lat + 'ms)', d(950));

    pipeTimers.push(setTimeout(() => {
      document.getElementById('pipe-result').textContent = '⚡ CACHE HIT';
      document.getElementById('pipe-result').style.color = 'var(--green)';
      updateCacheHeaders(true);
      addLog('ll', `[${pop.name}] ⚡ Cache HIT — ${asset.label} served in ${lat}ms (saved origin fetch)`);
      /* Animate: PoP → user */
      animPkt(pop, user, '#20d472', d(280), null);
      pop.load = Math.min(99, pop.load + 2);
    }, d(800)));

  } else {
    /* CACHE MISS */
    cacheMisses++;
    originFetches++;
    const lat = asset.lat.miss + Math.floor(Math.random() * 30);
    latencies.push(lat); if (latencies.length > 30) latencies.shift();

    litPipe('ps-2', 'miss', 'MISS ⚠️', d(700));
    litPipe('ps-3b', 'miss', 'fetching…', d(760));

    /* Animate: PoP → Origin */
    setTimeout(() => animPkt(pop, ORIGIN, '#ff4060', d(400), null), d(600));

    litPipe('ps-4', 'lit', 'origin…', d(900));
    litPipe('ps-4', 'hit', asset.size + ' pulled', d(d(1100) + 250));

    /* Animate: Origin → PoP */
    setTimeout(() => animPkt(ORIGIN, pop, '#f5a523', d(350), () => {
      /* Write to cache */
      popCache[pop.id][cacheKey] = true;
    }), d(1000));

    litPipe('ps-5', 'lit', 'writing…', d(1200));
    litPipe('ps-5', 'hit', 'TTL=' + asset.ttl.split(' ')[0], d(1400));
    litPipe('ps-6', 'hit', '200 OK (' + lat + 'ms)', d(1600));

    pipeTimers.push(setTimeout(() => {
      document.getElementById('pipe-result').textContent = '🔄 CACHE MISS';
      document.getElementById('pipe-result').style.color = 'var(--amber)';
      updateCacheHeaders(false);
      const key = ['hero.png','bundle.js','styles.css','font.woff2','logo.svg','api/users','bg.jpg','icons.svg'][totalReq % 8];
      setCacheEntry(key, 'fresh', '24h', 100);
      addLog('lw', `[${pop.name}] ⚠️ Cache MISS — pulling ${asset.label} from origin (${lat}ms)`);
      addLog('lt', `[${pop.name}] 💾 Cached ${asset.label} with TTL=${asset.ttl.split(' ')[0]}`);
      animPkt(pop, user, '#20d472', d(280), null);
      pop.load = Math.min(99, pop.load + 5);
    }, d(1500)));
  }

  /* Simulate random hit on a cached key */
  const hitKey = ['hero.png','bundle.js','styles.css','api/users'][Math.floor(Math.random()*4)];
  if (cacheState[hitKey]) {
    setTimeout(() => { cacheState[hitKey].status = 'hit'; renderCacheGrid(); }, d(400));
    setTimeout(() => { cacheState[hitKey].status = 'fresh'; renderCacheGrid(); }, d(1200));
  }

  renderPopTable();
  updateChart();
  updateStats();
}

/* ══ BURST ══ */
function burstReq() {
  addLog('li', '[Burst] 15 simultaneous requests from multiple regions…');
  let i = 0;
  const iv = setInterval(() => { if (i++ >= 15) { clearInterval(iv); return; } sendReq(); }, d(220));
}

/* ══ PRE-WARM ══ */
function simPrewarm() {
  addLog('lt', '[Pre-warm] 🔥 Warming cache across all PoPs…');
  POPS.forEach((pop, i) => {
    setTimeout(() => {
      popCache[pop.id]['img_asset'] = true;
      popCache[pop.id]['js_asset']  = true;
      popCache[pop.id]['css_asset'] = true;
      animPkt(ORIGIN, pop, '#f5a523', d(500), null);
      pop.load = Math.min(99, pop.load + 3);
    }, d(i * 180));
  });
  CACHE_KEYS.forEach((k, i) => {
    setTimeout(() => setCacheEntry(k, 'fresh', '24h', 100), d(i * 80));
  });
  setTimeout(() => {
    addLog('lt', '[Pre-warm] ✅ Cache pre-warmed on all 10 PoPs');
    renderPopTable();
  }, d(2200));
}

/* ══ FAILOVER ══ */
function simFailover() {
  const pop = POPS[Math.floor(Math.random() * 5)];
  pop.status = 'down';
  addLog('lb', `[Failover] ⚡ PoP ${pop.name} went DOWN — routing to next closest…`);
  renderPopTable();
  setTimeout(() => {
    pop.status = 'ok';
    addLog('ll', `[Failover] ✅ PoP ${pop.name} recovered — traffic restored`);
    renderPopTable();
  }, d(4000));
}

/* ══ INVALIDATIONS ══ */
function purgeAll() {
  POPS.forEach(p => { popCache[p.id] = {}; });
  cacheState = {};
  renderCacheGrid(); renderPopTable();
  addLog('lb', '[Purge] 🗑 ALL cache purged globally across all PoPs');
  addLog('lw', '[Purge] Next requests will be cache misses until re-populated');
}

function purgeTag() {
  POPS.forEach(p => { delete popCache[p.id]['img_asset']; delete popCache[p.id]['vid_asset']; });
  delete cacheState['hero.png']; delete cacheState['bg.jpg'];
  renderCacheGrid();
  addLog('lp', '[Purge] 🏷 Tag-based purge: all image assets invalidated');
}

function purgeURL() {
  const url = currentAsset + '_asset';
  POPS.forEach(p => delete popCache[p.id][url]);
  addLog('lp', `[Purge] 🔗 URL purge: /assets/${currentAsset} invalidated on all edges`);
}

function ttlExpire() {
  const keys = Object.keys(cacheState);
  if (keys.length === 0) { addLog('lw', '[TTL] No cached items to expire'); return; }
  const expired = keys.slice(0, 3);
  expired.forEach(k => { if (cacheState[k]) { cacheState[k].status = 'miss'; cacheState[k].ttlPct = 0; } });
  renderCacheGrid();
  addLog('lw', `[TTL] ⏱ ${expired.length} cache entries expired — will be re-fetched on next request`);
}

/* ══ AUTO DEMO ══ */
const AUTO_SEQ = [
  () => { setAsset('img'); sendReq(); },
  () => { sendReq(); },
  () => { setAsset('js'); sendReq(); },
  () => { sendReq(); sendReq(); },
  () => { setAsset('api'); burstReq(); },
  () => { setAsset('css'); sendReq(); sendReq(); sendReq(); },
  () => { simFailover(); },
  () => { setAsset('vid'); sendReq(); },
  () => { purgeTag(); },
  () => { setAsset('img'); burstReq(); },
];
let autoTick = 0;

function toggleAuto() {
  const btn = document.getElementById('auto-btn');
  if (autoTimer) {
    clearInterval(autoTimer); autoTimer = null;
    btn.textContent = '▶ Auto Demo'; btn.classList.add('active');
  } else {
    btn.textContent = '⏹ Stop Demo';
    autoTimer = setInterval(() => {
      AUTO_SEQ[autoTick % AUTO_SEQ.length]();
      autoTick++;
    }, d(2600));
  }
}

/* ══ RESET ══ */
function resetAll() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; document.getElementById('auto-btn').textContent = '▶ Auto Demo'; document.getElementById('auto-btn').classList.add('active'); }
  totalReq = 0; cacheHits = 0; cacheMisses = 0; originFetches = 0; latencies = []; bwSaved = 0;
  POPS.forEach(p => { popCache[p.id] = {}; p.load = Math.floor(Math.random() * 40) + 10; p.status = 'ok'; });
  cacheState = {};
  renderCacheGrid(); renderPopTable(); clearPipe(); updateStats(); updateChart();
  document.getElementById('log').innerHTML = '';
  addLog('li', '[System] CDN reset — all caches cleared');
}

/* ══ INIT ══ */
window.addEventListener('load', () => {
  initCanvas();
  drawMap();
  renderCacheGrid();
  renderPopTable();
  updateStats();
  setAsset('img');
  addLog('li', '[CDN] Network initialized — 10 PoPs active globally');
  addLog('li', '[CDN] Click ▶ Auto Demo or send requests manually');
  toggleAuto();
});
window.addEventListener('resize', () => { initCanvas(); });

function d(ms) { return ms / spd; }
</script>
</body>
</html>
