<?php

namespace App\Http\Controllers;

use App\Models\Contrat;
use App\Models\Logement;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load(['agentProfile', 'locataireProfile']);

        $payload = match ($user->role) {
            'super_admin', 'admin' => $this->buildAdminSummary($user),
            'agent' => $this->buildAgentSummary($user),
            default => $this->buildLocataireSummary($user),
        };

        return response()->json($payload);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAdminSummary(User $user): array
    {
        $visibleRoles = $user->role === 'super_admin'
            ? ['admin', 'agent', 'locataire']
            : ['agent', 'locataire'];

        return [
            'metrics' => [
                ['label' => 'Active Users', 'value' => User::query()->whereIn('role', $visibleRoles)->where('status', 'active')->count()],
                ['label' => 'Pending Approvals', 'value' => User::query()->whereIn('role', $visibleRoles)->where('status', 'pending')->count()],
                ['label' => 'Properties', 'value' => Logement::query()->count()],
                ['label' => 'Open Contracts', 'value' => Contrat::query()->where('statut', 'active')->count()],
            ],
            'recent_users' => User::query()
                ->select(['id', 'name', 'email', 'role', 'status', 'created_at'])
                ->whereIn('role', $visibleRoles)
                ->latest()
                ->limit(8)
                ->get(),
            'recent_contracts' => Contrat::query()
                ->with(['logement', 'locataire.user', 'agent.user'])
                ->latest()
                ->limit(6)
                ->get(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAgentSummary(User $user): array
    {
        $agentId = $user->agentProfile?->id;

        return [
            'metrics' => [
                ['label' => 'My Properties', 'value' => Logement::query()->where('agent_id', $agentId)->count()],
                ['label' => 'My Contracts', 'value' => Contrat::query()->where('agent_id', $agentId)->count()],
                ['label' => 'Pending Signatures', 'value' => Contrat::query()->where('agent_id', $agentId)->where('signature_status', 'pending')->count()],
                ['label' => 'Pending Payments', 'value' => Paiement::query()->whereHas('contrat', fn ($query) => $query->where('agent_id', $agentId))->where('statut', 'pending')->count()],
            ],
            'properties' => Logement::query()
                ->with(['commune', 'typeLogement'])
                ->where('agent_id', $agentId)
                ->latest()
                ->limit(6)
                ->get(),
            'contracts' => Contrat::query()
                ->with(['logement', 'locataire.user'])
                ->where('agent_id', $agentId)
                ->latest()
                ->limit(6)
                ->get(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildLocataireSummary(User $user): array
    {
        $locataireId = $user->locataireProfile?->id;

        return [
            'metrics' => [
                ['label' => 'Available Properties', 'value' => Logement::query()->count()],
                ['label' => 'My Contracts', 'value' => Contrat::query()->where('locataire_id', $locataireId)->count()],
                ['label' => 'Unsigned Contracts', 'value' => Contrat::query()->where('locataire_id', $locataireId)->where('signature_status', 'pending')->count()],
                ['label' => 'Pending Payments', 'value' => Paiement::query()->whereHas('contrat', fn ($query) => $query->where('locataire_id', $locataireId))->where('statut', 'pending')->count()],
            ],
            'available_properties' => Logement::query()
                ->with(['commune', 'typeLogement', 'agent.user'])
                ->latest()
                ->limit(8)
                ->get(),
            'contracts' => Contrat::query()
                ->with(['logement', 'agent.user', 'paiements'])
                ->where('locataire_id', $locataireId)
                ->latest()
                ->limit(6)
                ->get(),
        ];
    }
}
