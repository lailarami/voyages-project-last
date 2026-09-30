<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/bootstrap/app.php';

use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Notifications\UserRegisteredNotification;

echo "=== Test Email Notifications ===\n\n";

// Test 1: User Registration Email
echo "[1] Testing User Registration Email...\n";
try {
    $user = User::firstOrCreate(
        ['email' => 'test.registration@example.com'],
        [
            'name' => 'Test Client',
            'prenom' => 'Test',
            'email' => 'test.registration@example.com',
            'password' => bcrypt('password123')
        ]
    );
    
    $user->notify(new UserRegisteredNotification($user));
    echo "✅ Registration email dispatched to: " . $user->email . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\nCheck your inbox for test emails!\n";
