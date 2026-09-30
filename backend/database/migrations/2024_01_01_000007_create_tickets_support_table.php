<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets_support', function (Blueprint $table) {
            $table->id();
            $table->string('numero_ticket')->unique(); // TKT-2024-XXXX
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->string('sujet');
            $table->text('message');
            $table->enum('statut', ['ouvert', 'en_cours', 'resolu', 'ferme'])->default('ouvert');
            $table->enum('priorite', ['faible', 'normale', 'haute', 'urgente'])->default('normale');
            $table->string('categorie')->nullable(); // paiement, reservation, info, reclamation
            $table->foreignId('reservation_id')->nullable()->constrained('reservations')->onDelete('set null');
            $table->timestamp('date_resolution')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('statut');
            $table->index('priorite');
        });

        Schema::create('ticket_reponses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets_support')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->boolean('is_staff')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_reponses');
        Schema::dropIfExists('tickets_support');
    }
};
