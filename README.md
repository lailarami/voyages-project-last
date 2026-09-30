# 🌍 VoyagesMA — Plateforme de Voyages Organisés

Plateforme complète de gestion de voyages organisés en ligne.  
**Laravel 12** (API REST) + **React JS + Vite** (Frontend) + **MySQL**

---

## 🚀 INSTALLATION RAPIDE

### Prérequis
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8+
- Git

---

## ⚙️ BACKEND (Laravel)

```bash
# 1. Aller dans le dossier backend
cd voyages-project/backend

# 2. Copier le fichier .env
cp .env.example .env

# 3. Installer les dépendances
composer install

# 4. Générer la clé d'application
php artisan key:generate

# 5. Générer le secret JWT
php artisan jwt:secret

# 6. Configurer la base de données dans .env :
#    DB_DATABASE=voyages_db
#    DB_USERNAME=root
#    DB_PASSWORD=votre_mot_de_passe

# 7. Créer la base de données MySQL
mysql -u root -p -e "CREATE DATABASE voyages_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 8. Lancer les migrations + seeders
php artisan migrate --seed

# 9. Créer le lien symbolique pour les images
php artisan storage:link

# 10. Démarrer le serveur
php artisan serve
```

Le backend tourne sur : **http://localhost:8000**

---

## 🎨 FRONTEND (React)

```bash
# 1. Aller dans le dossier frontend
cd voyages-project/frontend

# 2. Copier le fichier .env
cp .env.example .env

# 3. Installer les dépendances
npm install

# 4. Démarrer le serveur de développement
npm run dev
```

Le frontend tourne sur : **http://localhost:5173**

---

## 🔑 COMPTES DE DÉMONSTRATION

| Rôle        | Email                      | Mot de passe |
|-------------|----------------------------|--------------|
| Admin       | admin@voyages.ma           | password     |
| Client      | client@voyages.ma          | password     |
| Support     | support@voyages.ma         | password     |
| Fournisseur | fournisseur@voyages.ma     | password     |

---

## 💳 STRIPE (Paiement)

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Copiez vos clés API de test
3. Dans `backend/.env` :
```
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
```
4. Dans `frontend/.env` :
```
VITE_STRIPE_KEY=pk_test_...
```

**Carte de test :** `4242 4242 4242 4242` · Exp: `12/28` · CVC: `123`

---

## 🗂️ STRUCTURE DU PROJET

```
voyages-project/
├── backend/                    # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── VoyageController.php
│   │   │   ├── ReservationController.php
│   │   │   ├── PaiementController.php
│   │   │   ├── AdminController.php
│   │   │   ├── AvisTicketController.php
│   │   │   ├── WishlistController.php
│   │   │   └── FournisseurController.php
│   │   ├── Http/Middleware/
│   │   │   ├── JWTMiddleware.php
│   │   │   └── RoleMiddleware.php
│   │   └── Models/
│   │       ├── User.php
│   │       ├── Voyage.php
│   │       ├── Reservation.php
│   │       ├── Paiement.php
│   │       ├── Fournisseur.php
│   │       ├── Avis.php
│   │       ├── TicketSupport.php
│   │       └── Wishlist.php
│   ├── database/
│   │   ├── migrations/         # 8 migrations complètes
│   │   └── seeders/            # Données de démonstration
│   └── routes/api.php          # Toutes les routes API
│
└── frontend/                   # React + Vite
    └── src/
        ├── pages/
        │   ├── client/         # Home, Search, Detail, Booking, Checkout...
        │   ├── admin/          # Dashboard, Voyages, Users, Analytics...
        │   ├── supplier/       # Dashboard, Voyages, Reservations
        │   ├── support/        # Dashboard, Tickets
        │   └── auth/           # Login, Register
        ├── components/
        │   ├── layout/         # Navbar, Footer
        │   ├── cards/          # VoyageCard
        │   └── ui/             # PageLoader
        ├── layouts/            # ClientLayout, AdminLayout, AuthLayout
        ├── routes/             # PrivateRoute, RoleRoute
        ├── services/api.js     # Tous les appels API
        └── store/authStore.js  # Zustand auth store
```

---

## 🛣️ ROUTES API

| Méthode | Route                          | Accès      |
|---------|--------------------------------|------------|
| POST    | /api/auth/register             | Public     |
| POST    | /api/auth/login                | Public     |
| GET     | /api/voyages                   | Public     |
| GET     | /api/voyages/{id}              | Public     |
| POST    | /api/reservations              | Client     |
| POST    | /api/paiements/create-intent   | Client     |
| POST    | /api/paiements/confirm         | Client     |
| GET     | /api/admin/dashboard           | Admin      |
| GET     | /api/admin/analytics           | Admin      |
| GET     | /api/admin/users               | Admin      |
| GET     | /api/fournisseur/dashboard     | Fournisseur|
| GET     | /api/tickets                   | Auth       |

---

## 🎨 DESIGN SYSTEM

| Couleur    | Hex       |
|-----------|-----------|
| Primary   | #2563EB   |
| Secondary | #0F172A   |
| Accent    | #06B6D4   |
| Success   | #22C55E   |
| Danger    | #EF4444   |
| Background| #F8FAFC   |

---

## 🔒 SÉCURITÉ

- ✅ JWT Authentication (tymon/jwt-auth)
- ✅ Middleware de rôles (client, admin, fournisseur, support)
- ✅ Validation backend (Form Requests)
- ✅ Validation frontend (Zod)
- ✅ CORS configuré
- ✅ Paiement sécurisé via Stripe
- ✅ Protection SQL Injection (Eloquent ORM)
- ✅ SoftDeletes sur toutes les entités sensibles

---

## 📦 TECHNOLOGIES

**Backend :** Laravel 12, PHP 8.2, MySQL, JWT Auth, Stripe PHP  
**Frontend :** React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Zustand, React Query, Stripe.js

---

© 2025 VoyagesMA — Projet PFE Full Stack
