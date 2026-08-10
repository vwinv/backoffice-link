# DropOne — backoffice (Nuxt)

Landing + admin web pour DropOne.

## Routes

| Path | Rôle |
|------|------|
| `/` | Landing page (publique) |
| `/admin/login` | Connexion JWT admin |
| `/admin` | Backoffice (JWT + rôle `ADMIN`) |

## Auth

Le backoffice utilise le JWT du backend (`POST /api/v1/auth/admin/login`).

1. Créer un admin (seed) dans `backend-link` :

```bash
ADMIN_EMAIL=admin@dropone.pro ADMIN_PASSWORD='votre-mdp' npm run db:seed
```

Ou promouvoir un user existant :

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'vous@exemple.com';
```

2. Lancer l’API puis le backoffice, ouvrir `http://localhost:3001/admin`.

Le token est stocké dans le cookie `dropone_admin_token`.

## Setup

```bash
npm install
```

> Si `npm install` échoue sur les peer deps Nuxt, le projet utilise `.npmrc` avec `legacy-peer-deps=true`.

## Dev

```bash
npm run dev
```

Par défaut : `http://localhost:3001`

Variable API :

```bash
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```
