<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voyage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class VoyageController extends Controller
{
    /**
     * Get all voyages with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Voyage::with(['fournisseur', 'avis']);

        // For admin listing, we want all voyages so the admin can manage created content
        if (!$request->is('admin/*')) {
            $query->actif()->disponible();
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                  ->orWhere('destination', 'like', "%{$search}%")
                  ->orWhere('pays', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('categorie'))   $query->byCategorie($request->categorie);
        if ($request->filled('destination')) $query->byDestination($request->destination);
        if ($request->filled('prix_min') && $request->filled('prix_max')) {
            $query->prixEntre($request->prix_min, $request->prix_max);
        }
        if ($request->filled('date_depart')) $query->whereDate('date_depart', '>=', $request->date_depart);
        if ($request->filled('places'))      $query->where('places_disponibles', '>=', $request->places);
        if ($request->filled('niveau'))      $query->where('niveau_difficulte', $request->niveau);

        // Sort
        $sort = $request->get('sort', 'created_at');
        $order = $request->get('order', 'desc');
        $allowedSorts = ['prix', 'date_depart', 'created_at', 'vues', 'titre'];
        if (in_array($sort, $allowedSorts)) $query->orderBy($sort, $order);

        $perPage = min($request->get('per_page', 12), 50);
        $voyages = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $voyages->map(fn($v) => $this->formatVoyage($v)),
            'meta'    => [
                'total'        => $voyages->total(),
                'per_page'     => $voyages->perPage(),
                'current_page' => $voyages->currentPage(),
                'last_page'    => $voyages->lastPage(),
            ],
        ]);
    }

    /**
     * Get featured voyages for homepage
     */
    public function featured(): JsonResponse
    {
        $voyages = Voyage::with(['fournisseur', 'avis'])
            ->actif()->disponible()->featured()
            ->orderBy('vues', 'desc')
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $voyages->map(fn($v) => $this->formatVoyage($v)),
        ]);
    }

    /**
     * Get voyage by ID
     */
    public function show(int $id): JsonResponse
    {
        $voyage = Voyage::with(['fournisseur.user', 'avis.user', 'reservations'])
            ->actif()
            ->findOrFail($id);

        $voyage->incrementVues();

        return response()->json([
            'success' => true,
            'data'    => $this->formatVoyageDetail($voyage),
        ]);
    }

    /**
     * Create voyage (admin/fournisseur)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'titre'            => 'required|string|max:255',
            'destination'      => 'required|string|max:255',
            'pays'             => 'nullable|string|max:100',
            'description'      => 'required|string',
            'description_longue' => 'nullable|string',
            'prix'             => 'required|numeric|min:0',
            'date_depart'      => 'required|date|after:today',
            'date_retour'      => 'required|date|after:date_depart',
            'places_disponibles' => 'required|integer|min:1',
            'places_totales'   => 'required|integer|min:1',
            'categorie'        => 'required|string',
            'image'            => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
            'fournisseur_id'   => 'required|exists:fournisseurs,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $request->except('image', 'images_gallery');

        // Upload image principale
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('voyages', 'public');
        }

        // Upload gallery
        if ($request->hasFile('images_gallery')) {
            $gallery = [];
            foreach ($request->file('images_gallery') as $img) {
                $gallery[] = $img->store('voyages/gallery', 'public');
            }
            $data['images_gallery'] = $gallery;
        }

        $voyage = Voyage::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Voyage créé avec succès !',
            'data'    => $this->formatVoyage($voyage),
        ], 201);
    }

    /**
     * Update voyage
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $voyage = Voyage::findOrFail($id);

        $data = $request->except('image', 'images_gallery');

        if ($request->hasFile('image')) {
            if ($voyage->image) Storage::disk('public')->delete($voyage->image);
            $data['image'] = $request->file('image')->store('voyages', 'public');
        }

        $voyage->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Voyage mis à jour !',
            'data'    => $this->formatVoyage($voyage->fresh()),
        ]);
    }

    /**
     * Delete voyage
     */
    public function destroy(int $id): JsonResponse
    {
        $voyage = Voyage::findOrFail($id);
        $voyage->delete();

        return response()->json(['success' => true, 'message' => 'Voyage supprimé.']);
    }

    /**
     * Get categories
     */
    public function categories(): JsonResponse
    {
        $categories = Voyage::actif()
            ->select('categorie')
            ->distinct()
            ->pluck('categorie');

        return response()->json(['success' => true, 'data' => $categories]);
    }

    /**
     * Get recommended voyages (smart recommendation)
     */
    public function recommended(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Voyage::with(['fournisseur'])->actif()->disponible();
        $hasClientFilters = false;

        // Apply client-provided filters (search, price range, date, places, niveau, destination)
        if ($request->filled('search')) {
            $hasClientFilters = true;
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                  ->orWhere('destination', 'like', "%{$search}%")
                  ->orWhere('pays', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('prix_min') && $request->filled('prix_max')) {
            $hasClientFilters = true;
            $query->whereBetween('prix', [(float)$request->prix_min, (float)$request->prix_max]);
        } elseif ($request->filled('prix_min')) {
            $hasClientFilters = true;
            $query->where('prix', '>=', (float)$request->prix_min);
        } elseif ($request->filled('prix_max')) {
            $hasClientFilters = true;
            $query->where('prix', '<=', (float)$request->prix_max);
        }

        if ($request->filled('date_depart')) {
            $hasClientFilters = true;
            $query->whereDate('date_depart', '>=', $request->date_depart);
        }

        if ($request->filled('places')) {
            $hasClientFilters = true;
            $query->where('places_disponibles', '>=', (int)$request->places);
        }

        if ($request->filled('niveau')) {
            $hasClientFilters = true;
            $query->where('niveau_difficulte', $request->niveau);
        }

        if ($request->filled('destination')) {
            $hasClientFilters = true;
            $query->where(function ($q) use ($request) {
                $q->where('destination', 'like', "%{$request->destination}%")
                  ->orWhere('pays', 'like', "%{$request->destination}%");
            });
        }

        // If no client filters provided, try personalized categories only for authenticated users
        if (!$hasClientFilters) {
            if ($user) {
                $pastCategories = $user->reservations()
                    ->with('voyage')
                    ->get()
                    ->pluck('voyage.categorie')
                    ->unique();

                if ($pastCategories->isNotEmpty()) {
                    $query->whereIn('categorie', $pastCategories);
                } else {
                    return response()->json(['success' => true, 'data' => []]);
                }
            } else {
                return response()->json(['success' => true, 'data' => []]);
            }
        }

        // Order by relevance: prioritize matches then by views
        $voyages = $query->orderBy('vues', 'desc')->limit(8)->get();

        return response()->json([
            'success' => true,
            'data'    => $voyages->map(fn($v) => $this->formatVoyage($v)),
        ]);
    }

    /**
     * Serve voyage image file from storage/app/public/voyages
     */
    public function serveImage(string $file)
    {
        $path = 'voyages/' . $file;
        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }

        $full = storage_path('app/public/' . $path);
        return response()->file($full);
    }

    // Format helpers
    private function formatVoyage(Voyage $v): array
    {
        return [
            'id'                => $v->id,
            'titre'             => $v->titre,
            'destination'       => $v->destination,
            'pays'              => $v->pays,
            'description'       => $v->description,
            'prix'              => $v->prix,
            'prix_final'        => $v->prix_final,
            'prix_ancien'       => $v->prix_ancien,
            'reduction'         => $v->reduction,
            'date_depart'       => $v->date_depart?->format('Y-m-d'),
            'date_retour'       => $v->date_retour?->format('Y-m-d'),
            'duree'             => $v->duree,
            'places_disponibles' => $v->places_disponibles,
            'categorie'         => $v->categorie,
            'image'             => $v->image ? url('/api/images/voyages/' . basename($v->image)) : null,
            'featured'          => $v->featured,
            'is_disponible'     => $v->is_disponible,
            'moyenne_notes'     => $v->moyenne_notes,
            'nombre_avis'       => $v->nombre_avis,
            'vues'              => $v->vues,
            'niveau_difficulte' => $v->niveau_difficulte,
            'devise'            => $v->devise,
            'fournisseur'       => $v->fournisseur ? ['id' => $v->fournisseur->id, 'nom' => $v->fournisseur->nom] : null,
        ];
    }

    private function formatVoyageDetail(Voyage $v): array
    {
        $base = $this->formatVoyage($v);
        return array_merge($base, [
            'description_longue' => $v->description_longue,
            'images_gallery'    => collect($v->images_gallery)->map(fn($img) => url('/api/images/voyages/' . basename($img))),
            'video_url'         => $v->video_url,
            'inclus'            => $v->inclus,
            'non_inclus'        => $v->non_inclus,
            'programme'         => $v->programme,
            'avis'              => $v->avis->map(fn($a) => [
                'id'         => $a->id,
                'note'       => $a->note,
                'titre'      => $a->titre,
                'commentaire' => $a->commentaire,
                'user'       => $a->user ? $a->user->full_name : 'Anonyme',
                'avatar'     => $a->user?->avatar ? asset('storage/' . $a->user->avatar) : null,
                'date'       => $a->created_at->format('d/m/Y'),
            ]),
        ]);
    }
}
