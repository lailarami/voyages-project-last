<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Avis extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'avis';

    protected $fillable = [
        'user_id', 'voyage_id', 'reservation_id',
        'note', 'titre', 'commentaire', 'approuve', 'featured', 'photos',
    ];

    protected $casts = [
        'approuve' => 'boolean',
        'featured' => 'boolean',
        'photos' => 'array',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function voyage(): BelongsTo { return $this->belongsTo(Voyage::class); }
    public function reservation(): BelongsTo { return $this->belongsTo(Reservation::class); }

    public function scopeApprouve($query) { return $query->where('approuve', true); }
    public function scopeFeatured($query) { return $query->where('featured', true); }
}
