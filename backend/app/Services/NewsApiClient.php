<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class NewsApiClient
{
    private const PAGE_SIZE = 20;
    private const TIMEOUT_SECONDS = 8;

    public function __construct(
        private readonly string $apiKey,
        private readonly string $baseUrl,
        private readonly int $cacheTtl,
    ) {
    }

    public static function fromConfig(): self
    {
        return new self(
            apiKey: (string) config('services.newsapi.key', ''),
            baseUrl: rtrim((string) config('services.newsapi.base_url', 'https://newsapi.org/v2'), '/'),
            cacheTtl: (int) config('services.newsapi.cache_ttl', 600),
        );
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    public function topHeadlines(array $params): array
    {
        return $this->get('top-headlines', $params);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    public function search(array $params): array
    {
        return $this->get('everything', $params);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    private function get(string $endpoint, array $params): array
    {
        if ($this->apiKey === '' || $this->apiKey === 'your_newsapi_key_here') {
            throw new RuntimeException('News provider is not configured.', 503);
        }

        $params = array_merge(['pageSize' => self::PAGE_SIZE], $params);
        $cacheKey = $this->cacheKey($endpoint, $params);

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            Log::debug('newsapi cache hit', ['key' => $cacheKey]);

            return $cached;
        }

        try {
            $response = Http::withHeaders(['X-Api-Key' => $this->apiKey])
                ->timeout(self::TIMEOUT_SECONDS)
                ->acceptJson()
                ->get($this->baseUrl.'/'.$endpoint, $params);
        } catch (ConnectionException $e) {
            Log::warning('newsapi connection failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Unable to reach the news provider.', 502, $e);
        }

        if ($response->failed()) {
            Log::warning('newsapi upstream error', [
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 500),
            ]);
            $upstreamStatus = $response->status();
            $code = ($upstreamStatus >= 400 && $upstreamStatus < 600) ? $upstreamStatus : 502;
            throw new RuntimeException('News provider returned an error.', $code);
        }

        $data = $response->json();
        if (! is_array($data)) {
            throw new RuntimeException('News provider returned an unexpected payload.', 502);
        }

        Cache::put($cacheKey, $data, $this->cacheTtl);
        Log::debug('newsapi cache store', ['key' => $cacheKey, 'ttl' => $this->cacheTtl]);

        return $data;
    }

    /** @param  array<string, mixed>  $params */
    private function cacheKey(string $endpoint, array $params): string
    {
        ksort($params);

        return 'newsapi:'.$endpoint.':'.md5((string) json_encode($params));
    }
}
