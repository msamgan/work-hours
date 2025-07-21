<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class StoreProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'team_members' => ['nullable', 'array'],
            'team_members.*' => ['exists:users,id'],
            'approvers' => ['nullable', 'array'],
            'approvers.*' => ['exists:users,id'],
            'team_members_data' => ['nullable', 'array'],
            'team_members_data.*.id' => ['required', 'exists:users,id'],
            'team_members_data.*.hourly_rate' => ['required', 'numeric', 'min:0'],
        ];
    }
}
