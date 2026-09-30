<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Avis;
use App\Models\Fournisseur;
use App\Models\Reservation;
use App\Models\Voyage;
use App\Notifications\ReservationConfirmedNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FournisseurController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $fournisseurs = Fournisseur::with('user')
            ->when($request->search, fn($q, $s) => $q->where('nom', 'like', "%$s%"))
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $fournisseurs->map(fn($f) => [
                'id'        => $f->id,
                'nom'       => $f->nom,
                'email'     => $f->email,
                'telephone' => $f->telephone,
                'service'   => $f->service,
                'statut'    => $f->statut,
                'commission' => $f->commission,
                'logo'      => $f->logo ? asset('storage/' . $f->logo) : null,
            ]),
            'meta' => ['total' => $fournisseurs->total()],
        ]);
    }

    public function dashboard(): JsonResponse
    {
        $user        = Auth::user();
        $fournisseur = $user->fournisseur;

        if (!$fournisseur) {
            return response()->json(['success' => false, 'message' => 'Profil fournisseur non trouvé.'], 404);
        }

        $voyages      = Voyage::where('fournisseur_id', $fournisseur->id)->count();
        $reservations = Reservation::whereHas('voyage', fn($q) => $q->where('fournisseur_id', $fournisseur->id))->count();
        $revenu       = Reservation::whereHas('voyage', fn($q) => $q->where('fournisseur_id', $fournisseur->id))
            ->where('statut', 'confirmee')
            ->sum('montant_total');
        $moyenneNotes = Avis::whereHas('voyage', fn($q) => $q->where('fournisseur_id', $fournisseur->id))
            ->where('approuve', true)
            ->avg('note');

        return response()->json([
            'success' => true,
            'data'    => [
                'fournisseur'  => $fournisseur,
                'stats' => [
                    'voyages'      => $voyages,
                    'reservations' => $reservations,
                    'revenu'       => $revenu,
                    'moyenne_notes'=> round($moyenneNotes ?: 0, 1),
                ],
            ],
        ]);
    }

    public function myVoyages(): JsonResponse
    {
        $fournisseur = Auth::user()->fournisseur;
        if (!$fournisseur) return response()->json(['success' => false], 404);

        $voyages = Voyage::where('fournisseur_id', $fournisseur->id)->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $voyages->map(function ($v) {
                return [
                    'id' => $v->id,
                    'titre' => $v->titre,
                    'destination' => $v->destination,
                    'pays' => $v->pays,
                    'description' => $v->description,
                    'description_longue' => $v->description_longue,
                    'prix' => $v->prix,
                    'reduction' => $v->reduction,
                    'prix_final' => $v->prix_final,
                    'date_depart' => $v->date_depart?->format('Y-m-d'),
                    'date_retour' => $v->date_retour?->format('Y-m-d'),
                    'places_disponibles' => $v->places_disponibles,
                    'places_totales' => $v->places_totales,
                    'categorie' => $v->categorie,
                    'image' => $v->image ? url('/api/images/voyages/' . basename($v->image)) : null,
                    'images_gallery' => collect($v->images_gallery)->map(fn($img) => url('/api/images/voyages/' . basename($img))),
                    'is_disponible' => $v->is_disponible,
                    'nombre_avis' => $v->nombre_avis ?? 0,
                    'moyenne_notes' => $v->moyenne_notes ?? 0,
                ];
            }),
            'meta' => [
                'total' => $voyages->total(),
                'last_page' => $voyages->lastPage(),
            ],
        ]);
    }

    public function myReservations(Request $request): JsonResponse
    {
        $fournisseur = Auth::user()->fournisseur;
        if (!$fournisseur) return response()->json(['success' => false], 404);

        $query = Reservation::with(['user', 'voyage'])
            ->whereHas('voyage', fn($q) => $q->where('fournisseur_id', $fournisseur->id));

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        $reservations = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reservations->map(function ($r) {
                return [
                    'id' => $r->id,
                    'numero' => $r->numero_reservation,
                    'statut' => $r->statut,
                    'nombre_places' => $r->nombre_places,
                    'montant_total' => $r->montant_total,
                    'created_at' => $r->created_at->format('d/m/Y H:i'),
                    'user' => $r->user ? [
                        'id' => $r->user->id,
                        'nom' => $r->user->full_name,
                        'email' => $r->user->email,
                    ] : null,
                    'voyage' => $r->voyage ? [
                        'id' => $r->voyage->id,
                        'titre' => $r->voyage->titre,
                    ] : null,
                ];
            }),
            'meta' => [
                'total' => $reservations->total(),
                'last_page' => $reservations->lastPage(),
            ],
        ]);
    }

    public function confirmReservation(int $id): JsonResponse
    {
        $fournisseur = Auth::user()->fournisseur;
        if (!$fournisseur) {
            return response()->json(['success' => false, 'message' => 'Profil fournisseur non trouvé.'], 404);
        }

        $reservation = Reservation::with('voyage')
            ->where('id', $id)
            ->whereHas('voyage', fn($query) => $query->where('fournisseur_id', $fournisseur->id))
            ->firstOrFail();

        DB::beginTransaction();
        try {
            if (!$reservation->places_committed) {
                $reservation->voyage->decrement('places_disponibles', $reservation->nombre_places);
                $reservation->places_committed = true;
                $reservation->save();
            }

            $reservation->update([
                'statut' => 'confirmee',
                'date_confirmation' => now(),
            ]);

            DB::commit();

            try {
                if ($reservation->user && $reservation->user->email) {
                    $reservation->user->notify(new ReservationConfirmedNotification($reservation));
                }
            } catch (\Throwable $e) {
                Log::error('Fournisseur reservation confirmation notification failed', [
                    'reservation_id' => $reservation->id,
                    'user_id' => $reservation->user_id,
                    'email' => $reservation->user?->email,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json(['success' => true, 'message' => 'Réservation confirmée.', 'data' => $reservation]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    public function rejectReservation(int $id): JsonResponse
    {
        $fournisseur = Auth::user()->fournisseur;
        if (!$fournisseur) {
            return response()->json(['success' => false, 'message' => 'Profil fournisseur non trouvé.'], 404);
        }

        $reservation = Reservation::with('voyage')
            ->where('id', $id)
            ->whereHas('voyage', fn($query) => $query->where('fournisseur_id', $fournisseur->id))
            ->firstOrFail();

        if (!in_array($reservation->statut, ['en_attente', 'confirmee'])) {
            return response()->json(['success' => false, 'message' => 'Cette réservation ne peut pas être rejetée.'], 400);
        }

        DB::beginTransaction();
        try {
            $reservation->update([
                'statut' => 'annulee',
                'date_annulation' => now(),
                'motif_annulation' => 'Refusée par le fournisseur',
            ]);

            $reservation->voyage->increment('places_disponibles', $reservation->nombre_places);
            $reservation->places_committed = false;
            $reservation->save();
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Réservation rejetée.', 'data' => $reservation]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom'        => 'required|string|max:255',
            'email'      => 'required|email|unique:fournisseurs,email',
            'telephone'  => 'nullable|string',
            'service'    => 'required|string',
            'statut'     => 'required|in:actif,en_attente,suspendu',
            'commission' => 'nullable|numeric|min:0',
        ]);

        $fournisseur = Fournisseur::create($validated);
        return response()->json(['success' => true, 'data' => $fournisseur], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $fournisseur = Fournisseur::findOrFail($id);
        $validated = $request->validate([
            'nom'        => 'sometimes|required|string|max:255',
            'email'      => 'sometimes|required|email|unique:fournisseurs,email,' . $fournisseur->id,
            'telephone'  => 'nullable|string',
            'service'    => 'sometimes|required|string',
            'statut'     => 'sometimes|required|in:actif,en_attente,suspendu',
            'commission' => 'nullable|numeric|min:0',
        ]);

        $fournisseur->update($validated);
        return response()->json(['success' => true, 'data' => $fournisseur]);
    }

    public function destroy(int $id): JsonResponse
    {
        Fournisseur::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Fournisseur supprimé.']);
    }
}
