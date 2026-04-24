<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'nom')) {
                $table->string('nom')->nullable()->after('name');
            }

            if (! Schema::hasColumn('users', 'prenom')) {
                $table->string('prenom')->nullable()->after('nom');
            }

            if (! Schema::hasColumn('users', 'login')) {
                $table->string('login')->nullable()->unique()->after('prenom');
            }
        });

        Schema::table('locataires', function (Blueprint $table) {
            if (! Schema::hasColumn('locataires', 'telephone')) {
                $table->string('telephone')->nullable()->after('user_id');
            }

            if (! Schema::hasColumn('locataires', 'email')) {
                $table->string('email')->nullable()->unique()->after('telephone');
            }
        });

        DB::table('users')
            ->select(['id', 'name', 'email'])
            ->orderBy('id')
            ->get()
            ->each(function (object $user): void {
                [$prenom, $nom] = $this->splitName((string) $user->name);

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'prenom' => $prenom,
                        'nom' => $nom,
                        'login' => $user->email,
                    ]);
            });

        DB::table('locataires')
            ->join('users', 'users.id', '=', 'locataires.user_id')
            ->update([
                'locataires.telephone' => DB::raw('users.phone'),
                'locataires.email' => DB::raw('users.email'),
            ]);

        DB::statement('DROP VIEW IF EXISTS locataires_view');
        DB::statement('DROP VIEW IF EXISTS agents_view');
        DB::statement('DROP VIEW IF EXISTS administrateurs_view');

        DB::statement(
            'CREATE VIEW locataires_view AS
            SELECT
                locataires.id AS locataire_id,
                locataires.user_id,
                users.nom,
                users.prenom,
                users.name,
                users.login,
                users.email,
                users.phone,
                users.role,
                users.status,
                users.password AS password_hash,
                locataires.telephone,
                locataires.email AS locataire_email,
                locataires.date_naissance,
                locataires.adresse,
                locataires.created_at,
                locataires.updated_at
            FROM locataires
            INNER JOIN users ON users.id = locataires.user_id'
        );

        DB::statement(
            'CREATE VIEW agents_view AS
            SELECT
                agents.id AS agent_id,
                agents.user_id,
                users.nom,
                users.prenom,
                users.name,
                users.login,
                users.email,
                users.phone,
                users.role,
                users.status,
                users.password AS password_hash,
                agents.code_agent,
                agents.created_at,
                agents.updated_at
            FROM agents
            INNER JOIN users ON users.id = agents.user_id'
        );

        DB::statement(
            'CREATE VIEW administrateurs_view AS
            SELECT
                administrateurs.id AS administrateur_id,
                administrateurs.user_id,
                users.nom,
                users.prenom,
                users.name,
                users.login,
                users.email,
                users.phone,
                users.role,
                users.status,
                users.password AS password_hash,
                administrateurs.niveau_acces,
                administrateurs.created_at,
                administrateurs.updated_at
            FROM administrateurs
            INNER JOIN users ON users.id = administrateurs.user_id'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS locataires_view');
        DB::statement('DROP VIEW IF EXISTS agents_view');
        DB::statement('DROP VIEW IF EXISTS administrateurs_view');

        DB::statement(
            'CREATE VIEW locataires_view AS
            SELECT
                locataires.id AS locataire_id,
                locataires.user_id,
                users.name,
                users.email,
                users.phone,
                users.role,
                users.status,
                users.password AS password_hash,
                locataires.date_naissance,
                locataires.adresse,
                locataires.created_at,
                locataires.updated_at
            FROM locataires
            INNER JOIN users ON users.id = locataires.user_id'
        );

        DB::statement(
            'CREATE VIEW agents_view AS
            SELECT
                agents.id AS agent_id,
                agents.user_id,
                users.name,
                users.email,
                users.phone,
                users.role,
                users.status,
                users.password AS password_hash,
                agents.code_agent,
                agents.created_at,
                agents.updated_at
            FROM agents
            INNER JOIN users ON users.id = agents.user_id'
        );

        DB::statement(
            'CREATE VIEW administrateurs_view AS
            SELECT
                administrateurs.id AS administrateur_id,
                administrateurs.user_id,
                users.name,
                users.email,
                users.phone,
                users.role,
                users.status,
                users.password AS password_hash,
                administrateurs.niveau_acces,
                administrateurs.created_at,
                administrateurs.updated_at
            FROM administrateurs
            INNER JOIN users ON users.id = administrateurs.user_id'
        );

        Schema::table('locataires', function (Blueprint $table) {
            if (Schema::hasColumn('locataires', 'email')) {
                $table->dropUnique(['email']);
                $table->dropColumn('email');
            }

            if (Schema::hasColumn('locataires', 'telephone')) {
                $table->dropColumn('telephone');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'login')) {
                $table->dropUnique(['login']);
                $table->dropColumn('login');
            }

            if (Schema::hasColumn('users', 'prenom')) {
                $table->dropColumn('prenom');
            }

            if (Schema::hasColumn('users', 'nom')) {
                $table->dropColumn('nom');
            }
        });
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function splitName(string $fullName): array
    {
        $fullName = trim($fullName);

        if ($fullName === '') {
            return [null, null];
        }

        $parts = preg_split('/\s+/', $fullName) ?: [];

        if (count($parts) === 1) {
            return [null, $parts[0]];
        }

        $prenom = array_shift($parts);
        $nom = implode(' ', $parts);

        return [$prenom, $nom];
    }
};
