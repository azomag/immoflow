<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Logement extends Model
{
    use HasFactory;

    protected $table = 'logements';

    protected $fillable = [
        'agent_id',
        'type_logement_id',
        'commune_id',
        'adresse',
        'titre',
        'description',
        'superficie',
        'loyer',
        'chambres',
        'salles_bain',
        'etage',
        'parking',
        'chauffage',
        'statut_publication',
        'images',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'parking' => 'boolean',
            'images' => 'array',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'agent_id');
    }

    public function typeLogement(): BelongsTo
    {
        return $this->belongsTo(TypeLogement::class, 'type_logement_id');
    }

    public function commune(): BelongsTo
    {
        return $this->belongsTo(Commune::class, 'commune_id');
    }

    public function contrats(): HasMany
    {
        return $this->hasMany(Contrat::class, 'logement_id');
    }
}
