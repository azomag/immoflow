<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            ['nom_type' => 'Apartment', 'charge_forfaitaires' => 300],
            ['nom_type' => 'Studio', 'charge_forfaitaires' => 180],
            ['nom_type' => 'Villa', 'charge_forfaitaires' => 700],
            ['nom_type' => 'House', 'charge_forfaitaires' => 450],
            ['nom_type' => 'Duplex', 'charge_forfaitaires' => 520],
            ['nom_type' => 'Office', 'charge_forfaitaires' => 250],
        ] as $type) {
            DB::table('type_logements')->updateOrInsert(
                ['nom_type' => $type['nom_type']],
                [
                    'charge_forfaitaires' => $type['charge_forfaitaires'],
                    'date' => now()->toDateString(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        foreach ([
            ['nom' => 'Hay Riad', 'nombre_habitants' => 85000, 'distance_agence' => 3.5],
            ['nom' => 'Agdal', 'nombre_habitants' => 110000, 'distance_agence' => 2.0],
            ['nom' => 'Souissi', 'nombre_habitants' => 42000, 'distance_agence' => 4.2],
            ['nom' => 'Temara', 'nombre_habitants' => 313000, 'distance_agence' => 12.0],
            ['nom' => 'Sale', 'nombre_habitants' => 982000, 'distance_agence' => 8.5],
            ['nom' => 'Maarif', 'nombre_habitants' => 180000, 'distance_agence' => 1.5],
        ] as $commune) {
            DB::table('communes')->updateOrInsert(
                ['nom' => $commune['nom']],
                [
                    'nombre_habitants' => $commune['nombre_habitants'],
                    'distance_agence' => $commune['distance_agence'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
        DB::table('type_logements')->whereIn('nom_type', [
            'Apartment',
            'Studio',
            'Villa',
            'House',
            'Duplex',
            'Office',
        ])->delete();

        DB::table('communes')->whereIn('nom', [
            'Hay Riad',
            'Agdal',
            'Souissi',
            'Temara',
            'Sale',
            'Maarif',
        ])->delete();
    }
};
