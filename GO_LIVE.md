# Go-live checklist — Taha Supplier Dashboard

Run this once the backend is deployed. Tick each item.

## 1. Dashboard (frontend)

- [ ] Set `VITE_API_BASE_URL` in `.env` to the real backend URL — **https**, no trailing slash
- [ ] Restart `npm run dev`
- [ ] Remove the dev login bypass (`DEV_SKIP_LOGIN`) — ask Claude for the removal prompt
      (use the saved reminder message)
- [ ] On the hosting provider, set `VITE_API_BASE_URL` **before** building
      (Vite puts env variables into the code at build time)
- [ ] Deploy on its own domain or subdomain (e.g. `admin.example.com`), not inside a sub-folder
- [ ] Add the SPA fallback so refreshing any page doesn't return 404 (pick your host):

**Apache / Hostinger** — `public/.htaccess`:

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Netlify** — `public/_redirects`:

```text
/*  /index.html  200
```

**Vercel** — `vercel.json` in the project root:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## 2. Backend (ask the backend developer)

- [ ] Backend is served over **https** (an https dashboard cannot call an http API — Mixed Content)
- [ ] CORS allows the dashboard's domain
- [ ] `POST /auth/adminDashboard/signup` is protected or removed (security hole)
- [ ] An ADMIN account exists for logging in
- [ ] `/uploads/...` images are reachable at the same base URL

## 3. First real test session

- [ ] Login with a real admin account; wrong password shows the Arabic error
- [ ] Token refresh: in DevTools → Application → Local Storage, change `taha_access_token`
      to anything, then do any action → it must keep working silently
- [ ] Logout returns to the login page
- [ ] Every page: list, create, edit, hide/show (or delete), image upload, and images display
- [ ] Refresh the browser on an inner page (e.g. `/categories`) → the page loads (no 404)
- [ ] Any mismatch with the docs → fix it in that page's `<feature>.api.js` and update `docs/api/`