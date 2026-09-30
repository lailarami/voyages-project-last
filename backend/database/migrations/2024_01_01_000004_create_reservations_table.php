<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('numero_reservation')->unique(); // REZ-2024-XXXX
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('voyage_id')->constrained('voyages')->onDelete('cascade');
            $table->integer('nombre_places');
            $table->enum('statut', ['en_attente', 'confirmee', 'annulee', 'terminee', 'remboursee'])->default('en_attente');
            $table->decimal('montant_total', 10, 2);
            $table->decimal('montant_paye', 10, 2)->default(0);
            $table->json('voyageurs')->nullable(); // noms des voyageurs
            $table->text('notes')->nullable();
            $table->string('code_qr')->nullable();
            $table->timestamp('date_confirmation')->nullable();
            $table->timestamp('date_annulation')->nullable();
            $table->string('motif_annulation')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('voyage_id');
            $table->index('statut');
            $table->index('numero_reservation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
