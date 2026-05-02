<?php

namespace App\Models;

use App\Support\RolePermissions;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'nom',
        'prenom',
        'login',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'google_id',
        'avatar_url',
        'managed_by_id',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
        ];
    }

    public function managedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'managed_by_id');
    }

    public function managedUsers(): HasMany
    {
        return $this->hasMany(self::class, 'managed_by_id');
    }

    public function agentProfile(): HasOne
    {
        return $this->hasOne(Agent::class, 'user_id');
    }

    public function locataireProfile(): HasOne
    {
        return $this->hasOne(Locataire::class, 'user_id');
    }

    public function administrateurProfile(): HasOne
    {
        return $this->hasOne(Administrateur::class, 'user_id');
    }

    /**
     * @return array<int, string>
     */
    public function permissions(): array
    {
        return RolePermissions::for($this->role);
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public static function defaultAvatarForRole(?string $role): string
    {
        return match ($role) {
            'super_admin' => '/assets/profile/super_admin.png',
            'admin' => '/assets/profile/admin.png',
            'agent' => '/assets/profile/agent.png',
            default => '/assets/profile/user_normal.png',
        };
    }

    public function getAvatarUrlAttribute(?string $value): string
    {
        $avatar = is_string($value) ? trim($value) : '';

        if ($avatar !== '') {
            return $avatar;
        }

        $role = $this->attributes['role'] ?? $this->role ?? null;

        return self::defaultAvatarForRole(is_string($role) ? $role : null);
    }
}
