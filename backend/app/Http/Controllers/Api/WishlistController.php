<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    public function index(): JsonResponse
    {
        $wishlist = Wishlist::with('voyage')
            ->where('user_id', Auth::id())
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $wishlist->map(fn($w) => [
                'id'     => $w->id,
                'voyage' => $w->voyage ? [
                    'id'                 => $w->voyage->id,
                    'titre'              => $w->voyage->titre,
                    'destination'        => $w->voyage->destination,
                    'prix_final'         => $w->voyage->prix_final,
                    'prix_ancien'        => $w->voyage->prix_ancien,
                    'devise'             => $w->voyage->devise,
                    'image'              => $w->voyage->image ? url('/api/images/voyages/' . basename($w->voyage->image)) : null,
                    'images_gallery'     => $w->voyage->images_gallery ? json_decode($w->voyage->images_gallery, true) : [],
                    'date_depart'        => $w->voyage->date_depart?->format('Y-m-d'),
                    'duree'              => $w->voyage->duree,
                    'categorie'          => $w->voyage->categorie,
                    'is_disponible'      => $w->voyage->is_disponible,
                    'moyenne_notes'      => $w->voyage->moyenne_notes,
                    'nombre_avis'        => $w->voyage->nombre_avis,
                    'places_disponibles' => $w->voyage->places_disponibles,
                    'featured'           => $w->voyage->featured,
                    'reduction'          => $w->voyage->reduction,
                    'pays'               => $w->voyage->pays,
                ] : null,
            ]),
        ]);
    }

    public function toggle(int $voyageId): JsonResponse
    {
        $existing = Wishlist::where('user_id', Auth::id())
            ->where('voyage_id', $voyageId)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['success' => true, 'action' => 'removed', 'removed_id' => $voyageId, 'message' => 'Retiré des favoris.']);
        }

        $w = Wishlist::create(['user_id' => Auth::id(), 'voyage_id' => $voyageId]);
        return response()->json(['success' => true, 'action' => 'added', 'added_id' => $voyageId, 'data' => $w, 'message' => 'Ajouté aux favoris.']);
    }
}
