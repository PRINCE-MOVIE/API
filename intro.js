/* PRINCE MOVIE — animation d'ouverture avec un « P » et un petit son, avant la lecture (style générique de cinéma). */
(function () {
  "use strict";
  var DURATION = 2600;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var resolveIntro;
  var promise = new Promise(function (r) { resolveIntro = r; });
  promise.done = false;
  window.PMIntro = promise;

  var css = [
    ".pm-intro{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;overflow:hidden;background:#05020c;animation:pmi-out .5s ease-in " + (DURATION - 500) + "ms forwards}",
    ".pm-intro::before{content:'';position:absolute;inset:-20%;background:radial-gradient(closest-side,rgba(124,31,255,.55),transparent 70%);opacity:0;animation:pmi-glow 2.2s ease-out .1s forwards}",
    ".pm-intro-p{position:relative;font:900 clamp(150px,34vw,300px)/1 Poppins,Archivo,system-ui,sans-serif;letter-spacing:-.04em;background:linear-gradient(160deg,#f5ebff 0%,#c084fc 45%,#7c1fff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 40px rgba(155,61,255,.8));opacity:0;transform:scale(.55);animation:pmi-p 1.5s cubic-bezier(.2,.9,.2,1) .15s forwards}",
    ".pm-intro-p::after{content:'';position:absolute;top:-10%;bottom:-10%;width:22%;left:-40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent);mix-blend-mode:overlay;transform:skewX(-18deg);animation:pmi-shine 1s ease-in-out 1s forwards}",
    ".pm-intro-ring{position:absolute;left:50%;top:50%;width:20vmin;height:20vmin;margin:-10vmin 0 0 -10vmin;border-radius:50%;border:3px solid rgba(199,155,255,.8);opacity:0;animation:pmi-ring 1.4s ease-out .35s forwards}",
    ".pm-intro-name{position:absolute;left:0;right:0;bottom:16%;text-align:center;font:700 clamp(14px,3vw,22px)/1 Poppins,system-ui,sans-serif;letter-spacing:.5em;padding-left:.5em;color:#d9c8f5;opacity:0;animation:pmi-name .8s ease-out 1.1s forwards}",
    ".pm-intro-skip{position:absolute;right:18px;bottom:18px;padding:8px 16px;border-radius:999px;border:1.5px solid rgba(199,155,255,.7);background:rgba(18,8,38,.6);color:#fff;font:600 13px Poppins,system-ui,sans-serif}",
    "@keyframes pmi-p{0%{opacity:0;transform:scale(.55)}40%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}",
    "@keyframes pmi-glow{0%{opacity:0;transform:scale(.6)}50%{opacity:1}100%{opacity:.75;transform:scale(1.1)}}",
    "@keyframes pmi-ring{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(6)}}",
    "@keyframes pmi-shine{0%{left:-40%}100%{left:130%}}",
    "@keyframes pmi-name{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
    "@keyframes pmi-out{to{opacity:0;visibility:hidden}}",
    "@media (prefers-reduced-motion:reduce){.pm-intro-p,.pm-intro-ring,.pm-intro::before,.pm-intro-name{animation-duration:.01s;animation-delay:0s}.pm-intro-p{opacity:1;transform:none}}"
  ].join("\n");

  // Petit « boum » grave suivi d'une montée lumineuse, fabriqué avec la Web Audio API (aucun fichier audio).
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
        g.gain.exponentialRampToValueAtTime(peak, t + start + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + start + len);
        o.connect(g); g.connect(master);
        o.start(t + start); o.stop(t + start + len + 0.05);
      }
      tone(110, 0.15, 1.6, "sine", 0.9, 55);      // boum grave
      tone(165, 0.15, 1.4, "triangle", 0.35, 82);  // harmonique
      tone(220, 0.55, 1.5, "sine", 0.3, 220);      // note qui tient
      tone(330, 0.55, 1.5, "sine", 0.2, 330);
      tone(440, 0.95, 1.3, "sine", 0.18, 880);     // montée finale
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
    root.innerHTML = '<div class="pm-intro-ring"></div><div class="pm-intro-p" aria-hidden="true">P</div>' +
      '<div class="pm-intro-name" aria-hidden="true">PRINCE MOVIE</div>' +
      '<button class="pm-intro-skip" type="button">Passer</button>';
    document.body.appendChild(root);

    playSound();
    // Si le navigateur bloque le son au démarrage, un premier toucher le débloque.
    var unlock = function () { if (audio && audio.state === "suspended") { audio.resume(); } };
    root.addEventListener("pointerdown", unlock, { once: true });

    var timer = setTimeout(function () { finish(root); }, reduce ? 700 : DURATION);
    root.querySelector(".pm-intro-skip").addEventListener("click", function () {
      clearTimeout(timer);
      try { if (audio) audio.close(); } catch (e) { /* ignoré */ }
      finish(root);
    });
  }

  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
