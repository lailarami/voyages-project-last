<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\{
    AuthController,
    VoyageController,
    ReservationController,
    PaiementController,
    AvisController,
    TicketController,
    AdminController,
    WishlistController,
    FournisseurController,
};

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('refresh', [AuthController::class, 'refresh']);
});

// Public voyages
Route::prefix('voyages')->group(function () {
    Route::get('/', [VoyageController::class, 'index']);
    Route::get('/featured', [VoyageController::class, 'featured']);
    Route::get('/categories', [VoyageController::class, 'categories']);
    Route::get('/recommended', [VoyageController::class, 'recommended']);
    Route::get('/{id}', [VoyageController::class, 'show']);
    Route::get('/{id}/avis', [AvisController::class, 'index']);
});

// Serve voyage images (fallback route when public/storage isn't available)
Route::get('images/voyages/{file}', [VoyageController::class, 'serveImage']);

// Stripe webhook 
Route::post('stripe/webhook', [PaiementController::class, 'webhook']);

// Test mail endpoint
Route::post('/test/send-mail', function (Illuminate\Http\Request $request) {
    try {
        $email = $request->input('email', 'test@example.com');
        Mail::raw('Test email from voyages app', function ($message) use ($email) {
            $message->to($email)->subject('Test Email');
        });
        return response()->json(['success' => true, 'message' => 'Mail sent to ' . $email]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// AUTHENTICATED ROUTES
Route::middleware(['jwt.verify'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::put('password', [AuthController::class, 'changePassword']);
    });

    // Recommended voyages (personalized) - now exposed publicly via /api/voyages/recommended

    // ============================================================
    // CLIENT ROUTES
    // ============================================================
    Route::middleware(['role:client,admin'])->group(function () {
        // Reservations
        Route::prefix('reservations')->group(function () {
            Route::get('/my', [ReservationController::class, 'myReservations']);
            Route::post('/', [ReservationController::class, 'store']);
            Route::get('/{id}', [ReservationController::class, 'show']);
            Route::post('/{id}/cancel', [ReservationController::class, 'cancel']);
        });

        // Paiements
        Route::prefix('paiements')->group(function () {
            Route::post('/create-intent', [PaiementController::class, 'createPaymentIntent']);
            Route::post('/confirm', [PaiementController::class, 'confirmPayment']);
            Route::get('/reservation/{id}/invoice', [PaiementController::class, 'downloadInvoiceByReservation']);
        });

        // Avis
        Route::post('avis', [AvisController::class, 'store']);

        // Wishlist
        Route::prefix('wishlist')->group(function () {
            Route::get('/', [WishlistController::class, 'index']);
            Route::post('/{voyage_id}', [WishlistController::class, 'toggle']);
        });

        // Tickets Support
        Route::prefix('tickets')->group(function () {
            Route::get('/my', [TicketController::class, 'myTickets']);
            Route::get('/', [TicketController::class, 'index']);
            Route::post('/', [TicketController::class, 'store']);
            Route::get('/{id}', [TicketController::class, 'show']);
            Route::post('/{id}/reply', [TicketController::class, 'reply']);
        });
    });

    // ============================================================
    // SUPPORT ROUTES
    // ============================================================
    Route::middleware(['role:support'])->group(function () {
        Route::prefix('support')->group(function () {
            Route::get('/dashboard', [TicketController::class, 'dashboardSupport']);
            Route::get('/tickets', [TicketController::class, 'index']);
            Route::get('/tickets/{id}', [TicketController::class, 'show']);
            Route::post('/tickets/{id}/reply', [TicketController::class, 'reply']);
            Route::post('/tickets/{id}/close', [TicketController::class, 'close']);
            Route::post('/tickets/{id}/assign', [TicketController::class, 'assign']);
        });
    });

    // ============================================================
    // FOURNISSEUR ROUTES
    // ============================================================
    Route::middleware(['role:fournisseur,admin'])->group(function () {
        Route::prefix('fournisseur')->group(function () {
            Route::get('/dashboard', [FournisseurController::class, 'dashboard']);
            Route::get('/voyages', [FournisseurController::class, 'myVoyages']);
            Route::get('/reservations', [FournisseurController::class, 'myReservations']);
            Route::post('/reservations/{id}/confirm', [FournisseurController::class, 'confirmReservation']);
            Route::post('/reservations/{id}/reject', [FournisseurController::class, 'rejectReservation']);
            Route::post('/voyages', [VoyageController::class, 'store']);
            Route::put('/voyages/{id}', [VoyageController::class, 'update']);
            Route::delete('/voyages/{id}', [VoyageController::class, 'destroy']);
        });
    });

    
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/analytics', [AdminController::class, 'analytics']);

        // Users management
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::post('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

        // Voyages management
        Route::get('/voyages', [VoyageController::class, 'index']);
        Route::post('/voyages', [VoyageController::class, 'store']);
        Route::put('/voyages/{id}', [VoyageController::class, 'update']);
        Route::delete('/voyages/{id}', [VoyageController::class, 'destroy']);
        Route::post('/voyages/{id}/toggle-featured', [AdminController::class, 'toggleFeatured']);

        // Reservations management
        Route::get('/reservations', [ReservationController::class, 'index']);
        Route::post('/reservations', [ReservationController::class, 'storeAdmin']);
        Route::get('/reservations/{id}', [ReservationController::class, 'show']);
        Route::put('/reservations/{id}', [ReservationController::class, 'updateAdmin']);
        Route::delete('/reservations/{id}', [ReservationController::class, 'destroy']);
        Route::post('/reservations/{id}/confirm', [ReservationController::class, 'confirm']);
        Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);

        // Paiements
        Route::get('/paiements', [PaiementController::class, 'index']);
        Route::get('/paiements/stats', [PaiementController::class, 'stats']);
        Route::get('/paiements/{id}', [PaiementController::class, 'show']);
        Route::put('/paiements/{id}', [PaiementController::class, 'update']);
        Route::delete('/paiements/{id}', [PaiementController::class, 'destroy']);

        // Avis moderation
        Route::get('/avis', [AvisController::class, 'adminIndex']);
        Route::get('/avis/{id}', [AvisController::class, 'show']);
        Route::put('/avis/{id}', [AvisController::class, 'update']);
        Route::post('/avis/{id}/approve', [AdminController::class, 'approveAvis']);
        Route::delete('/avis/{id}', [AvisController::class, 'destroy']);

        // Fournisseurs
        Route::get('/fournisseurs', [FournisseurController::class, 'index']);
        Route::post('/fournisseurs', [FournisseurController::class, 'store']);
        Route::put('/fournisseurs/{id}', [FournisseurController::class, 'update']);
        Route::delete('/fournisseurs/{id}', [FournisseurController::class, 'destroy']);

        // Tickets management
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::post('/tickets/{id}/close', [TicketController::class, 'close']);
        Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);

        // Reports
        Route::get('/reports/export', [AdminController::class, 'exportReport']);
    });
});
