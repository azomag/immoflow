<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Logement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Logement::query()->with(['agent.user', 'commune', 'typeLogement']);

        if ($user->role === 'agent') {
            $query->where('agent_id', $user->agentProfile?->id);
        }

        return response()->json([
            'logements' => $query->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'agent_id' => ['nullable', 'integer', 'exists:agents,id'],
            'type_logement_id' => ['required', 'integer', 'exists:type_logements,id'],
            'commune_id' => ['required', 'integer', 'exists:communes,id'],
            'adresse' => ['required', 'string', 'max:255'],
            'superficie' => ['required', 'numeric', 'min:0'],
            'loyer' => ['required', 'numeric', 'min:0'],
        ]);

        $agentId = $user->role === 'agent'
            ? $user->agentProfile?->id
            : ($validated['agent_id'] ?? null);

        if (! $agentId || ! Agent::query()->whereKey($agentId)->exists()) {
            return response()->json([
                'message' => 'A valid agent is required.',
            ], 422);
        }

        $logement = Logement::create([
            'agent_id' => $agentId,
            'type_logement_id' => $validated['type_logement_id'],
            'commune_id' => $validated['commune_id'],
            'adresse' => $validated['adresse'],
            'superficie' => $validated['superficie'],
            'loyer' => $validated['loyer'],
        ]);

        return response()->json([
            'message' => 'Property created.',
            'logement' => $logement->load(['agent.user', 'commune', 'typeLogement']),
        ], 201);
    }

    public function update(Request $request, Logement $logement): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role === 'agent' && $logement->agent_id !== $user->agentProfile?->id) {
            return response()->json([
                'message' => 'You can only update your own properties.',
            ], 403);
        }

        $validated = $request->validate([
            'agent_id' => ['nullable', 'integer', 'exists:agents,id'],
            'type_logement_id' => ['required', 'integer', 'exists:type_logements,id'],
            'commune_id' => ['required', 'integer', 'exists:communes,id'],
            'adresse' => ['required', 'string', 'max:255'],
            'superficie' => ['required', 'numeric', 'min:0'],
            'loyer' => ['required', 'numeric', 'min:0'],
        ]);

        $agentId = $user->role === 'agent'
            ? $user->agentProfile?->id
            : ($validated['agent_id'] ?? $logement->agent_id);

        if (! $agentId || ! Agent::query()->whereKey($agentId)->exists()) {
            return response()->json([
                'message' => 'A valid agent is required.',
            ], 422);
        }

        $logement->update([
            'agent_id' => $agentId,
            'type_logement_id' => $validated['type_logement_id'],
            'commune_id' => $validated['commune_id'],
            'adresse' => $validated['adresse'],
            'superficie' => $validated['superficie'],
            'loyer' => $validated['loyer'],
        ]);

        return response()->json([
            'message' => 'Property updated.',
            'logement' => $logement->fresh(['agent.user', 'commune', 'typeLogement']),
        ]);
    }

}
