<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Logement;
use App\Models\User;
use App\Support\DashboardNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LogementController extends Controller
{
    public function publicIndex(): JsonResponse
    {
        return response()->json([
            'logements' => Logement::query()
                ->with(['agent.user', 'commune', 'typeLogement'])
                ->where('statut_publication', 'listed')
                ->latest()
                ->get(),
        ]);
    }

    public function publicShow(Logement $logement): JsonResponse
    {
        if ($logement->statut_publication !== 'listed') {
            abort(404);
        }

        return response()->json([
            'logement' => $logement->load(['agent.user', 'commune', 'typeLogement']),
        ]);
    }

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
            'titre' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'superficie' => ['required', 'numeric', 'min:0'],
            'loyer' => ['required', 'numeric', 'min:0'],
            'chambres' => ['nullable', 'integer', 'min:0'],
            'salles_bain' => ['nullable', 'integer', 'min:0'],
            'etage' => ['nullable', 'string', 'max:50'],
            'parking' => ['nullable', 'boolean'],
            'chauffage' => ['nullable', 'string', 'max:100'],
            'statut_publication' => ['nullable', 'string', 'max:50'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'string', 'max:2048'],
            'image_files' => ['nullable', 'array', 'max:10'],
            'image_files.*' => ['image', 'max:2048'],
        ], $this->imageValidationMessages());

        $agentId = $user->role === 'agent'
            ? $user->agentProfile?->id
            : ($validated['agent_id'] ?? null);

        if (! $agentId || ! Agent::query()->whereKey($agentId)->exists()) {
            return response()->json([
                'message' => 'A valid agent is required.',
            ], 422);
        }

        $requestedImageCount = $this->requestedImageCount($request, $validated['images'] ?? []);
        if ($requestedImageCount < 2 || $requestedImageCount > 10) {
            return response()->json([
                'message' => 'A property must include between 2 and 10 images.',
            ], 422);
        }

        $logement = Logement::create([
            'agent_id' => $agentId,
            'type_logement_id' => $validated['type_logement_id'],
            'commune_id' => $validated['commune_id'],
            'adresse' => $validated['adresse'],
            'titre' => $validated['titre'] ?? null,
            'description' => $validated['description'] ?? null,
            'superficie' => $validated['superficie'],
            'loyer' => $validated['loyer'],
            'chambres' => $validated['chambres'] ?? null,
            'salles_bain' => $validated['salles_bain'] ?? null,
            'etage' => $validated['etage'] ?? null,
            'parking' => $validated['parking'] ?? false,
            'chauffage' => $validated['chauffage'] ?? null,
            'statut_publication' => $validated['statut_publication'] ?? 'listed',
            'images' => $this->collectImages($request, $validated['images'] ?? []),
        ]);

        $logement->loadMissing('agent');
        $agentUserId = $logement->agent?->user_id;
        $recipients = $user->role === 'agent'
            ? DashboardNotification::adminRecipientIds()
            : [$agentUserId];
        DashboardNotification::send(
            $user,
            $recipients,
            'Property created',
            sprintf('%s created property "%s".', $user->name, $logement->adresse),
        );

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
            'titre' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'superficie' => ['required', 'numeric', 'min:0'],
            'loyer' => ['required', 'numeric', 'min:0'],
            'chambres' => ['nullable', 'integer', 'min:0'],
            'salles_bain' => ['nullable', 'integer', 'min:0'],
            'etage' => ['nullable', 'string', 'max:50'],
            'parking' => ['nullable', 'boolean'],
            'chauffage' => ['nullable', 'string', 'max:100'],
            'statut_publication' => ['nullable', 'string', 'max:50'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'string', 'max:2048'],
            'image_files' => ['nullable', 'array', 'max:10'],
            'image_files.*' => ['image', 'max:2048'],
        ], $this->imageValidationMessages());

        $agentId = $user->role === 'agent'
            ? $user->agentProfile?->id
            : ($validated['agent_id'] ?? $logement->agent_id);

        if (! $agentId || ! Agent::query()->whereKey($agentId)->exists()) {
            return response()->json([
                'message' => 'A valid agent is required.',
            ], 422);
        }

        $requestedImageCount = $this->requestedImageCount($request, $validated['images'] ?? []);
        if ($requestedImageCount < 2 || $requestedImageCount > 10) {
            return response()->json([
                'message' => 'A property must include between 2 and 10 images.',
            ], 422);
        }

        $logement->update([
            'agent_id' => $agentId,
            'type_logement_id' => $validated['type_logement_id'],
            'commune_id' => $validated['commune_id'],
            'adresse' => $validated['adresse'],
            'titre' => $validated['titre'] ?? null,
            'description' => $validated['description'] ?? null,
            'superficie' => $validated['superficie'],
            'loyer' => $validated['loyer'],
            'chambres' => $validated['chambres'] ?? null,
            'salles_bain' => $validated['salles_bain'] ?? null,
            'etage' => $validated['etage'] ?? null,
            'parking' => $validated['parking'] ?? false,
            'chauffage' => $validated['chauffage'] ?? null,
            'statut_publication' => $validated['statut_publication'] ?? 'listed',
            'images' => $this->collectImages($request, $validated['images'] ?? []),
        ]);

        $logement->loadMissing('agent');
        $agentUserId = $logement->agent?->user_id;
        $recipients = array_merge(
            [$agentUserId],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipients,
            'Property updated',
            sprintf('%s updated property "%s".', $user->name, $logement->adresse),
        );

        return response()->json([
            'message' => 'Property updated.',
            'logement' => $logement->fresh(['agent.user', 'commune', 'typeLogement']),
        ]);
    }

    public function destroy(Request $request, Logement $logement): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role === 'agent' && $logement->agent_id !== $user->agentProfile?->id) {
            return response()->json([
                'message' => 'You can only delete your own properties.',
            ], 403);
        }

        $logement->loadMissing('agent');
        $agentUserId = $logement->agent?->user_id;
        $recipients = array_merge(
            [$agentUserId],
            DashboardNotification::adminRecipientIds(),
        );
        DashboardNotification::send(
            $user,
            $recipients,
            'Property deleted',
            sprintf('%s deleted property "%s".', $user->name, $logement->adresse),
        );

        DB::transaction(function () use ($logement): void {
            $contractIds = $logement->contrats()->pluck('id');

            if ($contractIds->isNotEmpty()) {
                DB::table('paiements')
                    ->whereIn('contrat_id', $contractIds->all())
                    ->delete();
            }

            $logement->contrats()->delete();
            $logement->delete();
        });

        return response()->json([
            'message' => 'Property and all related contracts/payments deleted.',
        ]);
    }

    /**
     * @param array<int, string> $existingImages
     * @return array<int, string>
     */
    private function collectImages(Request $request, array $existingImages = []): array
    {
        $images = array_values(array_filter($existingImages));
        $uploadPath = public_path('uploads/properties');

        File::ensureDirectoryExists($uploadPath);

        foreach ($request->file('image_files', []) as $file) {
            $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
            $file->move($uploadPath, $filename);
            $images[] = url('/uploads/properties/'.$filename);
        }

        return $images;
    }

    /**
     * @return array<string, string>
     */
    private function imageValidationMessages(): array
    {
        return [
            'image_files.*.uploaded' => 'The image is too large for this server. Please choose a smaller image.',
            'image_files.max' => 'You can upload a maximum of 10 property images.',
            'image_files.*.image' => 'Only image files are allowed.',
            'image_files.*.max' => 'Each image must be 2 MB or less.',
        ];
    }

    /**
     * @param array<int, string> $existingImages
     */
    private function requestedImageCount(Request $request, array $existingImages): int
    {
        $manualImages = array_values(array_filter($existingImages, fn ($image) => is_string($image) && trim($image) !== ''));
        $uploadedImages = $request->file('image_files', []);

        return count($manualImages) + count($uploadedImages);
    }

}
