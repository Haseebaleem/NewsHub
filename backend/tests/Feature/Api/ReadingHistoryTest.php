<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\ReadingHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadingHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_creates_entry(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/reading-history', [
            'title' => 'A read',
            'article_url' => 'https://news.example.com/x',
            'source' => 'Example',
            'category' => 'general',
        ])->assertStatus(201);

        $this->assertDatabaseHas('reading_history', [
            'user_id' => $user->id,
            'article_url' => 'https://news.example.com/x',
        ]);
    }

    public function test_index_returns_newest_first_capped_at_50(): void
    {
        $user = User::factory()->create();

        for ($i = 1; $i <= 55; $i++) {
            ReadingHistory::create([
                'user_id' => $user->id,
                'title' => "Story {$i}",
                'article_url' => "https://e.com/{$i}",
                'source' => 'E',
                'category' => 'general',
                'read_at' => now()->subMinutes(55 - $i),
            ]);
        }

        $items = $this->actingAs($user)->getJson('/api/reading-history')
            ->assertOk()
            ->json('data');

        $this->assertCount(50, $items);
        $this->assertSame('Story 55', $items[0]['title']);
    }

    public function test_clear_wipes_history(): void
    {
        $user = User::factory()->create();
        ReadingHistory::create([
            'user_id' => $user->id,
            'title' => 'X',
            'article_url' => 'https://e.com/x',
            'source' => 'E',
            'category' => 'general',
            'read_at' => now(),
        ]);

        $this->actingAs($user)->deleteJson('/api/reading-history')->assertOk();
        $this->assertDatabaseCount('reading_history', 0);
    }

    public function test_does_not_leak_other_users_history(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        ReadingHistory::create([
            'user_id' => $other->id,
            'title' => 'Secret',
            'article_url' => 'https://e.com/secret',
            'source' => 'E',
            'category' => 'general',
            'read_at' => now(),
        ]);

        $this->actingAs($me)->getJson('/api/reading-history')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_validation_rejects_unknown_category(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/reading-history', [
            'title' => 'T',
            'article_url' => 'https://e.com/t',
            'source' => 'E',
            'category' => 'crypto',
        ])->assertStatus(422)->assertJsonValidationErrors(['category']);
    }
}
