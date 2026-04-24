<?php

namespace App\Http\Controllers;

use App\Models\TypeLogement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TypeLogementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'types' => TypeLogement::query()->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom_type' => ['required', 'string', 'max:255'],
            'charge_forfaitaires' => ['required', 'numeric', 'min:0'],
            'date' => ['nullable', 'date'],
        ]);

        $type = TypeLogement::create($validated);

        return response()->json([
            'message' => 'Housing type created.',
            'type' => $type,
        ], 201);
    }
}
