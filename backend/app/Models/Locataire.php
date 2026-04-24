<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Locataire extends Model
{
    use HasFactory;

    protected $table = 'locataires';

    protected $fillable = [
        'user_id',
        'telephone',
        'email',
        'date_naissance',
        'adresse',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contrats(): HasMany
    {
        return $this->hasMany(Contrat::class, 'locataire_id');
    }
}
