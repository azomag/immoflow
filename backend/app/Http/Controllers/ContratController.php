<?php

namespace App\Http\Controllers;

use App\Models\Contrat;
use App\Models\User;
use App\Support\DashboardNotification;
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

        if (! in_array($user->role, ['agent', 'admin', 'super_admin'], true)) {
            return response()->json([
                'message' => 'Only agents and administrators can create contracts.',
            ], 403);
        }

        $validated = $request->validate([
            'locataire_id' => ['required', 'integer', 'exists:locataires,id'],
            'logement_id' => ['required', 'integer', 'exists:logements,id'],
            'agent_id' => ['nullable', 'integer', 'exists:agents,id'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'montant' => ['required', 'numeric', 'min:0'],
            'statut' => ['required', 'string', 'max:50'],
        ]);

        $agentId = $user->role === 'agent'
            ? $user->agentProfile?->id
            : ($validated['agent_id'] ?? null);

        if (! $agentId) {
            return response()->json([
                'message' => 'A valid agent is required.',
            ], 422);
        }

        $contrat = Contrat::create([
            'locataire_id' => $validated['locataire_id'],
            'agent_id' => $agentId,
            'logement_id' => $validated['logement_id'],
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin'] ?? null,
            'montant' => $validated['montant'],
            'statut' => $validated['statut'],
            'signature_status' => 'pending',
        ]);

        $contrat->loadMissing(['logement', 'locataire.user', 'agent.user']);
        $recipientIds = array_merge(
            [$contrat->locataire?->user?->id, $contrat->agent?->user?->id],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipientIds,
            'Contract created',
            sprintf('%s created contract #%d for %s.', $user->name, $contrat->id, $contrat->logement?->adresse ?? 'property'),
        );

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

        $validated = $request->validate([
            'signature_data' => ['required', 'string', 'starts_with:data:image/png;base64,'],
        ]);

        $contrat->update([
            'signature_status' => 'signed',
            'signed_at' => now(),
            'signature_data' => $validated['signature_data'],
        ]);

        $contrat->loadMissing(['logement', 'locataire.user', 'agent.user']);
        $recipientIds = array_merge(
            [$contrat->agent?->user?->id],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipientIds,
            'Contract signed',
            sprintf('%s signed contract #%d for %s.', $user->name, $contrat->id, $contrat->logement?->adresse ?? 'property'),
        );

        return response()->json([
            'message' => 'Contract signed.',
            'contrat' => $contrat->fresh(['logement', 'agent.user', 'locataire.user']),
        ]);
    }

    public function update(Request $request, Contrat $contrat): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! in_array($user->role, ['agent', 'admin', 'super_admin'], true)) {
            return response()->json([
                'message' => 'Only agents and administrators can update contracts.',
            ], 403);
        }

        if ($user->role === 'agent' && $contrat->agent_id !== $user->agentProfile?->id) {
            return response()->json([
                'message' => 'You can only update your own contracts.',
            ], 403);
        }

        $validated = $request->validate([
            'locataire_id' => ['required', 'integer', 'exists:locataires,id'],
            'logement_id' => ['required', 'integer', 'exists:logements,id'],
            'agent_id' => ['nullable', 'integer', 'exists:agents,id'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'montant' => ['required', 'numeric', 'min:0'],
            'statut' => ['required', 'string', 'max:50'],
        ]);

        $agentId = $user->role === 'agent'
            ? $user->agentProfile?->id
            : ($validated['agent_id'] ?? $contrat->agent_id);

        if (! $agentId) {
            return response()->json([
                'message' => 'A valid agent is required.',
            ], 422);
        }

        $signatureShouldReset =
            $contrat->signature_status === 'signed' && (
                $contrat->locataire_id !== (int) $validated['locataire_id'] ||
                $contrat->logement_id !== (int) $validated['logement_id'] ||
                $contrat->date_debut?->toDateString() !== $validated['date_debut'] ||
                ($contrat->date_fin?->toDateString()) !== ($validated['date_fin'] ?? null) ||
                (string) $contrat->montant !== (string) $validated['montant']
            );

        $contrat->fill([
            'locataire_id' => $validated['locataire_id'],
            'agent_id' => $agentId,
            'logement_id' => $validated['logement_id'],
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin'] ?? null,
            'montant' => $validated['montant'],
            'statut' => $validated['statut'],
        ]);

        if ($signatureShouldReset) {
            $contrat->signature_status = 'pending';
            $contrat->signed_at = null;
            $contrat->signature_data = null;
        }

        $contrat->save();

        $contrat->loadMissing(['logement', 'locataire.user', 'agent.user']);
        $recipientIds = array_merge(
            [$contrat->locataire?->user?->id, $contrat->agent?->user?->id],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipientIds,
            'Contract updated',
            sprintf('%s updated contract #%d for %s.', $user->name, $contrat->id, $contrat->logement?->adresse ?? 'property'),
        );

        return response()->json([
            'message' => 'Contract updated.',
            'contrat' => $contrat->fresh(['logement', 'locataire.user', 'agent.user']),
        ]);
    }

    public function destroy(Request $request, Contrat $contrat): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! in_array($user->role, ['agent', 'admin', 'super_admin'], true)) {
            return response()->json([
                'message' => 'Only agents and administrators can delete contracts.',
            ], 403);
        }

        if ($user->role === 'agent' && $contrat->agent_id !== $user->agentProfile?->id) {
            return response()->json([
                'message' => 'You can only delete your own contracts.',
            ], 403);
        }

        if ($contrat->paiements()->exists()) {
            return response()->json([
                'message' => 'This contract already has payments. Keep it for history instead of deleting it.',
            ], 422);
        }

        $contrat->loadMissing(['logement', 'locataire.user', 'agent.user']);
        $recipientIds = array_merge(
            [$contrat->locataire?->user?->id, $contrat->agent?->user?->id],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipientIds,
            'Contract deleted',
            sprintf('%s deleted contract #%d for %s.', $user->name, $contrat->id, $contrat->logement?->adresse ?? 'property'),
        );

        $contrat->delete();

        return response()->json([
            'message' => 'Contract deleted.',
        ]);
    }
}
