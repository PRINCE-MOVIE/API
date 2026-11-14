// admin.js — espace propriétaire : accessible seulement à l'e-mail propriétaire (vérifié) ; les règles Firestore refont la vérification côté serveur.
(async function () {
  const $ = (id) => document.getElementById(id);
  if (!(await PM.requireLogin()) || !PM.isAdmin()) { location.replace("index.html"); return; }
  const esc = PM.esc, day = (t) => (t ? new Date(t).toLocaleDateString() : "—");
  let users = [], cfg = {};
  const load = async () => {
    [users, cfg] = await Promise.all([PM.auth.listUsers(), PM.auth.siteConfig()]);
    const wk = Date.now() - 7 * 864e5;
    const st = [[users.length, "Utilisateurs"], [users.filter((u) => u.created > wk).length, "Nouveaux (7 j)"], [users.filter((u) => u.lastSeen > wk).length, "Actifs (7 j)"], [users.filter((u) => u.suspended).length, "Suspendus"]];
    $("stats").innerHTML = st.map(([n, l]) => `<div class="stat"><b>${n}</b><small>${l}</small></div>`).join("");
    draw();
  };
  const draw = () => {
    const q = $("q").value.trim().toLowerCase();
    $("rows").innerHTML = users.filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q)).sort((a, b) => (b.created || 0) - (a.created || 0)).map((u) => {
      const owner = PM.ADMINS.includes(String(u.email).toLowerCase());
      return `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${day(u.created)}</td><td>${day(u.lastSeen)}</td><td><span class="tag${u.suspended ? " off" : ""}">${owner ? "Propriétaire" : u.suspended ? "Suspendu" : "Actif"}</span></td>
        <td>${owner ? "" : `<button class="b ghost sm" data-s="${esc(u.uid)}">${u.suspended ? "Rétablir" : "Suspendre"}</button> <button class="b red sm" data-d="${esc(u.uid)}">Supprimer</button>`}</td></tr>`;
    }).join("") || '<tr><td colspan="6">Aucun utilisateur.</td></tr>';
  };
  $("q").addEventListener("input", draw);
  $("rows").addEventListener("click", async (e) => {
    const s = e.target.dataset.s, d = e.target.dataset.d;
    if (s) { const u = users.find((x) => x.uid === s); await PM.auth.setSuspended(s, !u.suspended); }
    else if (d && confirm("Supprimer les données de ce compte ? (Il pourra se réinscrire.)")) await PM.auth.removeUser(d);
    else return;
    load();
  });
  $("csv").onclick = () => {
    const rows = [["nom", "email", "inscrit", "vu", "suspendu"], ...users.map((u) => [u.name, u.email, day(u.created), day(u.lastSeen), u.suspended ? "oui" : "non"])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
    a.download = "utilisateurs.csv"; a.click();
  };
  load().catch(() => { $("stats").innerHTML = '<div class="stat"><small>Impossible de lire les données : vérifiez les règles Firestore (LISEZMOI.md).</small></div>'; });
})();
