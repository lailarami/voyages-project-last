<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('avis', function (Blueprint $table) {
            $table->dropForeign(['voyage_id']);
            $table->unsignedBigInteger('voyage_id')->nullable()->change();
            $table->foreign('voyage_id')->references('id')->on('voyages')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('avis', function (Blueprint $table) {
            $table->dropForeign(['voyage_id']);
            $table->unsignedBigInteger('voyage_id')->nullable(false)->change();
            $table->foreign('voyage_id')->references('id')->on('voyages')->onDelete('cascade');
        });
    }
};
