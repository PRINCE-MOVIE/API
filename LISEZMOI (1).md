# PRINCE MOVIE — connexion Google (sans Firebase)

1. console.cloud.google.com → créez un projet.
2. **API et services → Écran de consentement OAuth** : type Externe, nom « Prince Movie », votre e-mail → Enregistrer. Puis « Publier l'application ».
3. **Identifiants → Créer des identifiants → ID client OAuth → Application Web**.
   - Origines JavaScript autorisées : `https://play-box-nine.vercel.app`
4. Copiez l'ID client dans `config.js` : `GOOGLE_CLIENT_ID: "xxxx.apps.googleusercontent.com"`.
5. Remettez les fichiers sur Vercel.

Propriétaire : yolandalabaston@gmail.com (config.js, ADMIN_EMAILS) — il doit se connecter avec Google pour voir la couronne et `admin.html`.

Limite : sans base de données, les comptes sont enregistrés dans le navigateur de chaque appareil. L'espace propriétaire ne voit donc que les comptes de CET appareil, pas tous les inscrits.
