<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Wraps the GNews API (https://gnews.io) behind a NewsAPI-compatible
 * surface. The frontend reads article.urlToImage, article.source.name,
 * article.author etc.; this service translates GNews's flatter shape
 * (article.image, article.source.name, no author) to that form so the
 * UI didn't have to change when we swapped upstreams.
 */
class NewsService
{
    /**
     * Free GNews tier caps `max` at 10 articles per response. Paid plans
     * can go up to 100; nothing here would need to change beyond raising
     * this constant.
     */
    private const PAGE_SIZE = 10;
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
            apiKey: (string) config('services.news.key', ''),
            baseUrl: rtrim((string) config('services.news.base_url', 'https://gnews.io/api/v4'), '/'),
            cacheTtl: (int) config('services.news.cache_ttl', 600),
        );
    }

    /**
     * @param  array{country?: string, category?: string, page?: int}  $params
     * @return array{totalResults: int, articles: list<array<string, mixed>>}
     */
    public function topHeadlines(array $params): array
    {
        $upstream = [
            'category' => (string) ($params['category'] ?? 'general'),
            'country' => (string) ($params['country'] ?? 'in'),
            'lang' => 'en',
            'max' => self::PAGE_SIZE,
            'page' => max(1, (int) ($params['page'] ?? 1)),
        ];

        return $this->normalize($this->fetch('top-headlines', $upstream));
    }

    /**
     * @param  array{q?: string, page?: int}  $params
     * @return array{totalResults: int, articles: list<array<string, mixed>>}
     */
    public function search(array $params): array
    {
        $upstream = [
            'q' => (string) ($params['q'] ?? ''),
            'lang' => 'en',
            'sortby' => 'publishedAt',
            'max' => self::PAGE_SIZE,
            'page' => max(1, (int) ($params['page'] ?? 1)),
        ];

        return $this->normalize($this->fetch('search', $upstream));
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    private function fetch(string $endpoint, array $params): array
    {
        if ($this->apiKey === '' || $this->apiKey === 'your_gnews_api_key_here') {
            throw new RuntimeException('News provider is not configured.', 503);
        }

        $cacheKey = $this->cacheKey($endpoint, $params);
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            Log::debug('news cache hit', ['key' => $cacheKey]);

            return $cached;
        }

        // GNews uses an `apikey` query param (lowercase k) instead of a
        // header. Adding it after the cache key is computed so the key
        // doesn't pin to a specific rotated credential.
        $withKey = ['apikey' => $this->apiKey, ...$params];

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->acceptJson()
                ->get($this->baseUrl.'/'.$endpoint, $withKey);
        } catch (ConnectionException $e) {
            Log::warning('news connection failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Unable to reach the news provider.', 502, $e);
        }

        if ($response->failed()) {
            $upstreamStatus = $response->status();
            $reason = $this->describeGnewsError($response->json(), $upstreamStatus);
            Log::warning('news upstream error', [
                'status' => $upstreamStatus,
                'reason' => $reason,
                'body' => mb_substr($response->body(), 0, 500),
            ]);
            $code = $upstreamStatus >= 400 && $upstreamStatus < 600 ? $upstreamStatus : 502;
            throw new RuntimeException($reason, $code);
        }

        $data = $response->json();
        if (! is_array($data) || ! isset($data['articles']) || ! is_array($data['articles'])) {
            throw new RuntimeException('News provider returned an unexpected payload.', 502);
        }

        Cache::put($cacheKey, $data, $this->cacheTtl);
        Log::debug('news cache store', ['key' => $cacheKey, 'ttl' => $this->cacheTtl]);

        return $data;
    }

    /**
     * GNews → NewsAPI-shape translator. Kept in one place so callers
     * (controller, tests, any future service) get a predictable wire
     * shape regardless of which upstream the proxy actually hits.
     *
     * @param  array<string, mixed>  $gnews
     * @return array{totalResults: int, articles: list<array<string, mixed>>}
     */
    private function normalize(array $gnews): array
    {
        $articles = [];
        foreach (($gnews['articles'] ?? []) as $article) {
            if (! is_array($article)) {
                continue;
            }
            $source = is_array($article['source'] ?? null) ? $article['source'] : [];
            $articles[] = [
                'source' => [
                    'id' => null,
                    'name' => (string) ($source['name'] ?? 'Unknown'),
                ],
                // GNews does not carry per-article authors. We expose null
                // so the frontend's "author" line just doesn't render,
                // matching the NewsAPI behavior for sources without one.
                'author' => null,
                'title' => (string) ($article['title'] ?? ''),
                'description' => $article['description'] ?? null,
                'url' => (string) ($article['url'] ?? ''),
                // GNews calls it `image`; we re-key it as `urlToImage` so
                // the existing NewsCard / BookmarkCard rendering paths
                // keep working unchanged.
                'urlToImage' => $article['image'] ?? null,
                'publishedAt' => (string) ($article['publishedAt'] ?? ''),
                'content' => $article['content'] ?? null,
            ];
        }

        return [
            'totalResults' => (int) ($gnews['totalArticles'] ?? count($articles)),
            'articles' => $articles,
        ];
    }

    /**
     * GNews returns errors as {"errors": ["..."]}. Surface the first
     * upstream message when present; fall back to a status-specific
     * sentence so logs are scannable.
     */
    private function describeGnewsError(mixed $body, int $status): string
    {
        if (is_array($body) && isset($body['errors']) && is_array($body['errors'])) {
            $first = $body['errors'][0] ?? null;
            if (is_string($first) && $first !== '') {
                return $first;
            }
        }

        return match ($status) {
            401 => 'News provider rejected the API key.',
            403 => 'News provider daily quota exceeded.',
            429 => 'Too many requests to the news provider.',
            default => 'News provider returned an error.',
        };
    }

    /** @param  array<string, mixed>  $params */
    private function cacheKey(string $endpoint, array $params): string
    {
        ksort($params);

        return 'news:'.$endpoint.':'.md5((string) json_encode($params));
    }
}
