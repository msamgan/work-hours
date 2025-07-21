<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('project_team', function (Blueprint $table) {
            $table->decimal('hourly_rate', 8, 2)->default(0)->after('is_approver');
            $table->string('currency', 3)->default('USD')->after('hourly_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_team', function (Blueprint $table) {
            $table->dropColumn(['hourly_rate', 'currency']);
        });
    }
};
