<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Preference extends Model
{
    /** @use HasFactory<\Database\Factories\PreferenceFactory> */
    use HasFactory;

    public const VALID_COUNTRIES = [
        'in', 'us', 'gb', 'ca', 'au', 'de', 'fr', 'jp', 'ru', 'cn',
        'br', 'mx', 'it', 'es', 'nl', 'se', 'no', 'pk', 'ae', 'sg',
    ];

    public const VALID_CATEGORIES = [
        'business', 'entertainment', 'general', 'health',
        'science', 'sports', 'technology',
    ];

    public const VALID_THEMES = ['light', 'dark'];

    public const DEFAULTS = [
        'default_country' => 'in',
        'default_categories' => ['general', 'technology'],
        'theme' => 'light',
    ];

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'default_country',
        'default_categories',
        'theme',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'default_categories' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
