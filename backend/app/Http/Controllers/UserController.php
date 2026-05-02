<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Agent;
use App\Models\Locataire;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $roles = match ($actor->role) {
            'super_admin' => ['admin', 'agent', 'locataire'],
            'admin' => ['agent', 'locataire'],
            'agent' => ['admin', 'super_admin', 'locataire'],
            default => ['agent'],
        };

        if ($request->filled('role') && in_array($request->string('role')->toString(), $roles, true)) {
            $roles = [$request->string('role')->toString()];
        }

        return response()->json([
            'users' => User::query()
                ->select(['id', 'name', 'email', 'phone', 'role', 'status', 'avatar_url', 'managed_by_id', 'created_at', 'last_login_at'])
                ->with(['agentProfile:id,user_id,code_agent', 'locataireProfile:id,user_id', 'administrateurProfile:id,user_id,niveau_acces'])
                ->whereIn('role', $roles)
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $allowedRoles = $actor->role === 'super_admin'
            ? ['admin']
            : ['agent', 'locataire'];

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'login' => ['nullable', 'string', 'max:255', 'unique:users,login'],
            'role' => ['required', 'in:'.implode(',', $allowedRoles)],
            'status' => ['nullable', 'in:pending,active,suspended'],
            'code_agent' => ['nullable', 'string', 'max:255', 'unique:agents,code_agent'],
            'niveau_acces' => ['nullable', 'string', 'max:255'],
            'date_naissance' => ['nullable', 'date'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
            'avatar_image' => ['nullable', 'image', 'max:2048'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        [$prenom, $nom] = $this->splitName($validated['name']);

        $user = User::create([
            'name' => $validated['name'],
            'nom' => $nom,
            'prenom' => $prenom,
            'login' => $validated['login'] ?? $validated['email'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'status' => $validated['status'] ?? 'active',
            'avatar_url' => $request->hasFile('avatar_image')
                ? url(Storage::url($request->file('avatar_image')->store('avatars', 'public')))
                : ($validated['avatar_url'] ?? User::defaultAvatarForRole($validated['role'])),
            'managed_by_id' => $actor->id,
            'password' => $validated['password'],
        ]);

        $this->ensureRoleProfile($user, $validated);

        return response()->json([
            'message' => 'User created.',
            'user' => $user->fresh(['agentProfile', 'locataireProfile', 'administrateurProfile']),
        ], 201);
    }

    public function updateMe(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'login' => ['nullable', 'string', 'max:255', 'unique:users,login,'.$user->id],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
            'avatar_image' => ['nullable', 'image', 'max:2048'],
            'current_password' => ['nullable', 'required_with:password', 'current_password'],
            'password' => ['nullable', 'confirmed', Password::min(8)],
        ]);

        [$prenom, $nom] = $this->splitName($validated['name']);

        $user->fill([
            'name' => $validated['name'],
            'nom' => $nom,
            'prenom' => $prenom,
            'login' => $validated['login'] ?? $user->login,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'avatar_url' => $request->hasFile('avatar_image')
                ? url(Storage::url($request->file('avatar_image')->store('avatars', 'public')))
                : ($validated['avatar_url'] ?? $user->avatar_url),
        ]);

        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated.',
            'user' => $user->fresh(['agentProfile', 'locataireProfile', 'administrateurProfile']),
        ]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $validated = $request->validate([
            'status' => ['required', 'in:pending,active,suspended'],
        ]);

        if ($user->role === 'super_admin') {
            return response()->json([
                'message' => 'Super admin accounts cannot be edited here.',
            ], 403);
        }

        if ($actor->role === 'admin' && ! in_array($user->role, ['agent', 'locataire'], true)) {
            return response()->json([
                'message' => 'Admins can only manage agents and locataires.',
            ], 403);
        }

        if ($actor->role === 'super_admin' && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Super admin approval here is limited to admin accounts.',
            ], 403);
        }

        $user->update([
            'status' => $validated['status'],
            'managed_by_id' => $actor->id,
        ]);

        return response()->json([
            'message' => 'User status updated.',
            'user' => $user->only(['id', 'name', 'email', 'role', 'status', 'managed_by_id']),
        ]);
    }

    /**
     * @param array<string, mixed> $profileData
     */
    private function ensureRoleProfile(User $user, array $profileData = []): void
    {
        if ($user->role === 'agent') {
            Agent::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'code_agent' => $profileData['code_agent']
                        ?? 'AGT-'.str_pad((string) $user->id, 5, '0', STR_PAD_LEFT),
                ]
            );

            return;
        }

        if ($user->role === 'locataire') {
            Locataire::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'telephone' => $user->phone,
                    'email' => $user->email,
                    'date_naissance' => $profileData['date_naissance'] ?? null,
                    'adresse' => $profileData['adresse'] ?? null,
                ]
            );

            return;
        }

        Administrateur::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'niveau_acces' => $profileData['niveau_acces'] ?? 'admin',
            ]
        );
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName), 2);

        return [
            $parts[0] ?? null,
            $parts[1] ?? null,
        ];
    }
}
