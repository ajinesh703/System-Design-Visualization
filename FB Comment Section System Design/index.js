<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Facebook Comment System — System Design</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root {
  --bg:      #03050b;
  --s1:      #070a18;
  --s2:      #0d1228;
  --s3:      #131a38;
  --bdr:     #1a2345;
  --bdr2:    #283268;

  /* Facebook brand */
  --fb-blue:  #1877f2;
  --fb-light: #4299fd;

  /* Layer colors */
  --client:   #4299fd;
  --cdn:      #c084fc;
  --gw:       #f7c948;
  --api:      #34d399;
  --ws:       #22d3ee;
  --cache:    #f97316;
  --db-write: #6c8fff;
  --db-read:  #818cf8;
  --fanout:   #f472b6;
  --notify:   #a3e635;
  --ml:       #fb923c;
  --search:   #38bdf8;
  --media:    #e879f9;
  --queue:    #f43f5e;

  --text:    #e8ebff;
  --text2:   #68769a;
  --text3:   #232d52;
  --mono:    'JetBrains Mono', monospace;
  --disp:    'Outfit', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--disp);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Grid lines */
body::before {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(66,153,253,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(66,153,253,.03) 1px, transparent 1px);
  background-size: 42px 42px;
}

/* Top gradient */
body::after {
  content: ''; position: fixed; top: 0; left: 0; right: 0; height: 300px;
  background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(24,119,242,.07) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}

.wrap { position: relative; z-index: 1; max-width: 1240px; margin: 0 auto; padding: 22px 18px 36px; }

/* ── HEADER ── */
.hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
.hdr h1 {
  font-family: var(--disp); font-size: 28px; font-weight: 900; letter-spacing: -.025em; margin-bottom: 3px;
  background: linear-gradient(125deg, var(--fb-light) 0%, var(--ws) 45%, var(--notify) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hdr .sub { font-family: var(--mono); font-size: 11px; color: var(--text3); letter-spacing: .05em; }

/* ── STATS ── */
.stats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.sp {
  background: var(--s1); border: 1px solid var(--bdr);
  border-radius: 8px; padding: 5px 14px;
  font-family: var(--mono); font-size: 11px; color: var(--text2);
  display: flex; align-items: center; gap: 6px;
}
.sp b { font-size: 15px; font-weight: 700; color: var(--text); }
.sp .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* ── MAIN ARCH STAGE ── */
.arch-stage {
  position: relative;
  width: 100%; height: 680px;
  background: var(--s1);
  border: 1.5px solid var(--bdr);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 14px;
}
.arch-stage::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(24,119,242,.03) 0%, transparent 70%);
}

/* ── LAYER ZONES ── */
.lz {
  position: absolute; left: 0; right: 0;
  border-bottom: 1px solid rgba(26,35,69,.6);
  pointer-events: none; z-index: 1;
}
.lz-lbl {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font-family: var(--mono); font-size: 8px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; opacity: .4;
}

/* ── NODES ── */
.node {
  position: absolute; z-index: 10;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; cursor: pointer; user-select: none;
  transition: transform .18s;
}
.node:hover { transform: translateY(-3px) scale(1.05); }

.nbox {
  border-radius: 13px; border: 1.5px solid;
  padding: 9px 10px 7px;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  min-width: 82px; max-width: 106px;
  transition: box-shadow .3s, border-color .3s;
  position: relative; overflow: hidden;
}
.ni  { font-size: 19px; line-height: 1; }
.nn  { font-family: var(--disp); font-size: 10px; font-weight: 700; line-height: 1.2; }
.nt  { font-family: var(--mono); font-size: 7px; opacity: .5; margin-top: 1px; line-height: 1.3; }
.nb  {
  font-family: var(--mono); font-size: 7px; font-weight: 700;
  padding: 2px 6px; border-radius: 4px; margin-top: 3px;
  letter-spacing: .04em; transition: all .25s;
}

/* Activate sweep */
.nbox::after {
  content: ''; position: absolute; top: 0; left: -100%; width: 55%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent);
}
.node.act .nbox::after { animation: sweep .4s ease forwards; }
@keyframes sweep { to { left: 140%; } }

/* Glow animations */
@keyframes glow-blue  { 0%,100%{box-shadow:0 0 0 0 rgba(66,153,253,0)} 50%{box-shadow:0 0 22px 4px rgba(66,153,253,.45)} }
@keyframes glow-green { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} 50%{box-shadow:0 0 20px 4px rgba(52,211,153,.4)} }
@keyframes glow-amber { 0%,100%{box-shadow:0 0 0 0 rgba(247,201,72,0)} 50%{box-shadow:0 0 20px 4px rgba(247,201,72,.4)} }
@keyframes glow-red   { 0%,100%{box-shadow:0 0 0 0 rgba(244,63,94,0)} 50%{box-shadow:0 0 20px 4px rgba(244,63,94,.45)} }
@keyframes glow-cyan  { 0%,100%{box-shadow:0 0 0 0 rgba(34,211,238,0)} 50%{box-shadow:0 0 20px 4px rgba(34,211,238,.4)} }
.gb { animation: glow-blue  .6s ease; }
.gg { animation: glow-green .6s ease; }
.ga { animation: glow-amber .6s ease; }
.gr { animation: glow-red   .6s ease; }
.gc { animation: glow-cyan  .6s ease; }

/* ── SVG LAYER ── */
#arch-svg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 5; overflow: visible;
}

/* ── PACKETS ── */
.pkt {
  position: fixed; pointer-events: none; z-index: 500;
  border-radius: 20px; font-family: var(--mono); font-size: 10px; font-weight: 700;
  display: flex; align-items: center; gap: 5px; padding: 4px 11px;
  white-space: nowrap; border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 4px 24px rgba(0,0,0,.7);
}

/* ── BOTTOM PANELS ── */
.panels {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
.panel { background: var(--s1); border: 1.5px solid var(--bdr); border-radius: 13px; overflow: hidden; }
.ph {
  padding: 8px 13px 7px; border-bottom: 1px solid var(--bdr);
  font-family: var(--mono); font-size: 9px; font-weight: 700;
  color: var(--text3); letter-spacing: .08em; text-transform: uppercase;
  display: flex; align-items: center; justify-content: space-between;
}
.pb { padding: 9px 11px; }

/* ── COMMENT FEED ── */
.comment-feed { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; }
.comment-feed::-webkit-scrollbar { width: 3px; }
.comment-feed::-webkit-scrollbar-thumb { background: var(--bdr2); border-radius: 2px; }
.cf-row {
  background: var(--bg); border: 1px solid var(--bdr); border-radius: 8px; padding: 6px 9px;
  animation: cf-in .3s ease;
}
@keyframes cf-in { from{opacity:0;transform:translateY(-5px)} to{opacity:1} }
.cf-top { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.cf-avatar { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
.cf-user { font-family: var(--mono); font-size: 10px; font-weight: 700; color: var(--client); flex: 1; }
.cf-type { font-family: var(--mono); font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
.cf-text { font-family: var(--mono); font-size: 9px; color: var(--text2); }
.cf-meta { display: flex; gap: 8px; margin-top: 3px; font-family: var(--mono); font-size: 8px; color: var(--text3); }

/* ── PIPELINE ── */
.pipe-steps { padding: 7px 9px; display: flex; flex-direction: column; gap: 4px; }
.pst {
  display: flex; align-items: center; gap: 7px;
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 7px; padding: 5px 9px;
  transition: border-color .25s, background .25s;
}
.pst.lit  { border-color: var(--client);  background: #030810; }
.pst.ok   { border-color: var(--api);     background: #031009; }
.pst.warn { border-color: var(--gw);      background: #100e02; }
.pst.err  { border-color: var(--queue);   background: #100206; }
.pst.fan  { border-color: var(--fanout);  background: #100610; }
.pst-icon { font-size: 12px; flex-shrink: 0; }
.pst-name { font-size: 9px; font-weight: 600; color: var(--text2); flex: 1; }
.pst-val  { font-family: var(--mono); font-size: 8px; font-weight: 700; }

/* ── WEBSOCKET VIS ── */
.ws-list { display: flex; flex-direction: column; gap: 4px; }
.ws-row {
  display: flex; align-items: center; gap: 6px;
  background: var(--bg); border: 1px solid var(--bdr); border-radius: 6px; padding: 5px 8px;
  font-family: var(--mono); font-size: 9px;
  transition: border-color .3s;
}
.ws-row.active { border-color: var(--ws); background: #020c10; }
.ws-icon { font-size: 12px; flex-shrink: 0; }
.ws-user { color: var(--ws); font-weight: 700; flex: 1; }
.ws-msgs { color: var(--text3); }
.ws-ping { font-size: 8px; }
.ws-ping.ok { color: var(--api); }

/* ── CACHE SLOTS ── */
.cache-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
.cs {
  background: var(--bg); border: 1px solid var(--bdr); border-radius: 5px;
  padding: 4px 6px; font-family: var(--mono); font-size: 8px;
  transition: border-color .3s, background .3s;
}
.cs.hot  { border-color: var(--cache); background: #100500; }
.cs-key  { color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 1px; }
.cs-val  { font-weight: 700; font-size: 7px; }
.cs-ttl  { color: var(--text3); font-size: 7px; float: right; }

/* ── DB TABLE ── */
.db-mini { width: 100%; font-family: var(--mono); font-size: 9px; border-collapse: collapse; }
.db-mini th { color: var(--text3); font-size: 7px; letter-spacing: .05em; text-transform: uppercase; padding: 3px 5px; border-bottom: 1px solid var(--bdr); text-align: left; }
.db-mini td { padding: 4px 5px; border-bottom: 1px solid rgba(26,35,69,.5); }
.db-mini tr:last-child td { border-bottom: none; }
@keyframes db-row-in { from{background:rgba(108,143,255,.15)} to{background:transparent} }
.db-mini tr.new td { animation: db-row-in .8s ease; }

/* ── FANOUT STATUS ── */
.fanout-list { display: flex; flex-direction: column; gap: 4px; }
.fo-row {
  display: flex; align-items: center; gap: 6px;
  background: var(--bg); border: 1px solid var(--bdr); border-radius: 6px; padding: 5px 8px;
  font-family: var(--mono); font-size: 9px;
  transition: border-color .3s, background .3s;
}
.fo-row.active { border-color: var(--fanout); background: #0c0210; }
.fo-icon { font-size: 12px; flex-shrink: 0; }
.fo-label { flex: 1; color: var(--text2); }
.fo-count { color: var(--fanout); font-weight: 700; }
.fo-bar { height: 3px; background: var(--bdr); border-radius: 2px; margin-top: 3px; overflow: hidden; }
.fo-fill { height: 100%; border-radius: 2px; transition: width .4s ease; }

/* ── LOG ── */
.log-wrap { background: var(--s1); border: 1.5px solid var(--bdr); border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
.log-hdr { padding: 7px 14px; font-family: var(--mono); font-size: 9px; font-weight: 700; color: var(--text3); border-bottom: 1px solid var(--bdr); letter-spacing: .07em; text-transform: uppercase; display: flex; justify-content: space-between; }
.log-body { height: 66px; overflow-y: auto; padding: 4px 14px; font-family: var(--mono); font-size: 11px; line-height: 1.7; }
.log-body::-webkit-scrollbar { width: 3px; }
.log-body::-webkit-scrollbar-thumb { background: var(--bdr2); border-radius: 2px; }
@keyframes li { from{opacity:0;transform:translateY(3px)} to{opacity:1} }
.le { animation: li .2s ease; }
.lc  { color: var(--client); }
.lgw { color: var(--gw); }
.la  { color: var(--api); }
.lws { color: var(--ws); }
.lca { color: var(--cache); }
.ldb { color: var(--db-write); }
.lq  { color: var(--queue); }
.lf  { color: var(--fanout); }
.lml { color: var(--ml); }
.ln  { color: var(--notify); }

/* ── CONTROLS ── */
.controls { display: flex; gap: 7px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
.btn {
  font-family: var(--disp); font-size: 12px; font-weight: 700;
  padding: 8px 15px; border-radius: 8px; border: 1px solid var(--bdr);
  background: var(--s1); color: var(--text2); cursor: pointer; transition: all .15s;
}
.btn:hover { background: var(--s2); border-color: var(--bdr2); color: var(--text); }
.btn.active { background: #050f28; border-color: var(--client); color: var(--client); }
.btn.blue   { border-color: #0a2040; color: var(--client); }
.btn.blue:hover   { background: #040e20; }
.btn.green  { border-color: #0a2e1a; color: var(--api); }
.btn.green:hover  { background: #031009; }
.btn.amber  { border-color: #302800; color: var(--gw); }
.btn.amber:hover  { background: #100e02; }
.btn.red    { border-color: #30050a; color: var(--queue); }
.btn.red:hover    { background: #100204; }
.btn.purple { border-color: #200830; color: var(--fanout); }
.btn.purple:hover { background: #0c0218; }
.speed-row { display: flex; align-items: center; gap: 8px; justify-content: center; font-family: var(--mono); font-size: 11px; color: var(--text3); }
input[type=range] { width: 80px; accent-color: var(--client); }
</style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="hdr">
    <div>
      <h1>💬 Facebook Comment System</h1>
      <div class="sub">// post comment · real-time delivery · fanout · notification · media · moderation</div>
    </div>
  </div>

  <!-- STATS -->
  <div class="stats">
    <div class="sp"><div class="dot" style="background:var(--client)"></div>Comments <b id="st-comments">0</b></div>
    <div class="sp"><div class="dot" style="background:var(--ws)"></div>WS Live <b id="st-ws" style="color:var(--ws)">4</b></div>
    <div class="sp"><div class="dot" style="background:var(--cache)"></div>Cache Hit <b id="st-chit" style="color:var(--cache)">0%</b></div>
    <div class="sp"><div class="dot" style="background:var(--fanout)"></div>Notifications <b id="st-notifs" style="color:var(--fanout)">0</b></div>
    <div class="sp"><div class="dot" style="background:var(--queue)"></div>Queue Depth <b id="st-qd" style="color:var(--queue)">0</b></div>
    <div class="sp"><div class="dot" style="background:var(--ml)"></div>Moderated <b id="st-mod" style="color:var(--ml)">0</b></div>
    <div class="sp">Avg Latency <b id="st-lat">—</b></div>
  </div>

  <!-- ARCH STAGE -->
  <div class="arch-stage" id="arch-stage">
    <svg id="arch-svg" viewBox="0 0 1200 680" preserveAspectRatio="none"></svg>

    <!-- Layer Zones -->
    <div class="lz" style="top:0;height:72px;">
      <div class="lz-lbl" style="color:var(--client)">CLIENT LAYER</div>
    </div>
    <div class="lz" style="top:72px;height:58px;">
      <div class="lz-lbl" style="color:var(--gw)">API GATEWAY · CDN</div>
    </div>
    <div class="lz" style="top:130px;height:90px;">
      <div class="lz-lbl" style="color:var(--api)">APPLICATION LAYER</div>
    </div>
    <div class="lz" style="top:220px;height:90px;">
      <div class="lz-lbl" style="color:var(--cache)">CACHE + SEARCH</div>
    </div>
    <div class="lz" style="top:310px;height:90px;">
      <div class="lz-lbl" style="color:var(--db-write)">DATABASE LAYER</div>
    </div>
    <div class="lz" style="top:400px;height:80px;">
      <div class="lz-lbl" style="color:var(--queue)">MESSAGE QUEUE</div>
    </div>
    <div class="lz" style="top:480px;height:100px;">
      <div class="lz-lbl" style="color:var(--fanout)">FANOUT · WORKERS</div>
    </div>
    <div class="lz" style="top:580px;height:100px;border-bottom:none;">
      <div class="lz-lbl" style="color:var(--notify)">DELIVERY LAYER</div>
    </div>

    <!-- ═══ CLIENTS ═══ -->
    <div class="node" id="n-u0" style="left:30px;top:10px;" onclick="postComment('text')" title="Post text comment">
      <div class="nbox" style="background:#030812;border-color:var(--client);color:var(--client);">
        <div class="ni">👤</div><div class="nn">User Alice</div><div class="nt">POST comment</div>
        <div class="nb" id="b-u0" style="background:#030810;color:var(--client)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-u1" style="left:165px;top:10px;" onclick="postComment('media')" title="Post with media">
      <div class="nbox" style="background:#030812;border-color:var(--client);color:var(--client);">
        <div class="ni">👤</div><div class="nn">User Bob</div><div class="nt">POST + image</div>
        <div class="nb" id="b-u1" style="background:#030810;color:var(--client)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-u2" style="left:300px;top:10px;" onclick="postComment('reply')" title="Reply to comment">
      <div class="nbox" style="background:#030812;border-color:var(--client);color:var(--client);">
        <div class="ni">👤</div><div class="nn">User Carol</div><div class="nt">REPLY nested</div>
        <div class="nb" id="b-u2" style="background:#030810;color:var(--client)">IDLE</div>
      </div>
    </div>
    <div class="node" id="n-u3" style="left:435px;top:10px;" onclick="likeComment()" title="Like comment">
      <div class="nbox" style="background:#030812;border-color:var(--client);color:var(--client);">
        <div class="ni">👤</div><div class="nn">User Dave</div><div class="nt">LIKE reaction</div>
        <div class="nb" id="b-u3" style="background:#030810;color:var(--client)">IDLE</div>
      </div>
    </div>
    <!-- WebSocket viewers -->
    <div class="node" id="n-v0" style="left:600px;top:10px;" title="WebSocket viewer">
      <div class="nbox" style="background:#020c10;border-color:var(--ws);color:var(--ws);">
        <div class="ni">👁️</div><div class="nn">Viewer A</div><div class="nt">WS connected</div>
        <div class="nb" id="b-v0" style="background:#020b0e;color:var(--ws)">ONLINE</div>
      </div>
    </div>
    <div class="node" id="n-v1" style="left:730px;top:10px;" title="WebSocket viewer">
      <div class="nbox" style="background:#020c10;border-color:var(--ws);color:var(--ws);">
        <div class="ni">👁️</div><div class="nn">Viewer B</div><div class="nt">WS connected</div>
        <div class="nb" id="b-v1" style="background:#020b0e;color:var(--ws)">ONLINE</div>
      </div>
    </div>
    <div class="node" id="n-v2" style="left:860px;top:10px;" title="Mobile viewer">
      <div class="nbox" style="background:#020c10;border-color:var(--ws);color:var(--ws);">
        <div class="ni">📱</div><div class="nn">Mobile</div><div class="nt">polling / WS</div>
        <div class="nb" id="b-v2" style="background:#020b0e;color:var(--ws)">ONLINE</div>
      </div>
    </div>

    <!-- ═══ GATEWAY + CDN ═══ -->
    <div class="node" id="n-gw" style="left:200px;top:80px;" title="API Gateway">
      <div class="nbox" style="background:#100d00;border-color:var(--gw);color:var(--gw);min-width:108px;">
        <div class="ni">🔀</div><div class="nn">API Gateway</div><div class="nt">auth · rate · route</div>
        <div class="nb" id="b-gw" style="background:#0a0800;color:var(--gw)">—</div>
      </div>
    </div>
    <div class="node" id="n-cdn" style="left:960px;top:78px;" title="CDN for media">
      <div class="nbox" style="background:#0a0314;border-color:var(--cdn);color:var(--cdn);">
        <div class="ni">🌍</div><div class="nn">CDN</div><div class="nt">media / assets</div>
        <div class="nb" id="b-cdn" style="background:#060210;color:var(--cdn)">—</div>
      </div>
    </div>
    <div class="node" id="n-ws-svc" style="left:680px;top:80px;" title="WebSocket Service">
      <div class="nbox" style="background:#020c10;border-color:var(--ws);color:var(--ws);min-width:108px;">
        <div class="ni">⚡</div><div class="nn">WS Service</div><div class="nt">Socket.io · pub/sub</div>
        <div class="nb" id="b-ws-svc" style="background:#010a0e;color:var(--ws)">—</div>
      </div>
    </div>

    <!-- ═══ APPLICATION LAYER ═══ -->
    <div class="node" id="n-cs" style="left:100px;top:140px;" title="Comment Service">
      <div class="nbox" style="background:#031009;border-color:var(--api);color:var(--api);">
        <div class="ni">💬</div><div class="nn">Comment Svc</div><div class="nt">CRUD · validate</div>
        <div class="nb" id="b-cs" style="background:#020a05;color:var(--api)">—</div>
      </div>
    </div>
    <div class="node" id="n-ms" style="left:280px;top:140px;" title="Media Service">
      <div class="nbox" style="background:#0c0314;border-color:var(--media);color:var(--media);">
        <div class="ni">🖼️</div><div class="nn">Media Svc</div><div class="nt">upload · compress</div>
        <div class="nb" id="b-ms" style="background:#080210;color:var(--media)">—</div>
      </div>
    </div>
    <div class="node" id="n-ns" style="left:460px;top:140px;" title="Notification Service">
      <div class="nbox" style="background:#060c02;border-color:var(--notify);color:var(--notify);">
        <div class="ni">🔔</div><div class="nn">Notif Svc</div><div class="nt">fan-out · targeting</div>
        <div class="nb" id="b-ns" style="background:#040a02;color:var(--notify)">—</div>
      </div>
    </div>
    <div class="node" id="n-ml" style="left:640px;top:140px;" title="ML Moderation">
      <div class="nbox" style="background:#0c0500;border-color:var(--ml);color:var(--ml);">
        <div class="ni">🤖</div><div class="nn">ML Moderation</div><div class="nt">spam · toxicity</div>
        <div class="nb" id="b-ml" style="background:#080400;color:var(--ml)">—</div>
      </div>
    </div>
    <div class="node" id="n-ss" style="left:820px;top:140px;" title="Search Service">
      <div class="nbox" style="background:#020c14;border-color:var(--search);color:var(--search);">
        <div class="ni">🔍</div><div class="nn">Search Svc</div><div class="nt">Elasticsearch</div>
        <div class="nb" id="b-ss" style="background:#010a10;color:var(--search)">—</div>
      </div>
    </div>

    <!-- ═══ CACHE LAYER ═══ -->
    <div class="node" id="n-rc" style="left:180px;top:232px;" title="Redis Comment Cache">
      <div class="nbox" style="background:#100500;border-color:var(--cache);color:var(--cache);min-width:108px;">
        <div class="ni">⚡</div><div class="nn">Redis Cache</div><div class="nt">comments · counts</div>
        <div class="nb" id="b-rc" style="background:#0c0400;color:var(--cache)">—</div>
      </div>
    </div>
    <div class="node" id="n-rctr" style="left:400px;top:232px;" title="Redis Counters">
      <div class="nbox" style="background:#100500;border-color:var(--cache);color:var(--cache);">
        <div class="ni">🔢</div><div class="nn">Counters</div><div class="nt">likes · reactions</div>
        <div class="nb" id="b-rctr" style="background:#0c0400;color:var(--cache)">—</div>
      </div>
    </div>
    <div class="node" id="n-es" style="left:680px;top:232px;" title="Elasticsearch">
      <div class="nbox" style="background:#020c14;border-color:var(--search);color:var(--search);min-width:108px;">
        <div class="ni">🔍</div><div class="nn">Elasticsearch</div><div class="nt">full-text index</div>
        <div class="nb" id="b-es" style="background:#010a10;color:var(--search)">—</div>
      </div>
    </div>
    <div class="node" id="n-s3" style="left:900px;top:232px;" title="Object Storage">
      <div class="nbox" style="background:#0a0314;border-color:var(--cdn);color:var(--cdn);">
        <div class="ni">🪣</div><div class="nn">S3 / Blob</div><div class="nt">media storage</div>
        <div class="nb" id="b-s3" style="background:#060210;color:var(--cdn)">—</div>
      </div>
    </div>

    <!-- ═══ DATABASE ═══ -->
    <div class="node" id="n-dbp" style="left:120px;top:322px;" title="Primary DB">
      <div class="nbox" style="background:#030714;border-color:var(--db-write);color:var(--db-write);">
        <div class="ni">🗄️</div><div class="nn">Primary DB</div><div class="nt">MySQL · writes</div>
        <div class="nb" id="b-dbp" style="background:#020510;color:var(--db-write)">—</div>
      </div>
    </div>
    <div class="node" id="n-dbr0" style="left:320px;top:322px;" title="Read Replica 1">
      <div class="nbox" style="background:#020614;border-color:var(--db-read);color:var(--db-read);">
        <div class="ni">📖</div><div class="nn">Replica 1</div><div class="nt">reads · EU</div>
        <div class="nb" id="b-dbr0" style="background:#020412;color:var(--db-read)">—</div>
      </div>
    </div>
    <div class="node" id="n-dbr1" style="left:500px;top:322px;" title="Read Replica 2">
      <div class="nbox" style="background:#020614;border-color:var(--db-read);color:var(--db-read);">
        <div class="ni">📖</div><div class="nn">Replica 2</div><div class="nt">reads · APAC</div>
        <div class="nb" id="b-dbr1" style="background:#020412;color:var(--db-read)">—</div>
      </div>
    </div>
    <div class="node" id="n-ts" style="left:700px;top:322px;" title="Time-Series DB">
      <div class="nbox" style="background:#0a0500;border-color:var(--analytics);color:var(--analytics);">
        <div class="ni">📈</div><div class="nn">TimeSeries</div><div class="nt">InfluxDB · metrics</div>
        <div class="nb" id="b-ts" style="background:#080400;color:var(--analytics)">—</div>
      </div>
    </div>

    <!-- ═══ QUEUE ═══ -->
    <div class="node" id="n-kafka" style="left:400px;top:412px;" title="Kafka">
      <div class="nbox" style="background:#100206;border-color:var(--queue);color:var(--queue);min-width:116px;">
        <div class="ni">📬</div><div class="nn">Kafka</div><div class="nt">comment.created · liked</div>
        <div class="nb" id="b-kafka" style="background:#0c0204;color:var(--queue)">—</div>
      </div>
    </div>

    <!-- ═══ FANOUT + WORKERS ═══ -->
    <div class="node" id="n-fo" style="left:120px;top:492px;" title="Fanout Service">
      <div class="nbox" style="background:#0c0218;border-color:var(--fanout);color:var(--fanout);">
        <div class="ni">📡</div><div class="nn">Fanout Svc</div><div class="nt">broadcast · friends</div>
        <div class="nb" id="b-fo" style="background:#080214;color:var(--fanout)">—</div>
      </div>
    </div>
    <div class="node" id="n-an" style="left:320px;top:492px;" title="Analytics Worker">
      <div class="nbox" style="background:#0a0500;border-color:var(--analytics);color:var(--analytics);">
        <div class="ni">📊</div><div class="nn">Analytics</div><div class="nt">engagement · trends</div>
        <div class="nb" id="b-an" style="background:#080400;color:var(--analytics)">—</div>
      </div>
    </div>
    <div class="node" id="n-idx" style="left:520px;top:492px;" title="Search Indexer">
      <div class="nbox" style="background:#020c14;border-color:var(--search);color:var(--search);">
        <div class="ni">🗂️</div><div class="nn">Indexer</div><div class="nt">ES index · update</div>
        <div class="nb" id="b-idx" style="background:#010a10;color:var(--search)">—</div>
      </div>
    </div>
    <div class="node" id="n-ml2" style="left:720px;top:492px;" title="Async Moderation">
      <div class="nbox" style="background:#0c0500;border-color:var(--ml);color:var(--ml);">
        <div class="ni">🛡️</div><div class="nn">Async Mod</div><div class="nt">deep scan · report</div>
        <div class="nb" id="b-ml2" style="background:#080400;color:var(--ml)">—</div>
      </div>
    </div>

    <!-- ═══ DELIVERY LAYER ═══ -->
    <div class="node" id="n-push" style="left:100px;top:592px;" title="Push Notifications">
      <div class="nbox" style="background:#060c02;border-color:var(--notify);color:var(--notify);">
        <div class="ni">🔔</div><div class="nn">Push</div><div class="nt">FCM · APNs</div>
        <div class="nb" id="b-push" style="background:#040a02;color:var(--notify)">—</div>
      </div>
    </div>
    <div class="node" id="n-email" style="left:280px;top:592px;" title="Email Service">
      <div class="nbox" style="background:#060c02;border-color:var(--notify);color:var(--notify);">
        <div class="ni">📧</div><div class="nn">Email</div><div class="nt">digest · alerts</div>
        <div class="nb" id="b-email" style="background:#040a02;color:var(--notify)">—</div>
      </div>
    </div>
    <div class="node" id="n-wsd" style="left:460px;top:592px;" title="WS Delivery">
      <div class="nbox" style="background:#020c10;border-color:var(--ws);color:var(--ws);">
        <div class="ni">⚡</div><div class="nn">WS Delivery</div><div class="nt">real-time push</div>
        <div class="nb" id="b-wsd" style="background:#010a0e;color:var(--ws)">—</div>
      </div>
    </div>
    <div class="node" id="n-inbox" style="left:700px;top:592px;" title="Notification Inbox">
      <div class="nbox" style="background:#0c0210;border-color:var(--fanout);color:var(--fanout);">
        <div class="ni">🗂️</div><div class="nn">Inbox Store</div><div class="nt">read/unread state</div>
        <div class="nb" id="b-inbox" style="background:#080210;color:var(--fanout)">—</div>
      </div>
    </div>

    <!-- Packet overlay -->
    <div id="pkts" style="position:absolute;inset:0;pointer-events:none;z-index:20;overflow:hidden;"></div>
  </div>

  <!-- BOTTOM PANELS -->
  <div class="panels">

    <!-- Comment Feed -->
    <div class="panel">
      <div class="ph"><span>💬 Comment Feed</span><span id="cf-count" style="font-size:8px;color:var(--text3);">0 comments</span></div>
      <div class="pb" style="padding:5px 7px;">
        <div class="comment-feed" id="comment-feed">
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;padding:12px;">no comments yet…</div>
        </div>
      </div>
    </div>

    <!-- Pipeline -->
    <div class="panel">
      <div class="ph"><span>⚙️ Flow</span><span id="pipe-res" style="font-size:9px;font-weight:700;"></span></div>
      <div class="pipe-steps" id="pipe-steps">
        <div class="pst" id="ps-0"><span class="pst-icon">🌐</span><span class="pst-name">POST /comments</span><span class="pst-val" id="pv-0">—</span></div>
        <div class="pst" id="ps-1"><span class="pst-icon">🤖</span><span class="pst-name">ML Moderation</span><span class="pst-val" id="pv-1">—</span></div>
        <div class="pst" id="ps-2"><span class="pst-icon">🗄️</span><span class="pst-name">Write to DB</span><span class="pst-val" id="pv-2">—</span></div>
        <div class="pst" id="ps-3"><span class="pst-icon">⚡</span><span class="pst-name">Cache Invalidate</span><span class="pst-val" id="pv-3">—</span></div>
        <div class="pst" id="ps-4"><span class="pst-icon">📬</span><span class="pst-name">Kafka Publish</span><span class="pst-val" id="pv-4">—</span></div>
        <div class="pst" id="ps-5"><span class="pst-icon">⚡</span><span class="pst-name">WS Broadcast</span><span class="pst-val" id="pv-5">—</span></div>
        <div class="pst" id="ps-6"><span class="pst-icon">📡</span><span class="pst-name">Fan-out Notify</span><span class="pst-val" id="pv-6">—</span></div>
      </div>
    </div>

    <!-- WebSocket Connections -->
    <div class="panel">
      <div class="ph"><span>⚡ WebSocket Clients</span><span style="color:var(--ws);font-size:9px;font-weight:700;" id="ws-live">4 online</span></div>
      <div class="pb">
        <div class="ws-list" id="ws-list">
          <div class="ws-row active" id="wsr-0"><span class="ws-icon">👁️</span><span class="ws-user">Viewer A</span><span class="ws-msgs" id="wsm-0">0 msgs</span><span class="ws-ping ok">●12ms</span></div>
          <div class="ws-row active" id="wsr-1"><span class="ws-icon">👁️</span><span class="ws-user">Viewer B</span><span class="ws-msgs" id="wsm-1">0 msgs</span><span class="ws-ping ok">●18ms</span></div>
          <div class="ws-row active" id="wsr-2"><span class="ws-icon">📱</span><span class="ws-user">Mobile</span><span class="ws-msgs" id="wsm-2">0 msgs</span><span class="ws-ping ok">●34ms</span></div>
          <div class="ws-row active" id="wsr-3"><span class="ws-icon">👤</span><span class="ws-user">Post Owner</span><span class="ws-msgs" id="wsm-3">0 msgs</span><span class="ws-ping ok">●9ms</span></div>
        </div>
      </div>
    </div>

    <!-- Cache State -->
    <div class="panel">
      <div class="ph"><span>⚡ Redis State</span><span id="cache-hit" style="color:var(--cache);font-size:8px;font-weight:700;">0% hit</span></div>
      <div class="pb">
        <div class="cache-grid" id="cache-grid">
          <!-- populated by JS -->
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:8px;">
          <div style="flex:1;height:4px;background:var(--bdr);border-radius:2px;overflow:hidden;">
            <div id="cache-bar" style="height:100%;background:var(--cache);border-radius:2px;width:0%;transition:width .4s;"></div>
          </div>
          <span style="font-family:var(--mono);font-size:8px;color:var(--text3);">hit rate</span>
        </div>
      </div>
    </div>

    <!-- Fan-out Status -->
    <div class="panel">
      <div class="ph"><span>📡 Fan-out</span><span id="fo-total" style="color:var(--fanout);font-size:8px;font-weight:700;">0 sent</span></div>
      <div class="pb">
        <div class="fanout-list" id="fanout-list">
          <div class="fo-row" id="fo-ws"><span class="fo-icon">⚡</span><span class="fo-label">WebSocket</span><span class="fo-count" id="foc-ws">0</span></div>
          <div class="fo-row" id="fo-push"><span class="fo-icon">🔔</span><span class="fo-label">Push (FCM/APNs)</span><span class="fo-count" id="foc-push">0</span></div>
          <div class="fo-row" id="fo-email"><span class="fo-icon">📧</span><span class="fo-label">Email digest</span><span class="fo-count" id="foc-email">0</span></div>
          <div class="fo-row" id="fo-inbox"><span class="fo-icon">🗂️</span><span class="fo-label">Inbox store</span><span class="fo-count" id="foc-inbox">0</span></div>
        </div>
      </div>
    </div>

  </div>

  <!-- LOG -->
  <div class="log-wrap">
    <div class="log-hdr"><span>System Log</span><span style="color:var(--text3)">Facebook scale · billions of comments</span></div>
    <div class="log-body" id="log"></div>
  </div>

  <!-- CONTROLS -->
  <div class="controls">
    <button class="btn blue"   onclick="postComment('text')">💬 Post Comment</button>
    <button class="btn blue"   onclick="postComment('media')">🖼️ Comment + Image</button>
    <button class="btn blue"   onclick="postComment('reply')">↩️ Nested Reply</button>
    <button class="btn green"  onclick="likeComment()">❤️ Like Reaction</button>
    <button class="btn amber"  onclick="readComments()">📖 Read Comments</button>
    <button class="btn red"    onclick="postComment('spam')">🚫 Spam Attempt</button>
    <button class="btn purple" onclick="burst()">💥 Comment Burst</button>
    <button class="btn active" id="auto-btn" onclick="toggleAuto()">▶ Auto Demo</button>
    <button class="btn"        onclick="resetAll()" style="color:var(--text3)">↺ Reset</button>
  </div>
  <div class="speed-row" style="margin-top:10px;">
    Speed <input type="range" min="0.3" max="3" step="0.1" value="1" oninput="spd=parseFloat(this.value)">
  </div>

</div>

<script>
/* ══ STATE ══ */
let spd = 1, autoTimer = null;
let totalComments = 0, totalNotifs = 0, cacheHits = 0, cacheTotal = 0, totalMod = 0, queueDepth = 0;
let latencies = [];
let wsMsgCounts = [0,0,0,0];
let foWs=0, foPush=0, foEmail=0, foInbox=0;
let pipeTimers = [];
let cfCount = 0;

/* Cache store */
const cacheState = {};
const CACHE_KEYS = ['post:1234:comments','comment:5678:replies','user:42:count','post:1234:top','comment:9999:likes','post:1234:page2'];

const USERS = ['Alice','Bob','Carol','Dave'];
const COMMENTS_TEXTS = [
  'Great post! 🔥','Totally agree with this!','Can you explain more?','This changed my perspective 💯',
  'Sharing this with my friends!','First! 🎉','Interesting take...','Facts only 👏',
  'Love this content','Came here from Instagram'
];

function d(ms) { return ms / spd; }

/* ══ LOGGING ══ */
function addLog(cls, msg) {
  const ts = new Date().toLocaleTimeString('en-GB', {hour12:false});
  const el = document.createElement('div');
  el.className = 'le';
  el.innerHTML = `<span style="color:var(--text3)">${ts}</span> <span class="${cls}">${msg}</span>`;
  const lb = document.getElementById('log');
  lb.appendChild(el); lb.scrollTop = lb.scrollHeight;
  if (lb.children.length > 80) lb.removeChild(lb.firstChild);
}

/* ══ STATS ══ */
function updateStats() {
  document.getElementById('st-comments').textContent = totalComments;
  document.getElementById('st-notifs').textContent   = totalNotifs;
  document.getElementById('st-qd').textContent       = queueDepth;
  document.getElementById('st-mod').textContent      = totalMod;
  const hitRate = cacheTotal ? Math.round(cacheHits/cacheTotal*100) : 0;
  document.getElementById('st-chit').textContent = hitRate + '%';
  document.getElementById('st-chit').style.color = hitRate > 60 ? 'var(--api)' : hitRate > 30 ? 'var(--cache)' : 'var(--queue)';
  document.getElementById('cache-hit').textContent = hitRate + '% hit';
  document.getElementById('cache-bar').style.width = hitRate + '%';
  const avg = latencies.length ? Math.round(latencies.reduce((a,b)=>a+b)/latencies.length) : 0;
  document.getElementById('st-lat').textContent = avg ? avg + 'ms' : '—';
  document.getElementById('fo-total').textContent = (foWs+foPush+foEmail+foInbox) + ' sent';
  document.getElementById('foc-ws').textContent   = foWs;
  document.getElementById('foc-push').textContent = foPush;
  document.getElementById('foc-email').textContent= foEmail;
  document.getElementById('foc-inbox').textContent= foInbox;
}

/* ══ NODE GLOW ══ */
function glow(id, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  const inner = el.querySelector('.nbox');
  if (!inner) return;
  inner.classList.remove('gb','gg','ga','gr','gc');
  void inner.offsetWidth;
  inner.classList.add(cls);
  setTimeout(() => inner.classList.remove('gb','gg','ga','gr','gc'), 700);
}

function setBadge(id, text, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text; el.style.color = color || '';
}

/* ══ PIPELINE ══ */
function clearPipe() {
  pipeTimers.forEach(t => clearTimeout(t)); pipeTimers = [];
  for (let i = 0; i <= 6; i++) {
    const el = document.getElementById('ps-'+i);
    if (el) el.className = 'pst';
    const pv = document.getElementById('pv-'+i);
    if (pv) pv.textContent = '—';
  }
  document.getElementById('pipe-res').textContent = '';
}

function litPipe(i, cls, val, delay) {
  const t = setTimeout(() => {
    const el = document.getElementById('ps-'+i);
    if (el) el.className = 'pst ' + cls;
    const pv = document.getElementById('pv-'+i);
    if (pv) pv.textContent = val || '—';
  }, d(delay));
  pipeTimers.push(t);
}

/* ══ PACKET ══ */
function flyPkt(fromId, toId, opts, onDone) {
  const stage = document.getElementById('arch-stage');
  const fromEl = document.getElementById(fromId);
  const toEl   = document.getElementById(toId);
  if (!fromEl || !toEl) { if (onDone) onDone(); return; }
  const sr = stage.getBoundingClientRect();
  const fr = fromEl.getBoundingClientRect();
  const tr = toEl.getBoundingClientRect();
  const fx = fr.left - sr.left + fr.width/2;
  const fy = fr.top  - sr.top  + fr.height/2;
  const tx = tr.left - sr.left + tr.width/2;
  const ty = tr.top  - sr.top  + tr.height/2;

  const pkt = document.createElement('div');
  pkt.className = 'pkt';
  const w = opts.w || 80;
  pkt.style.cssText = `background:${opts.bg};border-color:${opts.border};color:${opts.color};width:${w}px;height:22px;left:${fx-w/2}px;top:${fy-11}px;`;
  pkt.innerHTML = opts.label;
  document.getElementById('pkts').appendChild(pkt);
  const dist = Math.hypot(tx-fx, ty-fy);
  const dur = Math.max(180, dist/(200*spd)*1000);
  pkt.animate([
    { left:(fx-w/2)+'px', top:(fy-11)+'px', opacity:1 },
    { left:(tx-w/2)+'px', top:(ty-11)+'px', opacity:1 },
  ],{ duration:dur, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards' })
  .finished.then(() => { pkt.remove(); if (onDone) onDone(); });
}

/* ══ COMMENT FEED ══ */
function addCommentFeed(user, text, type, isSpam) {
  cfCount++;
  const feed = document.getElementById('comment-feed');
  const empty = feed.querySelector('[style*="no comments"]');
  if (empty) empty.remove();

  const row = document.createElement('div');
  row.className = 'cf-row';
  const typeColors = { text:'var(--client)', media:'var(--cdn)', reply:'var(--ws)', like:'var(--cache)', spam:'var(--queue)' };
  const typeLabels = { text:'TEXT', media:'MEDIA', reply:'REPLY', like:'LIKE', spam:'SPAM' };
  const colors = ['#1877f2','#e91e63','#9c27b0','#f57c00'];
  const uIdx = USERS.indexOf(user);
  const avatarBg = ['#0a1838','#380a1a','#0a1a38','#1a1008'][uIdx % 4];

  row.innerHTML = `
    <div class="cf-top">
      <div class="cf-avatar" style="background:${avatarBg};color:${typeColors[type]}">${user[0]}</div>
      <div class="cf-user">${user}</div>
      <div class="cf-type" style="background:${isSpam?'#300210':'#031009'};color:${isSpam?'var(--queue)':typeColors[type]}">${isSpam?'🚫BLOCKED':typeLabels[type]}</div>
    </div>
    <div class="cf-text">${isSpam?'[SPAM BLOCKED by ML]':text}</div>
    <div class="cf-meta"><span>just now</span><span>post #1234</span><span>${type==='reply'?'↩️ reply':type==='like'?'❤️ reaction':'💬 comment'}</span></div>
  `;
  feed.insertBefore(row, feed.firstChild);
  if (feed.children.length > 15) feed.removeChild(feed.lastChild);
  document.getElementById('cf-count').textContent = cfCount + ' comments';
}

/* ══ CACHE RENDER ══ */
function renderCache() {
  const grid = document.getElementById('cache-grid');
  grid.innerHTML = '';
  CACHE_KEYS.forEach(k => {
    const entry = cacheState[k];
    const div = document.createElement('div');
    div.className = 'cs ' + (entry ? 'hot' : '');
    div.innerHTML = `
      <div class="cs-key">${k}</div>
      <div class="cs-val" style="color:${entry?'var(--cache)':'var(--text3)'}">
        ${entry ? entry.val : 'empty'}
        <span class="cs-ttl">${entry ? 'TTL:'+entry.ttl : ''}</span>
      </div>`;
    grid.appendChild(div);
  });
}

/* ══ WEBSOCKET DELIVERY ══ */
function deliverWS(commentId) {
  [0,1,2,3].forEach((i, idx) => {
    setTimeout(() => {
      wsMsgCounts[i]++;
      document.getElementById('wsm-'+i).textContent = wsMsgCounts[i] + ' msgs';
      document.getElementById('wsr-'+i).classList.add('active');
      foWs++;
      // Animate: WS service → viewers
      const viewers = ['n-v0','n-v1','n-v2'];
      if (i < 3) {
        flyPkt('n-ws-svc', viewers[i], {
          bg:'#020c10', border:'var(--ws)', color:'var(--ws)',
          label:`⚡ ${commentId}`, w:80
        }, () => glow(viewers[i],'gc'));
      }
      updateStats();
    }, d(idx * 180 + 200));
  });
}

/* ══ MAIN FLOW: POST COMMENT ══ */
function postComment(type) {
  const userIdx = (totalComments) % 4;
  const user = USERS[userIdx];
  const clientId = 'n-u' + userIdx;
  const clientBadge = 'b-u' + userIdx;
  const commentText = COMMENTS_TEXTS[totalComments % COMMENTS_TEXTS.length];
  const commentId = 'cmt_' + (100 + totalComments);
  const isSpam = type === 'spam';
  const lat = isSpam ? 120 : type === 'media' ? 380 : type === 'reply' ? 200 : 160;
  if (!isSpam) totalComments++;
  latencies.push(lat); if (latencies.length > 30) latencies.shift();

  clearPipe();
  setBadge(clientBadge, 'POSTING', 'var(--client)');
  glow(clientId, 'gb');
  addLog('lc', `[${user}] ${type === 'media' ? 'POST comment + image' : type === 'reply' ? 'REPLY to comment' : type === 'spam' ? 'POST [suspicious]' : 'POST comment'} on post #1234`);

  /* Step 0: Client → Gateway */
  litPipe(0, 'lit', user, 0);
  flyPkt(clientId, 'n-gw', {
    bg:'#100d00', border:'var(--gw)', color:'var(--gw)',
    label:`💬 POST ${type}`, w:90
  }, () => {
    glow('n-gw', 'ga');
    setBadge('b-gw', 'ROUTING', 'var(--gw)');
    litPipe(0, 'ok', 'auth ok', 0);
    addLog('lgw', `[Gateway] Auth validated · rate limit OK · route → Comment Service`);

    /* Media upload if needed */
    if (type === 'media') {
      flyPkt('n-gw', 'n-ms', {
        bg:'#0c0314', border:'var(--media)', color:'var(--media)',
        label:'🖼️ upload', w:78
      }, () => {
        glow('n-ms', 'gb');
        setBadge('b-ms', 'COMPRESS', 'var(--media)');
        addLog('la', `[Media] Image received → compress → S3`);
        flyPkt('n-ms', 'n-s3', {
          bg:'#0a0314', border:'var(--cdn)', color:'var(--cdn)',
          label:'🪣 store', w:70
        }, () => {
          glow('n-s3', 'gb');
          setBadge('b-s3', 'STORED', 'var(--cdn)');
          setBadge('b-ms', 'DONE', 'var(--api)');
          addLog('la', `[S3] Media stored → CDN distribution started`);
        });
      });
    }

    /* Gateway → Comment Service */
    flyPkt('n-gw', 'n-cs', {
      bg:'#031009', border:'var(--api)', color:'var(--api)',
      label:'→ CommentSvc', w:96
    }, () => {
      glow('n-cs', 'gg');
      setBadge('b-cs', 'PROCESSING', 'var(--api)');

      /* Step 1: ML Moderation (sync) */
      litPipe(1, 'lit', 'checking…', 0);
      setBadge('b-ml', 'SCORING', 'var(--ml)');
      flyPkt('n-cs', 'n-ml', {
        bg:'#0c0500', border:'var(--ml)', color:'var(--ml)',
        label:'🤖 moderate', w:90
      }, () => {
        glow('n-ml', 'ga');
        const mlScore = isSpam ? 0.92 : (Math.random() * 0.3).toFixed(2);
        const blocked = parseFloat(mlScore) > 0.8;

        if (blocked) {
          totalMod++;
          setBadge('b-ml', 'BLOCKED', 'var(--queue)');
          litPipe(1, 'err', 'SPAM 🚫', 0);
          document.getElementById('pipe-res').textContent = '🚫 SPAM';
          document.getElementById('pipe-res').style.color = 'var(--queue)';
          addLog('lml', `[ML] 🚫 SPAM DETECTED score:${mlScore} — comment blocked`);
          addCommentFeed(user, commentText, type, true);
          flyPkt('n-ml', clientId, {
            bg:'#100204', border:'var(--queue)', color:'var(--queue)',
            label:'✗ 400 SPAM', w:86
          }, () => {
            setBadge(clientBadge, 'BLOCKED', 'var(--queue)');
            glow(clientId, 'gr');
            setTimeout(() => { setBadge(clientBadge, 'IDLE', ''); setBadge('b-ml', '—', ''); setBadge('b-gw', '—', ''); setBadge('b-cs', '—', ''); }, d(800));
            updateStats();
          });
          return;
        }

        setBadge('b-ml', 'CLEAN', 'var(--api)');
        litPipe(1, 'ok', `ok(${mlScore})`, 0);
        addLog('lml', `[ML] ✓ Clean score:${mlScore} — passed`);

        /* Step 2: Write to DB */
        litPipe(2, 'lit', 'writing…', 0);
        setBadge('b-dbp', 'WRITING', 'var(--db-write)');
        flyPkt('n-cs', 'n-dbp', {
          bg:'#030714', border:'var(--db-write)', color:'var(--db-write)',
          label:'🗄️ INSERT', w:82
        }, () => {
          glow('n-dbp', 'gb');
          litPipe(2, 'ok', commentId, 0);
          setBadge('b-dbp', 'SAVED', 'var(--api)');
          addLog('ldb', `[DB] INSERT comments (id=${commentId}, postId=1234, user=${user})`);

          /* Replication */
          setTimeout(() => {
            flyPkt('n-dbp', 'n-dbr0', { bg:'#020614', border:'var(--db-read)', color:'var(--db-read)', label:'sync', w:54 }, () => { glow('n-dbr0','gb'); setBadge('b-dbr0','SYNCED','var(--api)'); });
            flyPkt('n-dbp', 'n-dbr1', { bg:'#020614', border:'var(--db-read)', color:'var(--db-read)', label:'sync', w:54 }, () => { glow('n-dbr1','gb'); setBadge('b-dbr1','SYNCED','var(--api)'); });
          }, d(200));

          /* Step 3: Cache invalidate */
          litPipe(3, 'lit', 'invalidating…', 0);
          cacheState['post:1234:comments'] = { val: commentId, ttl: '300s' };
          cacheState['user:42:count']      = { val: '+1', ttl: '60s' };
          renderCache();
          setBadge('b-rc', 'WRITE', 'var(--cache)');
          flyPkt('n-cs', 'n-rc', {
            bg:'#100500', border:'var(--cache)', color:'var(--cache)',
            label:'⚡ INVALIDATE', w:98
          }, () => {
            glow('n-rc', 'ga');
            litPipe(3, 'ok', 'updated', 0);
            setBadge('b-rc', 'DONE', 'var(--api)');
            addLog('lca', `[Redis] Cache invalidated post:1234 · updated counters`);
          });

          /* Step 4: Kafka publish */
          litPipe(4, 'lit', 'publishing…', 0);
          queueDepth++;
          setBadge('b-kafka', 'PUBLISH', 'var(--queue)');
          flyPkt('n-cs', 'n-kafka', {
            bg:'#100206', border:'var(--queue)', color:'var(--queue)',
            label:'📬 comment.created', w:120
          }, () => {
            glow('n-kafka', 'gr');
            litPipe(4, 'ok', 'comment.created', 0);
            addLog('lq', `[Kafka] Published comment.created · fanout · analytics · index topics`);
            queueDepth = Math.max(0, queueDepth - 1);

            /* Async workers fan-out */
            setTimeout(() => {
              /* Fanout → WebSocket delivery */
              litPipe(5, 'fan', 'broadcasting…', 0);
              setBadge('b-fo', 'FANNING', 'var(--fanout)');
              flyPkt('n-kafka', 'n-fo', {
                bg:'#0c0218', border:'var(--fanout)', color:'var(--fanout)',
                label:'📡 fanout', w:76
              }, () => {
                glow('n-fo', 'gb');
                setBadge('b-fo', 'DONE', 'var(--api)');
                addLog('lf', `[Fanout] Broadcasting to ${4} connected users via WebSocket`);
                flyPkt('n-fo', 'n-wsd', { bg:'#020c10', border:'var(--ws)', color:'var(--ws)', label:'⚡ WS push', w:82 }, () => {
                  glow('n-wsd', 'gc');
                  litPipe(5, 'ok', '4 clients', 0);
                  setBadge('b-wsd', 'SENT', 'var(--ws)');
                  deliverWS(commentId);
                  totalNotifs += 4; foWs += 4;
                  addLog('lws', `[WS] Real-time push to 4 connected clients`);
                });
              });

              /* Analytics worker */
              flyPkt('n-kafka', 'n-an', { bg:'#0a0500', border:'var(--analytics)', color:'var(--analytics)', label:'📊 analytics', w:90 }, () => {
                glow('n-an', 'ga');
                setBadge('b-an', 'RECORDING', 'var(--analytics)');
                flyPkt('n-an', 'n-ts', { bg:'#0a0500', border:'var(--analytics)', color:'var(--analytics)', label:'→ timeseries', w:94 }, () => {
                  glow('n-ts', 'ga');
                  setBadge('b-ts', 'WRITTEN', 'var(--api)');
                  setBadge('b-an', '—', '');
                  addLog('la', `[Analytics] Comment engagement recorded to TimeSeries DB`);
                });
              });

              /* Search indexer */
              flyPkt('n-kafka', 'n-idx', { bg:'#020c14', border:'var(--search)', color:'var(--search)', label:'🗂️ index', w:76 }, () => {
                glow('n-idx', 'gc');
                setBadge('b-idx', 'INDEXING', 'var(--search)');
                flyPkt('n-idx', 'n-es', { bg:'#020c14', border:'var(--search)', color:'var(--search)', label:'→ ES', w:52 }, () => {
                  glow('n-es', 'gc');
                  setBadge('b-es', 'INDEXED', 'var(--api)');
                  setBadge('b-idx', '—', '');
                  addLog('la', `[Elasticsearch] Comment indexed for full-text search`);
                });
              });

              /* Notification fanout */
              litPipe(6, 'fan', 'notifying…', 0);
              setBadge('b-ns', 'FANNING', 'var(--notify)');
              setTimeout(() => {
                flyPkt('n-kafka', 'n-push', { bg:'#060c02', border:'var(--notify)', color:'var(--notify)', label:'🔔 FCM/APNs', w:90 }, () => {
                  glow('n-push', 'gg'); setBadge('b-push', 'SENT', 'var(--notify)');
                  foPush += 3; totalNotifs += 3; updateStats();
                });
                flyPkt('n-kafka', 'n-inbox', { bg:'#0c0210', border:'var(--fanout)', color:'var(--fanout)', label:'🗂️ inbox', w:76 }, () => {
                  glow('n-inbox', 'gb'); setBadge('b-inbox', 'STORED', 'var(--api)');
                  foInbox += 2; totalNotifs += 2; updateStats();
                });
                litPipe(6, 'ok', 'sent', 0);
                document.getElementById('pipe-res').textContent = '✅ POSTED';
                document.getElementById('pipe-res').style.color = 'var(--api)';
                addLog('ln', `[Notify] Push×3 + inbox×2 delivered`);
              }, d(300));
            }, d(400));

            /* Response to client */
            setTimeout(() => {
              flyPkt('n-cs', clientId, {
                bg:'#031009', border:'var(--api)', color:'var(--api)',
                label:`✓ 201 ${lat}ms`, w:90
              }, () => {
                setBadge(clientBadge, 'DONE', 'var(--api)');
                glow(clientId, 'gg');
                addCommentFeed(user, commentText, type, false);
                addLog('lc', `[${user}] ✅ Comment posted in ${lat}ms — live on post`);
                setTimeout(() => { setBadge(clientBadge, 'IDLE', ''); resetBadges(); }, d(1000));
              });
            }, d(300));
          });
          updateStats();
        });
      });
    });
  });
  updateStats();
}

/* ══ LIKE REACTION ══ */
function likeComment() {
  const user = USERS[(totalComments) % 4];
  const clientId = 'n-u3';
  const clientBadge = 'b-u3';
  setBadge(clientBadge, 'LIKING', 'var(--cache)');
  glow(clientId, 'ga');
  addLog('lc', `[Dave] POST /comments/5678/like → ❤️`);

  flyPkt(clientId, 'n-gw', { bg:'#100d00', border:'var(--gw)', color:'var(--gw)', label:'❤️ LIKE', w:72 }, () => {
    flyPkt('n-gw', 'n-rctr', { bg:'#100500', border:'var(--cache)', color:'var(--cache)', label:'🔢 INCR', w:72 }, () => {
      glow('n-rctr', 'ga');
      setBadge('b-rctr', 'INCR', 'var(--cache)');
      cacheState['comment:9999:likes'] = { val: '142 likes', ttl: '60s' };
      renderCache(); cacheHits++; cacheTotal++;
      addLog('lca', `[Redis] INCR comment:5678:likes → 142`);
      /* Also write to DB async */
      flyPkt('n-rctr', 'n-kafka', { bg:'#100206', border:'var(--queue)', color:'var(--queue)', label:'📬 like.created', w:100 }, () => {
        glow('n-kafka', 'gr');
        addLog('lq', `[Kafka] Published like.created → fanout notifications`);
        flyPkt('n-kafka', 'n-push', { bg:'#060c02', border:'var(--notify)', color:'var(--notify)', label:'🔔 notify', w:76 }, () => {
          glow('n-push', 'gg');
          totalNotifs++; foPush++;
          flyPkt('n-gw', clientId, { bg:'#031009', border:'var(--api)', color:'var(--api)', label:'✓ 200 OK', w:76 }, () => {
            setBadge(clientBadge, 'LIKED', 'var(--cache)');
            glow(clientId, 'gg');
            addCommentFeed(user, '❤️ reacted to a comment', 'like', false);
            setTimeout(() => { setBadge(clientBadge, 'IDLE', ''); setBadge('b-rctr', '—', ''); }, d(800));
            updateStats();
          });
        });
      });
    });
  });
  updateStats();
}

/* ══ READ COMMENTS (cache hit) ══ */
function readComments() {
  const clientId = 'n-v0';
  glow(clientId, 'gc');
  addLog('lc', `[Viewer A] GET /posts/1234/comments?page=1`);

  flyPkt(clientId, 'n-gw', { bg:'#100d00', border:'var(--gw)', color:'var(--gw)', label:'GET /comments', w:96 }, () => {
    flyPkt('n-gw', 'n-rc', { bg:'#100500', border:'var(--cache)', color:'var(--cache)', label:'⚡ GET cache', w:88 }, () => {
      glow('n-rc', 'ga');
      const isHit = !!cacheState['post:1234:comments'];
      cacheTotal++;
      if (isHit) {
        cacheHits++;
        setBadge('b-rc', 'HIT', 'var(--cache)');
        addLog('lca', `[Redis] Cache HIT post:1234:comments → served directly`);
        flyPkt('n-rc', clientId, { bg:'#100500', border:'var(--cache)', color:'var(--cache)', label:`⚡ ${totalComments} comments`, w:110 }, () => {
          glow(clientId, 'gg');
          addLog('lc', `[Viewer A] ✓ ${totalComments} comments delivered from cache`);
          setBadge('b-rc', '—', '');
        });
      } else {
        setBadge('b-rc', 'MISS', 'var(--queue)');
        addLog('lca', `[Redis] Cache MISS → query read replica`);
        flyPkt('n-rc', 'n-dbr0', { bg:'#020614', border:'var(--db-read)', color:'var(--db-read)', label:'SELECT', w:68 }, () => {
          glow('n-dbr0', 'gb');
          cacheState['post:1234:comments'] = { val: totalComments + ' comments', ttl: '300s' };
          renderCache();
          flyPkt('n-dbr0', clientId, { bg:'#031009', border:'var(--api)', color:'var(--api)', label:'✓ comments', w:88 }, () => {
            glow(clientId, 'gg');
            addLog('ldb', `[DB Replica] SELECT 20 comments → cached for next request`);
            setBadge('b-dbr0', '—', '');
          });
        });
      }
      updateStats();
    });
  });
}

/* ══ RESET BADGES ══ */
function resetBadges() {
  const ids = ['b-gw','b-cs','b-ms','b-ns','b-ml','b-ss','b-rc','b-rctr','b-es','b-s3','b-dbp','b-dbr0','b-dbr1','b-ts','b-kafka','b-fo','b-an','b-idx','b-ml2','b-push','b-email','b-wsd','b-inbox','b-cdn','b-ws-svc'];
  ids.forEach(id => { setBadge(id, '—', ''); });
}

/* ══ BURST ══ */
function burst() {
  addLog('lc', '[Burst] 8 rapid comments from multiple users…');
  let i = 0;
  const types = ['text','reply','text','media','text','reply','text','text'];
  const iv = setInterval(() => {
    if (i >= types.length) { clearInterval(iv); return; }
    postComment(types[i++]);
  }, d(600));
}

/* ══ AUTO DEMO ══ */
const AUTO_SEQ = ['text','redirect_read','reply','like','media','text','spam','text','text','like','read','text'];
let autoTick = 0;
function toggleAuto() {
  const btn = document.getElementById('auto-btn');
  if (autoTimer) {
    clearInterval(autoTimer); autoTimer = null;
    btn.textContent = '▶ Auto Demo'; btn.classList.add('active');
  } else {
    btn.textContent = '⏹ Stop Demo';
    autoTimer = setInterval(() => {
      const a = AUTO_SEQ[autoTick % AUTO_SEQ.length];
      if (a === 'redirect_read' || a === 'read') readComments();
      else if (a === 'like') likeComment();
      else postComment(a);
      autoTick++;
    }, d(2600));
  }
}

/* ══ DRAW ARROWS ══ */
function drawArrows() {
  const svg = document.getElementById('arch-svg');
  const stage = document.getElementById('arch-stage');
  const sr = stage.getBoundingClientRect();
  const W = sr.width, H = sr.height;
  const sx = 1200/W, sy = 680/H;

  function pos(id) {
    const el = document.getElementById(id);
    if (!el) return {x:0,y:0};
    const r = el.getBoundingClientRect();
    return { x:(r.left-sr.left+r.width/2)*sx, y:(r.top-sr.top+r.height/2)*sy };
  }

  const conns = [
    ['n-u0','n-gw','var(--client)'],
    ['n-u1','n-gw','var(--client)'],
    ['n-u2','n-gw','var(--client)'],
    ['n-u3','n-gw','var(--client)'],
    ['n-v0','n-ws-svc','var(--ws)'],
    ['n-v1','n-ws-svc','var(--ws)'],
    ['n-v2','n-ws-svc','var(--ws)'],
    ['n-gw','n-cs','var(--api)'],
    ['n-gw','n-ws-svc','var(--gw)'],
    ['n-cs','n-ml','var(--ml)'],
    ['n-cs','n-ms','var(--media)'],
    ['n-cs','n-rc','var(--cache)'],
    ['n-cs','n-dbp','var(--db-write)'],
    ['n-cs','n-kafka','var(--queue)'],
    ['n-rc','n-rctr','var(--cache)'],
    ['n-rc','n-dbr0','var(--db-read)'],
    ['n-rctr','n-dbr1','var(--db-read)'],
    ['n-dbp','n-dbr0','rgba(108,143,255,.2)'],
    ['n-dbp','n-dbr1','rgba(108,143,255,.2)'],
    ['n-ms','n-s3','var(--cdn)'],
    ['n-kafka','n-fo','var(--fanout)'],
    ['n-kafka','n-an','var(--analytics)'],
    ['n-kafka','n-idx','var(--search)'],
    ['n-kafka','n-ml2','var(--ml)'],
    ['n-fo','n-wsd','var(--ws)'],
    ['n-fo','n-push','var(--notify)'],
    ['n-fo','n-inbox','var(--fanout)'],
    ['n-an','n-ts','var(--analytics)'],
    ['n-idx','n-es','var(--search)'],
    ['n-wsd','n-ws-svc','var(--ws)'],
    ['n-cdn','n-s3','rgba(192,132,252,.3)'],
  ];

  let s = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#232d52" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;

  conns.forEach(([from, to, color]) => {
    const f = pos(from), t = pos(to);
    const mx = (f.x+t.x)/2, my = (f.y+t.y)/2 - 10;
    s += `<path d="M${f.x},${f.y} Q${mx},${my} ${t.x},${t.y}" fill="none" stroke="${color}" stroke-width=".85" stroke-dasharray="4 6" opacity=".3" marker-end="url(#ah)"/>`;
  });
  svg.innerHTML = s;
}

/* ══ RESET ══ */
function resetAll() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; document.getElementById('auto-btn').textContent = '▶ Auto Demo'; document.getElementById('auto-btn').classList.add('active'); }
  totalComments=0; totalNotifs=0; cacheHits=0; cacheTotal=0; totalMod=0; queueDepth=0; latencies=[]; wsMsgCounts=[0,0,0,0]; foWs=0; foPush=0; foEmail=0; foInbox=0; cfCount=0; autoTick=0;
  clearPipe(); Object.keys(cacheState).forEach(k => delete cacheState[k]); renderCache();
  document.getElementById('comment-feed').innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;padding:12px;">no comments yet…</div>';
  document.getElementById('log').innerHTML = '';
  document.getElementById('cf-count').textContent = '0 comments';
  wsMsgCounts.forEach((_,i)=>{ document.getElementById('wsm-'+i).textContent='0 msgs'; });
  resetBadges();
  const cBadges=['b-u0','b-u1','b-u2','b-u3'];
  cBadges.forEach(b=>setBadge(b,'IDLE','var(--client)'));
  updateStats();
  addLog('la', '[System] Facebook comment system reset');
}

/* ══ INIT ══ */
window.addEventListener('load', () => {
  setTimeout(drawArrows, 120);
  renderCache(); updateStats();
  addLog('la', '[System] Facebook Comment System online — WebSocket connections active');
  addLog('lws', '[WS] 4 clients connected (2 browsers + 1 mobile + post owner)');
  addLog('lq', '[Kafka] Topics ready: comment.created · like.created · media.uploaded');
  toggleAuto();
});
window.addEventListener('resize', () => setTimeout(drawArrows, 100));
</script>
</body>
</html>
