<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')->onDelete('cascade');
            $table->decimal('montant', 10, 2);
            $table->string('devise')->default('MAD');
            $table->enum('methode', ['carte', 'virement', 'especes', 'stripe'])->default('stripe');
            $table->string('transaction_id')->nullable()->unique();
            $table->string('stripe_payment_intent_id')->nullable();
            $table->string('stripe_charge_id')->nullable();
            $table->enum('statut', ['en_attente', 'reussi', 'echoue', 'rembourse', 'annule'])->default('en_attente');
            $table->json('stripe_data')->nullable();
            $table->string('facture_pdf')->nullable();
            $table->timestamp('date_paiement')->nullable();
            $table->timestamps();

            $table->index('reservation_id');
            $table->index('statut');
            $table->index('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
