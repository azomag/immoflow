<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $roles = match ($actor->role) {
            'super_admin' => ['admin', 'agent', 'locataire'],
            'admin' => ['agent', 'locataire'],
            default => ['locataire'],
        };

        if ($request->filled('role') && in_array($request->string('role')->toString(), $roles, true)) {
            $roles = [$request->string('role')->toString()];
        }

        return response()->json([
            'users' => User::query()
                ->select(['id', 'name', 'email', 'phone', 'role', 'status', 'managed_by_id', 'created_at', 'last_login_at'])
                ->with(['agentProfile:id,user_id,code_agent', 'locataireProfile:id,user_id', 'administrateurProfile:id,user_id,niveau_acces'])
                ->whereIn('role', $roles)
                ->latest()
                ->get(),
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
}
