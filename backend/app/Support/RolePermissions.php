<?php

namespace App\Support;

class RolePermissions
{
    /**
     * @var array<string, array<int, string>>
     */
    private const MAP = [
        'super_admin' => [
            'dashboard.view',
            'users.view',
            'admins.manage',
            'agents.manage',
            'locataires.manage',
            'communes.manage',
            'types.manage',
            'logements.manage',
            'contrats.manage',
            'paiements.manage',
        ],
        'admin' => [
            'dashboard.view',
            'users.view',
            'agents.manage',
            'locataires.manage',
            'communes.manage',
            'types.manage',
            'logements.manage',
            'contrats.view',
            'paiements.view',
        ],
        'agent' => [
            'dashboard.view',
            'logements.manage',
            'contrats.manage',
            'paiements.manage',
        ],
        'locataire' => [
            'dashboard.view',
            'logements.view',
            'logements.search',
            'contrats.view',
            'contrats.sign',
            'paiements.view',
        ],
    ];

    /**
     * @return array<int, string>
     */
    public static function for(?string $role): array
    {
        if (! is_string($role)) {
            return [];
        }

        return self::MAP[$role] ?? [];
    }
}
