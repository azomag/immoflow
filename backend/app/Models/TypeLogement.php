<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeLogement extends Model
{
    use HasFactory;

    protected $table = 'type_logements';

    protected $fillable = [
        'nom_type',
        'charge_forfaitaires',
        'date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function logements(): HasMany
    {
        return $this->hasMany(Logement::class, 'type_logement_id');
    }
}
