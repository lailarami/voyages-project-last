<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Avis;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AvisController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Avis::with(['user', 'voyage'])->approuve();
        if ($request->has('voyage_id')) $query->where('voyage_id', $request->voyage_id);
        $avis = $query->orderBy('created_at', 'desc')->paginate(10);
        return response()->json([
            'success' => true,
            'data'    => $avis->map(fn($a) => $this->formatAvis($a)),
            'meta'    => ['total' => $avis->total()],
        ]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $query = Avis::with(['user', 'voyage']);

        if ($request->filled('approuve') && $request->approuve !== 'all') {
            $approuve = filter_var($request->approuve, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (!is_null($approuve)) {
                $query->where('approuve', $approuve);
            }
        }

        if ($request->has('voyage_id')) {
            $query->where('voyage_id', $request->voyage_id);
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', $search)
                  ->orWhere('commentaire', 'like', $search)
                  ->orWhereHas('user', fn($q) => $q->where('nom', 'like', $search)->orWhere('prenom', 'like', $search))
                  ->orWhereHas('voyage', fn($q) => $q->where('titre', 'like', $search));
            });
        }

        $avis = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $avis->map(fn($a) => $this->formatAvis($a)),
            'meta'    => ['total' => $avis->total()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'voyage_id'   => 'nullable|exists:voyages,id',
            'note'        => 'required|integer|between:1,5',
            'titre'       => 'nullable|string|max:255',
            'commentaire' => 'required|string|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($request->filled('voyage_id')) {
            $existing = Avis::where('user_id', Auth::id())->where('voyage_id', $request->voyage_id)->first();
            if ($existing) {
                return response()->json(['success' => false, 'message' => 'Vous avez déjà donné un avis pour ce voyage.'], 400);
            }
        }

        $avis = Avis::create([
            'user_id'     => Auth::id(),
            'voyage_id'   => $request->voyage_id,
            'note'        => $request->note,
            'titre'       => $request->titre,
            'commentaire' => $request->commentaire,
            'approuve'    => false,
        ]);

        return response()->json(['success' => true, 'message' => 'Avis soumis. En attente de modération.', 'data' => $this->formatAvis($avis)], 201);
    }

    public function show(int $id): JsonResponse
    {
        $avis = Avis::with(['user', 'voyage'])->findOrFail($id);
        return response()->json([ 'success' => true, 'data' => $this->formatAvis($avis) ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $avis = Avis::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'note'        => 'required|integer|between:1,5',
            'titre'       => 'nullable|string|max:255',
            'commentaire' => 'required|string|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $avis->update($validator->validated());

        return response()->json(['success' => true, 'message' => 'Avis mis à jour.', 'data' => $this->formatAvis($avis)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $avis = Avis::findOrFail($id);
        $avis->delete();
        return response()->json(['success' => true, 'message' => 'Avis supprimé.']);
    }

    private function formatAvis(Avis $a): array
    {
        return [
            'id'          => $a->id,
            'note'        => $a->note,
            'titre'       => $a->titre,
            'commentaire' => $a->commentaire,
            'approuve'    => $a->approuve,
            'user'        => $a->user ? ['id' => $a->user->id, 'nom' => $a->user->full_name, 'avatar' => $a->user->avatar ? asset('storage/'.$a->user->avatar) : null] : null,
            'voyage'      => $a->voyage ? ['id' => $a->voyage->id, 'titre' => $a->voyage->titre] : null,
            'date'        => $a->created_at->format('d/m/Y'),
        ];
    }
}
