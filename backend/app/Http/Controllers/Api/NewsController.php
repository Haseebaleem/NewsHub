<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\News\SearchNewsRequest;
use App\Http\Requests\News\TopHeadlinesRequest;
use App\Services\NewsService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class NewsController extends Controller
{
    public function __construct(private readonly NewsService $client)
    {
    }

    public function topHeadlines(TopHeadlinesRequest $request): JsonResponse
    {
        $params = [
            'country' => $request->string('country', 'in')->toString(),
            'category' => $request->string('category', 'general')->toString(),
            'page' => (int) $request->integer('page', 1),
        ];

        return $this->safeFetch(fn () => $this->client->topHeadlines($params), 'Top headlines fetched.');
    }

    public function search(SearchNewsRequest $request): JsonResponse
    {
        $params = [
            'q' => $request->string('q')->toString(),
            'page' => (int) $request->integer('page', 1),
            'sortBy' => 'publishedAt',
            'language' => 'en',
        ];

        return $this->safeFetch(fn () => $this->client->search($params), 'Search results fetched.');
    }

    /** @param  callable(): array<string, mixed>  $fetcher */
    private function safeFetch(callable $fetcher, string $message): JsonResponse
    {
        try {
            $payload = $fetcher();
        } catch (RuntimeException $e) {
            $status = $e->getCode() >= 400 && $e->getCode() < 600 ? (int) $e->getCode() : 502;

            return response()->json([
                'error' => 'news_provider_error',
                'message' => $e->getMessage(),
            ], $status);
        }

        return response()->json([
            'data' => [
                'total_results' => $payload['totalResults'] ?? 0,
                'articles' => $payload['articles'] ?? [],
            ],
            'message' => $message,
        ]);
    }
}
