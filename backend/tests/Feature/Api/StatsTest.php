<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Bookmark;
use App\Models\ReadingHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_stats_count_reads_and_bookmarks(): void
    {
        $user = User::factory()->create();

        foreach (['technology', 'technology', 'sports'] as $i => $cat) {
            ReadingHistory::create([
                'user_id' => $user->id,
                'title' => "S{$i}",
                'article_url' => "https://e.com/{$i}",
                'source' => 'E',
                'category' => $cat,
                'read_at' => now()->subHours($i),
            ]);
        }

        Bookmark::create([
            'user_id' => $user->id,
            'title' => 'b',
            'article_url' => 'https://e.com/b',
            'source' => 'E',
            'category' => 'general',
            'published_at' => now(),
        ]);

        $this->actingAs($user)->getJson('/api/stats')
            ->assertOk()
            ->assertJsonPath('data.articles_read_this_week', 3)
            ->assertJsonPath('data.articles_read_this_month', 3)
            ->assertJsonPath('data.top_category', 'technology')
            ->assertJsonPath('data.bookmark_count', 1);
    }

    public function test_empty_user_returns_zero_counts_and_null_category(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/stats')
            ->assertOk()
            ->assertJsonPath('data.articles_read_this_week', 0)
            ->assertJsonPath('data.top_category', null)
            ->assertJsonPath('data.bookmark_count', 0);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/stats')->assertStatus(401);
    }
}
