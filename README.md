# NewsHub

> Personal news aggregator with bookmarks, reading history, personalized feed, and reading stats. Full-stack application with security-first API proxying — third-party news API keys never reach the browser. Built with Laravel 11, React 18, TypeScript, PostgreSQL, and a polished dark-first UI.

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)](https://laravel.com/)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 About

NewsHub is a personal news aggregator designed around three pillars that distinguish it from generic news readers:

- **Security-first API proxying** — third-party news API keys never reach the browser, with server-side caching to reduce upstream calls and stay within free-tier limits
- **Personalization through persistence** — bookmarks, reading history, and category preferences create a feed that adapts to the user over time
- **Full-stack architecture as a showcase** — demonstrates production patterns across PHP/Laravel and TypeScript/React with strict type safety, comprehensive test coverage, and modern UI sensibilities

The project was designed to fill a specific portfolio gap: demonstrating Laravel/PHP expertise (a stack used through years of client work) with the same production-grade discipline applied to Node.js projects — atomic operations, audit logging, content security, and tested API contracts.

---

## ✨ Features

### Authentication
- 🔐 Laravel Sanctum token-based authentication
- 📝 Register, login, logout, current user endpoint
- 🚦 Per-route rate limiting (independent counters)
- 🌱 Pre-seeded demo account with sample data

### News Aggregation
- 📰 Top headlines by category (Technology, Business, Sports, Health, Entertainment, Science, General)
- 🌍 Country selector (US default for free-tier reliability, all countries supported)
- 🔍 Search across all sources
- 🎯 Filter chips for in-feed category switching
- ♾️ Infinite scroll with TanStack Query
- ⏰ 10-minute server-side response cache to minimize upstream API calls

### Personalization
- 🔖 Bookmarks with snapshot persistence (articles saved with full content, not just URLs)
- 📚 Reading history automatically tracked when clicking "Read More"
- ⭐ Default category preferences per user
- 🎨 Dark/light theme preference (persisted)
- 🌐 Default country preference

### Stats & Insights
- 📊 Reading activity dashboard with 4 stat cards
- 📈 Last-30-days reading activity line chart (Recharts)
- 📉 Articles-by-category bar chart
- 🔥 Reading streak badge for consecutive-day readers

### Visual Identity
- 🌑 Dark mode default with smooth light-mode toggle
- 🟡 Amber-500 accent (warm content-focused color identity)
- 🔤 Geist Sans + Geist Mono fonts self-hosted via @fontsource
- 📐 Categorized sidebar with section headers
- 💬 Custom news cards with image, category badge, source badge
- 💀 Skeleton loaders with shimmer matching exact layout
- 🟡 Top progress bar for route changes and TanStack mutations

---

## 💡 Design Decisions

### Why proxy news API through Laravel instead of calling from browser

Browser-side API calls to news providers expose the API key in network traffic — anyone can pop open DevTools and steal it. Beyond the obvious security issue, free-tier news APIs (NewsAPI.org, GNews, etc.) explicitly forbid browser usage and block CORS in production. The Laravel backend acts as a thin proxy: receives the request, attaches the server-side API key, makes the upstream call, caches the response for 10 minutes, returns the data to the browser. The key never leaves the server, and the cache layer reduces upstream calls by 10-100x depending on traffic patterns.

### Why server-side cache with 10-minute TTL

News doesn't change every second. A 10-minute cache hits a sweet spot: users get effectively-fresh data, free-tier API quotas (typically 100 req/day) extend to support real usage, and a single cache hit serves all concurrent users requesting the same category/country combination. Laravel's Cache facade abstracts the storage backend — file cache for dev, Redis for production, no code change required.

### Why GNews API over NewsAPI.org

The project initially used NewsAPI.org, which is a popular tutorial choice. Production reality revealed two problems: free tier blocks production browser usage (only works server-side, which is fine here, but introduced friction), and country coverage outside the US is weak (India, Pakistan, etc. often return empty results). Switched to GNews — also free, 100 requests/day lifetime, real-time (no 24-hour delay), and consistently returns content across more countries. The Laravel news service includes a normalization layer that translates GNews's response shape into a stable internal format, so the frontend remained completely unchanged through the migration.

### Why snapshot bookmarks instead of storing only URLs

If you bookmark an article today and the news site takes it down tomorrow, your bookmark becomes a dead link. NewsHub stores the full article snapshot (title, description, image URL, source, author, published date, category) at bookmark time. The "Read More" button on a bookmark still tries the original URL, but the bookmark UI remains useful even after the source disappears. Same pattern Pocket and Instapaper use.

### Why polling-based "live" feel instead of WebSockets

For an admin dashboard or activity feed, "real-time" updates can come from either WebSockets (Laravel Reverb, Pusher) or polling. WebSockets require operating a separate persistent connection server, authenticating connections, managing reconnection logic. For a personal news app where activity-feed updates aren't critical to second-level latency, TanStack Query's `refetchInterval: 5000` provides identical UX with zero infrastructure cost. The pattern Stripe and AWS dashboards use for activity views.

### Why content-based MIME validation on logo uploads

A `Content-Type: image/png` header is set by the client — easy to spoof. The actual proof an upload is an image is whether the image library can parse it. The Laravel `MimeTypes` validator paired with image-content checks ensures uploaded logos are actually images, not malicious files renamed with `.png`.

### Why hide TanStack Query Devtools in production builds

The devtools floating icon and panel are invaluable during development — they show every query, mutation, cache state, and response shape. They're also a security and professionalism issue in production: they expose API endpoint URLs, response shapes, and cached user data to anyone who opens the app. Wrapped in `import.meta.env.DEV` check so they appear in dev and disappear in builds. Five-character fix, significant impact.

### Why audit-trail-style commits for documentation changes

Every commit message follows conventional-commits format, and documentation changes are tracked with the same discipline as code changes. The git history can be read as a project narrative — when was the demo user added? Which commit fixed the bookmark race condition? When did the project switch from NewsAPI to GNews and why? Clean commit history is part of the engineering output, not an afterthought.

---

## 🛠️ Tech Stack

### Backend
| Category | Technology |
|----------|------------|
| Language | PHP 8.2+ |
| Framework | Laravel 11 |
| Database | PostgreSQL 14+ |
| Auth | Laravel Sanctum (token-based) |
| HTTP Client | Guzzle (via Laravel's HTTP facade) |
| Cache | Laravel Cache (file in dev, Redis-ready) |
| Rate Limiting | Laravel built-in |
| Testing | PHPUnit |
| Validation | Laravel Form Requests |

### Frontend
| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript (strict) |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| UI Components | shadcn/ui (Radix primitives) |
| Data Fetching | TanStack Query v5 |
| State Management | Zustand |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | lucide-react |
| Fonts | @fontsource/geist-sans, @fontsource/geist-mono |
| Notifications | react-hot-toast |

### External
- GNews API (gnews.io) — third-party news provider, proxied through Laravel

---

## 🏗️ Architecture

```
┌──────────────────┐         ┌──────────────────┐
│  React + Vite    │◄────────│  Laravel API     │
│  (port 5173)     │  HTTPS  │  (port 8000)     │
│  + TanStack      │  Bearer │  + Sanctum       │
│  + Zustand       │ token   │  + Rate Limit    │
└──────────────────┘         └──────────┬───────┘
                                        │
                          ┌─────────────┼─────────────┐
                          │             │             │
                          ▼             ▼             ▼
                  ┌────────────┐ ┌───────────┐ ┌─────────────┐
                  │ PostgreSQL │ │ File      │ │ GNews API   │
                  │ 4 tables   │ │ Cache     │ │ (proxied)   │
                  └────────────┘ │ (10m TTL) │ └─────────────┘
                                 └───────────┘
```

**News fetch flow:**
1. User opens `/feed` → frontend calls `/api/news/top-headlines?category=technology`
2. Laravel checks cache for this category+country combination
3. **Cache hit:** Return cached response (no upstream call)
4. **Cache miss:** Laravel calls GNews API with server-side key, normalizes response shape, stores in cache for 10 minutes, returns to frontend
5. Frontend renders news cards with infinite scroll
6. User clicks bookmark → mutation → DB save → optimistic UI update
7. User clicks "Read More" → opens article in new tab + silently records reading history

---

## 📋 Prerequisites

- **PHP** 8.2 or higher
- **Composer** (PHP package manager)
- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher
- **npm** 9+

---

## 🚀 Getting Started

### Clone

```bash
git clone https://github.com/Haseebaleem/NewsHub.git
cd NewsHub
```

### Backend setup

```bash
cd backend

# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Edit .env:
# - DB_CONNECTION=pgsql
# - DB_DATABASE=newshub
# - DB_USERNAME, DB_PASSWORD
# - NEWS_API_PROVIDER=gnews
# - NEWS_API_KEY=<get from https://gnews.io>
# - NEWS_API_BASE_URL=https://gnews.io/api/v4

# Create database
psql -U postgres -c "CREATE DATABASE newshub;"

# Run migrations
php artisan migrate

# Seed demo user with sample bookmarks and reading history
php artisan db:seed

# Start backend (port 8000)
php artisan serve
```

### Frontend setup

In a new terminal:

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env

# Start frontend (port 5173)
npm run dev
```

### Demo Credentials

The seed script creates a pre-populated demo account:

| Field | Value |
|-------|-------|
| Email | `demo@newshub.local` |
| Password | `Demo123!` |

The demo account comes with:
- **10 bookmarks** across technology, business, and other categories (spread over the last 14 days)
- **30 reading history entries** across the last month (so the stats page shows meaningful charts immediately)
- **Configured preferences** (dark theme, default categories: technology + business)

This means the stats page, history timeline, and personalized feed all show meaningful data on first login. Or register a fresh account if preferred.

### Quick Tour
1. Log in with demo credentials → land on `/feed` with a personalized greeting
2. See the bookmark icons turn amber when clicked, persistent across reloads
3. Visit `/bookmarks` — articles grouped by date with filter input
4. Visit `/history` — vertical timeline of read articles
5. Visit `/stats` — 4 cards + line + bar charts based on the seeded reading history
6. Visit `/settings` — flip theme, change preferred categories

---

## 📡 API Endpoints

All endpoints under `/api`. Authenticated routes require `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create account, returns token |
| POST | `/auth/login` | — | Authenticate, returns token |
| POST | `/auth/logout` | ✅ | Invalidate current token |
| GET | `/user` | ✅ | Current user profile |

### News (proxied through Laravel)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/news/top-headlines` | — | Top headlines by category/country (cached 10m) |
| GET | `/news/search` | — | Search news by query (cached 10m) |

### Bookmarks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookmarks` | Paginated bookmarks (newest first) |
| POST | `/bookmarks` | Save article snapshot |
| DELETE | `/bookmarks/:id` | Remove bookmark |

### Reading History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reading-history` | Last 50 reading entries |
| POST | `/reading-history` | Record an article read |
| DELETE | `/reading-history` | Clear all history |

### Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/preferences` | User preferences |
| PATCH | `/preferences` | Update country/categories/theme |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Reading activity stats (week, month, top category, bookmark count) |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service + DB health check |

---

## 📁 Project Structure

```
NewsHub/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   └── Requests/         # Form Request validators
│   │   ├── Models/
│   │   ├── Services/             # NewsService (proxy + cache)
│   │   └── ...
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── factories/
│   ├── routes/
│   │   └── api.php
│   ├── tests/
│   │   └── Feature/              # PHPUnit feature tests
│   ├── .env.example
│   └── composer.json
├── frontend/
│   ├── src/
│   │   ├── api/                  # axios client + endpoint wrappers
│   │   ├── components/
│   │   │   ├── ui/               # shadcn primitives
│   │   │   ├── layout/
│   │   │   ├── news/             # NewsCard, NewsGrid, etc.
│   │   │   └── shared/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/               # Zustand (theme, sidebar, recent searches)
│   │   ├── lib/
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔐 Security Practices

- News API key stored server-side only (`.env`), never reaches the browser
- Sanctum tokens with secure hashing — never stored in plain text
- Per-route rate limiting (independent counters for register/login/news/etc.)
- Generic 401 responses (no distinction between "user not found" and "wrong password")
- Laravel's CSRF protection disabled for API routes (token-based auth handles this differently)
- Password hashing via bcrypt (Laravel default, 12 rounds)
- Form Request validation on every endpoint — invalid input never reaches business logic
- Content-based MIME validation on file uploads (logos)
- TanStack Query devtools hidden in production builds (no API leak)
- Bookmark URL uniqueness enforced per user (preventing duplicates via DB constraint)
- TypeScript strict mode in frontend, strict PHP types in backend
- `.env` gitignored, `.env.example` committed with placeholders

---

## 🧪 Testing

Feature tests cover authentication, news proxy behavior including cache hits and provider error handling, bookmark CRUD with duplicate prevention, reading history tracking, preferences, stats calculations, and the demo seeder idempotency:

```bash
cd backend
php artisan test
```

**Coverage:** 47 tests with 142 assertions, all passing. Includes 9 GNews-specific tests covering field mapping (image → urlToImage, source.name wrapping, totalArticles → total_results, apikey as query param) and error responses (401, 403, 429).

---

## 🗺️ Roadmap

### News & Discovery
- [ ] Source filtering (filter by news outlet)
- [ ] Personalized "for you" feed based on reading history (basic collaborative filtering)
- [ ] Article recommendations based on bookmarks
- [ ] Trending topics from reading patterns

### Social
- [ ] Public profile pages with shared bookmarks
- [ ] Follow other users for their public bookmark lists
- [ ] Comments/notes on bookmarks
- [ ] Reading lists (collections of related articles)

### Operations
- [ ] PWA installability with offline-cached articles
- [ ] Email digests (daily/weekly summary based on preferences)
- [ ] Push notifications for breaking news in preferred categories
- [ ] Multiple news provider support (NewsAPI, NewsData.io, Guardian Open Platform as fallbacks)

### Analytics
- [ ] Yearly "wrap" — articles read, categories explored, reading time
- [ ] Reading habit insights (most active days, peak hours)
- [ ] Comparison to anonymized averages

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file. Use it as a reference, starting point, or learning resource.

---

## 👤 Author

**Haseeb Aleem**
Senior Full Stack Developer & Team Lead

- 💼 **LinkedIn:** [linkedin.com/in/haseeb-aleem-dev](https://www.linkedin.com/in/haseeb-aleem-dev/)
- 💻 **GitHub:** [github.com/Haseebaleem](https://github.com/Haseebaleem)
- 📧 **Email:** haseebaleem2802@gmail.com
- 📍 **Location:** Multan, Pakistan (Open to Saudi Arabia & GCC relocation)

---

⭐ If you found this project useful, consider giving it a star.
