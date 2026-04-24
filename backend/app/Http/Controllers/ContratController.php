<?php

namespace App\Http\Controllers;

use App\Models\Contrat;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContratController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Contrat::query()->with(['logement', 'locataire.user', 'agent.user', 'paiements']);

        if ($user->role === 'agent') {
            $query->where('agent_id', $user->agentProfile?->id);
        }

        if ($user->role === 'locataire') {
            $query->where('locataire_id', $user->locataireProfile?->id);
        }

        return response()->json([
            'contrats' => $query->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->agentProfile) {
            return response()->json([
                'message' => 'Only agents can create contracts.',
            ], 403);
        }

        $validated = $request->validate([
            'locataire_id' => ['required', 'integer', 'exists:locataires,id'],
            'logement_id' => ['required', 'integer', 'exists:logements,id'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'montant' => ['required', 'numeric', 'min:0'],
            'statut' => ['required', 'string', 'max:50'],
        ]);

        $contrat = Contrat::create([
            'locataire_id' => $validated['locataire_id'],
            'agent_id' => $user->agentProfile->id,
            'logement_id' => $validated['logement_id'],
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin'] ?? null,
            'montant' => $validated['montant'],
            'statut' => $validated['statut'],
            'signature_status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Contract created.',
            'contrat' => $contrat->load(['logement', 'locataire.user', 'agent.user']),
        ], 201);
    }

    public function sign(Request $request, Contrat $contrat): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->locataireProfile?->id !== $contrat->locataire_id) {
            return response()->json([
                'message' => 'You can only sign your own contracts.',
            ], 403);
        }

        $contrat->update([
            'signature_status' => 'signed',
            'signed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Contract signed.',
            'contrat' => $contrat->fresh(['logement', 'agent.user', 'locataire.user']),
        ]);
    }
}
