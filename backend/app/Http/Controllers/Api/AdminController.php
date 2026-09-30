<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{User, Voyage, Reservation, Paiement, Avis, TicketSupport};
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * Main dashboard KPIs
     */
    public function dashboard(): JsonResponse
    {
        $stats = [
            'total_users'       => User::where('role', 'client')->count(),
            'total_voyages'     => Voyage::actif()->count(),
            'total_reservations' => Reservation::count(),
            'total_revenu'      => Paiement::where('statut', 'reussi')->sum('montant'),
            'reservations_mois' => Reservation::whereMonth('created_at', now()->month)->count(),
            'revenu_mois'       => Paiement::where('statut', 'reussi')->whereMonth('date_paiement', now()->month)->sum('montant'),
            'tickets_ouverts'   => TicketSupport::ouvert()->count(),
            'nouveaux_avis'     => Avis::where('approuve', false)->count(),
        ];

        // Revenue by day (last 30 days)
        $revenuMensuel = Paiement::where('statut', 'reussi')
            ->selectRaw('DATE_FORMAT(date_paiement, "%Y-%m-%d") as jour, SUM(montant) as total, COUNT(*) as nb')
            ->where('date_paiement', '>=', now()->subDays(30))
            ->groupBy('jour')
            ->orderBy('jour')
            ->get();

        // Reservations by status
        $reservationsStatut = Reservation::selectRaw('statut, COUNT(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        // Top voyages
        $topVoyages = Voyage::withCount('reservations')
            ->orderBy('reservations_count', 'desc')
            ->limit(5)
            ->get(['id', 'titre', 'destination', 'prix', 'image', 'reservations_count']);

        // Recent activity
        $recentActivity = collect()
            ->merge(
                Reservation::with(['user', 'voyage'])->latest()->limit(5)->get()->map(fn($r) => [
                    'type'    => 'reservation',
                    'message' => "{$r->user?->full_name} a réservé {$r->voyage?->titre}",
                    'time'    => $r->created_at->diffForHumans(),
                    'icon'    => 'calendar',
                ])
            )
            ->merge(
                User::latest()->limit(3)->get()->map(fn($u) => [
                    'type'    => 'user',
                    'message' => "Nouveau client: {$u->full_name}",
                    'time'    => $u->created_at->diffForHumans(),
                    'icon'    => 'user',
                ])
            )
            ->sortByDesc('time')
            ->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'stats'               => $stats,
                'revenu_mensuel'      => $revenuMensuel,
                'reservations_statut' => $reservationsStatut,
                'top_voyages'         => $topVoyages->map(fn($v) => [
                    'id'          => $v->id,
                    'titre'       => $v->titre,
                    'destination' => $v->destination,
                    'image'       => $v->image ? asset('storage/' . $v->image) : null,
                    'reservations' => $v->reservations_count,
                ]),
                'recent_activity' => $recentActivity,
            ],
        ]);
    }

    /**
     * User management
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::query();
        if ($request->has('role'))   $query->byRole($request->role);
        if ($request->has('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('nom', 'like', "%$s%")->orWhere('email', 'like', "%$s%")->orWhere('prenom', 'like', "%$s%"));
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data'    => $users->map(fn($u) => [
                'id'        => $u->id,
                'nom'       => $u->nom,
                'prenom'    => $u->prenom,
                'full_name' => $u->full_name,
                'email'     => $u->email,
                'role'      => $u->role,
                'status'    => $u->status,
                'telephone' => $u->telephone,
                'avatar'    => $u->avatar ? asset('storage/' . $u->avatar) : null,
                'created_at' => $u->created_at->format('d/m/Y'),
            ]),
            'meta' => ['total' => $users->total()],
        ]);
    }

    /**
     * Toggle user status
     */
    public function toggleUserStatus(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->status = $user->status === 'actif' ? 'suspendu' : 'actif';
        $user->save();
        return response()->json(['success' => true, 'message' => "Statut mis à jour : {$user->status}", 'status' => $user->status]);
    }

    public function createUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'       => 'required|string|max:100',
            'prenom'    => 'required|string|max:100',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:8',
            'telephone' => 'nullable|string|max:20',
            'adresse'   => 'nullable|string',
            'role'      => 'required|in:client,admin,fournisseur,support',
            'status'    => 'required|in:actif,inactif,suspendu',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'nom'       => $request->nom,
            'prenom'    => $request->prenom,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'telephone' => $request->telephone,
            'adresse'   => $request->adresse,
            'role'      => $request->role,
            'status'    => $request->status,
        ]);

        return response()->json(['success' => true, 'message' => 'Utilisateur créé avec succès.', 'data' => [
            'id' => $user->id,
            'nom' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'telephone' => $user->telephone,
            'created_at' => $user->created_at->format('d/m/Y'),
        ]], 201);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'nom'       => 'sometimes|required|string|max:100',
            'prenom'    => 'sometimes|required|string|max:100',
            'email'     => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password'  => 'nullable|string|min:8',
            'telephone' => 'nullable|string|max:20',
            'adresse'   => 'nullable|string',
            'role'      => 'sometimes|required|in:client,admin,fournisseur,support',
            'status'    => 'sometimes|required|in:actif,inactif,suspendu',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user->fill($request->only(['nom', 'prenom', 'email', 'telephone', 'adresse', 'role', 'status']));
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        return response()->json(['success' => true, 'message' => 'Utilisateur mis à jour.', 'data' => [
            'id' => $user->id,
            'nom' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'telephone' => $user->telephone,
            'created_at' => $user->created_at->format('d/m/Y'),
        ]]);
    }

    public function deleteUser(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->reservations()->exists() || $user->avis()->exists() || $user->tickets()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Suppression impossible : cet utilisateur possède des réservations, avis ou tickets.',
            ], 400);
        }

        $user->delete();
        return response()->json(['success' => true, 'message' => 'Utilisateur supprimé.']);
    }

    /**
     * Analytics
     */
    public function analytics(Request $request): JsonResponse
    {
        $periode = $request->get('periode', '30');

        $startDate = now()->subDays($periode);

        $data = [
            'reservations_par_jour' => Reservation::selectRaw('DATE(created_at) as date, COUNT(*) as total')
                ->where('created_at', '>=', $startDate)
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
            'revenus_par_jour' => Paiement::where('statut', 'reussi')
                ->selectRaw('DATE(date_paiement) as date, SUM(montant) as total')
                ->where('date_paiement', '>=', $startDate)
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
            'voyages_populaires' => Voyage::withCount('reservations')
                ->orderBy('reservations_count', 'desc')
                ->limit(10)
                ->get(['id', 'titre', 'destination', 'categorie']),
            'categories' => Reservation::join('voyages', 'reservations.voyage_id', '=', 'voyages.id')
                ->selectRaw('voyages.categorie, COUNT(*) as total')
                ->groupBy('voyages.categorie')
                ->get(),
            'taux_annulation' => [
                'confirmees' => Reservation::confirmee()->count(),
                'annulees'   => Reservation::byStatut('annulee')->count(),
                'en_attente' => Reservation::enAttente()->count(),
            ],
        ];

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Approve/Reject avis
     */
    public function approveAvis(int $id): JsonResponse
    {
        $avis = Avis::findOrFail($id);
        $avis->update(['approuve' => !$avis->approuve]);
        return response()->json(['success' => true, 'message' => $avis->approuve ? 'Avis approuvé.' : 'Avis masqué.']);
    }
}
