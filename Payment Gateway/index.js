<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Payment System — System Design</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --bg:     #04060f;
  --s1:     #080b18;
  --s2:     #0e1225;
  --s3:     #151c35;
  --bdr:    #1a2240;
  --bdr2:   #243060;
  --gold:   #f5c842;
  --green:  #20d472;
  --red:    #ff3d5a;
  --blue:   #4a8fff;
  --cyan:   #00d4ff;
  --purple: #9b72f5;
  --amber:  #f5a523;
  --teal:   #00bfa5;
  --pink:   #f06292;
  --text:   #e6e9f8;
  --text2:  #7a85a8;
  --text3:  #2a3358;
  --mono:   'JetBrains Mono', monospace;
  --disp:   'Syne', sans-serif;
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
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,200,66,.04) 0%, transparent 65%),
    linear-gradient(rgba(245,200,66,.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,200,66,.015) 1px, transparent 1px);
  background-size: 100% 100%, 44px 44px, 44px 44px;
}
.wrap { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 22px 18px 36px; }

/* ── HEADER ── */
.hdr { margin-bottom: 16px; }
.hdr h1 {
  font-size: 28px; font-weight: 800; letter-spacing: -.02em; margin-bottom: 2px;
  background: linear-gradient(120deg, var(--gold) 0%, var(--amber) 40%, var(--green) 100%);
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

/* ── MAIN ARCH CANVAS ── */
.arch-canvas {
  position: relative;
  width: 100%;
  height: 540px;
  background: var(--s1);
  border: 1.5px solid var(--bdr);
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 14px;
}
.arch-canvas::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(rgba(245,200,66,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,.02) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* ── COMPONENT NODES ── */
.node {
  position: absolute;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  cursor: pointer; user-select: none;
  transition: filter .2s, transform .15s;
  z-index: 10;
}
.node:hover { transform: translateY(-2px) scale(1.03); filter: brightness(1.15); }

.node-box {
  border-radius: 12px; border: 1.5px solid;
  padding: 10px 12px 8px;
  display: flex; flex-direction: column;
  align-items: center; gap: 4px;
  min-width: 90px;
  transition: border-color .3s, box-shadow .3s;
}
.node-icon  { font-size: 20px; }
.node-name  { font-size: 11px; font-weight: 700; line-height: 1.2; }
.node-sub   { font-family: var(--mono); font-size: 8px; opacity: .6; line-height: 1.2; }
.node-badge {
  font-family: var(--mono); font-size: 8px; font-weight: 700;
  padding: 1px 6px; border-radius: 4px; margin-top: 2px;
  letter-spacing: .04em;
}
.nb-idle  { background: #1a2240; color: var(--text3); }
.nb-act   { background: #0a1f4a; color: var(--blue); }
.nb-ok    { background: #05150a; color: var(--green); }
.nb-err   { background: #1a0510; color: var(--red); }
.nb-warn  { background: #1a0f02; color: var(--amber); }

/* Glow on active */
@keyframes node-glow-gold   { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 20px rgba(245,200,66,.5)} }
@keyframes node-glow-green  { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 18px rgba(32,212,114,.4)} }
@keyframes node-glow-red    { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 18px rgba(255,61,90,.5)} }
@keyframes node-glow-blue   { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 16px rgba(74,143,255,.4)} }
.glow-gold  { animation: node-glow-gold  .6s ease; }
.glow-green { animation: node-glow-green .6s ease; }
.glow-red   { animation: node-glow-red   .6s ease; }
.glow-blue  { animation: node-glow-blue  .6s ease; }

/* ── SVG LAYER (arrows) ── */
#arch-svg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 5;
  overflow: visible;
}

/* ── FLOATING PACKETS ── */
.pkt {
  position: fixed; pointer-events: none; z-index: 300;
  border-radius: 20px; font-family: var(--mono);
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; gap: 5px;
  padding: 4px 11px; white-space: nowrap;
  border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 4px 20px rgba(0,0,0,.7);
}

/* ── SECTION LABELS ── */
.sec-label {
  position: absolute;
  font-family: var(--mono); font-size: 9px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--text3); z-index: 6;
}
.sec-border {
  position: absolute; border: 1px dashed;
  border-radius: 14px; pointer-events: none; z-index: 4;
}

/* ── BOTTOM PANELS ── */
.panels-row {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}
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

/* ── TRANSACTION FEED ── */
.tx-feed {
  max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;
}
.tx-feed::-webkit-scrollbar { width: 3px; }
.tx-feed::-webkit-scrollbar-thumb { background: var(--bdr2); border-radius: 2px; }
.tx-row {
  display: flex; align-items: center; gap: 6px;
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 7px; padding: 5px 8px;
  font-family: var(--mono); font-size: 10px;
  animation: tx-in .3s ease;
}
@keyframes tx-in { from{opacity:0;transform:translateX(-6px)} to{opacity:1} }
.tx-icon { font-size: 12px; flex-shrink: 0; }
.tx-amt  { font-weight: 700; color: var(--text); flex-shrink: 0; min-width: 64px; }
.tx-desc { color: var(--text2); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tx-status { font-size: 9px; font-weight: 700; flex-shrink: 0; }

/* ── PIPELINE STEPS ── */
.pipe-steps { padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
.pst {
  display: flex; align-items: center; gap: 7px;
  background: var(--bg); border: 1px solid var(--bdr);
  border-radius: 7px; padding: 5px 9px;
  transition: border-color .25s, background .25s;
}
.pst.lit  { border-color: var(--blue);  background: #060f22; }
.pst.ok   { border-color: var(--green); background: #040e08; }
.pst.err  { border-color: var(--red);   background: #0e0204; }
.pst.warn { border-color: var(--amber); background: #0e0802; }
.pst-icon { font-size: 13px; flex-shrink: 0; }
.pst-name { font-size: 10px; font-weight: 600; color: var(--text2); flex: 1; }
.pst-val  { font-family: var(--mono); font-size: 9px; font-weight: 700; }

/* ── FRAUD SCORE ── */
.fraud-meter {
  display: flex; flex-direction: column; gap: 5px;
}
.fm-row { display: flex; align-items: center; gap: 8px; }
.fm-label { font-family: var(--mono); font-size: 9px; color: var(--text2); width: 80px; flex-shrink: 0; }
.fm-track { flex: 1; height: 5px; background: var(--bdr); border-radius: 3px; overflow: hidden; }
.fm-fill  { height: 100%; border-radius: 3px; transition: width .5s ease; }
.fm-val   { font-family: var(--mono); font-size: 9px; font-weight: 700; width: 32px; text-align: right; flex-shrink: 0; }

/* ── LEDGER TABLE ── */
.ledger { width: 100%; font-family: var(--mono); font-size: 9px; border-collapse: collapse; }
.ledger th { color: var(--text3); font-size: 8px; letter-spacing: .05em; text-transform: uppercase; padding: 3px 6px; border-bottom: 1px solid var(--bdr); text-align: left; }
.ledger td { padding: 4px 6px; border-bottom: 1px solid var(--bdr); }
.ledger tr:last-child td { border-bottom: none; }
@keyframes ledger-in { from{opacity:0;background:#0f1f0a} to{opacity:1;background:transparent} }
.ledger tr.new td { animation: ledger-in .8s ease; }

/* ── LOG ── */
.log-wrap { background: var(--s1); border: 1.5px solid var(--bdr); border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
.log-hdr { padding: 7px 14px; font-family: var(--mono); font-size: 10px; font-weight: 700; color: var(--text3); border-bottom: 1px solid var(--bdr); letter-spacing: .07em; text-transform: uppercase; display: flex; justify-content: space-between; }
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
.lg { color: var(--gold); }
.lt { color: var(--teal); }

/* ── CONTROLS ── */
.controls { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
.btn { font-family: var(--disp); font-size: 12px; font-weight: 600; padding: 8px 15px; border-radius: 8px; border: 1px solid var(--bdr); background: var(--s1); color: var(--text2); cursor: pointer; transition: all .15s; }
.btn:hover { background: var(--s2); border-color: var(--bdr2); color: var(--text); }
.btn.active { background: #0a1430; border-color: var(--blue); color: var(--blue); }
.btn.gold   { border-color: #4a3800; color: var(--gold); }
.btn.gold:hover   { background: #110d00; }
.btn.green  { border-color: #0a3018; color: var(--green); }
.btn.green:hover  { background: #040e08; }
.btn.red    { border-color: #3a0510; color: var(--red); }
.btn.red:hover    { background: #0e0204; }
.btn.purple { border-color: #2d1b60; color: var(--purple); }
.btn.purple:hover { background: #0e0820; }
.speed-row { display: flex; align-items: center; gap: 8px; justify-content: center; font-family: var(--mono); font-size: 11px; color: var(--text3); }
input[type=range] { width: 80px; accent-color: var(--gold); }
</style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="hdr">
    <h1>💳 Payment System</h1>
    <div class="sub">// checkout → API gateway → payment processor → fraud detection → bank network → ledger → notification</div>
  </div>

  <!-- STATS -->
  <div class="stats">
    <div class="sp">Total Txns <b id="st-total">0</b></div>
    <div class="sp" style="border-color:#0a3018">✅ Successful <b id="st-ok"    style="color:var(--green)">0</b></div>
    <div class="sp" style="border-color:#3a0510">❌ Declined  <b id="st-dec"   style="color:var(--red)">0</b></div>
    <div class="sp" style="border-color:#2d1b60">🚨 Fraud     <b id="st-fraud" style="color:var(--purple)">0</b></div>
    <div class="sp" style="border-color:#4a3800">Total Volume <b id="st-vol"   style="color:var(--gold)">$0</b></div>
    <div class="sp">Avg Latency <b id="st-lat">—</b></div>
    <div class="sp">Success Rate <b id="st-rate">—</b></div>
  </div>

  <!-- ARCH CANVAS -->
  <div class="arch-canvas" id="arch-canvas">
    <svg id="arch-svg" viewBox="0 0 1164 540" preserveAspectRatio="none"></svg>

    <!-- Section borders -->
    <div class="sec-border" style="left:8px;top:28px;width:158px;height:500px;border-color:rgba(74,143,255,.1);"></div>
    <div class="sec-border" style="left:178px;top:28px;width:280px;height:500px;border-color:rgba(245,200,66,.1);"></div>
    <div class="sec-border" style="left:470px;top:28px;width:230px;height:500px;border-color:rgba(155,114,245,.1);"></div>
    <div class="sec-border" style="left:712px;top:28px;width:280px;height:500px;border-color:rgba(0,191,165,.1);"></div>
    <div class="sec-border" style="left:1004px;top:28px;width:152px;height:500px;border-color:rgba(32,212,114,.1);"></div>

    <!-- Section labels -->
    <div class="sec-label" style="left:58px;top:14px;">Clients</div>
    <div class="sec-label" style="left:270px;top:14px;">Payment Core</div>
    <div class="sec-label" style="left:555px;top:14px;">Risk & Fraud</div>
    <div class="sec-label" style="left:800px;top:14px;">Bank Network</div>
    <div class="sec-label" style="left:1038px;top:14px;">Infra</div>

    <!-- ── CLIENTS ── -->
    <div class="node" id="n-web" style="left:18px;top:70px;" onclick="firePayment('web')" title="Web Checkout">
      <div class="node-box" style="background:#06091a;border-color:var(--blue);color:var(--blue);">
        <div class="node-icon">🌐</div>
        <div class="node-name">Web App</div>
        <div class="node-sub">checkout</div>
        <div class="node-badge nb-idle" id="b-web">READY</div>
      </div>
    </div>
    <div class="node" id="n-mob" style="left:18px;top:210px;" onclick="firePayment('mobile')" title="Mobile Pay">
      <div class="node-box" style="background:#06091a;border-color:var(--cyan);color:var(--cyan);">
        <div class="node-icon">📱</div>
        <div class="node-name">Mobile App</div>
        <div class="node-sub">Apple/Google Pay</div>
        <div class="node-badge nb-idle" id="b-mob">READY</div>
      </div>
    </div>
    <div class="node" id="n-api" style="left:18px;top:350px;" onclick="firePayment('api')" title="API Payment">
      <div class="node-box" style="background:#06091a;border-color:var(--purple);color:var(--purple);">
        <div class="node-icon">🔌</div>
        <div class="node-name">API Client</div>
        <div class="node-sub">B2B / recurring</div>
        <div class="node-badge nb-idle" id="b-api">READY</div>
      </div>
    </div>

    <!-- ── PAYMENT CORE ── -->
    <div class="node" id="n-gw" style="left:186px;top:60px;" title="API Gateway">
      <div class="node-box" style="background:#100d00;border-color:var(--gold);color:var(--gold);">
        <div class="node-icon">🔀</div>
        <div class="node-name">API Gateway</div>
        <div class="node-sub">auth · rate limit</div>
        <div class="node-badge nb-idle" id="b-gw">—</div>
      </div>
    </div>
    <div class="node" id="n-svc" style="left:186px;top:210px;" title="Payment Service">
      <div class="node-box" style="background:#0f0a00;border-color:var(--amber);color:var(--amber);">
        <div class="node-icon">⚙️</div>
        <div class="node-name">Payment Service</div>
        <div class="node-sub">orchestration</div>
        <div class="node-badge nb-idle" id="b-svc">—</div>
      </div>
    </div>
    <div class="node" id="n-tok" style="left:186px;top:360px;" title="Tokenization">
      <div class="node-box" style="background:#0a0610;border-color:var(--purple);color:var(--purple);">
        <div class="node-icon">🔐</div>
        <div class="node-name">Tokenization</div>
        <div class="node-sub">PAN → token</div>
        <div class="node-badge nb-idle" id="b-tok">—</div>
      </div>
    </div>
    <div class="node" id="n-queue" style="left:322px;top:210px;" title="Message Queue">
      <div class="node-box" style="background:#040c14;border-color:var(--blue);color:var(--blue);">
        <div class="node-icon">📋</div>
        <div class="node-name">Message Queue</div>
        <div class="node-sub">Kafka · async</div>
        <div class="node-badge nb-idle" id="b-queue">—</div>
      </div>
    </div>
    <div class="node" id="n-idp" style="left:322px;top:60px;" title="Idempotency">
      <div class="node-box" style="background:#040c14;border-color:var(--teal);color:var(--teal);">
        <div class="node-icon">🔑</div>
        <div class="node-name">Idempotency</div>
        <div class="node-sub">dedup · replay</div>
        <div class="node-badge nb-idle" id="b-idp">—</div>
      </div>
    </div>
    <div class="node" id="n-db" style="left:322px;top:370px;" title="Payment DB">
      <div class="node-box" style="background:#030c06;border-color:var(--green);color:var(--green);">
        <div class="node-icon">🗄️</div>
        <div class="node-name">Payment DB</div>
        <div class="node-sub">PostgreSQL</div>
        <div class="node-badge nb-idle" id="b-db">—</div>
      </div>
    </div>

    <!-- ── RISK & FRAUD ── -->
    <div class="node" id="n-fraud" style="left:478px;top:80px;" title="Fraud Detection">
      <div class="node-box" style="background:#0a0418;border-color:var(--purple);color:var(--purple);">
        <div class="node-icon">🚨</div>
        <div class="node-name">Fraud Engine</div>
        <div class="node-sub">ML · rules</div>
        <div class="node-badge nb-idle" id="b-fraud">—</div>
      </div>
    </div>
    <div class="node" id="n-kyc" style="left:478px;top:230px;" title="KYC/AML">
      <div class="node-box" style="background:#080c14;border-color:var(--pink);color:var(--pink);">
        <div class="node-icon">🪪</div>
        <div class="node-name">KYC / AML</div>
        <div class="node-sub">compliance</div>
        <div class="node-badge nb-idle" id="b-kyc">—</div>
      </div>
    </div>
    <div class="node" id="n-3ds" style="left:478px;top:380px;" title="3D Secure">
      <div class="node-box" style="background:#0a0810;border-color:var(--amber);color:var(--amber);">
        <div class="node-icon">🛡️</div>
        <div class="node-name">3D Secure</div>
        <div class="node-sub">OTP · biometric</div>
        <div class="node-badge nb-idle" id="b-3ds">—</div>
      </div>
    </div>

    <!-- ── BANK NETWORK ── -->
    <div class="node" id="n-proc" style="left:720px;top:80px;" title="Payment Processor">
      <div class="node-box" style="background:#030e08;border-color:var(--teal);color:var(--teal);">
        <div class="node-icon">🏦</div>
        <div class="node-name">Processor</div>
        <div class="node-sub">Stripe · Adyen</div>
        <div class="node-badge nb-idle" id="b-proc">—</div>
      </div>
    </div>
    <div class="node" id="n-card" style="left:720px;top:240px;" title="Card Network">
      <div class="node-box" style="background:#100d00;border-color:var(--gold);color:var(--gold);">
        <div class="node-icon">💳</div>
        <div class="node-name">Card Network</div>
        <div class="node-sub">Visa · Mastercard</div>
        <div class="node-badge nb-idle" id="b-card">—</div>
      </div>
    </div>
    <div class="node" id="n-issuer" style="left:850px;top:160px;" title="Issuing Bank">
      <div class="node-box" style="background:#040c0c;border-color:var(--cyan);color:var(--cyan);">
        <div class="node-icon">🏛️</div>
        <div class="node-name">Issuing Bank</div>
        <div class="node-sub">authorize · settle</div>
        <div class="node-badge nb-idle" id="b-issuer">—</div>
      </div>
    </div>
    <div class="node" id="n-acq" style="left:720px;top:390px;" title="Acquiring Bank">
      <div class="node-box" style="background:#030c08;border-color:var(--green);color:var(--green);">
        <div class="node-icon">🏢</div>
        <div class="node-name">Acquiring Bank</div>
        <div class="node-sub">merchant account</div>
        <div class="node-badge nb-idle" id="b-acq">—</div>
      </div>
    </div>

    <!-- ── INFRA ── -->
    <div class="node" id="n-ledger" style="left:1012px;top:70px;" title="Ledger">
      <div class="node-box" style="background:#040e06;border-color:var(--green);color:var(--green);">
        <div class="node-icon">📒</div>
        <div class="node-name">Ledger</div>
        <div class="node-sub">double-entry</div>
        <div class="node-badge nb-idle" id="b-ledger">—</div>
      </div>
    </div>
    <div class="node" id="n-notif" style="left:1012px;top:220px;" title="Notifications">
      <div class="node-box" style="background:#04080e;border-color:var(--blue);color:var(--blue);">
        <div class="node-icon">🔔</div>
        <div class="node-name">Notifications</div>
        <div class="node-sub">email · SMS · push</div>
        <div class="node-badge nb-idle" id="b-notif">—</div>
      </div>
    </div>
    <div class="node" id="n-rec" style="left:1012px;top:370px;" title="Reconciliation">
      <div class="node-box" style="background:#080608;border-color:var(--pink);color:var(--pink);">
        <div class="node-icon">⚖️</div>
        <div class="node-name">Reconciliation</div>
        <div class="node-sub">settlement · EOD</div>
        <div class="node-badge nb-idle" id="b-rec">—</div>
      </div>
    </div>

    <!-- Packet overlay -->
    <div id="pkts" style="position:absolute;inset:0;pointer-events:none;z-index:20;"></div>
  </div>

  <!-- BOTTOM PANELS -->
  <div class="panels-row">

    <!-- Transaction Feed -->
    <div class="panel">
      <div class="ph"><span>💳 Transaction Feed</span><span id="tx-count" style="font-size:9px;color:var(--text3);">0 txns</span></div>
      <div class="pb" style="padding:6px 8px;">
        <div class="tx-feed" id="tx-feed">
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;padding:10px;">no transactions yet…</div>
        </div>
      </div>
    </div>

    <!-- Payment Pipeline -->
    <div class="panel">
      <div class="ph"><span>⚙️ Processing Steps</span><span id="pipe-res" style="font-size:10px;font-weight:700;"></span></div>
      <div class="pipe-steps" id="pipe-steps">
        <div class="pst" id="pst-0"><span class="pst-icon">🌐</span><span class="pst-name">Receive &amp; Authenticate</span><span class="pst-val" id="pv-0">—</span></div>
        <div class="pst" id="pst-1"><span class="pst-icon">🔐</span><span class="pst-name">Tokenize Card</span><span class="pst-val" id="pv-1">—</span></div>
        <div class="pst" id="pst-2"><span class="pst-icon">🚨</span><span class="pst-name">Fraud &amp; Risk Check</span><span class="pst-val" id="pv-2">—</span></div>
        <div class="pst" id="pst-3"><span class="pst-icon">🏦</span><span class="pst-name">Authorize (Bank)</span><span class="pst-val" id="pv-3">—</span></div>
        <div class="pst" id="pst-4"><span class="pst-icon">💾</span><span class="pst-name">Persist &amp; Ledger</span><span class="pst-val" id="pv-4">—</span></div>
        <div class="pst" id="pst-5"><span class="pst-icon">🔔</span><span class="pst-name">Notify &amp; Settle</span><span class="pst-val" id="pv-5">—</span></div>
      </div>
    </div>

    <!-- Fraud Score -->
    <div class="panel">
      <div class="ph"><span>🚨 Fraud Signals</span><span id="fraud-score-val" style="font-size:11px;font-weight:700;color:var(--green);">score: —</span></div>
      <div class="pb">
        <div class="fraud-meter" id="fraud-meter">
          <div class="fm-row"><span class="fm-label">Velocity</span><div class="fm-track"><div class="fm-fill" id="fs-vel" style="background:var(--green);width:0%"></div></div><span class="fm-val" id="fv-vel">0</span></div>
          <div class="fm-row"><span class="fm-label">Geo anomaly</span><div class="fm-track"><div class="fm-fill" id="fs-geo" style="background:var(--green);width:0%"></div></div><span class="fm-val" id="fv-geo">0</span></div>
          <div class="fm-row"><span class="fm-label">Device trust</span><div class="fm-track"><div class="fm-fill" id="fs-dev" style="background:var(--green);width:0%"></div></div><span class="fm-val" id="fv-dev">0</span></div>
          <div class="fm-row"><span class="fm-label">Amt pattern</span><div class="fm-track"><div class="fm-fill" id="fs-amt" style="background:var(--green);width:0%"></div></div><span class="fm-val" id="fv-amt">0</span></div>
          <div class="fm-row"><span class="fm-label">Card history</span><div class="fm-track"><div class="fm-fill" id="fs-crd" style="background:var(--green);width:0%"></div></div><span class="fm-val" id="fv-crd">0</span></div>
        </div>
        <div style="margin-top:8px;font-family:var(--mono);font-size:9px;color:var(--text3);text-align:center;" id="fraud-verdict">awaiting transaction…</div>
      </div>
    </div>

    <!-- Ledger -->
    <div class="panel">
      <div class="ph"><span>📒 Ledger Entries</span></div>
      <div class="pb" style="padding:4px 6px;max-height:220px;overflow-y:auto;">
        <table class="ledger" id="ledger-table">
          <thead><tr><th>TXN</th><th>Debit</th><th>Credit</th><th>Status</th></tr></thead>
          <tbody id="ledger-body"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- LOG -->
  <div class="log-wrap">
    <div class="log-hdr"><span>Payment System Log</span><span style="color:var(--text3)">PCI-DSS compliant · end-to-end encrypted</span></div>
    <div class="log-body" id="log"></div>
  </div>

  <!-- CONTROLS -->
  <div class="controls">
    <button class="btn gold"   onclick="firePayment('web')">💳 Credit Card</button>
    <button class="btn gold"   onclick="firePayment('mobile')">📱 Mobile Pay</button>
    <button class="btn gold"   onclick="firePayment('api')">🔌 API Payment</button>
    <button class="btn red"    onclick="firePayment('fraud')">🚨 Fraud Attempt</button>
    <button class="btn"        onclick="firePayment('decline')">❌ Declined Card</button>
    <button class="btn purple" onclick="firePayment('3ds')">🛡️ 3DS Auth</button>
    <button class="btn"        onclick="firePayment('refund')">↩️ Refund</button>
    <button class="btn"        onclick="burstPayments()">💥 Burst (8x)</button>
    <button class="btn active" id="auto-btn" onclick="toggleAuto()">▶ Auto Demo</button>
    <button class="btn"        onclick="resetAll()" style="color:var(--text3)">↺ Reset</button>
  </div>
  <div class="speed-row" style="margin-top:10px;">
    Speed <input type="range" min="0.3" max="3" step="0.1" value="1" oninput="spd=parseFloat(this.value)">
  </div>

</div>
<div id="float-pkts" style="position:fixed;inset:0;pointer-events:none;z-index:300;"></div>

<script>
/* ══ STATE ══ */
let spd = 1, autoTimer = null;
let totalTxn = 0, okTxn = 0, decTxn = 0, fraudTxn = 0;
let totalVol = 0;
let latencies = [];
let pipeTimers = [];
let txnCount = 0;

function d(ms) { return ms / spd; }

/* ══ PAYMENT SCENARIOS ══ */
const SCENARIOS = {
  web: {
    label: 'Web Checkout',
    icon: '🌐',
    amount: () => (Math.random() * 300 + 20).toFixed(2),
    desc: 'Visa *4242',
    outcome: 'success',
    fraudScore: () => Math.floor(Math.random() * 30),
    clientId: 'n-web',
    clientBadge: 'b-web',
    color: 'var(--blue)',
    latency: () => 280 + Math.floor(Math.random() * 80),
  },
  mobile: {
    label: 'Apple Pay',
    icon: '📱',
    amount: () => (Math.random() * 150 + 10).toFixed(2),
    desc: 'Apple Pay (biometric)',
    outcome: 'success',
    fraudScore: () => Math.floor(Math.random() * 15),
    clientId: 'n-mob',
    clientBadge: 'b-mob',
    color: 'var(--cyan)',
    latency: () => 180 + Math.floor(Math.random() * 60),
  },
  api: {
    label: 'API Recurring',
    icon: '🔌',
    amount: () => (Math.random() * 500 + 50).toFixed(2),
    desc: 'Subscription · token',
    outcome: 'success',
    fraudScore: () => Math.floor(Math.random() * 20),
    clientId: 'n-api',
    clientBadge: 'b-api',
    color: 'var(--purple)',
    latency: () => 220 + Math.floor(Math.random() * 70),
  },
  fraud: {
    label: 'Fraud Attempt',
    icon: '🚨',
    amount: () => (Math.random() * 2000 + 800).toFixed(2),
    desc: 'Stolen card · VPN',
    outcome: 'fraud',
    fraudScore: () => Math.floor(Math.random() * 25 + 75),
    clientId: 'n-web',
    clientBadge: 'b-web',
    color: 'var(--purple)',
    latency: () => 150 + Math.floor(Math.random() * 50),
  },
  decline: {
    label: 'Card Declined',
    icon: '❌',
    amount: () => (Math.random() * 400 + 100).toFixed(2),
    desc: 'Insufficient funds',
    outcome: 'decline',
    fraudScore: () => Math.floor(Math.random() * 40),
    clientId: 'n-mob',
    clientBadge: 'b-mob',
    color: 'var(--red)',
    latency: () => 240 + Math.floor(Math.random() * 60),
  },
  '3ds': {
    label: '3D Secure',
    icon: '🛡️',
    amount: () => (Math.random() * 600 + 200).toFixed(2),
    desc: 'High-value · 3DS challenge',
    outcome: 'success',
    fraudScore: () => Math.floor(Math.random() * 50 + 20),
    clientId: 'n-web',
    clientBadge: 'b-web',
    color: 'var(--amber)',
    latency: () => 450 + Math.floor(Math.random() * 150),
    needs3ds: true,
  },
  refund: {
    label: 'Refund',
    icon: '↩️',
    amount: () => (Math.random() * 100 + 10).toFixed(2),
    desc: 'Customer refund',
    outcome: 'refund',
    fraudScore: () => Math.floor(Math.random() * 10),
    clientId: 'n-api',
    clientBadge: 'b-api',
    color: 'var(--teal)',
    latency: () => 200 + Math.floor(Math.random() * 50),
  },
};

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
  document.getElementById('st-total').textContent = totalTxn;
  document.getElementById('st-ok').textContent    = okTxn;
  document.getElementById('st-dec').textContent   = decTxn;
  document.getElementById('st-fraud').textContent = fraudTxn;
  document.getElementById('st-vol').textContent   = '$' + totalVol.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b) / latencies.length) : 0;
  document.getElementById('st-lat').textContent = avg ? avg + 'ms' : '—';
  const rate = totalTxn ? Math.round(okTxn / totalTxn * 100) : 0;
  document.getElementById('st-rate').textContent = rate ? rate + '%' : '—';
  document.getElementById('st-rate').style.color = rate > 90 ? 'var(--green)' : rate > 70 ? 'var(--amber)' : 'var(--red)';
}

/* ══ NODE BADGE ══ */
function setBadge(id, text, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'node-badge nb-' + cls;
}

function glow(id, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('glow-gold', 'glow-green', 'glow-red', 'glow-blue');
  void el.offsetWidth;
  el.classList.add('glow-' + type);
  setTimeout(() => el.classList.remove('glow-gold', 'glow-green', 'glow-red', 'glow-blue'), 700);
}

/* ══ PIPELINE ══ */
function clearPipe() {
  pipeTimers.forEach(t => clearTimeout(t)); pipeTimers = [];
  for (let i = 0; i < 6; i++) {
    document.getElementById('pst-' + i).className = 'pst';
    document.getElementById('pv-' + i).textContent = '—';
  }
  document.getElementById('pipe-res').textContent = '';
}

function litPipe(i, cls, val, delay) {
  const t = setTimeout(() => {
    document.getElementById('pst-' + i).className = 'pst ' + cls;
    document.getElementById('pv-' + i).textContent = val || '—';
  }, d(delay));
  pipeTimers.push(t);
}

/* ══ PACKET ANIMATION ══ */
function flyPkt(fromId, toId, opts, onDone) {
  const canvas = document.getElementById('arch-canvas');
  const fromEl = document.getElementById(fromId);
  const toEl   = document.getElementById(toId);
  if (!fromEl || !toEl) { if (onDone) onDone(); return; }
  const cr = canvas.getBoundingClientRect();
  const fr = fromEl.getBoundingClientRect();
  const tr = toEl.getBoundingClientRect();
  const fx = fr.left - cr.left + fr.width / 2;
  const fy = fr.top  - cr.top  + fr.height / 2;
  const tx = tr.left - cr.left + tr.width / 2;
  const ty = tr.top  - cr.top  + tr.height / 2;

  const pkt = document.createElement('div');
  pkt.className = 'pkt';
  const w = opts.w || 80;
  pkt.style.cssText = `background:${opts.bg};border-color:${opts.border};color:${opts.color};width:${w}px;height:24px;left:${fx - w/2}px;top:${fy - 12}px;opacity:1;`;
  pkt.innerHTML = opts.label;
  document.getElementById('pkts').appendChild(pkt);

  const dist = Math.hypot(tx - fx, ty - fy);
  const dur = Math.max(200, dist / (190 * spd) * 1000);
  pkt.animate([
    { left: (fx - w/2) + 'px', top: (fy - 12) + 'px', opacity: 1 },
    { left: (tx - w/2) + 'px', top: (ty - 12) + 'px', opacity: 1 },
  ], { duration: dur, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
  .finished.then(() => { pkt.remove(); if (onDone) onDone(); });
}

/* ══ FRAUD SIGNALS ══ */
function updateFraudSignals(score) {
  const vel = Math.min(100, Math.floor(score * 0.9 + Math.random() * 20));
  const geo = Math.min(100, Math.floor(score * 1.1 + Math.random() * 15));
  const dev = Math.min(100, Math.floor(score * 0.7 + Math.random() * 25));
  const amt = Math.min(100, Math.floor(score * 0.8 + Math.random() * 20));
  const crd = Math.min(100, Math.floor(score * 0.6 + Math.random() * 30));
  const signals = [vel, geo, dev, amt, crd];
  const keys = ['vel','geo','dev','amt','crd'];
  signals.forEach((v, i) => {
    const color = v > 70 ? 'var(--red)' : v > 40 ? 'var(--amber)' : 'var(--green)';
    document.getElementById('fs-' + keys[i]).style.width = v + '%';
    document.getElementById('fs-' + keys[i]).style.background = color;
    document.getElementById('fv-' + keys[i]).textContent = v;
    document.getElementById('fv-' + keys[i]).style.color = color;
  });
  document.getElementById('fraud-score-val').textContent = 'score: ' + score;
  document.getElementById('fraud-score-val').style.color = score > 70 ? 'var(--red)' : score > 40 ? 'var(--amber)' : 'var(--green)';
}

/* ══ TRANSACTION FEED ══ */
function addTxFeed(scenario, amount, outcome, latency) {
  txnCount++;
  const feed = document.getElementById('tx-feed');
  const empty = feed.querySelector('[style*="no transactions"]');
  if (empty) empty.remove();

  const row = document.createElement('div');
  row.className = 'tx-row';
  const statusColor = outcome === 'success' ? 'var(--green)' : outcome === 'fraud' ? 'var(--purple)' : outcome === 'refund' ? 'var(--teal)' : 'var(--red)';
  const statusText = outcome === 'success' ? 'APPROVED' : outcome === 'fraud' ? 'BLOCKED' : outcome === 'refund' ? 'REFUNDED' : 'DECLINED';
  const prefix = outcome === 'refund' ? '-' : '';
  row.innerHTML = `
    <span class="tx-icon">${scenario.icon}</span>
    <span class="tx-amt">${prefix}$${amount}</span>
    <span class="tx-desc">${scenario.desc}</span>
    <span class="tx-status" style="color:${statusColor}">${statusText}</span>
  `;
  feed.insertBefore(row, feed.firstChild);
  if (feed.children.length > 15) feed.removeChild(feed.lastChild);
  document.getElementById('tx-count').textContent = txnCount + ' txns';
}

/* ══ LEDGER ENTRY ══ */
function addLedger(amount, outcome) {
  const body = document.getElementById('ledger-body');
  const txId = 'TX' + String(totalTxn).padStart(4, '0');
  const statusColor = outcome === 'success' ? 'var(--green)' : outcome === 'fraud' ? 'var(--purple)' : 'var(--red)';
  const statusText = outcome === 'success' ? '✓' : outcome === 'fraud' ? '🚫' : '✗';
  const row = document.createElement('tr');
  row.className = 'new';
  row.innerHTML = `
    <td style="color:var(--text2);font-size:8px;">${txId}</td>
    <td style="color:var(--red)">$${amount}</td>
    <td style="color:var(--green)">$${amount}</td>
    <td style="color:${statusColor};font-weight:700;">${statusText}</td>
  `;
  body.insertBefore(row, body.firstChild);
  if (body.children.length > 8) body.removeChild(body.lastChild);
  setTimeout(() => row.classList.remove('new'), 1000);
}

/* ══ DRAW ARCH ARROWS (static SVG) ══ */
function drawArrows() {
  const svg = document.getElementById('arch-svg');
  const canvas = document.getElementById('arch-canvas');
  const cr = canvas.getBoundingClientRect();
  const W = cr.width, H = cr.height;

  // Scale factors for SVG viewBox
  const sx = 1164 / W, sy = 540 / H;

  function pos(id) {
    const el = document.getElementById(id);
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - cr.left + r.width / 2) * sx,
      y: (r.top - cr.top + r.height / 2) * sy,
    };
  }

  const connections = [
    ['n-web', 'n-gw'], ['n-mob', 'n-gw'], ['n-api', 'n-gw'],
    ['n-gw', 'n-idp'], ['n-gw', 'n-svc'],
    ['n-svc', 'n-tok'], ['n-svc', 'n-queue'], ['n-svc', 'n-db'],
    ['n-queue', 'n-fraud'], ['n-queue', 'n-kyc'],
    ['n-fraud', 'n-proc'], ['n-kyc', 'n-3ds'],
    ['n-proc', 'n-card'], ['n-card', 'n-issuer'], ['n-proc', 'n-acq'],
    ['n-queue', 'n-ledger'], ['n-queue', 'n-notif'], ['n-acq', 'n-rec'],
  ];

  let svgContent = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#2a3358" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;

  connections.forEach(([from, to]) => {
    const f = pos(from), t = pos(to);
    const mx = (f.x + t.x) / 2;
    const my = (f.y + t.y) / 2 - 12;
    svgContent += `<path d="M${f.x},${f.y} Q${mx},${my} ${t.x},${t.y}" fill="none" stroke="rgba(42,51,88,.6)" stroke-width="1" stroke-dasharray="4 5" marker-end="url(#ah)"/>`;
  });

  svg.innerHTML = svgContent;
}

/* ══ MAIN PAYMENT FLOW ══ */
function firePayment(type) {
  const sc = SCENARIOS[type];
  if (!sc) return;

  totalTxn++;
  const amount = sc.amount();
  const fraudScore = sc.fraudScore();
  const latency = sc.latency();
  const txId = 'TX' + String(totalTxn).padStart(4, '0');

  clearPipe();
  updateFraudSignals(fraudScore);

  const clientEl = document.getElementById(sc.clientId);
  const gwEl = document.getElementById('n-gw');
  const svcEl = document.getElementById('n-svc');
  const fraudEl = document.getElementById('n-fraud');
  const procEl = document.getElementById('n-proc');
  const issuerEl = document.getElementById('n-issuer');

  setBadge(sc.clientBadge, 'SENDING', 'act');
  glow(sc.clientId, 'blue');
  addLog('lg', `[${txId}] ${sc.label} — $${amount} — ${sc.desc}`);

  /* Step 1: Client → API Gateway */
  litPipe(0, 'lit', 'auth…', 0);
  flyPkt(sc.clientId, 'n-gw', {
    bg: '#06091a', border: sc.color, color: sc.color,
    label: `${sc.icon} $${amount}`, w: 90
  }, () => {
    glow('n-gw', 'gold');
    setBadge('b-gw', 'AUTH', 'act');
    litPipe(0, 'ok', txId, 0);
    addLog('li', `[Gateway] ${txId} authenticated · idempotency key set`);

    /* Step 2: Tokenization */
    litPipe(1, 'lit', 'tokenizing…', 0);
    setBadge('b-tok', 'ACTIVE', 'act');
    flyPkt('n-gw', 'n-tok', {
      bg: '#0a0618', border: 'var(--purple)', color: 'var(--purple)',
      label: '🔐 PAN→tok', w: 84
    }, () => {
      glow('n-tok', 'blue');
      setBadge('b-tok', 'DONE', 'ok');
      litPipe(1, 'ok', 'tok_****', 0);
      addLog('lp', `[Tokenize] PAN encrypted → token issued (PCI-DSS)`);

      /* Step 3: Fraud Check */
      litPipe(2, 'lit', 'checking…', 0);
      setBadge('b-fraud', 'SCORING', 'act');
      setBadge('b-kyc', 'CHECK', 'act');
      flyPkt('n-svc', 'n-fraud', {
        bg: '#0a0418', border: 'var(--purple)', color: 'var(--purple)',
        label: `🚨 score:${fraudScore}`, w: 96
      }, () => {
        glow('n-fraud', fraudScore > 70 ? 'red' : 'blue');

        if (sc.outcome === 'fraud' || fraudScore > 70) {
          /* FRAUD BLOCKED */
          fraudTxn++;
          setBadge('b-fraud', 'BLOCKED', 'err');
          litPipe(2, 'err', `FRAUD(${fraudScore})`, 0);
          document.getElementById('pipe-res').textContent = '🚫 FRAUD';
          document.getElementById('pipe-res').style.color = 'var(--purple)';
          document.getElementById('fraud-verdict').textContent = `🚨 BLOCKED — score ${fraudScore} > threshold (70)`;
          document.getElementById('fraud-verdict').style.color = 'var(--red)';
          addLog('lb', `[Fraud] 🚨 BLOCKED ${txId} — score ${fraudScore} exceeds threshold`);
          decTxn++;
          flyPkt('n-fraud', sc.clientId, {
            bg: '#1a0510', border: 'var(--red)', color: 'var(--red)',
            label: '✗ FRAUD BLOCK', w: 100
          }, () => {
            setBadge(sc.clientBadge, 'BLOCKED', 'err');
            glow(sc.clientId, 'red');
            addTxFeed(sc, amount, 'fraud', latency);
            addLedger(amount, 'fraud');
            resetBadges(sc);
            updateStats();
          });
          return;
        }

        setBadge('b-fraud', 'PASSED', 'ok');
        litPipe(2, 'ok', `OK(${fraudScore})`, 0);
        document.getElementById('fraud-verdict').textContent = `✅ PASSED — score ${fraudScore} < threshold (70)`;
        document.getElementById('fraud-verdict').style.color = 'var(--green)';
        addLog('ll', `[Fraud] ✅ Passed — score ${fraudScore}. KYC/AML clear`);

        /* 3DS check if needed */
        const needs3ds = sc.needs3ds || fraudScore > 40;
        if (needs3ds) {
          setBadge('b-3ds', 'OTP SENT', 'warn');
          addLog('lw', `[3DS] High-value txn — OTP challenge issued to cardholder`);
          flyPkt('n-fraud', 'n-3ds', {
            bg: '#0a0800', border: 'var(--amber)', color: 'var(--amber)',
            label: '🛡️ 3DS OTP', w: 80
          }, () => {
            glow('n-3ds', 'gold');
            setBadge('b-3ds', 'VERIFIED', 'ok');
            addLog('ll', `[3DS] Cardholder verified ✓`);
          });
        }

        /* Step 4: Authorization → Bank Network */
        litPipe(3, 'lit', 'authorizing…', 0);
        setBadge('b-proc', 'SENDING', 'act');
        setBadge('b-card', 'ROUTING', 'act');
        flyPkt('n-fraud', 'n-proc', {
          bg: '#030e08', border: 'var(--teal)', color: 'var(--teal)',
          label: `🏦 AUTH $${amount}`, w: 96
        }, () => {
          glow('n-proc', 'blue');
          flyPkt('n-proc', 'n-card', {
            bg: '#100d00', border: 'var(--gold)', color: 'var(--gold)',
            label: `💳 route`, w: 70
          }, () => {
            flyPkt('n-card', 'n-issuer', {
              bg: '#040c0c', border: 'var(--cyan)', color: 'var(--cyan)',
              label: `🏛️ AUTH`, w: 64
            }, () => {
              glow('n-issuer', 'blue');

              if (sc.outcome === 'decline') {
                /* DECLINED */
                decTxn++;
                setBadge('b-issuer', 'DECLINED', 'err');
                litPipe(3, 'err', 'DECLINED', 0);
                document.getElementById('pipe-res').textContent = '❌ DECLINED';
                document.getElementById('pipe-res').style.color = 'var(--red)';
                addLog('lb', `[Bank] ❌ ${txId} DECLINED — insufficient funds`);
                flyPkt('n-issuer', sc.clientId, {
                  bg: '#1a0510', border: 'var(--red)', color: 'var(--red)',
                  label: '❌ 05 DECLINED', w: 96
                }, () => {
                  setBadge(sc.clientBadge, 'DECLINED', 'err');
                  glow(sc.clientId, 'red');
                  addTxFeed(sc, amount, 'decline', latency);
                  addLedger(amount, 'decline');
                  resetBadges(sc);
                  updateStats();
                });
                return;
              }

              /* APPROVED */
              setBadge('b-issuer', 'APPROVED', 'ok');
              setBadge('b-proc', 'APPROVED', 'ok');
              litPipe(3, 'ok', '00 APPROVED', 0);
              addLog('ll', `[Bank] ✅ ${txId} AUTHORIZED — approval code: ${Math.random().toString(36).substring(2,8).toUpperCase()}`);

              /* Step 5: Persist + Ledger */
              litPipe(4, 'lit', 'persisting…', 0);
              setBadge('b-db', 'WRITING', 'act');
              setBadge('b-ledger', 'POSTING', 'act');
              flyPkt('n-proc', 'n-db', {
                bg: '#030c06', border: 'var(--green)', color: 'var(--green)',
                label: '💾 persist', w: 74
              }, () => {
                glow('n-db', 'green');
                setBadge('b-db', 'SAVED', 'ok');
              });
              flyPkt('n-queue', 'n-ledger', {
                bg: '#040e06', border: 'var(--green)', color: 'var(--green)',
                label: '📒 debit/credit', w: 96
              }, () => {
                glow('n-ledger', 'green');
                setBadge('b-ledger', 'POSTED', 'ok');
                litPipe(4, 'ok', 'committed', 0);
                addLog('lt', `[Ledger] Double-entry posted — debit customer, credit merchant`);

                /* Step 6: Notify + Settle */
                litPipe(5, 'lit', 'notifying…', 0);
                setBadge('b-notif', 'SENDING', 'act');
                flyPkt('n-queue', 'n-notif', {
                  bg: '#04080e', border: 'var(--blue)', color: 'var(--blue)',
                  label: '🔔 notify', w: 74
                }, () => {
                  glow('n-notif', 'blue');
                  setBadge('b-notif', 'SENT', 'ok');
                  litPipe(5, 'ok', 'email+sms', 0);
                  addLog('li', `[Notify] Confirmation sent via email + SMS + push`);
                });

                /* Final response to client */
                setTimeout(() => {
                  okTxn++;
                  if (sc.outcome !== 'refund') totalVol += parseFloat(amount);
                  latencies.push(latency);
                  if (latencies.length > 30) latencies.shift();

                  document.getElementById('pipe-res').textContent = '✅ APPROVED';
                  document.getElementById('pipe-res').style.color = 'var(--green)';

                  flyPkt('n-proc', sc.clientId, {
                    bg: '#040e06', border: 'var(--green)', color: 'var(--green)',
                    label: `✅ $${amount} approved`, w: 118
                  }, () => {
                    setBadge(sc.clientBadge, 'APPROVED', 'ok');
                    glow(sc.clientId, 'green');
                    addTxFeed(sc, amount, sc.outcome, latency);
                    addLedger(amount, 'success');
                    resetBadges(sc);
                    updateStats();
                  });

                  addLog('ll', `[${txId}] ✅ COMPLETE — $${amount} in ${latency}ms`);
                }, d(300));
              });
            });
          });
        });
      });
    });
  });
  updateStats();
}

/* ══ RESET NODE BADGES ══ */
function resetBadges(sc) {
  setTimeout(() => {
    const ids = ['b-gw','b-svc','b-tok','b-queue','b-idp','b-db','b-fraud','b-kyc','b-3ds','b-proc','b-card','b-issuer','b-acq','b-ledger','b-notif','b-rec'];
    ids.forEach(id => setBadge(id, '—', 'idle'));
    setBadge(sc.clientBadge, 'READY', 'idle');
  }, d(1500));
}

/* ══ BURST ══ */
function burstPayments() {
  const types = ['web','mobile','api','web','fraud','mobile','api','decline'];
  addLog('lg', '[Burst] 💥 8 simultaneous payment requests…');
  let i = 0;
  const iv = setInterval(() => {
    if (i >= types.length) { clearInterval(iv); return; }
    firePayment(types[i++]);
  }, d(400));
}

/* ══ AUTO DEMO ══ */
const AUTO_SEQ = ['web','mobile','api','web','3ds','fraud','web','decline','api','mobile','refund','web'];
let autoTick = 0;
function toggleAuto() {
  const btn = document.getElementById('auto-btn');
  if (autoTimer) {
    clearInterval(autoTimer); autoTimer = null;
    btn.textContent = '▶ Auto Demo'; btn.classList.add('active');
  } else {
    btn.textContent = '⏹ Stop Demo';
    autoTimer = setInterval(() => {
      firePayment(AUTO_SEQ[autoTick % AUTO_SEQ.length]);
      autoTick++;
    }, d(2800));
  }
}

/* ══ RESET ══ */
function resetAll() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; document.getElementById('auto-btn').textContent = '▶ Auto Demo'; document.getElementById('auto-btn').classList.add('active'); }
  totalTxn = 0; okTxn = 0; decTxn = 0; fraudTxn = 0; totalVol = 0; txnCount = 0; latencies = [];
  clearPipe();
  const ids = ['b-web','b-mob','b-api','b-gw','b-svc','b-tok','b-queue','b-idp','b-db','b-fraud','b-kyc','b-3ds','b-proc','b-card','b-issuer','b-acq','b-ledger','b-notif','b-rec'];
  ids.forEach(id => setBadge(id, id.startsWith('b-web')||id.startsWith('b-mob')||id.startsWith('b-api') ? 'READY' : '—', 'idle'));
  document.getElementById('tx-feed').innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;padding:10px;">no transactions yet…</div>';
  document.getElementById('ledger-body').innerHTML = '';
  document.getElementById('log').innerHTML = '';
  document.getElementById('fraud-verdict').textContent = 'awaiting transaction…';
  document.getElementById('fraud-verdict').style.color = '';
  document.getElementById('tx-count').textContent = '0 txns';
  ['vel','geo','dev','amt','crd'].forEach(k => {
    document.getElementById('fs-' + k).style.width = '0%';
    document.getElementById('fv-' + k).textContent = '0';
  });
  document.getElementById('fraud-score-val').textContent = 'score: —';
  updateStats();
  addLog('li', '[System] Payment system reset — all clear');
}

/* ══ INIT ══ */
window.addEventListener('load', () => {
  setTimeout(() => { drawArrows(); }, 100);
  updateStats();
  addLog('li', '[System] Payment system initialized — PCI-DSS mode active');
  addLog('li', '[System] Click ▶ Auto Demo or a payment button to begin');
  toggleAuto();
});
window.addEventListener('resize', () => setTimeout(drawArrows, 100));
</script>
</body>
</html>
