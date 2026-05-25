<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Preference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookmarkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:2000'],
            'article_url' => ['required', 'string', 'url:http,https', 'max:2048'],
            'image_url' => ['nullable', 'string', 'url:http,https', 'max:2048'],
            'source' => ['required', 'string', 'max:200'],
            'author' => ['nullable', 'string', 'max:200'],
            'published_at' => ['nullable', 'date'],
            'category' => ['required', 'string', Rule::in(Preference::VALID_CATEGORIES)],
        ];
    }
}
