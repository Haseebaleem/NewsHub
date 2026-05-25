<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\NewsApiClient;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(NewsApiClient::class, static fn () => NewsApiClient::fromConfig());
    }

    public function boot(): void
    {
        RateLimiter::for('api', static function (Request $request): Limit {
            return $request->user() !== null
                ? Limit::perMinute(60)->by((string) $request->user()->id)
                : Limit::perMinute(30)->by((string) $request->ip());
        });

        RateLimiter::for('news', static function (Request $request): Limit {
            return $request->user() !== null
                ? Limit::perMinute(60)->by((string) $request->user()->id)
                : Limit::perMinute(10)->by((string) $request->ip());
        });

        RateLimiter::for('auth', static function (Request $request): Limit {
            return Limit::perMinute(10)->by((string) $request->ip());
        });
    }
}
