<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePreferencesRequest;
use App\Models\Preference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $preference = $this->resolveForUser($request->user()->id);

        return response()->json([
            'data' => $this->present($preference),
            'message' => 'Preferences fetched.',
        ]);
    }

    public function update(UpdatePreferencesRequest $request): JsonResponse
    {
        $preference = $this->resolveForUser($request->user()->id);
        $preference->fill($request->validated())->save();

        return response()->json([
            'data' => $this->present($preference),
            'message' => 'Preferences updated.',
        ]);
    }

    private function resolveForUser(int $userId): Preference
    {
        return Preference::firstOrCreate(
            ['user_id' => $userId],
            Preference::DEFAULTS,
        );
    }

    /** @return array<string, mixed> */
    private function present(Preference $preference): array
    {
        return [
            'default_country' => $preference->default_country,
            'default_categories' => $preference->default_categories,
            'theme' => $preference->theme,
        ];
    }
}
