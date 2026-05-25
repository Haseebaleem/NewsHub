<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookmarkRequest;
use App\Models\Bookmark;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    private const PAGE_SIZE = 20;

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', self::PAGE_SIZE);
        $perPage = max(1, min($perPage, 50));

        $bookmarks = Bookmark::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'data' => $bookmarks->items(),
            'meta' => [
                'current_page' => $bookmarks->currentPage(),
                'last_page' => $bookmarks->lastPage(),
                'per_page' => $bookmarks->perPage(),
                'total' => $bookmarks->total(),
            ],
            'message' => 'Bookmarks fetched.',
        ]);
    }

    public function store(StoreBookmarkRequest $request): JsonResponse
    {
        try {
            $bookmark = Bookmark::create([
                ...$request->validated(),
                'user_id' => $request->user()->id,
            ]);
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return response()->json([
                    'error' => 'duplicate_bookmark',
                    'message' => 'This article is already bookmarked.',
                ], 409);
            }

            throw $e;
        }

        return response()->json([
            'data' => $bookmark,
            'message' => 'Bookmark saved.',
        ], 201);
    }

    public function destroy(Request $request, Bookmark $bookmark): JsonResponse
    {
        if ($bookmark->user_id !== $request->user()->id) {
            return response()->json([
                'error' => 'not_found',
                'message' => 'Bookmark not found.',
            ], 404);
        }

        $bookmark->delete();

        return response()->json([
            'data' => null,
            'message' => 'Bookmark deleted.',
        ]);
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        // Postgres SQLSTATE 23505, generic SQL "23000" (MySQL/SQLite).
        return in_array((string) $e->getCode(), ['23505', '23000'], true);
    }
}
