<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookmarks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 500);
            $table->text('description')->nullable();
            $table->text('article_url');
            $table->text('image_url')->nullable();
            $table->string('source', 200);
            $table->string('author', 200)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->string('category', 32);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->unique(['user_id', 'article_url']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookmarks');
    }
};
