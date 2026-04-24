<?php

namespace App\Http\Controllers;

use App\Models\Commune;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommuneController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'communes' => Commune::query()->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'nombre_habitants' => ['required', 'integer', 'min:0'],
            'distance_agence' => ['required', 'numeric', 'min:0'],
        ]);

        $commune = Commune::create($validated);

        return response()->json([
            'message' => 'Commune created.',
            'commune' => $commune,
        ], 201);
    }
}
