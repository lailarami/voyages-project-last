<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Voyage;
use App\Notifications\ReservationConfirmedNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReservationController extends Controller
{
    /**
     * My reservations (client)
     */
    public function myReservations(Request $request): JsonResponse
    {
        $query = Reservation::with(['voyage', 'paiement'])
            ->where('user_id', Auth::id());

        if ($request->filled('voyage_id')) {
            $query->where('voyage_id', $request->voyage_id);
        }

        if ($request->filled('statut')) {
            $query->byStatut($request->statut);
        }

        $reservations = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'success' => true,
            'data'    => $reservations->map(fn($r) => $this->formatReservation($r)),
            'meta'    => ['total' => $reservations->total(), 'last_page' => $reservations->lastPage()],
        ]);
    }

    /**
     * Get all reservations (admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Reservation::with(['user', 'voyage', 'paiement']);

        if ($request->filled('statut'))   $query->byStatut($request->statut);
        if ($request->filled('user_id')) $query->where('user_id', $request->user_id);
        if ($request->filled('voyage_id')) $query->where('voyage_id', $request->voyage_id);
        if ($request->has('search')) {
            $query->where('numero_reservation', 'like', "%{$request->search}%");
        }

        $reservations = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $reservations->map(fn($r) => $this->formatReservation($r, true)),
            'meta'    => ['total' => $reservations->total(), 'last_page' => $reservations->lastPage()],
        ]);
    }

    /**
     * Create reservation
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'voyage_id'     => 'required|exists:voyages,id',
            'nombre_places' => 'required|integer|min:1|max:20',
            'voyageurs'     => 'nullable|array',
            'notes'         => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $voyage = Voyage::findOrFail($request->voyage_id);

        $existingReservation = Reservation::where('user_id', Auth::id())
            ->where('voyage_id', $request->voyage_id)
            ->whereNotIn('statut', ['annulee', 'terminee', 'remboursee'])
            ->exists();

        if ($existingReservation) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà une réservation active pour ce voyage.',
            ], 400);
        }

        if (!$voyage->is_disponible) {
            return response()->json(['success' => false, 'message' => 'Ce voyage n\'est plus disponible.'], 400);
        }

        if ($voyage->places_disponibles < $request->nombre_places) {
            return response()->json([
                'success' => false,
                'message' => "Seulement {$voyage->places_disponibles} places disponibles.",
            ], 400);
        }

        // Check existing pending reservation
        $existing = Reservation::where('user_id', Auth::id())
            ->where('voyage_id', $request->voyage_id)
            ->whereIn('statut', ['en_attente', 'confirmee'])
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Vous avez déjà une réservation pour ce voyage.'], 400);
        }

        DB::beginTransaction();
        try {
            $montant = $voyage->prix_final * $request->nombre_places;

            $reservation = Reservation::create([
                'user_id'       => Auth::id(),
                'voyage_id'     => $request->voyage_id,
                'nombre_places' => $request->nombre_places,
                'statut'        => 'en_attente',
                'montant_total' => $montant,
                'voyageurs'     => $request->voyageurs,
                'notes'         => $request->notes,
            ]);

            // Decrease places
            $voyage->decrement('places_disponibles', $request->nombre_places);
            // mark places as committed for this reservation
            $reservation->places_committed = true;
            $reservation->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Réservation créée ! Procédez au paiement.',
                'data'    => $this->formatReservation($reservation->load(['voyage', 'paiement'])),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Get reservation by ID
     */
    public function show(int $id): JsonResponse
    {
        $reservation = Reservation::with(['user', 'voyage.fournisseur', 'paiement'])
            ->findOrFail($id);

        // Authorization
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->isSupport() && $reservation->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->formatReservation($reservation, true),
        ]);
    }

    /**
     * Cancel reservation
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $reservation = Reservation::findOrFail($id);
        $user = Auth::user();

        // Only the reservation owner (client) can cancel their reservation.
        // Admins should not be allowed to cancel on behalf of users.
        if ($reservation->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        if ($reservation->statut !== 'en_attente') {
            return response()->json(['success' => false, 'message' => 'Cette réservation ne peut pas être annulée.'], 400);
        }

        if ($reservation->isPayee()) {
            return response()->json(['success' => false, 'message' => 'Cette réservation ne peut pas être annulée car elle a déjà été payée.'], 400);
        }

        DB::beginTransaction();
        try {
            $reservation->update([
                'statut'           => 'annulee',
                'date_annulation'  => now(),
                'motif_annulation' => $request->motif ?? 'Annulée par le client',
            ]);

            // Restore places
            $reservation->voyage->increment('places_disponibles', $reservation->nombre_places);
            $reservation->places_committed = false;
            $reservation->save();

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Réservation annulée.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Confirm reservation (admin/supplier)
     */
    public function confirm(int $id): JsonResponse
    {
        $reservation = Reservation::findOrFail($id);
        $user = Auth::user();

        // Only suppliers or support staff can confirm reservations.
        // Admins should not confirm reservations directly.
        if (!$user->isFournisseur() && !$user->isSupport()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        DB::beginTransaction();
        try {
            // If places were not yet committed (decremented), do it now
            if (!$reservation->places_committed) {
                $reservation->voyage->decrement('places_disponibles', $reservation->nombre_places);
                $reservation->places_committed = true;
                $reservation->save();
            }

            $reservation->update([
                'statut'           => 'confirmee',
                'date_confirmation' => now(),
            ]);

            DB::commit();

            try {
                if ($reservation->user && $reservation->user->email) {
                    $reservation->user->notify(new ReservationConfirmedNotification($reservation));
                }
            } catch (\Throwable $e) {
                Log::error('Reservation confirmation notification failed', [
                    'reservation_id' => $reservation->id,
                    'user_id' => $reservation->user_id,
                    'email' => $reservation->user?->email,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json(['success' => true, 'message' => 'Réservation confirmée !', 'data' => $this->formatReservation($reservation)]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Create reservation as admin
     */
    public function storeAdmin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id'            => 'required|exists:users,id',
            'voyage_id'          => 'required|exists:voyages,id',
            'nombre_places'      => 'required|integer|min:1|max:20',
            'statut'             => 'required|in:en_attente,confirmee,annulee,terminee,remboursee',
            'voyageurs'          => 'nullable|array',
            'notes'              => 'nullable|string',
            'motif_annulation'   => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $voyage = Voyage::findOrFail($request->voyage_id);
        $statut = $request->statut;

        if ($statut !== 'annulee' && $voyage->places_disponibles < $request->nombre_places) {
            return response()->json([
                'success' => false,
                'message' => "Seulement {$voyage->places_disponibles} places disponibles.",
            ], 400);
        }

        DB::beginTransaction();
        try {
            if ($statut !== 'annulee') {
                $voyage->decrement('places_disponibles', $request->nombre_places);
                $placesCommitted = true;
            }

            $reservation = Reservation::create([
                'user_id'          => $request->user_id,
                'voyage_id'        => $request->voyage_id,
                'nombre_places'    => $request->nombre_places,
                'statut'           => $statut,
                'montant_total'    => $voyage->prix_final * $request->nombre_places,
                'voyageurs'        => $request->voyageurs,
                'notes'            => $request->notes,
                'motif_annulation' => $request->motif_annulation,
                'date_confirmation' => $statut === 'confirmee' ? now() : null,
                'date_annulation'   => $statut === 'annulee' ? now() : null,
                'places_committed'  => $placesCommitted ?? false,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Réservation créée avec succès.',
                'data'    => $this->formatReservation($reservation->load(['user', 'voyage', 'paiement']), true),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Update reservation as admin
     */
    public function updateAdmin(Request $request, int $id): JsonResponse
    {
        $reservation = Reservation::findOrFail($id);
        $voyage = $reservation->voyage;

        $validator = Validator::make($request->all(), [
            'user_id'            => 'sometimes|required|exists:users,id',
            'nombre_places'      => 'sometimes|required|integer|min:1|max:20',
            'statut'             => 'sometimes|required|in:en_attente,confirmee,annulee,terminee,remboursee',
            'voyageurs'          => 'nullable|array',
            'notes'              => 'nullable|string',
            'motif_annulation'   => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $currentStatus = $reservation->statut;
        $newStatus = $request->filled('statut') ? $request->statut : $currentStatus;
        $newPlaces = $request->filled('nombre_places') ? $request->nombre_places : $reservation->nombre_places;

        DB::beginTransaction();
        try {
            $placesCommitted = $reservation->places_committed;
            if ($currentStatus === 'annulee' && $newStatus !== 'annulee') {
                if ($voyage->places_disponibles < $newPlaces) {
                    return response()->json([
                        'success' => false,
                        'message' => "Seulement {$voyage->places_disponibles} places disponibles.",
                    ], 400);
                }
                $voyage->decrement('places_disponibles', $newPlaces);
                $placesCommitted = true;
            }

            if ($currentStatus !== 'annulee' && $newStatus === 'annulee') {
                $voyage->increment('places_disponibles', $reservation->nombre_places);
                $placesCommitted = false;
            }

            if ($currentStatus !== 'annulee' && $newStatus !== 'annulee' && $newPlaces !== $reservation->nombre_places) {
                $diff = $newPlaces - $reservation->nombre_places;
                if ($diff > 0) {
                    if ($voyage->places_disponibles < $diff) {
                        return response()->json([
                            'success' => false,
                            'message' => "Seulement {$voyage->places_disponibles} places supplémentaires disponibles.",
                        ], 400);
                    }
                    $voyage->decrement('places_disponibles', $diff);
                    $placesCommitted = true;
                } elseif ($diff < 0) {
                    $voyage->increment('places_disponibles', abs($diff));
                    // if we've reduced the reserved number, keep flag as true if remaining reserved seats exist
                    $placesCommitted = ($newPlaces > 0) ? true : false;
                }
            }

            $data = $request->only(['user_id', 'notes', 'voyageurs', 'motif_annulation']);
            $data['nombre_places'] = $newPlaces;
            $data['montant_total'] = $voyage->prix_final * $newPlaces;
            $data['statut'] = $newStatus;

            // propagate places_committed flag
            $data['places_committed'] = $placesCommitted;

            if ($newStatus === 'confirmee' && $currentStatus !== 'confirmee') {
                $data['date_confirmation'] = now();
            }
            if ($newStatus === 'annulee' && $currentStatus !== 'annulee') {
                $data['date_annulation'] = now();
            }
            if ($newStatus !== 'annulee') {
                $data['motif_annulation'] = null;
                $data['date_annulation'] = null;
            }

            $reservation->update($data);
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Réservation mise à jour.', 'data' => $this->formatReservation($reservation->fresh()->load(['user', 'voyage', 'paiement']), true)]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    /**
     * Delete reservation as admin
     */
    public function destroy(int $id): JsonResponse
    {
        $reservation = Reservation::findOrFail($id);

        if (!in_array($reservation->statut, ['annulee', 'terminee', 'remboursee'])) {
            $reservation->voyage->increment('places_disponibles', $reservation->nombre_places);
        }

        $reservation->delete();
        return response()->json(['success' => true, 'message' => 'Réservation supprimée.']);
    }

    private function formatReservation(Reservation $r, bool $detail = false): array
    {
        $data = [
            'id'                => $r->id,
            'numero'            => $r->numero_reservation,
            'statut'            => $r->statut,
            'nombre_places'     => $r->nombre_places,
            'montant_total'     => $r->montant_total,
            'montant_paye'      => $r->montant_paye,
            'reste_a_payer'     => $r->resteAPayer(),
            'is_payee'          => $r->isPayee(),
            'date_confirmation' => $r->date_confirmation?->format('d/m/Y H:i'),
            'date_annulation'   => $r->date_annulation?->format('d/m/Y H:i'),
            'created_at'        => $r->created_at->format('d/m/Y H:i'),
            'voyage'            => $r->voyage ? [
                'id'          => $r->voyage->id,
                'titre'       => $r->voyage->titre,
                'destination' => $r->voyage->destination,
                'date_depart' => $r->voyage->date_depart?->format('d/m/Y'),
                'image'       => $r->voyage->image ? url('/api/images/voyages/' . basename($r->voyage->image)) : null,
            ] : null,
            'paiement' => $r->paiement ? [
                'statut'  => $r->paiement->statut,
                'methode' => $r->paiement->methode,
                'montant' => $r->paiement->montant,
            ] : null,
        ];

        if ($detail) {
            $data['user']     = $r->user ? ['id' => $r->user->id, 'nom' => $r->user->full_name, 'email' => $r->user->email] : null;
            $data['voyageurs'] = $r->voyageurs;
            $data['notes']    = $r->notes;
            $data['code_qr']  = $r->code_qr;
        }

        return $data;
    }
}
