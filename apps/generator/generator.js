const $ = s => document.querySelector(s);
const osSel = $('#os'), kb = $('#kb'), seqBox = $('#seq'), errBox = $('#err'), embedBox = $('#embed');

const ALIAS = {
  control: 'control', ctrl: 'control', '': 'control',
  shift: 'shift', '': 'shift',
  alt: 'alt', option: 'option', '': 'option',
  cmd: 'command', command: 'command', '': 'command', meta: 'command',
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
    errBox.textContent = '' + miss.join(', ');
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

function makeEmbedHTML(tokens, os) {
  var seq = (tokens || []).join(',');
  var osAttr = os || 'auto';

  var css =
    '.kbd-mini{max-width:720px;margin:16px auto;background:#0f1115;padding:20px;border-radius:18px;font:14px system-ui;color:#9aa4b2}\n' +
    '.kbd-mini .rows{position:relative}\n' +
    '.kbd-mini .row{display:flex;gap:8px;margin:10px 0;transform:translateX(var(--offset,0px));}\n' +
    '.kbd-mini .key{width:64px;height:56px;border-radius:12px;background:#2b2f36;box-shadow:inset 0 0 0 2px #20242a;position:relative}\n' +
    '.kbd-mini .w125{width:88px}.kbd-mini .w150{width:96px}.kbd-mini .w175{width:112px}.kbd-mini .w225{width:160px}.kbd-mini .w175x{width:128px}.kbd-mini .w6{width:416px}\n' +
    '.kbd-mini .label{position:absolute;inset:auto 0 10px 0;text-align:center;color:#e9eeff;font-weight:600;letter-spacing:.3px;text-shadow:0 1px 0 rgba(0,0,0,.25)}\n' +
    '.kbd-mini .active{background:linear-gradient(135deg,#00c2ff,#5a3bff);box-shadow:0 0 22px rgba(71,160,255,.35), inset 0 0 0 2px #3a3f5a;transform:translateY(1px);transition:all .2s ease}\n' +
    '.kbd-mini .pulse{animation:pulse 1.1s ease-in-out infinite}\n' +
    '@keyframes pulse{0%,100%{filter:drop-shadow(0 0 0 rgba(90,59,255,0))}50%{filter:drop-shadow(0 0 14px rgba(90,59,255,.45))}}\n';

  var js =
    '(function(){\n' +
    '  var prev = document.currentScript.previousElementSibling;\n' +
    '  var host = (prev && prev.classList && prev.classList.contains("kbd-mini")) ? prev : document.querySelector(".kbd-mini:last-of-type");\n' +
    '  if(!host){ console.error("[kbd-mini] host not found"); return; }\n' +
    '  var osAttr = host.getAttribute("data-os") || "auto";\n' +
    '  var os = (osAttr==="auto") ? (/Mac/i.test(navigator.userAgent) ? "mac" : (/Windows/i.test(navigator.userAgent) ? "win" : "mac")) : osAttr;\n' +
    '  var seq = (host.getAttribute("data-seq")||"").split(",").map(function(s){return (s||"").trim().toLowerCase();}).filter(Boolean);\n' +
    '  function row(){ var r=document.createElement("div"); r.className="row"; for(var i=0;i<arguments.length;i++){ r.appendChild(arguments[i]); } return r; }\n' +
    '  var roleMap={};\n' +
    '  function key(role,w,label){ var d=document.createElement("div"); d.className="key"+(w?(" "+w):""); if(role){ d.dataset.role=role; roleMap[role]=d; } if(label){ var t=document.createElement("div"); t.className="label"; t.textContent=label; d.appendChild(t); } return d; }\n' +
    '  var wrap=document.createElement("div"); wrap.className="rows";\n' +
    '  var rQ = row( key(null,"w150","Tab"), key("q",null,"Q"), key("w",null,"W"), key("e",null,"E"), key("r",null,"R"), key("t",null,"T"), key("y",null,"Y"), key("u",null,"U"), key("i",null,"I"), key("o",null,"O"), key("p",null,"P") );\n' +
    '  rQ.style.setProperty("--offset","16px");\n' +
    '  var rA = row( key(null,"w175","Caps"), key("a",null,"A"), key("s",null,"S"), key("d",null,"D"), key("f",null,"F"), key("g",null,"G"), key("h",null,"H"), key("j",null,"J"), key("k",null,"K"), key("l",null,"L") );\n' +
    '  rA.style.setProperty("--offset","28px");\n' +
    '  var rZ = row( key("shift","w225","Shift"), key("z",null,"Z"), key("x",null,"X"), key("c",null,"C"), key("v",null,"V"), key("b",null,"B"), key("n",null,"N"), key("m",null,"M") );\n' +
    '  rZ.style.setProperty("--offset","40px");\n' +
    '  var rB;\n' +
    '  if(os==="mac"){\n' +
    '    rB = row( key("fn",null,"fn"), key("control","w125","control"), key("option","w125","option"), key("command","w175x","command"), key("space","w6","") );\n' +
    '  } else {\n' +
    '    rB = row( key("control","w125","Ctrl"), key("win","w125","Win"), key("alt","w125","Alt"), key("space","w6","") );\n' +
    '  }\n' +
    '  rB.style.setProperty("--offset","28px");\n' +
    '  wrap.appendChild(rQ); wrap.appendChild(rA); wrap.appendChild(rZ); wrap.appendChild(rB);\n' +
    '  host.appendChild(wrap);\n' +
    '  var els = seq.map(function(s){ return roleMap[s==="ctrl"?"control":s]; }).filter(Boolean);\n' +
    '  var i=0, timer=null;\n' +
    '  function clear(){ host.querySelectorAll(".key").forEach(function(k){ k.classList.remove("active","pulse"); }); }\n' +
    '  function step(){ if(!els.length) return; clear(); els[i].classList.add("active","pulse"); i=(i+1)%els.length; }\n' +
    '  function play(){ if(timer||!els.length) return; step(); timer=setInterval(step,700); }\n' +
    '  play();\n' +
    '})();';

  return [
    '<div class="kbd-mini" data-os="' + osAttr + '" data-seq="' + seq + '"></div>',
    '<script>' + js.replace(/<\/script>/gi, '<\\/script>') + '<\/script>',
    '<style>' + css + '</style>'
  ].join('\n');
}

$('#emit').onclick = () => {
  const tokens = parseSeq(seqBox.value);
  if (!tokens.length) {
    alert('');
    return;
  }
  embedBox.value = makeEmbedHTML(tokens, currentOS);
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