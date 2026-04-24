<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Paiement::query()->with(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']);

        if ($user->role === 'agent') {
            $query->whereHas('contrat', fn ($builder) => $builder->where('agent_id', $user->agentProfile?->id));
        }

        if ($user->role === 'locataire') {
            $query->whereHas('contrat', fn ($builder) => $builder->where('locataire_id', $user->locataireProfile?->id));
        }

        return response()->json([
            'paiements' => $query->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! in_array($user->role, ['agent', 'admin', 'super_admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to create payments.',
            ], 403);
        }

        $validated = $request->validate([
            'contrat_id' => ['required', 'integer', 'exists:contrats,id'],
            'montant' => ['required', 'numeric', 'min:0'],
            'date_paiement' => ['required', 'date'],
            'mode' => ['required', 'string', 'max:50'],
            'statut' => ['required', 'string', 'max:50'],
        ]);

        $paiement = Paiement::create($validated);

        return response()->json([
            'message' => 'Payment recorded.',
            'paiement' => $paiement->load(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']),
        ], 201);
    }

    public function updateStatus(Request $request, Paiement $paiement): JsonResponse
    {
        $validated = $request->validate([
            'statut' => ['required', 'string', 'max:50'],
        ]);

        $paiement->update([
            'statut' => $validated['statut'],
        ]);

        return response()->json([
            'message' => 'Payment status updated.',
            'paiement' => $paiement->fresh(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']),
        ]);
    }
}
