<?php

declare(strict_types=1);

namespace App\Http\Requests\News;

use App\Models\Preference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TopHeadlinesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'country' => ['sometimes', 'string', 'size:2', Rule::in(Preference::VALID_COUNTRIES)],
            'category' => ['sometimes', 'string', Rule::in(Preference::VALID_CATEGORIES)],
            'page' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ];
    }
}
