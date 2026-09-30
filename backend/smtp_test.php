<?php
require_once __DIR__ . '/vendor/autoload.php';

$host = 'smtp.gmail.com';
$port = 465;
$username = 'ramilaila129@gmail.com';
$password = 'lndotptlykxprneu';

echo "=== SMTP Connection Test ===\n";
echo "Host: $host\n";
echo "Port: $port\n";
echo "Username: $username\n";
echo "---\n\n";

try {
    // Test 1: Socket connection
    echo "[1] Testing socket connection...\n";
    $socket = @stream_socket_client("ssl://$host:$port", $errno, $errstr, 10);
    
    if (!$socket) {
        echo "❌ Socket connection failed: $errstr ($errno)\n";
        exit(1);
    }
    echo "✅ Socket connection established\n\n";
    
    // Test 2: SMTP handshake
    echo "[2] Reading SMTP response...\n";
    $response = fgets($socket, 1024);
    echo "Response: " . trim($response) . "\n";
    
    if (strpos($response, '220') === false) {
        echo "❌ Invalid SMTP response\n";
        fclose($socket);
        exit(1);
    }
    echo "✅ SMTP server ready\n\n";
    
    // Test 3: EHLO
    echo "[3] Sending EHLO...\n";
    fputs($socket, "EHLO localhost\r\n");
    $response = '';
    while (($line = fgets($socket, 1024)) !== false) {
        $response .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    echo "Response:\n$response";
    echo "✅ EHLO successful\n\n";
    
    // Test 4: AUTH LOGIN
    echo "[4] Attempting authentication...\n";
    fputs($socket, "AUTH LOGIN\r\n");
    $response = trim(fgets($socket, 1024));
    echo "Response: $response\n";
    
    if (strpos($response, '334') === false) {
        echo "❌ AUTH LOGIN not supported\n";
        fclose($socket);
        exit(1);
    }
    
    // Send username (base64)
    $usernameB64 = base64_encode($username);
    fputs($socket, "$usernameB64\r\n");
    $response = trim(fgets($socket, 1024));
    echo "Username sent: $response\n";
    
    if (strpos($response, '334') === false) {
        echo "❌ Username not accepted\n";
        fclose($socket);
        exit(1);
    }
    
    // Send password (base64)
    $passwordB64 = base64_encode($password);
    fputs($socket, "$passwordB64\r\n");
    $response = trim(fgets($socket, 1024));
    echo "Password sent: $response\n";
    
    if (strpos($response, '235') === false) {
        echo "❌ Authentication failed: $response\n";
        echo "\n⚠️  CREDENTIALS ARE INVALID OR NOT ACCEPTED\n";
        echo "Possible causes:\n";
        echo "  1. Password is incorrect\n";
        echo "  2. App password not generated (need 2FA on Gmail account)\n";
        echo "  3. Gmail account has security restrictions\n";
        fclose($socket);
        exit(1);
    }
    
    echo "✅ Authentication successful!\n\n";
    
    // Test 5: Send QUIT
    fputs($socket, "QUIT\r\n");
    fgets($socket, 1024);
    fclose($socket);
    
    echo "=== ALL TESTS PASSED ===\n";
    echo "SMTP is properly configured and credentials are valid.\n";
    
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    exit(1);
}
?>
