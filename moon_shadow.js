// moon_shadow.js – all browser-side logic
// CONFIG, MAP_VAR are injected as globals by the inline <script> in the HTML.

// ── Inject styles ─────────────────────────────────────────────────────────────
document.head.insertAdjacentHTML('beforeend', `<style>
#pv-overlay{display:none;position:fixed;inset:0;z-index:20000;
  background:rgba(0,0,0,.45);align-items:center;justify-content:center;}
#pv-overlay.open{display:flex;}
#pv-overlay.portrait{background:transparent;justify-content:flex-end;
  align-items:stretch;pointer-events:none;}
#pv-box{background:#fff;border-radius:10px;overflow:hidden;
  display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.25);}
#pv-overlay.portrait #pv-box{pointer-events:all;border-radius:10px 0 0 10px;
  overflow-y:auto;}
#pv-canvaswrap{position:relative;line-height:0;}
/* Absolutely positioned so the canvas never drives the box's shrink-to-fit width */
#pv-profwrap{position:relative;flex:none;height:150px;background:#f8fafc;
  border-top:1px solid #e2e8f0;}
#pv-prof{position:absolute;inset:0;width:100%;height:100%;
  touch-action:pan-y;cursor:crosshair;}
#pv-canvas{display:block;}
#pv-hidden{display:none;position:absolute;bottom:10px;left:50%;transform:translateX(-50%);
  background:rgba(220,38,38,.9);color:#fff;font:600 12px/1.3 sans-serif;
  padding:6px 12px;border-radius:14px;pointer-events:none;white-space:nowrap;}
#pv-hidden.on{display:block;}
#pv-infobox{position:absolute;top:10px;left:10px;
  background:rgba(255,255,255,.82);color:#1e293b;
  font:12px/1.7 monospace;padding:8px 12px;border-radius:6px;
  pointer-events:none;white-space:pre;}
#pv-ctrl{display:flex;align-items:center;gap:10px;padding:7px 12px;
  background:#f1f5f9;color:#334155;font:13px/1.4 sans-serif;flex-wrap:wrap;
  border-top:1px solid #e2e8f0;}
#pv-ctrl label{display:flex;flex-direction:column;font-size:11px;gap:2px;}
#pv-ctrl select,#pv-ctrl input{background:#fff;color:#1e293b;
  border:1px solid #cbd5e1;border-radius:4px;padding:2px 5px;}
#pv-ctrl button{background:#3b82f6;color:#fff;border:none;
  border-radius:4px;padding:4px 10px;cursor:pointer;}
#pv-ctrl button:hover{background:#2563eb;}
#pv-ctrl button:disabled{opacity:.35;cursor:default;}
#pv-info{padding:4px 12px 6px;background:#f8fafc;color:#94a3b8;
  font:11px sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  border-top:1px solid #e2e8f0;}
#settings-hint{position:fixed;top:10px;right:52px;z-index:9999;
  background:rgba(30,41,59,.9);color:#fff;padding:7px 12px;
  border-radius:6px;font-family:sans-serif;font-size:13px;cursor:pointer;
  box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap;}
#settings-hint::after{content:'';position:absolute;top:50%;right:-8px;
  transform:translateY(-50%);border:5px solid transparent;
  border-left-color:rgba(30,41,59,.9);}
#obj-bar{position:fixed;top:10px;left:50%;transform:translateX(-50%);
  z-index:9998;background:rgba(255,255,255,.92);padding:4px 4px 4px 10px;
  border-radius:6px;box-shadow:1px 1px 4px rgba(0,0,0,.3);font:12px sans-serif;
  display:flex;align-items:center;gap:6px;max-width:calc(100vw - 150px);box-sizing:border-box;}
#obj-sel{min-width:0;max-width:260px;border:1px solid #ccc;border-radius:3px;
  padding:2px 5px;font-size:13px;background:#fff;color:#1e293b;}
#obj-edit{flex:none;border:none;background:none;cursor:pointer;font-size:15px;
  padding:2px 6px;border-radius:4px;}
#obj-edit:hover{background:#e2e8f0;}
.leaflet-container.obj-picking{cursor:crosshair;}
#df-bar{position:fixed;top:55px;left:50%;transform:translateX(-50%);
  z-index:9998;background:rgba(255,255,255,.92);padding:5px 14px;
  border-radius:6px;box-shadow:1px 1px 4px rgba(0,0,0,.3);
  font-family:sans-serif;font-size:12px;display:flex;align-items:center;gap:8px;}
#df-bar input[type=date]{border:1px solid #ccc;border-radius:3px;
  padding:2px 5px;font-size:12px;}
#calc-prog{display:none;position:fixed;top:95px;left:50%;transform:translateX(-50%);
  z-index:9998;background:rgba(255,255,255,.95);padding:6px 12px 8px;border-radius:6px;
  box-shadow:1px 1px 4px rgba(0,0,0,.3);font:12px sans-serif;color:#334155;
  width:260px;max-width:calc(100vw - 150px);box-sizing:border-box;}
#calc-prog.on{display:block;}
#calc-prog-txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px;}
#calc-prog-bar{height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;}
#calc-prog-fill{height:100%;width:0;background:#3b82f6;transition:width .15s linear;}
#status-badge{position:fixed;bottom:30px;left:10px;z-index:9999;
  background:rgba(255,255,255,.92);padding:6px 10px;border-radius:6px;
  box-shadow:1px 1px 4px rgba(0,0,0,.3);font:11px monospace;}
#settings-btn{position:fixed;top:10px;right:10px;z-index:9999;
  background:rgba(255,255,255,.92);border:none;border-radius:6px;
  padding:5px 9px;cursor:pointer;font-size:17px;line-height:1;
  box-shadow:1px 1px 4px rgba(0,0,0,.3);}
#settings-btn:hover{background:white;}
#gps-btn{position:fixed;top:48px;right:10px;z-index:9999;
  background:rgba(255,255,255,.92);border:none;border-radius:6px;
  padding:5px 9px;cursor:pointer;font-size:17px;line-height:1;color:#2563eb;
  box-shadow:1px 1px 4px rgba(0,0,0,.3);}
#gps-msg{display:none;position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
  z-index:30000;background:rgba(15,23,42,.92);color:#fff;padding:8px 14px;
  border-radius:6px;font:13px sans-serif;max-width:90vw;text-align:center;}
#pv-gps{display:none;position:absolute;left:8px;bottom:8px;
  background:rgba(15,23,42,.78);color:#fff;font:12px/1.2 sans-serif;
  padding:6px 10px;border-radius:14px;pointer-events:none;white-space:nowrap;}
#st-overlay,#ob-overlay{display:none;position:fixed;inset:0;z-index:21000;
  background:rgba(0,0,0,.45);align-items:center;justify-content:center;}
#st-overlay.open,#ob-overlay.open{display:flex;}
#st-box,#ob-box{background:#fff;color:#1e293b;border-radius:10px;padding:22px 24px;
  width:400px;max-width:92vw;box-shadow:0 8px 40px rgba(0,0,0,.25);
  font-family:sans-serif;font-size:13px;}
#st-box h3,#ob-box h3{margin:0 0 14px;font-size:14px;color:#0f172a;font-weight:600;}
#st-box h4{font-size:10px;color:#94a3b8;text-transform:uppercase;
  letter-spacing:.07em;margin:14px 0 6px;}
.st-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 14px;}
.st-grid label,.st-solo label{display:flex;flex-direction:column;
  font-size:11px;color:#64748b;gap:3px;}
.st-solo{margin-top:7px;}
#st-box input[type=number],#st-box input[type=date],#ob-box input{
  background:#f8fafc;color:#1e293b;border:1px solid #cbd5e1;
  border-radius:4px;padding:4px 7px;font-size:12px;width:100%;box-sizing:border-box;}
#st-footer,#ob-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:20px;}
#st-footer button,#ob-footer button{background:#3b82f6;color:#fff;border:none;
  border-radius:4px;padding:5px 16px;cursor:pointer;font-size:13px;}
#st-footer button:hover,#ob-footer button:hover{background:#2563eb;}
#st-cancel,#ob-cancel{background:#e2e8f0!important;color:#475569!important;}
#ob-del{background:#fee2e2!important;color:#b91c1c!important;margin-right:auto;}
#ob-box .ob-coords{display:flex;gap:6px;}
#ob-pick{flex:none;background:#e2e8f0;color:#334155;border:none;border-radius:4px;
  padding:0 10px;cursor:pointer;font-size:12px;white-space:nowrap;}
#ob-pick:hover{background:#cbd5e1;}
#ob-err{color:#b91c1c;font-size:12px;min-height:16px;margin-top:8px;}
@media(max-width:600px){
  #df-bar{display:none!important;}
  #calc-prog{top:62px;}
  #obj-bar{left:56px;right:66px;transform:none;max-width:none;}
  #obj-sel{flex:1;max-width:none;font-size:16px;}
  #obj-edit{font-size:20px;padding:6px 8px;}
  #settings-hint{top:62px;right:10px;}
  #settings-hint::after{top:-10px;right:18px;transform:none;
    border-left-color:transparent;border-bottom-color:rgba(30,41,59,.9);}
  #settings-btn{padding:10px 14px;font-size:20px;}
  #gps-btn{top:66px;padding:10px 14px;font-size:20px;}
  #st-overlay,#ob-overlay{align-items:flex-start;}
  #st-box,#ob-box{width:100vw;max-width:100vw;height:100dvh;border-radius:0;
    overflow-y:auto;padding:16px;box-sizing:border-box;}
  .st-grid{grid-template-columns:1fr;}
}
/* Mobile-only preview elements; .pv-grp wrappers are layout-neutral on desktop */
#pv-top,#pv-chip,#pv-wx,#pv-details,#pv-time,#pv-cam-toggle,.pv-fchips,#pv-nav{display:none;}
.pv-grp{display:contents;}
@media(max-width:600px),(max-height:500px){
  #pv-overlay{background:#0b1020;align-items:stretch;justify-content:stretch;}
  #pv-box{width:100vw;height:100dvh;border-radius:0;box-shadow:none;background:#0b1020;}
  #pv-top{display:flex;align-items:center;gap:8px;background:#0f172a;color:#f1f5f9;
    font:600 15px/1.3 sans-serif;
    padding:max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right))
      6px max(14px,env(safe-area-inset-left));}
  #pv-time-lbl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  #pv-close-m{flex:none;width:44px;height:44px;border:none;border-radius:22px;
    background:rgba(255,255,255,.14);color:#fff;font-size:20px;cursor:pointer;}
  #pv-profwrap{height:130px;}
  #pv-canvaswrap{flex:1 1 0;min-height:0;min-width:0;overflow:hidden;
    display:flex;align-items:center;justify-content:center;}
  #pv-infobox,#pv-info,#pv-offset,#pv-info-toggle,#pv-close,.pv-sep,.pv-long{display:none!important;}
  #pv-gps{font-size:13px;padding:8px 12px;border-radius:16px;}
  #pv-wx:not(:empty){display:block;position:absolute;top:50px;left:8px;
    background:rgba(15,23,42,.78);color:#fff;font:13px/1.2 sans-serif;
    padding:8px 12px;border-radius:16px;pointer-events:none;white-space:nowrap;}
  #pv-wx.uncertain{color:#cbd5e1;font-style:italic;}
  #pv-chip{display:block;position:absolute;top:8px;left:8px;border:none;border-radius:16px;
    background:rgba(15,23,42,.78);color:#fff;font:13px/1.2 sans-serif;padding:8px 12px;cursor:pointer;}
  #pv-ctrl{flex:none;max-height:50dvh;overflow-y:auto;flex-direction:column;
    align-items:stretch;flex-wrap:nowrap;gap:10px;font-size:15px;
    padding:10px max(12px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom))
      max(12px,env(safe-area-inset-left));}
  #pv-ctrl>*{flex-shrink:0;}
  #pv-ctrl .pv-grp{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap;}
  #pv-ctrl button,#pv-nav{min-height:44px;min-width:44px;padding:0 14px;font-size:15px;}
  #pv-ctrl label{font-size:12px;}
  #pv-ctrl select,#pv-ctrl input[type=number]{font-size:16px;min-height:40px;box-sizing:border-box;}
  #pv-g-time{order:1;flex-wrap:nowrap!important;align-items:center!important;}
  #pv-time{display:block;flex:1;min-width:0;height:44px;margin:0;accent-color:#3b82f6;}
  #pv-details{order:2;white-space:pre;font:12px/1.6 monospace;color:#1e293b;
    background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;overflow-x:auto;}
  #pv-ctrl.show-details #pv-details{display:block;}
  #pv-cam-toggle{display:block;order:3;text-align:left;background:#e2e8f0!important;color:#334155!important;}
  #pv-g-cam,#pv-g-bright{order:4;}
  #pv-ctrl:not(.cam-open) #pv-g-cam,#pv-ctrl:not(.cam-open) #pv-g-bright{display:none;}
  #pv-g-cam label{flex:1 1 100%;}
  #pv-focal{width:100%!important;}
  .pv-fchips{display:flex;gap:6px;flex:1;}
  #pv-ctrl .pv-fchip{flex:1;padding:0;background:#e2e8f0;color:#334155;}
  #pv-ctrl .pv-fchip.on{background:#3b82f6;color:#fff;}
  #pv-orient{flex:1 1 100%;}
  #pv-g-bright label{flex:1;flex-direction:row;font-size:15px!important;}
  #pv-bright{flex:1;width:auto!important;height:44px;}
  #pv-g-act{order:5;flex-wrap:nowrap!important;}
  #pv-ics,#pv-nav{flex:1;}
  #pv-nav{display:flex;align-items:center;justify-content:center;box-sizing:border-box;
    background:#16a34a;color:#fff;border-radius:4px;text-decoration:none;font-family:sans-serif;}
}
@media(max-height:500px) and (orientation:landscape){
  #pv-box{display:grid;grid-template-columns:minmax(0,1fr) min(340px,42vw);
    grid-template-rows:auto minmax(0,1fr) auto;}
  #pv-canvaswrap{grid-column:1;grid-row:1/3;}
  #pv-profwrap{grid-column:1;grid-row:3;height:96px;}
  #pv-top{grid-column:2;grid-row:1;}
  #pv-ctrl{grid-column:2;grid-row:2/4;max-height:none;}
}
</style>`);

// ── Inject modal HTML ─────────────────────────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div id="settings-hint">⚙ Change Settings here</div>
<div id="obj-bar">
 <select id="obj-sel" title="Object to photograph the moon behind"></select>
 <button id="obj-edit" title="Edit this object">&#x270E;</button>
</div>
<div id="df-bar">
 <span>Show:</span>
 <input type="date" id="df-start" min="2000-01-01" max="2179-12-31">
 <span>&#x2013;</span>
 <input type="date" id="df-end" min="2000-01-01" max="2179-12-31">
</div>
<div id="calc-prog">
 <div id="calc-prog-txt"></div>
 <div id="calc-prog-bar"><div id="calc-prog-fill"></div></div>
</div>
<div id="status-badge">Computing&#x2026;</div>
<button id="settings-btn" title="Settings">&#x2699;</button>
<button id="gps-btn" title="Center on my location" style="display:none">&#x25CE;</button>
<div id="gps-msg"></div>
<div id="st-overlay">
 <div id="st-box">
  <h3>Settings</h3>
  <h4>Time window</h4>
  <div class="st-grid">
   <label>Start<input id="st-start" type="date" min="2000-01-01" max="2179-12-31"></label>
   <label>End<input id="st-end" type="date" min="2000-01-01" max="2179-12-31"></label>
   <label>Step h<input id="st-step" type="number" step="0.25" min="0.25" max="24"></label>
  </div>
  <h4>Filters</h4>
  <div class="st-grid">
   <label>Min moon altitude &#xB0;<input id="st-minAlt" type="number" step="0.5"></label>
   <label>Min distance m<input id="st-minDist" type="number" step="100" min="0"></label>
   <label>Max sun altitude &#xB0;<input id="st-maxSun" type="number" step="0.5"></label>
   <label>Min moon illum %<input id="st-minIllum" type="number" step="1" min="0" max="100"></label>
  </div>
  <h4>Calculation</h4>
  <div class="st-solo">
   <label style="flex-direction:row;align-items:flex-start;gap:8px;cursor:pointer">
    <input id="st-refr" type="checkbox" style="margin:2px 0 0">
    <span>Atmospheric refraction<br>
     <small style="color:#9ca3af;font-size:10px">The air bends moonlight near the horizon, so the moon appears up to ~0.5&#xB0; higher than its geometric position. Recommended.</small></span>
   </label>
  </div>
  <h4>Display</h4>
  <div class="st-solo" style="margin-bottom:7px">
   <label style="flex-direction:row;align-items:flex-start;gap:8px;cursor:pointer">
    <input id="st-gps" type="checkbox" style="margin:2px 0 0">
    <span>Show my location (GPS)<br>
     <small style="color:#9ca3af;font-size:10px">For use in the field: shows where you are on the map and how far the selected spot is. Saved on this device only.</small></span>
   </label>
  </div>
  <div class="st-grid">
   <label style="grid-column:span 2">Timezone
    <input id="st-tz" type="text" placeholder="local" style="width:100%">
    <small style="color:#9ca3af;font-size:10px">&#x201C;local&#x201D; for browser timezone, or an IANA name like &#x201C;America/New_York&#x201D;, &#x201C;Europe/Berlin&#x201D;, &#x201C;UTC&#x201D;</small>
   </label>
  </div>
  <div id="st-footer">
   <button id="st-cancel">Cancel</button>
   <button id="st-ok">OK &#x2013; Recalculate</button>
  </div>
 </div>
</div>
<div id="ob-overlay">
 <div id="ob-box">
  <h3 id="ob-title"></h3>
  <div class="st-grid">
   <label style="grid-column:span 2">Name<input id="ob-name" type="text" maxlength="60" placeholder="e.g. Uetliberg lookout tower"></label>
   <label style="grid-column:span 2">Position (latitude, longitude)
    <span class="ob-coords">
     <input id="ob-coords" type="text" inputmode="decimal" autocomplete="off" placeholder="47.349540, 8.491359">
     <button id="ob-pick" type="button">&#x1F4CD; Pick on map</button>
    </span>
    <small style="color:#9ca3af;font-size:10px">Tap the object on the map, or paste coordinates, e.g. from Google Maps (right-click the spot and click the numbers to copy them).</small>
   </label>
   <label>Height m<input id="ob-h" type="number" step="1" min="1" max="9999"></label>
   <label>Width m<input id="ob-w" type="number" step="1" min="1" max="9999"></label>
  </div>
  <div id="ob-err"></div>
  <div id="ob-footer">
   <button id="ob-del">Delete</button>
   <button id="ob-cancel">Cancel</button>
   <button id="ob-ok">Save</button>
  </div>
 </div>
</div>
<div id="cb-wrap" style="position:fixed;bottom:30px;right:10px;z-index:9999;
  background:white;padding:6px 4px 4px 4px;border-radius:6px;
  box-shadow:2px 2px 6px rgba(0,0,0,.35);">
 <canvas id="cb-canvas" width="68" height="210"></canvas>
</div>
<div id="pv-overlay">
 <div id="pv-box">
  <div id="pv-top">
   <span id="pv-time-lbl"></span>
   <button id="pv-close-m" aria-label="Close">&#x2715;</button>
  </div>
  <div id="pv-canvaswrap">
   <canvas id="pv-canvas" width="800" height="500"></canvas>
   <div id="pv-infobox"></div>
   <button id="pv-chip"></button>
   <div id="pv-wx"></div>
   <div id="pv-gps"></div>
   <div id="pv-hidden"></div>
  </div>
  <div id="pv-profwrap"><canvas id="pv-prof"></canvas></div>
  <div id="pv-ctrl">
   <button id="pv-cam-toggle">&#x1F4F7; Camera &#x25B8;</button>
   <div class="pv-grp" id="pv-g-cam">
   <label>Sensor
    <select id="pv-sensor">
     <option value="36,24">Full Frame 36&#xD7;24 mm</option>
     <option value="23.5,15.6">APS-C 23.5&#xD7;15.6 mm</option>
     <option value="17.3,13">Micro 4/3 17.3&#xD7;13 mm</option>
     <option value="44,33">Medium Format 44&#xD7;33 mm</option>
    </select>
   </label>
   <label>Focal length (mm)
    <input id="pv-focal" type="number" value="400" min="10" max="2000" step="10" style="width:65px">
   </label>
   <span class="pv-fchips">
    <button class="pv-fchip" data-f="200">200</button>
    <button class="pv-fchip" data-f="400">400</button>
    <button class="pv-fchip" data-f="600">600</button>
    <button class="pv-fchip" data-f="800">800</button>
   </span>
   <button id="pv-orient">&#x2B1B; Landscape</button>
   </div>
   <span class="pv-sep" style="border-left:1px solid #374151;margin:0 2px;align-self:stretch;"></span>
   <div class="pv-grp" id="pv-g-time">
   <button id="pv-prev" title="Previous minute"><span class="pv-long">&#x25C4; </span>&#x2212;1<span class="pv-long"> min</span></button>
   <input id="pv-time" type="range" min="-15" max="15" step="1" value="0" aria-label="Time offset (minutes)">
   <span id="pv-offset" style="font-size:11px;min-width:40px;text-align:center;color:#9ca3af"></span>
   <button id="pv-next" title="Next minute">+1<span class="pv-long"> min &#x25BA;</span></button>
   </div>
   <span class="pv-sep" style="border-left:1px solid #374151;margin:0 2px;align-self:stretch;"></span>
   <div class="pv-grp" id="pv-g-bright">
   <label style="font-size:11px;color:#9ca3af;display:flex;align-items:center;gap:4px">&#x2600;&#xFE0F;
    <input id="pv-bright" type="range" min="1" max="4" value="1" step="0.1" style="width:80px;accent-color:#f59e0b">
    <span id="pv-bright-val" style="min-width:28px">&#xD7;1</span>
   </label>
   </div>
   <div id="pv-details"></div>
   <div class="pv-grp" id="pv-g-act">
   <button id="pv-info-toggle" style="margin-left:auto">&#x2139; Hide info</button>
   <button id="pv-ics">&#x1F4C5; Calendar</button>
   <a id="pv-nav" target="_blank" rel="noopener">&#x1F4CD; Navigate</a>
   <button id="pv-close">&#x2715; Close</button>
   </div>
  </div>
  <div id="pv-info">Click an arrow on the map to preview the scene from that location.</div>
 </div>
</div>`);

// ── Application ───────────────────────────────────────────────────────────────
(function(){

let TERRAIN=null;

// ── Terrain loader (AWS Terrarium tiles, zoom 10 ≈ 150 m/px at equator) ───────
async function loadTerrain(centerLat,centerLon,halfKm=10){
  const Z=12,N=1<<Z,TS=256;
  function lon2x(l){return Math.floor((l+180)/360*N);}
  function lat2y(l){const r=l*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*N);}
  function x2lon(x){return x/N*360-180;}
  function y2lat(y){const n=Math.PI-2*Math.PI*y/N;return 180/Math.PI*Math.atan(.5*(Math.exp(n)-Math.exp(-n)));}
  const R=6371000,buf=halfKm*1.25;
  const dlat=buf*1000/R*180/Math.PI;
  const dlon=buf*1000/(R*Math.cos(centerLat*Math.PI/180))*180/Math.PI;
  const tx0=lon2x(centerLon-dlon),tx1=lon2x(centerLon+dlon);
  const ty0=lat2y(centerLat+dlat),ty1=lat2y(centerLat-dlat);
  const tcols=tx1-tx0+1,trows=ty1-ty0+1;
  const cols=tcols*TS,rows=trows*TS;
  const oc=document.createElement('canvas');
  oc.width=cols;oc.height=rows;
  const ctx2=oc.getContext('2d');
  await Promise.all(Array.from({length:tcols*trows},(_,i)=>{
    const tx=tx0+i%tcols,ty=ty0+Math.floor(i/tcols);
    return new Promise(res=>{
      const img=new Image();img.crossOrigin='anonymous';
      img.onload=()=>{ctx2.drawImage(img,(tx-tx0)*TS,(ty-ty0)*TS);res();};
      img.onerror=res;
      img.src=`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`;
    });
  }));
  const px=ctx2.getImageData(0,0,cols,rows).data;
  const data=new Array(rows*cols);
  // tile pixel row 0 = north; TERRAIN row 0 = south → flip vertically
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const py=rows-1-r,i=(py*cols+c)*4;
    const e=px[i]*256+px[i+1]+px[i+2]/256-32768;
    data[r*cols+c]=Math.round(e<-500?0:e);
  }
  const latN=y2lat(ty0),latS=y2lat(ty1+1);
  return{originLat:latS,originLon:x2lon(tx0),
         stepLat:(latN-latS)/rows,stepLon:(x2lon(tx1+1)-x2lon(tx0))/cols,
         rows,cols,data};
}

// ── Geo helpers ───────────────────────────────────────────────────────────────
// Catmull-Rom cubic along one axis (4 control points, t in [0,1])
function _cr(p0,p1,p2,p3,t){
  const t2=t*t,t3=t2*t;
  return 0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);
}
// Bicubic Catmull-Rom: smooth C1-continuous surface through every SRTM data point
function sampleGrid(lat,lon){
  if(!TERRAIN)return 0;
  const fx=(lon-TERRAIN.originLon)/TERRAIN.stepLon;
  const fy=(lat-TERRAIN.originLat)/TERRAIN.stepLat;
  const ix=Math.floor(fx),iy=Math.floor(fy);
  if(ix<0||ix>=TERRAIN.cols-1||iy<0||iy>=TERRAIN.rows-1)return 0;
  const tx=fx-ix,ty=fy-iy;
  const C=TERRAIN.cols,R=TERRAIN.rows,D=TERRAIN.data;
  function g(r,c){return D[Math.max(0,Math.min(R-1,r))*C+Math.max(0,Math.min(C-1,c))];}
  const r0=_cr(g(iy-1,ix-1),g(iy-1,ix),g(iy-1,ix+1),g(iy-1,ix+2),tx);
  const r1=_cr(g(iy  ,ix-1),g(iy  ,ix),g(iy  ,ix+1),g(iy  ,ix+2),tx);
  const r2=_cr(g(iy+1,ix-1),g(iy+1,ix),g(iy+1,ix+1),g(iy+1,ix+2),tx);
  const r3=_cr(g(iy+2,ix-1),g(iy+2,ix),g(iy+2,ix+1),g(iy+2,ix+2),tx);
  return _cr(r0,r1,r2,r3,ty);
}
function haversine(la1,lo1,la2,lo2){
  const R=6371000,r=Math.PI/180;
  const dlat=(la2-la1)*r,dlon=(lo2-lo1)*r;
  const a=Math.sin(dlat/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dlon/2)**2;
  return R*2*Math.asin(Math.sqrt(a));
}
function bearing(la1,lo1,la2,lo2){
  const r=Math.PI/180,dlon=(lo2-lo1)*r;
  const x=Math.sin(dlon)*Math.cos(la2*r);
  const y=Math.cos(la1*r)*Math.sin(la2*r)-Math.sin(la1*r)*Math.cos(la2*r)*Math.cos(dlon);
  return((Math.atan2(x,y)*180/Math.PI)+360)%360;
}

// ── Skyline ───────────────────────────────────────────────────────────────────
// Maximum terrain elevation angle along one azimuth: over the whole range, and
// over the terrain closer than nearD only (what stands in front of the object).
function maxElevAngle(la,lo,oe,azDeg,nearD){
  const r=Math.PI/180,ca=Math.cos(azDeg*r),sa=Math.sin(azDeg*r);
  const cl=Math.cos(la*r);
  let mx=-30,near=-30;
  for(let d=50;d<=14000;d+=50){
    const e=sampleGrid(la+(d*ca)/111111,lo+(d*sa)/(111111*cl));
    const a=Math.atan2(e-oe,d)*180/Math.PI;
    if(a>mx)mx=a;
    if(d<nearD&&a>near)near=a;
  }
  return[mx,near];
}
// Two rows of n samples: the full skyline, then the skyline in front of the object.
function computeSkyline(la,lo,oe,camAz,hFov,n,nearD){
  const sl=new Float32Array(2*n);
  for(let i=0;i<n;i++)
    [sl[i],sl[n+i]]=maxElevAngle(la,lo,oe,camAz-hFov/2+(i/(n-1))*hFov,nearD);
  return sl;
}

// ── Line of sight to the object ───────────────────────────────────────────────
// Whether the point at fraction hf of the object's height can be seen from an
// eye EYE_H above the ground at (la,lo), i.e. no terrain rises above the
// straight sight line. Bare-earth terrain only, like everything else here.
const EYE_H=1.5;
function objectVisible(la,lo,hf){
  const dist=haversine(la,lo,CONFIG.objLat,CONFIG.objLon);
  const step=CONFIG.shadowStepM;
  const oe=sampleGrid(la,lo)+EYE_H,te=CONFIG.objElev+CONFIG.objH*hf;
  const dLat=CONFIG.objLat-la,dLon=CONFIG.objLon-lo;
  for(let d=step;d<dist-step;d+=step){
    const t=d/dist;
    if(sampleGrid(la+dLat*t,lo+dLon*t)>oe+(te-oe)*t)return false;
  }
  return true;
}

// ── WebGL setup ───────────────────────────────────────────────────────────────
const canvas=document.getElementById('pv-canvas');
const gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
let prog,skyTex,uL={},glReady=false;

const VERT=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FRAG=`precision mediump float;
uniform vec2 uRes;
uniform float uCamAz,uCamEl,uHFov,uVFov;
uniform float uMoonAz,uMoonAlt,uMoonRad,uMoonK,uSunAz,uSunAlt;
uniform float uObjAz,uObjElC,uObjHH,uObjHW;
uniform float uSkyB,uBright,uBlink,uHatch;
uniform sampler2D uSL;
float wd(float a,float b){return mod(a-b+180.,360.)-180.;}
void main(){
  vec2 ndc=(gl_FragCoord.xy/uRes)*2.-1.;
  float pAz=uCamAz+ndc.x*uHFov*.5;
  float pEl=uCamEl+ndc.y*uVFov*.5;
  float slEl=texture2D(uSL,vec2((ndc.x+1.)*.5,.25)).r*120.-30.;
  float nearEl=texture2D(uSL,vec2((ndc.x+1.)*.5,.75)).r*120.-30.;
  bool ter=pEl<slEl;
  float t=clamp((pEl+5.)/50.,0.,1.);
  vec3 hc=mix(vec3(.05,.04,.02),vec3(.08,.13,.30),uSkyB);
  vec3 zc=mix(vec3(.01,.01,.07),vec3(.02,.04,.20),uSkyB);
  vec3 col=ter?vec3(.12,.09,.07):mix(hc,zc,t);
  float daz=wd(pAz,uMoonAz),del=pEl-uMoonAlt,md=sqrt(daz*daz+del*del);
  if(!ter){
    float r=md/uMoonRad;
    vec2 toSun=vec2(wd(uSunAz,uMoonAz),uSunAlt-uMoonAlt);
    float tsl=length(toSun);if(tsl>.001)toSun/=tsl;else toSun=vec2(1.,0.);
    vec2 uv=vec2(daz,del)/uMoonRad;
    float u=dot(uv,toSun);
    float vp=uv.x*toSun.y-uv.y*toSun.x;
    float phase=1.-2.*uMoonK;
    float termX=phase*sqrt(max(0.,1.-vp*vp));
    float lit=smoothstep(-.05,.05,u-termX)*smoothstep(1.05,.92,r);
    col=mix(col,vec3(1.,.97,.76),lit);
    col+=vec3(.9,.85,.5)*exp(-md/(uMoonRad*3.))*.08;
  }
  float oaz=wd(pAz,uObjAz),oel=pEl-uObjElC;
  if(abs(oaz)<uObjHW&&abs(oel)<uObjHH){
    if(pEl>=nearEl)col=vec3(.04,.04,.04);
    else{
      // Hidden behind terrain in front of it: a blinking red hatched ghost
      float on=smoothstep(.2,.8,.5+.5*sin(uBlink*6.2832));
      float hatch=step(.5,fract((gl_FragCoord.x+gl_FragCoord.y)/uHatch));
      col=mix(col,vec3(1.,.15,.1),on*(.3+.5*hatch));
    }
  }
  gl_FragColor=vec4(col*uBright,1.);
}`;

function mkShader(type,src){
  const s=gl.createShader(type);
  gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))
    console.error('Shader:',gl.getShaderInfoLog(s));
  return s;
}
let glFloatTex=false;
function initGL(){
  if(glReady)return;
  prog=gl.createProgram();
  gl.attachShader(prog,mkShader(gl.VERTEX_SHADER,VERT));
  gl.attachShader(prog,mkShader(gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(prog);gl.useProgram(prog);
  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const ap=gl.getAttribLocation(prog,'p');
  gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
  const extFloat=gl.getExtension('OES_texture_float');
  const extFloatLin=extFloat&&gl.getExtension('OES_texture_float_linear');
  glFloatTex=!!extFloat;
  skyTex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,skyTex);
  const filter=extFloatLin?gl.LINEAR:gl.NEAREST;
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  ['uRes','uCamAz','uCamEl','uHFov','uVFov','uMoonAz','uMoonAlt','uMoonRad',
   'uMoonK','uSunAz','uSunAlt',
   'uObjAz','uObjElC','uObjHH','uObjHW','uSkyB','uBright','uBlink','uHatch','uSL']
    .forEach(n=>uL[n]=gl.getUniformLocation(prog,n));
  gl.uniform1i(uL.uSL,0);
  glReady=true;
}
function uploadSL(sl){
  gl.bindTexture(gl.TEXTURE_2D,skyTex);
  const w=sl.length/2;
  if(glFloatTex){
    const f=new Float32Array(sl.length);
    for(let i=0;i<sl.length;i++)f[i]=(sl[i]+30)/120;
    gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,w,2,0,
                  gl.LUMINANCE,gl.FLOAT,f);
  }else{
    const b=new Uint8Array(sl.length);
    for(let i=0;i<sl.length;i++)
      b[i]=Math.max(0,Math.min(255,Math.round((sl[i]+30)/120*255)));
    gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,w,2,0,
                  gl.LUMINANCE,gl.UNSIGNED_BYTE,b);
  }
}
// While part of the object is hidden, redraw every frame so it blinks.
let objHidden=false,blinkRAF=0;
function drawScene(){
  gl.uniform1f(uL.uBlink,(performance.now()/1000)%1);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}
function blinkLoop(){
  blinkRAF=0;
  if(!objHidden||!document.getElementById('pv-overlay').classList.contains('open'))return;
  drawScene();
  blinkRAF=requestAnimationFrame(blinkLoop);
}

// ── Camera + navigation controls ──────────────────────────────────────────────
let portrait=false,lastArgs=null;
// curBaseMS is the best shot time for the clicked spot (slider centre);
// curMins holds the moon track for curBaseMS ±15 min.
let curOffset=0,curArrow=null,curLa=0,curLo=0,curBaseMS=0,curMins=null;

const MOBILE_MQ=window.matchMedia('(max-width:600px),(max-height:500px)');
function isMobile(){return MOBILE_MQ.matches;}
function updateNavUI(){
  document.getElementById('pv-prev').disabled=(curOffset<=-15);
  document.getElementById('pv-next').disabled=(curOffset>=15);
  document.getElementById('pv-offset').textContent=curMins[curOffset+15][5].split(' ')[1];
  document.getElementById('pv-time').value=curOffset;
}
function setOffset(n){
  n=Math.max(-15,Math.min(15,n));
  if(n!==curOffset){curOffset=n;render(curLa,curLo,curArrow);}
}
document.getElementById('pv-prev').onclick=()=>setOffset(curOffset-1);
document.getElementById('pv-next').onclick=()=>setOffset(curOffset+1);
document.getElementById('pv-time').addEventListener('input',function(){
  setOffset(parseInt(this.value));
});
// The desktop side-panel portrait layout doesn't fit a phone; there portrait
// just makes the canvas taller.
function applyPortraitClass(){
  document.getElementById('pv-overlay').classList.toggle('portrait',portrait&&!isMobile());
}
document.getElementById('pv-chip').onclick=()=>
  document.getElementById('pv-ctrl').classList.toggle('show-details');
document.getElementById('pv-cam-toggle').onclick=function(){
  const open=document.getElementById('pv-ctrl').classList.toggle('cam-open');
  this.textContent='\u{1F4F7} Camera '+(open?'▾':'▸');
};
function updateFocalChips(){
  const f=document.getElementById('pv-focal').value;
  document.querySelectorAll('.pv-fchip').forEach(b=>b.classList.toggle('on',b.dataset.f===f));
}
document.querySelectorAll('.pv-fchip').forEach(b=>b.onclick=function(){
  document.getElementById('pv-focal').value=this.dataset.f;
  if(lastArgs)render(...lastArgs);
});
// Re-fit the canvas when the phone rotates or the control panel grows/shrinks.
let _resizeRAF=0;
function onPreviewResize(){
  if(_resizeRAF)return;
  _resizeRAF=requestAnimationFrame(()=>{
    _resizeRAF=0;
    if(!lastArgs||!document.getElementById('pv-overlay').classList.contains('open'))return;
    applyPortraitClass();
    render(...lastArgs);
  });
}
window.addEventListener('resize',onPreviewResize);
if(window.ResizeObserver)
  new ResizeObserver(onPreviewResize).observe(document.getElementById('pv-canvaswrap'));
function navURL(la,lo){
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return ios?'https://maps.apple.com/?daddr='+la+','+lo:
    'https://www.google.com/maps/dir/?api=1&destination='+la+','+lo;
}
document.getElementById('pv-orient').onclick=function(){
  portrait=!portrait;
  this.textContent=portrait?'⬜ Portrait':'⬛ Landscape';
  applyPortraitClass();
  if(lastArgs)render(...lastArgs);
};
document.getElementById('pv-info-toggle').onclick=function(){
  const ib=document.getElementById('pv-infobox');
  const hidden=ib.style.display==='none';
  ib.style.display=hidden?'':'none';
  this.textContent=hidden?'ℹ Hide info':'ℹ Show info';
};
['pv-focal','pv-sensor'].forEach(id=>
  document.getElementById(id).addEventListener('input',()=>{
    if(lastArgs)render(...lastArgs);
  }));
document.getElementById('pv-bright').addEventListener('input',function(){
  document.getElementById('pv-bright-val').textContent='\xD7'+this.value;
  if(lastArgs)render(...lastArgs);
});
document.getElementById('pv-close').onclick=
document.getElementById('pv-close-m').onclick=()=>
  document.getElementById('pv-overlay').classList.remove('open');

document.getElementById('pv-ics').onclick=function(){
  const tMS=curBaseMS+curOffset*60000;
  const mm=curMins[curOffset+15];
  function icsDate(ms){
    const d=new Date(ms),p=n=>String(n).padStart(2,'0');
    return d.getUTCFullYear()+p(d.getUTCMonth()+1)+p(d.getUTCDate())+
           'T'+p(d.getUTCHours())+p(d.getUTCMinutes())+'00Z';
  }
  const dist=Math.round(haversine(curLa,curLo,CONFIG.objLat,CONFIG.objLon));
  const shotURL=buildShotURL(curLa,curLo,tMS);
  // RFC 5545 text escaping
  const icsText=t=>t.replace(/[\\;,]/g,'\\$&').replace(/\n/g,'\\n');
  const desc=
    'Shooting location: '+curLa.toFixed(5)+'\xB0N, '+curLo.toFixed(5)+'\xB0E\\n'+
    'Object: '+CONFIG.objLat.toFixed(5)+'\xB0N, '+CONFIG.objLon.toFixed(5)+'\xB0E  H='+CONFIG.objH+'m\\n'+
    'Distance to object: '+dist+' m\\n'+
    'Moon: alt='+mm[0].toFixed(1)+'\xB0  az='+mm[1].toFixed(1)+'\xB0  illum='+mm[2].toFixed(0)+'%\\n'+
    'Open in Luna: '+shotURL;
  const uid=tMS+'-'+Math.random().toString(36).slice(2)+'@luna';
  const ics=[
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Luna//Moon Photography Planner//EN',
    'BEGIN:VEVENT',
    'UID:'+uid,
    'DTSTART:'+icsDate(tMS-15*60000),
    'DTEND:'+icsDate(tMS+15*60000),
    'SUMMARY:'+icsText('🌙 Moon behind '+objById(selObjId).name),
    'DESCRIPTION:'+desc,
    'LOCATION:'+curLa.toFixed(5)+','+curLo.toFixed(5),
    'URL:'+shotURL,
    'END:VEVENT','END:VCALENDAR',
  ].join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
  a.download='moon-photo.ics';a.click();
  URL.revokeObjectURL(a.href);
};

// ── Info overlay ──────────────────────────────────────────────────────────────
function updateInfoBox(la,lo,oe,dist,mm){
  const [mAlt,mAz,mIllum,sAlt,,tStr]=mm;
  const wx=weatherAt(curBaseMS+curOffset*60000);
  document.getElementById('pv-infobox').textContent=[
    '\u{1F550} '+tStr, '',
    '\u{1F4CD} Observer',
    '   lat '+la.toFixed(5)+'\xB0  lon '+lo.toFixed(5)+'\xB0',
    '   elevation '+Math.round(oe)+' m', '',
    '\u{1F5FC} '+objById(selObjId).name,
    '   lat '+CONFIG.objLat.toFixed(5)+'\xB0  lon '+CONFIG.objLon.toFixed(5)+'\xB0',
    '   base elev '+Math.round(CONFIG.objElev)+' m  height '+CONFIG.objH+' m',
    '   distance '+Math.round(dist)+' m', '',
    '\u{1F319} Moon',
    '   altitude  '+mAlt.toFixed(2)+'\xB0',
    '   azimuth   '+mAz.toFixed(2)+'\xB0',
    '   illum.    '+mIllum.toFixed(1)+'%', '',
    '☀️ Sun altitude  '+sAlt.toFixed(2)+'\xB0',
    ...wxInfoLines(wx),
  ].join('\n');
  // Mobile: time in the top bar, a one-line summary chip over the canvas, and
  // the details (minus the already-known object position) below the canvas.
  document.getElementById('pv-time-lbl').textContent=tStr;
  const km=dist>=1000?(dist/1000).toFixed(1)+' km':Math.round(dist)+' m';
  document.getElementById('pv-chip').textContent=
    '\u{1F319} '+mAlt.toFixed(1)+'\xB0 \xB7 '+Math.round(mIllum)+'% \xB7 '+km+'  ℹ';
  document.getElementById('pv-details').textContent=[
    '\u{1F4CD} You   '+la.toFixed(5)+', '+lo.toFixed(5),
    '        elev '+Math.round(oe)+' m, '+Math.round(dist)+' m to object',
    '\u{1F319} Moon  alt '+mAlt.toFixed(2)+'\xB0  az '+mAz.toFixed(2)+'\xB0',
    '        illum '+mIllum.toFixed(1)+'%',
    '☀️ Sun   alt '+sAlt.toFixed(2)+'\xB0',
    ...wxInfoLines(wx),
  ].join('\n');
  const wxEl=document.getElementById('pv-wx');
  wxEl.textContent=wx?wxShort(wx):'';
  wxEl.classList.toggle('uncertain',!!(wx&&wx.uncertain));
}
function getCam(){
  const f=parseFloat(document.getElementById('pv-focal').value)||400;
  const [sw,sh]=document.getElementById('pv-sensor').value.split(',').map(Number);
  const [w,h]=portrait?[sh,sw]:[sw,sh];
  return{hFov:2*Math.atan(w/2/f)*180/Math.PI,
         vFov:2*Math.atan(h/2/f)*180/Math.PI,
         aspect:w/h};
}

// ── Moon position (Meeus Ch.47, topocentric, optional refraction) ─────────────
// Atmospheric refraction lifts a body's apparent altitude: ~0.5° at the
// horizon, ~0.1° at 8°. Sæmundsson's formula (Meeus eq. 16.4) for 10 °C and
// 1010 hPa, with pressure scaled down for elevation.
function refractionDeg(h,elevM){
  if(!CONFIG.refraction||h<-2)return 0;
  const R=1.02/Math.tan((h+10.3/(h+5.11))*Math.PI/180)/60;
  return Math.max(0,R)*Math.exp(-elevM/8434);
}
function moonAltAzJS(lat,lon,elevM,utcStr){
  const DEG=Math.PI/180;
  function norm(x){return((x%360)+360)%360;}
  const d=new Date(utcStr.indexOf('UTC')>=0
    ?utcStr.replace(' UTC','').replace(' ','T')+'Z':utcStr);
  const JD=d.getTime()/86400000+2440587.5;
  const T=(JD-2451545.0)/36525;
  const L1=norm(218.3164477+481267.88123421*T);
  const D =norm(297.8501921+445267.1114034 *T);
  const M =norm(357.5291092+35999.0502909  *T);
  const Mp=norm(134.9633964+477198.8675055 *T);
  const F =norm( 93.2720950+483202.0175233 *T);
  const Dr=D*DEG,Mr=M*DEG,Mpr=Mp*DEG,Fr=F*DEG;
  const E=1-0.002516*T-0.0000074*T*T;
  const LT=[
    [6288774,0,0,1,0],[1274027,2,0,-1,0],[658314,2,0,0,0],[213618,0,0,2,0],
    [-185116,0,1,0,0],[-114332,0,0,0,2],[58793,2,0,-2,0],[57066,2,-1,-1,0],
    [53322,2,0,1,0],[45758,2,-1,0,0],[-40923,0,1,-1,0],[-34720,1,0,0,0],
    [-30383,0,1,1,0],[15327,2,0,0,-2],[-12528,0,0,1,2],[10980,0,0,1,-2],
    [10675,4,0,-1,0],[10034,0,0,3,0],[8548,4,0,-2,0],[-7888,2,1,-1,0],
    [-6766,2,1,0,0],[-5163,1,0,-1,0],[4987,1,1,0,0],[4036,2,-1,1,0],
    [3994,2,0,2,0],[3861,4,0,0,0],[3665,2,0,-3,0],[-2689,0,1,-2,0],
    [-2602,2,0,-1,2],[2390,2,-1,-2,0],[-2348,1,0,1,0],[2236,2,-2,0,0],
    [-2120,0,1,2,0],[-2069,0,2,0,0],[2048,2,-2,-1,0],[-1773,2,0,1,-2],
    [-1595,2,0,0,2],[1215,4,-1,-1,0],[-1110,0,0,2,2],[-892,3,0,-1,0],
    [-810,2,1,1,0],[759,4,-1,-2,0],[-713,0,2,-1,0],[-700,2,2,-1,0],
    [691,2,1,-2,0],[596,2,-1,0,-2],[549,4,0,1,0],[537,0,0,4,0],
    [520,4,-1,0,0],[-487,1,0,-2,0],[-399,2,1,0,-2],[-381,0,0,2,-2],
    [351,1,1,1,0],[-340,3,0,-2,0],[330,4,0,-3,0],[327,2,-1,2,0],
    [-323,0,2,1,0],[299,1,1,-1,0],[294,2,0,3,0],
  ];
  const BT=[
    [5128122,0,0,0,1],[280602,0,0,1,1],[277693,0,0,1,-1],[173237,2,0,0,-1],
    [55413,2,0,-1,1],[46271,2,0,-1,-1],[32573,2,0,0,1],[17198,0,0,2,1],
    [9266,2,0,1,-1],[8822,0,0,2,-1],[8216,2,-1,0,-1],[4324,2,0,-2,-1],
    [4200,2,0,1,1],[-3359,2,1,0,-1],[2463,2,-1,-1,1],[2211,2,-1,0,1],
    [2065,2,-1,-1,-1],[-1870,0,1,-1,-1],[1828,4,0,-1,-1],[-1794,0,1,0,1],
  ];
  const RT=[
    [-20905355,0,0,1,0],[-3699111,2,0,-1,0],[-2955968,2,0,0,0],
    [-569925,0,0,2,0],[48888,0,1,0,0],[-3149,0,0,0,2],
    [246158,2,0,-2,0],[-152138,2,-1,-1,0],[-170733,2,0,1,0],
    [-204586,2,-1,0,0],[-129620,0,1,-1,0],[108743,1,0,0,0],
    [104755,0,1,1,0],[10321,2,0,0,-2],[79661,0,0,1,-2],
  ];
  let sl=0,sb=0,sr=0;
  function ec(m){return Math.abs(m)===2?E*E:Math.abs(m)===1?E:1;}
  LT.forEach(([c,d2,m,mp,f])=>{sl+=ec(m)*c*Math.sin(d2*Dr+m*Mr+mp*Mpr+f*Fr);});
  BT.forEach(([c,d2,m,mp,f])=>{sb+=ec(m)*c*Math.sin(d2*Dr+m*Mr+mp*Mpr+f*Fr);});
  RT.forEach(([c,d2,m,mp,f])=>{sr+=ec(m)*c*Math.cos(d2*Dr+m*Mr+mp*Mpr+f*Fr);});
  const HPdeg=Math.asin(6378.14/(385000.56+sr/1e3))/DEG;
  const eps=(23.4392911-0.013004*T)*DEG;
  const lonE=(L1+sl/1e6)*DEG,latB=sb/1e6*DEG;
  const ra =Math.atan2(Math.sin(lonE)*Math.cos(eps)-Math.tan(latB)*Math.sin(eps),Math.cos(lonE));
  const dec=Math.asin(Math.sin(latB)*Math.cos(eps)+Math.cos(latB)*Math.sin(eps)*Math.sin(lonE));
  const JD0=Math.floor(JD+0.5)-0.5,UT=(JD-JD0)*24,T0=(JD0-2451545.0)/36525;
  const GMST=((6.697374558+2400.0513369*T0+0.0000258622*T0*T0+UT*1.00273791)%24+24)%24;
  const HA=((GMST*15+lon-ra/DEG)%360+360)%360*DEG;
  const latr=lat*DEG;
  const sinAlt=Math.sin(latr)*Math.sin(dec)+Math.cos(latr)*Math.cos(dec)*Math.cos(HA);
  const altGeo=Math.asin(Math.max(-1,Math.min(1,sinAlt)))/DEG;
  const altTopo=altGeo-HPdeg*Math.cos(altGeo*DEG);
  const altDeg=altTopo+refractionDeg(altTopo,elevM);
  const azRad=Math.atan2(-Math.cos(dec)*Math.sin(HA),
                          Math.sin(dec)*Math.cos(latr)-Math.cos(dec)*Math.cos(HA)*Math.sin(latr));
  const azDeg=((azRad/DEG)%360+360)%360;
  const sunMr=((357.52911+35999.05029*T)%360+360)%360*DEG;
  const sunC=(1.914602-0.004817*T)*Math.sin(sunMr)+0.019993*Math.sin(2*sunMr);
  const sunLon=((280.46646+36000.76983*T+sunC)%360+360)%360*DEG;
  const sunRA=Math.atan2(Math.cos(eps)*Math.sin(sunLon),Math.cos(sunLon));
  const sunDec=Math.asin(Math.sin(eps)*Math.sin(sunLon));
  const sunHA=((GMST*15+lon-sunRA/DEG)%360+360)%360*DEG;
  const ssinAlt=Math.sin(latr)*Math.sin(sunDec)+Math.cos(latr)*Math.cos(sunDec)*Math.cos(sunHA);
  const sunAltGeo=Math.asin(Math.max(-1,Math.min(1,ssinAlt)))/DEG;
  const sunAltDeg=sunAltGeo+refractionDeg(sunAltGeo,elevM);
  const sunAzRad=Math.atan2(-Math.cos(sunDec)*Math.sin(sunHA),
                             Math.sin(sunDec)*Math.cos(latr)-Math.cos(sunDec)*Math.cos(sunHA)*Math.sin(latr));
  const sunAzDeg=((sunAzRad/DEG)%360+360)%360;
  const cosElong=Math.sin(sunDec)*Math.sin(dec)+Math.cos(sunDec)*Math.cos(dec)*Math.cos(sunRA-ra);
  return{altDeg,azDeg,illPct:(1-cosElong)/2*100,sunAltDeg,sunAzDeg};
}

// ── Shadow point (terrain ray-march) ──────────────────────────────────────────
// Traces a ray from a given fraction of the object's height, in the anti-moon
// direction (moonAzDeg + 180°), and finds where it meets the terrain — same
// method as the original tip-only calculation, generalized to any height.
const MOON_RADIUS_DEG=0.26; // apparent angular radius of the moon
function computeShadowPoint(moonAltDeg,moonAzDeg,heightFrac){
  const DEG=Math.PI/180,R=6371000;
  if(moonAltDeg<=0)return null;
  const tanAlt=Math.tan(moonAltDeg*DEG);
  const shadowAzRad=((moonAzDeg+180)%360)*DEG;
  const sinAz=Math.sin(shadowAzRad),cosAz=Math.cos(shadowAzRad);
  const cosLat=Math.cos(CONFIG.objLat*DEG);
  const targetH=CONFIG.objH*heightFrac;
  const rayAlt0=CONFIG.objElev+targetH;
  const maxD=(rayAlt0/tanAlt)*1.5;
  let prevD=0,prevGap=targetH;
  for(let d=CONFIG.shadowStepM;d<=maxD;d+=CONFIG.shadowStepM){
    const lat=CONFIG.objLat+d*cosAz/(R*DEG);
    const lon=CONFIG.objLon+d*sinAz/(R*cosLat*DEG);
    const gap=(rayAlt0-d*tanAlt)-sampleGrid(lat,lon);
    if(gap<=0){
      const t=prevGap/(prevGap-gap),hitD=prevD+t*CONFIG.shadowStepM;
      return[CONFIG.objLat+hitD*cosAz/(R*DEG),
             CONFIG.objLon+hitD*sinAz/(R*cosLat*DEG)];
    }
    prevD=d;prevGap=gap;
  }
  const flatD=targetH/tanAlt;
  return[CONFIG.objLat+flatD*cosAz/(R*DEG),
         CONFIG.objLon+flatD*sinAz/(R*cosLat*DEG)];
}
// The ten height levels an object's silhouette is sampled at: 10%-90% plus
// the original full-height tip.
const HEIGHT_FRACTIONS=[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0];

// ── URL state ─────────────────────────────────────────────────────────────────
// Binary layout (22 bytes base, +12 for shot links):
//   0-3  int32  lat  × 1e6       4-7  int32  lon  × 1e6
//   8-9  uint16 h(m)             10-11 uint16 w(m)
//   12   uint8  step × 4         13   int8   minAlt × 2
//   14-15 uint16 minDist(m)      16   int8   maxSun × 2
//   17   uint8  minIllum         18-19 uint16 start(days since 2000-01-01)
//   20-21 uint16 end(days)       [22-25 int32 sLat×1e5  26-29 int32 sLon×1e5
//                                  30-33 uint32 shot(Unix s)]
//   [last byte uint8 flags, only when non-default: bit 0 = refraction off;
//    total length 23 or 35]
// Timezone appended as ".IANA_name" when non-default.
const LUNA_BASE='https://tim0s.github.io/Luna/';
const _EPOCH=Date.UTC(2000,0,1);
function _encodeHash(extra){
  const C=CONFIG,hasShot=extra&&extra.shot!=null;
  const flags=C.refraction===false?1:0;
  const buf=new ArrayBuffer((hasShot?34:22)+(flags?1:0));
  const v=new DataView(buf);
  const startMS=new Date(extra&&extra.startISO||C.startISO).getTime();
  const endMS  =new Date(extra&&extra.endISO  ||C.endISO  ).getTime();
  v.setInt32(0,  Math.round(C.objLat*1e6));
  v.setInt32(4,  Math.round(C.objLon*1e6));
  v.setUint16(8, C.objH||0);
  v.setUint16(10,C.objW||0);
  v.setUint8(12, Math.round(C.stepH*4));
  v.setInt8(13,  Math.round(C.minAltDeg*2));
  v.setUint16(14,C.minDistM||0);
  v.setInt8(16,  Math.round(C.maxSunAltDeg*2));
  v.setUint8(17, C.minMoonIllumPct||0);
  v.setUint16(18,Math.floor((startMS-_EPOCH)/86400000));
  v.setUint16(20,Math.floor((endMS  -_EPOCH)/86400000));
  if(hasShot){
    v.setInt32(22, Math.round(extra.sLat*1e5));
    v.setInt32(26, Math.round(extra.sLon*1e5));
    v.setUint32(30,Math.floor(extra.shot/1000));
  }
  if(flags)v.setUint8(buf.byteLength-1,flags);
  const bytes=new Uint8Array(buf);
  let bin='';for(let i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);
  const b64=btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const tz=(C.timezone&&C.timezone!=='local')?'.'+C.timezone:'';
  return b64+tz;
}
function syncURL(){
  history.replaceState(null,'','#'+_encodeHash());
}
function buildShotURL(sLat,sLon,tMS){
  const d0=new Date(tMS-2*86400000).toISOString().slice(0,10);
  const d1=new Date(tMS+2*86400000).toISOString().slice(0,10);
  return LUNA_BASE+'#'+_encodeHash({
    startISO:d0+'T00:00:00Z',endISO:d1+'T23:00:00Z',
    sLat,sLon,shot:tMS
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function msToUtcStr(ms){
  const d=new Date(ms),p=n=>String(n).padStart(2,'0');
  return d.getUTCFullYear()+'-'+p(d.getUTCMonth()+1)+'-'+p(d.getUTCDate())
    +' '+p(d.getUTCHours())+':'+p(d.getUTCMinutes())+' UTC';
}
function msToDisplayStr(ms){
  const tz=CONFIG.timezone||'local';
  const d=new Date(ms);
  let timeZone;
  if(tz==='UTC') timeZone='UTC';
  else if(tz==='local') timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  else timeZone=tz;
  try{
    const parts=new Intl.DateTimeFormat('en-US',{
      timeZone,hourCycle:'h23',
      year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',timeZoneName:'short'
    }).formatToParts(d);
    const g=type=>parts.find(p=>p.type===type)?.value||'';
    return g('year')+'-'+g('month')+'-'+g('day')+' '+g('hour')+':'+g('minute')+' '+g('timeZoneName');
  }catch(e){
    return msToUtcStr(ms);
  }
}
function plasmaColor(t){
  const c=[[12,7,134],[68,1,161],[113,0,176],[152,23,166],[186,54,137],
            [214,88,104],[234,125,67],[246,165,25],[251,207,15],[240,249,33]];
  const n=c.length-1,i=Math.min(n-1,Math.floor(t*n)),f=t*n-i;
  const a=c[i],b=c[i+1];
  return`rgb(${Math.round(a[0]+(b[0]-a[0])*f)},${Math.round(a[1]+(b[1]-a[1])*f)},${Math.round(a[2]+(b[2]-a[2])*f)})`;
}
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function drawColorbar(startMS,endMS){
  const cv=document.getElementById('cb-canvas');
  if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  ctx.clearRect(0,0,W,H);
  const barX=3,barW=16,top=8,bot=H-8,barH=bot-top;
  for(let y=top;y<=bot;y++){
    ctx.fillStyle=plasmaColor(1-(y-top)/barH);
    ctx.fillRect(barX,y,barW,1);
  }
  ctx.strokeStyle='#bbb';ctx.lineWidth=0.5;
  ctx.strokeRect(barX+0.5,top+0.5,barW,barH);
  ctx.font='9px sans-serif';ctx.textAlign='left';
  const span=endMS-startMS||1;
  for(let i=0;i<=4;i++){
    const t=i/4,y=top+(1-t)*barH;
    const d=new Date(startMS+t*span);
    const label=d.getUTCDate()+' '+MONTHS[d.getUTCMonth()];
    ctx.fillStyle='#aaa';ctx.fillRect(barX+barW+0.5,y,4,0.5);
    ctx.fillStyle='#444';ctx.fillText(label,barX+barW+7,y+3.5);
  }
}
function computeMoonMinutes(tMS){
  const mins=[];
  for(let dm=-15;dm<=15;dm++){
    const ms=tMS+dm*60000;
    const utcStr=msToUtcStr(ms);
    const{altDeg,azDeg,illPct,sunAltDeg,sunAzDeg}=moonAltAzJS(CONFIG.objLat,CONFIG.objLon,CONFIG.objElev,utcStr);
    mins.push([altDeg,azDeg,illPct,sunAltDeg,sunAzDeg,msToDisplayStr(ms)]);
  }
  return mins;
}

// ── Line-of-sight profile ─────────────────────────────────────────────────────
// Side view of the vertical plane from the observer to the object: terrain
// elevation vs. distance. The solid sight line runs from the observer to the
// point on the object the moon passes behind; the colour along the ground is
// the clearance under it, i.e. how tall a tree or building could be there
// without blocking the shot. The dashed line is the moon's direction at the
// currently selected minute. Same flat-earth model as computeShadowPoint.
const PROF_N=400,PROF_WARN_M=15,PROF_OK_M=40;
const PROF_COL={bad:'#dc2626',warn:'#f59e0b',ok:'#16a34a'};
let profSamples=null,profView=null,profHoverD=null,lastProfArgs=null;
function getProfileSamples(la,lo,dist){
  if(profSamples&&profSamples.la===la&&profSamples.lo===lo)return profSamples;
  const DEG=Math.PI/180,R=6371000;
  const brg=bearing(la,lo,CONFIG.objLat,CONFIG.objLon)*DEG;
  const len=dist*1.05; // a little terrain behind the object for context
  const cosLat=Math.cos(la*DEG);
  const gs=new Float32Array(PROF_N+1);
  for(let i=0;i<=PROF_N;i++){
    const d=len*i/PROF_N;
    gs[i]=sampleGrid(la+d*Math.cos(brg)/(R*DEG),lo+d*Math.sin(brg)/(R*cosLat*DEG));
  }
  profSamples={la,lo,len,gs};
  return profSamples;
}
function niceStep(x){
  const p=Math.pow(10,Math.floor(Math.log10(x)));
  for(const m of[1,2,5,10])if(m*p>=x)return m*p;
}
function fmtDist(d){return d>=1000?(d/1000).toFixed(2)+' km':Math.round(d)+' m';}
function clearanceColor(c){
  return c<PROF_WARN_M?PROF_COL.bad:c<PROF_OK_M?PROF_COL.warn:PROF_COL.ok;
}
// Moon altitude at the moment its azimuth crosses the bearing to the object,
// interpolated within the ±15 min track; null if it never crosses.
function alignedMoonAlt(mins,caz){
  const wd=(a,b)=>((a-b+540)%360)-180;
  for(let i=0;i<mins.length-1;i++){
    const a=wd(mins[i][1],caz),b=wd(mins[i+1][1],caz);
    if(a===0)return mins[i][0];
    if(a*b<0)return mins[i][0]+a/(a-b)*(mins[i+1][0]-mins[i][0]);
  }
  return null;
}
function drawProfile(la,lo,oe,dist,caz,mins,moonAlt){
  const cv=document.getElementById('pv-prof'),ctx=cv.getContext('2d');
  const cw=cv.clientWidth,ch=cv.clientHeight;
  if(!cw||!ch)return;
  const dpr=window.devicePixelRatio||1;
  if(cv.width!==Math.round(cw*dpr)||cv.height!==Math.round(ch*dpr)){
    cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,cw,ch);

  const{len,gs}=getProfileSamples(la,lo,dist);
  const DEG=Math.PI/180,tanA=Math.tan(moonAlt*DEG);
  const moonAt=d=>oe+d*tanA;
  const objBase=CONFIG.objElev,objTop=objBase+CONFIG.objH;
  const alt0=alignedMoonAlt(mins,caz);
  const hitH=Math.max(objBase,Math.min(objTop,oe+dist*Math.tan((alt0??moonAlt)*DEG)));
  const losAt=d=>oe+d*(hitH-oe)/dist;
  let yMin=Infinity,yMax=Math.max(objTop,moonAt(dist));
  for(const g of gs){if(g<yMin)yMin=g;if(g>yMax)yMax=g;}
  const span=Math.max(yMax-yMin,10);
  yMin-=span*.08;yMax+=span*.15;
  const L=40,Rm=10,T=20,B=18;
  const px=d=>L+d/len*(cw-L-Rm);
  const py=e=>T+(yMax-e)/(yMax-yMin)*(ch-T-B);
  profView={L,Rm,cw,len};

  // Grid and axis labels
  ctx.font='10px sans-serif';ctx.lineWidth=1;
  ctx.strokeStyle='#e2e8f0';ctx.fillStyle='#64748b';
  ctx.textAlign='right';ctx.textBaseline='middle';
  const yStep=niceStep((yMax-yMin)/3);
  for(let e=Math.ceil(yMin/yStep)*yStep;e<=yMax;e+=yStep){
    ctx.beginPath();ctx.moveTo(L,py(e));ctx.lineTo(cw-Rm,py(e));ctx.stroke();
    ctx.fillText(Math.round(e)+' m',L-4,py(e));
  }
  ctx.textAlign='center';ctx.textBaseline='top';
  const xStep=niceStep(len/Math.max(2,Math.floor((cw-L-Rm)/70)));
  for(let d=0;d<=len;d+=xStep)ctx.fillText(d?fmtDist(d):'You',px(d),ch-B+4);

  // Terrain
  ctx.beginPath();ctx.moveTo(px(0),py(yMin));
  for(let i=0;i<=PROF_N;i++)ctx.lineTo(px(len*i/PROF_N),py(gs[i]));
  ctx.lineTo(px(len),py(yMin));ctx.closePath();
  ctx.fillStyle='#d6d3d1';ctx.fill();

  // Ground coloured by clearance under the line of sight, observer → object
  ctx.lineWidth=3;ctx.lineCap='round';
  for(let i=0;i<PROF_N;i++){
    const d0=len*i/PROF_N,d1=len*(i+1)/PROF_N;
    if(d0>=dist)break;
    ctx.strokeStyle=clearanceColor(losAt(d0)-gs[i]);
    ctx.beginPath();ctx.moveTo(px(d0),py(gs[i]));ctx.lineTo(px(d1),py(gs[i+1]));ctx.stroke();
  }

  // Object
  ctx.fillStyle='#0f172a';
  ctx.fillRect(px(dist)-2,py(objTop),4,Math.max(1,py(objBase)-py(objTop)));

  // Sight line to the object, and the moon's direction now (continues past
  // the object, clipped to the plot)
  ctx.strokeStyle='#334155';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(px(0),py(oe));ctx.lineTo(px(dist),py(hitH));ctx.stroke();
  ctx.save();
  ctx.beginPath();ctx.rect(L,T-6,cw-L-Rm,ch-T-B+6);ctx.clip();
  ctx.strokeStyle='#ca8a04';ctx.lineWidth=1.5;ctx.setLineDash([5,3]);
  ctx.beginPath();ctx.moveTo(px(0),py(oe));ctx.lineTo(px(len),py(moonAt(len)));ctx.stroke();
  ctx.restore();

  // Observer
  ctx.fillStyle='#4ade80';ctx.strokeStyle='#16a34a';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(px(0),py(oe),4,0,2*Math.PI);ctx.fill();ctx.stroke();

  // Header: legend, or the readout for the hovered/tapped point
  ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='11px sans-serif';
  if(profHoverD!=null){
    const i=Math.round(profHoverD/len*PROF_N),d=len*i/PROF_N,g=gs[i];
    ctx.strokeStyle='#475569';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(px(d),T-6);ctx.lineTo(px(d),ch-B);ctx.stroke();
    ctx.fillStyle='#0f172a';
    ctx.beginPath();ctx.arc(px(d),py(g),3,0,2*Math.PI);ctx.fill();
    let txt=fmtDist(d)+' from you \xB7 ground '+Math.round(g)+' m';
    if(d<=dist){
      const c=losAt(d)-g;
      txt+=' \xB7 '+(c<0?'terrain blocks the view':'clearance '+Math.round(c)+' m');
      ctx.fillStyle=clearanceColor(c);
    }else ctx.fillStyle='#334155';
    ctx.fillText(txt,L,9);
  }else{
    let x=L;
    ctx.fillStyle='#334155';ctx.fillText('Max obstacle:',x,9);
    x+=ctx.measureText('Max obstacle: ').width;
    [[PROF_COL.bad,'<'+PROF_WARN_M+' m'],[PROF_COL.warn,PROF_WARN_M+'–'+PROF_OK_M+' m'],
     [PROF_COL.ok,'>'+PROF_OK_M+' m']].forEach(([col,lbl])=>{
      ctx.fillStyle=col;ctx.fillRect(x,5,8,8);x+=11;
      ctx.fillStyle='#334155';ctx.fillText(lbl,x,9);x+=ctx.measureText(lbl).width+8;
    });
    // Line key, where there is room for it
    const key=[['#334155',[],'sight line'],['#ca8a04',[5,3],'moon now']];
    const keyW=key.reduce((w,k)=>w+30+ctx.measureText(k[2]).width,0);
    if(x+keyW<cw-Rm){
      x=cw-Rm-keyW;
      key.forEach(([col,dash,lbl])=>{
        ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.setLineDash(dash);
        ctx.beginPath();ctx.moveTo(x,9);ctx.lineTo(x+18,9);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#334155';ctx.fillText(lbl,x+22,9);x+=30+ctx.measureText(lbl).width;
      });
    }
  }
}
(function(){
  const cv=document.getElementById('pv-prof');
  function onPointer(e){
    if(!profView||!lastProfArgs)return;
    const x=e.clientX-cv.getBoundingClientRect().left;
    const{L,Rm,cw,len}=profView;
    profHoverD=Math.max(0,Math.min(len,(x-L)/(cw-L-Rm)*len));
    drawProfile(...lastProfArgs);
  }
  cv.addEventListener('pointermove',onPointer);
  cv.addEventListener('pointerdown',onPointer);
  cv.addEventListener('pointerleave',e=>{
    if(e.pointerType!=='mouse'||!lastProfArgs)return;
    profHoverD=null;drawProfile(...lastProfArgs);
  });
})();

// The minute at which the moon, seen from the clicked spot, comes closest to
// the object's silhouette. Searches a little beyond the ribbon's ±10 min sweep.
function bestShotMS(la,lo,tMS){
  const DEG=Math.PI/180;
  const oe=sampleGrid(la,lo);
  const caz=bearing(la,lo,CONFIG.objLat,CONFIG.objLon);
  const dist=Math.max(haversine(la,lo,CONFIG.objLat,CONFIG.objLon),1);
  const elBase=Math.atan2(CONFIG.objElev-oe,dist)/DEG;
  const elTop=Math.atan2(CONFIG.objElev+CONFIG.objH-oe,dist)/DEG;
  let best=tMS,bestSep=Infinity;
  for(let dm=-20;dm<=20;dm++){
    const ms=tMS+dm*60000;
    const{altDeg,azDeg}=moonAltAzJS(CONFIG.objLat,CONFIG.objLon,CONFIG.objElev,msToUtcStr(ms));
    const dx=(((azDeg-caz+540)%360)-180)*Math.cos(altDeg*DEG);
    const dy=altDeg<elBase?elBase-altDeg:altDeg>elTop?altDeg-elTop:0;
    const sep=Math.hypot(dx,dy);
    if(sep<bestSep){bestSep=sep;best=ms;}
  }
  return best;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render(la,lo,arrow){
  lastArgs=[la,lo,arrow];
  curArrow=arrow;curLa=la;curLo=lo;
  initGL();
  const mm=curMins[curOffset+15];
  const oe=sampleGrid(la,lo),eye=oe+EYE_H;
  const caz=bearing(la,lo,CONFIG.objLat,CONFIG.objLon);
  const dist=Math.max(haversine(la,lo,CONFIG.objLat,CONFIG.objLon),1);
  const midEl=CONFIG.objElev+CONFIG.objH*.5;
  const cel=Math.atan2(midEl-eye,dist)*180/Math.PI;
  const{hFov,vFov,aspect}=getCam();
  const mobile=isMobile();
  let maxW,maxH,dpr=1;
  if(mobile){
    // Fit the space the layout leaves for the canvas; render at device resolution.
    const wrap=document.getElementById('pv-canvaswrap');
    maxW=wrap.clientWidth;maxH=wrap.clientHeight;
    dpr=Math.min(window.devicePixelRatio||1,3);
  }else{
    maxW=Math.round(portrait?window.innerWidth*.45:Math.min(window.innerWidth*.92,900));
    maxH=Math.round(window.innerHeight*.92)-90
      -document.getElementById('pv-profwrap').offsetHeight;
  }
  const cssW=Math.max(1,Math.min(maxW,Math.round(maxH*aspect)));
  const cssH=Math.max(1,Math.round(cssW/aspect));
  const W=Math.round(cssW*dpr),H=Math.round(cssH*dpr);
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
  canvas.style.width=mobile?cssW+'px':'';
  canvas.style.height=mobile?cssH+'px':'';
  gl.viewport(0,0,W,H);
  const SLN=1024;
  // The object's own footing (last 50 m) doesn't count as terrain in front of it.
  const sl=computeSkyline(la,lo,eye,caz,hFov,SLN,dist-50);
  uploadSL(sl);
  const ohh=Math.atan(CONFIG.objH/2/dist)*180/Math.PI;
  const ohw=Math.atan(CONFIG.objW/2/dist)*180/Math.PI;
  const oelC=Math.atan2(midEl-eye,dist)*180/Math.PI;
  // How much of the object the terrain in front of it hides, judged by the
  // skyline columns it spans (at least the centre one).
  let nearMax=-Infinity,nearMin=Infinity;
  for(let i=0;i<SLN;i++){
    if(Math.abs(-hFov/2+i/(SLN-1)*hFov)>ohw&&i!==SLN>>1)continue;
    nearMax=Math.max(nearMax,sl[SLN+i]);nearMin=Math.min(nearMin,sl[SLN+i]);
  }
  // Any hidden part blinks; the warning only shows once at least 10% of the
  // object's height is hidden, so a sliver at its foot doesn't trigger it.
  objHidden=nearMax>oelC-ohh;
  const hidden=nearMin>=oelC+ohh?'all':nearMax>oelC-ohh*.8?'part':null;
  const hidEl=document.getElementById('pv-hidden');
  hidEl.textContent=hidden==='all'?'\u26A0 Object hidden by terrain from here'
    :'\u26A0 Object partly hidden by terrain';
  hidEl.classList.toggle('on',!!hidden);
  const skyB=Math.max(0,Math.min(1,(mm[3]+18)/12));
  gl.uniform2f(uL.uRes,W,H);
  gl.uniform1f(uL.uCamAz,caz);gl.uniform1f(uL.uCamEl,cel);
  gl.uniform1f(uL.uHFov,hFov);gl.uniform1f(uL.uVFov,vFov);
  gl.uniform1f(uL.uMoonAz,mm[1]);gl.uniform1f(uL.uMoonAlt,mm[0]);
  gl.uniform1f(uL.uMoonRad,.264);
  gl.uniform1f(uL.uMoonK,mm[2]/100);
  gl.uniform1f(uL.uSunAz,mm[4]);gl.uniform1f(uL.uSunAlt,mm[3]);
  gl.uniform1f(uL.uObjAz,caz);gl.uniform1f(uL.uObjElC,oelC);
  gl.uniform1f(uL.uObjHH,ohh);gl.uniform1f(uL.uObjHW,ohw);
  gl.uniform1f(uL.uSkyB,skyB);
  gl.uniform1f(uL.uBright,parseFloat(document.getElementById('pv-bright').value)||1);
  gl.uniform1f(uL.uHatch,8*dpr);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,skyTex);
  drawScene();
  if(objHidden&&!blinkRAF)blinkRAF=requestAnimationFrame(blinkLoop);
  updateInfoBox(la,lo,oe,dist,mm);
  updateNavUI();
  updateFocalChips();
  lastProfArgs=[la,lo,oe,dist,caz,curMins,mm[0]];
  drawProfile(...lastProfArgs);
  document.getElementById('pv-info').textContent=
    'Observer: '+la.toFixed(4)+'\xB0N, '+lo.toFixed(4)+'\xB0E'
    +' | Elev: '+Math.round(oe)+' m'
    +' | Dist: '+Math.round(dist)+' m'
    +' | Use ◄ ► to step \xB11 min  (range: \xB115 min)';
}

let observerMarker=null,_objMarker=null,_map=null;
function openPreview(la,lo,arrow){
  curOffset=0;profHoverD=null;
  curBaseMS=bestShotMS(la,lo,arrow.tMS);
  curMins=computeMoonMinutes(curBaseMS);
  document.getElementById('pv-overlay').classList.add('open');
  document.getElementById('pv-nav').href=navURL(la.toFixed(6),lo.toFixed(6));
  applyPortraitClass();
  render(la,lo,arrow);
  updateGpsBadge();
  if(_map){
    if(observerMarker)observerMarker.setLatLng([la,lo]);
    else observerMarker=L.circleMarker([la,lo],
      {radius:7,color:'#16a34a',fillColor:'#4ade80',fillOpacity:1,weight:2})
      .addTo(_map);
  }
}

// ── GPS position (optional) ───────────────────────────────────────────────────
// Off by default since it only matters in the field. The preference is kept in
// this browser only, never in shared links.
const GPS_KEY='luna-gps';
let gpsWatch=null,gpsPos=null,gpsDot=null,gpsAcc=null,gpsMsgTimer=0;
function gpsPref(){try{return localStorage.getItem(GPS_KEY)==='1';}catch(e){return false;}}
function setGpsPref(on){try{localStorage.setItem(GPS_KEY,on?'1':'0');}catch(e){}}
function compass(deg){return['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8];}
// Short message at the bottom of the map; ms=0 keeps it up until hideMsg().
function showMsg(txt,ms=5000){
  const t=document.getElementById('gps-msg');
  t.textContent=txt;t.style.display='block';
  clearTimeout(gpsMsgTimer);
  if(ms)gpsMsgTimer=setTimeout(hideMsg,ms);
}
function hideMsg(){clearTimeout(gpsMsgTimer);document.getElementById('gps-msg').style.display='none';}
// In the preview: where the selected spot is relative to you.
function updateGpsBadge(){
  const el=document.getElementById('pv-gps');
  if(!gpsPos||!document.getElementById('pv-overlay').classList.contains('open')){
    el.style.display='none';return;
  }
  const d=haversine(gpsPos.lat,gpsPos.lon,curLa,curLo);
  el.textContent=d<=Math.max(10,gpsPos.acc)
    ?'\u{1F4CD} You are at the spot (\xB1'+Math.round(gpsPos.acc)+' m)'
    :'\u{1F4CD} Spot is '+fmtDist(d)+' '+compass(bearing(gpsPos.lat,gpsPos.lon,curLa,curLo))+' of you';
  el.style.display='block';
}
function startGps(){
  if(gpsWatch!=null)return;
  if(!navigator.geolocation){showMsg('Location is not available in this browser.');return;}
  document.getElementById('gps-btn').style.display='';
  gpsWatch=navigator.geolocation.watchPosition(pos=>{
    gpsPos={lat:pos.coords.latitude,lon:pos.coords.longitude,acc:pos.coords.accuracy};
    const ll=[gpsPos.lat,gpsPos.lon];
    if(_map){
      if(!gpsDot){
        gpsAcc=L.circle(ll,{radius:gpsPos.acc,color:'#2563eb',weight:1,opacity:.4,
          fillOpacity:.1,interactive:false}).addTo(_map);
        gpsDot=L.circleMarker(ll,{radius:6,color:'#fff',weight:2,fillColor:'#2563eb',
          fillOpacity:1,interactive:false}).addTo(_map);
      }else{gpsDot.setLatLng(ll);gpsAcc.setLatLng(ll).setRadius(gpsPos.acc);}
    }
    updateGpsBadge();
  },err=>{
    showMsg(err.code===1
      ?'Location permission denied \u2014 allow it in your browser settings.'
      :'Location unavailable: '+err.message);
  },{enableHighAccuracy:true,maximumAge:5000,timeout:30000});
}
function stopGps(){
  if(gpsWatch!=null)navigator.geolocation.clearWatch(gpsWatch);
  gpsWatch=null;gpsPos=null;
  if(gpsDot){_map.removeLayer(gpsDot);_map.removeLayer(gpsAcc);gpsDot=gpsAcc=null;}
  document.getElementById('gps-btn').style.display='none';
  updateGpsBadge();
}
document.getElementById('gps-btn').onclick=()=>{
  if(gpsPos&&_map)_map.setView([gpsPos.lat,gpsPos.lon],Math.max(_map.getZoom(),15));
  else showMsg('Waiting for a location fix\u2026');
};

// ── Weather (Open-Meteo) ──────────────────────────────────────────────────────
// Hourly cloud layers, rain chance and visibility at the object, a week
// ahead, fetched per location and refreshed hourly — and only when some shown
// moment falls in that week, so past or far-future ranges never hit the API.
// A failed request isn't retried for WX_RETRY_MS. Cloud forecasts are only
// reliable for a few days, so later ones are marked uncertain and never used
// to fade ribbons. Low and mid cloud hide the moon; thin high cloud usually
// doesn't, so the rating weighs them differently.
const WX_UNCERTAIN_DAYS=5,WX_DAYS=7,WX_RETRY_MS=600000;
let WX=null,wxLoading=null,wxFailed=null,wxCredit=false,lastShapeCount=0,lastMomentsMS=[];
function wxKey(){return CONFIG.objLat.toFixed(3)+','+CONFIG.objLon.toFixed(3);}
function inForecastWindow(ms){
  const now=Date.now();
  return ms>=now-3600000&&ms<=now+WX_DAYS*86400000;
}
function loadWeather(momentsMS){
  if(!momentsMS.some(inForecastWindow))return;
  const key=wxKey();
  if(WX&&WX.key===key&&Date.now()-WX.fetched<3600000)return;
  if(wxLoading===key)return;
  if(wxFailed&&wxFailed.key===key&&Date.now()-wxFailed.at<WX_RETRY_MS)return;
  wxLoading=key;
  fetch('https://api.open-meteo.com/v1/forecast?latitude='+CONFIG.objLat.toFixed(4)+
    '&longitude='+CONFIG.objLon.toFixed(4)+
    '&hourly=cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation_probability,visibility'+
    '&forecast_days='+(WX_DAYS+1)+'&timeformat=unixtime')
    .then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(d=>{
      if(wxLoading!==key)return; // location changed meanwhile
      wxFailed=null;
      const h=d.hourly;
      WX={key,fetched:Date.now(),t0:h.time[0]*1000,low:h.cloud_cover_low,
          mid:h.cloud_cover_mid,high:h.cloud_cover_high,
          pp:h.precipitation_probability,vis:h.visibility};
      if(!wxCredit&&_map){
        _map.attributionControl.addAttribution(
          'Weather: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>');
        wxCredit=true;
      }
      applyWeatherStyles();updateStatusBadge();
      if(lastArgs&&document.getElementById('pv-overlay').classList.contains('open'))
        render(...lastArgs);
    })
    // No forecast: everything simply shows without weather.
    .catch(()=>{wxFailed={key,at:Date.now()};})
    .finally(()=>{if(wxLoading===key)wxLoading=null;});
}
function wxRating(w){
  const block=Math.max(w.low,w.mid),pp=w.pp??0;
  if(block>=75||pp>=60)return'bad';
  if(block>=35||w.high>=75||pp>=30)return'fair';
  return'good';
}
// Forecast for the hour nearest to ms, or null if there is none.
function weatherAt(ms){
  if(!WX||WX.key!==wxKey()||!inForecastWindow(ms))return null;
  const i=Math.round((ms-WX.t0)/3600000);
  if(i<0||i>=WX.low.length||WX.low[i]==null)return null;
  const w={low:WX.low[i],mid:WX.mid[i],high:WX.high[i],pp:WX.pp[i],vis:WX.vis[i],
    uncertain:ms-Date.now()>WX_UNCERTAIN_DAYS*86400000};
  w.rating=wxRating(w);
  w.icon=(w.pp??0)>=60?'\u{1F327}\uFE0F':{good:'\u2728',fair:'\u26C5',bad:'\u2601\uFE0F'}[w.rating];
  return w;
}
function wxShort(w){
  return w.icon+' low '+w.low+' \xB7 mid '+w.mid+' \xB7 high '+w.high+'%'+
    (w.pp!=null?' \xB7 rain '+w.pp+'%':'')+(w.uncertain?' \xB7 uncertain':'');
}
function wxInfoLines(w){
  if(!w)return[];
  return['',w.icon+' Weather'+(w.uncertain?'  (>'+WX_UNCERTAIN_DAYS+' days: uncertain)':''),
    '   cloud low/mid/high '+w.low+'/'+w.mid+'/'+w.high+'%',
    '   rain '+(w.pp!=null?w.pp+'%':'\u2013')+'  visibility '+
      (w.vis!=null?Math.round(w.vis/1000)+' km':'\u2013')];
}
// Fade ribbons of moments that are reliably forecast to be clouded out.
function applyWeatherStyles(){
  arrowLayers.forEach(a=>{
    const w=a.tMS!=null&&weatherAt(a.tMS);
    const faded=w&&!w.uncertain&&w.rating==='bad';
    a.line.setStyle(faded?{opacity:.2,fillOpacity:.05}:{opacity:.55,fillOpacity:.25});
  });
}
function updateStatusBadge(){
  if(building)return; // the totals are for the previous range until it finishes
  let txt=lastShapeCount+' shapes ('+lastMomentsMS.length+' moments)';
  const n={good:0,fair:0,bad:0};let any=false;
  lastMomentsMS.forEach(ms=>{
    const w=weatherAt(ms);
    if(w&&!w.uncertain){n[w.rating]++;any=true;}
  });
  if(any)txt+=' \xB7 \u2728'+n.good+' \u26C5'+n.fair+' \u2601\uFE0F'+n.bad;
  document.getElementById('status-badge').textContent=txt;
}

// ── Arrow building & rendering ─────────────────────────────────────────────────
const arrowLayers=[];
function clearArrows(){
  arrowLayers.forEach(({line,mkr})=>{
    if(_map){_map.removeLayer(line);if(mkr)_map.removeLayer(mkr);}
  });
  arrowLayers.length=0;
}
function addArrow(zone){
  const poly=L.polygon(zone.poly,{color:zone.color,weight:.75,opacity:.55,
      fillColor:zone.color,fillOpacity:.25})
    .on('click',e=>{if(picking)return;L.DomEvent.stop(e);openPreview(e.latlng.lat,e.latlng.lng,zone);})
    .addTo(_map);
  arrowLayers.push({line:poly,mkr:null,tMS:zone.tMS});
}
// Builds the ribbon for one height level at one moment: the left-edge track
// (moon's left limb grazing that height) and the right-edge track (moon's
// right limb), each swept over the same ±10 minute window, joined into thin
// polygons. Mirrors the old collapse-if-static behavior: if the drift over 20
// minutes is negligible, only the endpoints are used. The ribbon is cut into
// ~RIBBON_SUB_M long slices and slices from whose centre that height of the
// object is hidden by terrain are dropped, so it breaks where the view is
// blocked (e.g. across the back of a ridge when the track jumps over it).
const RIBBON_SUB_M=50,RIBBON_SUB_MAX=40;
function ribbonPolygons(left,right,hf){
  let idx=left.map((_,i)=>i).filter(i=>left[i]&&right[i]);
  if(idx.length<2)return[];
  const l0=left[0],l4=left[4];
  const useFull=l0&&l4&&haversine(l0[0],l0[1],l4[0],l4[1])>100;
  if(!useFull)idx=[idx[0],idx[idx.length-1]];
  const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const sl=[left[idx[0]]],sr=[right[idx[0]]];
  for(let k=0;k<idx.length-1;k++){
    const a=idx[k],b=idx[k+1];
    const len=Math.max(haversine(...left[a],...left[b]),haversine(...right[a],...right[b]));
    const n=Math.max(1,Math.min(RIBBON_SUB_MAX,Math.ceil(len/RIBBON_SUB_M)));
    for(let j=1;j<=n;j++){
      sl.push(lerp(left[a],left[b],j/n));sr.push(lerp(right[a],right[b],j/n));
    }
  }
  const polys=[];let run=null;
  for(let j=0;j<sl.length-1;j++){
    const c=lerp(lerp(sl[j],sl[j+1],.5),lerp(sr[j],sr[j+1],.5),.5);
    if(objectVisible(c[0],c[1],hf)){
      if(!run)run={l:[sl[j]],r:[sr[j]]};
      run.l.push(sl[j+1]);run.r.push(sr[j+1]);
    }else if(run){polys.push(run);run=null;}
  }
  if(run)polys.push(run);
  return polys.map(({l,r})=>[...l,...r.reverse()]);
}
// Moments are computed in chunks of ~CHUNK_MS so the page stays responsive and
// a progress bar with an estimated finish time can be shown. Ribbons appear on
// the map as they are found. Starting a new build cancels the running one.
const CHUNK_MS=40;
let buildGen=0,building=false;
function fmtETA(s){
  if(s<60)return Math.max(1,Math.round(s))+' s';
  const m=Math.round(s/60);
  return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min';
}
function showProgress(done,total,t0){
  const el=document.getElementById('calc-prog');
  if(done==null){el.classList.remove('on');return;}
  const frac=total?done/total:1,elapsed=(performance.now()-t0)/1000;
  // Wait for a little data before extrapolating, or the estimate jumps around.
  const left=frac>.02&&elapsed>.3?elapsed/frac*(1-frac):null;
  const eta=left!=null?' \xB7 about '+fmtETA(left)+' left':'';
  // For longer runs, also the clock time it should be done by.
  const fin=left>=60?' (done ~'+new Date(Date.now()+left*1000)
    .toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+')':'';
  document.getElementById('calc-prog-txt').textContent=
    'Computing… '+Math.floor(frac*100)+'%'+eta+fin;
  document.getElementById('calc-prog-fill').style.width=(frac*100).toFixed(1)+'%';
  el.classList.add('on');
}
function buildAndRenderArrows(startDate,endDate){
  clearArrows();
  const gen=++buildGen;
  building=true;
  document.getElementById('status-badge').textContent='Computing…';
  const DEG=Math.PI/180,R=6371000;
  const startMS=new Date(startDate+'T00:00:00Z').getTime();
  const endMS  =new Date(endDate  +'T23:59:59Z').getTime();
  const stepMS=CONFIG.stepH*3600000;
  // Keep the time steps on the grid of the configured start, so narrowing the
  // range (e.g. from a shot link) yields the same moments.
  const gridMS=new Date(CONFIG.startISO).getTime();
  const firstMS=gridMS+Math.ceil((startMS-gridMS)/stepMS)*stepMS;
  const total=Math.max(0,Math.floor((endMS-firstMS)/stepMS)+1);
  const halfLat=CONFIG.mapHalfKm*1000/(R*DEG);
  const halfLon=CONFIG.mapHalfKm*1000/(R*Math.cos(CONFIG.objLat*DEG)*DEG);
  const tSpan=endMS-startMS||1;
  drawColorbar(startMS,endMS);
  const moments=[];let shapeCount=0,i=0;
  const t0=performance.now();
  showProgress(0,total,t0);

  function computeMoment(tMS){
    const utcStr=msToUtcStr(tMS);
    const{altDeg,illPct,sunAltDeg}=
      moonAltAzJS(CONFIG.objLat,CONFIG.objLon,CONFIG.objElev,utcStr);
    if(altDeg<CONFIG.minAltDeg||sunAltDeg>CONFIG.maxSunAltDeg
       ||illPct<CONFIG.minMoonIllumPct)return;

    // Moon alt/az across the ±10 minute sweep — shared by every height level.
    const sweep=[-10,-5,0,5,10].map(dm=>{
      const s=msToUtcStr(tMS+dm*60000);
      const{altDeg:a,azDeg:z}=moonAltAzJS(CONFIG.objLat,CONFIG.objLon,CONFIG.objElev,s);
      return{a,z};
    });

    const ribbons=HEIGHT_FRACTIONS.map(hf=>({
      hf,
      left: sweep.map(({a,z})=>computeShadowPoint(a,z-MOON_RADIUS_DEG,hf)),
      right:sweep.map(({a,z})=>computeShadowPoint(a,z+MOON_RADIUS_DEG,hf)),
    }));

    // Map-bounds / min-distance filtering still keys off the full-height
    // (tip) track, same reference point the original algorithm used.
    const tip=ribbons[ribbons.length-1];
    const pc=tip.left[2]||tip.right[2]||tip.left[0]||tip.right[0];
    if(!pc)return;
    if(Math.abs(pc[0]-CONFIG.objLat)>halfLat
       ||Math.abs(pc[1]-CONFIG.objLon)>halfLon)return;
    if(haversine(CONFIG.objLat,CONFIG.objLon,pc[0],pc[1])<CONFIG.minDistM)return;

    moments.push(tMS);
    const color=plasmaColor((tMS-startMS)/tSpan);
    ribbons.forEach(({hf,left,right})=>{
      ribbonPolygons(left,right,hf).forEach(poly=>{
        addArrow({poly,color,tMS,tCenter:utcStr});
        shapeCount++;
      });
    });
  }
  function chunk(){
    if(gen!==buildGen)return;
    const until=performance.now()+CHUNK_MS;
    while(i<total&&performance.now()<until)computeMoment(firstMS+i++*stepMS);
    if(i<total){
      showProgress(i,total,t0);
      setTimeout(chunk,0);
      return;
    }
    showProgress(null);
    building=false;
    lastShapeCount=shapeCount;lastMomentsMS=moments;
    updateStatusBadge();
    applyWeatherStyles();
    loadWeather(moments);
  }
  setTimeout(chunk,10);
}

// ── Settings hint (first-load callout) ────────────────────────────────────────
(function(){
  const hint=document.getElementById('settings-hint');
  if(localStorage.getItem('luna-hint-seen')){hint.style.display='none';return;}
  function dismiss(){hint.style.display='none';localStorage.setItem('luna-hint-seen','1');}
  hint.addEventListener('click',dismiss);
  document.getElementById('settings-btn').addEventListener('click',dismiss,{once:true});
})();

if(!CONFIG.objW)CONFIG.objW=5;
if(!CONFIG.timezone)CONFIG.timezone='local';

// ── Objects ───────────────────────────────────────────────────────────────────
// The objects to shoot are a list kept in this browser only, one of them
// selected; index.html applies the selected one to CONFIG before the map is
// made. A link's hash sets the object too: if it isn't in the list, it shows
// as an unsaved "Shared object" that can be saved from the editor.
const OBJ_KEY='luna-objects';
// The lookout tower on the Uetliberg (Aussichtsturm Uto Kulm, OSM way
// 334161815) — not the 187 m TV tower 200 m north of it. It is 70 m tall
// with the antenna on top; 40 m leaves the antenna out of the shot.
const DEFAULT_OBJECTS=[
  {id:'uetliberg',name:'Uetliberg lookout tower',lat:47.349540,lon:8.491359,h:40,w:5}];
let objects=DEFAULT_OBJECTS,storedSel=objects[0].id,selObjId,sharedObj=null;
try{
  const st=JSON.parse(localStorage.getItem(OBJ_KEY));
  if(st&&Array.isArray(st.list)&&st.list.length){objects=st.list;storedSel=st.sel;}
}catch(e){}
function isCurrentObj(o){
  return Math.abs(o.lat-CONFIG.objLat)<2e-6&&Math.abs(o.lon-CONFIG.objLon)<2e-6
    &&Math.round(o.h)===Math.round(CONFIG.objH)&&Math.round(o.w)===Math.round(CONFIG.objW);
}
{
  const cur=objects.find(o=>o.id===storedSel&&isCurrentObj(o))||objects.find(isCurrentObj);
  if(cur)selObjId=cur.id;
  else{
    sharedObj={id:'shared',name:'Shared object',
      lat:CONFIG.objLat,lon:CONFIG.objLon,h:CONFIG.objH,w:CONFIG.objW};
    selObjId=sharedObj.id;
  }
}
function saveObjects(){
  try{localStorage.setItem(OBJ_KEY,JSON.stringify({sel:storedSel,list:objects}));}catch(e){}
}
function objById(id){return id==='shared'?sharedObj:objects.find(o=>o.id===id);}
function renderObjSelect(){
  const sel=document.getElementById('obj-sel');
  sel.textContent='';
  (sharedObj?[sharedObj,...objects]:objects).forEach(o=>
    sel.add(new Option(o===sharedObj?o.name+' (not saved)':o.name,o.id)));
  sel.add(new Option('\uFF0B Add object\u2026','add'));
  sel.value=selObjId;
}
function selectObject(id){
  selObjId=id;
  if(id!=='shared'){storedSel=id;saveObjects();}
  renderObjSelect();
  applyObject(objById(id));
}
document.getElementById('obj-sel').onchange=e=>{
  if(e.target.value==='add'){e.target.value=selObjId;openObjEditor(null);}
  else selectObject(e.target.value);
};
document.getElementById('obj-edit').onclick=()=>openObjEditor(objById(selObjId));
renderObjSelect();

// Loading terrain for a new object takes a moment; objGen discards a load
// that was overtaken by another switch, and nothing is computed until the
// terrain matches CONFIG.
let objGen=0,terrainReady=false;
async function loadObjectTerrain(){
  const gen=++objGen;
  terrainReady=false;
  ++buildGen;clearArrows();showProgress(null); // stop and drop the old object's ribbons
  document.getElementById('status-badge').textContent='Loading terrain…';
  const t=await loadTerrain(CONFIG.objLat,CONFIG.objLon);
  if(gen!==objGen)return false;
  TERRAIN=t;terrainReady=true;
  CONFIG.objElev=sampleGrid(CONFIG.objLat,CONFIG.objLon);
  return true;
}
// Recomputes the full configured range, resetting the date bar to it.
function rebuildAll(){
  if(!terrainReady)return; // the pending terrain load will do it
  CONFIG.objElev=sampleGrid(CONFIG.objLat,CONFIG.objLon);
  const fullStart=CONFIG.startISO.slice(0,10);
  const fullEnd  =CONFIG.endISO  .slice(0,10);
  document.getElementById('df-start').value=fullStart;
  document.getElementById('df-end').value=fullEnd;
  buildAndRenderArrows(fullStart,fullEnd);
}
async function applyObject(o){
  const moved=o.lat!==CONFIG.objLat||o.lon!==CONFIG.objLon;
  const changed=moved||o.h!==CONFIG.objH; // the width only matters in the preview
  CONFIG.objLat=o.lat;CONFIG.objLon=o.lon;CONFIG.objH=o.h;CONFIG.objW=o.w;
  CONFIG._shotMS=null;
  syncURL();
  if(!_map)return; // init picks up CONFIG
  _objMarker.setLatLng([o.lat,o.lon]);
  if(moved){
    _map.flyToBounds(objBounds(),{padding:[40,40],duration:1});
    if(!await loadObjectTerrain())return;
  }
  if(changed)rebuildAll();
}
// The map area searched for shooting spots around the object.
function objBounds(){
  const DEG=Math.PI/180,R=6371000,d=CONFIG.mapHalfKm*1000/R/DEG;
  const dLon=d/Math.cos(CONFIG.objLat*DEG);
  return[[CONFIG.objLat-d,CONFIG.objLon-dLon],[CONFIG.objLat+d,CONFIG.objLon+dLon]];
}

// ── Object editor ─────────────────────────────────────────────────────────────
let editObj=null,picking=false;
function fmtCoords(la,lo){return la.toFixed(6)+', '+lo.toFixed(6);}
// "47.3495, 8.4913" as copied from Google Maps; also accepts 47.3495°N 8.4913°E.
function parseCoords(txt){
  const m=txt.trim().match(/^(-?\d+(?:\.\d+)?)\s*°?\s*([NS])?\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EW])?$/i);
  if(!m)return null;
  let la=parseFloat(m[1]),lo=parseFloat(m[3]);
  if(m[2]&&/s/i.test(m[2]))la=-la;
  if(m[4]&&/w/i.test(m[4]))lo=-lo;
  if(Math.abs(la)>85||Math.abs(lo)>180)return null;
  return[la,lo];
}
// o: the object to edit, null for a new one.
function openObjEditor(o){
  editObj=o;
  const c=o?[o.lat,o.lon]:_map?[_map.getCenter().lat,_map.getCenter().lng]:null;
  document.getElementById('ob-title').textContent=
    !o?'Add object':o===sharedObj?'Save shared object':'Edit object';
  document.getElementById('ob-name').value=o&&o!==sharedObj?o.name:'';
  document.getElementById('ob-coords').value=c?fmtCoords(c[0],c[1]):'';
  document.getElementById('ob-h').value=o?o.h:50;
  document.getElementById('ob-w').value=o?o.w:5;
  document.getElementById('ob-err').textContent='';
  document.getElementById('ob-del').style.display=
    o&&o!==sharedObj&&objects.length>1?'':'none';
  document.getElementById('ob-overlay').classList.add('open');
  document.getElementById('ob-name').focus();
}
function closeObjEditor(){document.getElementById('ob-overlay').classList.remove('open');}
document.getElementById('ob-cancel').onclick=closeObjEditor;
document.getElementById('ob-pick').onclick=()=>{
  if(!_map)return;
  document.getElementById('ob-overlay').classList.remove('open');
  picking=true;
  _map.getContainer().classList.add('obj-picking');
  showMsg('Tap the object on the map',0);
};
function endPick(){
  picking=false;
  _map.getContainer().classList.remove('obj-picking');
  hideMsg();
  document.getElementById('ob-overlay').classList.add('open');
}
document.addEventListener('keydown',e=>{if(picking&&e.key==='Escape')endPick();});
document.getElementById('ob-ok').onclick=()=>{
  const err=document.getElementById('ob-err');
  const c=parseCoords(document.getElementById('ob-coords').value);
  const h=Math.round(parseFloat(document.getElementById('ob-h').value));
  const w=Math.round(parseFloat(document.getElementById('ob-w').value));
  if(!c){err.textContent='Enter the position as latitude, longitude \u2014 e.g. 47.3495, 8.4914';return;}
  if(!(h>=1&&h<=9999)){err.textContent='Height must be between 1 and 9999 m.';return;}
  if(!(w>=1&&w<=9999)){err.textContent='Width must be between 1 and 9999 m.';return;}
  const name=document.getElementById('ob-name').value.trim()||fmtCoords(c[0],c[1]);
  const isSaved=editObj&&editObj!==sharedObj;
  const o={id:isSaved?editObj.id:'o'+Date.now().toString(36),name,lat:c[0],lon:c[1],h,w};
  if(isSaved)objects[objects.indexOf(editObj)]=o;
  else objects.push(o);
  if(editObj===sharedObj)sharedObj=null;
  closeObjEditor();
  selectObject(o.id);
};
document.getElementById('ob-del').onclick=()=>{
  if(!confirm('Delete \u201C'+editObj.name+'\u201D from your objects?'))return;
  objects.splice(objects.indexOf(editObj),1);
  closeObjEditor();
  if(editObj.id===storedSel)storedSel=objects[0].id;
  if(editObj.id===selObjId)selectObject(objects[0].id);
  else{saveObjects();renderObjSelect();}
};

// ── Settings modal ────────────────────────────────────────────────────────────

document.getElementById('settings-btn').onclick=()=>{
  document.getElementById('st-start').value=CONFIG.startISO.slice(0,10);
  document.getElementById('st-end').value=CONFIG.endISO.slice(0,10);
  document.getElementById('st-step').value=CONFIG.stepH;
  document.getElementById('st-minAlt').value=CONFIG.minAltDeg;
  document.getElementById('st-minDist').value=CONFIG.minDistM;
  document.getElementById('st-maxSun').value=CONFIG.maxSunAltDeg;
  document.getElementById('st-minIllum').value=CONFIG.minMoonIllumPct;
  document.getElementById('st-tz').value=CONFIG.timezone;
  document.getElementById('st-refr').checked=CONFIG.refraction!==false;
  document.getElementById('st-gps').checked=gpsWatch!=null;
  document.getElementById('st-overlay').classList.add('open');
};
document.getElementById('st-cancel').onclick=()=>
  document.getElementById('st-overlay').classList.remove('open');

document.getElementById('st-ok').onclick=()=>{
  CONFIG.startISO   =document.getElementById('st-start').value+'T00:00:00Z';
  CONFIG.endISO     =document.getElementById('st-end').value+'T23:59:59Z';
  CONFIG.stepH      =parseFloat(document.getElementById('st-step').value);
  CONFIG.minAltDeg  =parseFloat(document.getElementById('st-minAlt').value);
  CONFIG.minDistM   =parseFloat(document.getElementById('st-minDist').value);
  CONFIG.maxSunAltDeg   =parseFloat(document.getElementById('st-maxSun').value);
  CONFIG.minMoonIllumPct=parseFloat(document.getElementById('st-minIllum').value);
  CONFIG.timezone=document.getElementById('st-tz').value.trim()||'local';
  CONFIG.refraction=document.getElementById('st-refr').checked;
  const gpsOn=document.getElementById('st-gps').checked;
  setGpsPref(gpsOn);gpsOn?startGps():stopGps();
  CONFIG._shotMS=null;
  document.getElementById('st-overlay').classList.remove('open');
  syncURL();
  rebuildAll();
};

// ── Init ──────────────────────────────────────────────────────────────────────
(async function waitForMap(){
  const m=window[MAP_VAR];
  if(!m){setTimeout(waitForMap,100);return;}
  _map=m;
  if(gpsPref())startGps();
  const objIcon=L.divIcon({
    html:'<div style="font-size:14px;line-height:1;color:#ef4444;text-shadow:0 1px 3px rgba(0,0,0,.8)">▲</div>',
    className:'',iconSize:[14,14],iconAnchor:[7,12]});
  _objMarker=L.marker([CONFIG.objLat,CONFIG.objLon],{icon:objIcon}).addTo(_map);
  _map.on('click',e=>{
    if(!picking)return;
    document.getElementById('ob-coords').value=fmtCoords(e.latlng.lat,e.latlng.lng);
    endPick();
  });
  const fullStart=CONFIG.startISO.slice(0,10);
  const fullEnd  =CONFIG.endISO  .slice(0,10);
  const ds=document.getElementById('df-start'),de=document.getElementById('df-end');
  // If opened from a shot link, narrow the date filter to ±1 day around the shot
  if(CONFIG._shotMS){
    const s=new Date(Math.max(new Date(fullStart),new Date(CONFIG._shotMS-86400000))).toISOString().slice(0,10);
    const e=new Date(Math.min(new Date(fullEnd),  new Date(CONFIG._shotMS+86400000))).toISOString().slice(0,10);
    ds.value=s;de.value=e;
  }else{
    ds.value=fullStart;de.value=fullEnd;
  }
  syncURL();
  // The date bar sets the computed range (same as Start/End in the settings).
  // Dates before 2000 or after 2179 don't fit the shareable link.
  [ds,de].forEach(el=>el.addEventListener('input',()=>{
    if(!ds.value||!de.value)return;
    const ok=d=>d>='2000-01-01'&&d<='2179-12-31';
    if(!ok(ds.value)||!ok(de.value))return;
    if(ds.value>de.value)(el===ds?de:ds).value=el.value;
    CONFIG.startISO=ds.value+'T00:00:00Z';
    CONFIG.endISO  =de.value+'T23:59:59Z';
    CONFIG._shotMS=null;
    syncURL();
    if(terrainReady)buildAndRenderArrows(ds.value,de.value);
  }));
  if(await loadObjectTerrain())buildAndRenderArrows(ds.value,de.value);
})();

})(); // end application IIFE
