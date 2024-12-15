
# Blog Application - Documentation Complète

## Introduction
Ce projet est une application de blog développée avec **Node.js**, **Express**, et **MongoDB**. Il permet aux utilisateurs de créer, gérer et consulter des blogs avec des fonctionnalités avancées telles que :

- **Gestion des utilisateurs** : Authentification avec email/mot de passe, Google, et Discord.
- **Sécurité avancée** : Authentification à deux facteurs (2FA) et gestion sécurisée des sessions avec JWT.
- **Gestion des blogs** : Création de blogs publics ou privés avec gestion des images.
- **Téléchargement des fichiers** : Intégration d'un serveur dédié à la gestion des images.
- **Interface utilisateur** : Génération dynamique des vues avec **EJS**.

## Prérequis
Pour exécuter ce projet, assurez-vous d'avoir les éléments suivants installés sur votre machine :

- **Node.js** : Dernière version LTS.
- **MongoDB** : Base de données NoSQL.
- **Git** : Pour cloner le dépôt.

---

## Architecture du Projet
### Technologies Utilisées
#### Backend
- **Node.js** : Runtime pour exécuter le JavaScript côté serveur.
- **Express** : Framework minimaliste pour construire des applications web.
- **MongoDB** : Base de données NoSQL pour stocker les utilisateurs, blogs et images.
- **Multer** : Middleware pour gérer les téléchargements de fichiers.
- **Passport.js** : Gestion de l'authentification via Google et Discord.
- **jsonwebtoken** : Gestion des JWT pour la sécurité.
- **bcrypt** : Pour hasher les mots de passe.

#### Frontend
- **EJS** : Moteur de templates pour générer des pages HTML dynamiques.
- **Tailwind CSS** : Framework CSS pour le style et le design.

### Organisation du Code
- **MVC (Modèle-Vue-Contrôleur)** :
  - **Modèle** : Interaction avec MongoDB.
  - **Vue** : Pages dynamiques générées par EJS.
  - **Contrôleur** : Logique d'application entre le modèle et la vue.

---

## Fonctionnalités Clés
1. **Authentification** :
   - Inscription/Connexion par email et mot de passe.
   - Authentification via Google et Discord.
   - Authentification à deux facteurs (2FA) avec envoi de codes de vérification.

2. **Gestion des blogs** :
   - Création, modification et suppression de blogs.
   - Blogs publics (accessibles par tous) et privés (requérant une authentification).
   - Gestion avancée des images associées à chaque blog.

3. **Téléchargement et gestion des images** :
   - Les images sont gérées via un serveur dédié (`server-image`) qui tourne sur [http://localhost:4000](http://localhost:4000).
   - Limite de taille (5 Mo) et de format (PNG, JPG, GIF).
   - Prévisualisation et suppression des images avant soumission.

4. **Expérience utilisateur** :
   - Interface propre et réactive grâce à **Tailwind CSS**.
   - Prévisualisation des images directement sur l'interface utilisateur.
   - Gestion des messages d'erreur et des notifications (Flash messages).

---

## Installation

### 1. Cloner le Dépôt
```bash
git clone <https://github.com/Zack1088/OAuth.git>
cd <BLOG_APP>
cd <SERVER_IMAGES>
```

2. **Installer les dépendances dans les deux projet BLOG_APP et SERVER_IMAGE**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   Créez un fichier `.env` à la racine du projet BLOG-APP et ajoutez les informations suivantes :
   ```env
   MONGODB_URI=<URL-votre-mongodb>
   PORT=3000
   JWT_SECRET=<votre-secret-jwt>
   COOKIE_SECRET=<votre-cookie-secret>
   SESSION_SECRET=<votre-session-secret>
   GOOGLE_CLIENT_ID=<votre-client-id-google>
   GOOGLE_CLIENT_SECRET=<votre-client-secret-google>
   GOOGLE_CALLBACK_URL=<votre-callback-url-google>
   DISCORD_CLIENT_ID=<votre-client-id-discord>
   DISCORD_CLIENT_SECRET=<votre-client-secret-discord>
   DISCORD_CALLBACK_URL=<votre-callback-url-discord>
   IMAGE_CLIENT_ID=<votre-client-id-image-server>
   IMAGE_CLIENT_SECRET=<votre-client-secret-image-server>
   NODE_ENV=development
   ```
   Créez un fichier `.env` à la racine du projet SERVER_IMAGES et ajoutez les informations suivantes :
   ```env
   MONGODB_URI=<URL-votre-mongodb>
   PORT=4000
   ADMIN_JWT_SECRET=<votre-secret-jwt>
   JWT_SECRET=<votre-secret-jwt>
   NODE_ENV=development
   ```

4. **Démarrer les deux projets BLOG_APP et SERVER_IMAGES**
   ```bash
   npm run dev
   ```
   Le BLOG_APP sera accessible sur [http://localhost:3000](http://localhost:3000).
   Le SERVER_IMAGES sera accessible sur [http://localhost:4000](http://localhost:4000).

5. **Documentation annexe**
    - [Documentation passport-google-oauth20](https://www.passportjs.org/packages/passport-google-oauth20/)
    - [Documentation passport-discord](https://www.passportjs.org/packages/passport-discord/)


Merci pour ce projet très intéressant.