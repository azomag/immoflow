<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Agent;
use App\Models\Locataire;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'login' => ['nullable', 'string', 'max:255', 'unique:users,login'],
            'role' => ['required', 'in:admin,agent,locataire'],
            'code_agent' => ['nullable', 'string', 'max:255', 'unique:agents,code_agent'],
            'niveau_acces' => ['nullable', 'string', 'max:255'],
            'date_naissance' => ['nullable', 'date'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'url', 'max:2048'],
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
            'status' => $this->defaultStatusFor($validated['role']),
            'avatar_url' => $request->hasFile('avatar_image')
                ? url(Storage::url($request->file('avatar_image')->store('avatars', 'public')))
                : ($validated['avatar_url'] ?? null),
            'password' => $validated['password'],
        ]);

        $this->ensureRoleProfile($user, $validated);

        return $this->authResponseFor($user, false, true, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'password' => ['required', 'string'],
        ]);

        $identifier = trim((string) ($validated['identifier'] ?? $validated['email'] ?? ''));

        $user = User::query()
            ->where('email', $identifier)
            ->orWhere('login', $identifier)
            ->first();

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email, username, or password.',
            ], 422);
        }

        return $this->authResponseFor($user, true);
    }

    public function googleSync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'google_id' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'url', 'max:2048'],
            'phone' => ['nullable', 'string', 'max:30'],
            'login' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'in:admin,agent,locataire'],
        ]);

        [$prenom, $nom] = $this->splitName($validated['name']);

        $user = User::query()
            ->where('email', $validated['email'])
            ->orWhere('google_id', $validated['google_id'])
            ->first();

        if (! $user && empty($validated['role'])) {
            return response()->json([
                'message' => 'Choose a role to finish the first Google signup.',
            ], 422);
        }

        if (! $user) {
            $user = User::create([
                'name' => $validated['name'],
                'nom' => $nom,
                'prenom' => $prenom,
                'login' => $validated['login'] ?? $validated['email'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'role' => $validated['role'],
                'status' => $this->defaultStatusFor($validated['role']),
                'google_id' => $validated['google_id'],
                'avatar_url' => $validated['avatar_url'] ?? null,
                'email_verified_at' => now(),
            ]);
        } else {
            $user->fill([
                'name' => $validated['name'],
                'nom' => $nom,
                'prenom' => $prenom,
                'login' => $user->login ?? ($validated['login'] ?? $validated['email']),
                'phone' => $validated['phone'] ?? $user->phone,
                'google_id' => $validated['google_id'],
                'avatar_url' => $validated['avatar_url'] ?? $user->avatar_url,
            ]);

            if (! $user->email_verified_at) {
                $user->email_verified_at = now();
            }

            $user->save();
        }

        $this->ensureRoleProfile($user, $validated);

        return $this->authResponseFor($user, true, true);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => $this->serializeUser($user->fresh(['agentProfile', 'locataireProfile', 'administrateurProfile'])),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function defaultStatusFor(string $role): string
    {
        return match ($role) {
            'locataire' => 'active',
            default => 'pending',
        };
    }

    private function authResponseFor(
        User $user,
        bool $recordLogin = false,
        bool $allowInactive = false,
        int $successStatus = 200
    ): JsonResponse
    {
        $user = $user->fresh(['agentProfile', 'locataireProfile', 'administrateurProfile']);

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        if ($user->status !== 'active') {
            $payload = [
                'message' => $user->status === 'pending'
                    ? 'Your account is awaiting approval.'
                    : 'Your account is suspended.',
                'token' => null,
                'user' => $this->serializeUser($user),
            ];

            if ($allowInactive) {
                return response()->json($payload, $successStatus);
            }

            return response()->json([
                ...$payload,
            ], 403);
        }

        if ($recordLogin) {
            $user->forceFill([
                'last_login_at' => now(),
            ])->save();
        }

        return response()->json([
            'message' => 'Authenticated successfully.',
            'token' => $user->createToken('frontend')->plainTextToken,
            'user' => $this->serializeUser($user),
        ], $successStatus);
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

        if (in_array($user->role, ['admin', 'super_admin'], true)) {
            Administrateur::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'niveau_acces' => $profileData['niveau_acces']
                        ?? ($user->role === 'super_admin' ? 'super' : 'admin'),
                ]
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'login' => $user->login,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => $user->status,
            'avatar_url' => $user->avatar_url,
            'permissions' => $user->permissions(),
            'last_login_at' => optional($user->last_login_at)?->toIso8601String(),
            'profiles' => [
                'agent' => $user->agentProfile,
                'locataire' => $user->locataireProfile,
                'administrateur' => $user->administrateurProfile,
            ],
        ];
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function splitName(string $fullName): array
    {
        $fullName = trim($fullName);

        if ($fullName === '') {
            return [null, null];
        }

        $parts = preg_split('/\s+/', $fullName) ?: [];

        if (count($parts) === 1) {
            return [null, $parts[0]];
        }

        $prenom = array_shift($parts);
        $nom = implode(' ', $parts);

        return [$prenom, $nom];
    }
}
