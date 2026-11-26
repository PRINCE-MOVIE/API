/* PRINCE MOVIE — notifications (cloche à côté de la recherche) */
(function () {
  "use strict";

  // Modifiez cette liste pour publier une annonce : id unique, titre, texte, date (AAAA-MM-JJ), lien facultatif.
  // Les notifications déjà lues sont mémorisées sur l'appareil de chaque visiteur.
  var ANNOUNCEMENTS = [
    { id: "2026-11-bienvenue", icon: "star", title: "Bienvenue sur PRINCE MOVIE", text: "Découvrez les films et séries du moment, ajoutez vos favoris avec le cœur et reprenez où vous vous étiez arrêté.", date: "2026-11-25" },
    { id: "2026-11-catalogue", icon: "movie", title: "Catalogue agrandi", text: "Les rangées affichent désormais beaucoup plus de films et de séries à parcourir.", date: "2026-11-25", href: "index.html" },
    { id: "2026-11-notifs", icon: "bell", title: "Nouveau : les notifications", text: "Retrouvez ici les nouveautés et annonces du site. Touchez une notification pour la marquer comme lue.", date: "2026-11-25" }
  ];

  var STORE = "prince:notif-read";
  var ICONS = {
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.500 2 6.500H4S6 14 6 9Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    star: '<path d="m12 3 2.600 5.600 6.100.7-4.500 4.200 1.200 6L12 16.500 6.600 19.500l1.200-6L3.300 9.300l6.100-.7Z"/>',
    movie: '<rect x="3.500" y="4.500" width="17" height="15" rx="2"/><path d="M8 4.500v15M16 4.500v15M3.500 9.500H8M3.500 14.500H8M16 9.500h4.500M16 14.500h4.500"/>',
    tv: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m8 3 4 4 4-4"/>'
  };

  function svg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.bell) + "</svg>";
  }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function readSet() {
    try { return new Set(JSON.parse(localStorage.getItem(STORE) || "[]")); } catch (e) { return new Set(); }
  }
  function saveSet(set) {
    try { localStorage.setItem(STORE, JSON.stringify(Array.from(set))); } catch (e) { /* ignoré */ }
  }
  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return "";
    var days = Math.round((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return "Aujourd’hui";
    if (days === 1) return "Hier";
    if (days < 7) return "Il y a " + days + " jours";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  function mount() {
    if (document.getElementById("notif-btn")) return;
    var topbar = document.querySelector(".topbar");
    if (!topbar) return;

    var wrap = document.createElement("div");
    wrap.className = "notif";
    wrap.innerHTML =
      '<button class="notif-btn" id="notif-btn" type="button" aria-label="Notifications" aria-haspopup="true" aria-expanded="false" aria-controls="notif-panel">' +
      svg("bell") + '<span class="notif-badge" id="notif-badge" hidden>0</span></button>' +
      '<div class="notif-panel" id="notif-panel" role="dialog" aria-label="Notifications" hidden>' +
      '<div class="notif-head"><strong>Notifications</strong><button class="notif-all" id="notif-all" type="button">Tout marquer comme lu</button></div>' +
      '<ul class="notif-list" id="notif-list"></ul></div>';

    var search = topbar.querySelector(".search-form");
    if (search && search.parentNode) search.parentNode.insertBefore(wrap, search.nextSibling);
    else topbar.appendChild(wrap);

    var btn = wrap.querySelector("#notif-btn");
    var panel = wrap.querySelector("#notif-panel");
    var list = wrap.querySelector("#notif-list");
    var badge = wrap.querySelector("#notif-badge");
    var markAll = wrap.querySelector("#notif-all");

    function items() {
      return ANNOUNCEMENTS.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    }
    function render() {
      var read = readSet();
      var all = items();
      var unread = all.filter(function (n) { return !read.has(n.id); }).length;
      badge.hidden = unread === 0;
      badge.textContent = unread > 9 ? "9+" : String(unread);
      btn.classList.toggle("has-unread", unread > 0);
      markAll.hidden = unread === 0;
      if (!all.length) {
        list.innerHTML = '<li class="notif-empty">Aucune notification pour le moment.</li>';
        return;
      }
      list.innerHTML = all.map(function (n) {
        var isNew = !read.has(n.id);
        var tag = n.href ? "a" : "button";
        var attrs = n.href ? ' href="' + esc(n.href) + '"' : ' type="button"';
        return '<li><' + tag + ' class="notif-item' + (isNew ? " is-new" : "") + '" data-id="' + esc(n.id) + '"' + attrs + ">" +
          '<span class="notif-ico">' + svg(n.icon) + "</span>" +
          '<span class="notif-txt"><b>' + esc(n.title) + "</b><span>" + esc(n.text) + "</span><small>" + esc(formatDate(n.date)) + "</small></span>" +
          (isNew ? '<i class="notif-dot" aria-label="Non lue"></i>' : "") +
          "</" + tag + "></li>";
      }).join("");
    }
    function open() {
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      render();
    }
    function close() {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (panel.hidden) open(); else close();
    });
    markAll.addEventListener("click", function () {
      var read = readSet();
      items().forEach(function (n) { read.add(n.id); });
      saveSet(read);
      render();
    });
    list.addEventListener("click", function (e) {
      var item = e.target.closest(".notif-item");
      if (!item) return;
      var read = readSet();
      read.add(item.dataset.id);
      saveSet(read);
      if (!item.getAttribute("href")) render();
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !wrap.contains(e.target)) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { close(); btn.focus(); }
    });
    window.addEventListener("storage", render);
    render();
  }

  // Le bandeau du haut est présent dès le départ ; on attend juste que la page soit prête.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
