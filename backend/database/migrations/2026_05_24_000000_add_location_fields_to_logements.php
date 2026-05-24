<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('logements', function (Blueprint $table) {
            if (! Schema::hasColumn('logements', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('adresse');
            }

            if (! Schema::hasColumn('logements', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }

            if (! Schema::hasColumn('logements', 'city')) {
                $table->string('city')->nullable()->after('longitude');
            }

            if (! Schema::hasColumn('logements', 'country')) {
                $table->string('country')->nullable()->after('city');
            }
        });
    }

    public function down(): void
    {
        Schema::table('logements', function (Blueprint $table) {
            foreach (['country', 'city', 'longitude', 'latitude'] as $column) {
                if (Schema::hasColumn('logements', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
