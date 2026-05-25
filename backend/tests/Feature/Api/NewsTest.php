<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NewsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_top_headlines_proxies_and_returns_articles(): void
    {
        Http::fake([
            'newsapi.test/v2/top-headlines*' => Http::response([
                'status' => 'ok',
                'totalResults' => 2,
                'articles' => [
                    ['title' => 'One'],
                    ['title' => 'Two'],
                ],
            ], 200),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertOk()
            ->assertJsonPath('data.total_results', 2)
            ->assertJsonCount(2, 'data.articles');
    }

    public function test_top_headlines_caches_response_to_avoid_repeat_upstream_calls(): void
    {
        Http::fake([
            'newsapi.test/v2/top-headlines*' => Http::response([
                'status' => 'ok', 'totalResults' => 1, 'articles' => [['title' => 'Cached']],
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
            'newsapi.test/v2/everything*' => Http::response([
                'status' => 'ok', 'totalResults' => 1, 'articles' => [['title' => 'Found']],
            ], 200),
        ]);

        $this->getJson('/api/news/search?q=ai')
            ->assertOk()
            ->assertJsonPath('data.articles.0.title', 'Found');
    }

    public function test_upstream_failure_returns_502(): void
    {
        Http::fake([
            'newsapi.test/v2/top-headlines*' => Http::response(['status' => 'error'], 500),
        ]);

        $this->getJson('/api/news/top-headlines?country=in&category=technology')
            ->assertStatus(500)
            ->assertJsonFragment(['error' => 'news_provider_error']);
    }

    public function test_validation_rejects_unknown_country(): void
    {
        $this->getJson('/api/news/top-headlines?country=zz')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['country']);
    }
}
