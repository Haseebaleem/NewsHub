<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Preference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'default_country' => ['sometimes', 'string', 'size:2', Rule::in(Preference::VALID_COUNTRIES)],
            'default_categories' => ['sometimes', 'array', 'min:1', 'max:7'],
            'default_categories.*' => ['string', Rule::in(Preference::VALID_CATEGORIES)],
            'theme' => ['sometimes', 'string', Rule::in(Preference::VALID_THEMES)],
        ];
    }
}
