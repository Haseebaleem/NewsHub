# NewsHub

> A personalized full-stack news aggregator — Laravel API + React/TypeScript frontend.
> Read headlines by category, search any topic, bookmark articles, build a personal reading history, and see what you actually read each week.

![PHP 8.2+](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php&logoColor=white)
![Laravel 11](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)
![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v3-38BDF8?logo=tailwindcss&logoColor=white)
![License MIT](https://img.shields.io/badge/license-MIT-green)

> **Status — feature complete.** Laravel 11 API with 37 PHPUnit feature tests passing, and a React 18 + Vite + TypeScript frontend with a dark-first UI inspired by Vercel / Linear / Raycast. Phase 1 (backend) and Phase 2 (frontend) are both done.

---

## ✨ Features

**Authentication**
- Email + password registration with Sanctum bearer tokens stored in `personal_access_tokens`
- Generic 401 on login failure (no email-existence leak)
- Per-token logout — signing out one device leaves the rest active
- Live password-strength meter on registration, eye-toggle on every password field

**News**
- Top headlines by country + category, proxied through the backend so the NewsAPI key never reaches the browser
- Search across the full NewsAPI index with a persistent recent-searches list
- All responses cached for 10 minutes on the server to protect upstream quota
- Mixed-category home feed: one call per preferred category in parallel, merged and de-duped client-side
- Infinite scroll on category, search, and bookmarks pages via IntersectionObserver

**Personal data**
- Bookmarks store the full article snapshot — saved cards keep rendering even if NewsAPI removes the upstream article
- Bookmarks page groups by date (Today / Yesterday / Earlier this week / Earlier) with client-side filtering
- Reading history records on every "Read" click; rendered as a vertical timeline with a clear-history confirmation dialog
- Stats page with 4 headline numbers, a 30-day reading-activity line chart, a per-category bar chart, and a reading-streak badge
- Per-user preferences (default country, default categories, theme); seeded with sensible defaults in the same DB transaction as user creation

**UI polish**
- Dark theme by default, light-theme toggle in the topbar (persists across reloads)
- Geist Sans + Geist Mono variable fonts, self-hosted
- shadcn/ui-style primitives over Radix (Button, Input, Label, Tabs, Select, Dialog, DropdownMenu)
- Skeleton states for every list, friendly empty states for every absence-of-data
- Cmd+K (or Ctrl+K) focuses the topbar search from anywhere
- Optimistic bookmark toggles, real-time mutation feedback via react-hot-toast

**Hardening**
- Per-route rate limiting: 60/min authed, 30/min unauthed; news endpoints capped at 10/min unauthed; login/register at 10/min per IP
- All input validated via Laravel Form Requests
- Consistent JSON response envelope (`{data, message}` / `{error, message, errors}`)
- CORS restricted to the configured frontend origin

---

## 📖 Project Origin

This project began as a learning exercise — a basic React news reader built while following Code with Harry's React tutorial series in 2024, when I was practicing React state management and external API consumption. The original implementation was frontend-only, displayed top headlines across 7 categories with infinite scroll, and hardcoded the NewsAPI key in the source.

In 2026, I rebuilt it from scratch as NewsHub — a full-stack personal news aggregator with bookmarks, reading history, and personalized feeds. The rebuild addressed three things: a real security issue (API key now server-side only), a portfolio gap (none of my other projects demonstrated PHP/Laravel), and product expansion (single-page reader → personalized news hub with persistent user data).

Mentioning the tutorial origin transparently — learning from quality educators is part of every developer's journey, and rebuilding learning projects with production-grade architecture is itself a valuable skill.

---

## 🛠️ Tech Stack

### Backend

| Layer       | Choice                          | Reason |
|-------------|---------------------------------|--------|
| Language    | PHP 8.2+ (`declare(strict_types=1)` everywhere) | Static-feel ergonomics on a dynamic runtime |
| Framework   | Laravel 11                      | Mature ecosystem, Form Requests, Eloquent, first-class testing |
| Auth        | Laravel Sanctum (bearer tokens) | Stateless, frontend-agnostic, no cookie/CSRF dance |
| Database    | PostgreSQL                      | Same engine as my other portfolio projects, robust JSON support |
| HTTP client | Laravel `Http` (Guzzle)         | Fakeable in tests via `Http::fake()` |
| Cache       | Database driver (dev)           | Zero-setup; swap to Redis in production via env |
| Tests       | PHPUnit + SQLite in-memory      | Fast feature tests, no test-DB pollution |

### Frontend

| Layer        | Choice                                       | Reason |
|--------------|----------------------------------------------|--------|
| Framework    | React 18 + Vite 8                             | Fastest HMR, native ESM, tiny startup time |
| Language     | TypeScript (strict + `noUncheckedIndexedAccess`) | No `any`s, fewer runtime surprises |
| Styling      | Tailwind v3 + shadcn/ui tokens               | HSL-variable theming so dark mode is a single class flip |
| Server state | TanStack Query v5                            | Mirrors the backend's 10-min cache window, optimistic mutations |
| Client state | Zustand (with persist)                       | Tiny, no boilerplate, localStorage built-in |
| HTTP         | Axios with auth interceptor                  | Single chokepoint for the Sanctum token + 401 handling |
| Forms        | React Hook Form + Zod                        | Schema-driven validation that matches the backend rules |
| Routing      | React Router v6                              | Nested route guards (`RequireAuth` / `RedirectIfAuthed`) |
| Charts       | Recharts                                     | Themable via CSS variables, lightweight, declarative |
| Icons        | lucide-react                                 | Outline-style consistent set, ships only the icons used |
| Toasts       | react-hot-toast                              | Dead-simple API, themeable |
| Typography   | Geist Sans + Geist Mono (variable)           | Self-hosted via `@fontsource-variable`, no Google Fonts |

---

## 💡 Design Decisions

1. **Article snapshots, not just URLs.** Bookmarks store `title`, `description`, `image_url`, `source`, `author`, `published_at` — not just the article URL. If NewsAPI removes the article a week later, the user's saved card still renders.

2. **DB-level uniqueness, not just app checks.** `bookmarks(user_id, article_url)` has a real `UNIQUE` constraint. The controller catches the resulting `23505` (Postgres) / `23000` (SQLite/MySQL) and returns a friendly 409, but the guarantee lives where it can't be raced.

3. **Generic 401 on every auth failure.** Login returns `{"error": "invalid_credentials"}` for both wrong-password and unknown-email cases. An attacker can't enumerate which emails are registered just by watching responses.

4. **Server-side news proxy with sorted-param cache keys.** The browser never sees the NewsAPI key. Cache keys hash sorted params so `?country=in&category=tech` and `?category=tech&country=in` hit the same entry — both readable from `storage/logs/laravel.log` at debug level for manual QA.

5. **Token-only Sanctum.** No `statefulApi()` middleware, no SPA cookie dance. The frontend keeps its bearer token in `localStorage` (under `newshub.auth`) and sends `Authorization: Bearer <token>` on every authed request. Simpler mental model, simpler CORS.

6. **Stricter limits on unauthed news.** Authed users get 60 req/min; unauthed callers to `/api/news/*` get only 10 req/min per IP — that endpoint hits a paid third-party quota and is the obvious abuse target for scrapers.

7. **Mixed feed = N parallel calls, not a backend aggregator.** The home `/feed` page uses TanStack Query's `useQueries` to fire one `top-headlines?category=X` per preferred category. Results are interleaved by `publishedAt` and de-duped by URL on the client. This keeps the backend simple (no special aggregator endpoint) and the backend's 10-minute cache makes the parallel hits effectively free on repeat visits.

8. **Optimistic mutations with explicit rollback.** Bookmark toggling updates the bookmark-index cache before the network call completes; on error, the `onMutate` context restores the previous state. The bookmark icon scales briefly on toggle so the feedback is tactile, not just visual.

---

## 🏗️ Architecture

```
┌──────────────────────────────────┐   Bearer token   ┌────────────────────────┐
│  React 18 + Vite + TypeScript    │ ────────────────►│  Laravel 11 API        │
│  (./frontend/)                   │  Authorization:  │  (./backend/)          │
│                                  │  Bearer <token>  │                        │
│  • TanStack Query + Axios        │ ◄────────────────│  /api/auth/*           │
│  • Zustand (auth, theme, search) │ JSON {data, msg} │  /api/news/*           │
│  • React Router v6 + guards      │                  │  /api/bookmarks        │
│  • Tailwind + shadcn primitives  │                  │  /api/reading-history  │
│  • Recharts (stats)              │                  │  /api/preferences      │
│  • lucide-react icons            │                  │  /api/stats            │
│  • Geist variable fonts          │                  │                        │
└──────────────────────────────────┘                  └──────┬─────────────┬───┘
                                                             │             │
                                              X-Api-Key      │             │ SQL
                                                             ▼             ▼
                                                   ┌──────────────┐  ┌──────────────┐
                                                   │ newsapi.org  │  │ PostgreSQL   │
                                                   │ (cached 10m) │  │ newshub      │
                                                   └──────────────┘  └──────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- PHP 8.2 or higher (with `pdo_pgsql`)
- Composer 2.x
- PostgreSQL 14+
- Node.js 18+ and npm
- A free [NewsAPI](https://newsapi.org/) key

### Backend setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Open `backend/.env` and set:
- `DB_PASSWORD` to your Postgres password
- `NEWS_API_KEY` to your NewsAPI key

Create the database and run migrations:

```bash
createdb newshub
php artisan migrate
```

Start the API:

```bash
php artisan serve   # http://localhost:8000
```

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:8000 by default
npm run dev              # http://localhost:5173
```

Open `http://localhost:5173`, register, and start reading.

---

## 📡 API Endpoints

All endpoints return JSON with a `data` or `error` envelope. Authed routes require `Authorization: Bearer <token>`.

| Method | Path                       | Auth | Description |
|--------|----------------------------|------|-------------|
| POST   | `/api/auth/register`       | ✗    | Create account; returns user + token |
| POST   | `/api/auth/login`          | ✗    | Returns user + token; generic 401 on failure |
| POST   | `/api/auth/logout`         | ✓    | Revoke the current token only |
| GET    | `/api/user`                | ✓    | Current user profile |
| GET    | `/api/news/top-headlines`  | ✗*   | `?country=&category=&page=` (10/min unauthed) |
| GET    | `/api/news/search`         | ✗*   | `?q=&page=` |
| GET    | `/api/preferences`         | ✓    | Returns defaults if the user has none yet |
| PATCH  | `/api/preferences`         | ✓    | Update any subset of fields |
| GET    | `/api/bookmarks`           | ✓    | Paginated list, newest first |
| POST   | `/api/bookmarks`           | ✓    | 409 on duplicate `(user_id, article_url)` |
| DELETE | `/api/bookmarks/{id}`      | ✓    | 404 if not your bookmark |
| GET    | `/api/reading-history`     | ✓    | Most recent 50 entries |
| POST   | `/api/reading-history`     | ✓    | Append on "Read" click |
| DELETE | `/api/reading-history`     | ✓    | Clear all entries |
| GET    | `/api/stats`               | ✓    | Week/month read counts, top category, bookmark total |

\* `/api/news/*` works unauthenticated but is rate-limited harder.

---

## 🎨 Frontend pages

| Route              | Purpose                                                                 |
|--------------------|-------------------------------------------------------------------------|
| `/login`           | Sign-in form. Generic error toast on bad credentials.                   |
| `/register`        | Account creation with live password-strength meter and confirm field.   |
| `/feed`            | Personalized mixed feed. Filter chips switch to per-category infinite scroll. |
| `/category/:slug`  | Single-category feed with infinite scroll, server-side pagination.      |
| `/search?q=…`      | Full-index search with recent-searches panel when empty.                |
| `/bookmarks`       | Saved articles grouped by date; client-side filter; remove action.      |
| `/history`         | Reading-history timeline with clear-history confirmation.               |
| `/stats`           | Stat cards, 30-day activity line chart, per-category bar chart, streak. |
| `/settings`        | Tabs: Profile (read-only), Preferences (live), Account (danger zone).   |

---

## 🔐 Security Practices

- **NewsAPI key never leaves the server.** Sent only via the `X-Api-Key` header from the Laravel app to newsapi.org.
- **`.env` is gitignored on both sides; `.env.example` contains only placeholders.** Verified with `git grep`.
- **Password hashing:** Laravel default bcrypt (12 rounds), 4 rounds in test config.
- **Rate limiting:** named limiters per route group (see [Design Decisions](#-design-decisions)).
- **Input validation:** every Laravel endpoint uses a Form Request class. The frontend mirrors the same rules via Zod schemas on every form.
- **Auth error opacity:** wrong password and unknown email both return the same 401 / `invalid_credentials`.
- **CORS:** `allowed_origins` restricted to the `FRONTEND_URL` env value, not `*`.
- **401 cleanup:** the Axios response interceptor clears the local Sanctum token on any 401 (except `/auth/login`), so an expired session always lands the user back on `/login`.

---

## 🧪 Testing

```bash
cd backend
php artisan test
```

Ships with **37 feature tests / 108 assertions** covering every endpoint, validation gate, and authorization boundary. Tests run against SQLite in-memory for speed — the controllers handle both Postgres and SQLite unique-violation codes so the same code paths execute under both engines.

---

## 🗺️ Roadmap

- Change password + delete account (UI surfaces are already in place under `/settings`)
- Email digest of unread bookmarks
- "Read later" queue separate from bookmarks
- Multiple saved searches with their own per-search feeds
- Article archiving so removed-upstream stories still render with stored HTML
- Public profile pages (share your favorite categories + recent stats)

---

## 📄 License

[MIT](./LICENSE)

---

## 👤 Author

**Haseeb Aleem** — full-stack developer

- LinkedIn: [linkedin.com/in/haseeb-aleem-dev](https://linkedin.com/in/haseeb-aleem-dev)
- Email: haseebaleem2802@gmail.com

### Related portfolio projects

- **Auth-Boilerplate** — production-ready Node.js auth starter
- **Task-Manager** — task tracking with teams + assignments
- **Inventory-POS** — point-of-sale with inventory tracking
- **TextKit** — text manipulation utilities suite
- **Marketplace** — multi-vendor e-commerce platform
