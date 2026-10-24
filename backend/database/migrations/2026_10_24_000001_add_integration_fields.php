<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', fn (Blueprint $table) => $table->string('access_token_hash', 64)->nullable());
        Schema::table('services', function (Blueprint $table) {
            $table->string('type')->nullable();
            $table->decimal('avg_service_time', 8, 2)->nullable();
        });
        Schema::table('employees', function (Blueprint $table) {
            $table->string('email')->nullable()->unique();
            $table->string('password')->nullable();
            $table->boolean('is_available')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('tickets', fn (Blueprint $table) => $table->dropColumn('access_token_hash'));
        Schema::table('employees', fn (Blueprint $table) => $table->dropColumn(['email', 'password', 'is_available']));
        Schema::table('services', fn (Blueprint $table) => $table->dropColumn(['type', 'avg_service_time']));
    }
};
