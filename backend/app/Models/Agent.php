<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agent extends Model
{
    use HasFactory;

    protected $table = 'agents';

    protected $fillable = [
        'user_id',
        'code_agent',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function logements(): HasMany
    {
        return $this->hasMany(Logement::class, 'agent_id');
    }

    public function contrats(): HasMany
    {
        return $this->hasMany(Contrat::class, 'agent_id');
    }
}
