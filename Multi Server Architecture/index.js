<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>URL Shortener — Multi-Server Architecture</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Cabinet+Grotesk:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
:root {
  --bg:      #03050c;
  --s1:      #07091a;
  --s2:      #0d1028;
  --s3:      #131835;
  --bdr:     #1c2448;
  --bdr2:    #2a3668;

  /* Layer colors */
  --client:  #00c9ff;
  --lb:      #f7c948;
  --api:     #4affa4;
  --cache:   #ff6b35;
  --db:      #6c8fff;
  --cdn:     #c084fc;
  --queue:   #fb7185;
  --worker:  #34d399;
  --analytics:#f59e0b;

  --text:    #e8ebff;
  --text2:   #6b7699;
  --text3:   #252e54;
  --mono:    'IBM Plex Mono', monospace;
  --disp:    'Cabinet Grotesk', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--disp);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── NOISE TEXTURE ── */
body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none; z-index: 0; opacity: .4;
}

/* ── GRID ── */
body::after {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(108,143,255,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(108,143,255,.04) 1px, transparent 1px);
  background-size: 40px 40px;
}

.wrap {
  position: relative; z-index: 1;
  max-width: 1220px; margin: 0 auto;
  padding: 26px 20px 40px;
}

/* ── HEADER ── */
.hdr {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 22px; gap: 20px; flex-wrap: wrap;
}
.hdr-left h1 {
  font-family: var(--disp); font-size: 30px; font-weight: 900;
  letter-spacing: -.025em; margin-bottom: 4px;
  background: linear-gradient(135deg, var(--client) 0%, var(--api) 50%, var(--lb) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hdr-left .sub {
  font-family: var(--mono); font-size: 11px; color: var(--text3);
  letter-spacing: .05em;
}
.hdr-right {
  display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start;
}

/* ── STATS ── */
.stat-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.sp {
  background: var(--s1); border: 1px solid var(--bdr);
  border-radius: 8px; padding: 6px 14px;
  font-family: var(--mono); font-size: 11px; color: var(--text2);
  display: flex; align-items: center; gap: 7px;
}
.sp b { font-size: 15px; font-weight: 700; color: var(--text); }
.sp .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* ── LEGEND ── */
.legend {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px;
  padding: 10px 14px;
  background: var(--s1); border: 1px solid var(--bdr); border-radius: 10px;
}
.leg-item {
  display: flex; align-items: center; gap: 5px;
  font-family: var(--mono); font-size: 10px; color: var(--text2);
}
.leg-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }

/* ── ARCH STAGE ── */
.arch-stage {
  position: relative;
  width: 100%; height: 620px;
  background: var(--s1);
  border: 1.5px solid var(--bdr);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 16px;
}

/* Subtle radial center glow */
.arch-stage::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 60% 40% at 50% 50%, rgba(108,143,255,.04) 0%, transparent 70%);
}

/* ── LAYER ZONES (horizontal bands) ── */
.layer-zone {
  position: absolute; left: 0; right: 0;
  border-bottom: 1px solid var(--bdr);
  pointer-events: none; z-index: 1;
}
.lz-label {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  font-family: var(--mono); font-size: 9px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
  opacity: .35; white-space: nowrap;
}

/* ── NODES ── */
.node {
  position: absolute; z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  cursor: pointer; user-select: none;
  transition: transform .2s;
}
.node:hover { transform: translateY(-3px) scale(1.04); }

.node-inner {
  border-radius: 14px; border: 2px solid;
  padding: 10px 10px 8px;
  display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  min-width: 86px; max-width: 104px;
  position: relative; overflow: hidden;
  transition: box-shadow .3s, border-color .3s;
}

/* Shine sweep on activate */
.node-inner::after {
  content: '';
  position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent);
  transition: left .4s ease;
}
.node.active .node-inner::after { left: 140%; }

.node-icon { font-size: 22px; line-height: 1; }
.node-name { font-family: var(--disp); font-size: 11px; font-weight: 700; line-height: 1.2; }
.node-tech { font-family: var(--mono); font-size: 8px; opacity: .55; margin-top: 1px; line-height: 1.3; }
.node-badge {
  font-family: var(--mono); font-size: 8px; font-weight: 700;
  padding: 2px 7px; border-radius: 5px; margin-top: 3px;
  letter-spacing: .04em; transition: background .3s, color .3s;
}

/* ── NODE GLOW ANIMATIONS ── */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50%       { box-shadow: 0 0 20px 4px currentColor; }
}
.node.pulsing .node-inner { animation: glow-pulse .6s ease; }

/* ── FLOW ARROW SVG ── */
#flow-svg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 5;
  overflow: visible;
}

/* ── MOVING PACKETS ── */
.pkt {
  position: fixed; pointer-events: none; z-index: 400;
  border-radius: 20px; font-family: var(--mono); font-size: 10px; font-weight: 700;
  display: flex; align-items: center; gap: 5px; padding: 4px 11px;
  white-space: nowrap; border: 1px solid rgba(255,255,255,.15);
  box-shadow: 0 4px 24px rgba(0,0,0,.7);
}

/* ── BOTTOM ROW ── */
.panels-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

/* ── PANEL ── */
.panel {
  background: var(--s1); border: 1.5px solid var(--bdr);
  border-radius: 14px; overflow: hidden;
}
.ph {
  padding: 9px 14px 8px; border-bottom: 1px solid var(--bdr);
  font-family: var(--mono); font-size: 10px; font-weight: 700;
  color: var(--text3); letter-spacing: .08em; text-transform: uppercase;
  display: flex; align-items: center; justify-content: space-between;
}
.pb { padding: 10px 12px; }

/* ── REQUEST PIPELINE ── */
.pipe-steps { padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
.pst {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 8px; padding: 6px 10px;
  transition: border-color .25s, background .25s;
}
.pst.lit  { border-color: var(--client); background: #03080f; }
.pst.ok   { border-color: var(--api);    background: #031009; }
.pst.warn { border-color: var(--lb);     background: #100e03; }
.pst.err  { border-color: var(--queue);  background: #100308; }
.pst-icon { font-size: 13px; flex-shrink: 0; }
.pst-name { font-size: 10px; font-weight: 600; color: var(--text2); flex: 1; }
.pst-val  { font-family: var(--mono); font-size: 9px; font-weight: 700; }

/* ── REQUEST FEED ── */
.req-feed { max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; padding: 6px 8px; }
.req-feed::-webkit-scrollbar { width: 3px; }
.req-feed::-webkit-scrollbar-thumb { background: var(--bdr2); border-radius: 2px; }
.rf-row {
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 6px; padding: 5px 8px;
  font-family: var(--mono); font-size: 10px;
  display: flex; align-items: center; gap: 6px;
  animation: rf-in .3s ease;
}
@keyframes rf-in { from{opacity:0;transform:translateX(-6px)} to{opacity:1} }
.rf-method { font-weight: 700; flex-shrink: 0; }
.rf-path   { color: var(--text2); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rf-result { font-size: 9px; font-weight: 700; flex-shrink: 0; }
.rf-ms     { color: var(--text3); font-size: 9px; flex-shrink: 0; }

/* ── CACHE VIS ── */
.cache-slots { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.cs {
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 6px; padding: 5px 7px;
  font-family: var(--mono); font-size: 9px;
  transition: border-color .3s, background .3s;
}
.cs.hot  { border-color: var(--cache); background: #120600; }
.cs.cold { border-color: var(--bdr); }
.cs-key  { color: var(--text2); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cs-val  { font-weight: 700; font-size: 8px; }
.cs-ttl  { color: var(--text3); font-size: 8px; float: right; }
.hit-miss-bar {
  display: flex; height: 6px; border-radius: 3px; overflow: hidden;
  margin-top: 8px;
}
.hm-hit  { background: var(--api);   transition: width .5s ease; }
.hm-miss { background: var(--queue); transition: width .5s ease; }

/* ── DB REPLICA STATUS ── */
.db-nodes { display: flex; flex-direction: column; gap: 5px; }
.db-node {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 7px; padding: 6px 9px;
  transition: border-color .3s;
}
.db-node.active { border-color: var(--db); }
.db-node-icon { font-size: 14px; flex-shrink: 0; }
.db-node-info { flex: 1; }
.db-node-name { font-size: 10px; font-weight: 700; color: var(--text); }
.db-node-role { font-family: var(--mono); font-size: 8px; color: var(--text2); }
.db-qps { font-family: var(--mono); font-size: 9px; font-weight: 700; color: var(--db); }
.db-bar { height: 3px; background: var(--bdr); border-radius: 2px; margin-top: 3px; overflow: hidden; }
.db-fill { height: 100%; background: var(--db); border-radius: 2px; transition: width .4s; }

/* ── QUEUE VIS ── */
.queue-vis { display: flex; flex-direction: column; gap: 4px; }
.qv-row {
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 6px; padding: 5px 9px;
  font-family: var(--mono); font-size: 9px;
  display: flex; align-items: center; gap: 6px;
  animation: qv-in .3s ease;
}
@keyframes qv-in { from{opacity:0;transform:scale(.94)} to{opacity:1} }
.qv-icon { font-size: 11px; flex-shrink: 0; }
.qv-topic { font-weight: 700; color: var(--queue); flex: 1; }
.qv-depth { color: var(--text3); }
.qv-rate  { color: var(--worker); font-weight: 700; }

/* ── LOG ── */
.log-wrap {
  background: var(--s1); border: 1.5px solid var(--bdr);
  border-radius: 12px; overflow: hidden; margin-bottom: 14px;
}
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
.lc  { color: var(--client); }
.llb { color: var(--lb); }
.la  { color: var(--api); }
.lca { color: var(--cache); }
.ld  { color: var(--db); }
.lq  { color: var(--queue); }
.lw  { color: var(--worker); }
.lcdn{ color: var(--cdn); }
.lerr{ color: var(--queue); }

/* ── CONTROLS ── */
.controls { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
.btn {
  font-family: var(--disp); font-size: 12px; font-weight: 700;
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--bdr);
  background: var(--s1); color: var(--text2); cursor: pointer; transition: all .15s;
  letter-spacing: .01em;
}
.btn:hover { background: var(--s2); border-color: var(--bdr2); color: var(--text); }
.btn.active { background: #050e22; border-color: var(--client); color: var(--client); }
.btn.green  { border-color: #0a3018; color: var(--api); }
.btn.green:hover { background: #040e08; }
.btn.amber  { border-color: #3a2c00; color: var(--lb); }
.btn.amber:hover { background: #0f0c00; }
.btn.red    { border-color: #3a0820; color: var(--queue); }
.btn.red:hover   { background: #0e0208; }
.speed-row { display: flex; align-items: center; gap: 8px; justify-content: center; font-family: var(--mono); font-size: 11px; color: var(--text3); }
input[type=range] { width: 80px; accent-color: var(--client); }
</style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="hdr">
    <div class="hdr-left">
      <h1>URL Shortener at Scale</h1>
      <div class="sub">// multi-server architecture · practice design · horizontally scalable</div>
    </div>
  </div>

  <!-- LEGEND -->
  <div class="legend">
    <div class="leg-item"><div class="leg-dot" style="background:var(--client)"></div>Clients</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--cdn)"></div>CDN</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--lb)"></div>Load Balancer</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--api)"></div>API Servers</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--cache)"></div>Redis Cache</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--db)"></div>Database (Primary + Replicas)</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--queue)"></div>Message Queue</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--worker)"></div>Workers</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--analytics)"></div>Analytics</div>
  </div>

  <!-- STATS -->
  <div class="stat-row">
    <div class="sp"><div class="dot" style="background:var(--client)"></div>Requests <b id="st-req">0</b></div>
    <div class="sp"><div class="dot" style="background:var(--api)"></div>Cache Hit <b id="st-chit" style="color:var(--cache)">0%</b></div>
    <div class="sp"><div class="dot" style="background:var(--lb)"></div>LB Routed <b id="st-lb">0</b></div>
    <div class="sp"><div class="dot" style="background:var(--db)"></div>DB Writes <b id="st-dbw" style="color:var(--db)">0</b></div>
    <div class="sp"><div class="dot" style="background:var(--queue)"></div>Queue Depth <b id="st-qd" style="color:var(--queue)">0</b></div>
    <div class="sp"><div class="dot" style="background:var(--worker)"></div>Workers <b id="st-wk" style="color:var(--worker)">3 active</b></div>
    <div class="sp">Avg Latency <b id="st-lat">—</b></div>
  </div>

  <!-- ARCH STAGE -->
  <div class="arch-stage" id="arch-stage">
    <svg id="flow-svg" viewBox="0 0 1180 620" preserveAspectRatio="none"></svg>

    <!-- Layer Zone Labels -->
    <div class="layer-zone" style="top:0;height:88px;">
      <div class="lz-label" style="color:var(--client)">CLIENTS</div>
    </div>
    <div class="layer-zone" style="top:88px;height:62px;">
      <div class="lz-label" style="color:var(--cdn)">CDN LAYER</div>
    </div>
    <div class="layer-zone" style="top:150px;height:70px;">
      <div class="lz-label" style="color:var(--lb)">LOAD BALANCER</div>
    </div>
    <div class="layer-zone" style="top:220px;height:120px;">
      <div class="lz-label" style="color:var(--api)">API SERVERS (stateless · horizontally scalable)</div>
    </div>
    <div class="layer-zone" style="top:340px;height:100px;">
      <div class="lz-label" style="color:var(--cache)">CACHE LAYER</div>
    </div>
    <div class="layer-zone" style="top:440px;height:100px;">
      <div class="lz-label" style="color:var(--db)">DATABASE LAYER</div>
    </div>
    <div class="layer-zone" style="top:540px;height:80px;border-bottom:none;">
      <div class="lz-label" style="color:var(--queue)">ASYNC LAYER (queue · workers · analytics)</div>
    </div>

    <!-- ═══ CLIENT NODES ═══ -->
    <div class="node" id="n-c0" style="left:80px;top:20px;" onclick="sendRequest('shorten')" title="Web Browser">
      <div class="node-inner" style="background:#030812;border-color:var(--client);color:var(--client);">
        <div class="node-icon">🌐</div>
        <div class="node-name">Browser</div>
        <div class="node-tech">POST /shorten</div>
        <div class="node-badge" id="b-c0" style="background:#03090f;color:var(--client)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-c1" style="left:280px;top:20px;" onclick="sendRequest('redirect')" title="Mobile App">
      <div class="node-inner" style="background:#030812;border-color:var(--client);color:var(--client);">
        <div class="node-icon">📱</div>
        <div class="node-name">Mobile</div>
        <div class="node-tech">GET /{code}</div>
        <div class="node-badge" id="b-c1" style="background:#03090f;color:var(--client)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-c2" style="left:500px;top:20px;" onclick="sendRequest('static')" title="API Client">
      <div class="node-inner" style="background:#030812;border-color:var(--client);color:var(--client);">
        <div class="node-icon">🔌</div>
        <div class="node-name">API Client</div>
        <div class="node-tech">REST / SDK</div>
        <div class="node-badge" id="b-c2" style="background:#03090f;color:var(--client)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-c3" style="left:740px;top:20px;" onclick="sendRequest('redirect')" title="Bot / Crawler">
      <div class="node-inner" style="background:#030812;border-color:var(--client);color:var(--client);">
        <div class="node-icon">🤖</div>
        <div class="node-name">Bot</div>
        <div class="node-tech">high volume</div>
        <div class="node-badge" id="b-c3" style="background:#03090f;color:var(--client)">IDLE</div>
      </div>
    </div>

    <!-- ═══ CDN ═══ -->
    <div class="node" id="n-cdn" style="left:980px;top:93px;" title="CDN - Static Assets">
      <div class="node-inner" style="background:#0a0314;border-color:var(--cdn);color:var(--cdn);">
        <div class="node-icon">🌍</div>
        <div class="node-name">CDN</div>
        <div class="node-tech">CloudFront · Fastly</div>
        <div class="node-badge" id="b-cdn" style="background:#06030c;color:var(--cdn)">IDLE</div>
      </div>
    </div>

    <!-- ═══ LOAD BALANCER ═══ -->
    <div class="node" id="n-lb" style="left:490px;top:158px;" title="Load Balancer">
      <div class="node-inner" style="background:#100d00;border-color:var(--lb);color:var(--lb);min-width:110px;">
        <div class="node-icon">⚖️</div>
        <div class="node-name">Load Balancer</div>
        <div class="node-tech">Nginx · AWS ALB</div>
        <div class="node-badge" id="b-lb" style="background:#0a0800;color:var(--lb)">IDLE</div>
      </div>
    </div>

    <!-- ═══ API SERVERS ═══ -->
    <div class="node" id="n-api0" style="left:160px;top:228px;" title="API Server 1">
      <div class="node-inner" style="background:#031008;border-color:var(--api);color:var(--api);">
        <div class="node-icon">⚡</div>
        <div class="node-name">API #1</div>
        <div class="node-tech">Node / Go</div>
        <div class="node-badge" id="b-api0" style="background:#020a04;color:var(--api)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-api1" style="left:360px;top:228px;" title="API Server 2">
      <div class="node-inner" style="background:#031008;border-color:var(--api);color:var(--api);">
        <div class="node-icon">⚡</div>
        <div class="node-name">API #2</div>
        <div class="node-tech">Node / Go</div>
        <div class="node-badge" id="b-api1" style="background:#020a04;color:var(--api)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-api2" style="left:560px;top:228px;" title="API Server 3">
      <div class="node-inner" style="background:#031008;border-color:var(--api);color:var(--api);">
        <div class="node-icon">⚡</div>
        <div class="node-name">API #3</div>
        <div class="node-tech">Node / Go</div>
        <div class="node-badge" id="b-api2" style="background:#020a04;color:var(--api)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-api3" style="left:760px;top:228px;" title="API Server 4 (auto-scaled)">
      <div class="node-inner" style="background:#031008;border-color:var(--api);color:var(--api);opacity:.5;" id="ni-api3">
        <div class="node-icon">⚡</div>
        <div class="node-name">API #4</div>
        <div class="node-tech">auto-scale</div>
        <div class="node-badge" id="b-api3" style="background:#020a04;color:var(--api)">STANDBY</div>
      </div>
    </div>

    <!-- ═══ REDIS CACHE ═══ -->
    <div class="node" id="n-cache" style="left:430px;top:350px;" title="Redis Cache">
      <div class="node-inner" style="background:#120600;border-color:var(--cache);color:var(--cache);min-width:110px;">
        <div class="node-icon">⚡</div>
        <div class="node-name">Redis Cache</div>
        <div class="node-tech">hot URLs · TTL</div>
        <div class="node-badge" id="b-cache" style="background:#0c0400;color:var(--cache)">IDLE</div>
      </div>
    </div>

    <!-- ═══ DATABASE LAYER ═══ -->
    <div class="node" id="n-dbp" style="left:300px;top:455px;" title="Primary DB">
      <div class="node-inner" style="background:#030718;border-color:var(--db);color:var(--db);">
        <div class="node-icon">🗄️</div>
        <div class="node-name">Primary DB</div>
        <div class="node-tech">PostgreSQL · writes</div>
        <div class="node-badge" id="b-dbp" style="background:#020512;color:var(--db)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-dbr0" style="left:520px;top:455px;" title="Read Replica 1">
      <div class="node-inner" style="background:#020614;border-color:var(--db);color:var(--db);opacity:.8;" id="ni-dbr0">
        <div class="node-icon">📖</div>
        <div class="node-name">Replica 1</div>
        <div class="node-tech">read offload</div>
        <div class="node-badge" id="b-dbr0" style="background:#020410;color:var(--db)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-dbr1" style="left:720px;top:455px;" title="Read Replica 2">
      <div class="node-inner" style="background:#020614;border-color:var(--db);color:var(--db);opacity:.8;" id="ni-dbr1">
        <div class="node-icon">📖</div>
        <div class="node-name">Replica 2</div>
        <div class="node-tech">read offload</div>
        <div class="node-badge" id="b-dbr1" style="background:#020410;color:var(--db)">IDLE</div>
      </div>
    </div>

    <!-- ═══ QUEUE ═══ -->
    <div class="node" id="n-queue" style="left:430px;top:552px;" title="Message Queue">
      <div class="node-inner" style="background:#0e0208;border-color:var(--queue);color:var(--queue);min-width:116px;">
        <div class="node-icon">📬</div>
        <div class="node-name">Message Queue</div>
        <div class="node-tech">RabbitMQ · Kafka</div>
        <div class="node-badge" id="b-queue" style="background:#080205;color:var(--queue)">IDLE</div>
      </div>
    </div>

    <!-- ═══ WORKERS ═══ -->
    <div class="node" id="n-wk0" style="left:160px;top:552px;" title="Analytics Worker">
      <div class="node-inner" style="background:#021008;border-color:var(--worker);color:var(--worker);">
        <div class="node-icon">📊</div>
        <div class="node-name">Analytics</div>
        <div class="node-tech">click tracking</div>
        <div class="node-badge" id="b-wk0" style="background:#020a04;color:var(--worker)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-wk1" style="left:760px;top:552px;" title="Email Worker">
      <div class="node-inner" style="background:#021008;border-color:var(--worker);color:var(--worker);">
        <div class="node-icon">📧</div>
        <div class="node-name">Email Worker</div>
        <div class="node-tech">notifications</div>
        <div class="node-badge" id="b-wk1" style="background:#020a04;color:var(--worker)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-wk2" style="left:980px;top:552px;" title="Cleanup Worker">
      <div class="node-inner" style="background:#021008;border-color:var(--worker);color:var(--worker);">
        <div class="node-icon">🧹</div>
        <div class="node-name">Cleanup</div>
        <div class="node-tech">expired URLs</div>
        <div class="node-badge" id="b-wk2" style="background:#020a04;color:var(--worker)">IDLE</div>
      </div>
    </div>

    <!-- Packet overlay -->
    <div id="pkts" style="position:absolute;inset:0;pointer-events:none;z-index:20;overflow:hidden;"></div>
  </div>

  <!-- BOTTOM PANELS -->
  <div class="panels-row">
    <!-- Request Feed -->
    <div class="panel">
      <div class="ph"><span>📡 Request Feed</span><span id="req-count" style="font-size:9px;color:var(--text3);">0</span></div>
      <div class="req-feed" id="req-feed">
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;padding:10px;">no requests yet…</div>
      </div>
    </div>

    <!-- Pipeline -->
    <div class="panel">
      <div class="ph"><span>⚙️ Active Flow</span><span id="flow-res" style="font-size:10px;font-weight:700;"></span></div>
      <div class="pipe-steps" id="pipe-steps">
        <div class="pst" id="ps-0"><span class="pst-icon">🌐</span><span class="pst-name">Client Request</span><span class="pst-val" id="pv-0">—</span></div>
        <div class="pst" id="ps-1"><span class="pst-icon">⚖️</span><span class="pst-name">Load Balancer Routes</span><span class="pst-val" id="pv-1">—</span></div>
        <div class="pst" id="ps-2"><span class="pst-icon">⚡</span><span class="pst-name">Cache Lookup (Redis)</span><span class="pst-val" id="pv-2">—</span></div>
        <div class="pst" id="ps-3"><span class="pst-icon">🗄️</span><span class="pst-name">DB Read/Write</span><span class="pst-val" id="pv-3">—</span></div>
        <div class="pst" id="ps-4"><span class="pst-icon">📬</span><span class="pst-name">Enqueue Async Job</span><span class="pst-val" id="pv-4">—</span></div>
        <div class="pst" id="ps-5"><span class="pst-icon">📤</span><span class="pst-name">Respond to Client</span><span class="pst-val" id="pv-5">—</span></div>
      </div>
    </div>

    <!-- Cache State -->
    <div class="panel">
      <div class="ph"><span>⚡ Redis State</span><span id="cache-rate" style="font-size:9px;font-weight:700;color:var(--cache);">0% hit</span></div>
      <div class="pb">
        <div class="cache-slots" id="cache-slots">
          <!-- populated by JS -->
        </div>
        <div class="hit-miss-bar" style="margin-top:8px;">
          <div class="hm-hit"  id="hm-hit"  style="width:0%;"></div>
          <div class="hm-miss" id="hm-miss" style="width:100%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:9px;color:var(--text3);margin-top:3px;">
          <span style="color:var(--api)">■ hits</span>
          <span style="color:var(--queue)">■ misses</span>
        </div>
      </div>
    </div>

    <!-- DB + Queue Status -->
    <div class="panel">
      <div class="ph"><span>🗄️ DB + Queue</span></div>
      <div class="pb">
        <div class="db-nodes" id="db-nodes">
          <div class="db-node" id="dbn-p">
            <span class="db-node-icon">🗄️</span>
            <div class="db-node-info">
              <div class="db-node-name">Primary DB</div>
              <div class="db-node-role">writes · master</div>
              <div class="db-bar"><div class="db-fill" id="dbf-p" style="width:20%;"></div></div>
            </div>
            <span class="db-qps" id="dbq-p">0 w/s</span>
          </div>
          <div class="db-node" id="dbn-r0">
            <span class="db-node-icon">📖</span>
            <div class="db-node-info">
              <div class="db-node-name">Replica 1</div>
              <div class="db-node-role">reads · async repl</div>
              <div class="db-bar"><div class="db-fill" id="dbf-r0" style="width:10%;background:rgba(108,143,255,.5);"></div></div>
            </div>
            <span class="db-qps" id="dbq-r0">0 r/s</span>
          </div>
          <div class="db-node" id="dbn-r1">
            <span class="db-node-icon">📖</span>
            <div class="db-node-info">
              <div class="db-node-name">Replica 2</div>
              <div class="db-node-role">reads · async repl</div>
              <div class="db-bar"><div class="db-fill" id="dbf-r1" style="width:10%;background:rgba(108,143,255,.5);"></div></div>
            </div>
            <span class="db-qps" id="dbq-r1">0 r/s</span>
          </div>
        </div>
        <div style="border-top:1px solid var(--bdr);margin-top:8px;padding-top:7px;">
          <div class="queue-vis" id="queue-vis">
            <div class="qv-row"><span class="qv-icon">📊</span><span class="qv-topic">analytics.clicks</span><span class="qv-depth" id="qd-0">0</span><span class="qv-rate">→ worker</span></div>
            <div class="qv-row"><span class="qv-icon">📧</span><span class="qv-topic">email.notify</span><span class="qv-depth" id="qd-1">0</span><span class="qv-rate">→ worker</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- LOG -->
  <div class="log-wrap">
    <div class="log-hdr"><span>System Log</span><span style="color:var(--text3)">each layer · real-time</span></div>
    <div class="log-body" id="log"></div>
  </div>

  <!-- CONTROLS -->
  <div class="controls">
    <button class="btn green" onclick="sendRequest('shorten')">✂️ POST /shorten</button>
    <button class="btn green" onclick="sendRequest('redirect')">↩️ GET /{code}</button>
    <button class="btn amber" onclick="sendRequest('static')">🌍 Static Asset (CDN)</button>
    <button class="btn amber" onclick="burstRedirects()">💥 Burst Redirects</button>
    <button class="btn red"   onclick="scaleOut()">📈 Scale Out API</button>
    <button class="btn"       onclick="simulateCacheMiss()">💾 Cache Miss</button>
    <button class="btn active" id="auto-btn" onclick="toggleAuto()">▶ Auto Demo</button>
    <button class="btn"       onclick="resetAll()" style="color:var(--text3)">↺ Reset</button>
  </div>
  <div class="speed-row" style="margin-top:10px;">
    Speed <input type="range" min="0.3" max="3" step="0.1" value="1" oninput="spd=parseFloat(this.value)">
  </div>

</div>
<div id="float-pkts" style="position:fixed;inset:0;pointer-events:none;z-index:300;"></div>

<script>
/* ══ STATE ══ */
let spd = 1, autoTimer = null;
let totalReq = 0, cacheHits = 0, cacheMisses = 0, dbWrites = 0, lbRouted = 0;
let queueDepth = [0, 0];
let latencies = [];
let pipeTimers = [];
let apiRR = 0; // round-robin index
let reqFeedCount = 0;

const SHORT_CODES = ['aB3kX','m9qLp','xZ2wR','kJ7nY','pQ4tM','rN8vC','hT5bF','dW6sE'];
const LONG_URLS   = ['https://google.com/search?q=system+design','https://github.com/trending','https://youtube.com/watch?v=xyz','https://aws.amazon.com/architecture'];

/* ══ CACHE STORE (simulated) ══ */
const cacheStore = {};
const CACHE_KEYS = ['aB3kX','m9qLp','xZ2wR','kJ7nY','pQ4tM','rN8vC'];

function d(ms) { return ms / spd; }

/* ══ LOGGING ══ */
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
  document.getElementById('st-req').textContent  = totalReq;
  document.getElementById('st-lb').textContent   = lbRouted;
  document.getElementById('st-dbw').textContent  = dbWrites;
  const hitRate = totalReq ? Math.round(cacheHits / totalReq * 100) : 0;
  document.getElementById('st-chit').textContent = hitRate + '%';
  document.getElementById('st-chit').style.color = hitRate > 60 ? 'var(--api)' : hitRate > 30 ? 'var(--lb)' : 'var(--queue)';
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b) / latencies.length) : 0;
  document.getElementById('st-lat').textContent  = avg ? avg + 'ms' : '—';
  document.getElementById('st-qd').textContent   = queueDepth[0] + queueDepth[1];
  document.getElementById('qd-0').textContent    = queueDepth[0];
  document.getElementById('qd-1').textContent    = queueDepth[1];
  const hpct = totalReq ? Math.max(2, cacheHits / totalReq * 100) : 2;
  document.getElementById('hm-hit').style.width  = hpct + '%';
  document.getElementById('hm-miss').style.width = (100 - hpct) + '%';
  document.getElementById('cache-rate').textContent = hitRate + '% hit';
}

/* ══ NODE BADGE ══ */
function setBadge(id, text, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = color || '';
}

function pulseNode(id) {
  const n = document.getElementById(id);
  if (!n) return;
  n.classList.add('pulsing');
  setTimeout(() => n.classList.remove('pulsing'), 700);
}

/* ══ PIPELINE ══ */
function clearPipe() {
  pipeTimers.forEach(t => clearTimeout(t)); pipeTimers = [];
  for (let i = 0; i < 6; i++) {
    document.getElementById('ps-' + i).className = 'pst';
    document.getElementById('pv-' + i).textContent = '—';
  }
  document.getElementById('flow-res').textContent = '';
}

function litPipe(i, cls, val, delay) {
  const t = setTimeout(() => {
    document.getElementById('ps-' + i).className = 'pst ' + cls;
    document.getElementById('pv-' + i).textContent = val || '—';
  }, d(delay));
  pipeTimers.push(t);
}

/* ══ PACKET ANIMATION ══ */
function flyPkt(fromId, toId, opts, onDone) {
  const stage = document.getElementById('arch-stage');
  const fromEl = document.getElementById(fromId);
  const toEl   = document.getElementById(toId);
  if (!fromEl || !toEl) { if (onDone) onDone(); return; }
  const sr = stage.getBoundingClientRect();
  const fr = fromEl.getBoundingClientRect();
  const tr = toEl.getBoundingClientRect();
  const fx = fr.left - sr.left + fr.width / 2;
  const fy = fr.top  - sr.top  + fr.height / 2;
  const tx = tr.left - sr.left + tr.width / 2;
  const ty = tr.top  - sr.top  + tr.height / 2;

  const pkt = document.createElement('div');
  pkt.className = 'pkt';
  const w = opts.w || 80;
  pkt.style.cssText = `background:${opts.bg};border-color:${opts.border};color:${opts.color};width:${w}px;height:24px;left:${fx - w/2}px;top:${fy - 12}px;`;
  pkt.innerHTML = opts.label;
  document.getElementById('pkts').appendChild(pkt);

  const dist = Math.hypot(tx - fx, ty - fy);
  const dur  = Math.max(200, dist / (200 * spd) * 1000);
  pkt.animate([
    { left: (fx - w/2) + 'px', top: (fy - 12) + 'px', opacity: 1 },
    { left: (tx - w/2) + 'px', top: (ty - 12) + 'px', opacity: 1 },
  ], { duration: dur, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
  .finished.then(() => { pkt.remove(); if (onDone) onDone(); });
}

/* ══ CACHE RENDER ══ */
function renderCache() {
  const grid = document.getElementById('cache-slots');
  grid.innerHTML = '';
  CACHE_KEYS.forEach(k => {
    const entry = cacheStore[k];
    const div = document.createElement('div');
    div.className = 'cs ' + (entry ? 'hot' : 'cold');
    div.innerHTML = `
      <div class="cs-key">${k}</div>
      <div class="cs-val" style="color:${entry ? 'var(--cache)' : 'var(--text3)'}">
        ${entry ? '→ ' + entry.url.substring(0, 18) + '…' : 'empty'}
        <span class="cs-ttl">${entry ? 'TTL:' + entry.ttl + 's' : ''}</span>
      </div>`;
    grid.appendChild(div);
  });
}

/* ══ DB LOAD UPDATE ══ */
function updateDbLoad(type, val) {
  if (type === 'write') {
    document.getElementById('dbf-p').style.width = Math.min(90, val) + '%';
    document.getElementById('dbq-p').textContent = Math.round(val / 10) + ' w/s';
  } else {
    const pct = Math.min(80, val);
    document.getElementById('dbf-r0').style.width = pct + '%';
    document.getElementById('dbf-r1').style.width = Math.max(5, pct - 10) + '%';
    document.getElementById('dbq-r0').textContent = Math.round(val / 8) + ' r/s';
    document.getElementById('dbq-r1').textContent = Math.round(val / 10) + ' r/s';
  }
}

/* ══ REQUEST FEED ══ */
function addFeedRow(method, path, result, ms, color) {
  reqFeedCount++;
  const feed = document.getElementById('req-feed');
  const empty = feed.querySelector('[style*="no requests"]');
  if (empty) empty.remove();
  const row = document.createElement('div');
  row.className = 'rf-row';
  row.innerHTML = `
    <span class="rf-method" style="color:${color}">${method}</span>
    <span class="rf-path">${path}</span>
    <span class="rf-result" style="color:${result === '200' || result === '301' ? 'var(--api)' : 'var(--queue)'}">${result}</span>
    <span class="rf-ms">${ms}ms</span>`;
  feed.insertBefore(row, feed.firstChild);
  if (feed.children.length > 20) feed.removeChild(feed.lastChild);
  document.getElementById('req-count').textContent = reqFeedCount;
}

/* ══ SEND REQUEST ══ */
function sendRequest(type) {
  totalReq++;
  clearPipe();

  const clientNodes = ['n-c0','n-c1','n-c2','n-c3'];
  const clientBadges = ['b-c0','b-c1','b-c2','b-c3'];

  /* Pick client based on type */
  let cIdx = type === 'shorten' ? 0 : type === 'redirect' ? (totalReq % 2 === 0 ? 1 : 3) : 2;
  let cNode = clientNodes[cIdx];
  let cBadge = clientBadges[cIdx];

  /* Round-robin API server */
  const activeApis = ['n-api0','n-api1','n-api2'];
  const apiIdx = apiRR % activeApis.length;
  const apiNode = activeApis[apiIdx];
  const apiBadge = 'b-api' + apiIdx;
  apiRR++;

  const shortCode = SHORT_CODES[totalReq % SHORT_CODES.length];
  const longUrl   = LONG_URLS[totalReq % LONG_URLS.length];
  const lat = type === 'static' ? 8 : (Math.random() * 60 + 20) | 0;
  latencies.push(lat); if (latencies.length > 30) latencies.shift();

  setBadge(cBadge, 'SENDING', 'var(--client)');
  pulseNode(cNode);
  addLog('lc', `[Client] ${type === 'shorten' ? 'POST /shorten' : type === 'redirect' ? 'GET /' + shortCode : 'GET /static/assets'}`);

  /* STATIC → CDN */
  if (type === 'static') {
    litPipe(0, 'lit', 'static asset', 0);
    litPipe(0, 'ok', 'CDN request', d(100));
    flyPkt(cNode, 'n-cdn', { bg:'#0a0314', border:'var(--cdn)', color:'var(--cdn)', label:'🌍 GET /static', w:100 }, () => {
      pulseNode('n-cdn');
      setBadge('b-cdn', 'HIT', 'var(--cdn)');
      litPipe(1, 'ok', 'CDN HIT', d(50));
      litPipe(5, 'ok', '200 OK (8ms)', d(150));
      document.getElementById('flow-res').textContent = '⚡ CDN HIT';
      document.getElementById('flow-res').style.color = 'var(--cdn)';
      addLog('lcdn', `[CDN] Cache HIT — asset served from edge in 8ms`);
      flyPkt('n-cdn', cNode, { bg:'#0a0314', border:'var(--cdn)', color:'var(--cdn)', label:'✓ 200 OK', w:70 }, () => {
        setBadge(cBadge, 'DONE', 'var(--api)');
        addFeedRow('GET', '/static/main.js', '200', 8, 'var(--cdn)');
        setTimeout(() => { setBadge('b-cdn', 'IDLE', ''); setBadge(cBadge, 'IDLE', ''); }, d(800));
      });
    });
    updateStats();
    return;
  }

  /* STEP 1: Client → LB */
  litPipe(0, 'lit', 'sending…', 0);
  flyPkt(cNode, 'n-lb', {
    bg: '#100d00', border: 'var(--lb)', color: 'var(--lb)',
    label: type === 'shorten' ? '✂️ POST /shorten' : `↩️ GET /${shortCode}`, w: 120,
  }, () => {
    lbRouted++;
    pulseNode('n-lb');
    setBadge('b-lb', 'ROUTING', 'var(--lb)');
    litPipe(0, 'ok', 'received', 0);
    litPipe(1, 'lit', 'routing…', 0);
    addLog('llb', `[LB] Round-robin → API #${apiIdx + 1}`);

    /* STEP 2: LB → API */
    flyPkt('n-lb', apiNode, {
      bg: '#031008', border: 'var(--api)', color: 'var(--api)',
      label: `→ API #${apiIdx + 1}`, w: 80,
    }, () => {
      pulseNode(apiNode);
      setBadge(apiBadge, 'BUSY', 'var(--api)');
      setBadge('b-lb', 'DONE', 'var(--api)');
      litPipe(1, 'ok', `API #${apiIdx + 1}`, 0);
      addLog('la', `[API #${apiIdx + 1}] Handling ${type === 'shorten' ? 'shorten' : 'redirect'} request`);

      /* STEP 3: Cache lookup */
      litPipe(2, 'lit', 'checking…', 0);
      flyPkt(apiNode, 'n-cache', {
        bg: '#120600', border: 'var(--cache)', color: 'var(--cache)',
        label: `⚡ GET ${shortCode}`, w: 90,
      }, () => {
        pulseNode('n-cache');
        setBadge('b-cache', 'LOOKUP', 'var(--cache)');

        const isCacheHit = type === 'redirect' && !!cacheStore[shortCode];

        if (isCacheHit) {
          /* CACHE HIT */
          cacheHits++;
          setBadge('b-cache', 'HIT', 'var(--cache)');
          litPipe(2, 'ok', 'HIT ⚡', 0);
          addLog('lca', `[Redis] Cache HIT for ${shortCode} → ${cacheStore[shortCode].url.substring(0, 30)}…`);

          flyPkt('n-cache', apiNode, { bg:'#120600', border:'var(--cache)', color:'var(--cache)', label:'⚡ HIT', w:64 }, () => {
            litPipe(4, 'ok', 'skip async', 0);
            litPipe(5, 'ok', `301 (${lat}ms)`, 0);
            document.getElementById('flow-res').textContent = '⚡ CACHE HIT';
            document.getElementById('flow-res').style.color = 'var(--cache)';
            flyPkt(apiNode, cNode, { bg:'#120600', border:'var(--cache)', color:'var(--cache)', label:`✓ 301 ${lat}ms`, w:90 }, () => {
              setBadge(cBadge, 'DONE', 'var(--api)');
              setBadge(apiBadge, 'IDLE', '');
              setBadge('b-cache', 'IDLE', '');
              addFeedRow('GET', `/${shortCode}`, '301', lat, 'var(--cache)');
              /* Async: analytics */
              enqueueJob('analytics');
              setTimeout(() => setBadge(cBadge, 'IDLE', ''), d(800));
            });
          });

        } else {
          /* CACHE MISS → DB */
          cacheMisses++;
          setBadge('b-cache', 'MISS', 'var(--queue)');
          litPipe(2, 'warn', 'MISS', 0);
          addLog('lca', `[Redis] Cache MISS for ${shortCode} — querying DB`);

          /* Cache write for shorten */
          if (type === 'shorten') {
            cacheStore[shortCode] = { url: longUrl, ttl: 3600 };
            renderCache();
          }

          /* STEP 4: DB */
          litPipe(3, 'lit', type === 'shorten' ? 'writing…' : 'reading…', 0);
          const dbTarget = type === 'shorten' ? 'n-dbp' : (totalReq % 2 === 0 ? 'n-dbr0' : 'n-dbr1');
          const dbBadge  = type === 'shorten' ? 'b-dbp' : (totalReq % 2 === 0 ? 'b-dbr0' : 'b-dbr1');

          flyPkt('n-cache', dbTarget, {
            bg: '#030718', border: 'var(--db)', color: 'var(--db)',
            label: type === 'shorten' ? '🗄️ INSERT' : `🗄️ SELECT ${shortCode}`, w: 110,
          }, () => {
            pulseNode(dbTarget);
            setBadge(dbBadge, type === 'shorten' ? 'WRITING' : 'READING', 'var(--db)');

            if (type === 'shorten') dbWrites++;
            updateDbLoad(type === 'shorten' ? 'write' : 'read', 30 + Math.random() * 40);

            setTimeout(() => {
              setBadge(dbBadge, 'DONE', 'var(--api)');
              litPipe(3, 'ok', type === 'shorten' ? 'stored' : 'found', 0);
              addLog('ld', `[DB] ${type === 'shorten' ? 'INSERT short_urls' : 'SELECT by code=' + shortCode} → OK`);

              /* Cache warm for redirect miss */
              if (type === 'redirect') {
                cacheStore[shortCode] = { url: longUrl, ttl: 3600 };
                renderCache();
                addLog('lca', `[Redis] Cache warmed for ${shortCode} TTL=3600s`);
              }

              /* STEP 5: Enqueue async */
              litPipe(4, 'lit', 'enqueuing…', 0);
              enqueueJob(type === 'shorten' ? 'email' : 'analytics');

              /* STEP 6: Respond */
              litPipe(5, 'ok', `${type === 'shorten' ? '201' : '301'} (${lat}ms)`, d(200));
              document.getElementById('flow-res').textContent = type === 'shorten' ? '✅ SHORTENED' : '✅ REDIRECT';
              document.getElementById('flow-res').style.color = 'var(--api)';

              flyPkt(apiNode, cNode, {
                bg: '#031008', border: 'var(--api)', color: 'var(--api)',
                label: `✓ ${type === 'shorten' ? '201 Created' : '301 Redirect'} ${lat}ms`, w: 140,
              }, () => {
                setBadge(cBadge, 'DONE', 'var(--api)');
                setBadge(apiBadge, 'IDLE', '');
                setBadge('b-cache', 'IDLE', '');
                addFeedRow(
                  type === 'shorten' ? 'POST' : 'GET',
                  type === 'shorten' ? '/shorten' : `/${shortCode}`,
                  type === 'shorten' ? '201' : '301',
                  lat, type === 'shorten' ? 'var(--api)' : 'var(--db)'
                );
                setTimeout(() => setBadge(cBadge, 'IDLE', ''), d(800));
              });
            }, d(250));
          });
        }
        updateStats();
      });
    });
  });
  updateStats();
}

/* ══ ENQUEUE JOB ══ */
function enqueueJob(type) {
  const qIdx = type === 'analytics' ? 0 : 1;
  queueDepth[qIdx]++;
  setBadge('b-queue', 'ACTIVE', 'var(--queue)');
  addLog('lq', `[Queue] ${type === 'analytics' ? '📊 analytics.clicks' : '📧 email.notify'} enqueued (depth: ${queueDepth[qIdx]})`);
  litPipe(4, 'ok', type, 0);

  const workerNode = type === 'analytics' ? 'n-wk0' : 'n-wk1';
  const workerBadge = type === 'analytics' ? 'b-wk0' : 'b-wk1';

  setTimeout(() => {
    flyPkt('n-queue', workerNode, {
      bg: '#021008', border: 'var(--worker)', color: 'var(--worker)',
      label: type === 'analytics' ? '📊 process' : '📧 send', w: 80,
    }, () => {
      pulseNode(workerNode);
      setBadge(workerBadge, 'WORKING', 'var(--worker)');
      queueDepth[qIdx] = Math.max(0, queueDepth[qIdx] - 1);
      addLog('lw', `[Worker] ${type === 'analytics' ? 'Click recorded to analytics DB' : 'Confirmation email sent'}`);
      updateStats();
      setTimeout(() => { setBadge(workerBadge, 'IDLE', ''); setBadge('b-queue', 'IDLE', ''); }, d(600));
    });
  }, d(400));
}

/* ══ BURST ══ */
function burstRedirects() {
  addLog('lc', '[Burst] 12 simultaneous redirect requests → testing LB distribution…');
  let i = 0;
  const iv = setInterval(() => {
    if (i++ >= 12) { clearInterval(iv); return; }
    sendRequest('redirect');
  }, d(250));
}

/* ══ SCALE OUT ══ */
function scaleOut() {
  const api3 = document.getElementById('ni-api3');
  if (api3) {
    api3.style.opacity = '1';
    setBadge('b-api3', 'ONLINE', 'var(--api)');
    document.getElementById('st-wk').textContent = '4 active';
    addLog('la', '[Autoscale] 📈 API #4 spun up — 4 servers now serving traffic');
    addLog('llb', '[LB] Health check passed for API #4 — added to rotation');
    pulseNode('n-api3');
  }
}

/* ══ CACHE MISS SIM ══ */
function simulateCacheMiss() {
  const key = SHORT_CODES[Math.floor(Math.random() * SHORT_CODES.length)];
  delete cacheStore[key];
  renderCache();
  addLog('lca', `[Redis] Key ${key} evicted (TTL expired) — next request will be a DB lookup`);
  setTimeout(() => sendRequest('redirect'), d(300));
}

/* ══ AUTO DEMO ══ */
const AUTO_SEQ = ['redirect','redirect','shorten','redirect','redirect','static','redirect','redirect','shorten','redirect'];
let autoTick = 0;
function toggleAuto() {
  const btn = document.getElementById('auto-btn');
  if (autoTimer) {
    clearInterval(autoTimer); autoTimer = null;
    btn.textContent = '▶ Auto Demo'; btn.classList.add('active');
  } else {
    btn.textContent = '⏹ Stop Demo';
    autoTimer = setInterval(() => {
      AUTO_SEQ[autoTick % AUTO_SEQ.length] === 'redirect' ? sendRequest('redirect') :
      AUTO_SEQ[autoTick % AUTO_SEQ.length] === 'shorten'  ? sendRequest('shorten') :
      sendRequest('static');
      autoTick++;
    }, d(2200));
  }
}

/* ══ DRAW STATIC ARROWS ══ */
function drawArrows() {
  const svg = document.getElementById('flow-svg');
  const stage = document.getElementById('arch-stage');
  const sr = stage.getBoundingClientRect();
  const W = sr.width, H = sr.height;
  const sx = 1180 / W, sy = 620 / H;

  function pos(id) {
    const el = document.getElementById(id);
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: (r.left - sr.left + r.width/2)*sx, y: (r.top - sr.top + r.height/2)*sy };
  }

  const conns = [
    ['n-c0','n-lb','var(--client)'],
    ['n-c1','n-lb','var(--client)'],
    ['n-c2','n-lb','var(--client)'],
    ['n-c3','n-lb','var(--client)'],
    ['n-c2','n-cdn','var(--cdn)'],
    ['n-lb','n-api0','var(--lb)'],
    ['n-lb','n-api1','var(--lb)'],
    ['n-lb','n-api2','var(--lb)'],
    ['n-lb','n-api3','var(--lb)'],
    ['n-api0','n-cache','var(--cache)'],
    ['n-api1','n-cache','var(--cache)'],
    ['n-api2','n-cache','var(--cache)'],
    ['n-cache','n-dbp','var(--db)'],
    ['n-cache','n-dbr0','var(--db)'],
    ['n-cache','n-dbr1','var(--db)'],
    ['n-dbp','n-dbr0','rgba(108,143,255,.2)'],
    ['n-dbp','n-dbr1','rgba(108,143,255,.2)'],
    ['n-api0','n-queue','var(--queue)'],
    ['n-api2','n-queue','var(--queue)'],
    ['n-queue','n-wk0','var(--worker)'],
    ['n-queue','n-wk1','var(--worker)'],
    ['n-queue','n-wk2','var(--worker)'],
  ];

  let s = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#2a3358" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;

  conns.forEach(([from, to, color]) => {
    const f = pos(from), t = pos(to);
    const mx = (f.x+t.x)/2, my = (f.y+t.y)/2 - 10;
    s += `<path d="M${f.x},${f.y} Q${mx},${my} ${t.x},${t.y}" fill="none" stroke="${color}" stroke-width=".9" stroke-dasharray="4 6" opacity=".35" marker-end="url(#ah)"/>`;
  });

  svg.innerHTML = s;
}

/* ══ RESET ══ */
function resetAll() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; document.getElementById('auto-btn').textContent = '▶ Auto Demo'; document.getElementById('auto-btn').classList.add('active'); }
  totalReq=0; cacheHits=0; cacheMisses=0; dbWrites=0; lbRouted=0; queueDepth=[0,0]; latencies=[]; apiRR=0; reqFeedCount=0;
  clearPipe();
  Object.keys(cacheStore).forEach(k => delete cacheStore[k]);
  renderCache();
  updateStats();
  document.getElementById('req-feed').innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;padding:10px;">no requests yet…</div>';
  document.getElementById('log').innerHTML = '';
  const badges = ['b-c0','b-c1','b-c2','b-c3','b-lb','b-api0','b-api1','b-api2','b-api3','b-cache','b-dbp','b-dbr0','b-dbr1','b-queue','b-wk0','b-wk1','b-wk2','b-cdn'];
  badges.forEach(b => { const el = document.getElementById(b); if (el) { el.textContent = b.startsWith('b-c') ? 'IDLE' : '—'; el.style.color = ''; } });
  addLog('la', '[System] Architecture reset — all layers cleared');
}

/* ══ INIT ══ */
window.addEventListener('load', () => {
  setTimeout(drawArrows, 120);
  renderCache();
  updateStats();
  addLog('la', '[System] Multi-server URL shortener ready');
  addLog('llb', '[LB] Nginx load balancer online — 3 API servers in rotation');
  addLog('ld', '[DB] Primary + 2 replicas healthy — replication lag: 0ms');
  addLog('lca', '[Redis] Cache initialized — hot URL store ready');
  toggleAuto();
});
window.addEventListener('resize', () => setTimeout(drawArrows, 100));
</script>
</body>
</html>
