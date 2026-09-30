<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('nom');
            $table->string('email')->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('service');
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('site_web')->nullable();
            $table->enum('statut', ['actif', 'inactif', 'en_attente'])->default('en_attente');
            $table->decimal('commission', 5, 2)->default(10.00);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};
