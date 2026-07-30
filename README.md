# DropOne — backoffice (Nuxt)

Landing + admin web pour DropOne.

## Routes

| Path | Rôle |
|------|------|
| `/` | Landing page |
| `/admin` | Backoffice admin |

## Setup

```bash
npm install
```

> Si `npm install` échoue sur les peer deps Nuxt, le projet utilise `.npmrc` avec `legacy-peer-deps=true`.

## Dev

```bash
npm run dev
```

Par défaut : `http://localhost:3000`

L’API backend (`backend-link`) tourne aussi souvent sur le port 3000 — change le port Nuxt si besoin :

```bash
npm run dev -- --port 3001
```

Variable API (optionnelle) :

```bash
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```
