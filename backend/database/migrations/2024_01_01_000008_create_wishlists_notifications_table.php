<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Wishlist
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('voyage_id')->constrained('voyages')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['user_id', 'voyage_id']);
        });

        // Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // Messages chat
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('ticket_id')->nullable()->constrained('tickets_support')->onDelete('set null');
            $table->text('contenu');
            $table->boolean('lu')->default(false);
            $table->timestamps();
        });

        // Coupons promo
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['pourcentage', 'montant_fixe'])->default('pourcentage');
            $table->decimal('valeur', 10, 2);
            $table->decimal('montant_minimum', 10, 2)->default(0);
            $table->integer('utilisations_max')->nullable();
            $table->integer('utilisations_actuelles')->default(0);
            $table->date('date_expiration')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('wishlists');
    }
};
