<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets_support', function (Blueprint $table) {
            $table->boolean('has_unread_responses')->default(false)->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('tickets_support', function (Blueprint $table) {
            $table->dropColumn('has_unread_responses');
        });
    }
};
