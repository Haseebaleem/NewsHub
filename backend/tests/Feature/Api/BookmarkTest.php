<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Bookmark;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookmarkTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function payload(string $url = 'https://news.example.com/a'): array
    {
        return [
            'title' => 'Breaking story',
            'description' => 'A long-ish summary.',
            'article_url' => $url,
            'image_url' => 'https://news.example.com/a.jpg',
            'source' => 'Example News',
            'author' => 'Jane Reporter',
            'published_at' => '2026-05-25T10:00:00Z',
            'category' => 'technology',
        ];
    }

    public function test_create_bookmark_persists_snapshot(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/bookmarks', $this->payload())
            ->assertStatus(201)
            ->assertJsonPath('data.title', 'Breaking story');

        $this->assertDatabaseHas('bookmarks', [
            'user_id' => $user->id,
            'article_url' => 'https://news.example.com/a',
        ]);
    }

    public function test_duplicate_bookmark_returns_409(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/bookmarks', $this->payload())->assertStatus(201);
        $this->actingAs($user)->postJson('/api/bookmarks', $this->payload())
            ->assertStatus(409)
            ->assertJsonFragment(['error' => 'duplicate_bookmark']);
    }

    public function test_two_users_can_bookmark_same_url(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();

        $this->actingAs($a)->postJson('/api/bookmarks', $this->payload())->assertStatus(201);
        $this->actingAs($b)->postJson('/api/bookmarks', $this->payload())->assertStatus(201);
    }

    public function test_list_returns_only_caller_bookmarks_newest_first(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        Bookmark::create([...$this->payload('https://e.com/1'), 'user_id' => $me->id, 'created_at' => now()->subMinutes(2)]);
        Bookmark::create([...$this->payload('https://e.com/2'), 'user_id' => $me->id, 'created_at' => now()]);
        Bookmark::create([...$this->payload('https://e.com/3'), 'user_id' => $other->id]);

        $response = $this->actingAs($me)->getJson('/api/bookmarks')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $urls = array_column($response->json('data'), 'article_url');
        $this->assertSame(['https://e.com/2', 'https://e.com/1'], $urls);
    }

    public function test_delete_own_bookmark(): void
    {
        $user = User::factory()->create();
        $bookmark = Bookmark::create([...$this->payload(), 'user_id' => $user->id]);

        $this->actingAs($user)->deleteJson('/api/bookmarks/'.$bookmark->id)->assertOk();
        $this->assertDatabaseMissing('bookmarks', ['id' => $bookmark->id]);
    }

    public function test_delete_other_users_bookmark_returns_404(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $bookmark = Bookmark::create([...$this->payload(), 'user_id' => $owner->id]);

        $this->actingAs($intruder)->deleteJson('/api/bookmarks/'.$bookmark->id)
            ->assertStatus(404);
        $this->assertDatabaseHas('bookmarks', ['id' => $bookmark->id]);
    }

    public function test_validation_rejects_missing_required_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/bookmarks', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'article_url', 'source', 'category']);
    }

    public function test_requires_authentication(): void
    {
        $this->postJson('/api/bookmarks', $this->payload())->assertStatus(401);
        $this->getJson('/api/bookmarks')->assertStatus(401);
    }
}
