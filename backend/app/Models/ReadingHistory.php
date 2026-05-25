<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingHistory extends Model
{
    /** @use HasFactory<\Database\Factories\ReadingHistoryFactory> */
    use HasFactory;

    protected $table = 'reading_history';

    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'title',
        'article_url',
        'source',
        'category',
        'read_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
