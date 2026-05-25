<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NewsTest extends TestCase
{
    /** Canonical GNews top-headlines response used across tests. */
    private const GNEWS_FIXTURE = [
        'totalArticles' => 2,
        'articles' => [
            [
                'title' => 'Mars Rover Update',
                'description' => 'New findings from Perseverance.',
                'content' => 'Long-form content body...',
                'url' => 'https://example.com/mars',
                'image' => 'https://cdn.example.com/mars.jpg',
                'publishedAt' => '2026-05-25T10:00:00Z',
                'source' => ['name' => 'BBC News', 'url' => 'https://bbc.co.uk'],
            ],
            [
                'title' => 'Quantum Chip Breakthrough',
                'description' => 'Researchers report stability gains.',
                'content' => 'More content...',
                'url' => 'https://example.com/quantum',
                'image' => 'https://cdn.example.com/quantum.jpg',
                'publishedAt' => '2026-05-25T09:00:00Z',
                'source' => ['name' => 'Wired', 'url' => 'https://wired.com'],
            ],
        ],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_top_headlines_proxies_and_returns_articles(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response(self::GNEWS_FIXTURE, 200),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertOk()
            ->assertJsonPath('data.total_results', 2)
            ->assertJsonCount(2, 'data.articles');
    }

    public function test_top_headlines_caches_response_to_avoid_repeat_upstream_calls(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response([
                'totalArticles' => 1,
                'articles' => [self::GNEWS_FIXTURE['articles'][0]],
            ], 200),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')->assertOk();
        $this->getJson('/api/news/top-headlines?country=in&category=technology')->assertOk();

        Http::assertSentCount(1);
    }

    public function test_search_validates_query(): void
    {
        $this->getJson('/api/news/search?q=x')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['q']);
    }

    public function test_search_passes_through_articles(): void
    {
        Http::fake([
            'gnews.test/api/v4/search*' => Http::response([
                'totalArticles' => 1,
                'articles' => [
                    [
                        'title' => 'Found',
                        'description' => null,
                        'url' => 'https://example.com/found',
                        'image' => null,
                        'publishedAt' => '2026-05-25T08:00:00Z',
                        'source' => ['name' => 'Reuters', 'url' => 'https://reuters.com'],
                    ],
                ],
            ], 200),
        ]);

        $this->getJson('/api/news/search?q=ai')
            ->assertOk()
            ->assertJsonPath('data.articles.0.title', 'Found');
    }

    public function test_validation_rejects_unknown_country(): void
    {
        $this->getJson('/api/news/top-headlines?country=zz')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['country']);
    }

    /* ----- Field-mapping tests: GNews shape → internal/wire shape ----- */

    public function test_news_service_maps_gnews_image_to_url_to_image(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response(self::GNEWS_FIXTURE, 200),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertOk()
            ->assertJsonPath('data.articles.0.urlToImage', 'https://cdn.example.com/mars.jpg')
            ->assertJsonMissingPath('data.articles.0.image');
    }

    public function test_news_service_wraps_gnews_source_name_in_object(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response(self::GNEWS_FIXTURE, 200),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertOk()
            ->assertJsonPath('data.articles.0.source.name', 'BBC News')
            ->assertJsonPath('data.articles.0.source.id', null);
    }

    public function test_news_service_sets_author_to_null_when_gnews_omits_it(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response(self::GNEWS_FIXTURE, 200),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertOk()
            ->assertJsonPath('data.articles.0.author', null);
    }

    public function test_news_service_maps_total_articles_to_total_results(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response([
                'totalArticles' => 54321,
                'articles' => self::GNEWS_FIXTURE['articles'],
            ], 200),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertOk()
            ->assertJsonPath('data.total_results', 54321)
            ->assertJsonMissingPath('data.totalArticles');
    }

    public function test_news_service_sends_apikey_as_query_param_not_header(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response(self::GNEWS_FIXTURE, 200),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')->assertOk();

        Http::assertSent(function ($request): bool {
            return str_contains($request->url(), 'apikey=test-key')
                && ! $request->hasHeader('X-Api-Key');
        });
    }

    /* ----- GNews-specific error handling ----- */

    public function test_news_service_handles_gnews_401_invalid_key(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response([
                'errors' => ['Invalid API key'],
            ], 401),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertStatus(401)
            ->assertJsonPath('error', 'news_provider_error')
            ->assertJsonPath('message', 'Invalid API key');
    }

    public function test_news_service_handles_gnews_403_quota_exceeded(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response([
                'errors' => ['You have reached your daily limit'],
            ], 403),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertStatus(403)
            ->assertJsonPath('error', 'news_provider_error')
            ->assertJsonPath('message', 'You have reached your daily limit');
    }

    public function test_news_service_handles_gnews_429_rate_limit(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response([], 429),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertStatus(429)
            ->assertJsonPath('error', 'news_provider_error')
            ->assertJsonPath('message', 'Too many requests to the news provider.');
    }

    public function test_news_service_handles_gnews_500_generic_failure(): void
    {
        Http::fake([
            'gnews.test/api/v4/top-headlines*' => Http::response(['status' => 'error'], 500),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertStatus(500)
            ->assertJsonFragment(['error' => 'news_provider_error']);
    }
}
