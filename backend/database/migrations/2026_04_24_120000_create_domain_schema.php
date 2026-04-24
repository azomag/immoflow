<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('communes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->unsignedInteger('nombre_habitants');
            $table->decimal('distance_agence', 8, 2);
            $table->timestamps();
        });

        Schema::create('type_logements', function (Blueprint $table) {
            $table->id();
            $table->string('nom_type');
            $table->decimal('charge_forfaitaires', 10, 2);
            $table->date('date')->nullable();
            $table->timestamps();
        });

        Schema::create('locataires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->date('date_naissance')->nullable();
            $table->string('adresse')->nullable();
            $table->timestamps();
        });

        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->string('code_agent')->unique();
            $table->timestamps();
        });

        Schema::create('administrateurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->string('niveau_acces');
            $table->timestamps();
        });

        Schema::create('logements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')
                ->constrained('agents')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('type_logement_id')
                ->constrained('type_logements')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('commune_id')
                ->constrained('communes')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->string('adresse');
            $table->decimal('superficie', 8, 2);
            $table->decimal('loyer', 10, 2);
            $table->timestamps();
        });

        Schema::create('contrats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('locataire_id')
                ->constrained('locataires')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('agent_id')
                ->constrained('agents')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('logement_id')
                ->constrained('logements')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->decimal('montant', 10, 2);
            $table->string('statut');
            $table->string('signature_status')->default('pending');
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contrat_id')
                ->constrained('contrats')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->decimal('montant', 10, 2);
            $table->date('date_paiement');
            $table->string('mode');
            $table->string('statut');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
        Schema::dropIfExists('contrats');
        Schema::dropIfExists('logements');
        Schema::dropIfExists('administrateurs');
        Schema::dropIfExists('agents');
        Schema::dropIfExists('locataires');
        Schema::dropIfExists('type_logements');
        Schema::dropIfExists('communes');
    }
};
