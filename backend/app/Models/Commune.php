<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Commune extends Model
{
    use HasFactory;

    protected $table = 'communes';

    protected $fillable = [
        'nom',
        'nombre_habitants',
        'distance_agence',
    ];

    public function logements(): HasMany
    {
        return $this->hasMany(Logement::class, 'commune_id');
    }
}
