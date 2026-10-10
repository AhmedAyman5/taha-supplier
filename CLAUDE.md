# CLAUDE.md — Taha Supplier Dashboard

> Read this whole file before every task. It is the contract for how this project is built.
> Rules marked 🔴 CRITICAL win over everything else. If a request conflicts with this file, ask Ahmed first.

---

## 1. Project overview

**Taha Supplier (طه للتوريدات)** is a B2B platform that supplies cafés, coffee shops, restaurants and bakeries
with raw materials, ready-made desserts and café equipment. Customers order from a mobile app; the business
owner and staff run everything from this **admin dashboard**.

The dashboard manages: categories & sub-categories, brands, products, shipping zones & delivery prices,
coupons, mobile-app banners, push notifications, customers (search / ban) and orders (status workflow,
payment receipts).

- This repo is the **dashboard frontend only**. The backend (NestJS REST API) and the Flutter app are separate
  projects — never change or assume backend behavior.
- Owner: **Ahmed**. He builds the project page by page with Claude Code and learns from the code, so the code
  must be easy to read, easy to change and consistent everywhere.

---

## 2. 🔴 CRITICAL — Simplicity first (no over-engineering)

This is the most important rule in the project.

**Always choose the simplest solution that** works correctly, is easy to understand, is easy to modify later,
and fits the current requirements. Nothing more.

Priorities, in order:
1. Correct, working functionality
2. Clean, readable code
3. Easy to modify
4. Consistent with the rest of the project
5. Performance — only when there is a real, measured problem

Prefer: Simple > Clever · Readable > Abstract · Consistent > Creative · Explicit > Magical · Working > Over-engineered

**Do NOT create** (unless Ahmed explicitly asks):
- generic CRUD engines, dynamic form generators, "universal" table systems
- custom hooks, context providers or global stores for page data
- extra layers (services / repositories / adapters / mappers) beyond the ones in this file
- abstractions, utilities or components "for later" — build only what the current task needs
- utility functions for one-line operations
- deep component hierarchies or extra folder nesting
- `useMemo` / `useCallback` / `React.memo` without a measured need
- complex validation or error-handling systems when simple checks work
- new config files

**Prefer this:** simple page component → local `useState` → small API function → straightforward JSX.

**Duplication vs complexity:** a little duplication is fine. Two similar pieces of code are NOT a reason to
abstract. Move something to a shared place only when 2+ pages actually use it.

**Never use these as reasons:** "more scalable", "more enterprise", "might be useful later",
"best practice in big apps".

**Readability test:** Ahmed must be able to open a page folder and understand how the page works without
jumping through many files.

**Don't refactor working code** to make it "more sophisticated".

**🛑 STOP condition:** if a task seems to need a new package, a new pattern, a bigger architecture, or more
complexity than the rest of the project — STOP. Explain what you want to add, why, the simpler alternative,
and which files would change. Wait for approval.

---

## 3. 🔴 CRITICAL — Arabic-only interface

Everything the user can SEE is Arabic: navigation labels · page titles · buttons · form labels · placeholders ·
validation messages · error and success messages · toasts · empty states · loading messages · confirm dialogs ·
table headers · status labels · badges · tooltips · dropdown options · modal content · `aria-label`s ·
the browser tab title.

- **Never show English UI text.** That includes backend error messages (they are English) and enum values
  (`PENDING`, `ACTIVE`, `CARD`…) — always map them to Arabic labels.
- **Exceptions — show them as they are:** data the users typed (e.g. a product named "Lavazza Qualita Oro"),
  coupon codes, emails, phone numbers, URLs.
- Use clear Modern Standard Arabic and the exact wording in §14.
- **Code stays English:** file names, components, variables, functions, comments, routes, commit messages.

---

## 4. 🔴 CRITICAL — RTL, native Arabic layout

- Direction is set ONCE: `<html lang="ar" dir="rtl">` in `index.html`. Never set `direction` in CSS and never
  per page.
- Design a native Arabic interface, not a mirrored English one: the sidebar is on the right, content flows
  right → left, page titles sit at the start (right) and page actions at the end (left).
- Spacing and position: `flex` / `grid` + `gap-*`, and logical classes only:
  `ms-* me-* ps-* pe-* start-* end-* text-start text-end border-s border-e rounded-s rounded-e`.
  Never `ml-* mr-* pl-* pr-* left-* right-* text-left text-right border-l border-r`.
  Example: an icon + label button uses `gap-2`, not `mr-2` on the icon.
- Exception: transforms have no logical version — the mobile sidebar slide-in uses `translate-x-*`
  (the app is RTL-only).
- Directional icons point the RTL way: "next" = `ChevronLeft`, "previous" / "back" = `ChevronRight`.
- Inputs for emails, phones, URLs and codes get `dir="ltr"` so typing feels natural (their placeholder can be a
  format example like `name@example.com`).

---

## 5. How we work

**Roles**
- **Ahmed** decides, reviews every diff, tests in the browser and handles all git work.
- **Claude Code** implements one task at a time, following this file exactly.

**One task = one page.** The project is built page by page (order in §17). Never implement several pages in
one task unless Ahmed asks.

**Every task follows this cycle:**
1. **Read:** this file → `docs/api/admin.general.txt` → the page's module doc in `docs/api/` → the page's current
   files → `src/components/` (what already exists) → the reference page (Categories, once it's done).
2. **Plan:** a short plan — files to create / change, shared components to reuse, open questions about the API.
3. **Ask** when something is unclear or missing. One clear question beats a wrong guess.
4. **Implement** the smallest change that does the job. Don't touch unrelated files.
5. **Verify** with the checklist in §16.
6. **Update** the Status (§17) and Shared components (§19) sections of this file.
7. **Summarize:** files created / changed, what Ahmed should test in the browser, and a short explanation of any
   non-obvious code (Ahmed is learning).

**Communication:** reply to Ahmed in the language he writes in (Arabic or English). Code and docs stay English.

**Git:** never run `git commit`, `git push`, `git merge` or branch commands. Read-only commands
(`git status`, `git diff`, `git log`) are fine.

---

## 6. Tech stack (fixed)

| Tool | Used for |
|---|---|
| React (JavaScript, no TypeScript) + Vite | the app |
| Tailwind CSS v4 (`@tailwindcss/vite`) | all styling |
| React Router (`react-router`, declarative mode) | routing — import from `'react-router'` |
| Axios | HTTP — only through `src/services/api.js` |
| lucide-react | icons |
| react-hot-toast | success / error toasts |

**Not allowed without Ahmed's approval:** any new npm package, TypeScript, Redux / Zustand / React Query,
UI kits (MUI, Ant Design, shadcn…), form or validation libraries, CSS-in-JS, CSS modules.

## 7. Commands

```bash
npm run dev     # dev server
npm run lint    # must pass before a task is done
npm run build   # must pass before a task is done
```

---

## 8. Project structure

```text
CLAUDE.md                      # this file
.env                           # VITE_API_BASE_URL — not committed (template: .env.example)
docs/api/                      # backend API docs (admin.*.txt) — the only source of truth for the API
index.html                     # <html lang="ar" dir="rtl">, title, Google Fonts
src/
├── assets/                    # static images (logo later)
├── components/                # shared UI used by 2+ pages (flat — no subfolders)
├── constants/                 # fixed maps, e.g. enum → Arabic label (order statuses)
├── layouts/
│   └── DashboardLayout/
│       ├── DashboardLayout.jsx  # Sidebar + Topbar + <main><Outlet /></main>
│       ├── Sidebar.jsx          # navItems array = the ONLY place for nav links
│       └── Topbar.jsx
├── pages/                     # one folder per page (see §9)
├── routes/
│   ├── AppRoutes.jsx          # ALL routes, in one place
│   └── ProtectedRoute.jsx     # no session → /login            (auth task)
├── services/                  #                                (auth task)
│   ├── api.js                 # the ONLY axios instance: base URL, Bearer token, silent refresh
│   ├── auth.js                # login / logout
│   └── authStorage.js         # tokens + user in localStorage
├── utils/                     #                                (auth task)
│   ├── errors.js              # getErrorMessage(error, overrides) → Arabic text
│   ├── format.js              # formatPrice, formatDate, formatDateTime
│   └── images.js              # getImageUrl(path)
├── App.jsx                    # <BrowserRouter> + <AppRoutes /> + <Toaster />
├── main.jsx                   # renders <App /> and imports index.css
└── index.css                  # Tailwind import + @theme design tokens + global styles
```

What goes where:
- Used by ONE page → inside that page's folder.
- UI used by 2+ pages → `src/components/`.
- A plain function used in 2+ places → `src/utils/`.
- Fixed value maps (enum → Arabic label, option lists) → `src/constants/`.

---

## 9. Page-based architecture

Every business feature is ONE folder in `src/pages/` that owns its UI and its API calls. A page is
self-contained: open the folder and you see everything about that page.

**A page folder contains:**

```text
src/pages/Products/
├── Products.jsx          # REQUIRED — the page component (the route element)
├── products.api.js       # REQUIRED — every request this page makes
├── ProductForm.jsx       # optional — page-only pieces, flat in the same folder
└── ProductGallery.jsx    # optional
```

**Naming:** folder and page file in PascalCase, API file in camelCase + `.api.js`:
`Categories/Categories.jsx` + `categories.api.js` · `SubCategories/SubCategories.jsx` + `subCategories.api.js` ·
`ShippingZones/ShippingZones.jsx` + `shippingZones.api.js`.
Page-only pieces: `<Feature>Form.jsx`, `<Feature>Table.jsx`, `<Feature>Details.jsx`.

**The page component is responsible for:** rendering the page · owning its state · calling its API functions ·
loading / error / empty states · user actions · coordinating its page-only components.

**Data flow — never skip a layer:**

```text
Page component (Products.jsx)
    ↓ calls
Page API module (products.api.js)
    ↓ uses
Central axios client (src/services/api.js)
    ↓
Backend
```

**Rules**
1. A page never imports from another page's folder.
2. A page that needs another module's data (e.g. a categories dropdown inside Products) calls that endpoint
   from its OWN api file — never import another page's api file.
3. Split a page into page-only components only when the page file gets long (~250+ lines) or a piece is used
   twice (e.g. one form for create and edit).
4. Pages never render the Sidebar or Topbar — the layout does.
5. Pages never touch tokens, localStorage or axios directly.
6. No CSS files for pages — Tailwind classes in JSX.

**Adding a new page:**
1. Create `src/pages/<Feature>/<Feature>.jsx` + `<feature>.api.js`.
2. Add its route inside the protected `DashboardLayout` route in `src/routes/AppRoutes.jsx`
   (only `/login` is outside the layout).
3. Add its link to `navItems` in `Sidebar.jsx` (Arabic label, English path, lucide icon).
4. Update the Status table (§17).

---

## 10. Layout, navigation and routing

- `DashboardLayout` = `Sidebar` + `Topbar` + `<main>` with `<Outlet />`. Sidebar and Topbar stay mounted while
  navigating; only the Outlet content changes. The layout pads `<main>` — pages don't add outer padding.
- **Sidebar:** on the right; static on large screens (`lg:`), slide-in with a dark overlay on smaller screens.
  Brand «طه للتوريدات» at the top. Active link `bg-primary text-white`; others `text-text-secondary`
  with `hover:bg-background hover:text-text`.
- **Topbar:** menu button (mobile only), «لوحة التحكم», and — after the auth task — the admin name + logout.
- **Routing:** declarative mode (`<Routes>` / `<Route>`) in `AppRoutes.jsx` only. Route paths are English
  (`/shipping-zones`), labels are Arabic. Unknown paths → `NotFound` inside the layout.

---

## 11. Design system

### 11.1 Colors — the only colors allowed

Defined ONCE as `@theme` tokens in `src/index.css`. Tailwind turns each into classes (`bg-*`, `text-*`, `border-*`).

| Token | Value | Classes | Use for |
|---|---|---|---|
| primary | #2563eb | `bg-primary` `text-primary` `border-primary` | main buttons, active nav, links, focus |
| primary-hover | #1d4ed8 | `hover:bg-primary-hover` | hover of primary buttons |
| primary-light | #eff6ff | `bg-primary-light` | soft highlights, selected rows, info boxes |
| background | #f8fafc | `bg-background` | page background, table header, row hover |
| surface | #ffffff | `bg-surface` | cards, sidebar, topbar, modals, inputs |
| border | #e2e8f0 | `border-border` | borders of cards, inputs, tables |
| border-light | #f1f5f9 | `border-border-light` | dividers between rows |
| text | #1e293b | `text-text` | main text, headings |
| text-secondary | #64748b | `text-text-secondary` | labels, secondary info, inactive nav |
| text-muted | #94a3b8 | `text-text-muted` `placeholder:text-text-muted` | hints, placeholders, dates |
| success | #16a34a | `text-success` `bg-success/10` | active, approved, delivered |
| warning | #d97706 | `text-warning` `bg-warning/10` | pending, paused, scheduled |
| error | #dc2626 | `text-error` `bg-error` `bg-error/10` | errors, destructive actions, cancelled, banned |
| info | #0284c7 | `text-info` `bg-info/10` | processing, shipped, neutral info |

- No hex values in JSX and no Tailwind default palette (`blue-500`, `gray-200`…). Allowed extras: `white`,
  `black` (overlays, e.g. `bg-black/30`), `transparent`, `current`.
- Opacity modifiers are fine (`bg-success/10`, `ring-primary/20`).
- Need a new color? Add ONE token to `@theme` and tell Ahmed — never invent a color inside a page.

### 11.2 Typography

- Font: **IBM Plex Sans Arabic** (Google Fonts link in `index.html`, weights 400 / 500 / 600 / 700), set once as
  `--font-sans` in `@theme`, so it applies to the whole app. Never set `font-family` anywhere else.

| Element | Classes |
|---|---|
| Page title (PageHeader) | `text-xl font-bold text-text` |
| Section / card title | `text-base font-semibold text-text` |
| Body, table cells, inputs, buttons | `text-sm` |
| Form labels | `text-sm font-medium text-text` |
| Secondary text | `text-sm text-text-secondary` |
| Hints, meta, helper text | `text-xs text-text-muted` |
| Big numbers (stat cards) | `text-2xl font-bold` |

- Weights: only `font-normal`, `font-medium`, `font-semibold`, `font-bold`.
- Numbers use Western digits (0–9) everywhere (`formatPrice` / `formatDate` handle it).

### 11.3 Spacing, shape, depth

- Page: `space-y-6` between blocks (header, filters, content). The layout already pads `<main>`.
- Cards: `rounded-lg border border-border bg-surface` (content padding `p-5`; tables sit flush).
- Forms: `grid gap-4` (two columns from `md:` when it helps); label above input with `gap-1.5`.
- Radius: `rounded-md` buttons / inputs / nav items · `rounded-lg` cards / modals · `rounded-full` badges.
- Depth: borders instead of shadows. `shadow-lg` only for modals and dropdowns.
- Motion: `transition-colors duration-150` on interactive elements. No decorative animations.

### 11.4 UI recipes (use these until a shared component exists — then use the component)

```text
Primary button   inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50
Secondary button inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-background disabled:opacity-50
Danger button    inline-flex items-center justify-center gap-2 rounded-md bg-error px-4 py-2 text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50
Input / select   w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
Field error      text-xs text-error
Card             rounded-lg border border-border bg-surface
Table header     bg-background text-xs font-medium text-text-secondary   (cells: px-4 py-3 text-start)
Table row        border-b border-border-light text-sm hover:bg-background
Badge            inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium + bg-success/10 text-success (or warning / error / info; neutral: bg-background text-text-secondary)
Modal            overlay: fixed inset-0 z-50 bg-black/30 · panel: w-full max-w-lg rounded-lg bg-surface shadow-lg
```

### 11.5 Icons

lucide-react only. Size 18–20 (nav icons: 19 with `strokeWidth={1.8}`). Icon-only buttons need an Arabic
`aria-label`. Directional icons follow §4.

### 11.6 Look and feel

A clean, professional B2B admin: simple, consistent, functional, easy to scan.
Avoid: gradients, glassmorphism, heavy shadows, decorative animations, random colors, inconsistent spacing,
over-rounded cards, decoration that doesn't help the admin work. Don't redesign existing patterns.

### 11.7 Responsive

Must work on desktop, laptop, tablet and mobile — with Tailwind breakpoints, never separate mobile / desktop
components. Tables scroll inside `overflow-x-auto`. Forms are one column on mobile. Page headers stack on
mobile (`flex-col sm:flex-row`).

---

## 12. Backend API

### 12.1 Source of truth

The backend docs live in `docs/api/`. **Read `admin.general.txt` first** (base URL, envelope, errors, tokens,
uploads, numbers, pagination), **then the page's module doc.** NEVER invent endpoints, fields, request bodies,
response shapes, token formats or business rules. Missing or unclear → STOP and ask.

### 12.2 Requests and responses

- Base URL = `VITE_API_BASE_URL` from `.env` (no `/api` prefix; a local backend runs on `http://localhost:3000`).
- Success: `{ message, data }` → API functions return `res.data.data`. Only exception: the payment-proof image
  is binary (see `admin.order.txt`).
- Errors: `{ message: string | string[], statusCode }` in English → never shown. Use
  `getErrorMessage(error, overrides)` from `src/utils/errors.js`.
- **Strict validation:** any field the endpoint doesn't declare → 400. Build every body field by field. Never
  spread form state or a GET response into a request.
- Files → `FormData` (category, sub-category, brand, product, banner). Everything else → JSON. Never set
  `Content-Type` manually. Booleans appended to FormData become `"true"` / `"false"` — what the API expects.
- Money: admin product, coupon and shipping-zone responses return **Decimal strings** (`"520.00"`) → `Number()`
  before math. Order money is whole numbers. Currency is EGP → `formatPrice()`.
- Images come back as relative paths (`/uploads/...`) → display with `getImageUrl(path)`.
- Dates are ISO UTC strings → `formatDate()` / `formatDateTime()`.
- Pagination `{ items, page, per_page, next_page, last_page, total }` (per_page ≤ 100) exists ONLY for products,
  orders and customers. Every other list is a plain array → search / filter client-side.
- Authentication lives only in `src/services/` (Bearer token + silent refresh).
- Every module doc has a **BUSINESS RULES / GOTCHAS** section — handle each one that affects the UI.

### 12.3 Uploads

| Module | File field | Rule |
|---|---|---|
| category, sub-category | `image` | optional, 1 file |
| brand | `logo` | required on create, 1 file, **max 5 MB** |
| product | `image` + `images` | main image required on create; gallery up to 10 (create only — later via `POST /product/:id/images`) |
| banner | `images` | at least 1 on create, up to 10 |

Allowed types: jpeg, jpg, png, webp. Max 10 MB (brand logo 5 MB). Validate type and size in the UI BEFORE
uploading and show our own Arabic message (the backend's size message is wrong).

### 12.4 What "delete" really does

| Module | DELETE does | UI wording |
|---|---|---|
| Category, sub-category | soft — `is_hidden = true` (reversible via PATCH) | «إخفاء» / «إظهار» |
| Product | soft — `is_available = false` (reversible) | «إيقاف» / «تفعيل» |
| Brand | soft, but there is NO restore through the API | «حذف» + warn it can't be undone |
| Coupon | HARD delete (fails if ever redeemed) — prefer pausing | «إيقاف مؤقت» / «حذف» |
| Banner | HARD delete (rows + files) — or `is_active = false` | «إيقاف» / «حذف نهائي» |
| Shipping zone | no DELETE endpoint — `is_active = false` | «إيقاف» / «تفعيل» |

### 12.5 API files (`<feature>.api.js`)

- One per page, holding ALL of that page's requests. Components call these functions, never `api` directly.
- Small `async` functions: take plain values, build the body / FormData, return `res.data.data`.
- Import the client with `import api from '../../services/api'`. Never import axios anywhere else.

```js
// src/pages/Categories/categories.api.js
import api from '../../services/api'

export async function getCategories() {
  const res = await api.get('/category/admin')
  return res.data.data
}

export async function createCategory(values) {
  const formData = new FormData()
  formData.append('name', values.name)
  formData.append('display_order', values.display_order)
  formData.append('is_hidden', values.is_hidden)
  if (values.imageFile) formData.append('image', values.imageFile)
  const res = await api.post('/category', formData)
  return res.data.data
}

export async function hideCategory(id) {
  const res = await api.delete(`/category/${id}`) // soft delete: sets is_hidden = true
  return res.data.data
}
```

---

## 13. Page behavior standards

### 13.1 Data fetching — always this pattern

```jsx
const [items, setItems] = useState([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState('')
const [reloadKey, setReloadKey] = useState(0) // bump to refetch after create / update / delete

useEffect(() => {
  let ignore = false // drop late responses when filters or page change quickly
  async function load() {
    try {
      const data = await getCategories()
      if (!ignore) {
        setItems(data)
        setError('')
      }
    } catch (err) {
      if (!ignore) setError(getErrorMessage(err))
    } finally {
      if (!ignore) setIsLoading(false)
    }
  }
  load()
  return () => {
    ignore = true
  }
}, [reloadKey]) // paginated lists: [page, filters..., reloadKey]
```

No custom hooks, no global state for server data.

### 13.2 The three states — every API-driven page

- **Loading:** «جاري تحميل البيانات...» — never a blank screen.
- **Error:** a friendly Arabic message + «إعادة المحاولة» button (clears the error, sets `isLoading`, bumps
  `reloadKey`). Never raw backend text.
- **Empty:** a clear sentence, e.g. «لا توجد أقسام بعد» (+ the add button when it makes sense). Never an empty
  table with no explanation.

### 13.3 Forms

- Controlled inputs with `useState`. Form values keep the backend's field names (`display_order`, `is_hidden`).
- Simple checks before submitting: required fields, min lengths, number ranges, file type / size, plus the rules
  from the module's GOTCHAS. Show errors under the field (`text-xs text-error`).
- While saving: disable the submit button and show «جاري الحفظ...».
- On success: close, toast «تم الحفظ بنجاح», bump `reloadKey`. On error: keep the form open with the Arabic
  message.
- Create and edit share ONE form component. Small forms → modal. Large forms (products, banners) → a separate
  route (e.g. `/products/new`, `/products/:id/edit`).

### 13.4 Destructive actions

- Always a confirm dialog that states the real consequence, e.g.
  «سيتم إخفاء القسم من التطبيق، ويمكنك إظهاره لاحقاً» or «سيتم حذف البنر وصوره نهائياً ولا يمكن التراجع».
- Wording follows the table in §12.4.

### 13.5 Feedback and lists

- After every action: `toast.success(...)` / `toast.error(...)` (react-hot-toast). `<Toaster />` is mounted once
  in `App.jsx`.
- Lists are tables inside `overflow-x-auto`. Plain-array lists: client-side search / filter. Paginated lists:
  a shared `Pagination` component (created with the first paginated page).

### 13.6 Business logic

The backend is the source of truth for prices, totals, discounts, permissions and order validity. UI validation
is only for a better experience. Never calculate final prices or invent business rules in the dashboard.

### 13.7 Reference page

**Categories** is the reference page. Once it's done, every CRUD page follows its structure and patterns —
read it before building a new page.

---

## 14. UI wording — use these exact words

- Actions: إضافة · تعديل · حفظ · إلغاء · تأكيد · حذف · إخفاء · إظهار · إيقاف · تفعيل · بحث · تصفية · إعادة المحاولة · عرض التفاصيل
- States: جاري تحميل البيانات... · جاري الحفظ... · لا توجد بيانات
- Results: تم الحفظ بنجاح · تم الحذف بنجاح · تم التحديث بنجاح · حدث خطأ، حاول مرة أخرى
- Status labels: مفعّل / غير مفعّل · متاح / غير متاح · ظاهر / مخفي

---

## 15. Naming and code style

- **Files:** components and pages PascalCase (`Products.jsx`, `ProductForm.jsx`, `PageHeader.jsx`); API modules
  camelCase + `.api.js` (`products.api.js`); utils camelCase (`format.js`).
- **Code:** functions and variables camelCase; constants UPPER_SNAKE_CASE (`ORDER_STATUS_LABELS`); event
  handlers `handleSubmit`, `handleDelete`; booleans `isLoading`, `isSaving`, `isModalOpen`.
- **Data:** API data and form values keep the backend's snake_case field names — no renaming layer. Files held in
  form state end with `File`: `imageFile`, `logoFile`, `galleryFiles`.
- One component per file, default export, function components only.
- Relative imports (no path aliases), ordered React → libraries → project files. No unused imports, no circular
  imports.
- Comments explain WHY (business rules, backend gotchas, non-obvious decisions) — never what the code obviously
  does.

---

## 16. Final verification — a task is done only when ALL pass

- [ ] `npm run lint` and `npm run build` pass
- [ ] Routes and existing pages still work
- [ ] All visible text is Arabic and the RTL layout looks right
- [ ] Colors and typography follow §11 (no hex, no default palette)
- [ ] Loading / error / empty states are handled
- [ ] No invented endpoints, fields or business rules
- [ ] No unnecessary files, duplicated components or new packages
- [ ] No unrelated files changed
- [ ] Status (§17) and Shared components (§19) are updated

---

## 17. Status

Legend: ⬜ not started · 🟨 in progress · ✅ done

Setup:
- ✅ Cleanup & global styles
- ✅ Structure & layout
- ⬜ Auth & API layer

| # | Page | Route | Folder | API doc | Status |
|---|---|---|---|---|---|
| 0 | تسجيل الدخول | /login | Login | admin.auth.txt | ⬜ (auth task) |
| 1 | الأقسام الرئيسية | /categories | Categories | admin.category.txt | ⬜ reference page |
| 2 | الأقسام الفرعية | /sub-categories | SubCategories | admin.sub-category.txt | ⬜ |
| 3 | العلامات التجارية | /brands | Brands | admin.brand.txt | ⬜ |
| 4 | المنتجات | /products | Products | admin.product.txt | ⬜ |
| 5 | مناطق التوصيل | /shipping-zones | ShippingZones | admin.shipping-zone.txt | ⬜ |
| 6 | الكوبونات | /coupons | Coupons | admin.coupon.txt | ⬜ |
| 7 | البنرات | /banners | Banners | admin.banner.txt | ⬜ |
| 8 | الإشعارات | /notifications | Notifications | admin.notification.txt | ⬜ |
| 9 | العملاء | /customers | Customers | admin.customers.txt | ⬜ |
| 10 | الطلبات | /orders | Orders | admin.order.txt | ⬜ |
| 11 | الرئيسية | / | Dashboard | totals from orders / products / customers | ⬜ last |

---

## 18. Not possible — no endpoint (never build or fake these)

Customer approvals · sales representatives · inventory / stock · reports · staff accounts & permissions ·
settings · an admin signup page · password reset · deleting orders or shipping zones · editing order items,
prices or address · restoring a deleted brand · removing a product discount · review moderation ·
notification history. Full list: `docs/api/admin.README.txt`.

## 19. Shared components

Update this list whenever a component is added to `src/components/` (name — purpose — props).

- `PageHeader` — page title row: title + optional description at the start, action buttons at the end; stacks on mobile — props: `title`, `description?`, `children?` (action buttons)

## 20. Domain notes

- Catalog: Category → SubCategory → Product. Brand ↔ SubCategory links are managed from the Brands page only.
- Orders are immutable snapshots: the admin can change only `status` and `payment_status`. The backend accepts
  ANY status change, so the UI enforces the workflow (defined with the Orders page in `src/constants/`).
- `payment_method`: CASH = pay on delivery · CARD = bank transfer with a receipt the admin approves or rejects.
- Banners are offer sliders on the mobile home screen; each image has its own tap action.
- Notifications are broadcast pushes to ALL app users — no history and no targeting.