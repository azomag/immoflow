<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS locataires_view');
        DB::statement('DROP VIEW IF EXISTS agents_view');
        DB::statement('DROP VIEW IF EXISTS administrateurs_view');
    }
};
