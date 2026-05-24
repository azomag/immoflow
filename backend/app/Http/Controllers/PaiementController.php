<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use App\Models\User;
use App\Support\DashboardNotification;
use Illuminate\Validation\Rule;
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
            'rib' => ['nullable', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:120'],
            'cash_note' => ['nullable', 'string', 'max:1000'],
            'statut' => ['nullable', 'string', 'max:50'],
        ]);

        $mode = strtolower($validated['mode']);
        $validated['statut'] = in_array($mode, ['virement', 'bank transfer', 'cash'], true)
            ? 'awaiting_tenant_approval'
            : ($validated['statut'] ?? 'pending');

        $paiement = Paiement::create($validated);
        $paiement->loadMissing(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']);

        $recipientIds = array_merge(
            [$paiement->contrat?->locataire?->user?->id, $paiement->contrat?->agent?->user?->id],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipientIds,
            'Payment recorded',
            sprintf('%s recorded %s MAD for %s.', $user->name, $paiement->montant, $paiement->contrat?->logement?->adresse ?? 'property'),
        );

        return response()->json([
            'message' => 'Payment recorded.',
            'paiement' => $paiement->load(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']),
        ], 201);
    }

    public function updateStatus(Request $request, Paiement $paiement): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'statut' => ['required', 'string', 'max:50', Rule::in(['pending', 'partial', 'cancelled', 'rejected'])],
        ]);

        $paiement->update([
            'statut' => $validated['statut'],
        ]);
        $paiement->loadMissing(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']);

        $recipientIds = array_merge(
            [$paiement->contrat?->locataire?->user?->id, $paiement->contrat?->agent?->user?->id],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipientIds,
            'Payment status updated',
            sprintf('%s changed payment #%d status to %s.', $user->name, $paiement->id, $validated['statut']),
        );

        return response()->json([
            'message' => 'Payment status updated.',
            'paiement' => $paiement->fresh(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']),
        ]);
    }

    public function destroy(Request $request, Paiement $paiement): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! in_array($user->role, ['agent', 'admin', 'super_admin'], true)) {
            return response()->json([
                'message' => 'You are not allowed to delete payments.',
            ], 403);
        }

        $paiement->loadMissing(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']);

        if ($user->role === 'agent' && $paiement->contrat?->agent_id !== $user->agentProfile?->id) {
            return response()->json([
                'message' => 'You can only delete payments for your own contracts.',
            ], 403);
        }

        $recipientIds = array_merge(
            [$paiement->contrat?->locataire?->user?->id, $paiement->contrat?->agent?->user?->id],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipientIds,
            'Payment deleted',
            sprintf('%s deleted payment #%d for %s.', $user->name, $paiement->id, $paiement->contrat?->logement?->adresse ?? 'property'),
        );

        $paiement->delete();

        return response()->json([
            'message' => 'Payment deleted.',
        ]);
    }

    public function approve(Request $request, Paiement $paiement): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $paiement->load('contrat');

        if ($user->locataireProfile?->id !== $paiement->contrat->locataire_id) {
            return response()->json([
                'message' => 'You can only approve your own payment confirmations.',
            ], 403);
        }

        $paiement->update([
            'statut' => 'paid',
            'approved_by_tenant_at' => now(),
        ]);
        $paiement->loadMissing(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']);

        $recipientIds = array_merge(
            [$paiement->contrat?->agent?->user?->id],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipientIds,
            'Payment approved',
            sprintf('%s approved payment #%d for %s.', $user->name, $paiement->id, $paiement->contrat?->logement?->adresse ?? 'property'),
        );

        return response()->json([
            'message' => 'Payment approved.',
            'paiement' => $paiement->fresh(['contrat.logement', 'contrat.locataire.user', 'contrat.agent.user']),
        ]);
    }
}
