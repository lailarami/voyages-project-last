<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Modify the enum to include 'refusee'
            $table->enum('statut', ['en_attente', 'confirmee', 'annulee', 'terminee', 'remboursee', 'refusee'])
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->enum('statut', ['en_attente', 'confirmee', 'annulee', 'terminee', 'remboursee'])
                ->change();
        });
    }
};
