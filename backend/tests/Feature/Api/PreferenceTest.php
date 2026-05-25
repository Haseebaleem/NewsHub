<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Preference;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_returns_defaults_when_missing(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/preferences')
            ->assertOk()
            ->assertJsonPath('data.default_country', 'in')
            ->assertJsonPath('data.theme', 'light')
            ->assertJsonPath('data.default_categories', ['general', 'technology']);

        $this->assertDatabaseHas('preferences', ['user_id' => $user->id]);
    }

    public function test_update_persists_valid_changes(): void
    {
        $user = User::factory()->create();
        $user->preference()->create(Preference::DEFAULTS);

        $this->actingAs($user)->patchJson('/api/preferences', [
            'theme' => 'dark',
            'default_country' => 'us',
            'default_categories' => ['business', 'sports'],
        ])->assertOk()
            ->assertJsonPath('data.theme', 'dark')
            ->assertJsonPath('data.default_country', 'us');
    }

    public function test_update_rejects_invalid_category(): void
    {
        $user = User::factory()->create();
        $user->preference()->create(Preference::DEFAULTS);

        $this->actingAs($user)->patchJson('/api/preferences', [
            'default_categories' => ['general', 'crypto'],
        ])->assertStatus(422)->assertJsonValidationErrors(['default_categories.1']);
    }

    public function test_update_rejects_invalid_theme(): void
    {
        $user = User::factory()->create();
        $user->preference()->create(Preference::DEFAULTS);

        $this->actingAs($user)->patchJson('/api/preferences', [
            'theme' => 'neon',
        ])->assertStatus(422)->assertJsonValidationErrors(['theme']);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/preferences')->assertStatus(401);
        $this->patchJson('/api/preferences', ['theme' => 'dark'])->assertStatus(401);
    }
}
