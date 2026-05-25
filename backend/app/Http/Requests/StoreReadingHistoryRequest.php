<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Preference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReadingHistoryRequest extends FormRequest
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
            'article_url' => ['required', 'string', 'url:http,https', 'max:2048'],
            'source' => ['required', 'string', 'max:200'],
            'category' => ['required', 'string', Rule::in(Preference::VALID_CATEGORIES)],
        ];
    }
}
