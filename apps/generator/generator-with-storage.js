const $ = s => document.querySelector(s);
const osSel = $('#os'), kb = $('#kb'), seqBox = $('#seq'), errBox = $('#err'), embedBox = $('#embed');
const labelBox = $('#label');

const ALIAS = {
  control: 'control', ctrl: 'control', '⌃': 'control',
  shift: 'shift', '⇧': 'shift',
  alt: 'alt', option: 'option', '⌥': 'option',
  cmd: 'command', command: 'command', '⌘': 'command', meta: 'command',
  win: 'win',
  space: 'space', ' ': 'space'
};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach(ch => ALIAS[ch] = ch);

function detectOS() {
  const ua = navigator.userAgent || '';
  if (/Mac/i.test(ua)) return 'mac';
  if (/Windows/i.test(ua)) return 'win';
  return 'mac';
}
let currentOS = detectOS();
osSel.value = 'auto';

let roleMap = {};
function renderKeyboard(os) {
  kb.innerHTML = '';
  roleMap = {};

  const row = (...ks) => {
    const el = document.createElement('div');
    el.className = 'row';
    ks.forEach(k => el.appendChild(k));
    return el;
  };
  
  const key = (role, wClass, label) => {
    const d = document.createElement('div');
    d.className = 'key' + (wClass ? (' ' + wClass) : '');
    if (role) {
      d.dataset.role = role;
      roleMap[role] = d;
      if (role === 'control') roleMap['ctrl'] = d;
    }
    if (label) {
      const t = document.createElement('div');
      t.className = 'label';
      t.textContent = label;
      d.appendChild(t);
    }
    return d;
  };

 
  const numLabels = ['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
  const numRow = [key(null, 'w150', '`')];
  for (let i = 1; i < numLabels.length; i++) numRow.push(key(null, null, numLabels[i]));
  kb.appendChild(row(...numRow));


  const qRow = [key(null, 'w150', 'Tab')];
  'QWERTYUIOP'.split('').forEach(ch => {
    qRow.push(key(ch.toLowerCase(), null, ch));
  });
  kb.appendChild(row(...qRow));

  const aRow = [key(null, 'w175', 'Caps')];
  'ASDFGHJKL'.split('').forEach(ch => {
    const role = ch.toLowerCase();
    aRow.push(key(role, null, ch));
  });
  kb.appendChild(row(...aRow));

  const zRow = [key('shift', 'w225', 'Shift')];
  'ZXCVBNM'.split('').forEach(ch => zRow.push(key(ch.toLowerCase(), null, ch)));
  kb.appendChild(row(...zRow));

  if (os === 'mac') {
    kb.appendChild(row(
      key('fn', null, 'fn'),
      key('control', 'w125', 'control'),
      key('option', 'w125', 'option'),
      key('command', 'w175x', 'command'),
      key('space', 'w6', '')
    ));
  } else {
    kb.appendChild(row(
      key('control', 'w125', 'Ctrl'),
      key('win', 'w125', 'Win'),
      key('alt', 'w125', 'Alt'),
      key('space', 'w6', '')
    ));
  }
}

let seqEls = [], idx = 0, timer = null, base = 700;
function clearActive() {
  kb.querySelectorAll('.key').forEach(x => x.classList.remove('active', 'pulse'));
}
function step() {
  if (!seqEls.length) return;
  clearActive();
  seqEls[idx].classList.add('active', 'pulse');
  idx = (idx + 1) % seqEls.length;
}
function play() {
  if (timer || !seqEls.length) return;
  step();
  timer = setInterval(step, base / Number($('#speed').value || 1));
}
function pause() {
  clearInterval(timer);
  timer = null;
  kb.querySelectorAll('.key').forEach(x => x.classList.remove('pulse'));
}
$('#play').onclick = play;
$('#pause').onclick = pause;
$('#clear').onclick = () => {
  pause();
  clearActive();
  seqEls = [];
  seqBox.value = '';
};
$('#speed').oninput = e => {
  if (timer) {
    clearInterval(timer);
    timer = setInterval(step, base / Number(e.target.value || 1));
  }
};

function normToken(t) {
  t = (t || '').trim().toLowerCase();
  return ALIAS[t] || t;
}
function parseSeq(str) {
  return (str || '').replace(/\s*\+\s*/g, ',').replace(/\s+/g, ',').split(',').map(s => s.trim()).filter(Boolean).map(normToken);
}
function setSequence(tokens) {
  errBox.style.display = 'none';
  errBox.textContent = '';
  const miss = [], arr = [];
  tokens.forEach(t => {
    const key = (t === 'ctrl' ? 'control' : t);
    const el = roleMap[key];
    if (el) arr.push(el);
    else miss.push(t);
  });
  if (miss.length) {
    errBox.textContent = 'Key not found:' + miss.join(', ');
    errBox.style.display = 'block';
  }
  if (arr.length) {
    pause();
    clearActive();
    seqEls = arr;
    idx = 0;
    play();
  }
}
$('#apply').onclick = () => setSequence(parseSeq(seqBox.value));

function refreshOS() {
  currentOS = (osSel.value === 'auto') ? detectOS() : osSel.value;
  renderKeyboard(currentOS);
  if (!seqBox.value) seqBox.value = (currentOS === 'mac' ? 'control + shift + s' : 'ctrl + shift + s');
  setSequence(parseSeq(seqBox.value));
}
osSel.onchange = refreshOS;

let recording = false, pressed = [], held = new Set();
function normKeyEvent(e) {
  let k = (e.key || '').toLowerCase();
  if (k === 'alt') return (currentOS === 'mac' ? 'option' : 'alt');
  if (k.length === 1 && /[a-z]/.test(k)) return k;
  if (k === ' ') return 'space';
  if (k === 'meta') return (currentOS === 'win' ? 'win' : 'command');
  if (k === 'os') return 'win';
  return ALIAS[k] || k;
}
function startRec() {
  recording = true;
  pressed = [];
  held.clear();
  seqBox.value = '';
  errBox.style.display = 'none';
  window.addEventListener('keydown', onDown, true);
  window.addEventListener('keyup', onUp, true);
  $('#recordStart').disabled = true;
  $('#recordStop').disabled = false;
}
function stopRec(apply = true) {
  recording = false;
  window.removeEventListener('keydown', onDown, true);
  window.removeEventListener('keyup', onUp, true);
  $('#recordStart').disabled = false;
  $('#recordStop').disabled = true;
  if (apply) {
    seqBox.value = pressed.join(', ');
    setSequence(pressed);
  }
}
function onDown(e) {
  if (!recording) return;
  const t = normKeyEvent(e);
  const role = (t === 'ctrl' ? 'control' : t);
  if (!roleMap[role]) return;
  if (!held.has(role)) {
    held.add(role);
    pressed.push(role);
    seqBox.value = pressed.join(', ');
  }
  if (role === 'space') e.preventDefault();
}
function onUp(e) {
  if (!recording) return;
  const t = normKeyEvent(e);
  const role = (t === 'ctrl' ? 'control' : t);
  held.delete(role);
}
$('#recordStart').onclick = startRec;
$('#recordStop').onclick = () => stopRec(true);

function makeEmbedHTML(tokens, os){
  var seq = (tokens || []).join(',');
  var osAttr = os || 'auto';

  var speed = Number(document.querySelector('#speed')?.value || 1);
  var baseMs = 700;
  var intervalMs = Math.max(250, Math.round(baseMs / (speed || 1)));

  var labelText = (labelBox?.value || '').trim();

  var css =
    '.kbd-wrap{position:fixed;left:20px;bottom:50px;z-index:9999}\n' +
    '.kbd-mini{position:relative;background:#0f1115;border-radius:18px;padding:0;font:14px system-ui;color:#9aa4b2}\n' +
    '.kbd-mini .viewport{position:relative;overflow:hidden;border-radius:14px;margin:0 auto}\n' +
    '.kbd-mini .stage{position:absolute;left:0;top:0;will-change:transform;transition:transform .28s cubic-bezier(.22,.61,.36,1)}\n' +
    '.kbd-mini .row{display:flex;gap:8px;margin:10px 0;transform:translateX(var(--offset,0px));}\n' +
    '.kbd-mini .key{width:64px;height:56px;border-radius:12px;background:#2b2f36;box-shadow:inset 0 0 0 2px #20242a;position:relative}\n' +
    '.kbd-mini .w125{width:88px}.kbd-mini .w150{width:96px}.kbd-mini .w175{width:112px}.kbd-mini .w225{width:160px}.kbd-mini .w175x{width:128px}.kbd-mini .w6{width:416px}\n' +
    '.kbd-mini .label{position:absolute;inset:auto 0 10px 0;text-align:center;color:#e9eeff;font-weight:600;letter-spacing:.3px;text-shadow:0 1px 0 rgba(0,0,0,.25)}\n' +
    '.kbd-mini .active{background:linear-gradient(135deg,#00c2ff,#5a3bff);box-shadow:0 0 22px rgba(71,160,255,.35), inset 0 0 0 2px #3a3f5a;transform:translateY(1px)}\n' +
    '.kbd-mini .pulse{animation:pulse 1.1s ease-in-out infinite}\n' +
    '@keyframes pulse{0%,100%{filter:drop-shadow(0 0 0 rgba(90,59,255,0))}50%{filter:drop-shadow(0 0 14px rgba(90,59,255,.45))}}\n' +
    '.kbd-mini .caption{position:absolute;left:50%;bottom:-38px;transform:translateX(-50%);background:#12161c;color:#fff;padding:6px 10px;border-radius:10px;font-weight:600;font-size:12px;letter-spacing:.2px;box-shadow:0 4px 16px rgba(0,0,0,.25);white-space:nowrap;pointer-events:none}\n' +
    '.kbd-mini .btn{position:absolute;right:-10px;top:-10px;width:28px;height:28px;border-radius:50%;background:#7a8aa5;color:#e6ebff;border:1px solid #2a2f39;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;box-shadow:0 4px 16px rgba(0,0,0,.35)}\n' +
    '.kbd-mini .btn svg{display:block}\n' +
    '.kbd-pill{display:none;align-items:center;gap:8px;background:#12161c;color:#fff;padding:6px 10px;border-radius:999px;font-weight:600;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,.25);cursor:pointer}\n' +
    '.minimized .kbd-mini{display:none}\n' +
    '.minimized .kbd-pill{display:inline-flex}\n';

  var js =
    '(function(){' +
    'var mini=document.currentScript.previousElementSibling; var wrap=mini&&mini.parentElement; if(!mini||!wrap){console.error("[kbd-mini] host not found");return;}' +
    'var host=mini; var osAttr=host.getAttribute("data-os")||"auto";' +
    'function detectOS(){var ua=navigator.userAgent||""; if(/Mac|iPhone|iPad|iPod/i.test(ua))return "mac"; if(/Win/i.test(ua))return "win"; if(/Linux/i.test(ua))return "win"; return "mac";}' +
    'var os=(osAttr==="auto")?detectOS():osAttr;' +
    'var seq=(host.getAttribute("data-seq")||"").split(",").map(function(s){return (s||"").trim().toLowerCase();}).filter(Boolean);' +
    'var vw=parseInt(host.getAttribute("data-w")||"260",10); var vh=parseInt(host.getAttribute("data-h")||"140",10); var interval=Math.max(250,parseInt(host.getAttribute("data-interval")||"' + intervalMs + '",10));' +
    'var label=(host.getAttribute("data-label")||"");' +
    'var storageKey="kbd-mini-state-"+seq.join(",")+(label?"-"+label:"");' +
    'var viewport=document.createElement("div"); viewport.className="viewport"; viewport.style.width=vw+"px"; viewport.style.height=vh+"px"; host.appendChild(viewport);' +
    'var caption=document.createElement("div"); caption.className="caption"; host.appendChild(caption);' +
    'var btn=document.createElement("div"); btn.className="btn"; btn.setAttribute("role","button"); btn.title="Minimize";' +
    'var iconMinus=\'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="12" x2="19" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>\';' +
    'var iconExpand=\'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="9,5 19,5 19,15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15,19 5,19 5,9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\';' +
    'btn.innerHTML=iconMinus; host.appendChild(btn);' +
    'function row(){var r=document.createElement("div"); r.className="row"; for(var i=0;i<arguments.length;i++){r.appendChild(arguments[i]);} return r;}' +
    'var roleMap={}; function key(role,w,labelTxt){var d=document.createElement("div"); d.className="key"+(w?(" "+w):""); if(role){d.dataset.role=role; roleMap[role]=d;} if(labelTxt){var t=document.createElement("div"); t.className="label"; t.textContent=labelTxt; d.appendChild(t);} return d;}' +
    'var stage=document.createElement("div"); stage.className="stage";' +
    'var rQ=row(key(null,"w150","Tab"),key("q",null,"Q"),key("w",null,"W"),key("e",null,"E"),key("r",null,"R"),key("t",null,"T"),key("y",null,"Y"),key("u",null,"U"),key("i",null,"I"),key("o",null,"O"),key("p",null,"P")); rQ.style.setProperty("--offset","16px");' +
    'var rA=row(key(null,"w175","Caps"),key("a",null,"A"),key("s",null,"S"),key("d",null,"D"),key("f",null,"F"),key("g",null,"G"),key("h",null,"H"),key("j",null,"J"),key("k",null,"K"),key("l",null,"L")); rA.style.setProperty("--offset","28px");' +
    'var rZ=row(key("shift","w225","Shift"),key("z",null,"Z"),key("x",null,"X"),key("c",null,"C"),key("v",null,"V"),key("b",null,"B"),key("n",null,"N"),key("m",null,"M")); rZ.style.setProperty("--offset","40px");' +
    'var rB=(os==="mac")?row(key("fn",null,"fn"),key("control","w125","control"),key("option","w125","option"),key("command","w175x","command"),key("space","w6","")):row(key("control","w125","Ctrl"),key("win","w125","Win"),key("alt","w125","Alt"),key("space","w6","")); rB.style.setProperty("--offset","28px");' +
    'stage.appendChild(rQ); stage.appendChild(rA); stage.appendChild(rZ); stage.appendChild(rB); viewport.appendChild(stage);' +
    'var els=seq.map(function(s){return roleMap[s==="ctrl"?"control":s];}).filter(Boolean); var i=0,timer=null,buf="";' +
    'function prettyLabel(t){ if(os==="mac"){ if(t==="option")return "⌥ option"; if(t==="command")return "⌘ command"; if(t==="control")return "⌃ control"; if(t==="shift")return "⇧ shift"; } else { if(t==="win")return "⊞ Win"; if(t==="alt")return "Alt"; if(t==="ctrl"||t==="control")return "Ctrl"; } return t&&t.length===1?t.toUpperCase():t; }' +
    'function clear(){stage.querySelectorAll(".key").forEach(function(k){k.classList.remove("active","pulse");});}' +
    'function panTo(el){ if(!el)return; var st=stage.getBoundingClientRect(), er=el.getBoundingClientRect(); var cx=(er.left-st.left)+er.width/2, cy=(er.top-st.top)+er.height/2; var tx=(vw/2)-cx; var ty=(vh/2)-cy; stage.style.transform="translate("+tx+"px,"+ty+"px)"; }' +
    'function step(){ if(!els.length)return; clear(); var t=seq[i], el=els[i]; el.classList.add("active","pulse"); buf+=(buf?" + ":"")+prettyLabel(t); caption.textContent=buf; panTo(el); i=(i+1)%els.length; if(i===0) buf=""; }' +
    'function play(){ if(timer||!els.length)return; step(); timer=setInterval(step, interval); }' +
    'play();' +
    'var pill=document.createElement("div"); pill.className="kbd-pill"; var seqPretty=seq.map(prettyLabel).join(" + "); pill.textContent=(label?label+" ":"")+seqPretty; wrap.appendChild(pill);' +
    'function minimize(){ wrap.classList.add("minimized"); btn.innerHTML=iconExpand; btn.title="Restore"; try{localStorage.setItem(storageKey,"minimized");}catch(e){}}' +
    'function restore(){ wrap.classList.remove("minimized"); btn.innerHTML=iconMinus; btn.title="Minimize"; try{localStorage.setItem(storageKey,"expanded");}catch(e){}}' +
    'try{var savedState=localStorage.getItem(storageKey); if(savedState==="minimized"){wrap.classList.add("minimized"); btn.innerHTML=iconExpand; btn.title="Restore";}else{wrap.classList.remove("minimized"); btn.innerHTML=iconMinus; btn.title="Minimize";}}catch(e){}' +
    'btn.addEventListener("click",function(){ if(wrap.classList.contains("minimized")) restore(); else minimize(); });' +
    'pill.addEventListener("click",restore);' +
    '})();';

  var wrapperOpen  = '<div class="kbd-wrap">';
  var wrapperClose = '</div>';

  return [
    wrapperOpen,
    '<div class="kbd-mini" data-os="' + osAttr + '" data-seq="' + seq + '" data-w="260" data-h="260" data-interval="' + intervalMs + '" data-label="' + (labelText.replace(/"/g,'&quot;')) + '"></div>',
    '<script>' + js.replace(/<\/script>/gi,'<\\/script>') + '<\/script>',
    '<style>' + css + '</style>',
    wrapperClose
  ].join('\n');
}


$('#emit').onclick = () => {
  const tokens = parseSeq(seqBox.value);
  if (!tokens.length) {
    alert('Please record or enter a key sequence.');
    return;
  }
  // If "auto" is selected, generate auto-detection code; otherwise use the user's selected value
  const selectedOS = osSel.value === 'auto' ? 'auto' : currentOS;
  embedBox.value = makeEmbedHTML(tokens, selectedOS);
};
$('#copyEmbed').onclick = () => {
  embedBox.select();
  document.execCommand('copy');
};

(function init() {
  renderKeyboard(currentOS);
  const urlKeys = new URLSearchParams(location.search).get('keys');
  seqBox.value = urlKeys || (currentOS === 'mac' ? 'control + shift + s' : 'ctrl + shift + s');
  setSequence(parseSeq(seqBox.value));
})();

