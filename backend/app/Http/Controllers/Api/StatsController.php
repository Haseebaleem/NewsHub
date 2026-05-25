<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use App\Models\ReadingHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $now = Carbon::now();

        $weekStart = $now->copy()->startOfWeek();
        $monthStart = $now->copy()->startOfMonth();

        $articlesReadThisWeek = ReadingHistory::query()
            ->where('user_id', $userId)
            ->where('read_at', '>=', $weekStart)
            ->count();

        $articlesReadThisMonth = ReadingHistory::query()
            ->where('user_id', $userId)
            ->where('read_at', '>=', $monthStart)
            ->count();

        $topCategoryRow = ReadingHistory::query()
            ->where('user_id', $userId)
            ->where('read_at', '>=', $monthStart)
            ->select('category', DB::raw('COUNT(*) as reads'))
            ->groupBy('category')
            ->orderByDesc('reads')
            ->first();

        $bookmarkCount = Bookmark::query()
            ->where('user_id', $userId)
            ->count();

        return response()->json([
            'data' => [
                'articles_read_this_week' => $articlesReadThisWeek,
                'articles_read_this_month' => $articlesReadThisMonth,
                'top_category' => $topCategoryRow?->category,
                'bookmark_count' => $bookmarkCount,
            ],
            'message' => 'Stats fetched.',
        ]);
    }
}
