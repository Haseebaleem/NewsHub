<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Bookmark;
use App\Models\Preference;
use App\Models\ReadingHistory;
use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DemoUserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_creates_demo_user_with_expected_sample_data(): void
    {
        Artisan::call('db:seed');

        $user = User::where('email', DemoUserSeeder::EMAIL)->first();
        $this->assertNotNull($user, 'Demo user should exist after seeding');
        $this->assertSame(DemoUserSeeder::NAME, $user->name);
        $this->assertTrue(
            Hash::check(DemoUserSeeder::PASSWORD, $user->password),
            'Demo password should hash to the stored value',
        );

        $this->assertSame(10, Bookmark::where('user_id', $user->id)->count());
        $this->assertSame(30, ReadingHistory::where('user_id', $user->id)->count());

        /** @var Preference $prefs */
        $prefs = Preference::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('us', $prefs->default_country);
        $this->assertSame('dark', $prefs->theme);
        $this->assertSame(['technology', 'business'], $prefs->default_categories);
    }

    public function test_seeder_is_idempotent(): void
    {
        Artisan::call('db:seed');
        Artisan::call('db:seed');

        // Exactly one user, exactly 10 bookmarks, exactly 30 reads —
        // re-running shouldn't pile up duplicates.
        $this->assertSame(
            1,
            User::where('email', DemoUserSeeder::EMAIL)->count(),
            'Re-seeding must not duplicate the demo user',
        );

        $user = User::where('email', DemoUserSeeder::EMAIL)->firstOrFail();
        $this->assertSame(10, Bookmark::where('user_id', $user->id)->count());
        $this->assertSame(30, ReadingHistory::where('user_id', $user->id)->count());
        $this->assertSame(1, Preference::where('user_id', $user->id)->count());
    }
}
