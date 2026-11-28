/* PRINCE MOVIE — animation d'ouverture « P » avec son : à chaque entrée sur le site (remplace l'ancien écran de chargement) et avant chaque lecture. */
(function () {
  "use strict";

  var page = document.documentElement.getAttribute("data-page") || "";
  var isPlayer = /player\.html/i.test(location.pathname);
  var isHome = !isPlayer && /(^|\/)(index\.html)?$/i.test(location.pathname);

  // Pas de rejeu quand on revient en arrière depuis le lecteur : on n'ouvre l'animation qu'à une vraie entrée.
  var navType = "";
  try { var nav = performance.getEntriesByType("navigation")[0]; navType = nav ? nav.type : ""; } catch (e) { /* ignoré */ }
  var skipAuto = isHome && navType === "back_forward";

  var DURATION = isPlayer ? 2800 : 3600;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var resolveIntro;
  var promise = new Promise(function (r) { resolveIntro = r; });
  promise.done = false;
  window.PMIntro = promise;
  if (!isHome || skipAuto) { promise.done = true; resolveIntro(); return; }

  var SPARKS = 22;
  function sparksHtml() {
    var out = "";
    for (var i = 0; i < SPARKS; i++) {
      var x = Math.round(Math.random() * 100);
      var size = 2 + Math.round(Math.random() * 4);
      var delay = (Math.random() * 1.6).toFixed(2);
      var dur = (2.2 + Math.random() * 1.8).toFixed(2);
      var drift = Math.round(Math.random() * 60 - 30);
      out += '<i style="left:' + x + '%;width:' + size + "px;height:" + size + "px;animation-delay:" + delay + "s;animation-duration:" + dur + "s;--dx:" + drift + 'px"></i>';
    }
    return out;
  }
  function lettersHtml(text) {
    return text.split("").map(function (c, i) {
      return '<span style="animation-delay:' + (1.15 + i * 0.07).toFixed(2) + 's">' + (c === " " ? "&nbsp;" : c) + "</span>";
    }).join("");
  }

  var T = DURATION - 600;
  var css = [
    ".pm-intro{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;overflow:hidden;background:#04010a;animation:pmi-out .6s ease-in " + T + "ms forwards}",
    ".pm-intro *{box-sizing:border-box}",
    ".pm-rays{position:absolute;left:50%;top:46%;width:230vmax;height:230vmax;margin:-115vmax 0 0 -115vmax;opacity:0;background:repeating-conic-gradient(from 0deg,rgba(168,85,247,.22) 0 5deg,transparent 5deg 14deg);-webkit-mask-image:radial-gradient(closest-side,#000 6%,transparent 52%);mask-image:radial-gradient(closest-side,#000 6%,transparent 52%);animation:pmi-rays 3.6s ease-out .1s forwards}",
    ".pm-glow{position:absolute;left:50%;top:46%;width:90vmin;height:90vmin;margin:-45vmin 0 0 -45vmin;border-radius:50%;background:radial-gradient(closest-side,rgba(155,61,255,.75),rgba(96,28,200,.25) 55%,transparent 72%);opacity:0;animation:pmi-glow 2.4s ease-out .15s forwards}",
    ".pm-sparks{position:absolute;inset:0;overflow:hidden}",
    ".pm-sparks i{position:absolute;bottom:-10px;border-radius:50%;background:#e9d5ff;box-shadow:0 0 10px 2px rgba(192,132,252,.9);opacity:0;animation-name:pmi-spark;animation-timing-function:ease-out;animation-fill-mode:forwards}",
    ".pm-stage{position:relative;display:grid;justify-items:center;margin-top:-4vh}",
    ".pm-p{position:relative;font:900 clamp(170px,38vw,340px)/.95 Poppins,Archivo,system-ui,sans-serif;letter-spacing:-.04em;padding:0 .12em;background:linear-gradient(165deg,#ffffff 0%,#e1c4ff 30%,#a855f7 62%,#6d12e8 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 46px rgba(155,61,255,.85)) drop-shadow(0 6px 0 rgba(60,10,140,.55));opacity:0;transform:scale(.4) rotate(-6deg);animation:pmi-p 1.4s cubic-bezier(.18,.9,.22,1.1) .2s forwards}",
    ".pm-p::after{content:'P';position:absolute;inset:0;background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.95) 50%,transparent 65%);background-size:250% 100%;background-position:130% 0;-webkit-background-clip:text;background-clip:text;color:transparent;animation:pmi-shine 1.1s ease-in-out 1.05s forwards}",
    ".pm-ring{position:absolute;left:50%;top:46%;width:24vmin;height:24vmin;margin:-12vmin 0 0 -12vmin;border-radius:50%;border:2px solid rgba(215,180,255,.85);opacity:0;animation:pmi-ring 1.6s ease-out .45s forwards}",
    ".pm-ring.b{animation-delay:.75s;border-color:rgba(168,85,247,.7)}",
    ".pm-word{display:flex;margin-top:2vh;font:800 clamp(20px,5vw,40px)/1 Poppins,system-ui,sans-serif;letter-spacing:.38em;color:#fff;text-shadow:0 0 24px rgba(155,61,255,.9)}",
    ".pm-word span{opacity:0;transform:translateY(14px);filter:blur(6px);animation:pmi-letter .5s ease-out forwards}",
    ".pm-word span:nth-child(n+7){color:#c084fc}",
    ".pm-tag{margin-top:14px;font:500 clamp(12px,2.4vw,17px)/1 Poppins,system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#cbb6f2;opacity:0;animation:pmi-tag .8s ease-out 2.1s forwards}",
    ".pm-line{width:0;height:2px;margin-top:18px;border-radius:2px;background:linear-gradient(90deg,transparent,#c084fc,transparent);box-shadow:0 0 14px rgba(168,85,247,.9);animation:pmi-line 1s ease-out 1.9s forwards}",
    ".pm-skip{position:absolute;right:18px;bottom:calc(18px + env(safe-area-inset-bottom));padding:9px 18px;border-radius:999px;border:1.5px solid rgba(199,155,255,.7);background:rgba(18,8,38,.6);color:#fff;font:600 13px Poppins,system-ui,sans-serif;opacity:0;animation:pmi-tag .5s ease-out .6s forwards}",
    ".pm-skip:hover{border-color:#fff;background:rgba(110,40,210,.45)}",
    "@keyframes pmi-p{0%{opacity:0;transform:scale(.4) rotate(-6deg)}55%{opacity:1;transform:scale(1.08) rotate(1deg)}100%{opacity:1;transform:scale(1) rotate(0)}}",
    "@keyframes pmi-glow{0%{opacity:0;transform:scale(.5)}45%{opacity:1}100%{opacity:.8;transform:scale(1.15)}}",
    "@keyframes pmi-rays{0%{opacity:0;transform:rotate(0) scale(.6)}30%{opacity:1}100%{opacity:.55;transform:rotate(38deg) scale(1)}}",
    "@keyframes pmi-ring{0%{opacity:.95;transform:scale(.35)}100%{opacity:0;transform:scale(7)}}",
    "@keyframes pmi-shine{to{background-position:-60% 0}}",
    "@keyframes pmi-letter{to{opacity:1;transform:none;filter:none}}",
    "@keyframes pmi-tag{to{opacity:1}}",
    "@keyframes pmi-line{to{width:min(60vw,380px)}}",
    "@keyframes pmi-spark{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-85vh)}}",
    "@keyframes pmi-out{to{opacity:0;visibility:hidden;transform:scale(1.04)}}",
    "@media (prefers-reduced-motion:reduce){.pm-rays,.pm-glow,.pm-sparks,.pm-ring{display:none}.pm-p,.pm-word span,.pm-tag,.pm-line,.pm-skip{animation-duration:.01s;animation-delay:0s}.pm-p{opacity:1;transform:none}.pm-line{width:min(60vw,380px)}}"
  ].join("\n");

  // Petit « boum » grave, montée lumineuse puis note qui s'ouvre : fabriqué avec la Web Audio API (aucun fichier audio).
  var audio;
  function playSound() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio = audio || new Ctx();
      if (audio.state === "suspended") audio.resume();
      var t = audio.currentTime + 0.05;
      var master = audio.createGain();
      master.gain.value = 0.55;
      master.connect(audio.destination);
      function tone(freq, start, len, type, peak, endFreq) {
        var o = audio.createOscillator();
        var g = audio.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t + start);
        if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + start + len);
        g.gain.setValueAtTime(0.0001, t + start);
        g.gain.exponentialRampToValueAtTime(peak, t + start + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + start + len);
        o.connect(g); g.connect(master);
        o.start(t + start); o.stop(t + start + len + 0.05);
      }
      tone(60, 0.18, 1.8, "sine", 1.0, 38);        // boum très grave
      tone(120, 0.18, 1.5, "triangle", 0.4, 70);   // corps du boum
      tone(196, 0.5, 1.6, "sine", 0.28, 196);      // accord qui s'ouvre
      tone(247, 0.5, 1.6, "sine", 0.22, 247);
      tone(294, 0.5, 1.6, "sine", 0.2, 294);
      tone(392, 1.0, 1.5, "sine", 0.18, 784);      // montée lumineuse
      tone(1568, 1.15, 0.9, "sine", 0.05, 2093);   // étincelle aiguë
    } catch (e) { /* son indisponible : l'animation joue quand même */ }
  }

  function finish(root) {
    if (promise.done) return;
    promise.done = true;
    if (root && root.parentNode) root.parentNode.removeChild(root);
    resolveIntro();
  }

  function start() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.className = "pm-intro";
    root.setAttribute("role", "presentation");
    root.innerHTML =
      '<div class="pm-glow"></div><div class="pm-rays"></div><div class="pm-sparks">' + sparksHtml() + "</div>" +
      '<div class="pm-ring"></div><div class="pm-ring b"></div>' +
      '<div class="pm-stage" aria-hidden="true"><div class="pm-p">P</div>' +
      '<div class="pm-word">' + lettersHtml("PRINCE MOVIE") + "</div><div class=\"pm-line\"></div>" +
      '<div class="pm-tag">Films et séries en français</div></div>' +
      '<button class="pm-skip" type="button">Passer</button>';
    document.body.appendChild(root);

    playSound();
    // Si le navigateur bloque le son au démarrage, le premier toucher ou clic le débloque.
    var unlock = function () { if (audio && audio.state === "suspended") audio.resume(); };
    ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, unlock, { once: true }); });

    var timer = setTimeout(function () { finish(root); }, reduce ? 800 : DURATION);
    root.querySelector(".pm-skip").addEventListener("click", function () {
      clearTimeout(timer);
      try { if (audio) audio.close(); } catch (e) { /* ignoré */ }
      finish(root);
    });
  }

  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
