# NewsHub

> A personalized full-stack news aggregator — Laravel API + React/TypeScript frontend.
> Read headlines by category, search any topic, bookmark articles, build a personal reading history, and see what you actually read each week.

![PHP 8.2+](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php&logoColor=white)
![Laravel 11](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)
![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![License MIT](https://img.shields.io/badge/license-MIT-green)

> **Status — Phase 1 complete.** Laravel API is built, tested (37 feature tests / 108 assertions), and ready for manual QA. The React/Vite/TypeScript frontend in `frontend/` is the next phase and is not yet committed.

---

## ✨ Features

**Authentication**
- Email + password registration with Sanctum bearer tokens stored in `personal_access_tokens`
- Generic 401 on login failure (no email-existence leak)
- Per-token logout — signing out one device leaves the rest active

**News**
- Top headlines by country + category, proxied through the backend
- Search across all of NewsAPI's index
- All responses cached for 10 minutes to protect upstream quota

**Personalization**
- Per-user preferences (default country, default categories, light/dark theme)
- Defaults seeded inside the same DB transaction as user creation
- Bookmarks store the full article snapshot, so saved articles survive upstream link rot
- Reading history (latest 50 entries per user) feeds weekly/monthly stats and top-category aggregation

**Hardening**
- Per-route rate limiting: 60/min authed, 30/min unauthed; news endpoints capped at 10/min unauthed; login/register at 10/min per IP
- All input validated via Form Requests
- NewsAPI key only ever lives server-side — never reaches the browser
- Consistent JSON response envelope (`{data,message}` / `{error,message,errors}`)

---

## 📖 Project Origin

This project began as a learning exercise — a basic React news reader built while following Code with Harry's React tutorial series in 2024, when I was practicing React state management and external API consumption. The original implementation was frontend-only, displayed top headlines across 7 categories with infinite scroll, and hardcoded the NewsAPI key in the source.

In 2026, I rebuilt it from scratch as NewsHub — a full-stack personal news aggregator with bookmarks, reading history, and personalized feeds. The rebuild addressed three things: a real security issue (API key now server-side only), a portfolio gap (none of my other projects demonstrated PHP/Laravel), and product expansion (single-page reader → personalized news hub with persistent user data).

Mentioning the tutorial origin transparently — learning from quality educators is part of every developer's journey, and rebuilding learning projects with production-grade architecture is itself a valuable skill.

---

## 🛠️ Tech Stack

| Layer       | Choice                          | Reason |
|-------------|---------------------------------|--------|
| Language    | PHP 8.2+ (`declare(strict_types=1)` everywhere) | Static-feel ergonomics on a dynamic runtime |
| Framework   | Laravel 11                      | Mature ecosystem, Form Requests, Eloquent, first-class testing |
| Auth        | Laravel Sanctum (bearer tokens) | Stateless, frontend-agnostic, no cookie/CSRF dance |
| Database    | PostgreSQL                      | Same engine as my other portfolio projects, robust JSON support |
| HTTP client | Laravel Http (Guzzle)           | Built-in retries, fakeable in tests via `Http::fake` |
| Cache       | Database driver (dev)           | Zero-setup; swap to Redis in production via env |
| Tests       | PHPUnit + SQLite in-memory      | Fast feature tests, no test-DB pollution |
| Frontend (Phase 2) | React 18 + Vite + TypeScript (strict) + Tailwind v3 + shadcn/ui + TanStack Query v5 | Same toolchain as my other portfolio projects for consistency |

---

## 💡 Design Decisions

1. **Article snapshots, not just URLs.** Bookmarks store `title`, `description`, `image_url`, `source`, etc. — not just the article URL. If NewsAPI removes the article a week later, the user's saved card still renders.

2. **DB-level uniqueness, not just app checks.** `bookmarks(user_id, article_url)` has a real `UNIQUE` constraint. The controller catches the resulting `23505` (Postgres) / `23000` (SQLite/MySQL) and returns a friendly 409, but the guarantee lives where it can't be raced.

3. **Generic 401 on every auth failure.** Login returns `{"error": "invalid_credentials"}` for both wrong-password and unknown-email cases. An attacker can't enumerate which emails are registered just by watching responses.

4. **Server-side news proxy with sorted-param cache keys.** The browser never sees the NewsAPI key. Cache keys hash sorted params so `?country=in&category=tech` and `?category=tech&country=in` hit the same entry — both readable from logs at debug level for manual QA.

5. **Token-only Sanctum.** No `statefulApi()` middleware, no SPA cookie dance. The frontend will keep its bearer token in `localStorage` and send `Authorization: Bearer <token>` on every authed request. Simpler mental model, simpler CORS.

6. **Stricter limits on unauthed news.** Authed users get 60 req/min; unauthed callers to `/api/news/*` get only 10 req/min per IP — that endpoint hits a paid third-party quota and is the obvious abuse target.

---

## 🏗️ Architecture

```
┌──────────────────────┐       Bearer token        ┌─────────────────────────┐
│  React + Vite + TS   │ ─────────────────────────►│  Laravel 11 API         │
│  (Phase 2, in        │  Authorization: Bearer ...│                         │
│  ./frontend/)        │ ◄─────────────────────────│  /api/auth/*            │
└──────────────────────┘    JSON {data, message}   │  /api/news/*            │
                                                   │  /api/bookmarks         │
                                                   │  /api/reading-history   │
                                                   │  /api/preferences       │
                                                   │  /api/stats             │
                                                   └──────┬──────────────┬───┘
                                                          │              │
                                              X-Api-Key   │              │ SQL
                                                          ▼              ▼
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
- A free [NewsAPI](https://newsapi.org/) key

### Backend setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Open `.env` and set:
- `DB_PASSWORD` to your Postgres password
- `NEWS_API_KEY` to your NewsAPI key

Create the database and run migrations:

```bash
createdb newshub          # or via psql
php artisan migrate
```

Start the dev server:

```bash
php artisan serve   # http://localhost:8000
```

### Frontend setup

The Vite + React + TypeScript frontend is built in Phase 2 of this project and lives in `frontend/` (not yet committed). Setup instructions will land alongside that code.

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
| GET    | `/api/preferences`         | ✓    | Returns defaults if user has none yet |
| PATCH  | `/api/preferences`         | ✓    | Update any subset of fields |
| GET    | `/api/bookmarks`           | ✓    | Paginated list, newest first |
| POST   | `/api/bookmarks`           | ✓    | 409 on duplicate `(user_id, article_url)` |
| DELETE | `/api/bookmarks/{id}`      | ✓    | 404 if not your bookmark |
| GET    | `/api/reading-history`     | ✓    | Most recent 50 entries |
| POST   | `/api/reading-history`     | ✓    | Append on "Read more" click |
| DELETE | `/api/reading-history`     | ✓    | Clear all entries |
| GET    | `/api/stats`               | ✓    | Week/month read counts, top category, bookmark total |

\* `/api/news/*` works unauthenticated but is rate-limited harder.

---

## 🔐 Security Practices

- **NewsAPI key never leaves the server.** Sent only via the `X-Api-Key` header from the Laravel app to newsapi.org.
- **`.env` is gitignored; `.env.example` contains only placeholders.** Verified with `git grep`.
- **Password hashing:** Laravel default bcrypt (12 rounds), 4 rounds in test config.
- **Rate limiting:** named limiters per route group (see [Design Decisions](#-design-decisions)).
- **Input validation:** every endpoint uses a Form Request class. No `$request->all()` reaches a model.
- **Auth error opacity:** wrong password and unknown email both return the same 401.
- **CORS:** `allowed_origins` restricted to `FRONTEND_URL` env value, not `*`.

---

## 🧪 Testing

```bash
cd backend
php artisan test
```

Phase 1 ships with **37 feature tests / 108 assertions** covering every endpoint, validation gate, and authorization boundary. Tests run against SQLite in-memory for speed — the controllers handle both Postgres and SQLite unique-violation codes so the same code paths execute under both.

---

## 🗺️ Roadmap

- **Phase 2:** React + Vite + TypeScript frontend (login, feed, category/search pages, bookmarks, history, stats, settings, dark mode, infinite scroll, optimistic mutations)
- Notification preferences (email digest of unread bookmarks)
- "Read later" queue separate from bookmarks
- Multiple saved searches with their own feeds
- Article archiving so removed-upstream stories still render with stored HTML

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
