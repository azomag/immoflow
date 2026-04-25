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
        Schema::table('logements', function (Blueprint $table) {
            if (! Schema::hasColumn('logements', 'titre')) {
                $table->string('titre')->nullable()->after('adresse');
            }

            if (! Schema::hasColumn('logements', 'description')) {
                $table->text('description')->nullable()->after('titre');
            }

            if (! Schema::hasColumn('logements', 'chambres')) {
                $table->unsignedSmallInteger('chambres')->nullable()->after('loyer');
            }

            if (! Schema::hasColumn('logements', 'salles_bain')) {
                $table->unsignedSmallInteger('salles_bain')->nullable()->after('chambres');
            }

            if (! Schema::hasColumn('logements', 'etage')) {
                $table->string('etage')->nullable()->after('salles_bain');
            }

            if (! Schema::hasColumn('logements', 'parking')) {
                $table->boolean('parking')->default(false)->after('etage');
            }

            if (! Schema::hasColumn('logements', 'chauffage')) {
                $table->string('chauffage')->nullable()->after('parking');
            }

            if (! Schema::hasColumn('logements', 'statut_publication')) {
                $table->string('statut_publication')->default('listed')->after('chauffage');
            }

            if (! Schema::hasColumn('logements', 'images')) {
                $table->json('images')->nullable()->after('statut_publication');
            }
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('subject');
            $table->text('message');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');

        Schema::table('logements', function (Blueprint $table) {
            foreach ([
                'images',
                'statut_publication',
                'chauffage',
                'parking',
                'etage',
                'salles_bain',
                'chambres',
                'description',
                'titre',
            ] as $column) {
                if (Schema::hasColumn('logements', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
