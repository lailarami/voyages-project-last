<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Reservation;
use App\Notifications\ReservationConfirmedNotification;

try {
    // Find a user with an email
    $user = User::where('email', 'ramilaila129@gmail.com')->first() ?? User::first();
    
    if (!$user) {
        echo "No users found in database\n";
        exit(1);
    }
    
    echo "Testing with user: " . $user->email . "\n";
    
    // Find or create a reservation for testing
    $reservation = Reservation::where('user_id', $user->id)->first();
    
    if (!$reservation) {
        echo "No reservations found for this user\n";
        exit(1);
    }
    
    echo "Sending notification for reservation: " . $reservation->numero_reservation . "\n";
    
    $user->notify(new ReservationConfirmedNotification($reservation));
    
    echo "Notification sent successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getFile() . ':' . $e->getLine() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString();
}
