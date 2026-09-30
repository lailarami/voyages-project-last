<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('voyage_id')->constrained('voyages')->onDelete('cascade');
            $table->foreignId('reservation_id')->nullable()->constrained('reservations')->onDelete('set null');
            $table->integer('note')->between(1, 5);
            $table->string('titre')->nullable();
            $table->text('commentaire');
            $table->boolean('approuve')->default(false);
            $table->boolean('featured')->default(false);
            $table->json('photos')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'voyage_id']);
            $table->index('voyage_id');
            $table->index('note');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('avis');
    }
};
