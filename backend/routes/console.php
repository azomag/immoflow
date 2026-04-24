<?php

use App\Models\Administrateur;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('app:create-super-admin {name} {email} {password}', function (string $name, string $email, string $password) {
    $user = User::query()->updateOrCreate(
        ['email' => $email],
        [
            'name' => $name,
            'role' => 'super_admin',
            'status' => 'active',
            'password' => $password,
            'email_verified_at' => now(),
        ]
    );

    Administrateur::query()->updateOrCreate(
        ['user_id' => $user->id],
        ['niveau_acces' => 'super']
    );

    $this->info("Super admin ready for {$user->email}");
})->purpose('Create or update the initial super admin account');
