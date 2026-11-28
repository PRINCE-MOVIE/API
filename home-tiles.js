/* PRINCE MOVIE — accès rapide « À la une » : réutilise la navigation existante. */
(function () {
  "use strict";
  document.addEventListener("click", function (event) {
    var tile = event.target.closest(".q-tile");
    if (!tile) return;
    var view = tile.dataset.go;
    var nav = document.querySelector('.nav-link[data-view="' + view + '"]');
    if (view === "home") {
      var cat = document.getElementById("catalogue");
      if (cat) cat.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (nav) { nav.click(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });
})();
