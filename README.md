# Taha Supplier — Admin Dashboard

Admin dashboard for **Taha Supplier (طه للتوريدات)**, a B2B platform that supplies cafés, restaurants and
bakeries with raw materials, desserts and café equipment. The owner and staff use it to manage the catalog,
coupons, banners, notifications, customers and orders.

This repo is the dashboard frontend only (React + Vite + Tailwind CSS). The interface is Arabic and RTL.
The backend is a separate NestJS REST API — its docs live in `docs/api/`.

## Setup

```bash
npm install
cp .env.example .env   # then set VITE_API_BASE_URL to the backend URL
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | start the dev server |
| `npm run build` | production build into `dist/` |
| `npm run preview` | preview the production build |
| `npm run lint` | run ESLint |

Project rules and conventions: see `CLAUDE.md`.
