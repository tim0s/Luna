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
#pv-canvas{display:block;}
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
#title-bar{position:fixed;top:10px;left:50%;transform:translateX(-50%);
  z-index:9999;background:rgba(255,255,255,.88);padding:6px 12px;
  border-radius:6px;box-shadow:1px 1px 4px rgba(0,0,0,.3);
  font-family:sans-serif;font-size:12px;text-align:center;pointer-events:none;}
#df-bar{position:fixed;top:55px;left:50%;transform:translateX(-50%);
  z-index:9998;background:rgba(255,255,255,.92);padding:5px 14px;
  border-radius:6px;box-shadow:1px 1px 4px rgba(0,0,0,.3);
  font-family:sans-serif;font-size:12px;display:flex;align-items:center;gap:8px;}
#df-bar input[type=date]{border:1px solid #ccc;border-radius:3px;
  padding:2px 5px;font-size:12px;}
#status-badge{position:fixed;bottom:30px;left:10px;z-index:9999;
  background:rgba(255,255,255,.92);padding:6px 10px;border-radius:6px;
  box-shadow:1px 1px 4px rgba(0,0,0,.3);font:11px monospace;}
#settings-btn{position:fixed;top:10px;right:10px;z-index:9999;
  background:rgba(255,255,255,.92);border:none;border-radius:6px;
  padding:5px 9px;cursor:pointer;font-size:17px;line-height:1;
  box-shadow:1px 1px 4px rgba(0,0,0,.3);}
#settings-btn:hover{background:white;}
#st-overlay{display:none;position:fixed;inset:0;z-index:21000;
  background:rgba(0,0,0,.45);align-items:center;justify-content:center;}
#st-overlay.open{display:flex;}
#st-box{background:#fff;color:#1e293b;border-radius:10px;padding:22px 24px;
  width:400px;max-width:92vw;box-shadow:0 8px 40px rgba(0,0,0,.25);
  font-family:sans-serif;font-size:13px;}
#st-box h3{margin:0 0 14px;font-size:14px;color:#0f172a;font-weight:600;}
#st-box h4{font-size:10px;color:#94a3b8;text-transform:uppercase;
  letter-spacing:.07em;margin:14px 0 6px;}
.st-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 14px;}
.st-grid label,.st-solo label{display:flex;flex-direction:column;
  font-size:11px;color:#64748b;gap:3px;}
.st-solo{margin-top:7px;}
#st-box input[type=number],#st-box input[type=date]{
  background:#f8fafc;color:#1e293b;border:1px solid #cbd5e1;
  border-radius:4px;padding:4px 7px;font-size:12px;width:100%;box-sizing:border-box;}
#st-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:20px;}
#st-footer button{background:#3b82f6;color:#fff;border:none;
  border-radius:4px;padding:5px 16px;cursor:pointer;font-size:13px;}
#st-footer button:hover{background:#2563eb;}
#st-cancel{background:#e2e8f0!important;color:#475569!important;}
</style>`);

// ── Inject modal HTML ─────────────────────────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div id="title-bar"></div>
<div id="df-bar">
 <span>Show:</span>
 <input type="date" id="df-start">
 <span>&#x2013;</span>
 <input type="date" id="df-end">
</div>
<div id="status-badge">Computing&#x2026;</div>
<button id="settings-btn" title="Settings">&#x2699;</button>
<div id="st-overlay">
 <div id="st-box">
  <h3>Settings</h3>
  <h4>Object</h4>
  <div class="st-grid">
   <label>Latitude &#xB0;N<input id="st-lat" type="number" step="0.000001"></label>
   <label>Longitude &#xB0;E<input id="st-lon" type="number" step="0.000001"></label>
   <label>Height m<input id="st-h" type="number" step="1" min="1"></label>
   <label>Width m<input id="st-w" type="number" step="1" min="1"></label>
  </div>
  <h4>Time window</h4>
  <div class="st-grid">
   <label>Start<input id="st-start" type="date"></label>
   <label>End<input id="st-end" type="date"></label>
   <label>Step h<input id="st-step" type="number" step="0.25" min="0.25" max="24"></label>
  </div>
  <h4>Filters</h4>
  <div class="st-grid">
   <label>Min moon altitude &#xB0;<input id="st-minAlt" type="number" step="0.5"></label>
   <label>Min distance m<input id="st-minDist" type="number" step="100" min="0"></label>
   <label>Max sun altitude &#xB0;<input id="st-maxSun" type="number" step="0.5"></label>
   <label>Min moon illum %<input id="st-minIllum" type="number" step="1" min="0" max="100"></label>
  </div>
  <h4>Display</h4>
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
<div id="cb-wrap" style="position:fixed;bottom:30px;right:10px;z-index:9999;
  background:white;padding:6px 4px 4px 4px;border-radius:6px;
  box-shadow:2px 2px 6px rgba(0,0,0,.35);">
 <canvas id="cb-canvas" width="68" height="210"></canvas>
</div>
<div id="pv-overlay">
 <div id="pv-box">
  <div id="pv-canvaswrap">
   <canvas id="pv-canvas" width="800" height="500"></canvas>
   <div id="pv-infobox"></div>
  </div>
  <div id="pv-ctrl">
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
   <button id="pv-orient">&#x2B1B; Landscape</button>
   <span style="border-left:1px solid #374151;margin:0 2px;align-self:stretch;"></span>
   <button id="pv-prev" title="Previous minute">&#x25C4; &#x2212;1 min</button>
   <span id="pv-offset" style="font-size:11px;min-width:40px;text-align:center;color:#9ca3af">&#xB10 min</span>
   <button id="pv-next" title="Next minute">+1 min &#x25BA;</button>
   <span style="border-left:1px solid #374151;margin:0 2px;align-self:stretch;"></span>
   <label style="font-size:11px;color:#9ca3af;display:flex;align-items:center;gap:4px">&#x2600;&#xFE0F;
    <input id="pv-bright" type="range" min="1" max="4" value="1" step="0.1" style="width:80px;accent-color:#f59e0b">
    <span id="pv-bright-val" style="min-width:28px">&#xD7;1</span>
   </label>
   <button id="pv-info-toggle" style="margin-left:auto">&#x2139; Hide info</button>
   <button id="pv-close">&#x2715; Close</button>
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
function maxElevAngle(la,lo,oe,azDeg){
  const r=Math.PI/180,ca=Math.cos(azDeg*r),sa=Math.sin(azDeg*r);
  const cl=Math.cos(la*r);
  let mx=-30;
  for(let d=50;d<=14000;d+=50){
    const e=sampleGrid(la+(d*ca)/111111,lo+(d*sa)/(111111*cl));
    const a=Math.atan2(e-oe,d)*180/Math.PI;
    if(a>mx)mx=a;
  }
  return mx;
}
function computeSkyline(la,lo,oe,camAz,hFov,n){
  const sl=new Float32Array(n);
  for(let i=0;i<n;i++)
    sl[i]=maxElevAngle(la,lo,oe,camAz-hFov/2+(i/(n-1))*hFov);
  return sl;
}

// ── WebGL setup ───────────────────────────────────────────────────────────────
const canvas=document.getElementById('pv-canvas');
const gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
let prog,skyTex,uL={},glReady=false;

const VERT=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FRAG=`precision mediump float;
uniform vec2 uRes;
uniform float uCamAz,uCamEl,uHFov,uVFov;
uniform float uMoonAz,uMoonAlt,uMoonRad;
uniform float uObjAz,uObjElC,uObjHH,uObjHW;
uniform float uSkyB,uBright;
uniform sampler2D uSL;
float wd(float a,float b){return mod(a-b+180.,360.)-180.;}
void main(){
  vec2 ndc=(gl_FragCoord.xy/uRes)*2.-1.;
  float pAz=uCamAz+ndc.x*uHFov*.5;
  float pEl=uCamEl+ndc.y*uVFov*.5;
  float slEl=texture2D(uSL,vec2((ndc.x+1.)*.5,.5)).r*120.-30.;
  bool ter=pEl<slEl;
  float t=clamp((pEl+5.)/50.,0.,1.);
  vec3 hc=mix(vec3(.05,.04,.02),vec3(.08,.13,.30),uSkyB);
  vec3 zc=mix(vec3(.01,.01,.07),vec3(.02,.04,.20),uSkyB);
  vec3 col=ter?vec3(.12,.09,.07):mix(hc,zc,t);
  float daz=wd(pAz,uMoonAz),del=pEl-uMoonAlt,md=sqrt(daz*daz+del*del);
  if(!ter){
    col=mix(col,vec3(1.,.97,.76),smoothstep(uMoonRad*1.1,uMoonRad*.85,md));
    col+=vec3(.9,.85,.5)*exp(-md/(uMoonRad*3.))*.12;
  }
  float oaz=wd(pAz,uObjAz),oel=pEl-uObjElC;
  if(abs(oaz)<uObjHW&&abs(oel)<uObjHH)col=vec3(.04,.04,.04);
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
   'uObjAz','uObjElC','uObjHH','uObjHW','uSkyB','uBright','uSL']
    .forEach(n=>uL[n]=gl.getUniformLocation(prog,n));
  gl.uniform1i(uL.uSL,0);
  glReady=true;
}
function uploadSL(sl){
  gl.bindTexture(gl.TEXTURE_2D,skyTex);
  if(glFloatTex){
    const f=new Float32Array(sl.length);
    for(let i=0;i<sl.length;i++)f[i]=(sl[i]+30)/120;
    gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,sl.length,1,0,
                  gl.LUMINANCE,gl.FLOAT,f);
  }else{
    const b=new Uint8Array(sl.length);
    for(let i=0;i<sl.length;i++)
      b[i]=Math.max(0,Math.min(255,Math.round((sl[i]+30)/120*255)));
    gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,sl.length,1,0,
                  gl.LUMINANCE,gl.UNSIGNED_BYTE,b);
  }
}

// ── Camera + navigation controls ──────────────────────────────────────────────
let portrait=false,lastArgs=null;
let curOffset=0,curArrow=null,curLa=0,curLo=0;

function updateTitleBar(){
  const c=CONFIG;
  const s=c.startISO.slice(0,10),e=c.endISO.slice(0,10);
  document.getElementById('title-bar').innerHTML=
    `Moon shadow tips &nbsp;|&nbsp; ${c.objLat.toFixed(5)}&deg;N, ${c.objLon.toFixed(5)}&deg;E &nbsp;|&nbsp; H = ${c.objH} m<br>`+
    `${s} &ndash; ${e} &nbsp;&middot;&nbsp; &Delta;t = ${c.stepH} h &nbsp;&middot;&nbsp;`+
    ` min moon alt = ${c.minAltDeg}&deg; &nbsp;&middot;&nbsp;`+
    ` max sun alt = ${c.maxSunAltDeg}&deg; &nbsp;&middot;&nbsp;`+
    ` min moon illum = ${c.minMoonIllumPct}%`;
}
function updateNavUI(){
  document.getElementById('pv-prev').disabled=(curOffset<=-15);
  document.getElementById('pv-next').disabled=(curOffset>=15);
  document.getElementById('pv-offset').textContent=
    curOffset===0?'\xB10 min':(curOffset>0?'+'+curOffset+' min':curOffset+' min');
}
document.getElementById('pv-prev').onclick=function(){
  if(curOffset>-15){curOffset--;render(curLa,curLo,curArrow);}
};
document.getElementById('pv-next').onclick=function(){
  if(curOffset<15){curOffset++;render(curLa,curLo,curArrow);}
};
function applyPortraitClass(){
  document.getElementById('pv-overlay').classList.toggle('portrait',portrait);
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
document.getElementById('pv-close').onclick=()=>
  document.getElementById('pv-overlay').classList.remove('open');

// ── Info overlay ──────────────────────────────────────────────────────────────
function updateInfoBox(la,lo,oe,dist,mm){
  const [mAlt,mAz,mIllum,sAlt,tStr]=mm;
  document.getElementById('pv-infobox').textContent=[
    '\u{1F550} '+tStr, '',
    '\u{1F4CD} Observer',
    '   lat '+la.toFixed(5)+'\xB0  lon '+lo.toFixed(5)+'\xB0',
    '   elevation '+Math.round(oe)+' m', '',
    '\u{1F5FC} Object',
    '   lat '+CONFIG.objLat.toFixed(5)+'\xB0  lon '+CONFIG.objLon.toFixed(5)+'\xB0',
    '   base elev '+Math.round(CONFIG.objElev)+' m  height '+CONFIG.objH+' m',
    '   distance '+Math.round(dist)+' m', '',
    '\u{1F319} Moon',
    '   altitude  '+mAlt.toFixed(2)+'\xB0',
    '   azimuth   '+mAz.toFixed(2)+'\xB0',
    '   illum.    '+mIllum.toFixed(1)+'%', '',
    '☀️ Sun altitude  '+sAlt.toFixed(2)+'\xB0',
  ].join('\n');
}
function getCam(){
  const f=parseFloat(document.getElementById('pv-focal').value)||400;
  const [sw,sh]=document.getElementById('pv-sensor').value.split(',').map(Number);
  const [w,h]=portrait?[sh,sw]:[sw,sh];
  return{hFov:2*Math.atan(w/2/f)*180/Math.PI,
         vFov:2*Math.atan(h/2/f)*180/Math.PI,
         aspect:w/h};
}

// ── Moon position (Meeus Ch.47, topocentric, no refraction) ───────────────────
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
  const altDeg=altGeo-HPdeg*Math.cos(altGeo*DEG);
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
  const sunAltDeg=Math.asin(Math.max(-1,Math.min(1,ssinAlt)))/DEG;
  const cosElong=Math.sin(sunDec)*Math.sin(dec)+Math.cos(sunDec)*Math.cos(dec)*Math.cos(sunRA-ra);
  return{altDeg,azDeg,illPct:(1-cosElong)/2*100,sunAltDeg};
}

// ── Shadow tip (terrain ray-march) ────────────────────────────────────────────
function computeShadowTip(moonAltDeg,moonAzDeg){
  const DEG=Math.PI/180,R=6371000;
  if(moonAltDeg<=0)return null;
  const tanAlt=Math.tan(moonAltDeg*DEG);
  const shadowAzRad=((moonAzDeg+180)%360)*DEG;
  const sinAz=Math.sin(shadowAzRad),cosAz=Math.cos(shadowAzRad);
  const cosLat=Math.cos(CONFIG.objLat*DEG);
  const rayAlt0=CONFIG.objElev+CONFIG.objH;
  const maxD=(rayAlt0/tanAlt)*1.5;
  let prevD=0,prevGap=CONFIG.objH;
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
  const flatD=CONFIG.objH/tanAlt;
  return[CONFIG.objLat+flatD*cosAz/(R*DEG),
         CONFIG.objLon+flatD*sinAz/(R*cosLat*DEG)];
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
    const{altDeg,azDeg,illPct,sunAltDeg}=moonAltAzJS(CONFIG.objLat,CONFIG.objLon,CONFIG.objElev,utcStr);
    mins.push([altDeg,azDeg,illPct,sunAltDeg,msToDisplayStr(ms)]);
  }
  return mins;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render(la,lo,arrow){
  lastArgs=[la,lo,arrow];
  curArrow=arrow;curLa=la;curLo=lo;
  initGL();
  const mm=arrow.moonMinutes[curOffset+15];
  const oe=sampleGrid(la,lo);
  const caz=bearing(la,lo,CONFIG.objLat,CONFIG.objLon);
  const dist=Math.max(haversine(la,lo,CONFIG.objLat,CONFIG.objLon),1);
  const midEl=CONFIG.objElev+CONFIG.objH*.5;
  const cel=Math.atan2(midEl-oe,dist)*180/Math.PI;
  const{hFov,vFov,aspect}=getCam();
  const maxW=Math.round(portrait?window.innerWidth*.45:Math.min(window.innerWidth*.92,900));
  const maxH=Math.round(window.innerHeight*.92)-90;
  const W=Math.min(maxW,Math.round(maxH*aspect));
  const H=Math.round(W/aspect);
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
  gl.viewport(0,0,W,H);
  const sl=computeSkyline(la,lo,oe,caz,hFov,1024);
  uploadSL(sl);
  const ohh=Math.atan(CONFIG.objH/2/dist)*180/Math.PI;
  const ohw=Math.atan(CONFIG.objW/2/dist)*180/Math.PI;
  const oelC=Math.atan2(midEl-oe,dist)*180/Math.PI;
  const skyB=Math.max(0,Math.min(1,(mm[3]+18)/12));
  gl.uniform2f(uL.uRes,W,H);
  gl.uniform1f(uL.uCamAz,caz);gl.uniform1f(uL.uCamEl,cel);
  gl.uniform1f(uL.uHFov,hFov);gl.uniform1f(uL.uVFov,vFov);
  gl.uniform1f(uL.uMoonAz,mm[1]);gl.uniform1f(uL.uMoonAlt,mm[0]);
  gl.uniform1f(uL.uMoonRad,.264);
  gl.uniform1f(uL.uObjAz,caz);gl.uniform1f(uL.uObjElC,oelC);
  gl.uniform1f(uL.uObjHH,ohh);gl.uniform1f(uL.uObjHW,ohw);
  gl.uniform1f(uL.uSkyB,skyB);
  gl.uniform1f(uL.uBright,parseFloat(document.getElementById('pv-bright').value)||1);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,skyTex);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  updateInfoBox(la,lo,oe,dist,mm);
  updateNavUI();
  document.getElementById('pv-info').textContent=
    'Observer: '+la.toFixed(4)+'\xB0N, '+lo.toFixed(4)+'\xB0E'
    +' | Elev: '+Math.round(oe)+' m'
    +' | Dist: '+Math.round(dist)+' m'
    +' | Use ◄ ► to step \xB11 min  (range: \xB115 min)';
}

let observerMarker=null,_objMarker=null,_map=null;
function openPreview(la,lo,arrow){
  curOffset=0;
  if(!arrow.moonMinutes)arrow.moonMinutes=computeMoonMinutes(arrow.tMS);
  document.getElementById('pv-overlay').classList.add('open');
  applyPortraitClass();
  render(la,lo,arrow);
  if(_map){
    if(observerMarker)observerMarker.setLatLng([la,lo]);
    else observerMarker=L.circleMarker([la,lo],
      {radius:7,color:'#16a34a',fillColor:'#4ade80',fillOpacity:1,weight:2})
      .addTo(_map);
  }
}

// ── Arrow building & rendering ─────────────────────────────────────────────────
const arrowLayers=[];
function clearArrows(){
  arrowLayers.forEach(({line,mkr})=>{
    if(_map){_map.removeLayer(line);if(mkr)_map.removeLayer(mkr);}
  });
  arrowLayers.length=0;
}
function addArrow(arrow){
  const line=L.polyline(arrow.pts,{color:arrow.color,weight:2.5,opacity:.85})
    .on('click',e=>{L.DomEvent.stop(e);openPreview(e.latlng.lat,e.latlng.lng,arrow);})
    .addTo(_map);
  arrowLayers.push({line,mkr:null});
}
function buildAndRenderArrows(startDate,endDate){
  clearArrows();
  document.getElementById('status-badge').textContent='Computing…';
  setTimeout(()=>{
    const DEG=Math.PI/180,R=6371000;
    const startMS=new Date(startDate+'T00:00:00Z').getTime();
    const endMS  =new Date(endDate  +'T23:59:59Z').getTime();
    const fullStartMS=new Date(CONFIG.startISO).getTime();
    const fullEndMS  =new Date(CONFIG.endISO  ).getTime();
    const stepMS=CONFIG.stepH*3600000;
    const halfLat=CONFIG.mapHalfKm*1000/(R*DEG);
    const halfLon=CONFIG.mapHalfKm*1000/(R*Math.cos(CONFIG.objLat*DEG)*DEG);
    const results=[];
    for(let tMS=fullStartMS;tMS<=fullEndMS;tMS+=stepMS){
      if(tMS<startMS||tMS>endMS)continue;
      const utcStr=msToUtcStr(tMS);
      const{altDeg,azDeg,illPct,sunAltDeg}=
        moonAltAzJS(CONFIG.objLat,CONFIG.objLon,CONFIG.objElev,utcStr);
      if(altDeg<CONFIG.minAltDeg||sunAltDeg>CONFIG.maxSunAltDeg
         ||illPct<CONFIG.minMoonIllumPct)continue;
      const pts=[-10,-5,0,5,10].map(dm=>{
        const s=msToUtcStr(tMS+dm*60000);
        const{altDeg:a,azDeg:z}=moonAltAzJS(CONFIG.objLat,CONFIG.objLon,CONFIG.objElev,s);
        return computeShadowTip(a,z);
      });
      const pc=pts[2]||pts[0];if(!pc)continue;
      if(Math.abs(pc[0]-CONFIG.objLat)>halfLat
         ||Math.abs(pc[1]-CONFIG.objLon)>halfLon)continue;
      if(haversine(CONFIG.objLat,CONFIG.objLon,pc[0],pc[1])<CONFIG.minDistM)continue;
      results.push({tMS,utcStr,pts});
    }
    const tSpan=endMS-startMS||1;
    drawColorbar(startMS,endMS);
    results.forEach(r=>{
      const color=plasmaColor((r.tMS-startMS)/tSpan);
      const valid=r.pts.filter(p=>p!==null);
      const p0=r.pts[0],p4=r.pts[4];
      const pts=(p0&&p4&&haversine(p0[0],p0[1],p4[0],p4[1])>100)
        ?valid:[p0||valid[0],p4||valid[valid.length-1]];
      addArrow({pts,color,tMS:r.tMS,tCenter:r.utcStr,moonMinutes:null});
    });
    document.getElementById('status-badge').textContent=results.length+' arrows';
  },10);
}

// ── Settings modal ────────────────────────────────────────────────────────────
if(!CONFIG.objW)CONFIG.objW=5;
if(!CONFIG.timezone)CONFIG.timezone='local';

document.getElementById('settings-btn').onclick=()=>{
  document.getElementById('st-lat').value=CONFIG.objLat;
  document.getElementById('st-lon').value=CONFIG.objLon;
  document.getElementById('st-h').value=CONFIG.objH;
  document.getElementById('st-w').value=CONFIG.objW;
  document.getElementById('st-start').value=CONFIG.startISO.slice(0,10);
  document.getElementById('st-end').value=CONFIG.endISO.slice(0,10);
  document.getElementById('st-step').value=CONFIG.stepH;
  document.getElementById('st-minAlt').value=CONFIG.minAltDeg;
  document.getElementById('st-minDist').value=CONFIG.minDistM;
  document.getElementById('st-maxSun').value=CONFIG.maxSunAltDeg;
  document.getElementById('st-minIllum').value=CONFIG.minMoonIllumPct;
  document.getElementById('st-tz').value=CONFIG.timezone;
  document.getElementById('st-overlay').classList.add('open');
};
document.getElementById('st-cancel').onclick=()=>
  document.getElementById('st-overlay').classList.remove('open');

document.getElementById('st-ok').onclick=async()=>{
  const newLat=parseFloat(document.getElementById('st-lat').value);
  const newLon=parseFloat(document.getElementById('st-lon').value);
  const locChanged=newLat!==CONFIG.objLat||newLon!==CONFIG.objLon;
  CONFIG.objLat     =newLat;
  CONFIG.objLon     =newLon;
  CONFIG.objH       =parseFloat(document.getElementById('st-h').value);
  CONFIG.objW       =parseFloat(document.getElementById('st-w').value);
  CONFIG.startISO   =document.getElementById('st-start').value+'T00:00:00Z';
  CONFIG.endISO     =document.getElementById('st-end').value+'T23:59:59Z';
  CONFIG.stepH      =parseFloat(document.getElementById('st-step').value);
  CONFIG.minAltDeg  =parseFloat(document.getElementById('st-minAlt').value);
  CONFIG.minDistM   =parseFloat(document.getElementById('st-minDist').value);
  CONFIG.maxSunAltDeg   =parseFloat(document.getElementById('st-maxSun').value);
  CONFIG.minMoonIllumPct=parseFloat(document.getElementById('st-minIllum').value);
  CONFIG.timezone=document.getElementById('st-tz').value.trim()||'local';
  document.getElementById('st-overlay').classList.remove('open');
  if(_map){
    _objMarker.setLatLng([CONFIG.objLat,CONFIG.objLon]);
    _map.flyTo([CONFIG.objLat,CONFIG.objLon],_map.getZoom());
  }
  if(locChanged){
    document.getElementById('status-badge').textContent='Loading terrain…';
    TERRAIN=await loadTerrain(CONFIG.objLat,CONFIG.objLon);
  }
  CONFIG.objElev=sampleGrid(CONFIG.objLat,CONFIG.objLon);
  updateTitleBar();
  const fullStart=CONFIG.startISO.slice(0,10);
  const fullEnd  =CONFIG.endISO  .slice(0,10);
  const ds=document.getElementById('df-start'),de=document.getElementById('df-end');
  ds.min=de.min=fullStart;ds.max=de.max=fullEnd;
  ds.value=fullStart;de.value=fullEnd;
  buildAndRenderArrows(fullStart,fullEnd);
};

// ── Init ──────────────────────────────────────────────────────────────────────
(async function waitForMap(){
  const m=window[MAP_VAR];
  if(!m){setTimeout(waitForMap,100);return;}
  _map=m;
  const objIcon=L.divIcon({
    html:'<div style="font-size:14px;line-height:1;color:#ef4444;text-shadow:0 1px 3px rgba(0,0,0,.8)">▲</div>',
    className:'',iconSize:[14,14],iconAnchor:[7,12]});
  _objMarker=L.marker([CONFIG.objLat,CONFIG.objLon],{icon:objIcon}).addTo(_map);
  const fullStart=CONFIG.startISO.slice(0,10);
  const fullEnd  =CONFIG.endISO  .slice(0,10);
  const ds=document.getElementById('df-start'),de=document.getElementById('df-end');
  ds.min=de.min=fullStart;ds.max=de.max=fullEnd;
  ds.value=fullStart;de.value=fullEnd;
  document.getElementById('status-badge').textContent='Loading terrain…';
  TERRAIN=await loadTerrain(CONFIG.objLat,CONFIG.objLon);
  CONFIG.objElev=sampleGrid(CONFIG.objLat,CONFIG.objLon);
  updateTitleBar();
  buildAndRenderArrows(fullStart,fullEnd);
  ['df-start','df-end'].forEach(id=>
    document.getElementById(id).addEventListener('input',()=>
      buildAndRenderArrows(
        document.getElementById('df-start').value,
        document.getElementById('df-end').value)));
})();

})(); // end application IIFE
