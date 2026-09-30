<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PaiementController extends Controller
{
    private string $stripeSecret;

    public function __construct()
    {
        $this->stripeSecret = config('services.stripe.secret', env('STRIPE_SECRET'));
    }

    private function setStripeApiKey(): bool
    {
        if (!str_starts_with($this->stripeSecret, 'sk_')) {
            Log::error('Stripe secret key invalid or missing in backend .env: ' . $this->stripeSecret);
            return false;
        }

        Stripe::setApiKey($this->stripeSecret);
        return true;
    }

    /**
     * Create Stripe PaymentIntent
     */
    public function createPaymentIntent(Request $request): JsonResponse
    {
        if (env('PAYMENT_SIMULATE', false)) {
            // Simulate a PaymentIntent for demo/testing
            $reservation = Reservation::with('voyage')->findOrFail($request->reservation_id);

            if ($reservation->user_id !== Auth::id()) {
                return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
            }

            if ($reservation->statut === 'annulee') {
                return response()->json(['success' => false, 'message' => 'Réservation annulée.'], 400);
            }

            if ($reservation->isPayee()) {
                return response()->json(['success' => false, 'message' => 'Déjà payé.'], 400);
            }

            $simId = 'sim_pi_'.Str::random(16);
            $simClientSecret = 'sim_client_'.Str::random(24);

            Paiement::updateOrCreate(
                ['reservation_id' => $reservation->id],
                [
                    'montant'                   => $reservation->montant_total,
                    'methode'                   => 'stripe',
                    'stripe_payment_intent_id'  => $simId,
                    'statut'                    => 'en_attente',
                ]
            );

            return response()->json([
                'success'       => true,
                'client_secret' => $simClientSecret,
                'amount'        => $reservation->montant_total,
                'currency'      => $reservation->voyage->devise ?? 'MAD',
                'reservation'   => [
                    'id'     => $reservation->id,
                    'numero' => $reservation->numero_reservation,
                    'voyage' => $reservation->voyage->titre,
                ],
                'simulated'     => true,
                'payment_intent_id' => $simId,
            ]);
        }
        $request->validate(['reservation_id' => 'required|exists:reservations,id']);

        $reservation = Reservation::with('voyage')->findOrFail($request->reservation_id);

        // Authorization
        if ($reservation->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        if ($reservation->statut === 'annulee') {
            return response()->json(['success' => false, 'message' => 'Réservation annulée.'], 400);
        }

        if ($reservation->isPayee()) {
            return response()->json(['success' => false, 'message' => 'Déjà payé.'], 400);
        }

        try {
            // Amount in cents (MAD -> centimes)
            $amountCents = intval($reservation->montant_total * 100);

            $paymentIntent = PaymentIntent::create([
                'amount'   => $amountCents,
                'currency' => strtolower($reservation->voyage->devise ?? 'mad'),
                'metadata' => [
                    'reservation_id'     => $reservation->id,
                    'numero_reservation' => $reservation->numero_reservation,
                    'user_id'            => Auth::id(),
                    'voyage'             => $reservation->voyage->titre,
                ],
                'description' => "Réservation {$reservation->numero_reservation} - {$reservation->voyage->titre}",
            ]);

            // Save or update paiement record
            Paiement::updateOrCreate(
                ['reservation_id' => $reservation->id],
                [
                    'montant'                   => $reservation->montant_total,
                    'methode'                   => 'stripe',
                    'stripe_payment_intent_id'  => $paymentIntent->id,
                    'statut'                    => 'en_attente',
                ]
            );

            return response()->json([
                'success'       => true,
                'client_secret' => $paymentIntent->client_secret,
                'amount'        => $reservation->montant_total,
                'currency'      => $reservation->voyage->devise ?? 'MAD',
                'reservation'   => [
                    'id'     => $reservation->id,
                    'numero' => $reservation->numero_reservation,
                    'voyage' => $reservation->voyage->titre,
                ],
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Stripe Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur Stripe: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Confirm payment after Stripe success
     */
    public function confirmPayment(Request $request): JsonResponse
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'reservation_id'    => 'required|exists:reservations,id',
        ]);
        // If simulation mode is enabled, accept simulated payment_intent_id
        if (env('PAYMENT_SIMULATE', false)) {
            $paiement = Paiement::where('stripe_payment_intent_id', $request->payment_intent_id)->first();
            if (!$paiement) {
                return response()->json(['success' => false, 'message' => 'Paiement non trouvé.'], 404);
            }

            $paiement->update([
                'statut'           => 'reussi',
                'transaction_id'   => $request->payment_intent_id,
                'stripe_charge_id' => null,
                'stripe_data'      => ['simulated' => true],
                'date_paiement'    => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Paiement simulé confirmé.']);
        }

        try {
            $paymentIntent = PaymentIntent::retrieve($request->payment_intent_id);

            if ($paymentIntent->status !== 'succeeded') {
                return response()->json(['success' => false, 'message' => 'Paiement non confirmé.'], 400);
            }

            $paiement = Paiement::where('stripe_payment_intent_id', $request->payment_intent_id)->first();
            if (!$paiement) {
                return response()->json(['success' => false, 'message' => 'Paiement non trouvé.'], 404);
            }

            $paiement->update([
                'statut'           => 'reussi',
                'transaction_id'   => $paymentIntent->id,
                'stripe_charge_id' => $paymentIntent->latest_charge,
                'stripe_data'      => $paymentIntent->toArray(),
                'date_paiement'    => now(),
            ]);

            // Confirm reservation
            $reservation = Reservation::findOrFail($request->reservation_id);
            $reservation->update([
                'statut'            => 'confirmee',
                'montant_paye'      => $paiement->montant,
                'date_confirmation' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Paiement confirmé ! Votre réservation est validée.',
                'data'    => [
                    'transaction_id'    => $paiement->transaction_id,
                    'montant'           => $paiement->montant,
                    'numero_reservation' => $reservation->numero_reservation,
                ],
            ]);
        } catch (ApiErrorException $e) {
            return response()->json(['success' => false, 'message' => 'Erreur vérification: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Stripe Webhook handler
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload    = $request->getContent();
        $sigHeader  = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret', env('STRIPE_WEBHOOK_SECRET'));

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }

        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentSuccess($event->data->object);
                break;
            case 'payment_intent.payment_failed':
                $this->handlePaymentFailed($event->data->object);
                break;
        }

        return response()->json(['received' => true]);
    }

    /**
     * Get paiements history (admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Paiement::with(['reservation.user', 'reservation.voyage'])
            ->where('statut', 'reussi');

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->whereHas('reservation.user', fn($q) =>
                $q->where('nom', 'like', $search)
                  ->orWhere('prenom', 'like', $search)
            );
        }

        $paiements = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $paiements->map(fn($p) => [
                'id'             => $p->id,
                'montant'        => $p->montant,
                'methode'        => $p->methode,
                'statut'         => $p->statut,
                'transaction_id' => $p->transaction_id,
                'date_paiement'  => $p->date_paiement?->format('d/m/Y H:i'),
                'reservation'    => [
                    'numero' => $p->reservation?->numero_reservation,
                    'user'   => $p->reservation?->user?->full_name,
                    'voyage' => $p->reservation?->voyage?->titre,
                ],
            ]),
            'meta' => ['total' => $paiements->total()],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $paiement = Paiement::with(['reservation.user', 'reservation.voyage'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'             => $paiement->id,
                'montant'        => $paiement->montant,
                'methode'        => $paiement->methode,
                'transaction_id' => $paiement->transaction_id,
                'date_paiement'  => $paiement->date_paiement?->format('d/m/Y H:i'),
                'reservation'    => [
                    'id'     => $paiement->reservation?->id,
                    'numero' => $paiement->reservation?->numero_reservation,
                    'user'   => $paiement->reservation?->user?->full_name,
                    'voyage' => $paiement->reservation?->voyage?->titre,
                ],
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $paiement = Paiement::findOrFail($id);

        $validated = $request->validate([
            'montant'        => 'required|numeric|min:0',
            'methode'        => 'required|string|max:50',
            'transaction_id' => 'nullable|string|max:255',
            'date_paiement'  => 'nullable|date',
        ]);

        $paiement->update($validated);

        return response()->json(['success' => true, 'message' => 'Paiement mis à jour.', 'data' => $paiement]);
    }

    public function destroy(int $id): JsonResponse
    {
        $paiement = Paiement::findOrFail($id);
        $paiement->delete();

        return response()->json(['success' => true, 'message' => 'Paiement supprimé.']);
    }

    /**
     * Statistics for admin dashboard
     */
    public function stats(): JsonResponse
    {
        $totalRevenu = Paiement::where('statut', 'reussi')->sum('montant');
        $revenuMois  = Paiement::where('statut', 'reussi')
            ->whereMonth('date_paiement', now()->month)
            ->sum('montant');

        $parMois = Paiement::where('statut', 'reussi')
            ->selectRaw('MONTH(date_paiement) as mois, SUM(montant) as total')
            ->whereYear('date_paiement', now()->year)
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_revenu' => $totalRevenu,
                'revenu_mois'  => $revenuMois,
                'par_mois'     => $parMois,
            ],
        ]);
    }

    private function handlePaymentSuccess($paymentIntent): void
    {
        $paiement = Paiement::where('stripe_payment_intent_id', $paymentIntent->id)->first();
        if ($paiement && $paiement->statut !== 'reussi') {
            $paiement->update(['statut' => 'reussi', 'date_paiement' => now()]);
            $paiement->reservation?->update(['statut' => 'confirmee', 'montant_paye' => $paiement->montant]);
        }
    }

    private function handlePaymentFailed($paymentIntent): void
    {
        $paiement = Paiement::where('stripe_payment_intent_id', $paymentIntent->id)->first();
        if ($paiement) {
            $paiement->update(['statut' => 'echoue']);
        }
    }

    /**
     * Download or generate an invoice PDF for a reservation
     */
    public function downloadInvoiceByReservation(int $reservationId)
    {
        $reservation = Reservation::with(['voyage', 'user'])->findOrFail($reservationId);

        // Authorization: owner or admin via middleware roles
        if (Auth::id() !== $reservation->user_id && !Auth::user()?->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Accès refusé.'], 403);
        }

        $paiement = Paiement::where('reservation_id', $reservation->id)->first();

        // If a stored facture path exists, try to download it
        if ($paiement && $paiement->facture_pdf) {
            $path = $paiement->facture_pdf;
            if (Storage::disk('public')->exists($path)) {
                return Storage::disk('public')->download($path);
            }
        }

        // Otherwise generate a simple invoice PDF on the fly
        $data = [
            'reservation' => $reservation,
            'paiement'    => $paiement,
        ];

        $html = '<h1>Facture</h1>';
        $html .= '<p>Réservation: ' . ($reservation->numero_reservation ?? $reservation->id) . '</p>';
        $html .= '<p>Client: ' . ($reservation->user?->full_name ?? '') . '</p>';
        $html .= '<p>Voyage: ' . ($reservation->voyage?->titre ?? '') . '</p>';
        $html .= '<p>Montant: ' . ($paiement?->montant ?? $reservation->montant_total ?? '') . '</p>';
        $html .= '<p>Date: ' . ($paiement?->date_paiement?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i')) . '</p>';

        $filename = 'facture_' . ($reservation->numero_reservation ?? $reservation->id) . '.pdf';

        $pdf = Pdf::loadHTML($html);

        return $pdf->download($filename);
    }
}
