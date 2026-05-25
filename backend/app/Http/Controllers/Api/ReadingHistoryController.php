<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReadingHistoryRequest;
use App\Models\ReadingHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadingHistoryController extends Controller
{
    private const FEED_LIMIT = 50;

    public function index(Request $request): JsonResponse
    {
        $items = ReadingHistory::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('read_at')
            ->limit(self::FEED_LIMIT)
            ->get();

        return response()->json([
            'data' => $items,
            'message' => 'Reading history fetched.',
        ]);
    }

    public function store(StoreReadingHistoryRequest $request): JsonResponse
    {
        $entry = ReadingHistory::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'read_at' => now(),
        ]);

        return response()->json([
            'data' => $entry,
            'message' => 'Reading history recorded.',
        ], 201);
    }

    public function clear(Request $request): JsonResponse
    {
        ReadingHistory::query()
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json([
            'data' => null,
            'message' => 'Reading history cleared.',
        ]);
    }
}
