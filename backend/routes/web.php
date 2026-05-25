<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::get('/', static fn () => response()->json([
    'name' => config('app.name'),
    'message' => 'NewsHub API. See /api routes.',
]));
