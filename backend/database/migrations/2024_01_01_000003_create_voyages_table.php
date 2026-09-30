<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voyages', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->string('destination');
            $table->string('pays')->nullable();
            $table->text('description');
            $table->longText('description_longue')->nullable();
            $table->decimal('prix', 10, 2);
            $table->decimal('prix_ancien', 10, 2)->nullable();
            $table->date('date_depart');
            $table->date('date_retour');
            $table->integer('places_disponibles');
            $table->integer('places_totales');
            $table->string('categorie'); // aventure, culture, plage, montagne, etc.
            $table->string('image');
            $table->json('images_gallery')->nullable();
            $table->string('video_url')->nullable();
            $table->foreignId('fournisseur_id')->constrained('fournisseurs')->onDelete('cascade');
            $table->json('inclus')->nullable(); // [hotel, vol, repas, etc.]
            $table->json('non_inclus')->nullable();
            $table->json('programme')->nullable(); // programme jour par jour
            $table->string('niveau_difficulte')->nullable(); // facile, moyen, difficile
            $table->string('langue')->default('fr');
            $table->boolean('featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('devise')->default('MAD');
            $table->string('code_promo')->nullable();
            $table->decimal('reduction', 5, 2)->default(0);
            $table->integer('vues')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('destination');
            $table->index('categorie');
            $table->index('date_depart');
            $table->index('prix');
            $table->index('featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voyages');
    }
};
