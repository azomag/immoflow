<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->string('rib')->nullable()->after('mode');
            $table->string('reference')->nullable()->after('rib');
            $table->text('cash_note')->nullable()->after('reference');
            $table->timestamp('approved_by_tenant_at')->nullable()->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn([
                'rib',
                'reference',
                'cash_note',
                'approved_by_tenant_at',
            ]);
        });
    }
};
