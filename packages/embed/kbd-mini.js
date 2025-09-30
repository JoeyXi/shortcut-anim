(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.KbdMini = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CSS_TEXT =
    ".kbd-mini{max-width:720px;margin:16px auto;background:#0f1115;padding:20px;border-radius:18px;font:14px system-ui;color:#9aa4b2}\n" +
    ".kbd-mini .rows{position:relative}\n" +
    ".kbd-mini .row{display:flex;gap:8px;margin:10px 0;transform:translateX(var(--offset,0px));}\n" +
    ".kbd-mini .key{width:64px;height:56px;border-radius:12px;background:#2b2f36;box-shadow:inset 0 0 0 2px #20242a;position:relative}\n" +
    ".kbd-mini .w125{width:88px}.kbd-mini .w150{width:96px}.kbd-mini .w175{width:112px}.kbd-mini .w225{width:160px}.kbd-mini .w175x{width:128px}.kbd-mini .w6{width:416px}\n" +
    ".kbd-mini .label{position:absolute;inset:auto 0 10px 0;text-align:center;color:#e9eeff;font-weight:600;letter-spacing:.3px;text-shadow:0 1px 0 rgba(0,0,0,.25)}\n" +
    ".kbd-mini .active{background:linear-gradient(135deg,#00c2ff,#5a3bff);box-shadow:0 0 22px rgba(71,160,255,.35), inset 0 0 0 2px #3a3f5a;transform:translateY(1px);transition:all .2s ease}\n" +
    ".kbd-mini .pulse{animation:pulse 1.1s ease-in-out infinite}\n" +
    "@keyframes pulse{0%,100%{filter:drop-shadow(0 0 0 rgba(90,59,255,0))}50%{filter:drop-shadow(0 0 14px rgba(90,59,255,.45))}}\n";

  function injectCSSOnce() {
    if (document.getElementById("kbd-mini-style")) return;
    var style = document.createElement("style");
    style.id = "kbd-mini-style";
    style.textContent = CSS_TEXT;
    document.head.appendChild(style);
  }

  function detectOS() {
    var ua = navigator.userAgent || "";
    if (/Mac/i.test(ua)) return "mac";
    if (/Windows/i.test(ua)) return "win";
    return "mac";
  }

  function build(host, opts) {
    injectCSSOnce();
    var os =
      (opts && opts.os) ||
      (host.getAttribute("data-os") || "auto").toLowerCase();
    os = os === "auto" ? detectOS() : os;

    var seqAttr =
      (opts && Array.isArray(opts.seq) && opts.seq.join(",")) ||
      host.getAttribute("data-seq") ||
      "";
    var seq = seqAttr
      .split(",")
      .map(function (s) {
        return (s || "").trim().toLowerCase();
      })
      .filter(Boolean);

    // DOM helpers
    function row() {
      var r = document.createElement("div");
      r.className = "row";
      for (var i = 0; i < arguments.length; i++) r.appendChild(arguments[i]);
      return r;
    }
    var roleMap = {};
    function key(role, w, label) {
      var d = document.createElement("div");
      d.className = "key" + (w ? " " + w : "");
      if (role) {
        d.dataset.role = role;
        roleMap[role] = d;
      }
      if (label) {
        var t = document.createElement("div");
        t.className = "label";
        t.textContent = label;
        d.appendChild(t);
      }
      return d;
    }

    var wrap = document.createElement("div");
    wrap.className = "rows";

    // Q row (offset 16px)
    var rQ = row(
      key(null, "w150", "Tab"),
      key("q", null, "Q"),
      key("w", null, "W"),
      key("e", null, "E"),
      key("r", null, "R"),
      key("t", null, "T"),
      key("y", null, "Y"),
      key("u", null, "U"),
      key("i", null, "I"),
      key("o", null, "O"),
      key("p", null, "P")
    );
    rQ.style.setProperty("--offset", "16px");

    // A row (offset 28px)
    var rA = row(
      key(null, "w175", "Caps"),
      key("a", null, "A"),
      key("s", null, "S"),
      key("d", null, "D"),
      key("f", null, "F"),
      key("g", null, "G"),
      key("h", null, "H"),
      key("j", null, "J"),
      key("k", null, "K"),
      key("l", null, "L")
    );
    rA.style.setProperty("--offset", "28px");

    // Z row (offset 40px)
    var rZ = row(
      key("shift", "w225", "Shift"),
      key("z", null, "Z"),
      key("x", null, "X"),
      key("c", null, "C"),
      key("v", null, "V"),
      key("b", null, "B"),
      key("n", null, "N"),
      key("m", null, "M")
    );
    rZ.style.setProperty("--offset", "40px");

    // Bottom row (offset 28px)
    var rB;
    if (os === "mac") {
      rB = row(
        key("fn", null, "fn"),
        key("control", "w125", "control"),
        key("option", "w125", "option"),
        key("command", "w175x", "command"),
        key("space", "w6", "")
      );
    } else {
      rB = row(
        key("control", "w125", "Ctrl"),
        key("win", "w125", "Win"),
        key("alt", "w125", "Alt"),
        key("space", "w6", "")
      );
    }
    rB.style.setProperty("--offset", "28px");

    wrap.appendChild(rQ);
    wrap.appendChild(rA);
    wrap.appendChild(rZ);
    wrap.appendChild(rB);
    host.appendChild(wrap);

    // Animation (auto-play)
    var els = seq
      .map(function (s) {
        return roleMap[s === "ctrl" ? "control" : s];
      })
      .filter(Boolean);
    var i = 0;
    var timer = null;
    function clear() {
      host.querySelectorAll(".key").forEach(function (k) {
        k.classList.remove("active", "pulse");
      });
    }
    function step() {
      if (!els.length) return;
      clear();
      els[i].classList.add("active", "pulse");
      i = (i + 1) % els.length;
    }
    function play() {
      if (timer || !els.length) return;
      step();
      timer = setInterval(step, 700);
    }
    play();

    return {
      destroy: function () {
        clearInterval(timer);
        host.innerHTML = "";
      },
    };
  }

  // Auto bootstrap: find .kbd-mini
  function mountAll() {
	  var nodes = document.querySelectorAll(".kbd-mini");
	  for (var i = 0; i < nodes.length; i++) build(nodes[i], null);
	}
	if (typeof document !== "undefined" && !window.KBD_MINI_NO_AUTO) {
	  if (document.readyState === "loading") {
	    document.addEventListener("DOMContentLoaded", mountAll);
	  } else {
	    mountAll();
	  }
	}

  // Public API
  return {
    mount: function (el, options) {
      return build(el, options || {});
    },
  };
});