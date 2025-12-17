# TODO - Résolution des problèmes d'authentification et de navigation

## ✅ Tâches terminées
- [x] Mettre à jour le composant header pour utiliser useAuth et afficher conditionnellement les boutons Connexion/Inscription ou les infos utilisateur/déconnexion selon le statut d'authentification.
- [x] Protéger la route CandidaturePage pour que seuls les utilisateurs connectés puissent y accéder.
- [x] Améliorer le feedback de navigation après soumission de candidature pour éviter la confusion.

## 🔄 Étapes de suivi
- [ ] Tester le flux connexion/déconnexion et soumission de candidature.
- [ ] Vérifier que le header se met à jour correctement selon le statut d'authentification.

## 📝 Résumé des modifications

### Header Component (frontend/src/components/header.jsx)
- ✅ Ajout de l'import de `useAuth` depuis `authContext`
- ✅ Utilisation de `isAuthenticated`, `user`, et `logout` pour rendre conditionnellement le contenu
- ✅ Affichage du prénom de l'utilisateur et bouton de déconnexion quand connecté
- ✅ Boutons Connexion/Inscription quand non connecté
- ✅ Support mobile et desktop

### AppRoutes (frontend/src/AppRoutes.jsx)
- ✅ Protection de la route `/candidature/:offreId` avec `ProtectedRoute`

### CandidaturePage (frontend/src/pages/candidaturePage.jsx)
- ✅ Amélioration des messages de succès pour indiquer clairement la redirection
- ✅ Réduction du délai de redirection de 3 secondes à 2 secondes
- ✅ Messages plus explicites : "Redirection vers le test..." ou "Redirection vers les informations complémentaires..."
