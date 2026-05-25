<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Preference;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_token_and_preferences(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email'], 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertDatabaseHas('preferences', [
            'user_id' => $user->id,
            'default_country' => 'in',
            'theme' => 'light',
        ]);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/auth/register', [
            'name' => 'X',
            'email' => 'taken@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_register_rejects_weak_password(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'X',
            'email' => 'a@example.com',
            'password' => 'weak',
            'password_confirmation' => 'weak',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_register_normalizes_email_to_lowercase(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Casey',
            'email' => 'Casey@EXAMPLE.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', ['email' => 'casey@example.com']);
    }

    public function test_login_succeeds_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'lo@example.com',
            'password' => 'Password1',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'lo@example.com',
            'password' => 'Password1',
        ])->assertOk()
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_login_returns_generic_401_for_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'real@example.com',
            'password' => 'Password1',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'real@example.com',
            'password' => 'NotIt99',
        ])->assertStatus(401)->assertJsonFragment(['error' => 'invalid_credentials']);
    }

    public function test_login_returns_generic_401_for_unknown_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'Password1',
        ])->assertStatus(401)->assertJsonFragment(['error' => 'invalid_credentials']);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/user')->assertStatus(401);
    }

    public function test_me_returns_current_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeaders(['Authorization' => 'Bearer '.$token])
            ->postJson('/api/auth/logout')
            ->assertOk();

        // Clear the auth manager's resolved-user cache so the next request
        // re-runs Sanctum against the (now revoked) bearer token instead of
        // returning the cached web-guard user from the previous request.
        $this->app['auth']->forgetGuards();

        $this->assertSame(0, $user->fresh()->tokens()->count());

        $this->withHeaders(['Authorization' => 'Bearer '.$token])
            ->getJson('/api/user')
            ->assertStatus(401);
    }
}
