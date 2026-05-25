<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Top-level seeder. Delegates the heavy lifting to dedicated
     * seeders so each one is small enough to read end-to-end.
     */
    public function run(): void
    {
        $this->call([
            DemoUserSeeder::class,
        ]);
    }
}
