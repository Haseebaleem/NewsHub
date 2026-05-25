<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Preference;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = User::create([
                'name' => $request->string('name')->toString(),
                'email' => $request->string('email')->lower()->toString(),
                'password' => $request->string('password')->toString(),
            ]);

            $user->preference()->create(Preference::DEFAULTS);

            return $user;
        });

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user->only(['id', 'name', 'email', 'created_at']),
                'token' => $token,
            ],
            'message' => 'Account created.',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $email = $request->string('email')->lower()->toString();
        $user = User::where('email', $email)->first();

        if ($user === null || ! Hash::check($request->string('password')->toString(), $user->password)) {
            return response()->json([
                'error' => 'invalid_credentials',
                'message' => 'These credentials do not match our records.',
            ], 401);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user->only(['id', 'name', 'email', 'created_at']),
                'token' => $token,
            ],
            'message' => 'Logged in.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $user->only(['id', 'name', 'email', 'created_at']),
            'message' => 'Authenticated user.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken $token */
        $token = $request->user()->currentAccessToken();
        $token->delete();

        return response()->json([
            'data' => null,
            'message' => 'Logged out.',
        ]);
    }
}
