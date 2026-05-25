<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Bookmark;
use App\Models\Preference;
use App\Models\ReadingHistory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds (or refreshes) the recruiter-facing demo account:
 *
 *   demo@newshub.local / Demo123!
 *
 * The seeder is idempotent — re-running it produces the same final
 * state (10 bookmarks, 30 history entries, dark theme + tech/business
 * categories). Bookmarks and history rows for this user are
 * truncated-and-refilled rather than upserted, so timestamps land in
 * predictable date buckets ("Today / Yesterday / Earlier this week /
 * Earlier") every time.
 */
class DemoUserSeeder extends Seeder
{
    public const EMAIL = 'demo@newshub.local';
    public const PASSWORD = 'Demo123!';
    public const NAME = 'Demo User';

    public function run(): void
    {
        DB::transaction(function (): void {
            $user = User::firstOrCreate(
                ['email' => self::EMAIL],
                [
                    'name' => self::NAME,
                    'password' => Hash::make(self::PASSWORD),
                ],
            );

            // Reset child rows on every run so dates always reflect "now".
            $user->bookmarks()->delete();
            $user->readingHistory()->delete();
            $user->preference()->delete();

            $this->seedPreferences($user);
            $this->seedBookmarks($user);
            $this->seedReadingHistory($user);
        });
    }

    private function seedPreferences(User $user): void
    {
        $user->preference()->create([
            'default_country' => 'us',
            'default_categories' => ['technology', 'business'],
            'theme' => 'dark',
        ]);
    }

    private function seedBookmarks(User $user): void
    {
        foreach ($this->bookmarkRows() as $row) {
            $createdAt = Carbon::now()->subDays($row['days_ago'])->subHours($row['hour_offset']);

            Bookmark::create([
                'user_id' => $user->id,
                'title' => $row['title'],
                'description' => $row['description'],
                'article_url' => $row['article_url'],
                'image_url' => $row['image_url'],
                'source' => $row['source'],
                'author' => $row['author'],
                'published_at' => $createdAt->copy()->subMinutes(45),
                'category' => $row['category'],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }

    private function seedReadingHistory(User $user): void
    {
        foreach ($this->readingHistoryRows() as $row) {
            ReadingHistory::create([
                'user_id' => $user->id,
                'title' => $row['title'],
                'article_url' => $row['article_url'],
                'source' => $row['source'],
                'category' => $row['category'],
                'read_at' => Carbon::now()->subDays($row['days_ago'])->subHours($row['hour_offset']),
            ]);
        }
    }

    /**
     * 10 bookmarks across technology / business / sports, spread over
     * the last 14 days so the "grouped by date" view shows multiple
     * buckets: Today, Yesterday, Earlier this week, Earlier.
     *
     * @return list<array<string, mixed>>
     */
    private function bookmarkRows(): array
    {
        return [
            // Today bucket
            [
                'title' => 'Linux 7.0 Kernel Ships With Hardened Memory Safety',
                'description' => 'The release adds optional runtime checks for use-after-free and out-of-bounds access in core subsystems, with measurable overhead under 2% on benchmarked workloads.',
                'article_url' => 'https://arstechnica.com/2026/linux-7-0-kernel-memory-safety',
                'image_url' => 'https://cdn.arstechnica.net/wp-content/uploads/2026/linux-7.jpg',
                'source' => 'Ars Technica',
                'author' => null,
                'category' => 'technology',
                'days_ago' => 0,
                'hour_offset' => 3,
            ],
            [
                'title' => 'Rust Adoption Crosses 30% in Fortune 500 Backends',
                'description' => 'A new survey shows enterprises moving latency-critical paths from Go and Java to Rust, citing memory safety guarantees and predictable performance under load.',
                'article_url' => 'https://www.theverge.com/2026/rust-fortune-500-adoption',
                'image_url' => 'https://cdn.vox-cdn.com/thumbor/rust-2026.jpg',
                'source' => 'The Verge',
                'author' => null,
                'category' => 'technology',
                'days_ago' => 0,
                'hour_offset' => 8,
            ],

            // Yesterday bucket
            [
                'title' => 'Apple Vision Pro 2 Hands-On: Lighter, Sharper, Half the Price',
                'description' => 'The second-generation mixed-reality headset trims 120 grams and adds a microOLED panel that doubles effective pixel density without raising thermal output.',
                'article_url' => 'https://www.theverge.com/2026/apple-vision-pro-2-hands-on',
                'image_url' => 'https://cdn.vox-cdn.com/thumbor/vision-pro-2.jpg',
                'source' => 'The Verge',
                'author' => null,
                'category' => 'technology',
                'days_ago' => 1,
                'hour_offset' => 4,
            ],

            // Earlier this week bucket
            [
                'title' => 'F1: Lewis Hamilton Wins Season Finale at Abu Dhabi',
                'description' => 'A late safety car bunches the field; Hamilton holds off Verstappen on the final two laps to take his eighth Grand Prix of the season.',
                'article_url' => 'https://www.bbc.co.uk/sport/formula1/2026-abu-dhabi-finale',
                'image_url' => 'https://ichef.bbci.co.uk/news/abu-dhabi-2026.jpg',
                'source' => 'BBC Sport',
                'author' => null,
                'category' => 'sports',
                'days_ago' => 2,
                'hour_offset' => 12,
            ],
            [
                'title' => 'OpenAI Announces GPT-5 With Native Multimodal Architecture',
                'description' => 'The new model integrates vision, text, and audio streams in a single transformer, with substantial gains reported on long-horizon reasoning benchmarks.',
                'article_url' => 'https://techcrunch.com/2026/openai-gpt-5-launch',
                'image_url' => 'https://techcrunch.com/wp-content/uploads/2026/gpt-5.jpg',
                'source' => 'TechCrunch',
                'author' => null,
                'category' => 'technology',
                'days_ago' => 3,
                'hour_offset' => 6,
            ],
            [
                'title' => 'Researchers Demonstrate Million-Qubit Quantum Chip Architecture',
                'description' => 'A new modular design uses photonic links between cryogenic modules, potentially clearing the path to fault-tolerant quantum computation within the decade.',
                'article_url' => 'https://www.wired.com/2026/million-qubit-architecture',
                'image_url' => 'https://media.wired.com/quantum-2026.jpg',
                'source' => 'Wired',
                'author' => null,
                'category' => 'technology',
                'days_ago' => 4,
                'hour_offset' => 9,
            ],
            [
                'title' => 'Federal Reserve Signals Three Rate Cuts Through 2026',
                'description' => 'Chair Powell hinted at a measured easing path as inflation continues toward the 2% target, while emphasizing data-dependence in forward guidance.',
                'article_url' => 'https://www.reuters.com/business/fed-2026-rate-cuts',
                'image_url' => 'https://www.reuters.com/resizer/fed-2026.jpg',
                'source' => 'Reuters',
                'author' => null,
                'category' => 'business',
                'days_ago' => 5,
                'hour_offset' => 2,
            ],

            // Earlier bucket
            [
                'title' => 'EV Sales Cross 40% of New US Vehicles for the First Time',
                'description' => 'Tax credits and falling battery prices drive a milestone quarter, with legacy automakers narrowing the gap on EV-native incumbents.',
                'article_url' => 'https://www.bloomberg.com/news/2026/ev-sales-40-percent',
                'image_url' => 'https://assets.bbhub.io/ev-2026.jpg',
                'source' => 'Bloomberg',
                'author' => null,
                'category' => 'business',
                'days_ago' => 7,
                'hour_offset' => 5,
            ],
            [
                'title' => 'NBA Finals: Celtics Sweep, Tatum Named Finals MVP',
                'description' => 'A dominant defensive series caps a 65-win season; Tatum becomes the youngest Finals MVP since LeBron James in 2012.',
                'article_url' => 'https://www.espn.com/nba/2026-finals-celtics-sweep',
                'image_url' => 'https://a.espncdn.com/photo/2026/nba-finals.jpg',
                'source' => 'ESPN',
                'author' => null,
                'category' => 'sports',
                'days_ago' => 10,
                'hour_offset' => 18,
            ],
            [
                'title' => 'Big Tech Layoffs: 60,000 Roles Cut as AI Reshapes Org Charts',
                'description' => 'Engineering and ops teams bear the brunt while AI infrastructure groups expand, with leaders citing productivity gains rather than retrenchment.',
                'article_url' => 'https://www.theguardian.com/technology/2026/big-tech-layoffs-ai',
                'image_url' => 'https://i.guim.co.uk/img/media/layoffs-2026.jpg',
                'source' => 'The Guardian',
                'author' => null,
                'category' => 'business',
                'days_ago' => 12,
                'hour_offset' => 8,
            ],
        ];
    }

    /**
     * 30 reading history entries across the last 30 days, weighted
     * toward technology + business so the stats page renders:
     *   - Top category: technology
     *   - Bar chart: technology > business > sports > others
     *   - Line chart: realistic activity curve over the month
     *
     * @return list<array<string, mixed>>
     */
    private function readingHistoryRows(): array
    {
        $rows = [];
        $catalog = $this->historyCatalog();
        $schedule = $this->historySchedule();

        foreach ($schedule as $i => [$daysAgo, $hourOffset, $category]) {
            // Pick a deterministic catalog entry per (category, position)
            // so reruns produce the same content.
            $entries = $catalog[$category] ?? $catalog['general'];
            $entry = $entries[$i % count($entries)];

            $rows[] = [
                'title' => $entry['title'],
                'article_url' => sprintf('%s?h=%d', $entry['url'], $i + 1),
                'source' => $entry['source'],
                'category' => $category,
                'days_ago' => $daysAgo,
                'hour_offset' => $hourOffset,
            ];
        }

        return $rows;
    }

    /**
     * Schedule of (daysAgo, hourOffset, category) for 30 reads.
     * Spread to cover every day of the last week, then fades out across
     * weeks 2-4 with the same category mix.
     *
     * @return list<array{int, int, string}>
     */
    private function historySchedule(): array
    {
        return [
            // This week (~7 entries, 1/day)
            [0, 2, 'technology'],
            [0, 9, 'business'],
            [1, 4, 'technology'],
            [2, 7, 'business'],
            [3, 5, 'technology'],
            [4, 11, 'sports'],
            [5, 3, 'business'],
            [6, 8, 'technology'],

            // Week 2 (~8 entries)
            [8, 6, 'technology'],
            [9, 10, 'business'],
            [10, 2, 'technology'],
            [11, 14, 'sports'],
            [12, 5, 'business'],
            [13, 9, 'technology'],
            [14, 3, 'general'],
            [15, 11, 'technology'],

            // Week 3 (~7 entries)
            [17, 7, 'business'],
            [18, 4, 'technology'],
            [19, 13, 'science'],
            [20, 6, 'business'],
            [21, 9, 'technology'],
            [22, 2, 'health'],
            [23, 10, 'technology'],

            // Week 4 (~7 entries)
            [24, 5, 'business'],
            [25, 8, 'technology'],
            [26, 12, 'business'],
            [27, 4, 'sports'],
            [28, 7, 'technology'],
            [29, 11, 'business'],
            [30, 3, 'technology'],
        ];
    }

    /**
     * Title/source/url catalog grouped by category. The seeder cycles
     * through these to produce 30 history rows; URLs get a unique
     * query string suffix per row so distinct reads don't collide.
     *
     * @return array<string, list<array<string, string>>>
     */
    private function historyCatalog(): array
    {
        return [
            'technology' => [
                ['title' => 'How TypeScript 6 Changes Type Inference', 'source' => 'The Verge', 'url' => 'https://www.theverge.com/2026/typescript-6-inference'],
                ['title' => 'WebGPU Hits Stable on Every Major Browser', 'source' => 'Ars Technica', 'url' => 'https://arstechnica.com/2026/webgpu-stable'],
                ['title' => 'Postgres 18 Lands With Faster Vacuum', 'source' => 'Hacker News', 'url' => 'https://news.ycombinator.com/postgres-18'],
                ['title' => 'Inside the Latest Llama Release', 'source' => 'TechCrunch', 'url' => 'https://techcrunch.com/2026/llama-release'],
                ['title' => 'A New Take on Local-First Databases', 'source' => 'Wired', 'url' => 'https://www.wired.com/2026/local-first-db'],
                ['title' => 'The Quiet Rise of Server-Side React', 'source' => 'The Verge', 'url' => 'https://www.theverge.com/2026/ssr-renaissance'],
                ['title' => 'Why Edge Compute Is Finally Cheaper Than Origin', 'source' => 'Ars Technica', 'url' => 'https://arstechnica.com/2026/edge-economics'],
            ],
            'business' => [
                ['title' => 'Tech Stocks Rally on Fed Pivot', 'source' => 'Reuters', 'url' => 'https://www.reuters.com/business/tech-rally-2026'],
                ['title' => 'Oil Holds Above $80 as OPEC Extends Cuts', 'source' => 'Bloomberg', 'url' => 'https://www.bloomberg.com/news/oil-opec-2026'],
                ['title' => 'Bond Yields Slip on Cooling CPI Print', 'source' => 'Reuters', 'url' => 'https://www.reuters.com/business/bond-yields-cpi'],
                ['title' => 'Inside the Hot Quarter for Cloud Margins', 'source' => 'The Guardian', 'url' => 'https://www.theguardian.com/business/cloud-margins'],
                ['title' => 'European Banks Beat Forecasts Again', 'source' => 'Reuters', 'url' => 'https://www.reuters.com/business/european-banks-q1'],
                ['title' => 'Startup Funding Tilts Hard Toward AI Infra', 'source' => 'Bloomberg', 'url' => 'https://www.bloomberg.com/news/ai-infra-funding'],
            ],
            'sports' => [
                ['title' => 'Champions League: A Tactical Breakdown', 'source' => 'BBC Sport', 'url' => 'https://www.bbc.co.uk/sport/ucl-tactics-2026'],
                ['title' => 'Tennis: Australian Open Quarterfinals Set', 'source' => 'ESPN', 'url' => 'https://www.espn.com/tennis/ao-2026-quarters'],
                ['title' => 'NFL Free Agency: Day Two Winners and Losers', 'source' => 'ESPN', 'url' => 'https://www.espn.com/nfl/free-agency-day-2'],
            ],
            'general' => [
                ['title' => 'Global Summit Closes With Climate Pledges', 'source' => 'Reuters', 'url' => 'https://www.reuters.com/world/summit-climate-pledges'],
                ['title' => 'Major Storm Sweeps Across Western Europe', 'source' => 'BBC News', 'url' => 'https://www.bbc.co.uk/news/europe-storm-2026'],
            ],
            'science' => [
                ['title' => 'Webb Telescope Spots Ringed Exoplanet', 'source' => 'BBC News', 'url' => 'https://www.bbc.co.uk/news/science-webb-exoplanet'],
                ['title' => 'New Fusion Reactor Sustains Plasma for 5 Minutes', 'source' => 'Ars Technica', 'url' => 'https://arstechnica.com/science/fusion-record'],
            ],
            'health' => [
                ['title' => 'Long-Acting Insulin Trial Posts Strong Results', 'source' => 'Reuters', 'url' => 'https://www.reuters.com/health/insulin-trial-2026'],
                ['title' => 'Wearables Now Catching Atrial Fibrillation Earlier', 'source' => 'The Guardian', 'url' => 'https://www.theguardian.com/health/wearables-afib'],
            ],
        ];
    }
}
